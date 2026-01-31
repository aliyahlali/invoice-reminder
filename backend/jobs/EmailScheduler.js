const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getEmailTemplate } = require('../helpers/emailTemplates');
const { REMINDER_CONFIG, SCHEDULER_CONFIG, EMAIL_CONFIG } = require('../config/reminders');

/**
 * Schedule a single reminder for an invoice
 * Only creates if not already scheduled/sent
 */
async function scheduleReminder(invoice, reminderType) {
  try {
    // Check if reminder already exists
    const existing = await Reminder.findOne({
      invoiceId: invoice._id,
      type: reminderType
    });

    if (existing) {
      return existing;
    }

    // Calculate scheduled date based on reminder type
    const dueDate = new Date(invoice.dueDate);
    const config = REMINDER_CONFIG[reminderType];
    
    if (!config) {
      throw new Error(`Unknown reminder type: ${reminderType}`);
    }

    const scheduledDate = new Date(dueDate);
    scheduledDate.setDate(scheduledDate.getDate() + config.days);

    const reminder = new Reminder({
      userId: invoice.userId,
      invoiceId: invoice._id,
      clientEmail: invoice.clientId?.email || '',
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      invoiceStatus: invoice.status,
      scheduledDate,
      type: reminderType,
      status: 'pending'
    });

    await reminder.save();
    console.log(`✓ Scheduled ${config.label} reminder for invoice ${invoice.invoiceNumber}`);
    return reminder;
  } catch (error) {
    console.error(`Error scheduling reminder: ${error.message}`);
    throw error;
  }
}

/**
 * Create all reminders for a new unpaid invoice
 */
async function createRemindersForInvoice(invoice) {
  try {
    if (invoice.status !== 'unpaid') {
      console.log(`Invoice ${invoice.invoiceNumber} is not unpaid, skipping reminder creation`);
      return;
    }

    console.log(`Creating reminders for invoice ${invoice.invoiceNumber}...`);
    
    await scheduleReminder(invoice, 'before_due');
    await scheduleReminder(invoice, 'on_due');
    await scheduleReminder(invoice, 'after_due');
  } catch (error) {
    console.error(`Error creating reminders for invoice ${invoice.invoiceNumber}:`, error);
  }
}

/**
 * Send pending reminders that are due now
 * Checks if invoice is still unpaid before sending
 */
async function sendPendingReminders() {
  try {
    const now = new Date();

    // Find all pending reminders where scheduledDate <= now
    const pendingReminders = await Reminder.find({
      status: 'pending',
      scheduledDate: { $lte: now }
    })
      .populate('invoiceId')
      .lean();

    if (pendingReminders.length === 0) {
      console.log(`[${now.toISOString()}] No pending reminders to send`);
      return;
    }

    console.log(`[${now.toISOString()}] Found ${pendingReminders.length} pending reminders to process`);

    for (const reminder of pendingReminders) {
      await processSingleReminder(reminder);
    }
  } catch (error) {
    console.error('Error sending pending reminders:', error);
  }
}

/**
 * Process and send a single reminder
 * Checks if invoice is still unpaid before sending
 */
async function processSingleReminder(reminder) {
  try {
    const invoice = await Invoice.findById(reminder.invoiceId)
      .populate('clientId')
      .populate('userId');

    if (!invoice) {
      console.log(`Invoice ${reminder.invoiceId} not found, cancelling reminder`);
      await Reminder.updateOne(
        { _id: reminder._id },
        { status: 'cancelled' }
      );
      return;
    }

    // CRITICAL: Check if invoice is paid - if so, don't send and cancel remaining reminders
    if (invoice.status === 'paid') {
      console.log(`✓ Invoice ${invoice.invoiceNumber} is paid, cancelling all reminders`);
      await Reminder.updateMany(
        { invoiceId: invoice._id, status: 'pending' },
        { status: 'cancelled' }
      );
      return;
    }

    // Build email data
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const paymentLink = invoice.paymentToken
      ? `${baseUrl}/pay/${invoice.paymentToken}`
      : null;

    const emailData = {
      invoice,
      client: invoice.clientId,
      user: invoice.userId,
      paymentLink
    };

    const template = getEmailTemplate(reminder.type, emailData);

    if (!template) {
      console.error(`No email template found for type: ${reminder.type}`);
      await Reminder.updateOne(
        { _id: reminder._id },
        {
          status: 'failed',
          failureReason: 'No email template'
        }
      );
      return;
    }

    // Send the email
    const sendResult = EMAIL_CONFIG.sendEmails
      ? await sendEmail({
          to: invoice.clientId.email,
          subject: template.subject,
          html: template.html
        })
      : { success: true, messageId: 'test-mode' };

    if (sendResult.success) {
      await Reminder.updateOne(
        { _id: reminder._id },
        {
          status: 'sent',
          sentDate: new Date(),
          remindersSent: [...(reminder.remindersSent || []), reminder.type.split('_')[0]]
        }
      );

      if (EMAIL_CONFIG.sendEmails) {
        console.log(`✓ Sent ${reminder.type} reminder to ${invoice.clientId.email} for invoice ${invoice.invoiceNumber}`);
      } else {
        console.log(`[TEST MODE] Would send ${reminder.type} reminder to ${invoice.clientId.email} for invoice ${invoice.invoiceNumber}`);
      }
    } else {
      const failureReason = sendResult.error || 'Unknown error';
      const retryCount = (reminder.retryCount || 0) + 1;

      // Retry up to MAXRETRIES times
      if (retryCount < SCHEDULER_CONFIG.maxRetries) {
        await Reminder.updateOne(
          { _id: reminder._id },
          {
            failureReason,
            retryCount
          }
        );
        console.warn(`⚠ Failed to send reminder (attempt ${retryCount}/${SCHEDULER_CONFIG.maxRetries}): ${failureReason}`);
      } else {
        await Reminder.updateOne(
          { _id: reminder._id },
          {
            status: 'failed',
            failureReason: `Failed after ${SCHEDULER_CONFIG.maxRetries} attempts: ${failureReason}`,
            retryCount
          }
        );
        console.error(`✗ Failed to send reminder after ${SCHEDULER_CONFIG.maxRetries} attempts: ${failureReason}`);
      }
    }
  } catch (error) {
    console.error(`Error processing reminder ${reminder._id}:`, error);
    await Reminder.updateOne(
      { _id: reminder._id },
      {
        status: 'failed',
        failureReason: error.message
      }
    );
  }
}

/**
 * Cancel all pending reminders for a paid invoice
 * Called when invoice status changes to 'paid'
 */
async function cancelRemindersForInvoice(invoiceId) {
  try {
    const result = await Reminder.updateMany(
      { invoiceId, status: 'pending' },
      { status: 'cancelled' }
    );

    if (result.modifiedCount > 0) {
      console.log(`✓ Cancelled ${result.modifiedCount} pending reminders for invoice ${invoiceId}`);
    }
  } catch (error) {
    console.error(`Error cancelling reminders for invoice ${invoiceId}:`, error);
  }
}

/**
 * Start the reminder scheduler
 * Runs every 5 minutes to check for reminders to send
 */
function startScheduler() {
  if (!SCHEDULER_CONFIG.enabled) {
    console.log('⚠ Email Reminder Scheduler is disabled');
    return null;
  }

  console.log('Starting Email Reminder Scheduler...');

  // Run on schedule defined in config: 0, 5, 10, 15, ...
  const task = cron.schedule(SCHEDULER_CONFIG.checkInterval, async () => {
    console.log(`[${new Date().toISOString()}] Running reminder scheduler...`);
    await sendPendingReminders();
  });

  console.log(`✓ Scheduler started (runs every 5 minutes on interval: ${SCHEDULER_CONFIG.checkInterval})`);

  // For testing: run immediately on startup
  console.log('Running initial reminder check...');
  sendPendingReminders().catch(console.error);

  return task;
}

/**
 * Stop the scheduler (useful for testing/graceful shutdown)
 */
function stopScheduler(task) {
  if (task) {
    task.stop();
    console.log('✓ Scheduler stopped');
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  createRemindersForInvoice,
  cancelRemindersForInvoice,
  scheduleReminder,
  processSingleReminder,
  sendPendingReminders,
  REMINDER_CONFIG
};
