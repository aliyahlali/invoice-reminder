import React from 'react';

const Feature = ({ title, children }) => (
  <div className="wr-feature">
    <strong>{title}</strong>
    <p className="wr-feature-desc">{children}</p>
  </div>
);

const Features = () => {
  return (
    <section className="wr-features">
      <Feature title="Smart Reminders">Schedule polite, automated reminder emails on customizable intervals.</Feature>
      <Feature title="Simple Invoicing">Create and send clean invoices in seconds with reusable templates.</Feature>
      <Feature title="Delivery History">See all sent reminders and delivery status at a glance.</Feature>
    </section>
  );
};

export default Features;
