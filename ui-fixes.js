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
  const canvasWrap = gameCanvas?.closest('.canvas-wrap');
  const bottomBar = document.getElementById('bottomBar');

  if (gameCanvas) gameCanvas.tabIndex = 0;
  if (shopCanvas) shopCanvas.tabIndex = 0;

  // Keep the fixed controls centered on the actual game canvas, including while
  // the upgrades drawer changes the canvas width or position.
  let layoutFrame = 0;
  function alignControlsToCanvas() {
    if (!canvasWrap || !bottomBar) return;
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      const rect = canvasWrap.getBoundingClientRect();
      if (!rect.width) return;
      document.documentElement.style.setProperty('--canvas-center', `${rect.left + rect.width / 2}px`);
      document.documentElement.style.setProperty('--canvas-controls-width', `${Math.max(0, rect.width - 16)}px`);
    });
  }

  alignControlsToCanvas();
  window.addEventListener('resize', alignControlsToCanvas);
  window.addEventListener('breakidle-layout-change', alignControlsToCanvas);
  window.addEventListener('transitionend', event => {
    if (event.target === canvasWrap || event.target?.closest?.('.side-panel.shop')) {
      alignControlsToCanvas();
    }
  }, true);

  if (window.ResizeObserver && canvasWrap) {
    const observer = new ResizeObserver(alignControlsToCanvas);
    observer.observe(canvasWrap);
  }

  // main.js handles keyboard gameplay controls; don't intercept keys used by
  // editable controls. Escape handling for the upgrades drawer lives in
  // upgrades-sidebar.js so that its button state and accessibility stay synced.
  window.addEventListener('resize', () => {
    window.dispatchEvent(new Event('breakidle-layout-change'));
  });
})();
