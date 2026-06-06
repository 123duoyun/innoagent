import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { getLogger } from '../logger.js';

const log = getLogger('auth-middleware');

/** Extract userId from Bearer token by calling Zitadel userinfo */
export async function getUserIdFromToken(accessToken: string): Promise<string | undefined> {
  try {
    const issuer = config.zitadelInternalIssuer.replace(/\/+$/, '');
    const res = await fetch(`${issuer}/oidc/v1/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { sub?: string };
    return data.sub;
  } catch {
    return undefined;
  }
}

/** Middleware: validate Bearer token and extract userId */
export async function requireOidcUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  const userId = await getUserIdFromToken(token);

  if (!userId) {
    log.warn('Invalid or expired access token');
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (req as any).userId = userId;
  next();
}
