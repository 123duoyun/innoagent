import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { startInnoAgentApi } from '../api/innoAgent';
import { SandboxStatus, User } from '../types';

const FALLBACK_SANDBOX_URL = 'http://www.innoagent.tech/sandbox/fallback';

interface LoadingProps {
  key?: React.Key;
  currentUser: User | null;
  onBootSuccess: (status: SandboxStatus) => void;
}

export function Loading({ currentUser, onBootSuccess }: LoadingProps) {
  const { t } = useTranslation();
  const isMountedRef = useRef(true);
  const [error, setError] = useState('');

  useEffect(() => {
    isMountedRef.current = true;

    const startSandbox = async () => {
      const userId = currentUser?.id || currentUser?.email;

      if (!userId) {
        onBootSuccess({
          status: 'ready',
          progress: 100,
          message: t('loading.testSandboxLoaded'),
          serviceUrl: FALLBACK_SANDBOX_URL,
        });
        return;
      }

      const status = await startInnoAgentApi(userId);
      if (!isMountedRef.current) return;

      if (status.sandboxId) {
        onBootSuccess(status);
      } else {
        setError(t('loading.startFailed'));
      }
    };

    startSandbox().catch((err) => {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : t('loading.startFailed'));
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser, onBootSuccess, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative z-10 flex w-full max-w-[360px] flex-col items-center px-4"
    >
      <div className="level-2-card flex w-full flex-col items-center rounded-[14px] border border-brand-outline-variant bg-brand-surface-lowest px-10 py-12 text-center">
        {!error ? (
          <div
            className="h-14 w-14 animate-spin rounded-full border-[4px] border-brand-outline-variant/45 border-t-brand-secondary"
            aria-hidden="true"
          />
        ) : (
          <div className="h-14 w-14 rounded-full border-[4px] border-red-400/45 flex items-center justify-center">
            <span className="text-2xl text-red-400">!</span>
          </div>
        )}
        <p className="mt-7 font-sans text-[20px] font-semibold leading-7 text-brand-primary">
          {error || t('loading.sandboxLoading')}
        </p>
        {error && (
          <p className="mt-2 font-mono text-xs text-brand-on-surface-variant">
            {t('loading.startFailedHint')}
          </p>
        )}
      </div>
    </motion.div>
  );
}
