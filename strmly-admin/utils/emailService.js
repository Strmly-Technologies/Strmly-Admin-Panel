import nodemailer from 'nodemailer';

// Create reusable transporter with provided credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'strmlytechnologies@gmail.com',
    pass: process.env.EMAIL_PASS || 'pjtx nnkb ncux exwb',
  },
});

/**
 * Send OTP email to the specified recipient
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @returns {Promise} - Result of sending email
 */
export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Strmly Admin" <${process.env.EMAIL_USER || 'strmlytechnologies@gmail.com'}>`,
    to: email,
    subject: 'Your Strmly Admin Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #000; text-align: center;">Strmly Admin Login</h2>
        <p>Your one-time password (OTP) for Strmly Admin login is:</p>
        <div style="background: #000; color: #fff; font-size: 24px; padding: 15px; text-align: center; margin: 20px 0; letter-spacing: 5px; font-weight: bold; border-radius: 4px;">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes. Please do not share this with anyone.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you didn't request this OTP, please ignore this email or contact support.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
