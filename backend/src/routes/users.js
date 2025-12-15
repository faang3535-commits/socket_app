const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

router.get('/profile', authMiddleware, userController.getProfile);              
router.get('/allusers', authMiddleware, userController.getalluser);
router.get('/messages/:id', authMiddleware, userController.getMessages);

module.exports = router;
