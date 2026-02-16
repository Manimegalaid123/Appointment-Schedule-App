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