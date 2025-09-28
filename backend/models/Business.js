const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  businessAddress: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  workingHours: { type: String, required: true },
  imageUrl: { type: String },
  services: [String],
  
  // ADD these fields if missing:
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
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const total = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = Math.round((total / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
  return this.save();
};

module.exports = mongoose.model('Business', BusinessSchema);