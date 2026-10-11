const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  preCheckComplaint,
  submitComplaint,
  upvoteComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
} = require('../controllers/complaintController');
const { deleteComplaint } = require('../controllers/adminController');

// Public route to view complaints
router.get('/', getAllComplaints);

// Citizen protected routes
router.get('/my', protect, getMyComplaints);
router.post('/pre-check', protect, upload.single('image'), preCheckComplaint);
router.post('/', protect, upload.single('image'), submitComplaint);
router.post('/:id/upvote', protect, upvoteComplaint);
router.post('/:id/support', protect, upvoteComplaint);
router.get('/:id', getComplaintById);

// Admin-only delete route
router.delete('/:id', protect, adminOnly, deleteComplaint);

module.exports = router;
