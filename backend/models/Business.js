const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  address: String,
  password: String,
  role: String,
  businessType: String,
  businessName: String,
  businessAddress: String,
  services: [String],
  workingHours: String,
  specialization: String,
  doctors: [String],
  courses: [String]
});

module.exports = mongoose.model('Business', BusinessSchema);