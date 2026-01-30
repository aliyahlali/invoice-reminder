# Reminder Engine - Data Schema Reference

## Overview

This document provides the complete data model for the reminder engine.

---

## Invoice Collection

The `Invoice` document is referenced by reminders:

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Invoice owner
  clientId: ObjectId,         // Reference to Client
  invoiceNumber: String,      // "INV-001"
  amount: Number,             // 5000.00
  dueDate: Date,              // 2026-02-15
  status: String,             // "unpaid" | "paid" | "overdue"
  note: String,               // Optional note
  paidAt: Date,               // When marked paid
  paymentToken: String,       // Unique payment link token
  createdAt: Date,
  updatedAt: Date
}
```

---

## Reminder Collection

The main collection for reminder tracking:

```javascript
{
  // User & Invoice References
  _id: ObjectId,
  userId: ObjectId,               // ← Added: Invoice owner
  invoiceId: ObjectId,            // Reference to invoice
  
  // Client & Invoice Details (denormalized for quick access)
  clientEmail: String,            // ← Added: "billing@client.com"
  invoiceNumber: String,          // ← Added: "INV-001"
  amount: Number,                 // ← Added: 5000.00
  dueDate: Date,                  // ← Added: 2026-02-15
  invoiceStatus: String,          // ← Added: "unpaid" | "paid"
  
  // Reminder Tracking
  remindersSent: [String],        // ← Added: ["before", "on", "after"]
  
  // Scheduling
  scheduledDate: Date,            // When to send (calculated from dueDate)
  sentDate: Date,                 // When actually sent (null if not sent)
  
  // Status & Type
  status: String,                 // "pending" | "sent" | "failed" | "cancelled"
  type: String,                   // "before_due" | "on_due" | "after_due"
  
  // Error Handling
  failureReason: String,          // Why it failed
  retryCount: Number,             // How many times we retried (0-3)
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### Status Descriptions

| Status | Meaning | Next Action |
|--------|---------|------------|
| `pending` | Scheduled but not yet sent | Wait for scheduledDate or send if past |
| `sent` | Successfully sent to client | Keep in history |
| `failed` | Failed after max retries | Manual intervention may be needed |
| `cancelled` | Cancelled because invoice was paid | No further action |

### Type Descriptions

| Type | Timing | Scheduled |
|------|--------|-----------|
| `before_due` | 3 days before due date | dueDate - 3 days |
| `on_due` | On the exact due date | dueDate |
| `after_due` | 3 days after due date | dueDate + 3 days |

---

## Example Reminder Documents

### Pending Reminder (Scheduled for Future)
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  userId: ObjectId("507f1f77bcf86cd799439001"),
  invoiceId: ObjectId("507f1f77bcf86cd799439021"),
  clientEmail: "billing@acmecorp.com",
  invoiceNumber: "INV-001",
  amount: 5000,
  dueDate: new Date("2026-02-15"),
  invoiceStatus: "unpaid",
  remindersSent: [],
  
  scheduledDate: new Date("2026-02-12"),  // 3 days before
  sentDate: null,
  status: "pending",
  type: "before_due",
  failureReason: null,
  retryCount: 0,
  
  createdAt: new Date("2026-01-15T10:00:00Z"),
  updatedAt: new Date("2026-01-15T10:00:00Z")
}
```

### Sent Reminder
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  userId: ObjectId("507f1f77bcf86cd799439001"),
  invoiceId: ObjectId("507f1f77bcf86cd799439021"),
  clientEmail: "billing@acmecorp.com",
  invoiceNumber: "INV-001",
  amount: 5000,
  dueDate: new Date("2026-02-15"),
  invoiceStatus: "unpaid",
  remindersSent: ["before"],  // ← Added type to array
  
  scheduledDate: new Date("2026-02-12"),
  sentDate: new Date("2026-02-12T08:30:00Z"),  // ← Populated when sent
  status: "sent",  // ← Updated to 'sent'
  type: "before_due",
  failureReason: null,
  retryCount: 0,
  
  createdAt: new Date("2026-01-15T10:00:00Z"),
  updatedAt: new Date("2026-02-12T08:30:00Z")  // ← Updated
}
```

### Failed Reminder (After Retries)
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  userId: ObjectId("507f1f77bcf86cd799439001"),
  invoiceId: ObjectId("507f1f77bcf86cd799439021"),
  clientEmail: "invalid@example.com",
  invoiceNumber: "INV-002",
  amount: 3000,
  dueDate: new Date("2026-02-20"),
  invoiceStatus: "unpaid",
  remindersSent: [],
  
  scheduledDate: new Date("2026-02-20"),
  sentDate: null,
  status: "failed",  // ← Status changed to failed
  type: "on_due",
  failureReason: "Failed after 3 attempts: Invalid email address",  // ← Error message
  retryCount: 3,  // ← Max retries reached
  
  createdAt: new Date("2026-01-20T10:00:00Z"),
  updatedAt: new Date("2026-02-20T12:00:00Z")
}
```

### Cancelled Reminder (Invoice Paid)
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  userId: ObjectId("507f1f77bcf86cd799439001"),
  invoiceId: ObjectId("507f1f77bcf86cd799439021"),
  clientEmail: "billing@acmecorp.com",
  invoiceNumber: "INV-001",
  amount: 5000,
  dueDate: new Date("2026-02-15"),
  invoiceStatus: "paid",  // ← Changed to 'paid'
  remindersSent: ["before"],  // ← May have sent some
  
  scheduledDate: new Date("2026-02-17"),  // Was scheduled for after due
  sentDate: null,
  status: "cancelled",  // ← Changed to 'cancelled'
  type: "after_due",
  failureReason: null,
  retryCount: 0,
  
  createdAt: new Date("2026-01-15T10:00:00Z"),
  updatedAt: new Date("2026-02-15T14:00:00Z")  // ← When cancelled
}
```

---

## Database Indexes

The Reminder model uses these indexes for performance:

```javascript
// Find reminders to send (scheduler query)
db.reminders.createIndex({ scheduledDate: 1, status: 1 })

// Ensure no duplicate reminders per invoice
db.reminders.createIndex({ invoiceId: 1, type: 1 }, { unique: true })

// Find user's reminders quickly
db.reminders.createIndex({ userId: 1, status: 1 })
```

---

## API Response Examples

### GET /api/reminders/config
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

### GET /api/reminders/invoice/:invoiceId
```json
{
  "invoiceId": "507f1f77bcf86cd799439021",
  "reminders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "before_due",
      "status": "sent",
      "scheduledDate": "2026-02-12T00:00:00Z",
      "sentDate": "2026-02-12T08:30:00Z",
      "typeLabel": "Before Due"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "type": "on_due",
      "status": "pending",
      "scheduledDate": "2026-02-15T00:00:00Z",
      "sentDate": null,
      "typeLabel": "On Due Date"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "type": "after_due",
      "status": "pending",
      "scheduledDate": "2026-02-18T00:00:00Z",
      "sentDate": null,
      "typeLabel": "After Due"
    }
  ],
  "summary": {
    "pending": 2,
    "sent": 1,
    "failed": 0,
    "cancelled": 0
  }
}
```

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
      "scheduledDate": "2026-01-31T00:00:00Z",
      "typeLabel": "Before Due"
    },
    {
      "invoiceNumber": "INV-043",
      "amount": 2500,
      "type": "on_due",
      "scheduledDate": "2026-02-03T00:00:00Z",
      "typeLabel": "On Due Date"
    }
  ]
}
```

### GET /api/reminders/sent
```json
{
  "totalSent": 25,
  "sent": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "before_due",
      "sentDate": "2026-02-12T08:30:00Z",
      "scheduledDate": "2026-02-12T00:00:00Z",
      "invoiceNumber": "INV-001",
      "clientName": "Acme Corp",
      "to": "billing@acmecorp.com",
      "subject": "Friendly reminder: Invoice INV-001 due soon",
      "html": "... HTML content ..."
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "type": "on_due",
      "sentDate": "2026-02-15T10:15:00Z",
      "scheduledDate": "2026-02-15T00:00:00Z",
      "invoiceNumber": "INV-001",
      "clientName": "Acme Corp",
      "to": "billing@acmecorp.com",
      "subject": "Invoice INV-001 is due today",
      "html": "... HTML content ..."
    }
  ]
}
```

---

## State Transitions

### Pending → Sent
```
Scheduler finds reminder where:
  - status = "pending"
  - scheduledDate <= now
  - invoice.status = "unpaid"
  
Action:
  - status = "sent"
  - sentDate = now
  - remindersSent.push(type)
  - updatedAt = now
```

### Pending → Cancelled
```
When Invoice marked paid:
  
Action for all pending reminders:
  - status = "cancelled"
  - updatedAt = now
```

### Pending → Failed
```
Scheduler finds reminder where:
  - status = "pending"
  - scheduledDate <= now
  - Email send fails
  - retryCount >= maxRetries (3)
  
Action:
  - status = "failed"
  - failureReason = "error message"
  - retryCount = 3
  - updatedAt = now
```

### Pending → Pending (Retry)
```
Scheduler finds reminder where:
  - status = "pending"
  - scheduledDate <= now
  - Email send fails
  - retryCount < maxRetries (3)
  
Action:
  - status = "pending" (unchanged)
  - retryCount++
  - failureReason = "error message"
  - updatedAt = now
  - Next cycle will retry
```

---

## MongoDB Queries

### Find all pending reminders due now
```javascript
db.reminders.find({
  status: "pending",
  scheduledDate: { $lte: new Date() }
})
```

### Find failed reminders for a user
```javascript
db.reminders.find({
  userId: ObjectId("..."),
  status: "failed"
})
```

### Find reminders sent for an invoice
```javascript
db.reminders.find({
  invoiceId: ObjectId("..."),
  status: "sent"
}).sort({ sentDate: -1 })
```

### Count reminders by status
```javascript
db.reminders.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
])
```

### Find upcoming reminders for next 7 days
```javascript
const now = new Date();
const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

db.reminders.find({
  status: "pending",
  scheduledDate: {
    $gte: now,
    $lte: sevenDays
  }
}).sort({ scheduledDate: 1 })
```

### Update invoice status for reminders
```javascript
// When invoice is marked paid, update all its reminders
db.reminders.updateMany(
  { invoiceId: ObjectId("..."), status: "pending" },
  { 
    $set: { 
      status: "cancelled",
      updatedAt: new Date()
    }
  }
)
```

---

## Performance Considerations

### Indexes
- **Scheduled reminders:** `{ scheduledDate: 1, status: 1 }` - Used by scheduler every 5 min
- **Unique reminders:** `{ invoiceId: 1, type: 1 }` - Prevents duplicates
- **User reminders:** `{ userId: 1, status: 1 }` - Used by API endpoints

### Query Optimization
- Scheduler query returns ~5-50 reminders per cycle
- API queries filtered by userId for authorization
- Lean queries used where document methods not needed

### Scalability
- No N+1 queries - uses $lookup for joins when needed
- Indexes ensure O(log n) lookups
- Consider sharding by userId for very large deployments

---

## Denormalization Strategy

Some fields are denormalized for performance:

| Field | Original | Why Denormalized |
|-------|----------|-----------------|
| `clientEmail` | Client.email | Quick access for sending |
| `invoiceNumber` | Invoice.invoiceNumber | Email templates |
| `amount` | Invoice.amount | API responses |
| `dueDate` | Invoice.dueDate | Scheduling, API |
| `invoiceStatus` | Invoice.status | Determining when to send |

This avoids expensive $lookup joins during scheduler execution while maintaining referential integrity through `invoiceId`.
