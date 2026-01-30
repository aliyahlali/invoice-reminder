const Reminder = require('../models/Reminder');
const mongoose = require('mongoose');

/**
 * Get earliest scheduledDate where sentDate = null, status = 'pending', and invoice is unpaid.
 * Reused for: dashboard summary, invoice list, detail page.
 *
 * @param {Object} options
 * @param {mongoose.Types.ObjectId} options.userId - Required. User's invoices only.
 * @param {mongoose.Types.ObjectId} [options.invoiceId] - Optional. If set, scope to this invoice only.
 * @returns {Promise<{ date: Date | null, byInvoice: Object }>}
 *   - If invoiceId provided: { date, byInvoice: {} }
 *   - If not: { date: global earliest, byInvoice: { [invoiceId]: Date } }
 */
async function getEarliestPendingReminder({ userId, invoiceId }) {
  const pipeline = [
    { $match: { sentDate: null, status: 'pending' } },
    {
      $lookup: {
        from: 'invoices',
        localField: 'invoiceId',
        foreignField: '_id',
        as: 'invoice'
      }
    },
    { $unwind: '$invoice' },
    {
      $match: {
        'invoice.status': 'unpaid',
        ...(userId && { 'invoice.userId': new mongoose.Types.ObjectId(userId) }),
        ...(invoiceId && { invoiceId: new mongoose.Types.ObjectId(invoiceId) })
      }
    }
  ];

  if (invoiceId) {
    pipeline.push(
      { $sort: { scheduledDate: 1 } },
      { $limit: 1 },
      { $project: { scheduledDate: 1 } }
    );
    const [r] = await Reminder.aggregate(pipeline);
    return {
      date: r ? r.scheduledDate : null,
      byInvoice: {}
    };
  }

  pipeline.push(
    { $sort: { scheduledDate: 1 } },
    {
      $group: {
        _id: '$invoiceId',
        earliest: { $first: '$scheduledDate' }
      }
    },
    {
      $group: {
        _id: null,
        global: { $min: '$earliest' },
        byInvoice: { $push: { k: { $toString: '$_id' }, v: '$earliest' } }
      }
    },
    {
      $project: {
        date: '$global',
        byInvoice: { $arrayToObject: '$byInvoice' }
      }
    }
  );

  const [r] = await Reminder.aggregate(pipeline);
  return {
    date: r?.date ?? null,
    byInvoice: r?.byInvoice ?? {}
  };
}

module.exports = { getEarliestPendingReminder };
