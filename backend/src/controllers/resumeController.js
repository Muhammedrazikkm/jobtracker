const Resume = require('../models/Resume');
const fs = require('fs');
const path = require('path');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }
    
    const { title } = req.body;
    if (!title) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title is required' });
    }

    const resume = await Resume.create({
      title,
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size
    });

    res.status(201).json(resume);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ createdAt: -1 });
    res.status(200).json(resumes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Delete file
    const filePath = path.join(__dirname, '../../uploads/resumes', resume.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Resume.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
