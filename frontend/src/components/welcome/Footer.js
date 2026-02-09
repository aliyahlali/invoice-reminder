import React from 'react';

const Footer = () => {
  return (
    <footer className="wr-footer">
      <div className="wr-footer-inner">
        <div>
          <strong>Invoice Reminder</strong>
          <small> © {new Date().getFullYear()}</small>
        </div>
        <div className="wr-footer-links">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="mailto:support@invoicereminder.app">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
