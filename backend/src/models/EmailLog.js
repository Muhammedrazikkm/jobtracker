const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyEmail: { type: String },
  type: { type: String, enum: ['First Time', 'Recurring'], required: true },
  status: { type: String, enum: ['Pending', 'Success', 'Failed'], required: true },
  error: { type: String },
  opened: { type: Boolean, default: false },
  openedAt: { type: Date },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
