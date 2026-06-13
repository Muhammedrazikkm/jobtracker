const Template = require('../models/Template');

exports.createTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !subject || !body) return res.status(400).json({ message: 'All fields are required' });
    
    const template = await Template.create({ name, subject, body });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.status(200).json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { name, subject, body },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.status(200).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
