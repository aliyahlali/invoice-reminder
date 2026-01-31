import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatReminderDate } from '../utils/formatReminderDate';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [nextReminder, setNextReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/invoices/${id}`);
      setInvoice(data.invoice);
      setReminders(data.reminders || []);
      setNextReminder(data.nextReminder ?? null);
    } catch (e) {
      setError(e.response?.status === 404 ? 'Invoice not found.' : 'Failed to load invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      await api.patch(`/invoices/${id}/mark-paid`);
      navigate('/dashboard');
    } catch (e) {
      alert('Failed to mark as paid');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        Loading…
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: '#c62828' }}>
        <p>{error || 'Invoice not found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: 16, padding: '8px 16px', background: '#333', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const dueFormatted = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const nextReminderLabel = invoice.status !== 'paid' && nextReminder
    ? formatReminderDate(nextReminder)
    : null;

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', cursor: 'pointer', borderRadius: '5px' }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div
        style={{
          border: '1px solid #ddd',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}
      >
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>
          Invoice #{invoice.invoiceNumber} – {invoice.clientId?.name || 'Unknown'}
        </h1>
        <p style={{ margin: '4px 0', fontSize: '15px', color: '#555' }}>
          {invoice.clientId?.email}
        </p>
        <p style={{ margin: '12px 0 4px', fontSize: '15px' }}>
          Amount: <strong>${Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> | Due: {dueFormatted}
        </p>
        {invoice.note && (
          <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
            Note: {invoice.note}
          </p>
        )}
        {nextReminderLabel && (
          <p style={{ margin: '12px 0', fontSize: '15px', color: '#2e7d32', fontWeight: 500 }}>
            Next reminder: {nextReminderLabel}
          </p>
        )}
        {invoice.status !== 'paid' && (
          <button
            type="button"
            onClick={handleMarkPaid}
            style={{ marginTop: 16, padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 500 }}
          >
            Mark Paid
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;
