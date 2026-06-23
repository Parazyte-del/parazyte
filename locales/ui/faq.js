const FAQ_KEYS = [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
  { q: 'faq.q4', a: 'faq.a4' },
  { q: 'faq.q5', a: 'faq.a5' },
];

const t = (key) => window.miniappI18n?.t(key) ?? key;

export function initFaq() {
  const list = document.getElementById('faqList');
  if (!list) return;

  list.innerHTML = FAQ_KEYS.map((item, i) => `
    <div class="faq-item" data-index="${i}">
      <button class="faq-question" aria-expanded="false">
        <span>${t(item.q)}</span>
        <span class="chevron" aria-hidden="true">▼</span>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">${t(item.a)}</div>
      </div>
    </div>
  `).join('');

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
}
