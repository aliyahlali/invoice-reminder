const express = require('express');
const Reminder = require('../models/Reminder');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/Auth');
const { getEmailTemplate } = require('../helpers/emailTemplates');
const { REMINDER_CONFIG } = require('../config/reminders');

const router = express.Router();

/**
 * GET /api/reminders/config
 * Returns reminder schedule configuration
 */
router.get('/config', (req, res) => {
  try {
    res.json({
      reminders: REMINDER_CONFIG
    });
  } catch (error) {
    console.error('GET /reminders/config error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/reminders/sent
 * Returns count of sent emails and list of sent reminders with reconstructed subject/html.
 */
router.get('/sent', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const invoiceIds = await Invoice.find({ userId }).distinct('_id');
    const sent = await Reminder.find({
      invoiceId: { $in: invoiceIds },
      status: 'sent'
    })
      .sort({ sentDate: -1 })
      .populate({
        path: 'invoiceId',
        populate: [
          { path: 'clientId', select: 'name email' },
          { path: 'userId', select: 'name' }
        ]
      })
      .lean();

    const totalSent = sent.length;
    const list = sent.map((r) => {
      const invoice = r.invoiceId;
      const client = invoice?.clientId || {};
      const user = invoice?.userId || {};
      const paymentLink = invoice?.paymentToken
        ? `${baseUrl}/pay/${invoice.paymentToken}`
        : null;
      const template = getEmailTemplate(r.type, {
        invoice,
        client,
        user,
        paymentLink
      });
      return {
        _id: r._id,
        type: r.type,
        sentDate: r.sentDate,
        scheduledDate: r.scheduledDate,
        invoiceNumber: invoice?.invoiceNumber,
        clientName: client?.name,
        to: client?.email,
        subject: template?.subject || '(no subject)',
        html: template?.html || ''
      };
    });

    res.json({ totalSent, sent: list });
  } catch (error) {
    console.error('GET /reminders/sent error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/reminders/invoice/:invoiceId
 * Returns all reminders for a specific invoice
 */
router.get('/invoice/:invoiceId', auth, async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;

    // Verify ownership
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const reminders = await Reminder.find({ invoiceId }).lean();

    const enriched = reminders.map((r) => ({
      _id: r._id,
      type: r.type,
      status: r.status,
      scheduledDate: r.scheduledDate,
      sentDate: r.sentDate,
      failureReason: r.failureReason,
      retryCount: r.retryCount,
      typeLabel: REMINDER_CONFIG[r.type]?.label || r.type
    }));

    res.json({
      invoiceId,
      reminders: enriched,
      summary: {
        pending: reminders.filter((r) => r.status === 'pending').length,
        sent: reminders.filter((r) => r.status === 'sent').length,
        failed: reminders.filter((r) => r.status === 'failed').length,
        cancelled: reminders.filter((r) => r.status === 'cancelled').length
      }
    });
  } catch (error) {
    console.error('GET /reminders/invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/reminders/status
 * Returns summary of all reminders for the user
 */
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const invoiceIds = await Invoice.find({ userId }).distinct('_id');
    const allReminders = await Reminder.find({ invoiceId: { $in: invoiceIds } }).lean();

    const summary = {
      total: allReminders.length,
      pending: allReminders.filter((r) => r.status === 'pending').length,
      sent: allReminders.filter((r) => r.status === 'sent').length,
      failed: allReminders.filter((r) => r.status === 'failed').length,
      cancelled: allReminders.filter((r) => r.status === 'cancelled').length,
      nextDueReminders: []
    };

    // Get reminders due in the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcoming = allReminders
      .filter(
        (r) => r.status === 'pending' && r.scheduledDate >= now && r.scheduledDate <= tomorrow
      )
      .sort((a, b) => a.scheduledDate - b.scheduledDate)
      .slice(0, 5);

    for (const reminder of upcoming) {
      const invoice = await Invoice.findById(reminder.invoiceId).select('invoiceNumber amount clientId').lean();
      if (invoice) {
        summary.nextDueReminders.push({
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          type: reminder.type,
          scheduledDate: reminder.scheduledDate,
          typeLabel: REMINDER_CONFIG[reminder.type]?.label || reminder.type
        });
      }
    }

    res.json(summary);
  } catch (error) {
    console.error('GET /reminders/status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
