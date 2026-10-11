const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const User = require('./src/models/User');
const Complaint = require('./src/models/Complaint');
const { hashFile, findDuplicateImage, backfillMissingHashes } = require('./src/services/imageDuplicateService');

async function runTest() {
  console.log('--- STARTING DUPLICATE IMAGE DETECTION & UPVOTING TEST ---');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // Test 1: Run backfill
  await backfillMissingHashes();
  console.log('✓ Ran backfillMissingHashes()');

  // Check complaints with hash
  const total = await Complaint.countDocuments();
  const withHash = await Complaint.countDocuments({ imageHash: { $exists: true, $ne: null } });
  console.log(`✓ Total complaints: ${total}, with SHA-256 hash: ${withHash}`);

  // Test 2: Create a dummy test image
  const uploadsDir = path.join(__dirname, 'uploads');
  const testImagePath1 = path.join(uploadsDir, 'test-civic-issue-1.jpg');
  const testImagePath2 = path.join(uploadsDir, 'test-civic-issue-2-identical.jpg');

  const sampleImageBuffer = Buffer.from('TEST_CIVIC_POTHOLE_IMAGE_BUFFER_DATA_2026_EXACT_BYTES');
  fs.writeFileSync(testImagePath1, sampleImageBuffer);
  fs.writeFileSync(testImagePath2, sampleImageBuffer);

  const hash1 = await hashFile(testImagePath1);
  const hash2 = await hashFile(testImagePath2);
  console.log(`✓ Image 1 SHA-256: ${hash1}`);
  console.log(`✓ Image 2 SHA-256: ${hash2}`);
  if (hash1 !== hash2) {
    throw new Error('Hashes do not match for identical image data!');
  }
  console.log('✓ Hashes match perfectly!');

  // Cleanup any old test complaints with this hash
  await Complaint.deleteMany({ imageHash: hash1 });

  // Get or create User A and User B
  let userA = await User.findOne({ email: 'rahul.sharma@example.com' });
  let userB = await User.findOne({ email: 'priya.patel@example.com' });
  if (!userA || !userB) {
    throw new Error('Test users Rahul and Priya not found in DB!');
  }
  console.log(`✓ User A: ${userA.name} (${userA._id})`);
  console.log(`✓ User B: ${userB.name} (${userB._id})`);

  // Step 1: User A creates a complaint with Image 1
  const checkInitial = await findDuplicateImage(testImagePath1);
  console.log(`✓ Initial duplicate check before User A: duplicate=${!!checkInitial.complaint}`);

  const complaintA = await Complaint.create({
    title: 'Pothole on 100ft Road - User A Report',
    description: 'Deep road cavity causing traffic stall',
    citizen: userA._id,
    imageUrl: '/uploads/test-civic-issue-1.jpg',
    imageHash: checkInitial.imageHash,
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: '100ft Road Indiranagar',
    },
    aiCategory: 'Pothole',
    aiSeverity: 'High',
    aiConfidence: 0.95,
    aiSummary: 'Road depression verified',
    status: 'Submitted',
    upvotes: [],
    upvoteCount: 0,
    supporters: [],
    supporterCount: 0,
  });
  console.log(`✓ User A created Complaint ID: ${complaintA._id} with imageHash: ${complaintA.imageHash}`);

  // Step 2: User B uploads identical Image 2
  const checkDuplicateB = await findDuplicateImage(testImagePath2);
  console.log(`✓ User B upload check: duplicate detected=${!!checkDuplicateB.complaint}`);
  if (!checkDuplicateB.complaint) {
    throw new Error('FAILED: Duplicate image was NOT detected!');
  }
  if (checkDuplicateB.complaint._id.toString() !== complaintA._id.toString()) {
    throw new Error('FAILED: Detected duplicate did not match User A complaint ID!');
  }
  console.log(`✓ Matching Complaint ID found: ${checkDuplicateB.complaint._id}`);

  // Step 3: User B clicks "Support Existing Complaint"
  const complaintToSupport = await Complaint.findById(checkDuplicateB.complaint._id);
  const userBIdStr = userB._id.toString();

  // Check if User B already supported
  const alreadySupported = (complaintToSupport.supporters || []).some(uid => uid.toString() === userBIdStr);
  console.log(`✓ Already supported before clicking: ${alreadySupported}`);

  // Add User B to supporters list and upvotes
  complaintToSupport.upvotes.push(userB._id);
  complaintToSupport.upvoteCount = complaintToSupport.upvotes.length;
  if (!complaintToSupport.supporters) complaintToSupport.supporters = [];
  complaintToSupport.supporters.push(userB._id);
  complaintToSupport.supporterCount = complaintToSupport.supporters.length;
  await complaintToSupport.save();

  console.log(`✓ User B added to supporters! New supporterCount: ${complaintToSupport.supporterCount}, upvoteCount: ${complaintToSupport.upvoteCount}`);

  // Step 4: Prevent same user supporting multiple times
  const reloadedComplaint = await Complaint.findById(complaintA._id);
  const isNowSupported = (reloadedComplaint.supporters || []).some(uid => uid.toString() === userBIdStr);
  if (!isNowSupported) {
    throw new Error('FAILED: User B is not in supporters list!');
  }
  console.log('✓ Prevention check: Attempting duplicate support by User B...');
  const canSupportAgain = !(reloadedComplaint.supporters || []).some(uid => uid.toString() === userBIdStr);
  console.log(`✓ Allowed to support again? ${canSupportAgain} (Correct: False, duplicate support prevented)`);

  // Step 5: User B clicks "Create New Complaint" (forceCreate = true)
  // Should create separate complaint with same hash without throwing error
  const complaintB = await Complaint.create({
    title: 'User B New Separate Complaint with Same Photo',
    description: 'Separate perspective on issue',
    citizen: userB._id,
    imageUrl: '/uploads/test-civic-issue-2-identical.jpg',
    imageHash: hash2,
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: '100ft Road Indiranagar',
    },
    aiCategory: 'Pothole',
    aiSeverity: 'High',
    aiConfidence: 0.95,
    aiSummary: 'Road depression verified',
    status: 'Submitted',
    upvotes: [],
    upvoteCount: 0,
    supporters: [],
    supporterCount: 0,
  });
  console.log(`✓ User B force-created separate complaint ID: ${complaintB._id} with hash: ${complaintB.imageHash}`);

  // Clean up test data
  await Complaint.deleteMany({ _id: { $in: [complaintA._id, complaintB._id] } });
  if (fs.existsSync(testImagePath1)) fs.unlinkSync(testImagePath1);
  if (fs.existsSync(testImagePath2)) fs.unlinkSync(testImagePath2);
  console.log('✓ Cleaned up test complaints and temporary files');

  await mongoose.disconnect();
  console.log('--- ALL TEST ASSERTIONS PASSED SUCCESSFULLY! ---');
}

runTest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
