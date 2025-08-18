import { sendOtpEmail } from '@/utils/emailService';
import { storeOTP, getAllOTPEmails } from '@/utils/otpStore';

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, username, password } = body;
    
    console.log('Received OTP request for:', email);
    
    // Only allow specific email as requested
    if (email !== 'rohithbn27@gmail.com') {
      return Response.json({ 
        success: false, 
        message: "OTP login is currently restricted to authorized users only."
      }, { status: 403 });
    }
    
    // Validate username and password are provided
    if (!username || !password) {
      return Response.json({
        success: false,
        message: "Username and password are required"
      }, { status: 400 });
    }
    
    // Generate OTP
    const otp = generateOTP();
    console.log(`Generated OTP for ${email}: ${otp} (REMOVE THIS IN PRODUCTION)`);
    
    // Store OTP with credentials and expiration (10 minutes)
    await storeOTP(email, {
      otp,
      username,
      password,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });
    
    // Debug: List all emails with stored OTPs
    const storedEmails = await getAllOTPEmails();
    console.log('Currently stored OTPs for emails:', storedEmails);
    
    // Send OTP via email
    try {
      await sendOtpEmail(email, otp);
      console.log(`OTP email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Even if email fails, we'll return success since the OTP is stored
      // This allows testing without actual email delivery
    }
    
    return Response.json({ 
      success: true, 
      message: "OTP sent successfully",
      debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
    });
  } catch (error) {
    console.error('Error in send-otp endpoint:', error);
    return Response.json(
      { error: "Failed to send OTP", details: error.message }, 
      { status: 500 }
    );
  }
}
