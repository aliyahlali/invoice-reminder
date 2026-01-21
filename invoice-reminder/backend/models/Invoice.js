const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'overdue'],
    default: 'unpaid',
    index: true
  },
  note: {
    type: String,
    trim: true
  },
  paidAt: Date,
  paymentToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, { timestamps: true });

invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ paymentToken: 1 }, { sparse: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
