const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  businessEmail: { type: String, required: true },
  businessName: { type: String },        // ADD THIS
  businessAddress: { type: String },     // ADD THIS
  service: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  notes: { type: String },
  status: { type: String, default: 'pending' }, // pending, accepted, rejected, rescheduled
  rating: { type: Number, min: 1, max: 5 },
  completedAt: { type: Date }, // ADD THIS LINE
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);