import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { extendSandboxTTLApi } from '../api/innoAgent';
import { SandboxStatus, User } from '../types';

const TEST_SANDBOX_URL = 'http://8.146.228.81:3000/';

interface ServiceMockProps {
  key?: React.Key;
  currentUser: User | null;
  bootStatus: SandboxStatus | null;
  onLogout: () => void;
  onRestartSandbox: () => void;
}

export function ServiceMock({ currentUser, bootStatus }: ServiceMockProps) {
  const userId = currentUser?.id || currentUser?.email;
  const sandboxUrl = bootStatus?.serviceUrl || TEST_SANDBOX_URL;

  useEffect(() => {
    if (!userId) return;

    const intervalId = window.setInterval(() => {
      extendSandboxTTLApi(userId).catch(() => {
        // Keep the workspace usable even if a TTL heartbeat fails.
      });
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [userId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-10 bg-brand-surface-lowest"
    >
      <iframe
        title="Inno Agent Sandbox"
        src={sandboxUrl}
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </motion.div>
  );
}
