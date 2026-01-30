# Reminder Engine Setup Guide

## Quick Start

The reminder engine is now fully integrated into your invoice app. Here's what was implemented:

### 1. **Automatic Reminder Creation**
- When you create a new unpaid invoice, three reminders are automatically scheduled:
  - 3 days before due date
  - On the due date
  - 3 days after due date

### 2. **Automatic Scheduler**
- Runs every 5 minutes in the background
- Checks for pending reminders that are due
- Sends emails if the invoice is still unpaid
- Cancels all reminders when invoice is marked as paid

### 3. **Configuration**

To customize the reminder schedule, edit `backend/config/reminders.js`:

```javascript
const REMINDER_CONFIG = {
  before_due: {
    days: -3,      // ← Change this number (e.g., -5 for 5 days before)
    label: 'Before Due'
  },
  on_due: {
    days: 0,       // ← Don't change (0 means on due date)
    label: 'On Due Date'
  },
  after_due: {
    days: 3        // ← Change this number (e.g., 7 for 7 days after)
  }
};
```

### 4. **Testing**

#### Test without sending real emails:
Add to `backend/.env`:
```env
SEND_EMAILS=false
```

Then create an invoice and watch the server logs for `[TEST MODE]` messages.

#### Check reminder status:
```bash
curl http://localhost:5002/api/reminders/status \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 5. **Monitoring Reminders**

**API Endpoints:**

| Endpoint | Purpose |
|----------|---------|
| `GET /api/reminders/config` | View current reminder schedule |
| `GET /api/reminders/status` | View all reminder stats for your invoices |
| `GET /api/reminders/invoice/:id` | View reminders for specific invoice |
| `GET /api/reminders/sent` | View history of sent emails |

Example:
```bash
# View all reminders and upcoming ones due soon
curl http://localhost:5002/api/reminders/status \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

### 6. **Understanding Reminder Status**

Each reminder has a status:

| Status | Meaning |
|--------|---------|
| **pending** | Waiting to be sent (date not reached yet, or retrying) |
| **sent** | Successfully sent to client |
| **failed** | Permanently failed after 3 retry attempts |
| **cancelled** | Removed because invoice was marked paid |

### 7. **How Reminders Work**

```
Invoice Created (unpaid)
    ↓
3 Reminders Created (all pending)
    ↓
[Every 5 Minutes]
Scheduler checks: Is reminder's scheduled date today?
    ├─ Yes + Invoice unpaid → Send email, mark as 'sent'
    ├─ Yes + Invoice paid → Mark as 'cancelled'
    └─ No → Wait until scheduled date
    ↓
Invoice Marked as Paid
    ↓
All pending reminders → Cancelled (no more emails)
```

### 8. **Database Updates**

The `Reminder` model now includes:

```javascript
{
  userId,              // Who owns the invoice
  invoiceId,           // Which invoice
  clientEmail,         // Email address
  invoiceNumber,       // Invoice #
  amount,              // Invoice amount
  dueDate,             // Due date
  invoiceStatus,       // Current status (unpaid/paid)
  remindersSent,       // Array of sent types: ["before", "on", "after"]
  
  // Scheduler tracking
  scheduledDate,       // When to send
  sentDate,            // When actually sent
  status,              // pending | sent | failed | cancelled
  type,                // before_due | on_due | after_due
  retryCount,          // Number of retry attempts
  failureReason        // Why it failed (if failed)
}
```

### 9. **Server Startup**

When you start your backend server:

```bash
cd backend
npm start
```

You'll see:
```
✓ MongoDB connected
✓ Starting Email Reminder Scheduler...
✓ Scheduler started (runs every 5 minutes on interval: */5 * * * *)
Running initial reminder check...
```

### 10. **Troubleshooting**

**Reminders not sending?**
1. Check server logs for scheduler messages
2. Verify invoice status is `unpaid` (not `paid`)
3. Check `scheduledDate` has passed
4. Make sure `RESEND_API_KEY` is set in `.env`

**Need to send emails immediately for testing?**
```javascript
// In backend, manually trigger:
const { sendPendingReminders } = require('./jobs/EmailScheduler');
await sendPendingReminders();
```

**Reset all reminders for an invoice:**
```javascript
// In MongoDB:
db.reminders.deleteMany({ invoiceId: ObjectId("...") })
// Then recreate by marking invoice as unpaid and back to unpaid
```

## Files Modified

| File | Changes |
|------|---------|
| `backend/jobs/EmailScheduler.js` | Complete implementation of scheduler |
| `backend/config/reminders.js` | Reminder configuration (NEW) |
| `backend/models/Reminder.js` | Updated schema with new fields |
| `backend/routes/ReminderRoute.js` | New API endpoints |
| `backend/routes/InvoiceRoute.js` | Integration with reminder creation |

## Next Steps

1. ✅ Start backend server - scheduler will auto-start
2. ✅ Create a test invoice with future due date
3. ✅ Wait 5 minutes or check logs for test reminders
4. ✅ Mark invoice as paid - should see "Cancelled" status
5. ✅ Check `/api/reminders/sent` endpoint to see sent emails

## Support

For detailed documentation, see: `REMINDER_ENGINE.md`

That file includes:
- Complete architecture overview
- All API endpoints with examples
- Configuration options
- Testing procedures
- Troubleshooting guide
- Performance considerations
- Future enhancement ideas
