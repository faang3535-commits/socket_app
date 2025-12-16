const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/profile', authMiddleware, userController.profile);
router.get('/allusers', authMiddleware, userController.getalluser);
router.get('/messages/:roomId', authMiddleware, userController.getMessages);

module.exports = router;
