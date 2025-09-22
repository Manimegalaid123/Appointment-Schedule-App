const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  businessAddress: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  workingHours: { type: String, required: true },
  imageUrl: { type: String }, // <-- Add this for shop photo
  services: [
    {
      name: String,
      description: String,
      imageUrl: String,
      rating: Number
    }
  ]
});

module.exports = mongoose.model('Business', BusinessSchema);