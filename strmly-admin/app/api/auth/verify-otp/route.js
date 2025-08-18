import { getOTP, deleteOTP, getAllOTPEmails } from '@/utils/otpStore';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    
    console.log(`Attempting to verify OTP for ${email}`);
    const storedEmails = await getAllOTPEmails();
    console.log('Currently stored OTPs for emails:', storedEmails);
    
    // Check if OTP exists and is valid
    const storedData = await getOTP(email);
    
    if (!storedData) {
      console.error(`No OTP data found for ${email}`);
      return Response.json({ 
        success: false, 
        message: "No OTP was generated for this email. Please request a new OTP."
      }, { status: 400 });
    }
    
    // Check if OTP is expired
    if (Date.now() > storedData.expires) {
      console.log(`OTP expired for ${email}. Expired at: ${new Date(storedData.expires).toISOString()}`);
      await deleteOTP(email);
      return Response.json({ 
        success: false, 
        message: "OTP has expired. Please request a new one."
      }, { status: 400 });
    }
    
    // Verify OTP
    if (storedData.otp !== otp) {
      console.log(`Invalid OTP for ${email}. Expected: ${storedData.otp}, Received: ${otp}`);
      return Response.json({ 
        success: false, 
        message: "Invalid OTP. Please try again."
      }, { status: 400 });
    }
    
    console.log(`OTP verified successfully for ${email}`);
    
    // OTP is valid, attempt to login with stored credentials
    try {
      const backendUrl = `${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/login`;
      console.log(`Attempting to login with backend at: ${backendUrl}`);
      
      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: storedData.username, 
          password: storedData.password 
        }),
      });
      
      const backendData = await backendResponse.json();
      console.log('Backend response:', { success: backendData.success, hasToken: !!backendData.token });
      
      // Clear OTP to prevent reuse
      await deleteOTP(email);
      
      if (backendData.success && backendData.token) {
        return Response.json({
          success: true,
          message: "Login successful",
          token: backendData.token
        });
      } else {
        return Response.json({
          success: false,
          message: backendData.message || "Authentication failed"
        }, { status: 401 });
      }
    } catch (backendError) {
      console.error('Backend login error:', backendError);
      return Response.json({
        success: false,
        message: "Failed to authenticate with backend"
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return Response.json(
      { error: "Failed to verify OTP", details: error.message }, 
      { status: 500 }
    );
  }
}
