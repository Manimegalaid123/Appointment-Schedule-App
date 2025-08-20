const nodemailer = require('nodemailer');

const sendMail = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yourgmail@gmail.com',      // replace with your Gmail
      pass: 'your-app-password'         // replace with your Gmail app password
    }
  });

  const mailOptions = {
    from: 'yourgmail@gmail.com',
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending mail:', error);
    return false;
  }
};

module.exports = sendMail;