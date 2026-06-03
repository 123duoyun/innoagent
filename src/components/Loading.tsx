import React, { useEffect, useState, useRef } from 'react';
import { Zap, RefreshCw, Terminal, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { querySandboxStatusApi } from '../mockApi';
import { SandboxStatus } from '../types';

interface LoadingProps {
  key?: React.Key;
  onBootSuccess: (status: SandboxStatus) => void;
}

export function Loading({ onBootSuccess }: LoadingProps) {
  const [pollIndex, setPollIndex] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<SandboxStatus>({
    status: 'initializing',
    progress: 0,
    message: 'Establishing security handshake...',
    diagnostics: []
  });
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const isPollingRef = useRef<boolean>(true);

  // Poll status endpoint iteratively
  useEffect(() => {
    isPollingRef.current = true;
    let pollTimeout: NodeJS.Timeout;

    const performPoll = async (index: number) => {
      if (!isPollingRef.current) return;
      
      try {
        const response = await querySandboxStatusApi(index);
        
        if (!isPollingRef.current) return;
        
        setCurrentStatus(response);
        
        // Push incoming diagnostics to terminal log history
        if (response.diagnostics) {
          setTerminalLogs((prev) => {
            // Filter duplicates out just in case
            const newLogs = response.diagnostics!.filter((log) => !prev.includes(log));
            return [...prev, ...newLogs];
          });
        }

        // Wait, did we succeed?
        if (response.status === 'ready') {
          // Success state found! Wait 1.5 seconds for visual satisfaction before transition
          pollTimeout = setTimeout(() => {
            onBootSuccess(response);
          }, 1500);
        } else {
          // Continue polling
          pollTimeout = setTimeout(() => {
            setPollIndex(index + 1);
          }, 2000); // Poll every 2 seconds
        }
      } catch (err) {
        if (isPollingRef.current) {
          setCurrentStatus((prev) => ({
            ...prev,
            status: 'failed',
            message: 'Error communicating with sandbox hypervisor.'
          }));
        }
      }
    };

    performPoll(pollIndex);

    return () => {
      isPollingRef.current = false;
      clearTimeout(pollTimeout);
    };
  }, [pollIndex, onBootSuccess]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full px-4"
    >
      
      {/* Glow Effect Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-secondary rounded-full blur-[100px] opacity-15 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full bg-brand-surface-lowest/90 backdrop-blur-md border border-brand-outline-variant/60 rounded-xl p-8 flex flex-col items-center gap-8 level-2-card">
        
        {/* IA Badge Container */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-secondary rounded-full blur-[24px] opacity-20 logo-pulse w-32 h-32 m-auto"></div>
          
          <div className="w-24 h-24 bg-brand-surface-lowest rounded-2xl border border-brand-outline-variant/80 shadow-md flex items-center justify-center relative z-10 ring-4 ring-brand-secondary/10 ring-offset-4 ring-offset-brand-surface">
            <span className="font-sans font-bold text-3xl text-brand-primary tracking-tighter">
              IA
            </span>
          </div>
        </div>

        {/* Text Title */}
        <div className="text-center">
          <h1 className="font-sans font-semibold text-2xl text-brand-primary">Inno Agent</h1>
          <p className="font-mono text-[10px] text-brand-on-surface-variant font-medium tracking-widest uppercase mt-1">
            Sandbox Environment
          </p>
        </div>

        {/* Dynamic Loading Component */}
        <div className="w-full flex flex-col items-center gap-6">
          
          {/* Radial Spinner */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Base Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-brand-secondary/15 stroke-[4] fill-none"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-brand-secondary stroke-[4] fill-none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                animate={{ strokeDashoffset: (251.2 - (251.2 * currentStatus.progress) / 100).toString() }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </svg>
            
            {/* Spinning Indicator Border Overlay */}
            <div className="absolute inset-2 border border-dashed border-brand-outline-variant/40 rounded-full animate-spin [animation-duration:15s] pointer-events-none"></div>

            {/* Inner Icon */}
            <div className="absolute w-12 h-12 rounded-full bg-brand-surface-low border border-brand-outline-variant-variant/20 flex items-center justify-center">
              <Zap className="text-brand-secondary w-5 h-5 fill-brand-secondary" />
            </div>
          </div>

          {/* Progress / Status Indicators */}
          <div className="w-full flex flex-col items-center gap-2">
            <span className="font-mono text-xs text-brand-secondary font-semibold">
              {currentStatus.progress}% COMPLETED
            </span>
            <span className="font-sans text-sm text-brand-on-surface font-medium text-center max-w-sm h-5 truncate">
              {currentStatus.message}
            </span>
          </div>

          {/* Progress Bar Gague */}
          <div className="w-full bg-brand-surface border border-brand-outline-variant/40 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${currentStatus.progress}%` }}
              className="bg-brand-secondary h-full rounded-full"
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Real-time Commands Output Logger Panel */}
          <div className="w-full bg-brand-primary text-green-400 rounded-lg p-4 font-mono text-[11px] level-2-card border border-brand-primary">
            <div className="flex items-center justify-between border-b border-brand-on-surface-variant/20 pb-2 mb-2 text-[10px] text-brand-on-surface-container">
              <div className="flex items-center gap-1.5 font-sans">
                <Terminal className="w-3.5 h-3.5" />
                <span>ACTIVE HYPERVISOR DAEMON LOGS</span>
              </div>
              <span className="bg-brand-secondary/20 text-brand-secondary px-1.5 py-0.5 rounded text-[9px] border border-brand-secondary/30">
                LIVE PIPED STREAM
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar text-left font-mono">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="flex gap-1 items-start leading-[15px]">
                  <span className="text-brand-on-surface-variant select-none">&gt;</span>
                  <span className="whitespace-pre-wrap">{log}</span>
                </div>
              ))}
              {currentStatus.status !== 'ready' && (
                <div className="flex gap-1 items-center">
                  <span className="text-brand-secondary select-none animate-pulse">$</span>
                  <span className="text-brand-on-surface-variant/60 italic animate-pulse">Running processes...</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="w-full flex justify-between items-center border-t border-brand-outline-variant/20 pt-4 mt-2">
            <span className="font-mono text-[10px] text-brand-on-surface-variant font-medium">
              v2.4.0-beta
            </span>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-brand-secondary animate-spin" />
              <span className="font-mono text-[10px] text-brand-secondary font-medium uppercase tracking-wider">
                Syncing Cluster
              </span>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
