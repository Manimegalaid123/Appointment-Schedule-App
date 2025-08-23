const Appointment = require('../models/Appointment');
const Business = require('../models/Business');

exports.createAppointment = async (req, res) => {
  try {
    // Check for same business, same service, same date, same time
    const exists = await Appointment.findOne({
      businessEmail: req.body.businessEmail,
      service: req.body.service,
      date: req.body.date,
      time: req.body.time
    });
    if (exists) {
      // Don't create, just return success false (no error message for frontend)
      return res.json({ success: false, message: 'Time slot already booked.' });
    }

    const appointment = new Appointment(req.body);
    await appointment.save();
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBusinessAppointments = async (req, res) => {
  try {
    const business = await Business.findOne({ email: req.params.email });
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const appointments = await Appointment.find({ business: business._id });
    res.json({ appointments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getByBusinessEmail = async (req, res) => {
  try {
    const appointments = await Appointment.find({ businessEmail: req.params.businessEmail });
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBookedTimes = async (req, res) => {
  const { businessEmail, service, date } = req.query;
  const appointments = await Appointment.find({ businessEmail, service, date });
  const bookedTimes = appointments.map(a => a.time);
  res.json({ bookedTimes });
};