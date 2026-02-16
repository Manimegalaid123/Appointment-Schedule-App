const EmailQueue = require('../models/EmailQueue');
const emailTemplates = require('../utils/emailTemplates');

/**
 * Add email to queue for async processing
 * @param {string} type - Email type (booking_confirmation, reminder_24h, etc)
 * @param {string} recipient - Email address
 * @param {string} recipientName - Name of recipient
 * @param {object} variables - Template variables
 * @param {string} appointmentId - Appointment ID
 * @param {number} delayMinutes - Delay before sending (default: 0 = send immediately)
 * @returns {object} Created EmailQueue document
 */
const addEmailToQueue = async (type, recipient, recipientName, variables, appointmentId, delayMinutes = 0) => {
  try {
    console.log(`\n📧 [addEmailToQueue] Called with type: ${type}, recipient: ${recipient}`);
    
    const template = emailTemplates[type];
    console.log(`📧 [addEmailToQueue] Template found: ${template ? 'YES' : 'NO'}`);
    
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }

    // Generate email subject and HTML
    const { subject, html } = template(variables);
    
    // Calculate when email should be sent
    const scheduledFor = new Date();
    if (delayMinutes > 0) {
      scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes);
    }

    // Create email job
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
    console.log(`✉️ Email added to queue: ${type} to ${recipient} (scheduled for ${scheduledFor})`);
    return emailJob;
  } catch (error) {
    console.error('❌ Error adding email to queue:', error);
    throw error;
  }
};

/**
 * Get pending emails from queue
 * @param {number} limit - Max number of emails to fetch
 * @returns {array} Array of pending emails
 */
const getPendingEmails = async (limit = 10) => {
  try {
    const pendingEmails = await EmailQueue.find({
      status: 'pending',
      scheduledFor: { $lte: new Date() },
      retryCount: { $lt: 3 }
    })
      .limit(limit)
      .sort({ createdAt: 1 });

    return pendingEmails;
  } catch (error) {
    console.error('❌ Error fetching pending emails:', error);
    return [];
  }
};

/**
 * Mark email as sent
 * @param {string} emailId - Email queue document ID
 * @returns {object} Updated email document
 */
const markAsSent = async (emailId) => {
  try {
    const email = await EmailQueue.findByIdAndUpdate(
      emailId,
      {
        status: 'sent',
        sentAt: new Date()
      },
      { new: true }
    );
    return email;
  } catch (error) {
    console.error('❌ Error marking email as sent:', error);
    throw error;
  }
};

/**
 * Mark email as failed and schedule retry
 * @param {string} emailId - Email queue document ID
 * @param {string} failureReason - Error message
 * @returns {object} Updated email document
 */
const markAsFailed = async (emailId, failureReason) => {
  try {
    const emailJob = await EmailQueue.findById(emailId);
    
    if (!emailJob) {
      throw new Error('Email job not found');
    }

    emailJob.retryCount += 1;
    emailJob.failureReason = failureReason;

    if (emailJob.retryCount >= emailJob.maxRetries) {
      // Max retries reached - mark as failed
      emailJob.status = 'failed';
      console.error(`❌ Email failed after ${emailJob.retryCount} retries: ${failureReason}`);
    } else {
      // Schedule retry for 5 minutes later
      const retryTime = new Date();
      retryTime.setMinutes(retryTime.getMinutes() + 5);
      emailJob.scheduledFor = retryTime;
      console.warn(`⚠️ Email will be retried (attempt ${emailJob.retryCount}/${emailJob.maxRetries}): ${failureReason}`);
    }

    await emailJob.save();
    return emailJob;
  } catch (error) {
    console.error('❌ Error marking email as failed:', error);
    throw error;
  }
};

/**
 * Get email statistics
 * @returns {object} Statistics about emails in queue
 */
const getEmailStats = async () => {
  try {
    const stats = {
      pending: await EmailQueue.countDocuments({ status: 'pending' }),
      sent: await EmailQueue.countDocuments({ status: 'sent' }),
      failed: await EmailQueue.countDocuments({ status: 'failed' })
    };
    return stats;
  } catch (error) {
    console.error('❌ Error getting email stats:', error);
    return { pending: 0, sent: 0, failed: 0 };
  }
};

module.exports = {
  addEmailToQueue,
  getPendingEmails,
  markAsSent,
  markAsFailed,
  getEmailStats
};
