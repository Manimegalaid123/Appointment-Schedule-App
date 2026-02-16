const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const EmailQueue = require('./models/EmailQueue');

// Test EmailQueue model
const testEmailQueue = async () => {
  try {
    console.log('🧪 Testing EmailQueue model...');
    console.log(`🗄️  MongoDB URI: ${process.env.MONGO_URI}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Try to add an email to queue
    const emailJob = new EmailQueue({
      type: 'booking_confirmation',
      recipient: 'test@example.com',
      recipientName: 'Test User',
      subject: 'Test Email',
      variables: { test: 'data' },
      scheduledFor: new Date()
    });

    await emailJob.save();
    console.log('✅ Email saved to queue successfully!');
    console.log(`   ID: ${emailJob._id}`);

    // Check stats
    const count = await EmailQueue.countDocuments();
    console.log(`✅ Total emails in queue: ${count}`);

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed!');
    console.error(`Error: ${error.message}`);
    console.error(`Full error:`, error);
    process.exit(1);
  }
};

testEmailQueue();
