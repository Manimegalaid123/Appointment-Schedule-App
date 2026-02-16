// Email templates for all notification types
const emailTemplates = {
  booking_confirmation: (vars) => ({
    subject: `Appointment Confirmed - ${vars.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .detail-box { background: #f0f9ff; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
          .detail-box strong { color: #059669; }
          .footer { text-align: center; color: #888; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
          .btn { display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Appointment Confirmed!</h2>
          </div>
          
          <div class="content">
            <p>Hi ${vars.customerName},</p>
            <p>Your appointment has been successfully confirmed. We're excited to see you!</p>
            
            <div class="detail-box">
              <h3>📍 Business Information</h3>
              <p><strong>Business:</strong> ${vars.businessName}</p>
              <p><strong>Address:</strong> ${vars.businessAddress}</p>
              <p><strong>Phone:</strong> <a href="tel:${vars.businessPhone}">${vars.businessPhone}</a></p>
              <p><strong>Email:</strong> <a href="mailto:${vars.businessEmail}">${vars.businessEmail}</a></p>
            </div>
            
            <div class="detail-box">
              <h3>📅 Appointment Details</h3>
              <p><strong>Date:</strong> ${vars.appointmentDate}</p>
              <p><strong>Time:</strong> ${vars.appointmentTime}</p>
              <p><strong>Service:</strong> ${vars.serviceName}</p>
              ${vars.doctorName ? `<p><strong>Doctor/Consultant:</strong> ${vars.doctorName}</p>` : ''}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              💡 <strong>Tip:</strong> Please arrive 5-10 minutes early. If you need to reschedule or cancel, please contact the business directly.
            </p>
          </div>
          
          <div class="footer">
            <p>Powered by Appointend - Your appointment management solution</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  reminder_24h: (vars) => ({
    subject: `Reminder: Your appointment with ${vars.businessName} is tomorrow!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .detail-box { background: #fffbeb; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Appointment Reminder - Tomorrow!</h2>
          </div>
          
          <div class="content">
            <p>Hi ${vars.customerName},</p>
            <p>This is a friendly reminder that your appointment is <strong>tomorrow at ${vars.appointmentTime}</strong>.</p>
            
            <div class="detail-box">
              <h3>📅 Appointment Details</h3>
              <p><strong>Business:</strong> ${vars.businessName}</p>
              <p><strong>Date:</strong> ${vars.appointmentDate}</p>
              <p><strong>Time:</strong> ${vars.appointmentTime}</p>
              <p><strong>Service:</strong> ${vars.serviceName}</p>
              <p><strong>Location:</strong> ${vars.businessAddress}</p>
            </div>
            
            <p style="color: #f97316; font-weight: bold; margin-top: 20px;">
              👉 Please arrive 5-10 minutes early to check in.
            </p>
          </div>
          
          <div class="footer">
            <p>Powered by Appointend</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  reminder_1h: (vars) => ({
    subject: `Last Reminder: Your appointment starts in 1 hour!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .alert-box { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⏰ Last Reminder - 1 Hour Left!</h2>
          </div>
          
          <div class="content">
            <p>Hi ${vars.customerName},</p>
            <p><strong style="font-size: 16px; color: #ef4444;">Your appointment with ${vars.businessName} starts in 1 HOUR!</strong></p>
            
            <div class="alert-box">
              <h3>⚡ Quick Details</h3>
              <p><strong>Time:</strong> ${vars.appointmentTime}</p>
              <p><strong>Service:</strong> ${vars.serviceName}</p>
              <p><strong>Location:</strong> ${vars.businessAddress}</p>
            </div>
            
            <p style="color: #dc2626; font-weight: bold; margin-top: 20px;">
              🚨 Please leave now to ensure you arrive on time!
            </p>
          </div>
          
          <div class="footer">
            <p>Powered by Appointend</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  status_update: (vars) => ({
    subject: `Appointment Status Update - ${vars.status}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .header { background: #8b5cf6; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #8b5cf6; color: white; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .detail-box { background: #f3e8ff; padding: 15px; border-left: 4px solid #8b5cf6; margin: 15px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📝 Appointment Status Update</h2>
          </div>
          
          <div class="content">
            <p>Hi ${vars.customerName},</p>
            <p>Your appointment status has been updated:</p>
            
            <div style="text-align: center;">
              <span class="status-badge">${vars.status.toUpperCase()}</span>
            </div>
            
            <div class="detail-box">
              <h3>Appointment Details</h3>
              <p><strong>Business:</strong> ${vars.businessName}</p>
              <p><strong>Service:</strong> ${vars.serviceName}</p>
              <p><strong>Date:</strong> ${vars.appointmentDate}</p>
              <p><strong>Time:</strong> ${vars.appointmentTime}</p>
            </div>
            
            <p style="margin-top: 20px; color: #666;">
              If you have any questions or need further assistance, please contact ${vars.businessName} at ${vars.businessPhone} or ${vars.businessEmail}.
            </p>
          </div>
          
          <div class="footer">
            <p>Powered by Appointend</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  rating_request: (vars) => ({
    subject: `Please share your feedback from ${vars.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .btn { display: inline-block; padding: 12px 24px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .detail-box { background: #fce7f3; padding: 15px; border-left: 4px solid #ec4899; margin: 15px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⭐ Please Rate Your Experience</h2>
          </div>
          
          <div class="content">
            <p>Hi ${vars.customerName},</p>
            <p>Thank you for visiting <strong>${vars.businessName}</strong>! We'd love to hear about your experience.</p>
            
            <div class="detail-box">
              <h3>Your Recent Appointment</h3>
              <p><strong>Service:</strong> ${vars.serviceName}</p>
              <p><strong>Date:</strong> ${vars.appointmentDate}</p>
              <p><strong>Business:</strong> ${vars.businessName}</p>
            </div>
            
            <p style="margin-top: 20px; text-align: center;">
              Your feedback helps us improve our services and helps other customers make informed decisions.
            </p>
          </div>
          
          <div class="footer">
            <p>Powered by Appointend</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  new_booking_alert: (vars) => ({
    subject: `New Booking - ${vars.customerName} has booked an appointment`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .header { background: #0ea5e9; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .detail-box { background: #e0f2fe; padding: 15px; border-left: 4px solid #0ea5e9; margin: 15px 0; }
          .btn { display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; color: #888; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎉 New Booking!</h2>
          </div>
          
          <div class="content">
            <p>Hi,</p>
            <p>You have a new appointment booking!</p>
            
            <div class="detail-box">
              <h3>Booking Details</h3>
              <p><strong>Customer Name:</strong> ${vars.customerName}</p>
              <p><strong>Customer Email:</strong> ${vars.customerEmail}</p>
              <p><strong>Customer Phone:</strong> ${vars.customerPhone}</p>
              <p><strong>Service:</strong> ${vars.serviceName}</p>
              <p><strong>Date:</strong> ${vars.appointmentDate}</p>
              <p><strong>Time:</strong> ${vars.appointmentTime}</p>
              ${vars.notes ? `<p><strong>Notes:</strong> ${vars.notes}</p>` : ''}
            </div>
            
            <p>
              <a href="${process.env.APP_URL || 'http://localhost:5174'}/salon-dashboard/${encodeURIComponent(vars.businessEmail)}" class="btn">
                View in Dashboard
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>Powered by Appointend</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

module.exports = emailTemplates;
