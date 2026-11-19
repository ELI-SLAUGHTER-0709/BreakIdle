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

    function syncProgress() {
      const progress = Math.max(0, Math.min(100, Number.parseFloat(progressBar.style.width) || 0));
      const ready = progress >= 100 && !button.disabled;
      const remaining = cooldownText?.textContent.trim();
      const accessibleState = ready
        ? 'Rapid fire ready'
        : `Rapid fire cooling down${remaining && remaining !== 'READY' ? `, ${remaining} remaining` : ''}`;

      button.style.setProperty('--rapid-progress', `${progress}%`);
      button.classList.toggle('rapid-ready', ready);
      button.setAttribute('aria-label', accessibleState);
      button.title = accessibleState;
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

  // main.js creates the button from its DOMContentLoaded handler.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRapidButton, { once: true });
  } else {
    initializeRapidButton();
  }
})();
