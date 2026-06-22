import React, { useState } from 'react';
import { X, LogOut } from 'lucide-react';

interface SignOutDialogProps {
  isOpen: boolean;
  handleClose: () => void;
  onSignOut: (signOutAllDevices: boolean) => Promise<void>;
}

export const SignOutDialog: React.FC<SignOutDialogProps> = ({ handleClose, onSignOut }) => {
  const [signOutAllDevices, setSignOutAllDevices] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmSignOut = async () => {
    setIsLoggingOut(true);
    setError(null);
    try {
      await onSignOut(signOutAllDevices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign out.');
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={isLoggingOut ? undefined : handleClose} />
      
      {/* Container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-lowest rounded-3xl shadow-lg max-w-md w-full border border-border/10 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                <LogOut size={20} />
              </div>
              <h2 className="text-xl font-bold text-foreground">Sign Out</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoggingOut}
              className="p-2 hover:bg-surface-low rounded-lg transition-colors disabled:opacity-50 text-foreground/60 hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Are you sure you want to sign out? You will need to log back in to access your account.
            </p>

            {/* Sign out of all devices option (Switch Variant) */}
            <label className="flex items-center justify-between gap-4 p-4 bg-surface-low/40 border border-border/10 rounded-2xl cursor-pointer hover:bg-surface-low/75 transition-all select-none group">
              <div className="space-y-0.5 flex-1">
                <span className="text-sm font-semibold text-foreground">
                  Sign out of all devices
                </span>
                <p className="text-xs text-foreground/60">
                  Secure your account by ending all active sessions elsewhere.
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="relative shrink-0">
                <button 
                    onClick={() => setSignOutAllDevices(!signOutAllDevices)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      signOutAllDevices ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      signOutAllDevices ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                {/* <input
                  type="checkbox"
                  checked={signOutAllDevices}
                  onChange={(e) => setSignOutAllDevices(e.target.checked)}
                  disabled={isLoggingOut}
                  className="sr-only peer"
                /> */}
                {/* Switch Track 
                <div className={`w-10 h-6 rounded-full transition-colors duration-200 outline-none ring-offset-background group-focus-within:ring-2 group-focus-within:ring-primary/20 ${
                  signOutAllDevices ? 'bg-primary' : 'bg-border/30'
                } ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`} />*/}
                
                {/* Switch Thumb 
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${
                  signOutAllDevices ? 'translate-x-4' : 'translate-x-0'
                }`} />*/}
              </div>
            </label>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
                {error}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex gap-3 p-6 border-t border-border/10 bg-surface-low/30">
            <button
              onClick={handleClose}
              disabled={isLoggingOut}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-low hover:bg-surface-low/75 text-foreground font-semibold text-sm transition-colors border border-border/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSignOut}
              disabled={isLoggingOut}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-red-500/10"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default SignOutDialog;