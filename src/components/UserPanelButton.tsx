import React, { useCallback, useState, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { stopInnoAgentApi } from '../api/innoAgent';
import { User } from '../types';

interface UserPanelButtonProps {
  currentUser: User | null;
  onLogout: () => void;
}

export function UserPanelButton({ currentUser, onLogout }: UserPanelButtonProps) {
  const { t } = useTranslation();
  const [showPanel, setShowPanel] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const displayName = currentUser?.fullName || t('userPanel.defaultName');
  const displayEmail = currentUser?.email || 'agent@inno.com';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const userId = currentUser?.id || currentUser?.email;

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      if (userId) {
        await stopInnoAgentApi(userId);
      }
    } catch {
      // Continue logout even when sandbox cleanup fails.
    } finally {
      onLogout();
    }
  }, [loggingOut, onLogout, userId]);

  // Listen for postMessage from iframe (logout button)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === 'iframe-logout') {
        handleLogout();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleLogout]);

  // Close on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-panel]')) {
        setShowPanel(false);
      }
    };
    // Delay to avoid immediate close from the same click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [showPanel]);

  return (
    <>
      {/* Floating button — bottom-right */}
      <button
        data-user-panel
        onClick={() => setShowPanel((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-[10px] border border-brand-outline-variant bg-brand-surface-lowest text-brand-primary shadow-lg transition-colors hover:border-brand-secondary hover:text-brand-secondary"
        title={t('userPanel.menuTitle')}
      >
        <UserIcon className="h-5 w-5" strokeWidth={1.8} />
      </button>

      {/* User panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            data-user-panel
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="level-2-card fixed bottom-20 right-6 z-50 w-[320px] overflow-hidden rounded-[14px] border border-brand-outline-variant bg-brand-surface-lowest"
          >
            <div className="flex flex-col px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-brand-primary font-sans text-[20px] font-semibold leading-none text-white">
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-sans text-[17px] font-semibold leading-6 text-brand-primary">
                    {displayName}
                  </p>
                  <p className="truncate font-sans text-[14px] leading-5 text-brand-on-surface-variant">
                    {displayEmail}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-px bg-brand-outline-variant/45" />

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-5 flex h-[45px] w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-red-200 bg-red-50 font-sans text-[15px] font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-default disabled:opacity-70"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
                {loggingOut ? t('userPanel.disconnecting') : t('userPanel.disconnect')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
