const express = require('express');
const sendEmail = require('../utils/sendEmail');
const auth = require('../middleware/Auth');

const router = express.Router();

/**
 * Test email route - POST
 * POST /api/test-email
 */
router.post('/', auth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const result = await sendEmail({
      to: email,
      subject: 'Test Email - Invoice Reminder System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email</h2>
          <p>This is a test email from your Invoice Reminder system.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    });

    if (result.success) {
      return res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        email: email,
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to send test email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET endpoint - Simple test without authentication
 * GET /api/test-email/simple
 */
router.get('/simple', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email address required as query parameter' });
    }

    const result = await sendEmail({
      to: email,
      subject: 'Simple Test Email',
      html: '<h2>Simple Test</h2><p>This is a simple test email from Resend.</p>'
    });

    if (result.success) {
      return res.json({ 
        success: true, 
        message: 'Simple test email sent',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Simple test email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      message: error.message
    });
  }
});

module.exports = router;

