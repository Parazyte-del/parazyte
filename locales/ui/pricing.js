import { getPricing } from './data-store.js';

export async function initPricing() {
  const tiktokCard = document.getElementById('tiktokCard');
  const tiktokExpanded = document.getElementById('tiktokExpanded');
  const viewBtn = document.getElementById('tiktokViewBtn');
  if (!tiktokCard || !tiktokExpanded) return;

  const t = (key) => window.miniappI18n?.t(key) ?? key;

  // Load admin-configured pricing
  try {
    const pricing = await getPricing();
    const stdEl = document.getElementById('standardPriceDisplay');
    const premEl = document.getElementById('premiumPriceDisplay');
    const priceEl = document.getElementById('tiktokPriceDisplay');
    const ytDesc = document.getElementById('youtubeDescDisplay');

    if (stdEl) stdEl.textContent = pricing.tiktokStandard + '€';
    if (premEl) premEl.textContent = pricing.tiktokPremium + '€';
    if (priceEl) priceEl.textContent = pricing.tiktokStandard + '€';
    if (ytDesc && pricing.youtubeNote) ytDesc.textContent = pricing.youtubeNote;
  } catch {}

  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    tiktokCard.classList.toggle('expanded', isOpen);
    tiktokExpanded.classList.toggle('open', isOpen);
    if (viewBtn) {
      viewBtn.textContent = isOpen ? t('pricing.hide_offers') : t('pricing.view_offers');
    }
  }

  viewBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  tiktokCard.addEventListener('click', () => {
    if (!isOpen) toggle();
  });
}
