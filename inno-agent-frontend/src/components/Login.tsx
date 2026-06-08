import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { loginApi } from '../api/auth';
import { User } from '../types';

interface LoginProps {
  key?: React.Key;
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
}

export function Login({ onLoginSuccess, onNavigateToRegister }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const feedbackMessage = error ?? successMsg;
  const feedbackClass = error
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-green-200 bg-green-50 text-green-700';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError(t('login.error.emailRequired'));
      return;
    }
    if (!password) {
      setError(t('login.error.passwordRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await loginApi(email, password);
      if (response.success) {
        setSuccessMsg(response.message);
        // Let user see success for a brief moment before transition
        setTimeout(() => {
          onLoginSuccess(response.user ?? { fullName: email, email });
        }, 800);
      } else {
        setError(response.message);
        setLoading(false);
      }
    } catch (err) {
      setError(t('login.error.unexpected'));
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-[480px] relative z-10 px-0"
    >
      <div className="bg-brand-surface-lowest level-2-card border border-brand-outline-variant rounded-[14px] px-10 pt-10 pb-11 flex min-h-[602px] flex-col">

        {/* Branding Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-[60px] h-[60px] bg-brand-primary rounded-[10px] flex items-center justify-center shadow-sm">
            <span className="font-sans font-semibold text-[28px] leading-none text-white tracking-[-0.02em]">
              IA
            </span>
          </div>
          <h1 className="font-sans font-bold text-[28px] leading-[1.15] text-brand-primary mt-[27px]">
            Inno Agent
          </h1>
          <p className="font-sans text-[16px] leading-5 text-brand-on-surface mt-[17px] tracking-[0.02em]">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Status Messages */}
        <div className="mt-2 h-12" aria-live="polite" aria-atomic="true">
          {feedbackMessage && (
            <div className={`flex h-full w-full items-center rounded-md border px-4 font-sans text-[14px] leading-5 ${feedbackClass}`}>
              <span className="truncate">{feedbackMessage}</span>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col" noValidate>

          {/* Email Field */}
          <div className="flex flex-col gap-[7px]">
            <label className="font-sans text-[15px] leading-5 font-medium text-brand-primary tracking-[0.02em]" htmlFor="login-email">
              {t('login.emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-on-surface-variant w-4 h-4 pointer-events-none" strokeWidth={1.8} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@inno.com"
                required
                disabled={loading}
                className="w-full h-[53px] bg-brand-surface border border-brand-outline-variant rounded-[10px] pl-[52px] pr-4 font-sans text-[16px] text-brand-on-surface placeholder:text-brand-on-surface-variant/55 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mt-[20px] flex flex-col gap-[7px]">
            <label className="font-sans text-[15px] leading-5 font-medium text-brand-primary tracking-[0.02em]" htmlFor="login-password">
              {t('login.passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-on-surface-variant w-4 h-4 pointer-events-none" strokeWidth={1.8} />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full h-[53px] bg-brand-surface border border-brand-outline-variant rounded-[10px] pl-[52px] pr-4 font-sans text-[16px] text-brand-on-surface placeholder:text-brand-on-surface-variant/55 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[45px] bg-brand-secondary hover:bg-brand-secondary/90 text-white rounded-[8px] mt-[30px] font-sans text-[15px] font-semibold flex justify-center items-center gap-[13px] cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('login.loading')}
              </>
            ) : (
              <>{t('login.submit')}</>
            )}
          </button>
        </form>

        {/* Footer Action */}
        <div className="mt-auto text-center pt-9">
          <p className="font-sans text-[16px] leading-5 text-brand-primary">
            {t('login.noAccount')}{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-brand-secondary font-sans text-[15px] font-medium hover:underline cursor-pointer"
            >
              {t('login.signUp')}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
