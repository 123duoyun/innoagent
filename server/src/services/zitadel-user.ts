import { config } from '../config.js';

export interface ZitadelUser {
  id: string;
  username: string;
  email?: string;
  created_at: string;
}

interface ZitadelHumanUser {
  userId?: string;
  username?: string;
  preferredLoginName?: string;
  loginNames?: string[];
  human?: {
    email?: {
      email?: string;
    };
  };
  details?: {
    creationDate?: string;
  };
}

function issuer(): string {
  return config.zitadelInternalIssuer.replace(/\/+$/, '');
}

function pat(): string {
  if (!config.zitadelServicePat) {
    throw new Error('ZITADEL_SERVICE_PAT is not configured');
  }
  return config.zitadelServicePat;
}

function mapUser(u: ZitadelHumanUser): ZitadelUser | undefined {
  const id = u.userId;
  if (!id) return undefined;
  return {
    id,
    username: u.username || u.preferredLoginName || u.human?.email?.email || u.loginNames?.[0] || id,
    email: u.human?.email?.email,
    created_at: u.details?.creationDate || new Date(0).toISOString(),
  };
}

export async function findById(id: string): Promise<ZitadelUser | undefined> {
  if (!id) return undefined;
  const res = await fetch(`${issuer()}/v2/users/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${pat()}` },
  });
  if (res.status === 404) return undefined;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zitadel findById failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { user?: ZitadelHumanUser };
  return json.user ? mapUser(json.user) : undefined;
}

export async function searchUsers(queries: unknown[]): Promise<ZitadelHumanUser[]> {
  const res = await fetch(`${issuer()}/v2/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pat()}`,
    },
    body: JSON.stringify({ queries }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { result?: ZitadelHumanUser[] };
  return data.result ?? [];
}

