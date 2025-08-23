const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  businessEmail: { type: String, required: true },
  service: { type: String, required: true },
  date: { type: String, required: true }, // or Date type if you prefer
  time: { type: String, required: true },
  notes: { type: String },
  status: { type: String, default: 'pending' }, // pending, accepted, rejected, rescheduled
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);