import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={{ background: '#333', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
          Invoice Reminder
        </Link>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/create-invoice" style={{ color: 'white', textDecoration: 'none' }}>Create Invoice</Link>
        <Link to="/sent-emails" style={{ color: 'white', textDecoration: 'none' }}>Sent Emails</Link>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px' }}>
          {user.plan === 'free' ? `Free (${user.invoiceCount}/3)` : 'Paid Plan ∞'}
        </span>
        <span>{user.name}</span>
        <button onClick={handleLogout} style={{ padding: '5px 15px', cursor: 'pointer' }}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;