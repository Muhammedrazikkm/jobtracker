const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// The tracking pixel route
router.get('/:logId', trackingController.trackEmailOpen);

module.exports = router;
