import React from 'react';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="wr-cta">
      <div className="wr-cta-inner">
        <h3>Ready to stop chasing payments?</h3>
        <p>Start a free account and send your first reminder in minutes.</p>
        <Link to="/register" className="wr-btn-primary">Create free account</Link>
      </div>
    </section>
  );
};

export default CTA;
