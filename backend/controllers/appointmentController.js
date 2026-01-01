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

// Get break times for a specific date
exports.getBreakTimes = async (req, res) => {
  try {
    const { businessEmail, date } = req.query;
    
    if (!businessEmail || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }

    const business = await Business.findOne({ email: businessEmail });
    if (!business) {
      return res.status(404).json({ 
        success: false, 
        message: 'Business not found' 
      });
    }

    // Get the day of the week from the date
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    // Filter breaks for this day
    const breaksForDay = business.breaks.filter(br => br.day === dayOfWeek);
    
    // Convert breaks to time slots format
    const breakTimes = breaksForDay.map(br => ({
      startTime: br.startTime,
      endTime: br.endTime,
      breakType: br.breakType,
      description: br.description
    }));

    res.json({ success: true, breakTimes, dayOfWeek });
  } catch (err) {
    console.error('Error fetching break times:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check appointment reminder status
exports.checkReminderStatus = async (req, res) => {
  try {
    const { email, date, time } = req.query;
    
    if (!email || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters (email, date, time)'
      });
    }

    const appointment = await Appointment.findOne({
      customerEmail: email,
      date: date,
      time: time
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const reminderStatus = {
      success: true,
      appointment: {
        customerName: appointment.customerName,
        service: appointment.service,
        date: appointment.date,
        time: appointment.time,
        businessName: appointment.businessName,
        status: appointment.status
      },
      reminders: {
        reminder24h: {
          sent: appointment.remindersSent?.reminder24h || false,
          sentAt: appointment.remindersSent?.sentAt24h || null
        },
        reminder1h: {
          sent: appointment.remindersSent?.reminder1h || false,
          sentAt: appointment.remindersSent?.sentAt1h || null
        }
      }
    };

    res.json(reminderStatus);
  } catch (err) {
    console.error('Error checking reminder status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Test reminder - manually send a reminder email
exports.testReminder = async (req, res) => {
  try {
    const { email, date, time } = req.query;
    
    if (!email || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters (email, date, time)'
      });
    }

    const appointment = await Appointment.findOne({
      customerEmail: email,
      date: date,
      time: time
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const business = await Business.findOne({ email: appointment.businessEmail });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Import sendReminder function from appointmentReminder
    const { sendReminder } = require('../utils/appointmentReminder');
    
    // Send 1-hour reminder manually
    const success = await sendReminder(appointment, business, '1');

    res.json({
      success: success,
      message: success ? 'Test reminder sent successfully!' : 'Failed to send test reminder',
      appointment: {
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        service: appointment.service,
        date: appointment.date,
        time: appointment.time
      }
    });
  } catch (err) {
    console.error('Error sending test reminder:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};