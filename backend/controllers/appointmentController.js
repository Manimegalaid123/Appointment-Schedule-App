const Appointment = require('../models/Appointment');
const Business = require('../models/Business');

exports.createAppointment = async (req, res) => {
  try {
    // Check for same business, same service, same date, same time
    const exists = await Appointment.findOne({
      businessEmail: req.body.businessEmail,
      service: req.body.service,
      date: req.body.date,
      time: req.body.time,
      status: { $nin: ['rejected', 'cancelled'] } // Don't count rejected/cancelled appointments
    });
    
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: 'This time slot is already booked for this service.' 
      });
    }

    const appointment = new Appointment(req.body);
    await appointment.save();
    res.json({ success: true, appointment });
  } catch (err) {
    console.error('Error creating appointment:', err);
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
      { status: req.body.status, updatedAt: new Date() },
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

// Fixed route for getting booked times
exports.getBookedTimes = async (req, res) => {
  try {
    const { businessEmail, service, date } = req.query;
    
    if (!businessEmail || !service || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }

    // Only get appointments that are not rejected or cancelled
    const appointments = await Appointment.find({ 
      businessEmail, 
      service, 
      date,
      status: { $nin: ['rejected', 'cancelled'] }
    });
    
    const bookedTimes = appointments.map(appointment => appointment.time);
    res.json({ success: true, bookedTimes });
  } catch (err) {
    console.error('Error fetching booked times:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};