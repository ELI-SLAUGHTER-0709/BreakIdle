(function () {
  'use strict';

  function initializeRapidButton() {
    const button = document.getElementById('useRapidBottom');
    const progressBar = document.getElementById('rapidCooldownBar');
    const cooldownText = document.getElementById('rapidCooldownText');
    if (!button || !progressBar) return;

    const label = document.createElement('span');
    label.className = 'rapid-button-label';
    label.textContent = 'RAPID';
    button.replaceChildren(label);
    button.setAttribute('aria-label', 'Rapid fire');

    function syncProgress() {
      const progress = Math.max(0, Math.min(100, Number.parseFloat(progressBar.style.width) || 0));
      const ready = progress >= 100 && !button.disabled;
      button.style.setProperty('--rapid-progress', String(progress / 100));
      button.classList.toggle('rapid-ready', ready);
      button.setAttribute('aria-valuenow', String(Math.round(progress)));

      if (cooldownText) {
        const remaining = cooldownText.textContent.trim();
        const message = ready ? 'Rapid fire ready' : `Rapid fire cooldown: ${remaining} remaining`;
        button.setAttribute('aria-valuetext', message);
        button.title = message;
      }
    }

    syncProgress();
    new MutationObserver(syncProgress).observe(progressBar, {
      attributes: true,
      attributeFilter: ['style'],
    });
    new MutationObserver(syncProgress).observe(button, {
      attributes: true,
      attributeFilter: ['disabled'],
    });
    if (cooldownText) {
      new MutationObserver(syncProgress).observe(cooldownText, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
  }

  // main.js creates the Rapid button during DOMContentLoaded, so initialize
  // after its handler has populated the controls.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRapidButton, { once: true });
  } else {
    initializeRapidButton();
  }
})();
