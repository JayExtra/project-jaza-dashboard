import React, { useState, useEffect, useRef } from 'react';
import { Loader2, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import config from '../../lib/config';

interface TwoFactorOverlayProps {
  accessToken: string;
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

export const TwoFactorOverlay: React.FC<TwoFactorOverlayProps> = ({
  accessToken,
  email,
  onVerify,
  onCancel,
  isLoading: isVerifyLoading,
  error,
  setError,
}) => {
  const [otpArray, setOtpArray] = useState<string[]>(['', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [isResendLoading, setIsResendLoading] = useState<boolean>(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus the first input on load
  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: number;
    if (resendCooldown > 0) {
      timer = window.setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpArray];

    // Handle paste or multiple character entry
    if (value.length > 1) {
      const pasted = value.slice(0, 5).split('');
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 5) newOtp[index + i] = pasted[i];
      }
      setOtpArray(newOtp);
      const focusIndex = Math.min(index + pasted.length, 4);
      otpRefs.current[focusIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtpArray(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 4) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpArray[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpArray.join('');
    if (otp.length === 5) {
      onVerify(otp);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResendLoading) return;
    setIsResendLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/2fa/otp`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to resend code. Please try again.';
        try {
          const result = JSON.parse(errorText);
          errorMessage = result.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        setError(errorMessage);
        return;
      }

      setResendCooldown(60);
      // Reset code fields
      setOtpArray(['', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsResendLoading(false);
    }
  };

  const isSubmitting = isVerifyLoading || isResendLoading;

  return (
    <div className="fixed inset-0 w-full h-full bg-white z-50 flex items-center justify-center overflow-y-auto font-sans text-foreground">
      <div className="w-full max-w-md mx-auto px-6 py-12 text-center animate-in fade-in zoom-in-95 duration-300">

        {/* Header Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20 mx-auto">
          <KeyRound size={28} className="text-primary animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-display font-semibold tracking-[-0.02em] text-primary mb-4">
          Verify Your Identity
        </h1>

        {/* Helper Description */}
        <p className="text-foreground/70 mb-10 leading-relaxed text-base">
          A 5-digit verification code has been sent to <span className="font-semibold text-foreground">{email}</span>. Please enter the code below to complete sign-in.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-foreground/60 mb-4 tracking-widest uppercase">
              Security Verification Code
            </label>

            <div className="flex justify-center gap-3 sm:gap-4">
              {otpArray.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={digit}
                  disabled={isSubmitting}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 bg-surface-container-highest border border-transparent rounded-xl text-center text-2xl font-bold focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-primary transition-all text-foreground shadow-sm disabled:opacity-50"
                />
              ))}
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="p-4 bg-error-container text-error rounded-xl text-sm font-medium border border-error/20 animate-in fade-in">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={otpArray.join('').length < 5 || isSubmitting}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-ambient xl:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifyLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>VERIFY SECURITY CODE <ArrowRight size={18} /></>
              )}
            </button>

            <div className="flex flex-col gap-4 text-center mt-6">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isSubmitting}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center text-sm font-semibold text-foreground/50 hover:text-foreground/80 transition-colors mt-2"
              >
                <ArrowLeft size={16} className="mr-2" /> Cancel & Back to Login
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-xs text-foreground/30 font-semibold mt-16">
          © 2026 Project Jaza. All rights reserved.
        </div>

      </div>
    </div>
  );
};
