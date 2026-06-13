const express = require('express');
const router = express.Router();
const emailLogController = require('../controllers/emailLogController');

router.get('/', emailLogController.getLogs);
router.delete('/clear', emailLogController.clearLogs);

module.exports = router;
