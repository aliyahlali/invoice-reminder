/**
 * Shared email template logic for reminder emails.
 * Used by EmailScheduler (sending) and ReminderRoute (sent-emails history).
 */

function getEmailTemplate(type, data) {
  const { invoice, client, user, paymentLink } = data;
  const safe = (v, d = '') => (v != null ? v : d);
  const inv = invoice || {};
  const cl = client || {};
  const u = user || {};

  const templates = {
    before_due: {
      subject: `Friendly reminder: Invoice ${safe(inv.invoiceNumber)} due soon`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${safe(cl.name, 'there')},</h2>
          <p>Just a friendly heads up that your invoice is coming due soon.</p>
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>Invoice:</strong> ${safe(inv.invoiceNumber)}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${Number(safe(inv.amount, 0)).toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</p>
            ${inv.note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${inv.note}</p>` : ''}
          </div>
          <p>If you've already sent payment, please disregard this reminder.</p>
          <div style="margin: 30px 0;">
            <a href="${safe(paymentLink, '#')}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Mark as Paid</a>
          </div>
          <p>Thanks!<br>${safe(u.name, '')}</p>
        </div>
      `
    },
    on_due: {
      subject: `Invoice ${safe(inv.invoiceNumber)} is due today`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${safe(cl.name, 'there')},</h2>
          <p>This is a quick reminder that your invoice is due today.</p>
          <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 5px 0;"><strong>Invoice:</strong> ${safe(inv.invoiceNumber)}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${Number(safe(inv.amount, 0)).toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> Today</p>
            ${inv.note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${inv.note}</p>` : ''}
          </div>
          <p>If you've already sent payment, thank you! You can mark it as paid using the button below.</p>
          <div style="margin: 30px 0;">
            <a href="${safe(paymentLink, '#')}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Mark as Paid</a>
          </div>
          <p>Best regards,<br>${safe(u.name, '')}</p>
        </div>
      `
    },
    after_due: {
      subject: `Follow-up: Invoice ${safe(inv.invoiceNumber)} is past due`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${safe(cl.name, 'there')},</h2>
          <p>I wanted to follow up regarding the invoice below, which is now past its due date.</p>
          <div style="background: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
            <p style="margin: 5px 0;"><strong>Invoice:</strong> ${safe(inv.invoiceNumber)}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${Number(safe(inv.amount, 0)).toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</p>
            ${inv.note ? `<p style="margin: 5px 0;"><strong>Note:</strong> ${inv.note}</p>` : ''}
          </div>
          <p>If you've already sent payment, please let me know or mark it as paid below. If you have any questions or need to discuss payment arrangements, feel free to reach out.</p>
          <div style="margin: 30px 0;">
            <a href="${safe(paymentLink, '#')}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Mark as Paid</a>
          </div>
          <p>Thanks for your attention to this matter.<br>${safe(u.name, '')}</p>
        </div>
      `
    }
  };

  return templates[type] || null;
}

module.exports = { getEmailTemplate };
