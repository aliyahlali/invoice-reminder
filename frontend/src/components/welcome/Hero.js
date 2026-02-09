import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="wr-hero">
      <div className="wr-hero-left">
        <h1 className="wr-hero-title">Automate invoice reminders — get paid faster</h1>
        <p className="wr-hero-sub">Create invoices, schedule smart reminders, and track sent emails from a single, simple dashboard.</p>

        <div className="wr-hero-actions">
          <button className="wr-btn-primary" onClick={() => navigate('/register')}>Create free account</button>
          <button className="wr-btn-ghost" onClick={() => navigate('/login')}>Log in</button>
        </div>
      </div>

      <div className="wr-hero-right">
        <div className="wr-preview">
          <div className="wr-preview-box" />
        </div>
        <small className="wr-preview-label">Preview of your invoice dashboard</small>
      </div>
    </section>
  );
};

export default Hero;
