const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customerName: String,
  customerPhone: String,
  businessEmail: String, // <-- Add this field
  service: String,
  date: String,
  time: String,
  notes: String,
  status: String,
  createdAt: Date,
});

module.exports = mongoose.model('Appointment', AppointmentSchema);