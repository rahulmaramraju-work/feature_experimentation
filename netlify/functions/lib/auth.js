import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import * as db from './db.js';

const COOKIE = 'lumen_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not configured');
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

export async function sessionCookie(userId, req) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export async function currentUser(req) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(match[1], secret());
    return await db.get(`users/${payload.sub}`);
  } catch {
    return null;
  }
}

// Strip secrets before sending a user to the browser.
export function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}
