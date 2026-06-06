import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, KeyRound, ArrowRight, Loader2, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { registerApi } from '../api/auth';

interface RegisterProps {
  key?: React.Key;
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export function Register({ onRegisterSuccess, onNavigateToLogin }: RegisterProps) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

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

    // Validate client-side
    if (!fullName.trim()) {
      setError(t('register.error.nameRequired'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(t('register.error.emailInvalid'));
      return;
    }
    if (password.length < 6) {
      setError(t('register.error.passwordLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('register.error.passwordMismatch'));
      return;
    }
    if (!inviteCode.trim()) {
      setError(t('register.error.inviteCodeRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await registerApi(fullName, email, password, inviteCode);

      if (response.success) {
        setSuccessMsg(`${response.message} ${t('register.successRedirect')}`);
        // Smooth timeout to let the user see success message before navigating back
        setTimeout(() => {
          onRegisterSuccess();
        }, 1500);
      } else {
        setError(response.message);
        setLoading(false);
      }
    } catch (err) {
      setError(t('register.error.network'));
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
      <div className="bg-brand-surface-lowest level-2-card border border-brand-outline-variant rounded-[14px] px-10 pt-6 pb-6 flex flex-col">

        {/* Header Section */}
        <header className="flex flex-col items-center justify-center text-center">
          <div className="w-[56px] h-[56px] bg-brand-primary rounded-[10px] flex items-center justify-center shadow-sm">
            <span className="font-sans font-semibold text-[26px] leading-none text-white tracking-[-0.02em]">
              IA
            </span>
          </div>
          <h1 className="font-sans font-bold text-[28px] leading-[1.15] text-brand-primary mt-[18px]">Inno Agent</h1>
          <p className="font-sans text-[16px] leading-5 text-brand-on-surface mt-[10px] tracking-[0.02em]">{t('register.subtitle')}</p>
        </header>

        {/* Status Messages */}
        <div className="mt-1 h-12" aria-live="polite" aria-atomic="true">
          {feedbackMessage && (
            <div className={`flex h-full w-full items-center rounded-md border px-4 font-sans text-[14px] leading-5 ${feedbackClass}`}>
              <span className="truncate">{feedbackMessage}</span>
            </div>
          )}
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="mt-1 flex flex-col" noValidate>

          {/* Full Name */}
          <div className="flex flex-col gap-[7px]">
            <label className="font-sans text-[15px] leading-5 font-medium text-brand-primary tracking-[0.02em]" htmlFor="reg-name">
              {t('register.nameLabel')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-brand-on-surface-variant pointer-events-none">
                <UserIcon className="w-4 h-4" strokeWidth={1.8} />
              </span>
              <input
                id="reg-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                disabled={loading}
                className="w-full h-[46px] bg-brand-surface border border-brand-outline-variant rounded-[10px] pl-[52px] pr-4 font-sans text-[16px] text-brand-on-surface placeholder:text-brand-on-surface-variant/55 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mt-[10px] flex flex-col gap-[7px]">
            <label className="font-sans text-[15px] leading-5 font-medium text-brand-primary tracking-[0.02em]" htmlFor="reg-email">
              {t('register.emailLabel')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-brand-on-surface-variant pointer-events-none">
                <Mail className="w-4 h-4" strokeWidth={1.8} />
              </span>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                disabled={loading}
                className="w-full h-[46px] bg-brand-surface border border-brand-outline-variant rounded-[10px] pl-[52px] pr-4 font-sans text-[16px] text-brand-on-surface placeholder:text-brand-on-surface-variant/55 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mt-[10px] flex flex-col gap-[7px]">
            <label className="font-sans text-[15px] leading-5 font-medium text-brand-primary tracking-[0.02em]" htmlFor="reg-pass">
              {t('register.passwordLabel')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-brand-on-surface-variant pointer-events-none">
                <Lock className="w-4 h-4" strokeWidth={1.8} />
              </span>
              <input
                id="reg-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full h-[46px] bg-brand-surface border border-brand-outline-variant rounded-[10px] pl-[52px] pr-4 font-sans text-[16px] text-brand-on-surface placeholder:text-brand-on-surface-variant/55 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mt-[10px] flex flex-col gap-[7px]">
            <label className="font-sans text-[15px] leading-5 font-medium text-brand-primary tracking-[0.02em]" htmlFor="reg-confirm">
              {t('register.confirmPasswordLabel')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-brand-on-surface-variant pointer-events-none">
                <KeyRound className="w-4 h-4" strokeWidth={1.8} />
              </span>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full h-[46px] bg-brand-surface border border-brand-outline-variant rounded-[10px] pl-[52px] pr-4 font-sans text-[16px] text-brand-on-surface placeholder:text-brand-on-surface-variant/55 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Invite Code */}
          <div className="mt-[10px] flex flex-col gap-[7px]">
            <label className="font-sans text-[15px] leading-5 font-medium text-brand-primary tracking-[0.02em]" htmlFor="reg-invite">
              {t('register.inviteCodeLabel')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-brand-on-surface-variant pointer-events-none">
                <Ticket className="w-4 h-4" strokeWidth={1.8} />
              </span>
              <input
                id="reg-invite"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={t('register.inviteCodeLabel')}
                required
                disabled={loading}
                className="w-full h-[46px] bg-brand-surface border border-brand-outline-variant rounded-[10px] pl-[52px] pr-4 font-sans text-[16px] text-brand-on-surface placeholder:text-brand-on-surface-variant/55 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[45px] bg-brand-secondary hover:bg-brand-secondary/90 text-white rounded-[8px] mt-[20px] font-sans text-[15px] font-semibold flex items-center justify-center gap-[13px] cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('register.loading')}
              </>
            ) : (
              <>
                {t('register.submit')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer / Link */}
        <div className="mt-auto text-center pt-5">
          <p className="font-sans text-[16px] leading-5 text-brand-primary">
            {t('register.hasAccount')}{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-sans text-[15px] font-medium text-brand-secondary hover:underline cursor-pointer"
            >
              {t('register.login')}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
