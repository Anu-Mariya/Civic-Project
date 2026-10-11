const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  updateComplaintStatus,
  getAllCitizens,
  getDepartments,
  deleteComplaint,
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

router.get('/stats', getDashboardStats);
router.put('/complaints/:id/status', updateComplaintStatus);
router.delete('/complaints/:id', deleteComplaint);
router.get('/citizens', getAllCitizens);
router.get('/departments', getDepartments);

module.exports = router;
