const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Import Business model
const Business = require('./models/Business'); // <-- Add this line

// Import business routes
const businessRoutes = require('./routes/businessRoutes');
app.use('/api', businessRoutes);

// Other routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/business-services', require('./routes/serviceRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// New route to get businesses by type
app.get('/api/businesses', async (req, res) => {
  const { type } = req.query;
  try {
    const businesses = await Business.find(type ? { businessType: type } : {});
    res.json({ success: true, businesses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// or in your businessRoutes.js if you use routers
app.get('/api/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, business });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));