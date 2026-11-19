(function () {
  'use strict';

  document.getElementById('leftPanel')?.remove();
  document.getElementById('leftCanvas')?.remove();

  const shop = document.getElementById('shop');
  const railButtons = [...document.querySelectorAll('.right-action-rail .rail-action')];
  const upgradesButton = document.getElementById('shopToggle');
  if (!shop || railButtons.length === 0) return;

  let activeButton = null;

  function setOpen(open, button = activeButton) {
    activeButton = open ? button : null;
    shop.classList.toggle('open', open);
    shop.classList.toggle('upgrades-active', open && button === upgradesButton);
    shop.setAttribute('aria-hidden', String(!open));

    railButtons.forEach(railButton => {
      const isActive = open && railButton === activeButton;
      const label = railButton.dataset.menuLabel || railButton.querySelector('.rail-action-label')?.textContent.trim() || 'menu';
      railButton.classList.toggle('active', isActive);
      railButton.setAttribute('aria-expanded', String(isActive));
      railButton.setAttribute('aria-label', isActive ? `Close ${label}` : `Open ${label}`);
      railButton.title = isActive ? `Close ${label}` : `Open ${label}`;
    });

    if (open && button === upgradesButton) {
      // Give the drawer its final size, then trigger the game's existing
      // canvas resize/render logic so the upgrades are visible immediately.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
        });
      });
    }
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
      const returnFocusTo = activeButton;
      setOpen(false);
      returnFocusTo?.focus();
    }
  });
})();
