import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Screen, User, SandboxStatus } from './types';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Loading } from './components/Loading';
import { ServiceMock } from './components/ServiceMock';

export default function App() {
  const [screen, setScreen] = useState<Screen>('LOGIN');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bootStatus, setBootStatus] = useState<SandboxStatus | null>(null);

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
    setScreen('SERVICE');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setBootStatus(null);
    setScreen('LOGIN');
  };

  const handleRestartSandbox = () => {
    setBootStatus(null);
    setScreen('LOADING');
  };

  return (
    <div className="canvas-grid min-h-screen w-full flex items-center justify-center py-12 px-4 selection:bg-brand-secondary/25 selection:text-brand-primary relative overflow-hidden font-sans">
      
      {/* Decorative infinite background accent lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-brand-secondary via-brand-primary to-brand-secondary opacity-60 z-20"></div>

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
            onBootSuccess={handleBootSuccess}
          />
        )}

        {screen === 'SERVICE' && (
          <ServiceMock
            key="service-screen"
            currentUser={currentUser}
            bootStatus={bootStatus}
            onLogout={handleLogout}
            onRestartSandbox={handleRestartSandbox}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

