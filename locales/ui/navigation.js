export function initNavigation() {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  const allLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  const handleScroll = () => {
    nav?.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  burger?.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('open');
    mobileMenu?.classList.toggle('open', isOpen);
    mobileMenu?.setAttribute('aria-hidden', String(!isOpen));
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  allLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offset = 72;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        burger?.classList.remove('open');
        mobileMenu?.classList.remove('open');
        mobileMenu?.setAttribute('aria-hidden', 'true');
        burger?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  });

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const updateActive = () => {
    const y = window.scrollY + 140;
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop;
      if (y >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href')?.replace('#', '');
      link.classList.toggle('active', href === current);
    });
  };

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
}
