import { getTestimonials } from './data-store.js';

const t = (key) => window.miniappI18n?.t(key) ?? key;

export async function initTestimonials() {
  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;

  let items = [];
  try {
    items = await getTestimonials();
  } catch {
    items = [];
  }

  grid.innerHTML = items.map(item => `
    <div class="testimonial-card">
      <div class="testimonial-stars" aria-label="5 étoiles">★★★★★</div>
      <p class="testimonial-text">"${item.text}"</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${item.initials}</div>
        <div>
          <div class="testimonial-name">${item.name}</div>
          <div class="testimonial-role">${item.role}</div>
        </div>
      </div>
    </div>
  `).join('');
}
