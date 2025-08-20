const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String, // <-- Add this line
  customerPhone: String,
  businessEmail: String,
  service: String,
  date: String,
  time: String,
  notes: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
});

module.exports = mongoose.model('Appointment', AppointmentSchema);