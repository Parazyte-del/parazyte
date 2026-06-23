// ui/admin-pricing.js — Pricing management for admin panel
import { getPricing, savePricing } from './data-store.js';
import { t } from './i18n.js';

export async function renderAdminPricing(container) {
  const pricing = await getPricing();

  container.innerHTML = `
    <div class="admin-pricing-form">
      <div class="admin-form-card">
        <h3>
          <span class="pricing-section-icon" style="width:32px;height:32px;font-size:0.9rem">🎵</span>
          ${t('pricing.tiktok_title')}
        </h3>
        <form id="pricingForm">
          <div class="form-row">
            <div class="form-group">
              <label for="pStd">${t('admin.tiktok_standard_price')}</label>
              <div class="admin-price-input">
                <input type="number" id="pStd" class="form-input" value="${pricing.tiktokStandard}" min="0" step="1">
                <span class="admin-price-unit">€</span>
              </div>
            </div>
            <div class="form-group">
              <label for="pPrem">${t('admin.tiktok_premium_price')}</label>
              <div class="admin-price-input">
                <input type="number" id="pPrem" class="form-input" value="${pricing.tiktokPremium}" min="0" step="1">
                <span class="admin-price-unit">€</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="pYT">
              <span class="pricing-section-icon" style="width:24px;height:24px;font-size:0.75rem;display:inline-flex">📺</span>
              ${t('admin.youtube_desc')}
            </label>
            <textarea id="pYT" class="form-textarea" rows="3">${pricing.youtubeNote || ''}</textarea>
          </div>
          <div class="admin-form-actions">
            <button type="submit" class="pricing-btn pricing-btn-primary">${t('admin.save')}</button>
          </div>
        </form>
        <div id="pricingSuccess" class="admin-success" hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          ${t('admin.pricing_saved')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('pricingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await savePricing({
      tiktokStandard: Number(document.getElementById('pStd').value) || 0,
      tiktokPremium: Number(document.getElementById('pPrem').value) || 0,
      youtubeNote: document.getElementById('pYT').value,
    });
    const msg = document.getElementById('pricingSuccess');
    msg.hidden = false;
    setTimeout(() => { msg.hidden = true; }, 3000);
  });
}
