const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const User = require('../models/User');
const sendMail = require('../utils/sendMail');
const { addEmailToQueue } = require('../services/emailQueueService');

// Create appointment
router.post('/', appointmentController.createAppointment);

// Update status
router.put('/:id/status', appointmentController.updateStatus);

// Get appointments by business email
router.get('/:businessEmail', appointmentController.getByBusinessEmail);

// Get appointments by customer email
router.get('/customer/:email', async (req, res) => {
  try {
    const customerEmail = req.params.email;
    console.log('📋 Fetching appointments for customer:', customerEmail);
    
    let appointments = await Appointment.find({ customerEmail: customerEmail })
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${appointments.length} raw appointments`);
    
    // AUTO-FIX missing business details for each appointment
    const fixedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        let needsUpdate = false;
        let appointmentObj = appointment.toObject ? appointment.toObject() : appointment;
        
        // Fix missing customer name
        if (!appointmentObj.customerName && appointmentObj.customerEmail) {
          const emailName = appointmentObj.customerEmail.split('@')[0];
          appointmentObj.customerName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          appointment.customerName = appointmentObj.customerName;
          needsUpdate = true;
          console.log(`🔧 Fixed customer name: ${appointmentObj.customerName}`);
        }
        
        // Fix missing business details by fetching from Business collection
        if ((!appointmentObj.businessName || !appointmentObj.businessAddress) && appointmentObj.businessEmail) {
          try {
            console.log(`🔍 Fetching business details for: ${appointmentObj.businessEmail}`);
            const business = await Business.findOne({ email: appointmentObj.businessEmail });
            if (business) {
              appointmentObj.businessName = business.businessName;
              appointmentObj.businessAddress = business.businessAddress;
              appointment.businessName = business.businessName;
              appointment.businessAddress = business.businessAddress;
              needsUpdate = true;
              console.log(`✅ Fixed business details: ${business.businessName}`);
            } else {
              console.log(`⚠️ Business not found for email: ${appointmentObj.businessEmail}`);
            }
          } catch (fetchError) {
            console.log(`❌ Error fetching business ${appointmentObj.businessEmail}:`, fetchError.message);
          }
        }
        
        // Save the updated appointment to database
        if (needsUpdate) {
          try {
            await appointment.save();
            console.log(`💾 Saved updated appointment for ${appointmentObj.customerName}`);
          } catch (saveError) {
            console.log(`⚠️ Could not save appointment update:`, saveError.message);
          }
        }
        
        return appointmentObj;
      })
    );
    
    console.log(`📤 Returning ${fixedAppointments.length} appointments with complete details`);
    
    res.json({
      success: true,
      appointments: fixedAppointments
    });
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments: ' + error.message
    });
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

// Get booked times
router.get('/booked-times/check', appointmentController.getBookedTimes);

// Get break times for a specific date
router.get('/break-times/check', appointmentController.getBreakTimes);

// Check appointment reminder status
router.get('/reminder-status', appointmentController.checkReminderStatus);

// Test reminder - manually send a reminder email
router.get('/test-reminder', appointmentController.testReminder);

// Create appointment with business logic
router.post('/create', async (req, res) => {
  try {
    const { 
      date, 
      time, 
      customerName,
      customerEmail,
      businessEmail,
      service,
      notes
    } = req.body;
    
    console.log('\n========== APPOINTMENT CREATE REQUEST ==========');
    console.log('📝 Request body:', req.body);
    console.log('📝 Service field:', service);
    console.log('📝 Service type:', typeof service);
    console.log('========== END REQUEST DEBUG ==========\n');
    
    // VALIDATE required fields
    if (!service || service.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Service is required'
      });
    }
    
    console.log('📝 Creating appointment for business:', businessEmail);
    
    // VALIDATE PAST DATE
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments for past dates. Please select today or a future date.'
      });
    }
    
    // VALIDATE PAST TIME (if booking for today)
    if (appointmentDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
      const appointmentTime = hours * 60 + minutes;
      
      if (appointmentTime <= currentTime) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book appointments for past times. Please select a future time.'
        });
      }
    }
    
    // AUTOMATICALLY FETCH BUSINESS DETAILS
    const business = await Business.findOne({ email: businessEmail });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }
    
    console.log('🏢 Found business:', business.businessName);
    
    // Create appointment with COMPLETE business details
    const appointment = new Appointment({
      customerName: customerName,
      customerEmail: customerEmail,
      businessEmail: businessEmail,
      businessName: business.businessName,
      businessAddress: business.businessAddress,
      service: service,
      date: date,
      time: time,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date()
    });
    
    const savedAppointment = await appointment.save();
    
    console.log('✅ Appointment created with complete details:', {
      id: savedAppointment._id,
      customerName: savedAppointment.customerName,
      businessName: savedAppointment.businessName,
      service: savedAppointment.service
    });

    // QUEUE APPOINTMENT CONFIRMATION EMAILS
    try {
      console.log('\n📧 [EMAIL QUEUEING] Starting email process for appointment:', savedAppointment._id);
      
      const appointmentDate = new Date(date);
      const appointmentDateStr = appointmentDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      const emailVariables = {
        customerName: customerName,
        businessName: business.businessName,
        businessAddress: business.businessAddress,
        businessEmail: business.email,
        businessPhone: business.phone,
        appointmentDate: appointmentDateStr,
        appointmentTime: time,
        serviceName: service,
        businessId: business._id,
        customerId: null // Will be set after looking up user
      };
      
      // Try to find the customer in User collection to get their ObjectId
      let customerId = null;
      try {
        const customer = await User.findOne({ email: customerEmail });
        if (customer) {
          customerId = customer._id;
          console.log('👤 Found registered customer:', customer.email);
        } else {
          console.log('📝 Customer not registered in system, using null for customerId');
        }
      } catch (lookupError) {
        console.log('⚠️ Error looking up customer:', lookupError.message);
      }
      
      emailVariables.customerId = customerId;

      // 1. Send BOOKING CONFIRMATION email immediately
      console.log('📬 Queueing booking_confirmation email...');
      await addEmailToQueue(
        'booking_confirmation',
        customerEmail,
        customerName,
        emailVariables,
        savedAppointment._id,
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
          customerEmail,
          customerName,
          emailVariables,
          savedAppointment._id,
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
          customerEmail,
          customerName,
          emailVariables,
          savedAppointment._id,
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
          customerEmail: customerEmail,
          customerPhone: req.body.customerPhone || 'N/A',
          notes: notes || 'No special notes'
        },
        savedAppointment._id,
        0 // Send immediately
      );
      console.log('✅ Manager alert queued');

      console.log('✉️ All appointment emails queued successfully');
    } catch (emailError) {
      console.error('\n❌ Error queuing emails (but appointment was created)');
      console.error('   Error:', emailError.message);
      // Don't fail the appointment if email queueing fails
    }
    
    res.json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: savedAppointment
    });
    
  } catch (error) {
    console.error('❌ Appointment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment: ' + error.message
    });
  }
});

// Complete appointment route
router.put('/:id/complete', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    console.log('🎯 Marking appointment as complete:', appointmentId);
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: false
      }
    );
    
    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    console.log('✅ Appointment completed successfully:', updatedAppointment._id);
    
    res.json({
      success: true,
      message: 'Service marked as completed successfully',
      appointment: updatedAppointment
    });
    
  } catch (error) {
    console.error('❌ Error completing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete service: ' + error.message
    });
  }
});

// Rate appointment
router.post('/rate', async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    
    console.log('📊 Rating submission request:', { appointmentId, rating, comment });
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed appointments can be rated'
      });
    }
    
    // Check if already rated - handle both number and object ratings
    if (appointment.rating) {
      if (typeof appointment.rating === 'number' || 
          (typeof appointment.rating === 'object' && appointment.rating.rating)) {
        return res.status(400).json({
          success: false,
          message: 'This appointment has already been rated'
        });
      }
    }
    
    // Update appointment with rating - save as number for compatibility
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        $set: {
          rating: parseInt(rating), // Save as number for easier querying
          ratedAt: new Date()
        }
      },
      { new: true }
    );
    
    console.log('✅ Rating saved successfully:', updatedAppointment.rating);
    
    res.json({
      success: true,
      message: 'Rating submitted successfully',
      appointment: updatedAppointment
    });
    
  } catch (error) {
    console.error('❌ Error submitting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating: ' + error.message
    });
  }
});

// SINGLE RATINGS ROUTE - This handles all rating queries
router.get('/ratings/:businessEmail', async (req, res) => {
  try {
    const { businessEmail } = req.params;
    console.log('⭐ Fetching ratings for:', businessEmail);
    
    // Get all appointments with ratings (both number and object format)
    const appointments = await Appointment.find({
      businessEmail: businessEmail,
      status: 'completed',
      $or: [
        { rating: { $exists: true, $ne: null, $gte: 1 } }, // Number format
        { 'rating.rating': { $exists: true, $gte: 1 } }    // Object format
      ]
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${appointments.length} rated appointments`);

    if (appointments.length === 0) {
      return res.json({
        success: true,
        statistics: {
          averageRating: 0,
          totalRatings: 0,
          ratingBreakdown: [0, 0, 0, 0, 0]
        },
        recentReviews: [],
        allReviews: []
      });
    }

    // Calculate statistics - handle both rating formats
    let totalRatingPoints = 0;
    let validRatings = 0;
    
    appointments.forEach(apt => {
      let ratingValue;
      
      // Handle both number and object rating formats
      if (typeof apt.rating === 'number') {
        ratingValue = apt.rating;
      } else if (apt.rating && apt.rating.rating) {
        ratingValue = apt.rating.rating;
      }
      
      if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
        totalRatingPoints += ratingValue;
        validRatings++;
      }
    });

    const averageRating = validRatings > 0 ? 
      Number((totalRatingPoints / validRatings).toFixed(1)) : 0;

    // Rating breakdown
    const ratingBreakdown = [0, 0, 0, 0, 0];
    appointments.forEach(apt => {
      let ratingValue;
      
      if (typeof apt.rating === 'number') {
        ratingValue = apt.rating;
      } else if (apt.rating && apt.rating.rating) {
        ratingValue = apt.rating.rating;
      }
      
      if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
        ratingBreakdown[ratingValue - 1]++;
      }
    });

    // Build response
    const response = {
      success: true,
      statistics: {
        averageRating: averageRating,
        totalRatings: validRatings,
        ratingBreakdown: ratingBreakdown
      },
      recentReviews: appointments.slice(0, 10).map(apt => ({
        id: apt._id,
        customerName: apt.customerName || 'Customer',
        customerInitial: (apt.customerName || 'C').charAt(0).toUpperCase(),
        rating: typeof apt.rating === 'number' ? apt.rating : apt.rating?.rating || 0,
        service: apt.service,
        appointmentDate: apt.date,
        appointmentTime: apt.time,
        ratedAt: apt.ratedAt || apt.updatedAt || apt.createdAt,
        customerPhone: apt.customerPhone || 'N/A',
        notes: apt.notes || '',
        daysAgo: Math.floor((Date.now() - new Date(apt.ratedAt || apt.updatedAt || apt.createdAt)) / (1000 * 60 * 60 * 24))
      })),
      allReviews: appointments.map(apt => ({
        id: apt._id,
        customerName: apt.customerName || 'Customer',
        customerInitial: (apt.customerName || 'C').charAt(0).toUpperCase(),
        rating: typeof apt.rating === 'number' ? apt.rating : apt.rating?.rating || 0,
        service: apt.service,
        appointmentDate: apt.date,
        appointmentTime: apt.time,
        ratedAt: apt.ratedAt || apt.updatedAt || apt.createdAt,
        customerPhone: apt.customerPhone || 'N/A',
        notes: apt.notes || ''
      }))
    };

    console.log('📈 Final statistics:', response.statistics);
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings: ' + error.message
    });
  }
});

module.exports = router;