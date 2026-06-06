import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { startInnoAgentApi } from '../api/innoAgent';
import { SandboxStatus, User } from '../types';

const TEST_SANDBOX_URL = 'http://8.146.228.81:3000/';

interface LoadingProps {
  key?: React.Key;
  currentUser: User | null;
  onBootSuccess: (status: SandboxStatus) => void;
}

export function Loading({ currentUser, onBootSuccess }: LoadingProps) {
  const { t } = useTranslation();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const startSandbox = async () => {
      const userId = currentUser?.id || currentUser?.email;

      if (!userId) {
        onBootSuccess({
          status: 'ready',
          progress: 100,
          message: t('loading.testSandboxLoaded'),
          serviceUrl: TEST_SANDBOX_URL,
        });
        return;
      }

      try {
        const status = await startInnoAgentApi(userId);
        if (!isMountedRef.current) return;
        window.setTimeout(() => {
          if (isMountedRef.current) {
            onBootSuccess({
              ...status,
              serviceUrl: TEST_SANDBOX_URL,
            });
          }
        }, 700);
      } finally {
        if (!isMountedRef.current) return;
      }
    };

    const loadTestSandbox = async () => {
      try {
        await startSandbox();
      } catch {
        if (!isMountedRef.current) return;
        window.setTimeout(() => {
          if (isMountedRef.current) {
            onBootSuccess({
              status: 'ready',
              progress: 100,
              message: t('loading.testSandboxLoaded'),
              serviceUrl: TEST_SANDBOX_URL,
            });
          }
        }, 700);
      }
    };

    loadTestSandbox();

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
        <div
          className="h-14 w-14 animate-spin rounded-full border-[4px] border-brand-outline-variant/45 border-t-brand-secondary"
          aria-hidden="true"
        />
        <p className="mt-7 font-sans text-[20px] font-semibold leading-7 text-brand-primary">
          {t('loading.sandboxLoading')}
        </p>
      </div>
    </motion.div>
  );
}
