const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyEmail: { type: String },
  type: { type: String, enum: ['First Time', 'Recurring'], required: true },
  status: { type: String, enum: ['Success', 'Failed'], required: true },
  error: { type: String },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
