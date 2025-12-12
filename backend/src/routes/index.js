const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');
const requestLogger = require('../middleware/requestLogger');

router.get('/', requestLogger, indexController.getHomePage);

module.exports = router;
