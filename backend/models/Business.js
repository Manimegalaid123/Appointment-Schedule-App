const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  businessType: { type: String, required: true },
  businessName: { type: String, required: true },
  businessAddress: String,
  services: [String],
  workingHours: String,
  specialization: String,
  doctors: [String],
  courses: [String],
  email: String,
  phone: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Link to manager
});

module.exports = mongoose.model('Business', BusinessSchema);