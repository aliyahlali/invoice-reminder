// jobs/emailScheduler.js
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder');
const Invoice = require('../models/Invoice');
const User = require('../models/User');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const getEmailTemplate = (type, data) => {
  const { invoice, client, user, paymentLink } = data;
  
  const templates = {
    before_due: {
      subject: `Friendly reminder: Invoice ${invoice.invoiceNumber} due soon`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${client.name},</h2>
          <p>Just a friendly heads up that your invoice is coming due soon.</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            ${invoice.note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${invoice.note}</p>` : ''}
          </div>

          <p>If you've already sent payment, please disregard this reminder.</p>
          
          <div style="margin: 30px 0;">
            <a href="${paymentLink}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Mark as Paid</a>
          </div>

          <p>Thanks!<br>${user.name}</p>
        </div>
      `
    },
    on_due: {
      subject: `Invoice ${invoice.invoiceNumber} is due today`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${client.name},</h2>
          <p>This is a quick reminder that your invoice is due today.</p>
          
          <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 5px 0;"><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> Today</p>
            ${invoice.note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${invoice.note}</p>` : ''}
          </div>

          <p>If you've already sent payment, thank you! You can mark it as paid using the button below.</p>
          
          <div style="margin: 30px 0;">
            <a href="${paymentLink}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Mark as Paid</a>
          </div>

          <p>Best regards,<br>${user.name}</p>
        </div>
      `
    },
    after_due: {
      subject: `Follow-up: Invoice ${invoice.invoiceNumber} is past due`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${client.name},</h2>
          <p>I wanted to follow up regarding the invoice below, which is now past its due date.</p>
          
          <div style="background: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
            <p style="margin: 5px 0;"><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            ${invoice.note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${invoice.note}</p>` : ''}
          </div>

          <p>If you've already sent payment, please let me know or mark it as paid below. If you have any questions or need to discuss payment arrangements, feel free to reach out.</p>
          
          <div style="margin: 30px 0;">
            <a href="${paymentLink}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Mark as Paid</a>
          </div>

          <p>Thanks for your attention to this matter.<br>${user.name}</p>
        </div>
      `
    }
  };

  return templates[type];
};

// Send reminder email
const sendReminderEmail = async (reminder) => {
  try {
    const invoice = await Invoice.findById(reminder.invoiceId)
      .populate('clientId')
      .populate('userId');

    if (!invoice || invoice.status === 'paid') {
      await Reminder.findByIdAndUpdate(reminder._id, { 
        status: 'cancelled' 
      });
      return;
    }

    const client = invoice.clientId;
    const user = invoice.userId;
    const paymentLink = `${process.env.FRONTEND_URL}/pay/${invoice.paymentToken}`;

    const template = getEmailTemplate(reminder.type, {
      invoice,
      client,
      user,
      paymentLink
    });

    await transporter.sendMail({
      from: `${user.name} <${process.env.SMTP_FROM_EMAIL}>`,
      to: client.email,
      subject: template.subject,
      html: template.html
    });

    await Reminder.findByIdAndUpdate(reminder._id, {
      status: 'sent',
      sentDate: new Date()
    });

    console.log(`✓ Sent ${reminder.type} reminder for invoice ${invoice.invoiceNumber}`);
  } catch (error) {
    console.error(`✗ Failed to send reminder ${reminder._id}:`, error.message);
    
    await Reminder.findByIdAndUpdate(reminder._id, {
      status: 'failed',
      failureReason: error.message,
      $inc: { retryCount: 1 }
    });
  }
};

// Process pending reminders
const processReminders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pendingReminders = await Reminder.find({
      status: 'pending',
      scheduledDate: { $gte: today, $lt: tomorrow }
    });

    console.log(`\n[${new Date().toISOString()}] Processing ${pendingReminders.length} reminders...`);

    for (const reminder of pendingReminders) {
      await sendReminderEmail(reminder);
    }

    // Retry failed reminders (max 3 attempts)
    const failedReminders = await Reminder.find({
      status: 'failed',
      retryCount: { $lt: 3 },
      scheduledDate: { $lte: today }
    }).limit(10);

    if (failedReminders.length > 0) {
      console.log(`\nRetrying ${failedReminders.length} failed reminders...`);
      for (const reminder of failedReminders) {
        await sendReminderEmail(reminder);
      }
    }

    console.log('✓ Reminder processing complete\n');
  } catch (error) {
    console.error('✗ Error processing reminders:', error);
  }
};

// Schedule job to run daily at 9 AM
const startScheduler = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', processReminders, {
    timezone: 'America/New_York'
  });

  console.log('✓ Email scheduler started (runs daily at 9 AM)');
  
  // Optional: Run immediately on startup for testing
  // processReminders();
};

module.exports = { startScheduler, processReminders };