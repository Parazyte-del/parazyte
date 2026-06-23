// ui/admin-panel.js — Admin dashboard panel
import { checkSession, login, logout } from './admin-auth.js';
import { renderAdminPortfolio } from './admin-portfolio.js';
import { renderAdminPricing } from './admin-pricing.js';
import { renderAdminTestimonials } from './admin-testimonials.js';
import { getStats } from './data-store.js';

const t = (k) => window.miniappI18n?.t(k) ?? k;
let activeTab = 'portfolio';
let _container = null;

function fmtViews(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n || 0);
}

export async function initAdmin() {
  const section = document.getElementById('adminSection');
  if (!section) return;
  _container = section;

  if (location.hash === '#admin') {
    section.classList.add('active');
    document.body.classList.add('admin-mode');
    window.scrollTo(0, 0);
    const loggedIn = await checkSession();
    loggedIn ? showDashboard() : showLogin();
  }
}

export function hideAdmin() {
  if (_container) {
    _container.classList.remove('active');
    document.body.classList.remove('admin-mode');
  }
}

function showLogin() {
  _container.innerHTML = `
    <div class="admin-login-wrap">
      <div class="admin-login-card">
        <div class="admin-login-logo">
          <span class="nav-logo-text">P</span>arazyte
        </div>
        <h2>${t('admin.login_title')}</h2>
        <p class="admin-login-sub">${t('admin.login_subtitle')}</p>
        <form id="adminLoginForm" class="admin-form">
          <div class="form-group">
            <label for="admEmail">${t('admin.email_label')}</label>
            <input type="email" id="admEmail" class="form-input" placeholder="${t('admin.email_placeholder')}" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="admPass">${t('admin.password_label')}</label>
            <input type="password" id="admPass" class="form-input" placeholder="${t('admin.password_placeholder')}" required autocomplete="current-password">
          </div>
          <div id="admError" class="admin-error" hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            ${t('admin.login_error')}
          </div>
          <button type="submit" class="form-submit admin-login-btn">${t('admin.login_btn')}</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admEmail').value;
    const pass = document.getElementById('admPass').value;
    const btn = _container.querySelector('.admin-login-btn');
    btn.disabled = true;
    btn.textContent = '…';

    const ok = await login(email, pass);
    if (ok) {
      showDashboard();
    } else {
      const err = document.getElementById('admError');
      if (err) err.hidden = false;
      btn.disabled = false;
      btn.textContent = t('admin.login_btn');
    }
  });
}

async function showDashboard() {
  const stats = await getStats();

  _container.innerHTML = `
    <div class="admin-dashboard">
      <header class="admin-header">
        <div class="admin-header-left">
          <a href="#home" class="admin-back-link" id="adminBack">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            ${t('admin.back_to_site')}
          </a>
          <h1>${t('admin.dashboard_title')}</h1>
        </div>
        <button id="adminLogout" class="admin-logout-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          ${t('admin.logout')}
        </button>
      </header>

      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-icon">🎬</div>
          <div class="admin-stat-num">${stats.videos}</div>
          <div class="admin-stat-label">${t('admin.stats_videos')}</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon">👁</div>
          <div class="admin-stat-num">${fmtViews(stats.views)}</div>
          <div class="admin-stat-label">${t('admin.stats_views')}</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon">⭐</div>
          <div class="admin-stat-num">${stats.testimonials}</div>
          <div class="admin-stat-label">${t('admin.stats_testimonials')}</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon">🕐</div>
          <div class="admin-stat-num admin-stat-text">${stats.lastAdded}</div>
          <div class="admin-stat-label">${t('admin.stats_last_added')}</div>
        </div>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="portfolio">${t('admin.tab_portfolio')}</button>
        <button class="admin-tab" data-tab="pricing">${t('admin.tab_pricing')}</button>
        <button class="admin-tab" data-tab="testimonials">${t('admin.tab_testimonials')}</button>
      </div>

      <div id="adminContent" class="admin-tab-content"></div>
    </div>
  `;

  document.getElementById('adminBack').addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = '#home';
  });

  document.getElementById('adminLogout').addEventListener('click', async () => {
    await logout();
    location.hash = '#home';
  });

  const tabs = _container.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderTab();
    });
  });

  renderTab();
}

function renderTab() {
  const content = document.getElementById('adminContent');
  if (!content) return;

  switch (activeTab) {
    case 'portfolio':
      renderAdminPortfolio(content, refreshStats);
      break;
    case 'pricing':
      renderAdminPricing(content);
      break;
    case 'testimonials':
      renderAdminTestimonials(content, refreshStats);
      break;
  }
}

async function refreshStats() {
  const stats = await getStats();
  const nums = _container?.querySelectorAll('.admin-stat-num');
  if (nums?.length >= 3) {
    nums[0].textContent = stats.videos;
    nums[1].textContent = fmtViews(stats.views);
    nums[2].textContent = stats.testimonials;
    if (nums[3]) nums[3].textContent = stats.lastAdded;
  }
}
