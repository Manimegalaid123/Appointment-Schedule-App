const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  businessAddress: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  workingHours: { type: String, required: true },
  imageUrl: { type: String },
  services: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Business', BusinessSchema);