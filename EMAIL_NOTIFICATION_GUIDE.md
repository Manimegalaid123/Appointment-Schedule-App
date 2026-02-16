# Email Notification System - Architecture & Implementation Guide

## 📧 EMAIL NOTIFICATION SYSTEM DESIGN

---

## 1️⃣ WHAT EMAILS TO SEND & WHEN?

### For CUSTOMERS:
1. **Appointment Confirmation** 
   - When: Immediately after booking
   - Content: Booking details, business address, time, service name
   
2. **24-Hour Reminder**
   - When: 24 hours before appointment
   - Content: "Your appointment with [Business] is tomorrow at [time]"
   
3. **1-Hour Reminder**
   - When: 1 hour before appointment
   - Content: "Your appointment starts in 1 hour. Arrive 5 minutes early."
   
4. **Appointment Status Update**
   - When: Manager accepts/rejects/completes appointment
   - Content: "Your appointment has been [accepted/rejected/completed]"
   
5. **Rating Request**
   - When: After appointment completion
   - Content: "Please rate your experience with [Business]"

### For MANAGERS/BUSINESSES:
1. **New Booking Notification**
   - When: Customer books appointment
   - Content: "New booking from [Customer] on [date] at [time]"
   
2. **Daily Appointment Summary**
   - When: Every morning at 8 AM
   - Content: "You have X appointments today"
   
3. **Profile Update Confirmation**
   - When: Profile/settings are updated
   - Content: "Your business profile has been updated"

---

## 2️⃣ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTION                               │
│              (Book Appointment, Complete, etc)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            DATABASE UPDATE                                   │
│        (Appointment created/updated)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        EMAIL SERVICE QUEUE                                   │
│     (Store email job to be sent)                            │
│  - emailQueue collection in MongoDB                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        EMAIL WORKER (Background Job)                         │
│  - Runs every minute                                        │
│  - Picks pending emails from queue                          │
│  - Sends via Node Mailer (SMTP)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            SMTP SERVER (Gmail/Outlook)                       │
│       Delivers email to customer/manager                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ DATABASE SCHEMA NEEDED

### New Collection: `emailQueues`

```javascript
{
  _id: ObjectId,
  type: String,  // "booking_confirmation", "reminder_24h", "reminder_1h", "status_update", "rating_request"
  recipient: String,  // Email address
  recipientName: String,  // Customer/Business name
  appointmentId: ObjectId,  // Reference to appointment
  businessId: ObjectId,  // Reference to business
  customerId: ObjectId,  // Reference to customer
  
  subject: String,  // Email subject
  variables: {
    // Template variables
    customerName: String,
    businessName: String,
    businessAddress: String,
    appointmentDate: String,
    appointmentTime: String,
    serviceName: String,
    doctorName: String,
    businessEmail: String,
    businessPhone: String
  },
  
  status: String,  // "pending", "sent", "failed"
  retryCount: Number,  // How many times tried to send
  maxRetries: Number,  // Max retry limit (3-5)
  
  scheduledFor: Date,  // When this email should be sent
  sentAt: Date,  // When actually sent
  failureReason: String,  // Why it failed (if failed)
  
  createdAt: Date,
  updatedAt: Date
}
```

### Update Appointment Model:

```javascript
{
  // ... existing fields
  emailsSent: {
    confirmationSent: Boolean,
    reminder24hSent: Boolean,
    reminder1hSent: Boolean,
    statusUpdateSent: Boolean,
    ratingRequestSent: Boolean
  },
  // To track which emails have been sent
}
```

---

## 4️⃣ IMPLEMENTATION STEPS

### STEP 1: Create Email Queue Collection

```javascript
// backend/models/EmailQueue.js
const mongoose = require('mongoose');

const emailQueueSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['booking_confirmation', 'reminder_24h', 'reminder_1h', 'status_update', 'rating_request'],
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  recipientName: String,
  appointmentId: mongoose.Schema.Types.ObjectId,
  businessId: mongoose.Schema.Types.ObjectId,
  customerId: mongoose.Schema.Types.ObjectId,
  
  subject: {
    type: String,
    required: true
  },
  variables: {
    customerName: String,
    businessName: String,
    businessAddress: String,
    appointmentDate: String,
    appointmentTime: String,
    serviceName: String,
    doctorName: String,
    businessEmail: String,
    businessPhone: String
  },
  
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

module.exports = mongoose.model('EmailQueue', emailQueueSchema);
```

### STEP 2: Create Email Template Engine

```javascript
// backend/utils/emailTemplates.js
const emailTemplates = {
  booking_confirmation: (vars) => ({
    subject: `Appointment Confirmed with ${vars.businessName}`,
    html: `
      <h2>Appointment Confirmation</h2>
      <p>Hi ${vars.customerName},</p>
      <p>Your appointment has been confirmed!</p>
      <hr>
      <h3>Appointment Details:</h3>
      <ul>
        <li><strong>Business:</strong> ${vars.businessName}</li>
        <li><strong>Service:</strong> ${vars.serviceName}</li>
        <li><strong>Date:</strong> ${vars.appointmentDate}</li>
        <li><strong>Time:</strong> ${vars.appointmentTime}</li>
        <li><strong>Address:</strong> ${vars.businessAddress}</li>
      </ul>
      <hr>
      <p><strong>Business Contact:</strong></p>
      <p>Email: ${vars.businessEmail}</p>
      <p>Phone: ${vars.businessPhone}</p>
      <hr>
      <p>Thank you for using Appointend!</p>
    `
  }),

  reminder_24h: (vars) => ({
    subject: `Reminder: Your appointment with ${vars.businessName} is tomorrow!`,
    html: `
      <h2>Appointment Reminder - 24 Hours</h2>
      <p>Hi ${vars.customerName},</p>
      <p>This is a reminder that your appointment is <strong>tomorrow at ${vars.appointmentTime}</strong></p>
      <hr>
      <h3>Details:</h3>
      <ul>
        <li><strong>Business:</strong> ${vars.businessName}</li>
        <li><strong>Service:</strong> ${vars.serviceName}</li>
        <li><strong>Date:</strong> ${vars.appointmentDate}</li>
        <li><strong>Time:</strong> ${vars.appointmentTime}</li>
        <li><strong>Address:</strong> ${vars.businessAddress}</li>
      </ul>
      <hr>
      <p>Please arrive 5-10 minutes early.</p>
      <p>If you need to reschedule or cancel, please contact the business.</p>
    `
  }),

  reminder_1h: (vars) => ({
    subject: `Last Reminder: Your appointment in 1 hour!`,
    html: `
      <h2>Last Minute Reminder</h2>
      <p>Hi ${vars.customerName},</p>
      <p>Your appointment with <strong>${vars.businessName}</strong> starts in <strong>1 hour</strong> at <strong>${vars.appointmentTime}</strong></p>
      <hr>
      <h3>Quick Details:</h3>
      <ul>
        <li><strong>Service:</strong> ${vars.serviceName}</li>
        <li><strong>Location:</strong> ${vars.businessAddress}</li>
      </ul>
      <hr>
      <p>Hurry! Please reach on time.</p>
    `
  }),

  status_update: (vars) => ({
    subject: `Appointment Status Update - ${vars.status}`,
    html: `
      <h2>Appointment Status Update</h2>
      <p>Hi ${vars.customerName},</p>
      <p>Your appointment status has been updated to: <strong>${vars.status}</strong></p>
      <hr>
      <h3>Appointment Details:</h3>
      <ul>
        <li><strong>Business:</strong> ${vars.businessName}</li>
        <li><strong>Service:</strong> ${vars.serviceName}</li>
        <li><strong>Date:</strong> ${vars.appointmentDate}</li>
        <li><strong>Time:</strong> ${vars.appointmentTime}</li>
      </ul>
      <hr>
      <p>If you have any questions, please contact ${vars.businessName}.</p>
    `
  }),

  rating_request: (vars) => ({
    subject: `Please rate your experience with ${vars.businessName}`,
    html: `
      <h2>Rate Your Experience</h2>
      <p>Hi ${vars.customerName},</p>
      <p>Thank you for visiting <strong>${vars.businessName}</strong>!</p>
      <p>We'd love to hear about your experience. Please take a moment to rate and leave a review.</p>
      <hr>
      <h3>Your Appointment:</h3>
      <ul>
        <li><strong>Service:</strong> ${vars.serviceName}</li>
        <li><strong>Date:</strong> ${vars.appointmentDate}</li>
      </ul>
      <hr>
      <p><a href="[APP_URL]/rate-appointment/[APPOINTMENT_ID]" style="background: #10b981; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Rate Now</a></p>
    `
  })
};

module.exports = emailTemplates;
```

### STEP 3: Create Email Queue Service

```javascript
// backend/services/emailQueueService.js
const EmailQueue = require('../models/EmailQueue');
const emailTemplates = require('../utils/emailTemplates');

const addEmailToQueue = async (type, recipient, recipientName, variables, appointmentId, delayMinutes = 0) => {
  try {
    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }

    const { subject, html } = template(variables);
    
    const scheduledFor = new Date();
    if (delayMinutes > 0) {
      scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes);
    }

    const emailJob = new EmailQueue({
      type,
      recipient,
      recipientName,
      appointmentId,
      businessId: variables.businessId,
      customerId: variables.customerId,
      subject,
      variables,
      scheduledFor
    });

    await emailJob.save();
    console.log(`✉️ Email added to queue: ${type} to ${recipient}`);
    return emailJob;
  } catch (error) {
    console.error('Error adding email to queue:', error);
    throw error;
  }
};

module.exports = {
  addEmailToQueue
};
```

### STEP 4: Create Email Sending Worker

```javascript
// backend/workers/emailWorker.js
const EmailQueue = require('../models/EmailQueue');
const { sendEmail } = require('../utils/sendMail');

const processEmailQueue = async () => {
  try {
    // Find all pending emails that are ready to be sent
    const pendingEmails = await EmailQueue.find({
      status: 'pending',
      scheduledFor: { $lte: new Date() },
      retryCount: { $lt: 3 }
    }).limit(10); // Process max 10 at a time

    console.log(`📧 Processing ${pendingEmails.length} pending emails...`);

    for (const emailJob of pendingEmails) {
      try {
        // Send email using nodemailer
        const result = await sendEmail({
          to: emailJob.recipient,
          subject: emailJob.subject,
          variables: emailJob.variables
        });

        // Mark as sent
        emailJob.status = 'sent';
        emailJob.sentAt = new Date();
        await emailJob.save();

        console.log(`✅ Email sent successfully to ${emailJob.recipient}`);
      } catch (error) {
        // Mark as failed and increment retry count
        emailJob.retryCount += 1;
        emailJob.failureReason = error.message;

        if (emailJob.retryCount >= emailJob.maxRetries) {
          emailJob.status = 'failed';
          console.error(`❌ Email failed after ${emailJob.retryCount} retries: ${error.message}`);
        } else {
          // Schedule retry for 5 minutes later
          emailJob.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
          console.warn(`⚠️ Email failed, will retry: ${error.message}`);
        }
        
        await emailJob.save();
      }
    }
  } catch (error) {
    console.error('Error processing email queue:', error);
  }
};

module.exports = { processEmailQueue };
```

### STEP 5: Setup Email Worker in Server

```javascript
// backend/server.js - Add this section

const { processEmailQueue } = require('./workers/emailWorker');

// Initialize reminder scheduler
const { initializeReminderScheduler } = require('./utils/appointmentReminder');
initializeReminderScheduler();

// NEW: Initialize email worker - run every 1 minute
setInterval(() => {
  processEmailQueue();
}, 60000); // Every 60 seconds

// Optional: Run once at startup
processEmailQueue();

console.log('📧 Email worker initialized - checking queue every minute');
```

### STEP 6: Trigger Emails on Appointment Events

```javascript
// backend/routes/appointmentRoutes.js - Update booking endpoint

const { addEmailToQueue } = require('../services/emailQueueService');

router.post('/book', authenticate, async (req, res) => {
  try {
    // ... existing booking code ...
    
    const newAppointment = new Appointment({
      // ... appointment details ...
    });
    
    await newAppointment.save();

    // 1. Send BOOKING CONFIRMATION email immediately
    await addEmailToQueue(
      'booking_confirmation',
      customer.email,
      customer.name,
      {
        customerName: customer.name,
        businessName: business.businessName,
        businessAddress: business.businessAddress,
        appointmentDate: new Date(req.body.date).toLocaleDateString(),
        appointmentTime: req.body.time,
        serviceName: req.body.service,
        businessEmail: business.email,
        businessPhone: business.phone,
        businessId: business._id,
        customerId: customer._id
      },
      newAppointment._id,
      0 // Send immediately
    );

    // 2. Schedule 24-HOUR REMINDER (trigger 24 hours before appointment)
    const appointmentDate = new Date(req.body.date);
    const reminder24Time = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
    const minutesUntilReminder = Math.round((reminder24Time - new Date()) / 60000);
    
    await addEmailToQueue(
      'reminder_24h',
      customer.email,
      customer.name,
      { /* same variables */ },
      newAppointment._id,
      minutesUntilReminder
    );

    // 3. Schedule 1-HOUR REMINDER
    const reminder1Time = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
    const minutesUntilReminder1 = Math.round((reminder1Time - new Date()) / 60000);
    
    await addEmailToQueue(
      'reminder_1h',
      customer.email,
      customer.name,
      { /* same variables */ },
      newAppointment._id,
      minutesUntilReminder1
    );

    res.json({ 
      success: true, 
      message: 'Appointment booked and confirmation email sent',
      appointment: newAppointment 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### STEP 7: Send Email on Status Update

```javascript
// When manager accepts/rejects/completes appointment

router.put('/:appointmentId/status', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.appointmentId,
      { status: req.body.status },
      { new: true }
    );

    // Send status update email
    await addEmailToQueue(
      'status_update',
      appointment.customerEmail,
      appointment.customerName,
      {
        customerName: appointment.customerName,
        businessName: business.businessName,
        appointmentDate: new Date(appointment.date).toLocaleDateString(),
        appointmentTime: appointment.time,
        serviceName: appointment.service,
        status: req.body.status,
        businessId: business._id,
        customerId: appointment.customerId
      },
      appointment._id,
      0 // Send immediately
    );

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 5️⃣ TESTING THE EMAIL SYSTEM

### Test Without SMTP (Console Only):

In `sendMail.js`, add debug mode:

```javascript
const sendEmail = async (emailConfig) => {
  if (process.env.EMAIL_DEBUG_MODE === 'true') {
    // Don't actually send, just log
    console.log('📧 [DEBUG] Email would be sent:');
    console.log('To:', emailConfig.to);
    console.log('Subject:', emailConfig.subject);
    console.log('Variables:', emailConfig.variables);
    return { success: true, messageId: 'debug-' + Date.now() };
  }
  
  // ... actual SMTP sending code ...
};
```

Set in `.env`:
```
EMAIL_DEBUG_MODE=true
```

### Test Full System:

1. Create appointment
2. Check MongoDB `emailQueues` collection - should have entries
3. Backend console should show email processing
4. Switch to real SMTP when ready

---

## 6️⃣ SWITCHING TO REAL EMAIL (SMTP)

Once ready, get SMTP credentials:

**Option 1: Gmail (Free)**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  // Not regular password!
FROM_EMAIL=your-email@gmail.com
```

**Option 2: SendGrid (Free tier)**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
FROM_EMAIL=noreply@appointend.com
```

Update `.env` and set `EMAIL_DEBUG_MODE=false`

---

## SUMMARY

**Timeline to implement:**
- ⏱️ Today: Create EmailQueue model + templates (1 hour)
- ⏱️ Today: Create email service + worker (1 hour)
- ⏱️ Today: Hook up to appointment booking (1 hour)
- ⏱️ Tomorrow: Test with debug mode (30 min)
- ⏱️ Tomorrow: Setup real SMTP + go live (30 min)

**Total: ~4-5 hours to full email notification system** 🚀
