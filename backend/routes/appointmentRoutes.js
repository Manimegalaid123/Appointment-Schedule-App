const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const sendMail = require('../utils/sendMail');

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

// FIXED: Get booked times - moved to correct path
router.get('/booked-times/check', appointmentController.getBookedTimes);

// CREATE: New endpoint to create appointment with business logic
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
      businessName: business.businessName,      // AUTOMATICALLY FETCHED
      businessAddress: business.businessAddress, // AUTOMATICALLY FETCHED
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

// REPLACE your rating route in appointmentRoutes.js with this complete version
router.post('/rate', async (req, res) => {
  try {
    const { appointmentId, rating } = req.body;
    
    console.log('🌟 Rating submission:', { appointmentId, rating });
    
    // Validate input
    if (!appointmentId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid appointment ID or rating' 
      });
    }
    
    // Find and update appointment
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { rating: rating },
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }
    
    console.log('✅ Appointment rating updated');
    console.log('📧 Business email:', appointment.businessEmail);
    
    // Update business rating - THIS IS THE KEY PART
    try {
      const business = await Business.findOne({ email: appointment.businessEmail });
      if (business) {
        console.log(`📍 Found business: ${business.businessName}`);
        
        // Initialize ratings array if it doesn't exist
        if (!business.ratings) {
          business.ratings = [];
        }
        
        // Check if rating already exists for this appointment
        const existingRatingIndex = business.ratings.findIndex(
          r => r.appointmentId && r.appointmentId.toString() === appointmentId
        );
        
        if (existingRatingIndex >= 0) {
          // Update existing rating
          console.log('🔄 Updating existing rating');
          business.ratings[existingRatingIndex].rating = rating;
        } else {
          // Add new rating
          console.log('➕ Adding new rating');
          business.ratings.push({
            appointmentId: appointmentId,
            rating: rating,
            customerId: appointment.customerEmail,
            customerName: appointment.customerName || 'Customer',
            service: appointment.service,
            createdAt: new Date()
          });
        }
        
        // Calculate new average rating
        const totalRating = business.ratings.reduce((sum, r) => sum + r.rating, 0);
        business.averageRating = Math.round((totalRating / business.ratings.length) * 10) / 10;
        business.totalRatings = business.ratings.length;
        
        console.log('🧮 Calculated ratings:', {
          totalRating,
          ratingsCount: business.ratings.length,
          averageRating: business.averageRating,
          totalRatings: business.totalRatings
        });
        
        await business.save();
        
        console.log('🎉 Business rating updated successfully:', {
          businessName: business.businessName,
          newAverageRating: business.averageRating,
          totalRatings: business.totalRatings
        });
        
        // Verify the save worked
        const verifyBusiness = await Business.findOne({ email: appointment.businessEmail });
        console.log('✅ Verification - Business rating after save:', {
          averageRating: verifyBusiness.averageRating,
          totalRatings: verifyBusiness.totalRatings
        });
        
      } else {
        console.log('❌ Business not found with email:', appointment.businessEmail);
      }
    } catch (businessError) {
      console.log('⚠️ Business rating update failed:', businessError.message);
      console.error(businessError);
    }
    
    res.json({ 
      success: true, 
      message: 'Rating submitted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error submitting rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// Complete appointment route - ADD THIS
router.put('/:id/complete', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    // Only allow completion if appointment is accepted
    if (appointment.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only accepted appointments can be marked as completed' 
      });
    }
    
    appointment.status = 'completed';
    appointment.completedAt = new Date();
    appointment.updatedAt = new Date();
    await appointment.save();
    
    res.json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add this debug route to appointmentRoutes.js
router.get('/debug/:email', async (req, res) => {
  try {
    const appointments = await Appointment.find({ customerEmail: req.params.email });
    console.log('=== APPOINTMENT DEBUG ===');
    appointments.forEach((app, idx) => {
      console.log(`Appointment ${idx}:`, {
        id: app._id,
        businessName: app.businessName,
        businessAddress: app.businessAddress,
        businessEmail: app.businessEmail,
        service: app.service
      });
    });
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this one-time sync route to appointmentRoutes.js
router.post('/sync-existing-ratings', async (req, res) => {
  try {
    // Find all appointments with ratings
    const ratedAppointments = await Appointment.find({ 
      rating: { $exists: true, $ne: null, $gte: 1 } 
    });
    
    console.log(`📊 Found ${ratedAppointments.length} rated appointments`);
    
    let syncedBusinesses = 0;
    
    for (let appointment of ratedAppointments) {
      console.log(`🔄 Processing appointment ${appointment._id} with rating ${appointment.rating}`);
      
      const business = await Business.findOne({ email: appointment.businessEmail });
      if (business) {
        console.log(`📍 Found business: ${business.businessName}`);
        
        // Initialize ratings array if it doesn't exist
        if (!business.ratings) {
          business.ratings = [];
        }
        
        // Check if rating already exists for this appointment
        const existingRatingIndex = business.ratings.findIndex(
          r => r.appointmentId && r.appointmentId.toString() === appointment._id.toString()
        );
        
        if (existingRatingIndex === -1) {
          // Add rating if it doesn't exist
          business.ratings.push({
            appointmentId: appointment._id,
            rating: appointment.rating,
            customerId: appointment.customerEmail,
            customerName: appointment.customerName || 'Customer',
            service: appointment.service,
            createdAt: appointment.createdAt || new Date()
          });
          
          console.log(`➕ Added rating ${appointment.rating} for ${appointment.service}`);
        }
        
        // Recalculate average rating
        const totalRating = business.ratings.reduce((sum, r) => sum + r.rating, 0);
        business.averageRating = Math.round((totalRating / business.ratings.length) * 10) / 10;
        business.totalRatings = business.ratings.length;
        
        await business.save();
        syncedBusinesses++;
        
        console.log(`✅ ${business.businessName} updated - Average: ${business.averageRating}, Total: ${business.totalRatings}`);
      }
    }
    
    res.json({
      success: true,
      message: `Synced ratings for ${syncedBusinesses} businesses`,
      processedAppointments: ratedAppointments.length,
      syncedBusinesses
    });
    
  } catch (error) {
    console.error('❌ Error syncing ratings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this to appointmentRoutes.js to see what ratings exist
router.get('/debug-all-ratings', async (req, res) => {
  try {
    console.log('🔍 Checking all appointments with ratings...');
    
    const allAppointments = await Appointment.find({});
    console.log(`📋 Total appointments: ${allAppointments.length}`);
    
    const ratedAppointments = await Appointment.find({
      rating: { $exists: true, $ne: null }
    });
    console.log(`⭐ Appointments with ratings: ${ratedAppointments.length}`);
    
    const appointmentsByBusiness = {};
    
    ratedAppointments.forEach(app => {
      if (!appointmentsByBusiness[app.businessEmail]) {
        appointmentsByBusiness[app.businessEmail] = [];
      }
      appointmentsByBusiness[app.businessEmail].push({
        service: app.service,
        rating: app.rating,
        customerEmail: app.customerEmail,
        date: app.date
      });
    });
    
    console.log('📊 Ratings by business:');
    Object.keys(appointmentsByBusiness).forEach(businessEmail => {
      const ratings = appointmentsByBusiness[businessEmail];
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      console.log(`   ${businessEmail}: ${ratings.length} ratings, avg: ${avg.toFixed(1)}`);
    });
    
    res.json({
      success: true,
      totalAppointments: allAppointments.length,
      ratedAppointments: ratedAppointments.length,
      ratingsByBusiness: appointmentsByBusiness
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;