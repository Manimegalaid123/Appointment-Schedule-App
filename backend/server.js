const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Import business routes
const businessRoutes = require('./routes/businessRoutes');
app.use('/api', businessRoutes);

// Other routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/business-services', require('./routes/serviceRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));