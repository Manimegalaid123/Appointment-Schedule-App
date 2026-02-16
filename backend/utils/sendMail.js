const nodemailer = require('nodemailer');

// Create ONE shared transporter for entire platform
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
    pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || ''
  }
});

/**
 * Send email using shared Appointend email
 * @param {object} emailConfig - Email configuration
 * @param {string} emailConfig.to - Recipient email
 * @param {string} emailConfig.subject - Email subject
 * @param {string} emailConfig.html - HTML content
 * @param {string} emailConfig.replyTo - Reply-to email (optional)
 * @returns {object} Result with success status and messageId
 */
const sendEmail = async (emailConfig) => {
  try {
    // Use debug mode if enabled (for testing without real SMTP)
    if (process.env.EMAIL_DEBUG_MODE === 'true') {
      console.log('📧 [DEBUG MODE] Email would be sent:');
      console.log(`   To: ${emailConfig.to}`);
      console.log(`   Subject: ${emailConfig.subject}`);
      console.log(`   Reply-To: ${emailConfig.replyTo || 'noreply@appointend.com'}`);
      return { success: true, messageId: `debug-${Date.now()}` };
    }

    const mailOptions = {
      // Use shared company email
      from: `${process.env.EMAIL_FROM_NAME || 'Appointend'} <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'noreply@appointend.com'}>`,
      
      // Business can be set as reply-to (so replies go to business)
      replyTo: emailConfig.replyTo || process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
      
      to: emailConfig.to,
      subject: emailConfig.subject,
      html: emailConfig.html
    };

    console.log(`\n📨 Sending email through Appointend...`);
    console.log(`   From: ${mailOptions.from}`);
    console.log(`   To: ${emailConfig.to}`);
    console.log(`   Reply-To: ${mailOptions.replyTo}`);
    console.log(`   Subject: ${emailConfig.subject}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`\n❌ Error sending email:`);
    console.error(`   Error: ${error.message}`);
    
    // If SMTP not configured, provide helpful error
    if (!process.env.EMAIL_USER && process.env.EMAIL_DEBUG_MODE !== 'true') {
      console.error('\n⚠️ EMAIL_USER not configured. Set EMAIL_DEBUG_MODE=true to test without SMTP.');
    }
    
    throw error;
  }
};

module.exports = { sendEmail };
