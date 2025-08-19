'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  // Check for existing token and redirect to dashboard if found
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Error checking authentication:", err);
    }
  }, [router]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Send request to get OTP
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'rohithbn27@gmail.com', // Always send to this email
          username, 
          password 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep('otp');
        // Start a 60-second countdown for resend button
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'rohithbn27@gmail.com', 
          otp 
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to verify OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'rohithbn27@gmail.com',
          username,
          password
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Start a 60-second countdown for resend button
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar (brand only on login) */}
      <nav className="w-full bg-black text-white px-6 h-14 flex items-center justify-between">
        <span className="font-bold tracking-wider">STRMLY ADMIN</span>
      </nav>
      <div className="flex items-center justify-center pt-10">
        {step === 'credentials' ? (
          <form
            onSubmit={handleCredentialsSubmit}
            className="bg-black mt-44 text-white p-8 rounded-lg shadow-lg min-w-[320px] flex flex-col gap-4"
          >
            <h2 className="text-center mb-4 tracking-wider text-2xl font-bold">STRMLY Admin Login</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="p-3 border border-white rounded bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="p-3 border border-white rounded bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            {error && (
              <div className="text-red-500 text-center">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="p-3 bg-white text-black rounded font-bold cursor-pointer tracking-wide hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Continue with OTP'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              An OTP will be sent to the admin email address
            </p>
          </form>
        ) : (
          <form
            onSubmit={handleOtpSubmit}
            className="bg-black mt-44 text-white p-8 rounded-lg shadow-lg min-w-[320px] flex flex-col gap-4"
          >
            <h2 className="text-center mb-4 tracking-wider text-2xl font-bold">Enter OTP</h2>
            <p className="text-sm text-gray-400 text-center mb-4">
              We've sent a one-time password to <strong>rohithbn27@gmail.com</strong>
            </p>
            
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="p-3 border border-white rounded bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-white text-center text-xl tracking-widest"
              required
              maxLength={6}
              pattern="\d{6}"
              autoComplete="one-time-code"
              inputMode="numeric"
            />
            
            {error && (
              <div className="text-red-500 text-center">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="p-3 bg-white text-black rounded font-bold cursor-pointer tracking-wide hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
            
            <div className="text-center mt-2 space-y-2">
              <p className="text-sm text-gray-400">
                {countdown > 0 
                  ? `Resend OTP in ${countdown}s` 
                  : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      className="text-white hover:underline"
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  )
                }
              </p>
              
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-sm text-gray-400 hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
