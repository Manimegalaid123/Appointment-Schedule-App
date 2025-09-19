const express = require('express');
const router = express.Router();
const User = require('../models/User'); // adjust path if needed

// Add this route
router.get('/customer/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;