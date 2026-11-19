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

  if (gameCanvas) gameCanvas.tabIndex = 0;
  if (shopCanvas) shopCanvas.tabIndex = 0;

  // main.js handles keyboard gameplay controls; don't intercept keys used by
  // editable controls. Escape handling for the upgrades drawer lives in
  // upgrades-sidebar.js so that its button state and accessibility stay synced.
  window.addEventListener('resize', () => {
    window.dispatchEvent(new Event('breakidle-layout-change'));
  });
})();
