// routes/invoices.js
const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Reminder = require('../models/Reminder');
const auth = require('../middleware/Auth');

const router = express.Router();

// Create invoice
router.post('/', auth, async (req, res) => {
  try {
    const { clientName, clientEmail, invoiceNumber, amount, dueDate, note } = req.body;

    if (!clientEmail || !invoiceNumber || !amount || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check plan limits
    if (req.user.plan === 'free' && req.user.invoiceCount >= 3) {
      return res.status(403).json({ 
        error: 'Free plan limit reached. Upgrade to create more invoices.',
        requiresUpgrade: true 
      });
    }

    // Find or create client
    let client = await Client.findOne({ 
      userId: req.user._id, 
      email: clientEmail 
    });

    if (!client) {
      client = new Client({
        userId: req.user._id,
        name: clientName || clientEmail,
        email: clientEmail
      });
      await client.save();
    }

    // Create invoice
    const paymentToken = crypto.randomBytes(32).toString('hex');
    
    const invoice = new Invoice({
      userId: req.user._id,
      clientId: client._id,
      invoiceNumber,
      amount,
      dueDate: new Date(dueDate),
      note,
      paymentToken
    });

    await invoice.save();

    // Create reminder schedule
    const dueDateObj = new Date(dueDate);
    const reminders = [
      {
        invoiceId: invoice._id,
        scheduledDate: new Date(dueDateObj.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before
        type: 'before_due'
      },
      {
        invoiceId: invoice._id,
        scheduledDate: dueDateObj, // On due date
        type: 'on_due'
      },
      {
        invoiceId: invoice._id,
        scheduledDate: new Date(dueDateObj.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after
        type: 'after_due'
      }
    ];

    await Reminder.insertMany(reminders);

    // Update invoice count
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { invoiceCount: 1 } 
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('clientId', 'name email');

    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all invoices
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    
    if (status) {
      filter.status = status;
    }

    const invoices = await Invoice.find(filter)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('clientId', 'name email');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const reminders = await Reminder.find({ invoiceId: invoice._id });

    res.json({ invoice, reminders });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark as paid (authenticated)
router.patch('/:id/mark-paid', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    // Cancel pending reminders
    await Reminder.updateMany(
      { invoiceId: invoice._id, status: 'pending' },
      { status: 'cancelled' }
    );

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Public payment confirmation (magic link)
router.get('/pay/:token', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      paymentToken: req.params.token 
    }).populate('clientId', 'name email');

    if (!invoice) {
      return res.status(404).json({ error: 'Invalid payment link' });
    }

    if (invoice.status === 'paid') {
      return res.json({ 
        message: 'Invoice already marked as paid',
        invoice 
      });
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    // Cancel pending reminders
    await Reminder.updateMany(
      { invoiceId: invoice._id, status: 'pending' },
      { status: 'cancelled' }
    );

    res.json({ 
      message: 'Payment confirmed successfully',
      invoice 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Delete associated reminders
    await Reminder.deleteMany({ invoiceId: invoice._id });

    // Decrement invoice count
    await User.findByIdAndUpdate(req.user._id, { 
      $inc: { invoiceCount: -1 } 
    });

    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;