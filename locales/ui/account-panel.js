// ui/account-panel.js — Account panel UI for clients and admins
import { getUser, isLoggedIn, isAdmin, register, login, logout, restoreSession, updateProfile, changePassword, getAccountStats } from './account-auth.js';

const t = (k) => window.miniappI18n?.t(k) ?? k;

let _panel = null;
let _isOpen = false;
let _currentView = 'login'; // 'login' | 'register' | 'profile'

export async function initAccountPanel() {
  _panel = document.getElementById('accountPanel');
  if (!_panel) return;

  // Restore session on load
  await restoreSession();
  updateNavAccountBtn();

  // Close on backdrop click
  _panel.addEventListener('click', (e) => {
    if (e.target === _panel) closeAccountPanel();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _isOpen) closeAccountPanel();
  });
}

export function openAccountPanel(view) {
  if (!_panel) return;
  if (view) _currentView = view;
  else if (isLoggedIn()) _currentView = 'profile';
  else _currentView = 'login';

  _isOpen = true;
  _panel.classList.add('open');
  _panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderCurrentView();
}

export function closeAccountPanel() {
  if (!_panel) return;
  _isOpen = false;
  _panel.classList.remove('open');
  _panel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

export function updateNavAccountBtn() {
  const btn = document.getElementById('navAccountBtn');
  const btnMobile = document.getElementById('navAccountBtnMobile');
  const avatar = btn?.querySelector('.account-avatar');
  const avatarMobile = btnMobile?.querySelector('.account-avatar');

  const user = getUser();

  [avatar, avatarMobile].forEach(a => {
    if (!a) return;
    if (user) {
      a.classList.add('logged-in');
      a.textContent = user.name.charAt(0).toUpperCase();
    } else {
      a.classList.remove('logged-in');
      a.textContent = '';
    }
  });
}

function renderCurrentView() {
  if (!_panel) return;
  const content = _panel.querySelector('.account-panel-body');
  if (!content) return;

  switch (_currentView) {
    case 'login': renderLogin(content); break;
    case 'register': renderRegister(content); break;
    case 'profile': renderProfile(content); break;
  }
}

function renderLogin(container) {
  container.innerHTML = `
    <div class="account-form-header">
      <h3>${t('account.login_title')}</h3>
      <p>${t('account.login_subtitle')}</p>
    </div>
    <form id="accountLoginForm" class="account-form" novalidate>
      <div class="account-form-group">
        <label for="accLoginEmail">${t('account.email_label')}</label>
        <input type="email" id="accLoginEmail" class="account-input" placeholder="${t('account.email_placeholder')}" required autocomplete="email">
      </div>
      <div class="account-form-group">
        <label for="accLoginPass">${t('account.password_label')}</label>
        <div class="account-pass-wrap">
          <input type="password" id="accLoginPass" class="account-input" placeholder="${t('account.password_placeholder')}" required autocomplete="current-password">
          <button type="button" class="account-pass-toggle" aria-label="${t('account.show_password')}" data-target="accLoginPass">
            <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="eye-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
      </div>
      <div id="accountLoginError" class="account-error" hidden></div>
      <button type="submit" class="account-submit-btn">
        <span>${t('account.login_btn')}</span>
      </button>
    </form>
    <div class="account-switch">
      <span>${t('account.no_account')}</span>
      <button type="button" class="account-link-btn" id="goToRegister">${t('account.register_link')}</button>
    </div>
    <div class="account-admin-hint">
      <span class="account-admin-hint-icon">🔑</span>
      <span>${t('account.admin_hint')}</span>
    </div>
  `;

  document.getElementById('accountLoginForm').addEventListener('submit', handleLogin);
  document.getElementById('goToRegister').addEventListener('click', () => {
    _currentView = 'register';
    renderCurrentView();
  });
  attachPassToggle();
}

function renderRegister(container) {
  container.innerHTML = `
    <div class="account-form-header">
      <h3>${t('account.register_title')}</h3>
      <p>${t('account.register_subtitle')}</p>
    </div>
    <form id="accountRegisterForm" class="account-form" novalidate>
      <div class="account-form-group">
        <label for="accRegName">${t('account.name_label')}</label>
        <input type="text" id="accRegName" class="account-input" placeholder="${t('account.name_placeholder')}" required autocomplete="name">
      </div>
      <div class="account-form-group">
        <label for="accRegEmail">${t('account.email_label')}</label>
        <input type="email" id="accRegEmail" class="account-input" placeholder="${t('account.email_placeholder')}" required autocomplete="email">
      </div>
      <div class="account-form-group">
        <label for="accRegPass">${t('account.password_label')}</label>
        <div class="account-pass-wrap">
          <input type="password" id="accRegPass" class="account-input" placeholder="${t('account.password_min')}" required autocomplete="new-password">
          <button type="button" class="account-pass-toggle" aria-label="${t('account.show_password')}" data-target="accRegPass">
            <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="eye-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
      </div>
      <div id="accountRegError" class="account-error" hidden></div>
      <button type="submit" class="account-submit-btn">
        <span>${t('account.register_btn')}</span>
      </button>
    </form>
    <div class="account-switch">
      <span>${t('account.has_account')}</span>
      <button type="button" class="account-link-btn" id="goToLogin">${t('account.login_link')}</button>
    </div>
  `;

  document.getElementById('accountRegisterForm').addEventListener('submit', handleRegister);
  document.getElementById('goToLogin').addEventListener('click', () => {
    _currentView = 'login';
    renderCurrentView();
  });
  attachPassToggle();
}

async function renderProfile(container) {
  const stats = await getAccountStats();
  const user = getUser();
  const adminBadge = user?.role === 'admin' ? `<span class="account-role-badge account-role-admin">${t('account.role_admin')}</span>` : `<span class="account-role-badge account-role-client">${t('account.role_client')}</span>`;

  container.innerHTML = `
    <div class="account-profile-header">
      <div class="account-profile-avatar">${user?.name?.charAt(0).toUpperCase() || '?'}</div>
      <div class="account-profile-info">
        <h3>${user?.name || '—'}</h3>
        <p class="account-profile-email">${user?.email || '—'}</p>
        ${adminBadge}
      </div>
    </div>

    <div class="account-profile-stats">
      <div class="account-profile-stat">
        <span class="account-profile-stat-label">${t('account.member_since')}</span>
        <span class="account-profile-stat-value">${stats?.memberSince || '—'}</span>
      </div>
      <div class="account-profile-stat">
        <span class="account-profile-stat-label">${t('account.account_type')}</span>
        <span class="account-profile-stat-value">${user?.role === 'admin' ? t('account.type_admin') : t('account.type_client')}</span>
      </div>
    </div>

    ${user?.role === 'admin' ? `
    <a href="#admin" class="account-admin-btn" id="accountGoAdmin">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      <span>${t('account.open_admin')}</span>
    </a>
    ` : ''}

    <div class="account-section-title">${t('account.edit_profile')}</div>
    <form id="accountProfileForm" class="account-form" novalidate>
      <div class="account-form-group">
        <label for="accProfName">${t('account.name_label')}</label>
        <input type="text" id="accProfName" class="account-input" value="${user?.name || ''}" required autocomplete="name">
      </div>
      <button type="submit" class="account-submit-btn account-submit-sm">
        <span>${t('account.save_changes')}</span>
      </button>
    </form>

    <div class="account-section-title">${t('account.change_password')}</div>
    <form id="accountPassForm" class="account-form" novalidate>
      <div class="account-form-group">
        <label for="accOldPass">${t('account.current_password')}</label>
        <div class="account-pass-wrap">
          <input type="password" id="accOldPass" class="account-input" placeholder="${t('account.current_password_placeholder')}" required autocomplete="current-password">
          <button type="button" class="account-pass-toggle" aria-label="${t('account.show_password')}" data-target="accOldPass">
            <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="eye-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
      </div>
      <div class="account-form-group">
        <label for="accNewPass">${t('account.new_password')}</label>
        <div class="account-pass-wrap">
          <input type="password" id="accNewPass" class="account-input" placeholder="${t('account.password_min')}" required autocomplete="new-password">
          <button type="button" class="account-pass-toggle" aria-label="${t('account.show_password')}" data-target="accNewPass">
            <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="eye-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
      </div>
      <div id="accountPassError" class="account-error" hidden></div>
      <div id="accountPassSuccess" class="account-success-msg" hidden>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${t('account.password_changed')}
      </div>
      <button type="submit" class="account-submit-btn account-submit-sm">
        <span>${t('account.update_password')}</span>
      </button>
    </form>

    <button type="button" class="account-logout-btn" id="accountLogoutBtn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span>${t('account.logout')}</span>
    </button>
  `;

  document.getElementById('accountProfileForm').addEventListener('submit', handleProfileUpdate);
  document.getElementById('accountPassForm').addEventListener('submit', handlePasswordChange);
  document.getElementById('accountLogoutBtn').addEventListener('click', handleLogout);
  const adminBtn = document.getElementById('accountGoAdmin');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      closeAccountPanel();
    });
  }
  attachPassToggle();
}

// --- handlers ---

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('accLoginEmail').value;
  const pass = document.getElementById('accLoginPass').value;
  const btn = e.target.querySelector('.account-submit-btn');
  const errEl = document.getElementById('accountLoginError');

  btn.disabled = true;
  btn.querySelector('span').textContent = '…';
  errEl.hidden = true;

  const result = await login(email, pass);
  if (result.ok) {
    updateNavAccountBtn();
    closeAccountPanel();
    // If admin, redirect to admin panel
    if (result.user.role === 'admin') {
      setTimeout(() => { location.hash = '#admin'; }, 100);
    }
    // Dispatch event so other modules can react
    window.dispatchEvent(new CustomEvent('account-changed', { detail: result.user }));
  } else {
    errEl.textContent = t('account.error_' + (result.error || 'unknown'));
    errEl.hidden = false;
    btn.disabled = false;
    btn.querySelector('span').textContent = t('account.login_btn');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('accRegName').value;
  const email = document.getElementById('accRegEmail').value;
  const pass = document.getElementById('accRegPass').value;
  const btn = e.target.querySelector('.account-submit-btn');
  const errEl = document.getElementById('accountRegError');

  btn.disabled = true;
  btn.querySelector('span').textContent = '…';
  errEl.hidden = true;

  const result = await register(email, pass, name);
  if (result.ok) {
    updateNavAccountBtn();
    closeAccountPanel();
    if (result.user.role === 'admin') {
      setTimeout(() => { location.hash = '#admin'; }, 100);
    }
    window.dispatchEvent(new CustomEvent('account-changed', { detail: result.user }));
  } else {
    errEl.textContent = t('account.error_' + (result.error || 'unknown'));
    errEl.hidden = false;
    btn.disabled = false;
    btn.querySelector('span').textContent = t('account.register_btn');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById('accProfName').value;
  const btn = e.target.querySelector('.account-submit-btn');
  btn.disabled = true;
  btn.querySelector('span').textContent = '…';

  await updateProfile(name);
  updateNavAccountBtn();
  renderCurrentView();
  window.dispatchEvent(new CustomEvent('account-changed', { detail: getUser() }));
}

async function handlePasswordChange(e) {
  e.preventDefault();
  const oldPass = document.getElementById('accOldPass').value;
  const newPass = document.getElementById('accNewPass').value;
  const errEl = document.getElementById('accountPassError');
  const successEl = document.getElementById('accountPassSuccess');
  const btn = e.target.querySelector('.account-submit-btn');

  btn.disabled = true;
  btn.querySelector('span').textContent = '…';
  errEl.hidden = true;
  successEl.hidden = true;

  const result = await changePassword(oldPass, newPass);
  if (result.ok) {
    successEl.hidden = false;
    e.target.reset();
  } else {
    errEl.textContent = t('account.error_' + (result.error || 'unknown'));
    errEl.hidden = false;
  }
  btn.disabled = false;
  btn.querySelector('span').textContent = t('account.update_password');
}

async function handleLogout() {
  await logout();
  updateNavAccountBtn();
  closeAccountPanel();
  // If on admin page, redirect to home
  if (location.hash === '#admin') location.hash = '#home';
  window.dispatchEvent(new CustomEvent('account-changed', { detail: null }));
}

function attachPassToggle() {
  document.querySelectorAll('.account-pass-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.classList.toggle('showing', isPassword);
      btn.setAttribute('aria-label', isPassword ? t('account.hide_password') : t('account.show_password'));
    });
  });
}
