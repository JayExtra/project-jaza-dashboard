import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
  userEmail: string; // The email the user must match
  deleteError: string | null;
  handleClose: () => void;
  onDeleteAccount: (deleteData: boolean) => Promise<void>;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ 
  userEmail, 
  deleteError,
  handleClose, 
  onDeleteAccount 
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ deleteUserData ,  setDeleteUserData ] = useState(false);

  // Button becomes active ONLY when the input exactly matches the user's email
  const isConfirmed = confirmationInput.trim().toLowerCase() === userEmail.trim().toLowerCase();

  useEffect(() => {
    if (deleteError) {
      setError(deleteError);
      setIsDeleting(false);
    }
  }, [deleteError]);

  const handleConfirmDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError(null);
    try {
      await onDeleteAccount(deleteUserData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting your account.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={isDeleting ? undefined : handleClose} />
      
      {/* Container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-lowest rounded-3xl shadow-lg max-w-md w-full border border-border/10 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-xl font-bold text-foreground">Delete Account</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="p-2 hover:bg-surface-low rounded-lg transition-colors disabled:opacity-50 text-foreground/60 hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Warning Message Card */}
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Warning</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                This action is entirely <strong>irreversible</strong>. You will permanently lose your profile, data, settings, and access to all associated services.
              </p>
            </div>

            {/* Sign out of all devices option */}
            <label className="flex items-start gap-3 p-4 bg-surface-low/40 border border-border/10 rounded-2xl cursor-pointer hover:bg-surface-low/75 transition-all select-none group">
              <input
                type="checkbox"
                checked={deleteUserData}
                onChange={(e) => setDeleteUserData(e.target.checked)}
                disabled={isDeleting}
                className="mt-1 h-4 w-4 rounded border-border/30 text-primary focus:ring-primary/20 accent-primary disabled:opacity-50"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground group-hover:text-foreground">
                  Delete all associated data
                </span>
                <p className="text-xs text-foreground/60">
                  Deleting your account will also remove all your data from our servers. This action cannot be undone.
                </p>
              </div>
            </label>

            {/* Input Prompt */}
            <div className="space-y-2">
              <label className="block text-sm text-foreground/80">
                To confirm, please type your email address: <span className="font-semibold text-foreground select-all">{userEmail}</span>
              </label>
              <input
                type="email"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck="false"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                disabled={isDeleting}
                placeholder="type your email here"
                className="w-full px-4 py-3 rounded-xl bg-surface-low/50 border border-border/20 text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all disabled:opacity-50"
              />
            </div>

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
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-low hover:bg-surface-low/75 text-foreground font-semibold text-sm transition-colors border border-border/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={!isConfirmed || isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:hover:bg-red-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DeleteAccountDialog;