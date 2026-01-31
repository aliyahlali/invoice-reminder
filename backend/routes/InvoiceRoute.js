const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Reminder = require('../models/Reminder');
const auth = require('../middleware/Auth');
const { getEarliestPendingReminder } = require('../helpers/reminders');
const { createRemindersForInvoice, cancelRemindersForInvoice } = require('../jobs/EmailScheduler');

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

    // Create reminder schedule via EmailScheduler
    await createRemindersForInvoice(invoice);

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

// Get all invoices (with reminder stats for dashboard / list)
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const [invoices, stats] = await Promise.all([
      Invoice.find(filter).populate('clientId', 'name email').sort({ createdAt: -1 }).lean(),
      getEarliestPendingReminder({ userId: req.user._id })
    ]);

    const [unpaidCount, paidCount, totalCount] = await Promise.all([
      Invoice.countDocuments({ userId: req.user._id, status: 'unpaid' }),
      Invoice.countDocuments({ userId: req.user._id, status: 'paid' }),
      Invoice.countDocuments({ userId: req.user._id })
    ]);
    const byInvoice = stats.byInvoice || {};

    invoices.forEach((inv) => {
      inv.nextReminder = byInvoice[String(inv._id)] || null;
    });

    res.json({
      invoices,
      unpaidCount,
      paidCount,
      totalCount,
      nextReminderDate: stats.date
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public payment confirmation (magic link) – must be before /:id
router.get('/pay/:token', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      paymentToken: req.params.token
    }).populate('clientId', 'name email');

    if (!invoice) {
      return res.status(404).json({ error: 'Invalid payment link' });
    }

    if (invoice.status === 'paid') {
      return res.json({ message: 'Invoice already marked as paid', invoice });
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    // Cancel pending reminders
    await cancelRemindersForInvoice(invoice._id);

    res.json({ message: 'Payment confirmed successfully', invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single invoice (with next reminder for detail page)
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('clientId', 'name email');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const [reminders, { date: nextReminder }] = await Promise.all([
      Reminder.find({ invoiceId: invoice._id }),
      getEarliestPendingReminder({ userId: req.user._id, invoiceId: invoice._id })
    ]);

    res.json({ invoice, reminders, nextReminder });
  } catch (error) {
    console.error(error);
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
    await cancelRemindersForInvoice(invoice._id);

    res.json(invoice);
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