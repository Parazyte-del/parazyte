// ui/admin-testimonials.js — Testimonials CRUD for admin panel
import { getTestimonials, saveTestimonial, deleteTestimonial } from './data-store.js';

const t = (k) => window.miniappI18n?.t(k) ?? k;

export async function renderAdminTestimonials(container, onUpdate) {
  const items = await getTestimonials();

  container.innerHTML = `
    <div class="admin-portfolio-header">
      <button id="addTestBtn" class="admin-add-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        ${t('admin.add_testimonial')}
      </button>
    </div>
    <div id="testFormArea"></div>
    <div id="testList" class="admin-test-list">
      ${items.map((item, i) => testimonialCard(item, i)).join('')}
    </div>
  `;

  document.getElementById('addTestBtn').addEventListener('click', () => {
    showTestForm(-1, null, container, onUpdate);
  });

  container.querySelector('#testList').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const action = btn.dataset.action;

    if (action === 'edit') {
      showTestForm(idx, items[idx], container, onUpdate);
    } else if (action === 'delete') {
      if (confirm(t('admin.confirm_delete'))) {
        await deleteTestimonial(idx);
        await onUpdate();
        renderAdminTestimonials(container, onUpdate);
      }
    }
  });
}

function testimonialCard(item, i) {
  return `
    <div class="admin-test-card">
      <div class="admin-test-avatar">${item.initials}</div>
      <div class="admin-test-info">
        <div class="admin-test-name">${item.name}</div>
        <div class="admin-test-role">${item.role}</div>
        <div class="admin-test-text">${item.text}</div>
      </div>
      <div class="admin-video-actions">
        <button data-action="edit" data-idx="${i}" class="admin-action-btn" title="${t('admin.edit_testimonial')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button data-action="delete" data-idx="${i}" class="admin-action-btn admin-action-danger" title="${t('admin.delete_video')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `;
}

function showTestForm(idx, item, container, onUpdate) {
  const formArea = container.querySelector('#testFormArea');
  const isEdit = idx >= 0;

  formArea.innerHTML = `
    <div class="admin-form-card">
      <h3>${isEdit ? t('admin.edit_testimonial') : t('admin.add_testimonial')}</h3>
      <form id="testEditForm">
        <div class="form-row">
          <div class="form-group">
            <label for="tName">${t('admin.testimonial_name')}</label>
            <input type="text" id="tName" class="form-input" value="${isEdit ? esc(item.name) : ''}" required>
          </div>
          <div class="form-group">
            <label for="tRole">${t('admin.testimonial_role')}</label>
            <input type="text" id="tRole" class="form-input" value="${isEdit ? esc(item.role) : ''}" required>
          </div>
        </div>
        <div class="form-group">
          <label for="tText">${t('admin.testimonial_text')}</label>
          <textarea id="tText" class="form-textarea" rows="4" required>${isEdit ? esc(item.text) : ''}</textarea>
        </div>
        <div class="form-group">
          <label for="tInit">${t('admin.testimonial_initials')}</label>
          <input type="text" id="tInit" class="form-input" value="${isEdit ? esc(item.initials) : ''}" maxlength="3" required>
        </div>
        <div class="admin-form-actions">
          <button type="button" id="cancelTestBtn" class="pricing-btn pricing-btn-secondary">${t('admin.cancel')}</button>
          <button type="submit" class="pricing-btn pricing-btn-primary">${t('admin.save')}</button>
        </div>
      </form>
    </div>
  `;

  formArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('cancelTestBtn').addEventListener('click', () => {
    formArea.innerHTML = '';
  });

  document.getElementById('testEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('tName').value,
      role: document.getElementById('tRole').value,
      text: document.getElementById('tText').value,
      initials: document.getElementById('tInit').value.toUpperCase(),
    };
    await saveTestimonial(idx, data);
    formArea.innerHTML = '';
    await onUpdate();
    renderAdminTestimonials(container, onUpdate);
  });
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
