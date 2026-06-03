export type Screen = 'LOGIN' | 'REGISTER' | 'LOADING' | 'SERVICE';

export interface User {
  fullName: string;
  email: string;
  password?: string;
}

export interface SandboxStatus {
  status: 'initializing' | 'allocating' | 'starting' | 'ready' | 'failed';
  progress: number;
  message: string;
  serviceUrl?: string;
  diagnostics?: string[];
}
