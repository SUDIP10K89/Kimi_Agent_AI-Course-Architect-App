/**
 * Verify Email Page
 *
 * Page for email verification using OTP.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { verifyEmail, resendVerification } from '@/api/authApi';
import { useAuth } from '@/contexts/AuthContext';

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error' | 'resend';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [message, setMessage] = useState('Enter the OTP sent to your email');
  const [email, setEmail] = useState<string>(searchParams.get('email') || '');
  const [otp, setOtp] = useState<string>('');

  // Check if there's an email in the URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setStatus('error');
      return;
    }
    
    if (!otp.trim()) {
      setMessage('Please enter the OTP');
      setStatus('error');
      return;
    }

    if (otp.trim().length !== 6) {
      setMessage('OTP must be 6 digits');
      setStatus('error');
      return;
    }

    try {
      setStatus('verifying');
      setMessage('Verifying...');

      const response = await verifyEmail(email.trim(), otp.trim());

      if (response.success && response.data) {
        setStatus('success');
        setMessage('Email verified successfully!');

        // Auto-login after verification
        setAuth(response.data.user, response.data.token);
        
        // Redirect to courses after a short delay
        setTimeout(() => {
          navigate('/courses');
        }, 2000);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Invalid or expired OTP');
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    try {
      setStatus('verifying');
      setMessage('Sending OTP...');

      const response = await resendVerification(email.trim());

      if (response.success) {
        setMessage(response.data?.message || 'OTP sent! Check your inbox.');
        setStatus('idle');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <p className="mt-4 text-gray-900 font-medium">{message}</p>
              <p className="mt-2 text-sm text-green-600">Redirecting to your courses...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <p className="mt-4 text-gray-900 font-medium">Verification Failed</p>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Login
              </button>
            </div>
          )}

          {(status === 'idle' || status === 'resend') && (
            <div className="text-center">
              <Mail className="w-16 h-16 text-indigo-500 mx-auto" />
              <p className="mt-4 text-gray-900 font-medium">Enter OTP</p>
              <p className="mt-2 text-sm text-gray-600">{message}</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Verification Code (OTP)
                  </label>
                  <div className="mt-1">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-widest font-mono"
                      placeholder="Enter 6-digit OTP"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleVerify}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Verify Email
              </button>

              <button
                onClick={handleResend}
                className="mt-4 w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Resend OTP
              </button>

              <button
                onClick={() => navigate('/login')}
                className="mt-4 w-full text-sm text-gray-600 hover:text-gray-500"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
