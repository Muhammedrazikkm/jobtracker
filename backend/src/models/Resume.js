const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
