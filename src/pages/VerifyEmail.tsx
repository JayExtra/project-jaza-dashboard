import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import config from '../lib/config';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('email_token');
  const navigate = useNavigate();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      if (!token) {
        setStatus('error');
        setStatusMessage('Verification token is missing.');
        return;
      }

      try {
        const accessToken = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');

        const headers: HeadersInit = {};
        if (accessToken && userStr) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${config.apiBaseUrl}/auth/email/verify?email_token=${token}`, {
          headers
        });
        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          if (result.verified) {
            setStatus('success');
            setStatusMessage(result.message || null);

            const hasLocalSession = !!(accessToken && userStr);

            if (result.auth && hasLocalSession) {
              localStorage.setItem('accessToken', result.auth.accessToken);
              localStorage.setItem('refreshToken', result.auth.refreshToken);
              localStorage.setItem('user', JSON.stringify({
                userId: result.auth.userId,
                email: result.auth.email,
                firstName: result.auth.firstName,
                lastName: result.auth.lastName,
                role: result.auth.role,
                emailVerified: result.auth.emailVerified,
                organisation: result.auth.organisation,
              }));
              if (result.auth.accessExpiresIn) {
                const expiryTime = Date.now() + (result.auth.accessExpiresIn * 1000);
                localStorage.setItem('tokenExpiry', expiryTime.toString());
              }
            }

            // Wait 3 seconds to show success animation before redirecting
            setTimeout(() => {
              // Redirect to home only if they had a local session and backend says they don't need login
              if (hasLocalSession && !result.requiresLogin) {
                navigate('/');
              } else {
                navigate('/signin');
              }
            }, 3000);
          } else {
            setStatus('error');
            setStatusMessage(result.message || 'Verification failed.');
          }
        } else {
          setStatus('error');
          setStatusMessage(result.message || 'Failed to verify email. The token may be invalid or expired.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setStatusMessage('An unexpected error occurred. Please try again later.');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#00342b] via-[#00342b] to-[#00251f] font-sans relative overflow-hidden">
      {/* Decorative Geometric Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-md bg-surface/5 backdrop-blur-[24px] border border-white/10 rounded-[2rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.3)] flex flex-col items-center text-center">

        {/* Icon Container */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-background/10 border border-white/20 rounded-2xl flex items-center justify-center shadow-lg transform rotate-[-4deg]">
            {status === 'verifying' && (
              <Loader2 size={40} className="text-secondary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 size={40} className="text-success animate-[bounce_0.5s_ease-in-out]" />
            )}
            {status === 'error' && (
              <XCircle size={40} className="text-error" />
            )}
          </div>
          {status === 'verifying' && (
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md transform rotate-[8deg] animate-pulse">
              <Mail size={18} className="text-white" />
            </div>
          )}
        </div>

        {/* Text Content */}
        {status === 'verifying' && (
          <>
            <h2 className="text-2xl font-display font-semibold text-white mb-3">
              Verifying Email
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Please wait a moment while we securely verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <h2 className="text-2xl font-display font-semibold text-white mb-3">
              Email Verified!
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              {statusMessage || 'Your email has been successfully verified. You will be redirected shortly.'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-display font-semibold text-white mb-3">
              Verification Failed
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              {statusMessage}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors border border-white/10"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
