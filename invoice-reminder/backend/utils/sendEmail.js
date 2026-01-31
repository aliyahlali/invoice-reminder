const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: "RESEND_API_KEY is not configured"
      };
    }

    const result = await resend.emails.send({
      from: "Invoice Reminder <noreply@getauraapps.com>",
      to,
      subject,
      html,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message
      };
    }

    console.log(`✓ Email sent to ${to}:`, result.id);
    return {
      success: true,
      messageId: result.id
    };
  } catch (error) {
    console.error("Email send error:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = sendEmail;
