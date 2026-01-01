const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads/businessImages');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET business by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log('🔍 Fetching business by email:', email);
    
    const business = await Business.findOne({ email: email });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }
    
    console.log('✅ Business found:', business.businessName);
    
    res.json({
      success: true,
      business: business
    });
    
  } catch (error) {
    console.error('❌ Error fetching business by email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business details'
    });
  }
});

// Update business profile with image - ✅ Add detailed logging
router.put('/update-profile/:email', upload.single('businessImage'), async (req, res) => {
  try {
    const { businessName, businessAddress, workingHours, phone } = req.body;
    
    console.log('📝 Update profile request:', { 
      email: req.params.email, 
      businessName, 
      businessAddress,
      workingHours,
      phone,
      hasFile: !!req.file 
    });
    
    // Find existing business first
    const existingBusiness = await Business.findOne({ email: req.params.email });
    if (!existingBusiness) {
      console.log('❌ Business not found for update:', req.params.email);
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    const updateData = {
      businessName: businessName || existingBusiness.businessName,
      businessAddress: businessAddress || existingBusiness.businessAddress,
      workingHours: workingHours || existingBusiness.workingHours,
      phone: phone || existingBusiness.phone
    };
    
    // Only update imageUrl if a new file is uploaded
    if (req.file) {
      updateData.imageUrl = `/uploads/businessImages/${req.file.filename}`;
      console.log('🖼️ New image uploaded:', updateData.imageUrl);
    }
    
    console.log('📦 Update data:', updateData);
    
    const business = await Business.findOneAndUpdate(
      { email: req.params.email },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!business) {
      console.log('❌ Failed to update business');
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    console.log('✅ Business updated successfully:', {
      name: business.businessName,
      email: business.email,
      imageUrl: business.imageUrl,
      address: business.businessAddress
    });
    
    res.json({ success: true, business });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add service to business
router.post('/email/:email/add-service', async (req, res) => {
  try {
    const { service } = req.body;
    const business = await Business.findOneAndUpdate(
      { email: req.params.email },
      { $addToSet: { services: service } },
      { new: true }
    );
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    res.json({ success: true, services: business.services });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update business by ID (for backward compatibility)
router.put('/:id', async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    res.json({ success: true, business });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all businesses or filter by type
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type) {
      query.businessType = type;
    }
    
    const businesses = await Business.find(query)
      .select('-password') // Exclude password from response
      .lean(); // Convert to plain objects for better performance
    
    res.json({ success: true, businesses });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ADD THIS DEBUG ROUTE - Remove after fixing
router.get('/debug', async (req, res) => {
  try {
    const businesses = await Business.find().limit(5);
    
    console.log('=== DATABASE DEBUG ===');
    businesses.forEach((biz, idx) => {
      console.log(`Business ${idx}:`, {
        name: biz.businessName,
        services: biz.services,
        servicesType: typeof biz.services,
        isArray: Array.isArray(biz.services)
      });
    });
    
    res.json({ 
      success: true, 
      debug: businesses.map(b => ({
        name: b.businessName,
        services: b.services,
        servicesType: typeof b.services,
        isArray: Array.isArray(b.services)
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADD THIS ONE-TIME FIX ROUTE - Remove after running once
router.post('/fix-services', async (req, res) => {
  try {
    const businesses = await Business.find();
    let fixedCount = 0;
    
    for (let business of businesses) {
      if (!Array.isArray(business.services)) {
        console.log(`Fixing services for ${business.businessName}`);
        console.log('Before:', business.services);
        
        if (typeof business.services === 'object' && business.services !== null) {
          // Convert object to array
          business.services = Object.values(business.services).filter(service => 
            typeof service === 'string' && 
            service !== 'rating' && 
            service !== '_id' &&
            service.trim() !== ''
          );
        } else {
          business.services = [];
        }
        
        console.log('After:', business.services);
        await business.save();
        fixedCount++;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Fixed ${fixedCount} businesses` 
    });
  } catch (error) {
    console.error('Error fixing services:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this debug route to check business ratings
router.get('/debug-ratings', async (req, res) => {
  try {
    const businesses = await Business.find({}, 'businessName averageRating totalRatings ratings');
    
    console.log('=== BUSINESS RATINGS DEBUG ===');
    businesses.forEach((biz, idx) => {
      console.log(`${idx + 1}. ${biz.businessName}:`, {
        averageRating: biz.averageRating || 'undefined',
        totalRatings: biz.totalRatings || 'undefined',
        ratingsCount: biz.ratings?.length || 0
      });
    });
    
    res.json({ 
      success: true, 
      businesses: businesses.map(biz => ({
        name: biz.businessName,
        averageRating: biz.averageRating,
        totalRatings: biz.totalRatings,
        ratingsCount: biz.ratings?.length || 0
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to businessRoutes.js - Check individual business rating
router.get('/check-rating/:email', async (req, res) => {
  try {
    const business = await Business.findOne({ email: req.params.email });
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    res.json({
      success: true,
      businessName: business.businessName,
      averageRating: business.averageRating,
      totalRatings: business.totalRatings,
      individualRatings: business.ratings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this route to initialize rating fields for existing businesses
router.post('/init-rating-fields', async (req, res) => {
  try {
    const businesses = await Business.find();
    let updatedCount = 0;
    
    for (let business of businesses) {
      // Only update if rating fields are missing
      if (business.averageRating === undefined || business.totalRatings === undefined) {
        business.averageRating = 0;
        business.totalRatings = 0;
        business.ratings = business.ratings || [];
        
        await business.save();
        updatedCount++;
        
        console.log(`✅ Added rating fields to ${business.businessName}`);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Added rating fields to ${updatedCount} businesses`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error initializing rating fields:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this SIMPLE rating update route to businessRoutes.js
router.post('/update-ratings-direct', async (req, res) => {
  try {
    console.log('🔄 Starting direct rating update...');
    
    // Get all businesses
    const businesses = await Business.find();
    console.log(`📋 Found ${businesses.length} businesses`);
    
    for (let business of businesses) {
      console.log(`\n🏢 Processing: ${business.businessName} (${business.email})`);
      
      // Find all rated appointments for this business
      const ratedAppointments = await Appointment.find({
        businessEmail: business.email,
        rating: { $exists: true, $ne: null, $gte: 1 }
      });
      
      console.log(`📊 Found ${ratedAppointments.length} rated appointments for ${business.businessName}`);
      
      if (ratedAppointments.length > 0) {
        // Calculate average
        const totalRating = ratedAppointments.reduce((sum, app) => sum + app.rating, 0);
        const averageRating = Math.round((totalRating / ratedAppointments.length) * 10) / 10;
        
        console.log(`📈 Calculated average: ${averageRating} from ${ratedAppointments.length} ratings`);
        
        // Update business directly
        business.averageRating = averageRating;
        business.totalRatings = ratedAppointments.length;
        
        // Create ratings array
        business.ratings = ratedAppointments.map(app => ({
          appointmentId: app._id,
          rating: app.rating,
          customerId: app.customerEmail,
          customerName: app.customerName || 'Customer',
          service: app.service,
          createdAt: app.createdAt || new Date()
        }));
        
        await business.save();
        console.log(`✅ Updated ${business.businessName}: ${averageRating} stars, ${ratedAppointments.length} reviews`);
      } else {
        console.log(`ℹ️ No ratings found for ${business.businessName}`);
      }
    }
    
    res.json({
      success: true,
      message: 'Direct rating update completed',
      businessCount: businesses.length
    });
    
  } catch (error) {
    console.error('❌ Direct update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE service from business
router.delete('/:businessId/service/:serviceName', async (req, res) => {
  try {
    const { businessId, serviceName } = req.params;
    
    const business = await Business.findByIdAndUpdate(
      businessId,
      { $pull: { services: serviceName } },
      { new: true }
    );
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Service deleted successfully',
      business 
    });
  } catch (error) {
    console.error('❌ Delete service error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADD break/lunch time
router.post('/:businessId/breaks', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { day, startTime, endTime, breakType, description } = req.body;
    
    const business = await Business.findByIdAndUpdate(
      businessId,
      { 
        $push: { 
          breaks: { day, startTime, endTime, breakType, description }
        }
      },
      { new: true }
    );
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Break added successfully',
      business 
    });
  } catch (error) {
    console.error('❌ Add break error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE break/lunch time
router.delete('/:businessId/breaks/:breakId', async (req, res) => {
  try {
    const { businessId, breakId } = req.params;
    
    const business = await Business.findByIdAndUpdate(
      businessId,
      { $pull: { breaks: { _id: breakId } } },
      { new: true }
    );
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Break deleted successfully',
      business 
    });
  } catch (error) {
    console.error('❌ Delete break error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET business breaks
router.get('/:businessId/breaks', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await Business.findById(businessId);
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    res.json({ 
      success: true, 
      breaks: business.breaks || []
    });
  } catch (error) {
    console.error('❌ Get breaks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get business with service durations and buffer time
router.get('/:businessId/services-with-duration', async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findById(businessId);
    
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    res.json({
      success: true,
      services: business.services || [],
      bufferTime: business.bufferTime || 0,
      reminderSettings: business.reminderSettings || {}
    });
  } catch (error) {
    console.error('❌ Get services error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update business buffer time and reminder settings
router.put('/:businessId/settings', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { bufferTime, reminderSettings } = req.body;

    const business = await Business.findByIdAndUpdate(
      businessId,
      {
        bufferTime: bufferTime || 0,
        reminderSettings: reminderSettings || {}
      },
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      business
    });
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;