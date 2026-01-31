// routes/stripe.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const auth = require('../middleware/Auth');

const router = express.Router();

// Create Checkout Session
router.post('/create-checkout', auth, async (req, res) => {
  try {
    // Check if already paid
    if (req.user.plan === 'paid') {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    // Create or retrieve Stripe customer
    let customerId = req.user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      customerId = customer.id;
      
      await User.findByIdAndUpdate(req.user._id, {
        stripeCustomerId: customerId
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Monthly price ID from Stripe
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=cancelled`,
      metadata: {
        userId: req.user._id.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const subscriptionId = session.subscription;

        await User.findByIdAndUpdate(userId, {
          plan: 'paid',
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: session.customer
        });

        console.log(`✓ User ${userId} upgraded to paid plan`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata.userId;

        // Handle subscription status changes
        if (subscription.status === 'active') {
          await User.findByIdAndUpdate(userId, {
            plan: 'paid',
            stripeSubscriptionId: subscription.id
          });
        } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
          await User.findByIdAndUpdate(userId, {
            plan: 'free',
            stripeSubscriptionId: null
          });
          console.log(`✓ User ${userId} downgraded to free plan`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata.userId;

        await User.findByIdAndUpdate(userId, {
          plan: 'free',
          stripeSubscriptionId: null
        });

        console.log(`✓ User ${userId} subscription cancelled`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const userId = customer.metadata.userId;

        // Optional: Send email notification about failed payment
        console.log(`✗ Payment failed for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get subscription status
router.get('/subscription', auth, async (req, res) => {
  try {
    if (!req.user.stripeSubscriptionId) {
      return res.json({ 
        plan: req.user.plan,
        subscription: null 
      });
    }

    const subscription = await stripe.subscriptions.retrieve(
      req.user.stripeSubscriptionId
    );

    res.json({
      plan: req.user.plan,
      subscription: {
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    if (!req.user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const subscription = await stripe.subscriptions.update(
      req.user.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    res.json({ 
      message: 'Subscription will cancel at period end',
      cancelAt: subscription.current_period_end
    });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Create customer portal session
router.post('/portal', auth, async (req, res) => {
  try {
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Failed to create portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

module.exports = router;