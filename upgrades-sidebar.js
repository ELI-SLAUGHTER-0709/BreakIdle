(function () {
  'use strict';

  document.getElementById('leftPanel')?.remove();
  document.getElementById('leftCanvas')?.remove();

  const main = document.querySelector('main');
  const shop = document.getElementById('shop');
  const railButtons = [...document.querySelectorAll('.right-action-rail .rail-action')];
  const upgradesButton = document.getElementById('shopToggle');
  if (!main || !shop || railButtons.length === 0) return;

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

  function setOpen(button) {
    const nextPanel = button ? panelByButton.get(button) : null;
    const isSamePanelOpen = nextPanel && nextPanel.classList.contains('open');
    const openButton = isSamePanelOpen ? null : button;
    activeButton = openButton;

    panelById.forEach(panel => {
      const isOpen = panel === (openButton && panelByButton.get(openButton));
      panel.classList.toggle('open', Boolean(isOpen));
      panel.classList.toggle('upgrades-active', Boolean(isOpen && openButton === upgradesButton));
      panel.setAttribute('aria-hidden', String(!isOpen));
    });

    railButtons.forEach(railButton => {
      const isActive = railButton === openButton;
      const label = railButton.dataset.menuLabel || 'menu';
      railButton.classList.toggle('active', isActive);
      railButton.setAttribute('aria-expanded', String(isActive));
      railButton.setAttribute('aria-label', `${isActive ? 'Close' : 'Open'} ${label}`);
      railButton.title = `${isActive ? 'Close' : 'Open'} ${label}`;
    });

    if (openButton === upgradesButton) {
      // Resize the game's shop canvas after the drawer has reached its final size.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
      });
    }
  }

  railButtons.forEach(button => {
    button.addEventListener('click', () => {
      const panel = panelByButton.get(button);
      setOpen(panel?.classList.contains('open') ? null : button);
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
