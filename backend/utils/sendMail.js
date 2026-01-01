const nodemailer = require('nodemailer');

// Create transporter with dynamic credentials per salon
const getTransporter = (smtpEmail, smtpPassword) => {
  // Use salon credentials if provided, otherwise use default
  const email = smtpEmail || process.env.SMTP_USER || 'adhira28082009@gmail.com';
  const password = smtpPassword || process.env.SMTP_PASS || 'nsqiaukgndpnsakh';
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password
    }
  });
};

const sendMail = async ({ to, subject, text, fromName = null, fromEmail = null, smtpEmail = null, smtpPassword = null }) => {
  try {
    // Get transporter with salon-specific or default credentials
    const transporter = getTransporter(smtpEmail, smtpPassword);
    
    const salonEmail = smtpEmail || process.env.SMTP_USER || 'adhira28082009@gmail.com';
    
    // Format "From" as: "Salon Name <salon-email@gmail.com>"
    const from = fromName 
      ? `${fromName} <${salonEmail}>`
      : salonEmail;

    const mailOptions = {
      from: from,
      to,
      subject,
      html: text // Support HTML emails
    };

    console.log(`\n📨 Sending email via Gmail...`);
    console.log(`   From: ${mailOptions.from}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`\n❌ Error sending email:`);
    console.error(`   Error code: ${error.code}`);
    console.error(`   Error message: ${error.message}`);
    
    return { success: false, error: error.message };
  }
};

module.exports = sendMail;