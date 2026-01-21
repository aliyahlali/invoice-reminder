import React from 'react';
import api from '../../utils/api';

const InvoiceCard = ({ invoice, onUpdate }) => {
  const getStatusColor = () => {
    if (invoice.status === 'paid') return '#4CAF50';
    if (new Date(invoice.dueDate) < new Date()) return '#f44336';
    return '#ff9800';
  };

  const handleMarkPaid = async () => {
    try {
      await api.patch(`/invoices/${invoice._id}/mark-paid`);
      onUpdate();
    } catch (error) {
      alert('Failed to mark as paid');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await api.delete(`/invoices/${invoice._id}`);
        onUpdate();
      } catch (error) {
        alert('Failed to delete');
      }
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ margin: '0 0 5px 0' }}>Invoice #{invoice.invoiceNumber}</h3>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
          {invoice.clientId?.name} ({invoice.clientId?.email})
        </p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          Amount: <strong>${invoice.amount.toFixed(2)}</strong> | Due: {new Date(invoice.dueDate).toLocaleDateString()}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ padding: '5px 10px', borderRadius: '5px', fontSize: '12px', background: getStatusColor(), color: 'white' }}>
          {invoice.status.toUpperCase()}
        </span>
        {invoice.status !== 'paid' && (
          <button onClick={handleMarkPaid} style={{ padding: '5px 15px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
            Mark Paid
          </button>
        )}
        <button onClick={handleDelete} style={{ padding: '5px 15px', background: '#f44336', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default InvoiceCard;