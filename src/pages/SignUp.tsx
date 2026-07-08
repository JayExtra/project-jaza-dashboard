import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import config from '../lib/config';
import { useAuth } from '../hooks/useAuth';

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpValues) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      await signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err) {
      const error = err as any;
      if (error.errors) {
        Object.keys(error.errors).forEach((key) => {
          setError(key as any, {
            type: 'server',
            message: error.errors[key],
          });
        });
      }
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setGlobalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${config.apiBaseUrl}/auth/oauth2/google`;
  };

  return (
    <div className="min-h-screen flex w-full font-sans text-foreground">
      {/* Left side: Sign Up Form */}
      <div className="w-full lg:w-1/2 bg-background flex flex-col justify-between p-8 md:p-16 lg:px-24">
        {/* Empty header space for alignment */}
        <div></div>

        <div className="w-full max-w-md mx-auto">
          {isSuccess ? (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-primary/20">
                <CheckCircle2 size={32} className="text-primary" />
              </div>
              <h1 className="text-display-md font-display font-semibold tracking-[-0.02em] text-primary mb-4">
                Registration Successful
              </h1>
              <p className="text-foreground/70 font-sans mb-10 leading-relaxed text-lg">
                Your account has been created successfully. You can now log in to manage your group funds.
              </p>
              <button
                onClick={() => navigate('/signin')}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-ambient xl:text-sm"
              >
                Go to Login <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-display-lg font-display font-semibold tracking-[-0.02em] text-primary mb-4">
                Create an Account
              </h1>
              <p className="text-foreground/70 font-sans mb-10 leading-relaxed text-lg">
                Sign up to manage your group funds and collective architectural growth.
              </p>

              <button
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 mb-6 border border-surface-high rounded-xl flex items-center justify-center gap-3 hover:bg-surface-lowest transition-colors shadow-ambient text-sm font-semibold"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center py-5">
                <div className="flex-grow border-t border-surface-high"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-semibold text-foreground/40 uppercase tracking-widest">
                  Or Use Email
                </span>
                <div className="flex-grow border-t border-surface-high"></div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                      First Name
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      placeholder="Jane"
                      className="w-full bg-surface-container-highest border-transparent rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
                    />
                    {errors.firstName && (
                      <p className="mt-2 text-xs text-error font-medium">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                      Last Name
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      placeholder="Doe"
                      className="w-full bg-surface-container-highest border-transparent rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
                    />
                    {errors.lastName && (
                      <p className="mt-2 text-xs text-error font-medium">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="name@company.com"
                    className="w-full bg-surface-container-highest border-transparent rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
                  />
                  {errors.email && (
                    <p className="mt-2 text-xs text-error font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
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
                  {errors.password && (
                    <p className="mt-2 text-xs text-error font-medium">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-ambient xl:text-sm mt-8"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      SIGN UP <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {globalError && (
                  <div className="mt-4 p-4 bg-error-container text-error rounded-xl text-sm font-medium border border-error/20">
                    {globalError}
                  </div>
                )}
              </form>
            </div>
          )}

          <p className="text-center mt-12 text-sm text-foreground/60">
            Already have an account?{' '}
            <Link to="/signin" className="font-bold text-foreground hover:text-primary transition-colors">
              Log in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-foreground/40 font-bold tracking-widest uppercase mt-12">
          <span>© 2026 Project Jaza</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground/70 transition-colors">Security</a>
            <a href="#" className="hover:text-foreground/70 transition-colors">Privacy</a>
          </div>
        </div>
      </div>

      {/* Right side: Hero Section */}
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
          COLLECTIVE
        </div>

        {/* Central Card */}
        <div className="relative z-10 w-full max-w-md">
          {/* Glass Card */}
          <div className="bg-surface/5 backdrop-blur-[24px] border border-white/10 rounded-[2rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.3)] relative -translate-y-4 translate-x-4">
            {/* Small orange decor card */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shadow-lg">
              <UserPlus size={20} className="text-white" />
            </div>

            <h2 className="text-3xl font-display font-semibold text-white mb-4 leading-tight">
              Built for Integrity, designed for growth.
            </h2>
            <p className="text-white/60 text-sm leading-relaxed pb-4">
              Experience a new standard in digital wealth management where architectural precision meets financial intuition.
            </p>
          </div>

          {/* Outline ghost underlying rect to give depth */}
          <div className="absolute top-0 w-full h-full border border-white/10 rounded-[2rem] -translate-x-4 translate-y-4 -z-10 bg-transparent"></div>
        </div>

        {/* Bottom Orange/Secondary Glow */}
        <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      </div>
    </div>
  );
};
