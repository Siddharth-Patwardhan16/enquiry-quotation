import crypto from 'crypto';

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: string;
}

interface StoredTokenData extends AuthTokenPayload {
  exp: number;
}

const getAuthSecret = (): string => {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'svicarbon-default-secure-salt-2026';
};

const base64UrlEncode = (input: string): string => {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (input: string): string => {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
};

/**
 * Signs an authentication payload with HMAC-SHA256 and an expiry timestamp.
 */
export function signAuthToken(payload: AuthTokenPayload, expiresInSeconds = 7 * 24 * 60 * 60): string {
  const secret = getAuthSecret();
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const tokenData: StoredTokenData = {
    ...payload,
    exp,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(tokenData));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 token and returns the payload if valid and unexpired.
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, receivedSignature] = parts;
    if (!encodedPayload || !receivedSignature) {
      return null;
    }

    const secret = getAuthSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Constant time comparison to prevent timing attacks
    const sigA = Buffer.from(receivedSignature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const decodedString = base64UrlDecode(encodedPayload);
    const parsed = JSON.parse(decodedString) as StoredTokenData;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (!parsed.exp || parsed.exp < now) {
      return null;
    }

    if (!parsed.id || !parsed.email) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role ?? 'MARKETING',
    };
  } catch {
    return null;
  }
}
