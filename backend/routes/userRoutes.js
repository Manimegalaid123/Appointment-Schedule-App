const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/User'); // Ensure the User model is required

router.get('/customer/:email', async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  if (!user) return res.status(404).json({ success: false });
  res.json({ success: true, name: user.name });
});

module.exports = router;