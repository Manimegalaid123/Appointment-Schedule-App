const express = require('express');
const router = express.Router();
const Business = require('../models/Business'); // Adjust path if needed

router.get('/email/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const business = await Business.findOne({ email });
    if (business) {
      res.json({ success: true, business });
    } else {
      res.json({ success: false, message: 'Consultant not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/email/:email/add-service', async (req, res) => {
  const email = req.params.email;
  const { service } = req.body;
  try {
    const business = await Business.findOne({ email });
    if (!business) return res.json({ success: false, message: 'Consultant not found' });
    if (!business.services.includes(service)) {
      business.services.push(service);
      await business.save();
    }
    res.json({ success: true, services: business.services });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, phone, address, password, role, businessType, businessData } = req.body;

    // Check if user/business already exists
    const exists = await Business.findOne({ email });
    if (exists) return res.json({ success: false, message: 'Email already registered.' });

    // Prepare business fields if manager
    let businessFields = {};
    if (role === 'manager' && businessData) {
      businessFields = {
        businessType,
        businessName: businessData.businessName,
        businessAddress: businessData.businessAddress,
        services: businessData.services || [],
        workingHours: businessData.workingHours,
        specialization: businessData.specialization,
        doctors: businessData.doctors || [],
        courses: businessData.courses || []
      };
    }

    // Create new business/user
    const business = new Business({
      name,
      email,
      phone,
      address,
      password,
      role,
      ...businessFields
    });

    await business.save();
    res.json({ success: true, message: 'Account created successfully!', business });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/business/register', async (req, res) => {
  try {
    const { name, email, phone, address, password, role, businessType, businessData } = req.body;

    // Check if user/business already exists
    const exists = await Business.findOne({ email });
    if (exists) return res.json({ success: false, message: 'Email already registered.' });

    // Prepare business fields if manager
    let businessFields = {};
    if (role === 'manager' && businessData) {
      businessFields = {
        businessType,
        businessName: businessData.businessName,
        businessAddress: businessData.businessAddress,
        services: businessData.services || [],
        workingHours: businessData.workingHours,
        specialization: businessData.specialization,
        doctors: businessData.doctors || [],
        courses: businessData.courses || []
      };
    }

    // Create new business/user
    const business = new Business({
      name,
      email,
      phone,
      address,
      password,
      role,
      ...businessFields
    });

    await business.save();
    res.json({ success: true, message: 'Account created successfully!', business });
  } catch (err) {
    console.error('Registration error:', err); // <-- This will show the error in your backend terminal
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

router.get('/business/email/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email).trim(); // decode and trim!
  try {
    const business = await Business.findOne({ email });
    if (business) {
      res.json({ success: true, business });
    } else {
      res.json({ success: false, message: 'Business not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/business/email/:email/add-service', async (req, res) => {
  const email = decodeURIComponent(req.params.email); // decode email!
  const { service } = req.body;
  try {
    const business = await Business.findOne({ email });
    if (!business) return res.json({ success: false, message: 'Business not found' });
    if (!business.services.includes(service)) {
      business.services.push(service);
      await business.save();
    }
    res.json({ success: true, services: business.services });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;