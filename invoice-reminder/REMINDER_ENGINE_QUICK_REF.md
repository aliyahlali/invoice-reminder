# Reminder Engine - Quick Reference

## 📋 One-Page Overview

Your invoice app now has a production-ready email reminder engine.

### What It Does
- ✅ Automatically sends reminder emails for unpaid invoices
- ✅ Sends reminders: 3 days before, on due date, 3 days after
- ✅ Stops sending when invoice is marked paid
- ✅ Retries failed emails up to 3 times
- ✅ Tracks all reminder history

### How It Works
```
Invoice Created → 3 Reminders Created → Scheduler Runs Every 5 Min 
                                           ↓
                                    Check if past scheduled date?
                                           ↓
                                    Invoice still unpaid?
                                    ├─ Yes: Send email
                                    └─ No: Cancel reminder
```

---

## 🎯 Quick Start

### 1. Start Server
```bash
cd backend
npm start
```

You should see:
```
✓ Scheduler started (runs every 5 minutes)
```

### 2. Create Invoice
Use the UI or API to create an invoice with a future due date.

### 3. Check Status
```bash
curl http://localhost:5002/api/reminders/status \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

### 4. Mark as Paid
Mark the invoice as paid → All pending reminders automatically cancelled.

---

## 🔧 Configuration

### Edit Reminder Schedule
File: `backend/config/reminders.js`

```javascript
REMINDER_CONFIG = {
  before_due: { days: -3 },   // ← Change this
  on_due: { days: 0 },
  after_due: { days: 3 }      // ← Or this
}
```

### Environment Variables
Add to `backend/.env`:
```env
SEND_EMAILS=false              # Test mode (don't send real emails)
SCHEDULER_ENABLED=true         # Enable scheduler
```

---

## 📊 API Endpoints

```bash
# Get reminder schedule
GET /api/reminders/config

# Get all reminder stats
GET /api/reminders/status

# Get reminders for specific invoice
GET /api/reminders/invoice/:invoiceId

# View sent emails
GET /api/reminders/sent
```

All endpoints (except config) require authentication.

---

## 🔍 Monitoring

### Server Logs
```
[2026-01-30T10:00:00Z] Running reminder scheduler...
✓ Found 5 pending reminders to process
✓ Sent before_due reminder to billing@client.com for invoice INV-001
```

### Database Status
```javascript
// Check pending reminders
db.reminders.countDocuments({ status: "pending" })

// Check sent reminders
db.reminders.countDocuments({ status: "sent" })

// Check failed reminders
db.reminders.countDocuments({ status: "failed" })
```

---

## 🧪 Testing

### Test Without Sending Emails
```env
# Add to backend/.env
SEND_EMAILS=false
```

Server will show:
```
[TEST MODE] Would send before_due reminder to billing@client.com
```

### Trigger Scheduler Manually
Create an invoice with due date in past, or wait 5 minutes.

### Check Email History
```bash
curl http://localhost:5002/api/reminders/sent \
  -H "Authorization: Bearer TOKEN"
```

---

## 📁 Files Modified

| File | Purpose |
|------|---------|
| `backend/jobs/EmailScheduler.js` | Main scheduler logic |
| `backend/config/reminders.js` | Configuration |
| `backend/models/Reminder.js` | Database schema |
| `backend/routes/ReminderRoute.js` | API endpoints |
| `backend/routes/InvoiceRoute.js` | Integration with invoices |

---

## 🔑 Key Functions

### Scheduler Functions
```javascript
const {
  startScheduler,                    // Start the scheduler
  createRemindersForInvoice,        // Create 3 reminders for invoice
  cancelRemindersForInvoice,        // Cancel pending reminders
  sendPendingReminders              // Send reminders due now
} = require('./jobs/EmailScheduler');
```

### Invoice Integration
```javascript
// When invoice created:
await createRemindersForInvoice(invoice);

// When invoice marked paid:
await cancelRemindersForInvoice(invoiceId);
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| No reminders sent | Check invoice status is "unpaid" |
| Reminders still sending after paid | Ensure invoice status changed to "paid" |
| Real emails not being sent | Check RESEND_API_KEY in .env |
| Want to test without email | Set SEND_EMAILS=false in .env |
| Scheduler not running | Check server logs for "✓ Scheduler started" |

---

## 📊 Reminder States

```
pending   → waiting to be sent
sent      → successfully sent
failed    → failed after 3 retries
cancelled → invoice was marked paid
```

---

## 🎨 Email Templates

### Before Due (3 days before)
- Subject: "Friendly reminder: Invoice [NUMBER] due soon"
- Tone: Helpful, informative

### On Due (due date)
- Subject: "Invoice [NUMBER] is due today"
- Tone: Urgent but professional

### After Due (3 days after)
- Subject: "Follow-up: Invoice [NUMBER] is past due"
- Tone: Formal, professional follow-up

---

## 💾 Example API Responses

### GET /api/reminders/status
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
      "scheduledDate": "2026-01-31T00:00:00Z"
    }
  ]
}
```

### GET /api/reminders/invoice/:id
```json
{
  "invoiceId": "...",
  "reminders": [
    {
      "type": "before_due",
      "status": "sent",
      "scheduledDate": "2026-02-12T00:00:00Z",
      "sentDate": "2026-02-12T08:30:00Z"
    }
  ],
  "summary": {
    "pending": 0,
    "sent": 1,
    "failed": 0,
    "cancelled": 0
  }
}
```

---

## ⚡ Performance

- **Scheduler:** Runs every 5 minutes (configurable)
- **Processing:** <1 second for typical load
- **Emails:** Async (non-blocking)
- **Database:** Indexed for fast lookups

---

## 📚 Full Documentation

For complete details, see:
- `REMINDER_ENGINE.md` - Technical documentation
- `REMINDER_ENGINE_SETUP.md` - Setup guide
- `REMINDER_ENGINE_SCHEMA.md` - Data model reference
- `REMINDER_ENGINE_SUMMARY.md` - Implementation summary

---

## ✅ Feature Checklist

- [x] Automatic reminder creation for invoices
- [x] Background scheduler (every 5 minutes)
- [x] Email sending with Resend
- [x] Retry logic (up to 3 attempts)
- [x] Payment detection (auto-cancel reminders)
- [x] Professional email templates
- [x] API endpoints for monitoring
- [x] Configuration system
- [x] Error handling and logging
- [x] Production ready

---

## 🚀 You're Ready!

The reminder engine is fully integrated and production-ready.

Start the server and create an invoice to see it in action!

```bash
cd backend && npm start
```

Questions? See the full documentation files.
