import { initI18n, applyToDOM } from './ui/i18n.js';
import { initNavigation } from './ui/navigation.js';
import { initPortfolio } from './ui/portfolio.js';
import { initPricing } from './ui/pricing.js';
import { initFaq } from './ui/faq.js';
import { initAnimations } from './ui/animations.js';
import { initContact } from './ui/contact.js';
import { initTestimonials } from './ui/testimonials.js';
import { initAdmin, hideAdmin } from './ui/admin-panel.js';
import { initAccountPanel, openAccountPanel } from './ui/account-panel.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Bootstrap i18n first — all modules depend on it
  await initI18n();

  initNavigation();
  initPortfolio();
  initPricing();
  initFaq();
  initTestimonials();
  initContact();
  initAnimations();
  await initAccountPanel();
  initAdmin();

  // Account button clicks
  const accBtn = document.getElementById('navAccountBtn');
  const accBtnMobile = document.getElementById('navAccountBtnMobile');
  const closeBtn = document.getElementById('accountPanelClose');

  accBtn?.addEventListener('click', () => openAccountPanel());
  accBtnMobile?.addEventListener('click', () => openAccountPanel());
  closeBtn?.addEventListener('click', () => {
    const panel = document.getElementById('accountPanel');
    panel?.classList.remove('open');
    panel?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });

  window.addEventListener('hashchange', async () => {
    if (location.hash === '#admin') {
      document.body.classList.add('admin-mode');
      await initAdmin();
    } else {
      document.body.classList.remove('admin-mode');
      hideAdmin();
    }
  });
});
