const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const User = require('../models/User'); // Ensure the User model is required

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  try {
    if (role === 'customer') {
      const user = new User({ name, email, password, role, phone });
      await user.save();
      res.json({ success: true, user });
    } else if (role === 'manager') {
      // Example: create a new manager user/business
      const user = new User({ name, email, password, role, phone });
      await user.save();
      res.json({ success: true, user });
    } else if (role === 'consultant') {
      // Add consultant registration logic here
    } else {
      res.json({ success: false, message: 'Invalid role' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;