import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PaymentConfirm = () => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useParams();

  useEffect(() => {
    loadInvoice();
  }, [token]);

  const loadInvoice = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/invoices/pay/${token}`);
      setInvoice(data.invoice);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid payment link');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1 style={{ color: '#4CAF50' }}>✓ Payment Confirmed</h1>
      <p>Thank you! This invoice has been marked as paid.</p>
      
      <div style={{ background: '#f5f5f5', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
        <p><strong>Invoice:</strong> #{invoice?.invoiceNumber}</p>
        <p><strong>Amount:</strong> ${invoice?.amount.toFixed(2)}</p>
        <p><strong>Client:</strong> {invoice?.clientId?.name}</p>
        <p><strong>Paid At:</strong> {new Date(invoice?.paidAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default PaymentConfirm;