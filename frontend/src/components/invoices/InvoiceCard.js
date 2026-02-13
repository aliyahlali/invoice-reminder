import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatReminderDate } from '../../utils/formatReminderDate';

const InvoiceCard = ({ invoice, onUpdate }) => {
  const navigate = useNavigate();

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/invoices/${invoice._id}/mark-paid`);
      onUpdate();
    } catch (error) {
      alert('Failed to mark as paid');
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/api/invoices/${invoice._id}`);
      onUpdate();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const dueFormatted = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const nextReminderLabel = invoice.status !== 'paid' && invoice.nextReminder
    ? formatReminderDate(invoice.nextReminder)
    : null;

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '16px 20px',
        borderRadius: '8px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <div style={{ flex: '1 1 260px' }}>
        <h3
          style={{ margin: '0 0 6px 0', fontSize: '1.1rem', cursor: 'pointer' }}
          onClick={() => navigate(`/invoices/${invoice._id}`)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/invoices/${invoice._id}`)}
          role="button"
          tabIndex={0}
        >
          Invoice #{invoice.invoiceNumber} – {invoice.clientId?.name || 'Unknown'}
        </h3>
        <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>
          Amount: ${Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} | Due: {dueFormatted}
        </p>
        {nextReminderLabel && (
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#2e7d32', fontWeight: 500 }}>
            Next reminder: {nextReminderLabel}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {invoice.status !== 'paid' && (
          <button
            type="button"
            onClick={handleMarkPaid}
            style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 500 }}
          >
            Mark Paid
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default InvoiceCard;