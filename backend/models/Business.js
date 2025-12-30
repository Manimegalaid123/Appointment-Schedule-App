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