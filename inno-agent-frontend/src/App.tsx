import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Screen, User, SandboxStatus } from './types';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Loading } from './components/Loading';
import { ServiceMock } from './components/ServiceMock';
import { UserPanelButton } from './components/UserPanelButton';
import { checkAuth, logoutApi } from './api/auth';
import { stopInnoAgentApi } from './api/innoAgent';

export default function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('LOGIN');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bootStatus, setBootStatus] = useState<SandboxStatus | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    checkAuth().then((user) => {
      if (user) {
        setCurrentUser(user);
        setScreen('LOADING');
      }
      setAuthChecking(false);
    });
  }, []);

  // Transition handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setScreen('LOADING');
  };

  const handleRegisterSuccess = () => {
    setScreen('LOGIN');
  };

  const handleBootSuccess = (status: SandboxStatus) => {
    setBootStatus(status);
    if (status.sandboxId) {
      const url = new URL(window.location.href);
      url.searchParams.set('sandboxId', status.sandboxId);
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
    setScreen('SERVICE');
  };

  const handleLogout = async () => {
    const userId = currentUser?.id || currentUser?.email;
    if (userId) {
      stopInnoAgentApi(userId).catch(() => {});
    }
    await logoutApi();
    setCurrentUser(null);
    setBootStatus(null);
    window.history.replaceState(null, '', window.location.pathname);
    setScreen('LOGIN');
  };

  const handleRestartSandbox = () => {
    setBootStatus(null);
    window.history.replaceState(null, '', window.location.pathname);
    setScreen('LOADING');
  };

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div className="canvas-grid min-h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs text-brand-on-surface-variant">{t('app.checkingSession')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-grid min-h-screen w-full flex items-center justify-center py-4 px-4 selection:bg-brand-secondary/25 selection:text-brand-primary relative overflow-hidden font-sans">

      {/* Screen Transitions Animation Holder */}
      <AnimatePresence mode="wait">
        {screen === 'LOGIN' && (
          <Login
            key="login-screen"
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setScreen('REGISTER')}
          />
        )}

        {screen === 'REGISTER' && (
          <Register
            key="register-screen"
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateToLogin={() => setScreen('LOGIN')}
          />
        )}

        {screen === 'LOADING' && (
          <Loading
            key="loading-screen"
            currentUser={currentUser}
            onBootSuccess={handleBootSuccess}
          />
        )}

        {screen === 'SERVICE' && (
          <ServiceMock
            key="service-screen"
            currentUser={currentUser}
            bootStatus={bootStatus}
          />
        )}
      </AnimatePresence>

      {/* Floating user panel — visible after loading completes */}
      {screen === 'SERVICE' && (
        <UserPanelButton currentUser={currentUser} onLogout={handleLogout} />
      )}

    </div>
  );
}
