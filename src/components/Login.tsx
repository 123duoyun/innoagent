import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { loginApi } from '../mockApi';
import { User } from '../types';

interface LoginProps {
  key?: React.Key;
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
}

export function Login({ onLoginSuccess, onNavigateToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await loginApi(email, password);
      if (response.success && response.user) {
        setSuccessMsg(response.message);
        // Let user see success for a brief moment before transition
        setTimeout(() => {
          onLoginSuccess(response.user!);
        }, 800);
      } else {
        setError(response.message);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurrred. Please try again.');
      setLoading(false);
    }
  };

  // Helper to pre-fill test credentials
  const fillTestCredentials = () => {
    setEmail('agent@inno.com');
    setPassword('123456');
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-md relative z-10 px-4"
    >
      <div className="bg-brand-surface-lowest level-2-card border border-brand-outline-variant/60 rounded-xl p-8 flex flex-col gap-8">
        
        {/* Branding Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 bg-brand-primary rounded-lg flex items-center justify-center shadow-md">
            <span className="font-sans font-semibold text-xl text-on-primary tracking-tighter">
              IA
            </span>
          </div>
          <h1 className="font-sans font-bold text-2xl text-brand-primary mt-2">
            Inno Agent
          </h1>
          <p className="font-sans text-sm text-brand-on-surface-variant">
            Sign in to your workspace
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-xs font-mono flex items-start gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-md p-3 text-xs font-mono flex items-start gap-2 animate-pulse">
            <span className="font-bold">Success:</span> {successMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Email Field */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs font-medium text-brand-on-surface" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-on-surface-variant/70 w-4 h-4 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@inno.com"
                required
                disabled={loading}
                className="w-full bg-brand-surface border border-brand-outline-variant rounded-md pl-10 pr-3 py-2.5 font-sans text-sm text-brand-on-surface placeholder:text-brand-on-surface-variant/40 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center w-full">
              <label className="font-mono text-xs font-medium text-brand-on-surface" htmlFor="login-password">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('Demo Feature: Forgot password can be reset by editing credentials, or simply type default agent@inno.com / 123456')}
                className="font-mono text-[11px] text-brand-secondary hover:underline transition-all cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-on-surface-variant/70 w-4 h-4 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-brand-surface border border-brand-outline-variant rounded-md pl-10 pr-10 py-2.5 font-sans text-sm text-brand-on-surface placeholder:text-brand-on-surface-variant/40 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-secondary hover:bg-brand-secondary/90 text-on-primary rounded-md py-2.5 mt-2 font-mono text-xs font-medium flex justify-center items-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Login
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Built-in quick credentials helper */}
        <div className="bg-brand-surface-low border border-brand-outline-variant/40 rounded-md p-3 text-center flex flex-col gap-1.5">
          <p className="font-sans text-[11px] text-brand-on-surface-variant">
            Testing credentials: <strong className="font-mono text-brand-on-surface">agent@inno.com</strong> / <strong className="font-mono text-brand-on-surface">123456</strong>
          </p>
          <button
            type="button"
            onClick={fillTestCredentials}
            className="mx-auto font-mono text-[10px] bg-brand-primary text-on-primary px-2.5 py-1 rounded hover:bg-brand-primary/80 transition-colors uppercase tracking-wider"
          >
            Auto Fill
          </button>
        </div>

        {/* Footer Action */}
        <div className="text-center pt-2 border-t border-brand-outline-variant/20">
          <p className="font-sans text-xs text-brand-on-surface-variant">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-brand-secondary font-mono text-xs font-semibold hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
