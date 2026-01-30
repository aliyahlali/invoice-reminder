# Reminder Engine Documentation

## Overview

The Email Reminder Engine automatically sends reminder emails for unpaid invoices based on a configurable schedule. Once an invoice is marked as paid, all pending reminders are immediately cancelled.

## Features

- **Automatic Reminder Scheduling**: Automatically creates reminders for every new unpaid invoice
- **Configurable Schedule**: Send reminders before, on, and after invoice due dates
- **Payment Detection**: Immediately stops sending reminders when invoice is marked paid
- **Retry Logic**: Automatically retries failed email sends up to 3 times
- **Email Templates**: Professional HTML email templates for each reminder type
- **Dashboard Integration**: Track reminder status and upcoming reminders
- **Sent Email History**: View all emails sent with full content

## Architecture

### Core Components

1. **EmailScheduler** (`backend/jobs/EmailScheduler.js`)
   - Main scheduler that runs every 5 minutes
   - Processes pending reminders and sends emails
   - Handles retry logic and failure tracking

2. **Reminder Model** (`backend/models/Reminder.js`)
   - Stores reminder state: pending, sent, failed, cancelled
   - Tracks scheduled dates and sent dates
   - Stores retry counts and failure reasons
   - Maintains `remindersSent` array to track sent reminder types

3. **Configuration** (`backend/config/reminders.js`)
   - Centralized configuration for all reminder settings
   - Easy to customize reminder schedule, email settings, and scheduler options

### Reminder Schedule

By default, the system sends three reminders per invoice:

| Type | Timing | Description |
|------|--------|-------------|
| `before_due` | -3 days | Friendly reminder 3 days before due date |
| `on_due` | 0 days | Reminder on the exact due date |
| `after_due` | +3 days | Follow-up after invoice is past due |

**To customize**, edit `backend/config/reminders.js`:

```javascript
const REMINDER_CONFIG = {
  before_due: {
    days: -3,  // Change to -5 for 5 days before
    label: 'Before Due'
  },
  on_due: {
    days: 0,
    label: 'On Due Date'
  },
  after_due: {
    days: 3,   // Change to 7 for 7 days after
    label: 'After Due'
  }
};
```

## Data Model

### Reminder Document

```javascript
{
  userId,                              // Invoice owner
  invoiceId,                           // Reference to invoice
  clientEmail,                         // Email where reminder is sent
  invoiceNumber,                       // Invoice identifier
  amount,                              // Invoice amount
  dueDate,                             // Invoice due date
  invoiceStatus: "unpaid" | "paid",    // Current invoice status
  remindersSent: ["before", "on", "after"],  // Which reminders were sent
  
  // Scheduler fields
  scheduledDate,                       // When to send this reminder
  sentDate,                            // When it was actually sent
  status: "pending" | "sent" | "failed" | "cancelled",
  type: "before_due" | "on_due" | "after_due",
  failureReason,                       // Why it failed (if failed)
  retryCount,                          // Number of retry attempts
  
  createdAt,                           // Created timestamp
  updatedAt                            // Updated timestamp
}
```

### Status Transitions

```
pending ──[scheduler sends]──> sent
      ├──[email fails]──────> failed ──[retry <3]──> pending
      └──[invoice paid]────> cancelled
```

## Workflow

### 1. Creating an Invoice

When a new invoice is created with status `unpaid`:

1. Invoice is saved to database
2. Three reminders are automatically created:
   - One for 3 days before due date (pending)
   - One for due date (pending)
   - One for 3 days after due date (pending)
3. All reminders start with status `pending`

### 2. Scheduler Execution (Every 5 Minutes)

```
Find all reminders where:
  - status = 'pending'
  - scheduledDate <= now

For each reminder:
  1. Fetch full invoice data
  2. Check if invoice is still 'unpaid'
  3. If paid: cancel ALL pending reminders
  4. If unpaid: send email
     - On success: mark reminder as 'sent', add type to remindersSent array
     - On failure: increment retryCount, retry up to 3 times
     - After 3 failures: mark as 'failed'
```

### 3. Payment Processing

When invoice is marked as paid (via authenticated route or payment link):

1. Invoice status changes to `paid`
2. All `pending` reminders for this invoice are cancelled
3. `sent` and `failed` reminders remain unchanged (for history)

## API Endpoints

### GET `/api/reminders/config`
Returns the current reminder schedule configuration.

**Response:**
```json
{
  "reminders": {
    "before_due": {
      "days": -3,
      "label": "Before Due",
      "description": "3 days before the invoice is due"
    },
    "on_due": {
      "days": 0,
      "label": "On Due Date",
      "description": "On the day the invoice is due"
    },
    "after_due": {
      "days": 3,
      "label": "After Due",
      "description": "3 days after the invoice is due"
    }
  }
}
```

### GET `/api/reminders/sent` (Auth Required)
Returns all sent reminders with full email content.

**Response:**
```json
{
  "totalSent": 15,
  "sent": [
    {
      "_id": "...",
      "type": "before_due",
      "sentDate": "2026-01-28T10:30:00Z",
      "invoiceNumber": "INV-001",
      "clientName": "Acme Corp",
      "to": "billing@acmecorp.com",
      "subject": "Friendly reminder: Invoice INV-001 due soon",
      "html": "..."
    }
  ]
}
```

### GET `/api/reminders/invoice/:invoiceId` (Auth Required)
Returns all reminders for a specific invoice.

**Response:**
```json
{
  "invoiceId": "...",
  "reminders": [
    {
      "_id": "...",
      "type": "before_due",
      "status": "sent",
      "scheduledDate": "2026-01-28T00:00:00Z",
      "sentDate": "2026-01-28T10:30:00Z",
      "typeLabel": "Before Due"
    }
  ],
  "summary": {
    "pending": 1,
    "sent": 1,
    "failed": 0,
    "cancelled": 0
  }
}
```

### GET `/api/reminders/status` (Auth Required)
Returns summary of all reminders for the current user.

**Response:**
```json
{
  "total": 45,
  "pending": 12,
  "sent": 30,
  "failed": 0,
  "cancelled": 3,
  "nextDueReminders": [
    {
      "invoiceNumber": "INV-042",
      "amount": 5000,
      "type": "before_due",
      "scheduledDate": "2026-01-31T00:00:00Z",
      "typeLabel": "Before Due"
    }
  ]
}
```

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Enable/disable the scheduler
SCHEDULER_ENABLED=true

# Enable/disable actually sending emails (useful for testing)
SEND_EMAILS=true

# How often scheduler checks for reminders to send
# Default: every 5 minutes (*/5 * * * *)
# See cron documentation for format
SCHEDULER_INTERVAL=*/5 * * * *
```

### Config Files

**Main config:** `backend/config/reminders.js`

```javascript
const REMINDER_CONFIG = {
  // ... reminder schedule definitions
};

const SCHEDULER_CONFIG = {
  checkInterval: '*/5 * * * *',  // Cron format
  maxRetries: 3,                 // Retry failed emails 3 times
  enabled: process.env.SCHEDULER_ENABLED !== 'false'
};

const EMAIL_CONFIG = {
  fromEmail: 'Invoice Reminder <onboarding@resend.dev>',
  sendEmails: process.env.SEND_EMAILS !== 'false'
};
```

## Testing

### Test Mode

To test without sending real emails:

1. Add to `backend/.env`:
```env
SEND_EMAILS=false
```

2. Create an invoice with `dueDate` set to trigger a reminder (use a date in the past)

3. Check server logs for `[TEST MODE]` messages

4. Reminders will be created and marked as "sent" without actually emailing

### Manual Reminder Sending

The scheduler runs every 5 minutes. To test more immediately:

```bash
# Trigger the scheduler directly
curl http://localhost:5002/health  # Server must be running

# Check reminder status
curl http://localhost:5002/api/reminders/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Queries

Check reminder status:

```javascript
// Find all pending reminders
db.reminders.find({ status: 'pending' })

// Find failed reminders
db.reminders.find({ status: 'failed' })

// Check sent reminders for an invoice
db.reminders.find({ invoiceId: ObjectId("..."), status: 'sent' })
```

## Email Templates

Three professional HTML email templates are used based on reminder type:

1. **Before Due** - Friendly reminder tone
   - Subject: "Friendly reminder: Invoice [NUMBER] due soon"
   - Highlights the upcoming due date

2. **On Due** - Urgent reminder tone
   - Subject: "Invoice [NUMBER] is due today"
   - Emphasizes the current day

3. **After Due** - Follow-up tone
   - Subject: "Follow-up: Invoice [NUMBER] is past due"
   - Provides contact information for payment discussion

All templates include:
- Professional formatting
- Invoice details (number, amount, due date, note)
- "Mark as Paid" button with payment link
- Sender name and branding

See `backend/helpers/emailTemplates.js` for full template code.

## Database Indexes

The Reminder model uses the following indexes for performance:

```javascript
reminderSchema.index({ scheduledDate: 1, status: 1 });
reminderSchema.index({ invoiceId: 1, type: 1 }, { unique: true });
reminderSchema.index({ userId: 1, status: 1 });
```

This ensures:
- Fast lookup of reminders to send
- Unique constraint preventing duplicate reminders per invoice
- Fast filtering by user and status

## Troubleshooting

### Reminders Not Sending

1. Check scheduler is enabled:
   ```bash
   # Server logs should show "✓ Scheduler started"
   ```

2. Verify reminder is pending:
   ```javascript
   db.reminders.findOne({ _id: ObjectId("...") })
   // Should have status: "pending"
   ```

3. Check scheduled date:
   ```javascript
   // scheduledDate should be <= now()
   db.reminders.find({ 
     scheduledDate: { $lte: new Date() }, 
     status: 'pending' 
   })
   ```

4. Verify invoice is unpaid:
   ```javascript
   db.invoices.findOne({ _id: ObjectId("...") })
   // Should have status: "unpaid"
   ```

### Email Delivery Issues

1. Check RESEND_API_KEY is set:
   ```bash
   echo $RESEND_API_KEY
   ```

2. Verify client email exists:
   ```javascript
   db.reminders.findOne({ _id: ObjectId("...") })
     .clientEmail
   ```

3. Check failure reason:
   ```javascript
   db.reminders.findOne({ 
     _id: ObjectId("..."),
     status: 'failed'
   }).failureReason
   ```

### Too Many Reminders Sending

Check if invoice is marked as paid:
```javascript
db.invoices.findOne({ _id: ObjectId("...") }).status
// Should be "paid" if you don't want reminders

// If still "unpaid", manually cancel reminders:
db.reminders.updateMany(
  { invoiceId: ObjectId("..."), status: 'pending' },
  { $set: { status: 'cancelled' } }
)
```

## Performance Considerations

- **Scheduler runs every 5 minutes** - Adjustable in config
- **Processes all pending reminders** - O(n) where n = pending reminders
- **Database indexes ensure fast lookups** - Scheduled date + status
- **Email sending is I/O bound** - Consider rate limits with Resend

For large-scale deployments:
- Consider running scheduler on a dedicated worker
- Implement job queue (Bull, RabbitMQ) instead of cron
- Add monitoring/alerting for failed reminders
- Implement batch email sending with rate limiting

## Future Enhancements

- [ ] Configurable reminder schedule per user
- [ ] Timezone-aware scheduling
- [ ] SMS reminders in addition to email
- [ ] Webhook notifications for reminder events
- [ ] Analytics dashboard showing reminder delivery rates
- [ ] A/B testing different email templates
- [ ] Automatic escalation for overdue invoices
- [ ] Reminder frequency customization (weekly vs daily)
