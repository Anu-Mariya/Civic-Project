const fs = require('fs/promises');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const { analyzeCivicImage } = require('../services/geminiService');
const { findPotentialDuplicate } = require('../services/duplicateService');
const { findDuplicateImage } = require('../services/imageDuplicateService');
const { routeComplaintToDepartment } = require('../services/routingService');
const { createNotification, awardRewardPoints } = require('../services/notificationService');

const removeUploadedImage = async (file) => {
  if (!file?.path) return;
  try {
    await fs.unlink(file.path);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('[Complaint Controller] Could not remove unused upload:', error);
  }
};

// @desc    Pre-analyze image with Gemini AI and check for duplicate complaints
// @route   POST /api/complaints/pre-check
// @access  Private
const preCheckComplaint = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image of the civic issue.' });
    }

    const imageDuplicate = await findDuplicateImage(req.file.path);
    if (imageDuplicate.complaint) {
      await removeUploadedImage(req.file);
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        duplicateType: 'image',
        existingComplaint: imageDuplicate.complaint,
        message:
          'An existing complaint with the same image was found. Would you like to support the existing complaint or create a new complaint?',
      });
    }

    const { description, latitude, longitude } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // 1. AI Analysis via Google Gemini Vision
    const aiResult = await analyzeCivicImage(req.file.path, req.file.mimetype, description);

    // 2. Check for duplicate complaints if location is provided
    let duplicateInfo = null;
    if (!isNaN(lat) && !isNaN(lng)) {
      duplicateInfo = await findPotentialDuplicate(aiResult.category, lat, lng, 100);
    }

    // 3. Routing preview
    const department = await routeComplaintToDepartment(aiResult.category);

    res.status(200).json({
      success: true,
      aiAnalysis: aiResult,
      duplicateInfo: duplicateInfo
        ? {
            isDuplicate: true,
            distanceMeters: duplicateInfo.distanceMeters,
            duplicateComplaint: duplicateInfo.complaint,
          }
        : { isDuplicate: false },
      assignedDepartment: department ? { id: department._id, name: department.name, code: department.code } : null,
      tempImageUrl: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    await removeUploadedImage(req.file);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit a new civic complaint
// @route   POST /api/complaints
// @access  Private
const submitComplaint = async (req, res) => {
  let complaintCreated = false;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Complaint image is required.' });
    }

    const { description, latitude, longitude, address, forceCreate } = req.body;
    const isForce = forceCreate === 'true' || forceCreate === true;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      latitude === undefined || latitude === null || String(latitude).trim() === '' ||
      longitude === undefined || longitude === null || String(longitude).trim() === '' ||
      !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180
    ) {
      await removeUploadedImage(req.file);
      return res.status(400).json({
        success: false,
        message: 'A valid map location is required. Detect GPS or select a point on the map.',
      });
    }

    // 1. Exact duplicate image detection via SHA-256 hash
    const imageDuplicate = await findDuplicateImage(req.file.path);
    if (imageDuplicate.complaint && !isForce) {
      await removeUploadedImage(req.file);
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        duplicateType: 'image',
        existingComplaint: imageDuplicate.complaint,
        message:
          'An existing complaint with the same image was found. Would you like to support the existing complaint or create a new complaint?',
      });
    }

    // 2. Run Gemini AI image classification & severity analysis
    const aiResult = await analyzeCivicImage(req.file.path, req.file.mimetype, description);

    // 3. Check for duplicates within 100 meters in the same category
    const duplicate = await findPotentialDuplicate(aiResult.category, lat, lng, 100);

    // If duplicate detected and user didn't explicitly override via forceCreate:
    if (duplicate && !isForce) {
      await removeUploadedImage(req.file);
      await createNotification({
        userId: req.user._id,
        title: 'Similar Complaint Nearby Detected',
        message: `A similar ${aiResult.category} was already reported ${duplicate.distanceMeters}m from your location. Consider supporting it instead!`,
        type: 'duplicate_detected',
        relatedComplaintId: duplicate.complaint._id,
      });

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        duplicateType: 'location',
        distanceMeters: duplicate.distanceMeters,
        existingComplaint: duplicate.complaint,
        aiAnalysis: aiResult,
        message: `A similar ${aiResult.category} was already reported nearby (${duplicate.distanceMeters}m away). You can upvote the existing report or submit anyway.`,
      });
    }

    // 4. Automatic Department Routing
    const department = await routeComplaintToDepartment(aiResult.category);

    const imageUrl = `/uploads/${req.file.filename}`;
    const title = `${aiResult.category} in ${address ? address.slice(0, 35) : 'Reported Location'}`;

    // 5. Create the Complaint
    const complaint = await Complaint.create({
      title,
      description: description || `Civic issue identified: ${aiResult.summary}`,
      citizen: req.user._id,
      imageUrl,
      imageHash: imageDuplicate.imageHash,
      location: {
        latitude: lat,
        longitude: lng,
        address: address || 'GPS Location Captured',
      },
      aiCategory: aiResult.category,
      aiSeverity: aiResult.severity,
      aiConfidence: aiResult.confidence,
      aiSummary: aiResult.summary,
      department: department ? department._id : null,
      departmentName: department ? department.name : 'Municipal Grievance Cell',
      status: 'Submitted',
      statusHistory: [
        {
          status: 'Submitted',
          updatedBy: req.user._id,
          remarks: 'Complaint registered by citizen and verified by AI vision.',
          timestamp: new Date(),
        },
        {
          status: 'Assigned',
          updatedBy: req.user._id,
          remarks: `Automatically routed to ${department ? department.name : 'Municipal Grievance Cell'}.`,
          timestamp: new Date(),
        },
      ],
      upvotes: [],
      upvoteCount: 0,
      supporters: [],
      supporterCount: 0,
      isDuplicate: !!duplicate,
      duplicateOf: duplicate ? duplicate.complaint._id : null,
      duplicateDistanceMeters: duplicate ? duplicate.distanceMeters : null,
    });
    complaintCreated = true;

    // 6. Award +20 reward points to citizen
    await awardRewardPoints(req.user._id, 20, `Submitting a verified civic complaint (${aiResult.category})`, complaint._id);

    // 7. In-App Notification: Complaint Submitted & Routed
    await createNotification({
      userId: req.user._id,
      title: 'Complaint Registered & Routed',
      message: `Your complaint for ${aiResult.category} (#${complaint._id.toString().slice(-6)}) has been routed to the ${complaint.departmentName}.`,
      type: 'complaint_routed',
      relatedComplaintId: complaint._id,
    });

    res.status(201).json({
      success: true,
      isDuplicate: false,
      message: 'Complaint submitted and routed successfully! You earned 20 reward points.',
      complaint,
    });
  } catch (error) {
    console.error('[Complaint Controller] Error:', error);
    if (!complaintCreated) await removeUploadedImage(req.file);

    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote / Support an existing complaint
// @route   POST /api/complaints/:id/upvote
// @route   POST /api/complaints/:id/support
// @access  Private
const upvoteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const userIdStr = req.user._id.toString();
    const alreadyUpvoted = (complaint.upvotes || []).some((uid) => uid.toString() === userIdStr);
    const alreadySupported = (complaint.supporters || []).some((uid) => uid.toString() === userIdStr);

    if (alreadyUpvoted || alreadySupported) {
      return res.status(400).json({ success: false, message: 'You have already supported this complaint.' });
    }

    if (!complaint.upvotes) complaint.upvotes = [];
    complaint.upvotes.push(req.user._id);
    complaint.upvoteCount = complaint.upvotes.length;

    if (!complaint.supporters) complaint.supporters = [];
    complaint.supporters.push(req.user._id);
    complaint.supporterCount = complaint.supporters.length;

    await complaint.save();

    // Reward the supporting citizen with +5 points
    await awardRewardPoints(req.user._id, 5, `Supporting community civic issue #${complaint._id.toString().slice(-6)}`, complaint._id);

    // Reward original author with +2 points for community resonance
    if (complaint.citizen.toString() !== userIdStr) {
      await awardRewardPoints(
        complaint.citizen,
        2,
        `Community member ${req.user.name} supported your complaint #${complaint._id.toString().slice(-6)}`,
        complaint._id
      );

      await createNotification({
        userId: complaint.citizen,
        title: 'New Support Received!',
        message: `${req.user.name} upvoted your civic report (${complaint.aiCategory}). Total supports: ${complaint.upvoteCount}.`,
        type: 'upvote_received',
        relatedComplaintId: complaint._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint supported successfully! You earned 5 reward points.',
      upvoteCount: complaint.upvoteCount,
      supporterCount: complaint.supporterCount,
      supporters: complaint.supporters,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current citizen's complaints
// @route   GET /api/complaints/my
// @access  Private
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizen: req.user._id })
      .populate('department', 'name code contactEmail')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all public complaints (for feed & map view)
// @route   GET /api/complaints
// @access  Public
const getAllComplaints = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.aiCategory = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } },
      ];
    }

    // Exclude duplicates from public feed
    query.isDuplicate = { $ne: true };

    const complaints = await Complaint.find(query)
      .populate('citizen', 'name')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complaint details by ID
// @route   GET /api/complaints/:id
// @access  Public
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email rewardPoints')
      .populate('department')
      .populate('duplicateOf', 'title aiCategory status location');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  preCheckComplaint,
  submitComplaint,
  upvoteComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
};
