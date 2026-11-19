(function () {
  'use strict';

  document.getElementById('leftPanel')?.remove();
  document.getElementById('leftCanvas')?.remove();

  const toggle = document.getElementById('shopToggle');
  const shop = document.getElementById('shop');
  if (!toggle || !shop) return;

  const main = document.querySelector('main');
  const canvasWrap = document.querySelector('.canvas-wrap');

  function updateCanvasControlsPosition() {
    if (!canvasWrap) return;
    const rect = canvasWrap.getBoundingClientRect();
    document.documentElement.style.setProperty('--canvas-center', `${rect.left + rect.width / 2}px`);
    document.documentElement.style.setProperty('--canvas-controls-width', `${Math.max(280, rect.width)}px`);
  }

  function setOpen(open) {
    shop.classList.toggle('open', open);
    shop.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close upgrades' : 'Open upgrades');
    toggle.title = open ? 'Close upgrades' : 'Upgrades';
    requestAnimationFrame(() => {
      updateCanvasControlsPosition();
      window.dispatchEvent(new Event('resize'));
    });
  }

  toggle.addEventListener('click', () => setOpen(!shop.classList.contains('open')));

  document.addEventListener('pointerdown', event => {
    if (shop.classList.contains('open') && !shop.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && shop.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', updateCanvasControlsPosition);
  if (window.ResizeObserver && main) new ResizeObserver(updateCanvasControlsPosition).observe(main);
  if (window.ResizeObserver && canvasWrap) new ResizeObserver(updateCanvasControlsPosition).observe(canvasWrap);
  window.addEventListener('load', updateCanvasControlsPosition);
  requestAnimationFrame(updateCanvasControlsPosition);
})();
