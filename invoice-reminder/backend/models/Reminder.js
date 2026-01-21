const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true
  },
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  sentDate: Date,
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
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

module.exports = mongoose.model('Reminder', reminderSchema);