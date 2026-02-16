const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const connectDB = require('./config/db');
connectDB();

// Initialize reminder scheduler
const { initializeReminderScheduler } = require('./utils/appointmentReminder');
initializeReminderScheduler();

// Initialize email worker
const { processEmailQueue } = require('./workers/emailWorker');
console.log('📧 Email worker initialized - checking queue every 1 minute');
setInterval(() => {
  processEmailQueue();
}, 60000); // Check every 60 seconds

// Run once at startup
processEmailQueue();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Add this line to serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Business model
const Business = require('./models/Business');

// Import business routes
const businessRoutes = require('./routes/businessRoutes');
app.use('/api/business', businessRoutes); // ✅ Fix: use /api/business prefix

// Other routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/business-services', require('./routes/serviceRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is working on port 5000!' });
});

// Business routes
app.get('/api/businesses', async (req, res) => {
  const { type } = req.query;
  try {
    const businesses = await Business.find(type ? { businessType: type } : {});
    res.json({ success: true, businesses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
});