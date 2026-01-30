import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import InvoiceCard from '../components/invoices/InvoiceCard';
import UpgradeModal from '../components/UpgradeModal';
import api from '../utils/api';
import { formatReminderDate } from '../utils/formatReminderDate';

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [nextReminderDate, setNextReminderDate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/invoices', { params });
      setInvoices(data.invoices || []);
      setUnpaidCount(data.unpaidCount ?? 0);
      setPaidCount(data.paidCount ?? 0);
      setTotalCount(data.totalCount ?? 0);
      setNextReminderDate(data.nextReminderDate ?? null);
    } catch (error) {
      console.error('Failed to load invoices');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Dashboard</h1>
        <button onClick={() => navigate('/create-invoice')} style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px', fontSize: '16px' }}>
          + Create Invoice
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Unpaid</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>{unpaidCount}</p>
        </div>
        <div style={{ flex: '1 1 200px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Paid</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>{paidCount}</p>
        </div>
        <div style={{ flex: '1 1 200px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Total</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>{totalCount}</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px', padding: '12px 16px', background: '#e8f5e9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontWeight: 600 }}>
          Unpaid: {unpaidCount}
        </span>
        <span style={{ color: '#2e7d32' }}>
          Next Reminder: {nextReminderDate ? formatReminderDate(nextReminderDate) : '—'}
        </span>
      </div>

      {user?.plan === 'free' && user.invoiceCount >= 3 && (
        <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffc107' }}>
          <strong>Free plan limit reached!</strong> Upgrade to create unlimited invoices.
          <button onClick={() => setShowUpgrade(true)} style={{ marginLeft: '15px', padding: '5px 15px', background: '#ffc107', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
            Upgrade Now
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '8px 15px', background: filter === 'all' ? '#333' : '#ddd', color: filter === 'all' ? 'white' : 'black', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
          All
        </button>
        <button onClick={() => setFilter('unpaid')} style={{ padding: '8px 15px', background: filter === 'unpaid' ? '#333' : '#ddd', color: filter === 'unpaid' ? 'white' : 'black', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
          Unpaid
        </button>
        <button onClick={() => setFilter('paid')} style={{ padding: '8px 15px', background: filter === 'paid' ? '#333' : '#ddd', color: filter === 'paid' ? 'white' : 'black', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
          Paid
        </button>
      </div>

      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          <p>No invoices yet. Create your first one!</p>
        </div>
      ) : (
        invoices.map(invoice => (
          <InvoiceCard key={invoice._id} invoice={invoice} onUpdate={loadInvoices} />
        ))
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
};

export default Dashboard;