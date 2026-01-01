const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const { sendMail } = require('./sendMail');
const cron = require('node-cron');

// Store active jobs to prevent duplicates
const activeJobs = new Map();

// Check and send reminders
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    console.log(`\n📧 [${now.toLocaleString()}] Checking for appointments needing reminders...`);
    
    // Get all pending appointments
    const appointments = await Appointment.find({
      status: 'pending',
      date: { $exists: true },
      time: { $exists: true }
    }).lean();

    console.log(`📋 Found ${appointments.length} pending appointments to check`);
    
    let remindersSent = 0;

    for (const appointment of appointments) {
      const business = await Business.findOne({ email: appointment.businessEmail });
      if (!business) {
        console.log(`⚠️  Business not found for: ${appointment.businessEmail}`);
        continue;
      }
      
      if (!business.reminderSettings?.enableEmailReminder) {
        console.log(`⏭️  Reminders disabled for: ${appointment.businessName}`);
        continue;
      }

      // Parse appointment date and time
      const [year, month, day] = appointment.date.split('-').map(Number);
      const [hour, minute] = appointment.time.split(':').map(Number);
      const appointmentTime = new Date(year, month - 1, day, hour, minute);
      const timeDiffMinutes = (appointmentTime - now) / (1000 * 60);

      console.log(`\n🔍 Checking: ${appointment.customerName} - ${appointment.service}`);
      console.log(`   Time until appointment: ${Math.round(timeDiffMinutes)} minutes`);
      console.log(`   Appointment: ${appointment.date} at ${appointment.time}`);

      // 24-hour reminder
      if (business.reminderSettings?.reminderBefore24h) {
        const reminderKey24h = `${appointment._id}-24h`;
        if (timeDiffMinutes > 1420 && timeDiffMinutes <= 1440 && !activeJobs.has(reminderKey24h)) {
          console.log(`   ✅ Sending 24-hour reminder...`);
          await sendReminder(appointment, business, '24');
          activeJobs.set(reminderKey24h, true);
          remindersSent++;
        }
      }

      // 1-hour reminder
      if (business.reminderSettings?.reminderBefore1h) {
        const reminderKey1h = `${appointment._id}-1h`;
        if (timeDiffMinutes > 50 && timeDiffMinutes <= 60 && !activeJobs.has(reminderKey1h)) {
          console.log(`   ✅ Sending 1-hour reminder...`);
          await sendReminder(appointment, business, '1');
          activeJobs.set(reminderKey1h, true);
          remindersSent++;
        }
      }
    }
    
    console.log(`\n📊 Summary: ${remindersSent} reminders sent in this check\n`);
  } catch (error) {
    console.error('❌ Error checking reminders:', error);
  }
};

// Send reminder email
const sendReminder = async (appointment, business, hoursAhead) => {
  try {
    console.log(`\n📨 Sending ${hoursAhead}-hour reminder to: ${appointment.customerEmail}`);
    
    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const emailSubject = `Appointment Reminder - ${hoursAhead} hour${hoursAhead > 1 ? 's' : ''} away`;
    
    const emailBody = `
      <h2>Appointment Reminder</h2>
      <p>Hi ${appointment.customerName},</p>
      
      <p>This is a reminder that you have an upcoming appointment:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Salon:</strong> ${appointment.businessName || business.businessName}</p>
        <p><strong>Service:</strong> ${appointment.service}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${appointment.time}</p>
        <p><strong>Location:</strong> ${appointment.businessAddress || business.businessAddress}</p>
      </div>
      
      <p>If you need to cancel or reschedule, please contact the salon as soon as possible.</p>
      
      <p><strong>Salon Contact:</strong></p>
      <p>Phone: ${business.phone}</p>
      <p>Email: ${business.email}</p>
      
      <p>Thank you!</p>
    `;

    // Use salon's own email credentials if available
    const smtpEmail = business.emailCredentials?.smtpEmail || null;
    const smtpPassword = business.emailCredentials?.smtpPassword || null;

    const result = await sendMail({
      to: appointment.customerEmail,
      subject: emailSubject,
      text: emailBody,
      fromEmail: business.email,  // Display salon's email as sender
      smtpEmail: smtpEmail,        // Use salon's SMTP credentials
      smtpPassword: smtpPassword   // Use salon's SMTP password
    });

    // Check if email was sent successfully
    if (!result.success) {
      console.error(`❌ Failed to send email: ${result.error}`);
      return false;
    }

    // Update appointment to track sent reminders
    const updateData = {};
    if (hoursAhead === '24') {
      updateData['remindersSent.reminder24h'] = true;
      updateData['remindersSent.sentAt24h'] = new Date();
    } else if (hoursAhead === '1') {
      updateData['remindersSent.reminder1h'] = true;
      updateData['remindersSent.sentAt1h'] = new Date();
    }
    
    await Appointment.updateOne({ _id: appointment._id }, updateData);

    console.log(`✅ Email sent successfully!`);
    console.log(`   To: ${appointment.customerEmail}`);
    console.log(`   Subject: ${emailSubject}`);
    console.log(`   Response: ${result}`);
    
    return true;
  } catch (error) {
    console.error(`\n❌ ERROR sending reminder for appointment ${appointment._id}:`);
    console.error(`   Customer: ${appointment.customerEmail}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Details: ${JSON.stringify(error)}`);
    return false;
  }
};

// Initialize reminder scheduler (runs every 5 minutes)
const initializeReminderScheduler = () => {
  console.log('\n⏰ ========================================');
  console.log('⏰ APPOINTMENT REMINDER SCHEDULER STARTED');
  console.log('⏰ Checking every 5 minutes');
  console.log('⏰ ========================================\n');
  
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    checkAndSendReminders().catch(err => {
      console.error('⏰ Scheduler error:', err);
    });
  });
  
  // Also run once immediately when server starts
  checkAndSendReminders().catch(err => {
    console.error('⏰ Initial check error:', err);
  });
  
  console.log('✅ Reminder scheduler is running\n');
};

module.exports = {
  initializeReminderScheduler,
  checkAndSendReminders,
  sendReminder
};
