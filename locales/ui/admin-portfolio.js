// ui/admin-portfolio.js — Portfolio CRUD for admin panel
import { getPortfolio, saveVideo, deleteVideo, moveVideo } from './data-store.js';
import { t } from './i18n.js';

const CATEGORIES = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'shorts', label: 'Shorts / Reels' },
];

export async function renderAdminPortfolio(container, onUpdate) {
  const videos = await getPortfolio();

  container.innerHTML = `
    <div class="admin-portfolio-header">
      <button id="addVideoBtn" class="admin-add-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        ${t('admin.add_video')}
      </button>
    </div>
    <div id="videoFormArea"></div>
    <div id="videoList" class="admin-video-list">
      ${videos.map((v, i) => videoCard(v, i, videos.length)).join('')}
    </div>
  `;

  document.getElementById('addVideoBtn').addEventListener('click', () => {
    showVideoForm(null, container, onUpdate);
  });

  container.querySelector('#videoList').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === 'edit') {
      const video = videos.find(v => v.id === id);
      if (video) showVideoForm(video, container, onUpdate);
    } else if (action === 'delete') {
      if (confirm(t('admin.confirm_delete'))) {
        await deleteVideo(id);
        await onUpdate();
        renderAdminPortfolio(container, onUpdate);
      }
    } else if (action === 'up' || action === 'down') {
      await moveVideo(id, action);
      await onUpdate();
      renderAdminPortfolio(container, onUpdate);
    }
  });
}

function videoCard(v, i, total) {
  const catLabel = CATEGORIES.find(c => c.value === v.cat)?.label || v.cat;
  const hasThumb = v.thumb && v.thumb.trim();
  return `
    <div class="admin-video-card">
      <div class="admin-video-preview">
        <div class="admin-video-thumb">
          ${hasThumb ? `<img src="${v.thumb}" alt="" loading="lazy">` : `<span class="admin-video-icon">${v.icon || '🎬'}</span>`}
        </div>
      </div>
      <div class="admin-video-info">
        <div class="admin-video-cat">${catLabel}</div>
        <div class="admin-video-title">${v.title}</div>
        <div class="admin-video-desc">${v.desc}</div>
        <div class="admin-video-meta">${v.views ? v.views.toLocaleString() + ' vues' : ''}</div>
      </div>
      <div class="admin-video-actions">
        <button data-action="up" data-id="${v.id}" class="admin-action-btn" title="${t('admin.move_up')}" ${i === 0 ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button data-action="down" data-id="${v.id}" class="admin-action-btn" title="${t('admin.move_down')}" ${i === total - 1 ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button data-action="edit" data-id="${v.id}" class="admin-action-btn" title="${t('admin.edit_video')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button data-action="delete" data-id="${v.id}" class="admin-action-btn admin-action-danger" title="${t('admin.delete_video')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `;
}

function showVideoForm(video, container, onUpdate) {
  const formArea = container.querySelector('#videoFormArea');
  const isEdit = !!video;

  formArea.innerHTML = `
    <div class="admin-form-card">
      <h3>${isEdit ? t('admin.edit_video') : t('admin.add_video')}</h3>
      <form id="videoEditForm">
        <div class="form-row">
          <div class="form-group">
            <label for="vTitle">${t('admin.video_title_label')}</label>
            <input type="text" id="vTitle" class="form-input" value="${isEdit ? esc(video.title) : ''}" required>
          </div>
          <div class="form-group">
            <label for="vIcon">${t('admin.video_icon_label')}</label>
            <input type="text" id="vIcon" class="form-input" value="${isEdit ? esc(video.icon) : '🎬'}" maxlength="4">
          </div>
        </div>
        <div class="form-group">
          <label for="vDesc">${t('admin.video_desc_label')}</label>
          <textarea id="vDesc" class="form-textarea" rows="3" required>${isEdit ? esc(video.desc) : ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="vCat">${t('admin.video_category_label')}</label>
            <select id="vCat" class="form-select">
              ${CATEGORIES.map(c => `<option value="${c.value}" ${isEdit && video.cat === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="vViews">${t('admin.video_views_label')}</label>
            <input type="number" id="vViews" class="form-input" value="${isEdit ? video.views || 0 : 0}" min="0">
          </div>
        </div>
        <div class="form-group">
          <label for="vThumb">${t('admin.video_thumb_label')}</label>
          <input type="url" id="vThumb" class="form-input" value="${isEdit ? esc(video.thumb || '') : ''}" placeholder="https://...">
        </div>
        <div class="admin-form-actions">
          <button type="button" id="cancelVideoBtn" class="pricing-btn pricing-btn-secondary">${t('admin.cancel')}</button>
          <button type="submit" class="pricing-btn pricing-btn-primary">${t('admin.save')}</button>
        </div>
      </form>
    </div>
  `;

  formArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('cancelVideoBtn').addEventListener('click', () => {
    formArea.innerHTML = '';
  });

  document.getElementById('videoEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updated = {
      id: isEdit ? video.id : undefined,
      cat: document.getElementById('vCat').value,
      title: document.getElementById('vTitle').value,
      desc: document.getElementById('vDesc').value,
      icon: document.getElementById('vIcon').value || '🎬',
      views: Number(document.getElementById('vViews').value) || 0,
      thumb: document.getElementById('vThumb').value || '',
    };
    await saveVideo(updated);
    formArea.innerHTML = '';
    await onUpdate();
    renderAdminPortfolio(container, onUpdate);
  });
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
