const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    res.status(200).json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: 'Setting key is required' });

    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Setting saved successfully', setting });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSettingByKey = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    res.status(200).json(setting || { key: req.params.key, value: null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
