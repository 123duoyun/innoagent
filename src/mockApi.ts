import { User, SandboxStatus } from './types';

// Simulate a network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Register API
 */
export async function registerApi(userData: User): Promise<{ success: boolean; message: string }> {
  await delay(1200); // simulate network request latency
  
  // Real validate constraints
  if (!userData.fullName.trim()) {
    return { success: false, message: 'Full name is required.' };
  }
  if (!userData.email.includes('@')) {
    return { success: false, message: 'Invalid email address.' };
  }
  if (!userData.password || userData.password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  // Save to localStorage mock database
  try {
    const existingUsersRaw = localStorage.getItem('mock_users') || '[]';
    const users: User[] = JSON.parse(existingUsersRaw);
    
    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    users.push({
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
    });
    
    localStorage.setItem('mock_users', JSON.stringify(users));
    return { success: true, message: 'Registration successful!' };
  } catch (e) {
    return { success: false, message: 'Storage error. Please try again.' };
  }
}

/**
 * Mock Login API
 */
export async function loginApi(email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
  await delay(1000); // simulate network latency
  
  if (!email.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { success: false, message: 'Password is required.' };
  }

  try {
    // Check localStorage mock database first
    const existingUsersRaw = localStorage.getItem('mock_users') || '[]';
    const users: User[] = JSON.parse(existingUsersRaw);
    
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (user) {
      return { success: true, message: 'Login successful!', user: { fullName: user.fullName, email: user.email } };
    }

    // Default built-in user for convenience
    if (email.toLowerCase() === 'agent@inno.com' && password === '123456') {
      return { success: true, message: 'Login successful!', user: { fullName: 'Inno Admin', email: 'agent@inno.com' } };
    }

    return { success: false, message: 'Invalid email or password.' };
  } catch (e) {
    return { success: false, message: 'Error checking credentials.' };
  }
}

/**
 * Mock Sandbox Query API
 * Returns status based on poll index (attemps) to simulate real server state changes.
 */
export async function querySandboxStatusApi(pollIndex: number): Promise<SandboxStatus> {
  await delay(800); // short delay for status query API call

  const stages: SandboxStatus[] = [
    {
      status: 'initializing',
      progress: 15,
      message: 'Initializing Sandbox container environment...',
      diagnostics: [
        'Connecting to hypervisor daemon...',
        'Allocating networking interfaces...',
        'Assigned local IPv4 subnet veth-10.42.0.2/24'
      ]
    },
    {
      status: 'allocating',
      progress: 45,
      message: 'Allocating system resources and isolation layers...',
      diagnostics: [
        'Verifying namespaces and control groups (cgroups)...',
        'Mounting read-only root system overlay (v2.4.0-beta)...',
        'Setting memory limits to 2048MB, vCPUs to 2.0'
      ]
    },
    {
      status: 'starting',
      progress: 75,
      message: 'Starting agent container processes...',
      diagnostics: [
        'Booting NodeJS micro-services cluster on port 3000...',
        'Spawning background Antigravity task runner...',
        'Initializing local secure key vault storage...'
      ]
    },
    {
      status: 'ready',
      progress: 100,
      message: 'Sandbox active and loaded successfully!',
      serviceUrl: 'https://sandbox.innoagent.internal/workspace-active-3000',
      diagnostics: [
        'Server running on internally exposed virtual port 3000',
        'Health check passed: Code 200 OK',
        'Agent terminal standard streams piped successfully!'
      ]
    }
  ];

  // Return appropriate index or cap at 'ready' stage
  const index = Math.min(pollIndex, stages.length - 1);
  return stages[index];
}
