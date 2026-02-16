const mongoose = require('mongoose');

const emailQueueSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['booking_confirmation', 'reminder_24h', 'reminder_1h', 'status_update', 'rating_request', 'new_booking_alert'],
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  recipientName: String,
  appointmentId: mongoose.Schema.Types.ObjectId,
  businessId: mongoose.Schema.Types.ObjectId,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Can be null for unregistered customers
  },
  
  subject: {
    type: String,
    required: true
  },
  variables: mongoose.Schema.Types.Mixed,
  
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  scheduledFor: {
    type: Date,
    default: () => new Date()
  },
  sentAt: Date,
  failureReason: String,
  
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
});

// Index for efficient querying
emailQueueSchema.index({ status: 1, scheduledFor: 1 });
emailQueueSchema.index({ appointmentId: 1 });
emailQueueSchema.index({ createdAt: 1 });

module.exports = mongoose.model('EmailQueue', emailQueueSchema);
