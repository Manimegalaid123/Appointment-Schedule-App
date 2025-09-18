const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const Appointment = require('../models/Appointment');
const sendMail = require('../utils/sendMail');

// Create appointment
router.post('/', appointmentController.createAppointment);

// Update status
router.put('/:id/status', appointmentController.updateStatus);

// Get appointments by business email
router.get('/:businessEmail', appointmentController.getByBusinessEmail);

// Get appointments by customer email
router.get('/customer/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email).trim();
  try {
    const appointments = await Appointment.find({ customerEmail: email });
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Update appointment status with email notification
router.post('/update-status/:id', async (req, res) => {
  const { status, date, time } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.json({ success: false, message: 'Appointment not found' });
    
    appointment.status = status;
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    appointment.updatedAt = new Date();
    await appointment.save();

    // Send email notification if status is accepted
    if (status === 'accepted') {
      await sendMail({
        to: appointment.customerEmail,
        subject: 'Appointment Accepted',
        text: `Hi ${appointment.customerName},\n\nYour appointment for ${appointment.service} on ${appointment.date} at ${appointment.time} has been accepted by the salon.\n\nThank you!`
      });
    }

    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// FIXED: Get booked times - moved to correct path
router.get('/booked-times/check', appointmentController.getBookedTimes);

// CREATE: New endpoint to create appointment with business logic
router.post('/create', async (req, res) => {
  const { businessEmail, service, date, time, customerName, customerEmail, notes } = req.body;
  if (!businessEmail || !service || !date || !time || !customerName || !customerEmail) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const existing = await Appointment.findOne({ businessEmail, service, date, time });
    if (existing) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }
    const appointment = new Appointment({
      businessEmail,
      service,
      date,
      time,
      customerName,
      customerEmail,
      notes
    });
    await appointment.save();
    res.json({ success: true, appointment });
  } catch (err) {
    console.error('Appointment creation error:', err); // <-- This will print the real error
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;