const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  duration: { type: Number, required: true }, // in minutes
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);