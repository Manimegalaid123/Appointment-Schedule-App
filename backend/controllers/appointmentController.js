const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { addEmailToQueue } = require('../services/emailQueueService');

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

    // Fetch business details for email
    const business = await Business.findOne({ email: req.body.businessEmail });
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const appointment = new Appointment(req.body);
    await appointment.save();

    console.log('✅ Appointment saved with ID:', appointment._id);

    // Send emails asynchronously (don't wait for them)
    try {
      console.log('\n📧 [EMAIL QUEUEING] Starting email process...');
      console.log('📧 [EMAIL QUEUEING] addEmailToQueue function imported:', typeof addEmailToQueue);
      
      const appointmentDate = new Date(req.body.date);
      const appointmentDateStr = appointmentDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      const emailVariables = {
        customerName: req.body.customerName,
        businessName: business.businessName,
        businessAddress: business.businessAddress,
        businessEmail: business.email,
        businessPhone: business.phone,
        appointmentDate: appointmentDateStr,
        appointmentTime: req.body.time,
        serviceName: req.body.service,
        businessId: business._id,
        customerId: req.body.customerEmail
      };

      console.log('📧 Email variables prepared:', { 
        customer: emailVariables.customerName, 
        business: emailVariables.businessName,
        appointment: appointment._id
      });

      // 1. Send BOOKING CONFIRMATION email immediately
      console.log('📬 Queueing booking_confirmation email...');
      await addEmailToQueue(
        'booking_confirmation',
        req.body.customerEmail,
        req.body.customerName,
        emailVariables,
        appointment._id,
        0 // Send immediately
      );
      console.log('✅ Booking confirmation queued');

      // 2. Schedule 24-HOUR REMINDER
      const reminder24Time = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
      const minutesUntilReminder24 = Math.round((reminder24Time - new Date()) / 60000);
      if (minutesUntilReminder24 > 0) {
        console.log('📬 Queueing reminder_24h email...');
        await addEmailToQueue(
          'reminder_24h',
          req.body.customerEmail,
          req.body.customerName,
          emailVariables,
          appointment._id,
          minutesUntilReminder24
        );
        console.log('✅ 24h reminder queued');
      }

      // 3. Schedule 1-HOUR REMINDER
      const reminder1Time = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
      const minutesUntilReminder1 = Math.round((reminder1Time - new Date()) / 60000);
      if (minutesUntilReminder1 > 0) {
        console.log('📬 Queueing reminder_1h email...');
        await addEmailToQueue(
          'reminder_1h',
          req.body.customerEmail,
          req.body.customerName,
          emailVariables,
          appointment._id,
          minutesUntilReminder1
        );
        console.log('✅ 1h reminder queued');
      }

      // 4. Send NEW BOOKING ALERT to manager
      console.log('📬 Queueing new_booking_alert email to manager...');
      await addEmailToQueue(
        'new_booking_alert',
        business.email,
        business.businessName,
        {
          ...emailVariables,
          customerEmail: req.body.customerEmail,
          customerPhone: req.body.customerPhone || 'N/A',
          notes: req.body.notes || 'No special notes'
        },
        appointment._id,
        0 // Send immediately
      );
      console.log('✅ Manager alert queued');

      console.log('✉️ All appointment emails queued successfully');
    } catch (emailError) {
      console.error('\n❌ CRITICAL: Error queuing emails!');
      console.error('   Error Message:', emailError.message);
      console.error('   Error Type:', emailError.constructor.name);
      console.error('   Full Error:', JSON.stringify(emailError, null, 2));
      console.error('   Stack:', emailError.stack);
      // Don't fail the appointment creation if email queueing fails
    }

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

    // Send status update email to customer
    try {
      const business = await Business.findOne({ email: appointment.businessEmail });
      if (business) {
        const appointmentDate = new Date(appointment.date);
        const appointmentDateStr = appointmentDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });

        await addEmailToQueue(
          'status_update',
          appointment.customerEmail,
          appointment.customerName,
          {
            customerName: appointment.customerName,
            businessName: business.businessName,
            businessEmail: business.email,
            businessPhone: business.phone,
            appointmentDate: appointmentDateStr,
            appointmentTime: appointment.time,
            serviceName: appointment.service,
            status: req.body.status,
            businessId: business._id,
            customerId: appointment.customerEmail
          },
          appointment._id,
          0 // Send immediately
        );

        console.log('✉️ Status update email queued');
      }
    } catch (emailError) {
      console.error('⚠️ Error queuing status update email:', emailError);
      // Don't fail the status update if email fails
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