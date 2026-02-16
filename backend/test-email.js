const dotenv = require('dotenv');
dotenv.config();

const { sendEmail } = require('./utils/sendMail');

// Test email sending
const testEmail = async () => {
  try {
    console.log('🧪 Testing email sending...');
    console.log(`📧 Using email: ${process.env.EMAIL_USER}`);
    console.log(`🔐 App password configured: ${process.env.EMAIL_PASSWORD ? 'YES' : 'NO'}`);
    console.log(`📬 Debug mode: ${process.env.EMAIL_DEBUG_MODE}`);

    const result = await sendEmail({
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '🧪 Test Email - Appointend System',
      html: '<h1>Test Email</h1><p>If you see this, emails are working!</p>'
    });

    console.log('✅ Email test successful!');
    console.log(`Message ID: ${result.messageId}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Email test failed!');
    console.error(`Error: ${error.message}`);
    console.error(`Full error:`, error);
    process.exit(1);
  }
};

testEmail();
