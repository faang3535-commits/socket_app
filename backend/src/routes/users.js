const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET registration page
router.get('/register', userController.getRegisterPage);

// POST registration form
router.post('/register', userController.registerUser);

// POST login form
router.post('/login', userController.loginUser);

module.exports = router;
