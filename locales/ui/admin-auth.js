// ui/admin-auth.js — Admin auth delegation to unified account system
// All real auth logic lives in account-auth.js
import { isLoggedIn as _isLoggedIn, isAdmin as _isAdmin, restoreSession, login as accLogin, logout as accLogout } from './account-auth.js';

export function isLoggedIn() { return _isLoggedIn(); }
export function isAdmin() { return _isAdmin(); }

export async function checkSession() {
  const user = await restoreSession();
  return !!user && user.role === 'admin';
}

export async function login(email, password) {
  const result = await accLogin(email, password);
  return result.ok && result.user?.role === 'admin';
}

export async function logout() {
  await accLogout();
}
