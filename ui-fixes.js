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
  const shopPanels = [...document.querySelectorAll('.side-panel.shop')];

  if (gameCanvas) gameCanvas.tabIndex = 0;
  if (shopCanvas) shopCanvas.tabIndex = 0;

  // Keep the fixed controls centered on the actual game canvas, including while
  // a sidebar changes its position or width.
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

  // The game renderer sizes its backing store in response to window resize.
  // Sidebar transitions do not produce a native resize event, so observe the
  // rendered boxes and send one after their geometry has stopped changing.
  let canvasResizeTimer = 0;
  function scheduleCanvasResize() {
    window.clearTimeout(canvasResizeTimer);
    canvasResizeTimer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 140);
  }

  alignControlsToCanvas();
  window.addEventListener('resize', alignControlsToCanvas);
  window.addEventListener('breakidle-layout-change', alignControlsToCanvas);
  window.addEventListener('transitionend', event => {
    if (event.target === canvasWrap || event.target?.matches?.('.side-panel.shop')) {
      alignControlsToCanvas();
      scheduleCanvasResize();
    }
  }, true);

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      alignControlsToCanvas();
      scheduleCanvasResize();
    });
    if (canvasWrap) observer.observe(canvasWrap);
    shopPanels.forEach(panel => observer.observe(panel));
  }

  // Keep layout variables up to date if the viewport changes independently of
  // the canvas/sidebar (for example, orientation changes on mobile).
  window.addEventListener('resize', () => {
    window.dispatchEvent(new Event('breakidle-layout-change'));
  });
})();
