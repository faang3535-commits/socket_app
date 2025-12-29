const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/profile', authMiddleware, userController.profile);
router.put('/editmessage', authMiddleware, userController.editMessage);
router.delete('/deletemessage/:id', authMiddleware, userController.deleteMessage);
router.get('/allusers', authMiddleware, userController.getalluser);
router.get('/messages/:roomId', authMiddleware, userController.getMessages);

router.get('/notification', authMiddleware, userController.getNotification);
module.exports = router;