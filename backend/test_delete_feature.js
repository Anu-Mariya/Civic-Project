const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { connectDB, closeDB } = require('./src/config/db');
const User = require('./src/models/User');
const Complaint = require('./src/models/Complaint');
const Notification = require('./src/models/Notification');
const { deleteComplaint } = require('./src/controllers/adminController');

async function runTest() {
  console.log('--- STARTING ADMIN-ONLY DELETE COMPLAINT TEST ---');

  await connectDB();
  console.log('✓ Connected to MongoDB');

  // Find Admin and Citizen users
  const admin = await User.findOne({ role: 'admin' });
  const citizen = await User.findOne({ role: 'citizen' });

  if (!admin || !citizen) {
    throw new Error('Admin or Citizen user not found!');
  }
  console.log(`✓ Admin User: ${admin.email} (Role: ${admin.role})`);
  console.log(`✓ Citizen User: ${citizen.email} (Role: ${citizen.role})`);

  // Create a temporary test complaint
  const testComplaint = await Complaint.create({
    title: 'Temporary Test Complaint For Delete Feature',
    description: 'This ticket will test admin deletion authorization',
    citizen: citizen._id,
    imageUrl: '/uploads/sample-pothole.svg',
    imageHash: 'temp_delete_test_hash_123',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Test Location',
    },
    aiCategory: 'Pothole',
    aiSeverity: 'Medium',
    status: 'Submitted',
  });
  console.log(`✓ Created test complaint ID: ${testComplaint._id}`);

  // Create a notification referencing this complaint
  const testNotification = await Notification.create({
    user: citizen._id,
    title: 'Test Notification',
    message: 'Test message for complaint',
    type: 'complaint_submitted',
    relatedComplaint: testComplaint._id,
  });
  console.log(`✓ Created test notification ID: ${testNotification._id}`);

  // Helper to mock req and res
  const mockReqRes = (user, params) => {
    const req = { user, params, headers: {} };
    let statusCode = 200;
    let responseData = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      },
    };
    return { req, res, getStatus: () => statusCode, getData: () => responseData };
  };

  // Test 1: Regular Citizen tries to delete via adminOnly middleware
  console.log('\n--- Test 1: Regular Citizen Deletion Attempt ---');
  const { adminOnly } = require('./src/middleware/authMiddleware');
  let citizenBlocked = false;
  let citizenStatusCode = 200;
  let citizenMessage = '';

  const citizenMock = mockReqRes(citizen, { id: testComplaint._id.toString() });
  adminOnly(citizenMock.req, citizenMock.res, () => {
    citizenBlocked = false;
  });

  if (citizenMock.getStatus() === 403) {
    citizenBlocked = true;
    citizenStatusCode = citizenMock.getStatus();
    citizenMessage = citizenMock.getData()?.message;
  }

  console.log(`✓ Citizen status code: ${citizenStatusCode}`);
  console.log(`✓ Citizen rejection message: "${citizenMessage}"`);
  if (!citizenBlocked || citizenStatusCode !== 403) {
    throw new Error('FAILED: Citizen was NOT blocked by adminOnly middleware!');
  }
  console.log('✓ PASS: Citizen is strictly forbidden (403) from deleting complaints!');

  // Verify complaint still exists in DB
  const stillExists = await Complaint.findById(testComplaint._id);
  if (!stillExists) {
    throw new Error('FAILED: Complaint was deleted when it should NOT have been!');
  }
  console.log('✓ PASS: Complaint remains untouched in MongoDB.');

  // Test 2: Unauthenticated user tries to delete via protect middleware
  console.log('\n--- Test 2: Unauthenticated Deletion Attempt ---');
  const { protect } = require('./src/middleware/authMiddleware');
  const unauthMock = mockReqRes(null, { id: testComplaint._id.toString() });
  unauthMock.req.headers = {}; // No Bearer token

  await protect(unauthMock.req, unauthMock.res, () => {});
  console.log(`✓ Unauthenticated status code: ${unauthMock.getStatus()}`);
  console.log(`✓ Unauthenticated rejection message: "${unauthMock.getData()?.message}"`);
  if (unauthMock.getStatus() !== 401) {
    throw new Error('FAILED: Unauthenticated request was not rejected with 401!');
  }
  console.log('✓ PASS: Unauthenticated access is rejected (401).');

  // Test 3: Authenticated Admin deletes the complaint
  console.log('\n--- Test 3: Admin Deletion Execution ---');
  let adminPassedMiddleware = false;
  const adminMock = mockReqRes(admin, { id: testComplaint._id.toString() });

  adminOnly(adminMock.req, adminMock.res, () => {
    adminPassedMiddleware = true;
  });

  if (!adminPassedMiddleware) {
    throw new Error('FAILED: Admin was blocked by adminOnly middleware!');
  }
  console.log('✓ PASS: Admin authorized by adminOnly middleware.');

  // Call deleteComplaint controller
  await deleteComplaint(adminMock.req, adminMock.res);
  console.log(`✓ Admin delete status code: ${adminMock.getStatus()}`);
  console.log(`✓ Admin delete response:`, adminMock.getData());

  if (adminMock.getStatus() !== 200 || !adminMock.getData()?.success) {
    throw new Error('FAILED: Admin deleteComplaint controller returned error!');
  }
  console.log('✓ PASS: deleteComplaint returned 200 success.');

  // Verify complaint is actually deleted from MongoDB
  const postDeleteComplaint = await Complaint.findById(testComplaint._id);
  if (postDeleteComplaint) {
    throw new Error('FAILED: Complaint still exists in MongoDB after deletion!');
  }
  console.log('✓ PASS: Complaint successfully removed from MongoDB.');

  // Verify related notifications were cleaned up
  const remainingNotifications = await Notification.countDocuments({ relatedComplaint: testComplaint._id });
  if (remainingNotifications !== 0) {
    throw new Error('FAILED: Related notification was not cleaned up!');
  }
  console.log('✓ PASS: Associated notifications were cleaned up.');

  // Test 4: Deleting a non-existent complaint returns 404
  console.log('\n--- Test 4: Deleting Non-Existent ID ---');
  const notFoundMock = mockReqRes(admin, { id: testComplaint._id.toString() });
  await deleteComplaint(notFoundMock.req, notFoundMock.res);
  console.log(`✓ Not found status code: ${notFoundMock.getStatus()}`);
  if (notFoundMock.getStatus() !== 404) {
    throw new Error('FAILED: Non-existent ID did not return 404!');
  }
  console.log('✓ PASS: Non-existent ID returns 404 correctly.');

  await closeDB();
  console.log('\n--- ALL ADMIN DELETE TEST ASSERTIONS PASSED SUCCESSFULLY! ---');
}

runTest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
