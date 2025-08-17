const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: String,
  phone: String,
  services: [String], // This should be an array
  workingHours: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessType: { type: String, required: true },
  specialization: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Business', BusinessSchema);