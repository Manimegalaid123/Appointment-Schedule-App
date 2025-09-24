const User = require('../models/User');
const Business = require('../models/Business');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, role, businessType, businessData } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = new User({ name, email, phone, password: hashedPassword, role });
    await user.save();

    // If manager, create business with all details
    if (role === 'manager' && businessData) {
      const business = new Business({
        businessName: businessData.businessName || name,
        businessType: businessType,
        businessAddress: businessData.businessAddress || 'Not specified',
        phone: phone,
        email: email,
        workingHours: businessData.workingHours || '9:00 AM - 6:00 PM',
        services: businessData.services || [],
        owner: user._id // ✅ Add this line
      });
      await business.save();
    }

    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // If manager, get businessType
    let businessType = null;
    let businessName = null;
    if (role === 'manager') {
      // ✅ Search by email instead of owner
      const business = await Business.findOne({ email: user.email });
      businessType = business ? business.businessType : null;
      businessName = business ? business.businessName : null;
    }

    res.json({
      token,
      role: user.role,
      name: user.name,
      businessType,
      businessName
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};