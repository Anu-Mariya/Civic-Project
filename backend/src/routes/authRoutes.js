const express = require('express');
const router = express.Router();
const { registerCitizen, loginUser, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerCitizen);
router.post('/login', loginUser);
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
