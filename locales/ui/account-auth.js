// ui/account-auth.js — Unified auth system for clients and admins
// Admin emails stored as base64-encoded to avoid plain-text visibility
const ADMIN_EMAILS_B64 = [
  'eWF4b3V5QGdtYWlsLmNvbQ==',
  'cGFyYXp5dGVla0BnbWFpbC5jb20=',
];
const ADMIN_PASSWORD = 'Parazyte2024';

const ACCOUNTS_KEY = 'pz_accounts';
const SESSION_KEY = 'pz_session';
const SESSION_DURATION = 7200000; // 2 hours

let _user = null;

// --- helpers ---
const s = () => window.miniappsAI?.storage;

function encodePass(p) { return btoa(p); }

function decodeAdminEmails() {
  return ADMIN_EMAILS_B64.map(b => atob(b).toLowerCase());
}

async function getAccounts() {
  try {
    const raw = await s()?.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveAccounts(accounts) {
  try { await s()?.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); } catch {}
}

async function getSession() {
  try {
    const raw = await s()?.getItem(SESSION_KEY, { area: 'session' });
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() >= session.expiry) return null;
    return session;
  } catch { return null; }
}

async function setSession(data) {
  try {
    await s()?.setItem(SESSION_KEY, JSON.stringify({
      ...data,
      expiry: Date.now() + SESSION_DURATION,
    }), { area: 'session' });
  } catch {}
}

async function clearSession() {
  _user = null;
  try { await s()?.removeItem(SESSION_KEY, { area: 'session' }); } catch {}
}

// --- public API ---

export function getUser() { return _user; }
export function isLoggedIn() { return !!_user; }
export function isAdmin() { return _user?.role === 'admin'; }

export async function restoreSession() {
  const session = await getSession();
  if (!session) { _user = null; return null; }
  _user = { email: session.email, name: session.name, role: session.role };
  return _user;
}

export async function register(email, password, name) {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !password || !name?.trim()) return { ok: false, error: 'missing_fields' };
  if (password.length < 6) return { ok: false, error: 'short_password' };

  const accounts = await getAccounts();
  const exists = accounts.find(a => a.email === normalizedEmail);
  if (exists) return { ok: false, error: 'email_taken' };

  const isAdminEmail = decodeAdminEmails().includes(normalizedEmail);
  const newUser = {
    email: normalizedEmail,
    name: name.trim(),
    pass: encodePass(password),
    role: isAdminEmail ? 'admin' : 'client',
    createdAt: Date.now(),
  };

  accounts.push(newUser);
  await saveAccounts(accounts);

  _user = { email: newUser.email, name: newUser.name, role: newUser.role };
  await setSession(_user);
  return { ok: true, user: _user };
}

export async function login(email, password) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check admin password shortcut
  const isAdminEmail = decodeAdminEmails().includes(normalizedEmail);
  if (isAdminEmail && password === ADMIN_PASSWORD) {
    _user = { email: normalizedEmail, name: 'Parazyte', role: 'admin' };
    await setSession(_user);
    // Also ensure account exists
    const accounts = await getAccounts();
    if (!accounts.find(a => a.email === normalizedEmail)) {
      accounts.push({
        email: normalizedEmail, name: 'Parazyte',
        pass: encodePass(password), role: 'admin', createdAt: Date.now(),
      });
      await saveAccounts(accounts);
    }
    return { ok: true, user: _user };
  }

  // Regular login
  const accounts = await getAccounts();
  const account = accounts.find(a => a.email === normalizedEmail);
  if (!account) return { ok: false, error: 'not_found' };
  if (account.pass !== encodePass(password)) return { ok: false, error: 'wrong_password' };

  _user = { email: account.email, name: account.name, role: account.role };
  await setSession(_user);
  return { ok: true, user: _user };
}

export async function logout() {
  await clearSession();
}

export async function updateProfile(name) {
  if (!_user) return false;
  _user.name = name.trim() || _user.name;
  const accounts = await getAccounts();
  const account = accounts.find(a => a.email === _user.email);
  if (account) {
    account.name = _user.name;
    await saveAccounts(accounts);
  }
  await setSession(_user);
  return true;
}

export async function changePassword(oldPass, newPass) {
  if (!_user) return { ok: false, error: 'not_logged_in' };
  if (newPass.length < 6) return { ok: false, error: 'short_password' };

  // Admin shortcut
  if (_user.role === 'admin' && decodeAdminEmails().includes(_user.email)) {
    if (oldPass !== ADMIN_PASSWORD) return { ok: false, error: 'wrong_old_password' };
    // Admin uses fixed password, but we can still update in accounts
  }

  const accounts = await getAccounts();
  const account = accounts.find(a => a.email === _user.email);
  if (!account) return { ok: false, error: 'not_found' };
  if (account.pass !== encodePass(oldPass) && oldPass !== ADMIN_PASSWORD) {
    return { ok: false, error: 'wrong_old_password' };
  }

  account.pass = encodePass(newPass);
  await saveAccounts(accounts);
  return { ok: true };
}

export async function getAccountStats() {
  if (!_user) return null;
  const accounts = await getAccounts();
  const account = accounts.find(a => a.email === _user.email);
  return {
    email: _user.email,
    name: _user.name,
    role: _user.role,
    memberSince: account?.createdAt ? new Date(account.createdAt).toLocaleDateString('fr-FR') : '—',
  };
}
