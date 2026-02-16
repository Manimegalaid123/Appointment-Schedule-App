const { sendEmail } = require('../utils/sendMail');
const { getPendingEmails, markAsSent, markAsFailed, getEmailStats } = require('../services/emailQueueService');

/**
 * Process email queue - sends pending emails
 * This function runs periodically to check and send emails
 */
const processEmailQueue = async () => {
  try {
    // Get stats first
    const stats = await getEmailStats();
    
    console.log(`📧 Email queue check - Pending: ${stats.pending}, Sent: ${stats.sent}, Failed: ${stats.failed}`);
    
    if (stats.pending === 0) {
      return; // No pending emails, skip processing
    }

    console.log(`📧 Processing emails - Pending: ${stats.pending}, Sent: ${stats.sent}, Failed: ${stats.failed}`);

    // Get pending emails (max 10 at a time)
    const pendingEmails = await getPendingEmails(10);

    if (pendingEmails.length === 0) {
      console.log('⚠️ No pending emails found even though stats.pending > 0');
      return;
    }

    console.log(`📬 Found ${pendingEmails.length} emails to process...`);

    // Process each email
    for (const emailJob of pendingEmails) {
      try {
        console.log(`\n📨 Sending email: ${emailJob.type} to ${emailJob.recipient}`);

        // Send email
        await sendEmail({
          to: emailJob.recipient,
          subject: emailJob.subject,
          html: emailJob.variables.html || generateHtmlFromTemplate(emailJob),
          replyTo: emailJob.variables.businessEmail || process.env.EMAIL_FROM_ADDRESS
        });

        // Mark as sent
        await markAsSent(emailJob._id);
        console.log(`✅ Email sent successfully to ${emailJob.recipient}`);

      } catch (error) {
        // Handle send error
        console.error(`❌ Error sending email to ${emailJob.recipient}:`, error.message);
        await markAsFailed(emailJob._id, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Critical error in email queue processor:', error);
  }
};

/**
 * Generate HTML from template variables
 */
const generateHtmlFromTemplate = (emailJob) => {
  const templates = require('../utils/emailTemplates');
  const template = templates[emailJob.type];
  if (template) {
    const { html } = template(emailJob.variables);
    return html;
  }
  return '<p>Email content</p>';
};

module.exports = {
  processEmailQueue
};
