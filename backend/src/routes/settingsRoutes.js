const express = require('express');
const router = express.Router();
const { getSettings, updateSetting, getSettingByKey } = require('../controllers/settingsController');

router.get('/', getSettings);
router.post('/', updateSetting);
router.get('/:key', getSettingByKey);

module.exports = router;
