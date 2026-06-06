import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../.env') });
loadEnv({ path: resolve(__dirname, '../.env') });

export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.AUTH_BACKEND_PORT || '3001', 10),
  zitadelIssuer: process.env.ZITADEL_ISSUER || 'http://auth.localhost',
  get zitadelInternalIssuer() {
    return process.env.ZITADEL_INTERNAL_ISSUER || this.zitadelIssuer;
  },
  zitadelClientId: process.env.ZITADEL_CLIENT_ID || '',
  zitadelServicePat: process.env.ZITADEL_SERVICE_PAT || '',
  zitadelLoginRedirectUri:
    process.env.ZITADEL_LOGIN_REDIRECT_URI || 'http://localhost:3001/auth/callback',
};
