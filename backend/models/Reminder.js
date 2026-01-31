const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  invoiceStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'overdue'],
    default: 'unpaid',
    index: true
  },
  remindersSent: {
    type: [String],
    enum: ['before', 'on', 'after'],
    default: []
  },
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  sentDate: Date,
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  type: {
    type: String,
    enum: ['before_due', 'on_due', 'after_due'],
    required: true
  },
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

reminderSchema.index({ scheduledDate: 1, status: 1 });
reminderSchema.index({ invoiceId: 1, type: 1 }, { unique: true });
reminderSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);