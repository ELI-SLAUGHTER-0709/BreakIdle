(function () {
  'use strict';

  function setVisualViewportHeight() {
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty('--viewport-height', `${Math.round(height)}px`);
  }

  setVisualViewportHeight();
  window.addEventListener('resize', setVisualViewportHeight);
  window.visualViewport?.addEventListener('resize', setVisualViewportHeight);

  const gameCanvas = document.getElementById('game');
  const shopCanvas = document.getElementById('shopCanvas');

  if (gameCanvas) {
    gameCanvas.tabIndex = 0;
  }

  if (shopCanvas) {
    shopCanvas.tabIndex = 0;
  }

  // Keep keyboard controls from intercepting keys used in settings/buttons.
  document.addEventListener('keydown', event => {
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return;
    }

    if (event.key === 'Escape') {
      const shop = document.getElementById('shop');
      const toggle = document.getElementById('shopToggle');
      if (shop?.classList.contains('open')) {
        shop.classList.remove('open');
        shop.setAttribute('aria-hidden', 'true');
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.focus();
      }
    }
  }, true);

  // Make the shop canvas redraw after mobile layout changes instead of
  // retaining the dimensions assigned while it was hidden.
  window.addEventListener('resize', () => {
    window.dispatchEvent(new Event('breakidle-layout-change'));
  });
})();
