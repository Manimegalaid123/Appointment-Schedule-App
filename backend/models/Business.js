const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  businessAddress: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  workingHours: { type: String, required: true },
  imageUrl: { type: String },
  services: [String],
  
  // Break times management
  breaks: [
    {
      day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      startTime: String, // "13:00" format (1 PM)
      endTime: String,   // "14:00" format (2 PM)
      breakType: { type: String, enum: ['Lunch', 'Leave', 'Break'] },
      description: String
    }
  ],
  
  // Buffer time between appointments (in minutes)
  bufferTime: { type: Number, default: 0 }, // e.g., 15 minutes for cleanup
  
  // Appointment reminder settings
  reminderSettings: {
    enableEmailReminder: { type: Boolean, default: true },
    enableSMSReminder: { type: Boolean, default: false },
    reminderBefore24h: { type: Boolean, default: true }, // 24 hours before
    reminderBefore1h: { type: Boolean, default: true }   // 1 hour before
  },
  
  // Email credentials for sending reminders (each salon uses their own email)
  emailCredentials: {
    smtpEmail: { type: String, default: null }, // Salon's Gmail address (e.g., hari@gmail.com)
    smtpPassword: { type: String, default: null }, // Gmail app password
    useDefaultSMTP: { type: Boolean, default: true } // Use system default SMTP if true
  },
  
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Method to calculate average rating
BusinessSchema.methods.calculateAverageRating = function() {
  if (this.ratings && this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  }
  return this.save();
};

module.exports = mongoose.model('Business', BusinessSchema);