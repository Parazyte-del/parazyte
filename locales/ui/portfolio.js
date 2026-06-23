import { getPortfolio } from './data-store.js';

const t = (key) => window.miniappI18n?.t(key) ?? key;

function renderCard(item) {
  const hasThumb = item.thumb && item.thumb.trim();
  return `
    <div class="portfolio-card" data-category="${item.cat}">
      <div class="portfolio-thumb">
        <div class="portfolio-thumb-inner">
          ${hasThumb
            ? `<img src="${item.thumb}" alt="" style="width:100%;height:100%;object-fit:cover">`
            : `<span class="portfolio-thumb-icon">${item.icon || '🎬'}</span>`}
        </div>
        <div class="portfolio-overlay">
          <div class="portfolio-play" aria-hidden="true">▶</div>
        </div>
      </div>
      <div class="portfolio-info">
        <span class="portfolio-category">${t('portfolio.category_' + item.cat)}</span>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
      </div>
    </div>
  `;
}

function openVideoModal(title) {
  const modal = document.getElementById('videoModal');
  const modalTitle = document.getElementById('videoModalTitle');
  const closeBtn = document.getElementById('videoModalClose');
  if (!modal || !modalTitle) return;

  modalTitle.textContent = title;
  modal.classList.add('open');

  const close = () => {
    modal.classList.remove('open');
    closeBtn?.removeEventListener('click', close);
    modal.removeEventListener('click', handleBackdrop);
    document.removeEventListener('keydown', handleEsc);
  };
  const handleBackdrop = (e) => { if (e.target === modal) close(); };
  const handleEsc = (e) => { if (e.key === 'Escape') close(); };

  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', handleBackdrop);
  document.addEventListener('keydown', handleEsc);
}

export async function initPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  const filters = document.querySelectorAll('.filter-btn');
  if (!grid) return;

  let allItems = [];
  try {
    allItems = await getPortfolio();
  } catch {
    allItems = [];
  }

  function render(filter = 'all') {
    const items = filter === 'all' ? allItems : allItems.filter(i => i.cat === filter);
    grid.innerHTML = items.map(renderCard).join('');

    requestAnimationFrame(() => {
      grid.querySelectorAll('.portfolio-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 80);
      });
    });
  }

  render();

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.filter);
    });
  });

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.portfolio-card');
    if (!card) return;
    const title = card.querySelector('h3')?.textContent || '';
    openVideoModal(title);
  });
}
