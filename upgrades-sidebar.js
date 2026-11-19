(function () {
  'use strict';

  const leftPanel = document.getElementById('leftPanel');
  leftPanel?.remove();
  document.getElementById('leftCanvas')?.remove();

  const toggle = document.getElementById('shopToggle');
  const shop = document.getElementById('shop');
  if (!toggle || !shop) return;

  function setOpen(open) {
    shop.classList.toggle('open', open);
    shop.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close upgrades' : 'Open upgrades');
    toggle.title = open ? 'Close upgrades' : 'Upgrades';
  }

  toggle.addEventListener('click', () => {
    setOpen(!shop.classList.contains('open'));
  });

  document.addEventListener('pointerdown', event => {
    if (shop.classList.contains('open') && !shop.contains(event.target) && !toggle.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && shop.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
