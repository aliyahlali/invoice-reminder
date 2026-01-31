import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const typeLabels = {
  before_due: 'Before due',
  on_due: 'On due date',
  after_due: 'After due'
};

const SentEmails = () => {
  const [totalSent, setTotalSent] = useState(0);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadSent();
  }, []);

  const loadSent = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/reminders/sent');
      setTotalSent(data.totalSent ?? 0);
      setSent(data.sent ?? []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load sent emails.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Sent reminder emails</h1>
      {error && (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '24px', padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Emails sent: <strong>{totalSent}</strong>
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#555' }}>
          Reminders run daily at 9 AM. Content below is reconstructed from your invoices and templates.
        </p>
      </div>

      {sent.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#666', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>No reminder emails have been sent yet.</p>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>
            Create invoices with due dates; reminders are sent before, on, and after the due date.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sent.map((item) => (
            <div
              key={item._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#fff'
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ flex: '1 1 280px' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
                    {item.subject}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>
                    To: {item.to || '—'} · Invoice #{item.invoiceNumber || '—'} · {typeLabels[item.type] || item.type}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#888' }}>
                    Sent: {formatDate(item.sentDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                  style={{
                    padding: '8px 16px',
                    background: expandedId === item._id ? '#333' : '#eee',
                    color: expandedId === item._id ? '#fff' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {expandedId === item._id ? 'Hide content' : 'View content'}
                </button>
              </div>
              {expandedId === item._id && item.html && (
                <div
                  style={{
                    borderTop: '1px solid #eee',
                    padding: '20px',
                    background: '#fafafa',
                    maxHeight: '420px',
                    overflow: 'auto'
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: item.html }}
                    style={{
                      maxWidth: '600px',
                      margin: '0 auto',
                      background: '#fff',
                      padding: '24px',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentEmails;
