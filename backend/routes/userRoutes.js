const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/customer/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email).trim();
  try {
    const user = await User.findOne({ email });
    if (user) {
      res.json({ success: true, name: user.name });
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;