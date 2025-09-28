const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: false }, // CHANGE: Make this optional
  businessEmail: { type: String, required: true },
  businessName: { type: String },
  businessAddress: { type: String },
  service: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'completed', 'cancelled', 'rejected'], 
    default: 'pending' 
  },
  rating: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: {
      type: String,
      default: ''
    },
    ratedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', AppointmentSchema);