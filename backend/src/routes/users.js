const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// GET profile (protected)
// router.get('/profile', authMiddleware, userController.getProfile);

module.exports = router;
