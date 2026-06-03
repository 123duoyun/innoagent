import React, { useState } from 'react';
import { ExternalLink, Terminal, Cpu, HardDrive, RefreshCw, LogOut, Code, Play, CheckCircle2, ChevronRight, CornerDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { User, SandboxStatus } from '../types';

interface ServiceMockProps {
  key?: React.Key;
  currentUser: User | null;
  bootStatus: SandboxStatus | null;
  onLogout: () => void;
  onRestartSandbox: () => void;
}

export function ServiceMock({ currentUser, bootStatus, onLogout, onRestartSandbox }: ServiceMockProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'system' | 'code'>('console');
  const [terminalInputs, setTerminalInputs] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  
  const [commandSuccess, setCommandSuccess] = useState<string | null>(null);

  const systemMetrics = [
    { label: 'Sandbox IP Address', value: '10.42.0.2', icon: HardDrive },
    { label: 'Exposed Port', value: '3000 -> https://dev.innoagent.internal', icon: ExternalLink },
    { label: 'Isolated Memory Limit', value: '2048 MB / 2048 MB (100%)', icon: Cpu },
    { label: 'VNode CPU Cores', value: '2.0 Dedicated Cores', icon: Cpu },
  ];

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const command = inputVal.trim().toLowerCase();
    let response = '';

    if (command === 'help') {
      response = 'Available commands: help | stats | status | clear | execute-agent';
    } else if (command === 'stats') {
      response = 'CPU Util: 8.4% | MEM Util: 341MB / 2048MB | Sandbox Session: ACTIVE_OK';
    } else if (command === 'status') {
      response = `Hypervisor Status: ONLINE \nSandbox Service: ${bootStatus?.serviceUrl || 'https://sandbox.innoagent.internal/workspace-active-3000'}`;
    } else if (command === 'clear') {
      setTerminalInputs([]);
      setInputVal('');
      return;
    } else if (command === 'execute-agent') {
      response = 'Spawning deep research task...\nTask spawned: Antigravity-Agent-7541';
      setCommandSuccess('Deep agent triggered successfully on sandbox container cluster.');
      setTimeout(() => setCommandSuccess(null), 4000);
    } else {
      response = `Command not found: '${command}'. Type 'help' for available options.`;
    }

    setTerminalInputs((prev) => [...prev, `$ ${inputVal}`, response]);
    setInputVal('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-5xl px-4 py-8 relative z-10"
    >
      
      {/* Upper Container Header banner */}
      <div className="bg-brand-primary text-on-primary rounded-t-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-brand-primary shadow-lg">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-brand-secondary flex items-center justify-center">
            <span className="font-sans font-bold text-lg text-on-primary">IA</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans font-bold text-lg">Inno Agent Workspace</h2>
              <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Sandbox Running
              </span>
            </div>
            <p className="font-sans text-xs text-brand-on-primary-container/80 mt-1">
              Currently connected as <span className="font-mono text-white font-medium">{currentUser?.fullName || 'agent@inno.com'}</span> ({currentUser?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Restart Sandbox */}
          <button
            onClick={onRestartSandbox}
            className="bg-brand-surface-lowest/10 hover:bg-brand-surface-lowest/20 border border-brand-surface-lowest/20 transition-colors text-white px-3.5 py-1.5 rounded-md font-mono text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Rebuild Sandbox
          </button>
          
          {/* Logout */}
          <button
            onClick={onLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-colors px-3.5 py-1.5 rounded-md font-mono text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>

      </div>

      {/* Main Panel Content (Grid structure) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-brand-surface-lowest border border-t-0 border-brand-outline-variant/60 rounded-b-xl p-6 shadow-md">
        
        {/* Left Column: System specs and diagnostics */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <div className="bg-brand-surface border border-brand-outline-variant/55 rounded-lg p-5 flex flex-col gap-4">
            <h3 className="font-sans font-semibold text-sm text-brand-primary uppercase tracking-wider border-b border-brand-outline-variant/20 pb-2">
              Virtual Resource Allocation
            </h3>
            
            <div className="flex flex-col gap-4">
              {systemMetrics.map((metric, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-brand-on-surface-variant font-mono text-[10px] uppercase font-bold">
                    <metric.icon className="w-3.5 h-3.5 text-brand-secondary" />
                    <span>{metric.label}</span>
                  </div>
                  <div className="font-mono text-sm text-brand-on-surface font-semibold pl-5">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-outline-variant/55 rounded-lg p-5 flex flex-col gap-3">
            <h3 className="font-sans font-semibold text-sm text-brand-primary uppercase tracking-wider border-b border-brand-outline-variant/20 pb-2">
              Hypervisor Handshake
            </h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-green-700 bg-green-50 border border-green-200 p-2.5 rounded">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sandbox booted in 4.8s</span>
              </div>
              <div className="text-xs font-sans text-brand-on-surface-variant leading-relaxed">
                A sandbox environment isolator partition was provisioned with pre-configured developer dependencies. Standalone services are running natively inside the isolated containers.
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Terminal Container */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Console tabs */}
          <div className="border border-brand-outline-variant/55 rounded-lg bg-brand-surface overflow-hidden flex flex-col h-full min-h-[400px]">
            
            {/* Tab selection bar */}
            <div className="bg-brand-surface border-b border-brand-outline-variant/30 px-4 py-2.5 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('console')}
                  className={`px-3 py-1.5 font-mono text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'console'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-brand-on-surface-variant hover:bg-brand-surface-low'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Terminal Console
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className={`px-3 py-1.5 font-mono text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'system'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-brand-on-surface-variant hover:bg-brand-surface-low'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  Cluster Specs
                </button>
              </div>

              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
            </div>

            {/* Tab Contents */}
            <div className="p-4 flex-1 flex flex-col justify-between bg-brand-primary text-white font-mono text-xs">
              {activeTab === 'console' && (
                <>
                  <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[300px] text-left">
                    <p className="text-brand-on-surface-variant font-mono text-[11px]">
                      // INNO AGENT LINUX SHELL (v2.4.0-BETA)
                      <br />
                      // Sandbox Container online. Type 'help' to show commands.
                    </p>
                    {terminalInputs.map((line, idx) => (
                      <div key={idx} className={`whitespace-pre-line leading-[18px] ${line.startsWith('$') ? 'text-green-400 font-bold' : 'text-brand-on-primary-container'}`}>
                        {line}
                      </div>
                    ))}
                    {commandSuccess && (
                      <div className="bg-brand-secondary/20 border border-brand-secondary/40 text-brand-secondary px-3 py-2 rounded text-xs font-sans mt-2">
                        {commandSuccess}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleCommandSubmit} className="border-t border-brand-on-surface-variant/20 pt-4 mt-4 flex items-center gap-2">
                    <span className="text-green-400 font-bold select-none">$</span>
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder="Type command and press Enter (try: execute-agent)..."
                      className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 font-mono text-xs"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-brand-secondary text-white p-1 rounded-md hover:bg-brand-secondary/90 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              )}

              {activeTab === 'system' && (
                <div className="flex-1 flex flex-col gap-4 text-left p-2">
                  <div className="p-3 bg-brand-surface-lowest/5 rounded border border-brand-surface-lowest/10">
                    <h4 className="text-white font-bold mb-2 flex items-center gap-1.5 font-sans">
                      <ChevronRight className="w-4 h-4 text-brand-secondary" />
                      Sandbox Service Configuration
                    </h4>
                    <p className="text-brand-on-primary-container text-xs leading-relaxed font-sans mt-2">
                      The sandbox isolates execution kernels across modern virtual environments. It is configured to receive remote workspace requests and exposes internal services on secure virtual adapters.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-3 bg-brand-surface-lowest/5 rounded border border-brand-surface-lowest/10">
                      <div className="text-brand-on-primary-container text-[11px] font-sans font-bold">CONTAINER CLUSTER NAME</div>
                      <div className="text-white font-mono text-xs font-bold mt-1">inno-isolated-worker-01</div>
                    </div>
                    <div className="p-3 bg-brand-surface-lowest/5 rounded border border-brand-surface-lowest/10">
                      <div className="text-brand-on-primary-container text-[11px] font-sans font-bold">API HOSTWAY ENDPOINT</div>
                      <div className="text-white font-mono text-xs font-bold mt-1">api.sandbox.inno/v2</div>
                    </div>
                    <div className="p-3 bg-brand-surface-lowest/5 rounded border border-brand-surface-lowest/10">
                      <div className="text-brand-on-primary-container text-[11px] font-sans font-bold">PORT INTEGRATION TARGET</div>
                      <div className="text-white font-mono text-xs font-bold mt-1">Express Container Gateway (Port 3000)</div>
                    </div>
                    <div className="p-3 bg-brand-surface-lowest/5 rounded border border-brand-surface-lowest/10">
                      <div className="text-brand-on-primary-container text-[11px] font-sans font-bold">AUTONOMOUS STATE STREAMING</div>
                      <div className="text-brand-secondary font-mono text-xs font-bold mt-1">Online & Piped Active</div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </motion.div>
  );
}
