const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Business = require('../models/Business');

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

// Get business by email - ✅ Add detailed logging
router.get('/email/:email', async (req, res) => {
  try {
    console.log('🔍 Fetching business by email:', req.params.email);
    const business = await Business.findOne({ email: req.params.email });
    
    if (!business) {
      console.log('❌ Business not found for email:', req.params.email);
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    
    console.log('✅ Business found:', {
      name: business.businessName,
      email: business.email,
      imageUrl: business.imageUrl,
      address: business.businessAddress
    });
    
    res.json({ success: true, business });
  } catch (error) {
    console.error('❌ Get business by email error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

module.exports = router;