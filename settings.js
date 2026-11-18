(function () {
  'use strict';

  const menu = document.getElementById('settingsMenu');
  const toggle = document.getElementById('settingsToggle');
  const close = document.getElementById('settingsClose');
  const reset = document.getElementById('settingsReset');
  const resetButton = document.getElementById('clearBtn');
  const menuWrap = document.querySelector('.settings-wrap');
  const saveKey = 'breakIdleSave_v2';

  function setMenuOpen(open) {
    if (!menu || !toggle) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close settings' : 'Open settings');
    if (open) close?.focus();
  }

  toggle?.addEventListener('click', () => {
    setMenuOpen(menu?.hidden ?? true);
  });

  close?.addEventListener('click', () => {
    setMenuOpen(false);
    toggle?.focus();
  });

  document.addEventListener('pointerdown', event => {
    if (menu && !menu.hidden && menuWrap && !menuWrap.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu && !menu.hidden) {
      setMenuOpen(false);
      toggle?.focus();
    }
  });

  function resetProgress() {
    if (!window.confirm('Reset all progress?')) return;
    try {
      localStorage.removeItem(saveKey);
    } finally {
      window.location.reload();
    }
  }

  reset?.addEventListener('click', resetProgress);
  resetButton?.addEventListener('click', event => {
    event.preventDefault();
    resetProgress();
  });

  // The shop is rendered to canvas. Its Speed upgrade state is named
  // speedLevel, while the shop item key is "spd". Correct that displayed
  // level without changing the existing canvas layout or game code.
  if (window.CanvasRenderingContext2D) {
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    const shopLabelByContext = new WeakMap();
    const itemLabels = new Set([
      'Unlock Auto', 'Auto Spd', 'Power', 'Crit Dmg', 'Balls', 'Speed',
      'Rapid (+10)',
    ]);

    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      if (this.canvas?.id === 'shopCanvas') {
        const value = String(text);
        if (itemLabels.has(value)) {
          shopLabelByContext.set(this, value);
        } else if (value.startsWith('LV.')) {
          if (shopLabelByContext.get(this) === 'Speed') {
            try {
              const save = JSON.parse(localStorage.getItem(saveKey) || '{}');
              const level = Number.isFinite(save.speedLevel)
                ? Math.max(0, Math.floor(save.speedLevel))
                : 0;
              text = `LV.${level}`;
            } catch {
              text = 'LV.0';
            }
          }
          shopLabelByContext.delete(this);
        }
      }
      return originalFillText.call(this, text, ...args);
    };
  }
})();
