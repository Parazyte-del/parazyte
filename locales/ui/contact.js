export function initContact() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  const t = (key) => window.miniappI18n?.t(key) ?? key;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('.form-submit');
    const btnText = submitBtn?.querySelector('span[data-i18n]');
    if (!submitBtn || !btnText) return;

    submitBtn.disabled = true;
    btnText.textContent = t('contact.sending');

    setTimeout(() => {
      form.reset();
      submitBtn.disabled = false;
      btnText.textContent = t('contact.send');
      success?.classList.add('show');
      setTimeout(() => success?.classList.remove('show'), 4000);
    }, 1500);
  });
}
