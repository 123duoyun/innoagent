import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { config } from '../config.js';
import { getLogger } from '../logger.js';
import * as zitadelUser from '../services/zitadel-user.js';
import { requireOidcUser, getUserIdFromToken } from '../middleware/auth.js';

const router = Router();
const log = getLogger('inno-agent-auth');

/** Intentional user-facing error — message is safe to show to the client. */
class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

/**
 * Only forward UserFacingError messages to the client.
 * All raw Zitadel / technical errors get replaced with the generic fallback.
 */
function sanitizeError(err: unknown, fallback: string): string {
  if (err instanceof UserFacingError) return err.message;
  return fallback;
}

type AuthMode = 'login' | 'register';

interface LoginTokens {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface SessionTokens {
  sessionId: string;
  sessionToken: string;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getIssuer(): string {
  return config.zitadelInternalIssuer.replace(/\/+$/, '');
}

function serviceJsonHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.zitadelServicePat}`,
  };
}

function createAuthUrl(issuer: string, codeChallenge: string, state: string): URL {
  const authUrl = new URL(`${issuer}/oauth/v2/authorize`);
  authUrl.searchParams.set('client_id', config.zitadelClientId);
  authUrl.searchParams.set('redirect_uri', config.zitadelLoginRedirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email offline_access');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  return authUrl;
}

async function startOidcFlow(includeAuthBodyInError: boolean): Promise<{
  issuer: string;
  codeVerifier: string;
  authRequestID: string;
}> {
  const issuer = getIssuer();
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
  const state = base64url(crypto.randomBytes(16));

  const authRes = await fetch(createAuthUrl(issuer, codeChallenge, state).toString(), { redirect: 'manual' });
  const location = authRes.headers.get('location');
  if (!location) {
    if (!includeAuthBodyInError) throw new Error('Failed to create auth request');
    const text = await authRes.text();
    throw new Error(`Failed to create auth request: ${text}`);
  }

  const locUrl = new URL(location, issuer);
  const authRequestID =
    locUrl.searchParams.get('authRequest') ||
    locUrl.searchParams.get('authRequestID') ||
    locUrl.searchParams.get('authRequestId');
  if (!authRequestID) {
    throw new Error('No authRequestID in redirect');
  }

  return { issuer, codeVerifier, authRequestID };
}

async function createSession(checks: unknown, errorPrefix: string): Promise<SessionTokens> {
  const sessionRes = await fetch(`${getIssuer()}/v2/sessions`, {
    method: 'POST',
    headers: serviceJsonHeaders(),
    body: JSON.stringify({ checks }),
  });

  if (!sessionRes.ok) {
    const text = await sessionRes.text();
    throw new Error(`${errorPrefix}: ${text}`);
  }

  return (await sessionRes.json()) as SessionTokens;
}

async function finishOidcFlow(
  flow: Awaited<ReturnType<typeof startOidcFlow>>,
  session: SessionTokens,
): Promise<LoginTokens> {
  const finRes = await fetch(`${flow.issuer}/v2/oidc/auth_requests/${flow.authRequestID}`, {
    method: 'POST',
    headers: serviceJsonHeaders(),
    body: JSON.stringify({ session }),
  });
  if (!finRes.ok) {
    const text = await finRes.text();
    throw new Error(`Failed to finalize auth request: ${text}`);
  }

  const { callbackUrl } = (await finRes.json()) as { callbackUrl: string };
  const code = new URL(callbackUrl).searchParams.get('code');
  if (!code) {
    throw new Error('No code in callback');
  }

  const tokenRes = await fetch(`${flow.issuer}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.zitadelLoginRedirectUri,
      client_id: config.zitadelClientId,
      code_verifier: flow.codeVerifier,
    }),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  return (await tokenRes.json()) as LoginTokens;
}

async function lookupSessionUser(username: string): Promise<{ user: { loginName: string } } | { user: { userId: string } }> {
  if (!username.includes('@') || username.endsWith('@zitadel.localhost')) {
    return { user: { loginName: username } };
  }

  const results = await zitadelUser.searchUsers([
    { emailQuery: { emailAddress: username, method: 'TEXT_QUERY_METHOD_EQUALS' } },
  ]);
  const userId = results[0]?.userId;
  return userId ? { user: { userId } } : { user: { loginName: username } };
}

async function loginWithPassword(username: string, password: string): Promise<LoginTokens> {
  // Run OIDC flow setup and user lookup in parallel — saves one round-trip
  const [flow, user] = await Promise.all([
    startOidcFlow(true),
    lookupSessionUser(username),
  ]);

  const session = await createSession({
    ...user,
    password: { password },
  }, 'Invalid credentials');

  return finishOidcFlow(flow, session);
}

async function loginWithUserIdAndPassword(userId: string, password: string): Promise<LoginTokens> {
  const flow = await startOidcFlow(true);
  const session = await createSession({
    user: { userId },
    password: { password },
  }, 'Invalid credentials');

  return finishOidcFlow(flow, session);
}

function isDuplicateUsernameError(message: string): boolean {
  return (
    (/username/.test(message) && (/already/.test(message) || /exists/.test(message) || /taken/.test(message))) ||
    /user already exists/.test(message)
  );
}

function isDuplicateEmailError(message: string): boolean {
  return /email/.test(message) && (/already/.test(message) || /exists/.test(message) || /taken/.test(message));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function isEmailTaken(email: string): Promise<boolean> {
  const results = await zitadelUser.searchUsers([
    { emailQuery: { emailAddress: normalizeEmail(email), method: 'TEXT_QUERY_METHOD_EQUALS' } },
  ]);
  return results.length > 0;
}

async function registerWithPassword(username: string, email: string, password: string): Promise<LoginTokens> {
  const normalizedEmail = normalizeEmail(email);
  if (await isEmailTaken(normalizedEmail)) {
    throw new UserFacingError('该邮箱已被注册。');
  }

  const givenName = username.replace(/[^a-zA-Z0-9]/g, '') || username;
  const createRes = await fetch(`${getIssuer()}/v2/users/human`, {
    method: 'POST',
    headers: serviceJsonHeaders(),
    body: JSON.stringify({
      username,
      profile: { givenName, familyName: 'User' },
      email: { email: normalizedEmail, isVerified: true },
      password: { password, changeRequired: false },
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    const normalizedText = text.toLowerCase();
    if (isDuplicateUsernameError(normalizedText)) {
      throw new UserFacingError('该用户名已被占用。');
    }
    if (isDuplicateEmailError(normalizedText)) {
      throw new UserFacingError('该邮箱已被注册。');
    }
    throw new Error(`注册失败: ${text}`);
  }

  const created = (await createRes.json()) as { userId?: string };

  if (!created.userId) {
    throw new Error('Registration succeeded but userId was not returned');
  }

  return loginWithUserIdAndPassword(created.userId, password);
}

// --- Routes ---

router.post('/auth/password', async (req: Request, res: Response) => {
  const mode = req.body?.mode;
  if (mode !== 'login' && mode !== 'register') {
    res.status(400).json({ error: 'mode 必须为 "login" 或 "register"' });
    return;
  }

  const username = req.body?.username?.trim();
  const email = req.body?.email?.trim();
  const password = req.body?.password;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码为必填项' });
    return;
  }

  if (mode === 'register' && !email) {
    res.status(400).json({ error: '注册时邮箱为必填项' });
    return;
  }

  try {
    const tokens =
      mode === 'register'
        ? await registerWithPassword(username, email, password)
        : await loginWithPassword(username, password);

    res.json(tokens);
  } catch (err: any) {
    log.error({ err }, 'Password auth failed');
    res.status(400).json({ error: sanitizeError(err, mode === 'login' ? '登录失败' : '注册失败') });
  }
});

router.post('/auth/logout', async (req: Request, res: Response) => {
  const refreshToken = req.body?.refresh_token;
  const accessToken = req.body?.access_token;

  if (!refreshToken && !accessToken) {
    res.json({ ok: true });
    return;
  }

  try {
    const tokensToRevoke = [
      refreshToken && { token: refreshToken, hint: 'refresh_token' },
      accessToken && { token: accessToken, hint: 'access_token' },
    ].filter(Boolean) as Array<{ token: string; hint: string }>;

    const results = await Promise.allSettled(
      tokensToRevoke.map(({ token, hint }) =>
        fetch(`${getIssuer()}/oauth/v2/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: config.zitadelClientId,
            token,
            token_type_hint: hint,
          }),
        }),
      ),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        log.warn({ err: result.reason }, 'Token revoke failed');
      } else if (!result.value.ok) {
        const text = await result.value.text();
        log.warn({ status: result.value.status, body: text }, 'Token revoke returned non-OK');
      }
    }

    res.json({ ok: true });
  } catch (err: any) {
    log.error({ err }, 'Logout failed');
    res.json({ ok: true });
  }
});

router.get('/auth/me', requireOidcUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const user = await zitadelUser.findById(userId);
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    log.error({ err }, 'Failed to fetch user info');
    res.status(500).json({ error: sanitizeError(err, '获取用户信息失败') });
  }
});

export default router;
