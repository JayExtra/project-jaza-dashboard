import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, AlertCircle } from 'lucide-react';
import config from '../../../lib/config';
import { useAuth } from '../../../hooks/useAuth';

export const EmailVerificationOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const { user, accessToken, updateUser } = useAuth();

  useEffect(() => {
    // Check if user is signed in and email is not verified
    if (user && user.emailVerified === false) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  // Setup polling if dialog is open
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;
    if (isOpen && accessToken) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${config.apiBaseUrl}/auth/email/verification/status`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.isVerified) {
              // Update user state
              updateUser({ emailVerified: true });
              setIsOpen(false);
            }
          }
        } catch (error) {
          console.error("Error polling email verification status", error);
        }
      }, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, accessToken, updateUser]);

  // Cooldown countdown effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || attemptsRemaining === 0 || isResending) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/email/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        }
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setResendMessage(data.message || 'Verification email resent successfully.');
        setCooldown(data.cooldownSeconds || 60);
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
      } else {
        setResendMessage(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      console.error("Resend error", error);
      setResendMessage('An unexpected error occurred while resending.');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  const isCompletelyDisabled = attemptsRemaining !== null && attemptsRemaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-surface-lowest border border-border rounded-[2rem] p-10 shadow-2xl w-full max-w-md relative flex flex-col items-center text-center overflow-hidden">

        {/* Animated Background Splashes */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/30 rounded-full blur-[50px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/30 rounded-full blur-[50px] pointer-events-none mix-blend-screen"></div>

        <div className="relative mb-6 z-10 w-20 h-20 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-center shadow-sm">
          <Mail size={40} className="text-secondary animate-pulse" />
        </div>

        <h2 className="text-2xl font-display font-semibold text-on-surface mb-3 z-10">
          Verify Your Email
        </h2>

        <p className="text-on-surface/70 text-sm leading-relaxed mb-8 z-10">
          Your account is almost ready. We've sent an email to your address.
          Please check your inbox and click the verification link to proceed.
          This page will automatically update once you've verified.
        </p>

        {isCompletelyDisabled ? (
          <div className="w-full bg-error/10 border border-error/20 text-error p-4 rounded-xl text-sm font-medium flex items-start gap-3 text-left">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <span>You have exceeded the maximum number of resend attempts. Please contact support for assistance.</span>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center z-10">
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm text-sm ${isCompletelyDisabled
                ? 'bg-error text-white opacity-50 cursor-not-allowed'
                : cooldown > 0
                  ? 'bg-surface-highest text-on-surface/40 cursor-not-allowed'
                  : 'bg-primary text-on-primary hover:bg-primary/90'
                }`}
            >
              {isResending ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : cooldown > 0 ? (
                `Resend available in ${cooldown}s`
              ) : (
                'Resend Email'
              )}
            </button>

            {resendMessage && (
              <p className={`mt-4 text-xs font-medium ${resendMessage.includes('error') || resendMessage.includes('Failed') ? 'text-error' : 'text-success'}`}>
                {resendMessage}
              </p>
            )}

            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <p className="mt-3 text-xs text-on-surface/50 font-medium">
                {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
