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

router.put('/editmessagefrombuffer', authMiddleware, userController.editMessageFromBuffer);
router.delete('/deletemessagefrombuffer', authMiddleware, userController.deleteMessageFromBuffer);
module.exports = router;