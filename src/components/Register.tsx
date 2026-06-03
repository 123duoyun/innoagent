import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, KeyRound, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { registerApi } from '../mockApi';

interface RegisterProps {
  key?: React.Key;
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export function Register({ onRegisterSuccess, onNavigateToLogin }: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate client-side
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await registerApi({ fullName, email, password });
      
      if (response.success) {
        setSuccessMsg(`${response.message} Redirecting to login...`);
        // Smooth timeout to let the user see success message before navigating back
        setTimeout(() => {
          onRegisterSuccess();
        }, 1500);
      } else {
        setError(response.message);
        setLoading(false);
      }
    } catch (err) {
      setError('Registration failed. Please check network and try again.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-md relative z-10 px-4"
    >
      <div className="bg-brand-surface-lowest level-2-card border border-brand-outline-variant/60 rounded-xl p-8 flex flex-col gap-6">
        
        {/* Header Section */}
        <header className="flex flex-col items-center justify-center border-b border-brand-outline-variant/20 pb-6 text-center">
          <div className="w-10 h-10 rounded-lg bg-brand-surface-lowest flex items-center justify-center mb-3 border border-brand-outline-variant shadow-sm text-brand-primary">
            <UserIcon className="w-5 h-5 fill-current" />
          </div>
          <h1 className="font-sans font-bold text-2xl text-brand-primary">Inno Agent</h1>
          <p className="font-sans text-sm text-brand-on-surface-variant">Create a new sandbox account</p>
        </header>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-xs font-mono flex items-start gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-md p-3 text-xs font-mono flex items-start gap-2">
            <span className="font-bold">Success:</span> {successMsg}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-brand-on-surface-variant" htmlFor="reg-name">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-brand-on-surface-variant/70 pointer-events-none">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="reg-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                disabled={loading}
                className="w-full bg-brand-surface h-10 pl-9 pr-3 rounded-md border border-brand-outline-variant focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary font-sans text-sm text-brand-on-surface placeholder:text-brand-on-surface-variant/40 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-brand-on-surface-variant" htmlFor="reg-email">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-brand-on-surface-variant/70 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                disabled={loading}
                className="w-full bg-brand-surface h-10 pl-9 pr-3 rounded-md border border-brand-outline-variant focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary font-sans text-sm text-brand-on-surface placeholder:text-brand-on-surface-variant/40 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-brand-on-surface-variant" htmlFor="reg-pass">
              Password (6+ chars)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-brand-on-surface-variant/70 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="reg-pass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-brand-surface h-10 pl-9 pr-10 rounded-md border border-brand-outline-variant focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary font-sans text-sm text-brand-on-surface placeholder:text-brand-on-surface-variant/40 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-on-surface-variant/50 hover:text-brand-on-surface-variant transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-brand-on-surface-variant" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-brand-on-surface-variant/70 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-brand-surface h-10 pl-9 pr-10 rounded-md border border-brand-outline-variant focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary font-sans text-sm text-brand-on-surface placeholder:text-brand-on-surface-variant/40 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-brand-primary hover:bg-brand-primary/90 text-on-primary h-10 rounded-md font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer / Link */}
        <div className="pt-2 text-center border-t border-brand-outline-variant/10">
          <p className="font-sans text-xs text-brand-on-surface-variant">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-mono text-xs font-semibold text-brand-secondary hover:underline cursor-pointer"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
