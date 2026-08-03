import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, KeyRound, Mail, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import  { config } from '../lib/config';

const apiBaseUrl = config.apiBaseUrl;

// Validation Schemas
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z.string().length(5, 'OTP must be exactly 5 digits').regex(/^\d{5}$/, 'OTP must contain only numbers'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type EmailValues = z.infer<typeof emailSchema>;
type OtpValues = z.infer<typeof otpSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

type Step = 'email' | 'otp' | 'reset';

export const ForgotPassword = () => {
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Shared state across steps
  const [userEmail, setUserEmail] = useState('');
  const [userVerifiedToken, setUserVerifiedToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const [otpArray, setOtpArray] = useState(['', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    let timer: number;
    if (resendCooldown > 0) {
      timer = window.setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    otpForm.setValue('otp', otpArray.join(''));
  }, [otpArray, otpForm]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpArray];
    if (value.length > 1) {
        const pasted = value.slice(0, 5).split('');
        for(let i = 0; i < pasted.length; i++) {
           if (index + i < 5) newOtp[index + i] = pasted[i];
        }
        setOtpArray(newOtp);
        const focusIndex = Math.min(index + pasted.length, 4);
        otpRefs.current[focusIndex]?.focus();
        return;
    }

    newOtp[index] = value;
    setOtpArray(newOtp);

    if (value !== '' && index < 4) {
        otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpArray[index] === '' && index > 0) {
        otpRefs.current[index - 1]?.focus();
    }
  };

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const handleEmailSubmit = async (data: EmailValues) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to send OTP. Please try again.';
        try {
          const result = JSON.parse(errorText);
          errorMessage = result.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        setGlobalError(errorMessage);
        return;
      }

      // Success returns a string message
      await response.text();

      setUserEmail(data.email);
      setResendCooldown(60);
      setStep('otp');
    } catch (err) {
      setGlobalError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setGlobalError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to resend OTP. Please try again.';
        try {
          const result = JSON.parse(errorText);
          errorMessage = result.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        setGlobalError(errorMessage);
        return;
      }

      await response.text();
      setResendCooldown(60);
    } catch (err) {
      setGlobalError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data: OtpValues) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail,
          otp: data.otp 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Invalid OTP. Please check and try again.';
        try {
          const result = JSON.parse(errorText);
          errorMessage = result.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        setGlobalError(errorMessage);
        return;
      }

      const result = await response.json();
      setUserVerifiedToken(result.verifiedToken);
      setStep('reset');
    } catch (err) {
      setGlobalError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail,
          verifiedToken: userVerifiedToken,
          newPassword: data.password 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to reset password. Please try again.';
        try {
          const result = JSON.parse(errorText);
          errorMessage = result.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        setGlobalError(errorMessage);
        return;
      }

      // Success returns a string message
      await response.text();

      // Clear any stored tokens to ensure clean login
      setUserVerifiedToken('');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');

      // Success - Redirect to sign in
      navigate('/signin', { replace: true, state: { message: 'Password reset successful! Please log in with your new password.' } });
    } catch (err) {
      setGlobalError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans text-foreground">
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 bg-background flex flex-col justify-between p-8 md:p-16 lg:px-24">
        {/* Back navigation */}
        <div className="w-full max-w-md mx-auto mb-8">
          <Link to="/signin" className="inline-flex items-center text-sm font-semibold text-foreground/60 hover:text-primary transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Login
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center pb-20">
          
          {step === 'email' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <KeyRound size={24} className="text-primary" />
              </div>
              <h1 className="text-display-lg font-display font-semibold tracking-[-0.02em] text-primary mb-4">
                Forgot Password
              </h1>
              <p className="text-foreground/70 font-sans mb-10 leading-relaxed text-lg">
                Enter your registered email address and we'll send you an OTP to reset your password.
              </p>

              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      {...emailForm.register('email')}
                      type="email"
                      placeholder="arch@ledger.com"
                      className="w-full bg-surface-container-highest border-transparent rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
                    />
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="mt-2 text-xs text-error font-medium">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-ambient xl:text-sm"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>SEND OTP <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 border border-secondary/20">
                <CheckCircle2 size={24} className="text-secondary" />
              </div>
              <h1 className="text-display-lg font-display font-semibold tracking-[-0.02em] text-primary mb-4">
                Check Your Email
              </h1>
              <p className="text-foreground/70 font-sans mb-10 leading-relaxed text-lg">
                We've sent a one-time password (OTP) to <span className="font-semibold text-foreground">{userEmail}</span>. Enter it below.
              </p>

              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-2 tracking-widest uppercase text-center">
                    One-Time Password
                  </label>
                  <div className="flex justify-center gap-3 sm:gap-4 mt-4">
                    {otpArray.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={digit}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 bg-surface-container-highest border border-transparent rounded-xl text-center text-2xl font-bold focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-primary transition-all text-foreground shadow-sm"
                      />
                    ))}
                  </div>
                  {otpForm.formState.errors.otp && (
                    <p className="mt-4 text-xs text-error font-medium text-center">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-ambient xl:text-sm"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>VERIFY OTP <ArrowRight size={18} /></>
                  )}
                </button>
                
                <div className="text-center mt-6 flex flex-col gap-4">
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep('email')}
                    className="text-sm font-semibold text-foreground/40 hover:text-foreground/70 transition-colors"
                  >
                    Change email address
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'reset' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <KeyRound size={24} className="text-primary" />
              </div>
              <h1 className="text-display-lg font-display font-semibold tracking-[-0.02em] text-primary mb-4">
                Secure Your Account
              </h1>
              <p className="text-foreground/70 font-sans mb-10 leading-relaxed text-lg">
                Almost there! Create a new strong password for your account.
              </p>

              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      {...resetForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full bg-surface-container-highest border-transparent rounded-xl pl-4 pr-12 py-4 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.password && (
                    <p className="mt-2 text-xs text-error font-medium">{resetForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      {...resetForm.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full bg-surface-container-highest border-transparent rounded-xl pl-4 pr-12 py-4 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="mt-2 text-xs text-error font-medium">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-ambient xl:text-sm mt-4"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>RESET PASSWORD <ArrowRight size={18} /></>
                  )}
                </button>
              </form>
            </div>
          )}

          {globalError && (
            <div className="mt-6 p-4 bg-error-container text-error rounded-xl text-sm font-medium border border-error/20 animate-in fade-in">
              {globalError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-foreground/40 font-bold tracking-widest uppercase mt-8">
          <span>© 2026 Project Jaza</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground/70 transition-colors">Security</a>
            <a href="#" className="hover:text-foreground/70 transition-colors">Privacy</a>
          </div>
        </div>
      </div>

      {/* Right side: Hero Section (Same as SignIn) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#00342b] via-[#00342b] to-[#00251f] relative overflow-hidden items-center justify-center p-16">
        {/* Geometric Background Metaphors */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="20%" y1="100%" x2="100%" y2="20%" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </svg>
        </div>

        {/* Large Faint Text */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] font-display font-bold text-white/5 whitespace-nowrap tracking-tighter">
          SECURITY
        </div>

        

        {/* Central Card */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-surface/5 backdrop-blur-[24px] border border-white/10 rounded-[2rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.3)] relative -translate-y-4 translate-x-4">
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shadow-lg">
              <KeyRound size={20} className="text-white" />
            </div>

            <h2 className="text-3xl font-display font-semibold text-white mb-4 leading-tight">
              Safeguarding Your Legacy
            </h2>
            <p className="text-white/60 text-sm leading-relaxed pb-4">
              Restoring access with enterprise-grade security protocols, ensuring your collective assets remain strictly in your control.
            </p>
          </div>

          <div className="absolute top-0 w-full h-full border border-white/10 rounded-[2rem] -translate-x-4 translate-y-4 -z-10 bg-transparent"></div>
        </div>

        {/* Bottom Orange/Secondary Glow */}
        <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      </div>
    </div>
  );
};
