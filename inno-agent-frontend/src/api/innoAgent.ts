import i18n from '../i18n';
import {
  InnoAgentAction,
  InnoAgentRequest,
  InnoAgentResponse,
  SandboxStatus,
  StartInnoAgentResponse,
  StopInnoAgentResponse,
  ExtendSandboxTTLResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const WORKSPACE_URL_TEMPLATE = import.meta.env.VITE_INNO_AGENT_WORKSPACE_URL_TEMPLATE || 'http://www.innoagent.tech/sandbox/{sandboxId}';
const startRequests = new Map<string, Promise<SandboxStatus>>();

function createRequestUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildWorkspaceUrl(sandboxId: string): string | undefined {
  if (!WORKSPACE_URL_TEMPLATE) return undefined;

  return WORKSPACE_URL_TEMPLATE.includes('{sandboxId}')
    ? WORKSPACE_URL_TEMPLATE.replaceAll('{sandboxId}', encodeURIComponent(sandboxId))
    : `${WORKSPACE_URL_TEMPLATE.replace(/\/$/, '')}/${encodeURIComponent(sandboxId)}`;
}

function createPayload<Action extends InnoAgentAction>(
  action: Action,
  userId: string,
): InnoAgentRequest<Action> {
  return {
    Action: action,
    RequestUUID: createRequestUUID(),
    UserID: userId,
  };
}

async function requestInnoAgent<Action extends InnoAgentAction>(
  payload: InnoAgentRequest<Action>,
): Promise<InnoAgentResponse<Action>> {
  const response = await fetch(`${API_BASE}/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data: Partial<InnoAgentResponse<Action>> | null = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.Message || i18n.t('api.sandbox.requestFailed', { action: payload.Action }));
  }

  if (data?.Action !== payload.Action) {
    throw new Error(i18n.t('api.sandbox.unexpectedResponse', { action: payload.Action }));
  }

  if (typeof data.RetCode !== 'number') {
    throw new Error(i18n.t('api.sandbox.missingRetCode', { action: payload.Action }));
  }

  if (typeof data.Message !== 'string') {
    throw new Error(i18n.t('api.sandbox.missingMessage', { action: payload.Action }));
  }

  if (data.RetCode !== 0) {
    throw new Error(data.Message || i18n.t('api.sandbox.requestFailed', { action: payload.Action }));
  }

  return data as InnoAgentResponse<Action>;
}

async function requestStartInnoAgent(userId: string): Promise<SandboxStatus> {
  const payload = createPayload('StartInnoAgent', userId);
  const data = await requestInnoAgent(payload) as StartInnoAgentResponse;

  if (typeof data.InnoAgentID !== 'string' || !data.InnoAgentID) {
    throw new Error(i18n.t('api.sandbox.startNoId'));
  }

  return {
    status: 'ready',
    progress: 100,
    message: data.Message || i18n.t('api.sandbox.startSuccess'),
    sandboxId: data.InnoAgentID,
    serviceUrl: buildWorkspaceUrl(data.InnoAgentID),
    diagnostics: [
      `StartInnoAgent completed with request ${payload.RequestUUID}`,
      `Sandbox ID assigned: ${data.InnoAgentID}`,
    ],
  };
}

export function startInnoAgentApi(userId: string): Promise<SandboxStatus> {
  const existingRequest = startRequests.get(userId);
  if (existingRequest) return existingRequest;

  const request = requestStartInnoAgent(userId).finally(() => {
    startRequests.delete(userId);
  });

  startRequests.set(userId, request);
  return request;
}

export async function stopInnoAgentApi(userId: string): Promise<StopInnoAgentResponse> {
  const payload = createPayload('StopInnoAgent', userId);
  return requestInnoAgent(payload);
}

export async function extendSandboxTTLApi(userId: string): Promise<ExtendSandboxTTLResponse> {
  const payload = createPayload('ExtendSandboxTTL', userId);
  return requestInnoAgent(payload);
}
