(function () {
  'use strict';

  document.getElementById('leftPanel')?.remove();
  document.getElementById('leftCanvas')?.remove();

  const main = document.querySelector('main');
  let shop = document.getElementById('shop');
  const railButtons = [...document.querySelectorAll('.right-action-rail .rail-action')];
  const upgradesButton = document.getElementById('shopToggle');
  if (!main || !shop || railButtons.length === 0) return;

  // main.js creates a renderer for #shopCanvas during DOMContentLoaded. Replace
  // the canvas before then so that it has a single, dedicated shop surface.
  if (document.readyState === 'loading') {
    const upgradesPanel = document.createElement('aside');
    upgradesPanel.id = 'shop';
    upgradesPanel.className = 'side-panel shop';
    upgradesPanel.setAttribute('aria-label', 'Upgrades');
    upgradesPanel.setAttribute('aria-hidden', 'true');

    const upgradesCanvas = document.createElement('canvas');
    upgradesCanvas.id = 'shopCanvas';
    upgradesCanvas.className = 'side-canvas';
    upgradesCanvas.setAttribute('aria-label', 'Shop upgrade panel');
    upgradesPanel.append(upgradesCanvas);
    shop.replaceWith(upgradesPanel);
    shop = upgradesPanel;
  }

  const panelByButton = new Map();
  const panelById = new Map([[shop.id, shop]]);

  railButtons.forEach((button, index) => {
    let panel;
    if (button === upgradesButton) {
      panel = shop;
    } else {
      const panelNumber = index + 1;
      const label = `Panel ${panelNumber}`;
      const panelId = `actionPanel${panelNumber}`;
      panel = document.createElement('aside');
      panel.id = panelId;
      panel.className = 'side-panel shop';
      panel.setAttribute('aria-label', label);
      panel.setAttribute('aria-hidden', 'true');

      const canvas = document.createElement('canvas');
      canvas.id = `actionCanvas${panelNumber}`;
      canvas.className = 'side-canvas';
      canvas.tabIndex = 0;
      canvas.setAttribute('aria-label', `${label} canvas`);
      panel.append(canvas);
      main.append(panel);

      const labelElement = button.querySelector('.rail-action-label');
      if (labelElement) labelElement.textContent = label;
      button.dataset.menuLabel = label;
    }

    panelByButton.set(button, panel);
    panelById.set(panel.id, panel);
    button.setAttribute('aria-controls', panel.id);
  });

  let activeButton = null;
  let layoutTimer = 0;
  const desktopLayout = window.matchMedia('(min-width: 901px)');

  function syncShopAccessibility() {
    // The upgrades panel is always visible as the desktop sidebar, but is a
    // drawer on smaller screens and should only be exposed while open there.
    shop.setAttribute('aria-hidden', String(!desktopLayout.matches && !shop.classList.contains('open')));
  }

  function setOpen(button) {
    const nextPanel = button ? panelByButton.get(button) : null;
    const openButton = nextPanel?.classList.contains('open') ? null : button;
    activeButton = openButton;
    const activePanel = openButton ? panelByButton.get(openButton) : null;

    panelById.forEach(panel => {
      const isOpen = panel === activePanel;
      panel.classList.toggle('open', isOpen);
      panel.classList.toggle('upgrades-active', isOpen && openButton === upgradesButton);
      panel.setAttribute('aria-hidden', String(!isOpen));
    });
    syncShopAccessibility();

    railButtons.forEach(railButton => {
      const isActive = railButton === openButton;
      const label = railButton.dataset.menuLabel || 'menu';
      railButton.classList.toggle('active', isActive);
      railButton.setAttribute('aria-expanded', String(isActive));
      railButton.setAttribute('aria-label', `${isActive ? 'Close' : 'Open'} ${label}`);
      railButton.title = `${isActive ? 'Close' : 'Open'} ${label}`;
    });

    window.dispatchEvent(new Event('breakidle-layout-change'));
    window.clearTimeout(layoutTimer);
    layoutTimer = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 220);
  }

  desktopLayout.addEventListener('change', syncShopAccessibility);
  syncShopAccessibility();

  railButtons.forEach(button => {
    button.addEventListener('click', event => {
      const panel = panelByButton.get(button);
      setOpen(panel?.classList.contains('open') ? null : button);

      // main.js has a legacy shopToggle click handler that independently flips
      // the same panel. Stop it to prevent the drawer immediately toggling shut.
      if (button === upgradesButton) event.stopImmediatePropagation();
    });
  });

  document.addEventListener('pointerdown', event => {
    const clickedRail = railButtons.some(button => button.contains(event.target));
    const clickedPanel = [...panelById.values()].some(panel => panel.contains(event.target));
    if (activeButton && !clickedPanel && !clickedRail) setOpen(null);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeButton) {
      const returnFocusTo = activeButton;
      setOpen(null);
      returnFocusTo.focus();
    }
  });
})();
