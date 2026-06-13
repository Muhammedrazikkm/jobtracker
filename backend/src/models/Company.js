const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  address: [{ type: String }],
  email: [{ type: String }],
  phone: [{ type: String }],
  first: { type: Boolean, default: true },
  sheetId: { type: String },
  lastEmailSentAt: { type: Date },
  emailCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
