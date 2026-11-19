(function () {
  'use strict';

  document.getElementById('leftPanel')?.remove();
  document.getElementById('leftCanvas')?.remove();

  const shop = document.getElementById('shop');
  const railButtons = [...document.querySelectorAll('.right-action-rail .rail-action')];
  if (!shop || railButtons.length === 0) return;

  let activeButton = null;

  function setOpen(open, button = activeButton) {
    shop.classList.toggle('open', open);
    shop.setAttribute('aria-hidden', String(!open));
    activeButton = open ? button : null;

    railButtons.forEach(railButton => {
      const isActive = open && railButton === activeButton;
      railButton.classList.toggle('active', isActive);
      railButton.setAttribute('aria-expanded', String(isActive));
      railButton.setAttribute('aria-label', isActive ? 'Close menu' : `Open ${railButton.dataset.menuLabel || 'menu'}`);
      railButton.title = isActive ? 'Close menu' : (railButton.dataset.menuLabel || 'Open menu');
    });
  }

  railButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button === activeButton && shop.classList.contains('open')) {
        setOpen(false);
      } else {
        setOpen(true, button);
      }
    });
  });

  document.addEventListener('pointerdown', event => {
    const clickedRail = railButtons.some(button => button.contains(event.target));
    if (shop.classList.contains('open') && !shop.contains(event.target) && !clickedRail) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && shop.classList.contains('open')) {
      setOpen(false);
      activeButton?.focus();
    }
  });
})();
