/**
 * Reminder Schedule Configuration
 * Define when reminders should be sent relative to invoice due dates
 * 
 * Format:
 * {
 *   type: {
 *     days: number (negative = before, 0 = on, positive = after),
 *     label: string (for UI display)
 *   }
 * }
 */

const REMINDER_CONFIG = {
  before_due: {
    days: -3,
    label: 'Before Due',
    description: '3 days before the invoice is due'
  },
  on_due: {
    days: 0,
    label: 'On Due Date',
    description: 'On the day the invoice is due'
  },
  after_due: {
    days: 3,
    label: 'After Due',
    description: '3 days after the invoice is due'
  }
};

/**
 * Scheduler Configuration
 */
const SCHEDULER_CONFIG = {
  // How often to check for reminders to send (in cron format)
  // Default: every 5 minutes
  checkInterval: '*/5 * * * *',
  
  // Maximum number of retry attempts for failed emails
  maxRetries: 3,
  
  // Enable/disable scheduler
  enabled: process.env.SCHEDULER_ENABLED !== 'false'
};

/**
 * Email Configuration
 */
const EMAIL_CONFIG = {
  // Sender email address
  fromEmail: 'Invoice Reminder <onboarding@resend.dev>',
  
  // Whether to actually send emails
  // Set to false for testing/development
  sendEmails: process.env.SEND_EMAILS !== 'false'
};

module.exports = {
  REMINDER_CONFIG,
  SCHEDULER_CONFIG,
  EMAIL_CONFIG
};
