import React from 'react';
import api from '../utils/api';

const UpgradeModal = ({ onClose }) => {
  const handleUpgrade = async () => {
    try {
      const { data } = await api.post('/stripe/create-checkout');
      window.location.href = data.url;
    } catch (error) {
      alert('Failed to start checkout');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '400px' }}>
        <h2>Upgrade to Paid Plan</h2>
        <p>You've reached your free plan limit (3 invoices).</p>
        <p><strong>Upgrade to unlimited invoices for just $9/month</strong></p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={handleUpgrade} style={{ flex: 1, padding: '10px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
            Upgrade Now
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#ccc', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;