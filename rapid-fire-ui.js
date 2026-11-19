(function () {
  'use strict';

  const button = document.getElementById('useRapidBottom');
  const progressBar = document.getElementById('rapidCooldownBar');
  const cooldownText = document.getElementById('rapidCooldownText');
  if (!button || !progressBar) return;

  const label = document.createElement('span');
  label.className = 'rapid-button-label';
  label.textContent = button.textContent.trim();
  button.replaceChildren(label);
  button.setAttribute('aria-label', 'Rapid fire');
  button.setAttribute('aria-valuemin', '0');
  button.setAttribute('aria-valuemax', '100');
  button.setAttribute('role', 'progressbar');

  function syncProgress() {
    const progress = Math.max(0, Math.min(100, Number.parseFloat(progressBar.style.width) || 0));
    button.style.setProperty('--rapid-progress', String(progress / 100));
    button.setAttribute('aria-valuenow', String(Math.round(progress)));
    if (cooldownText) {
      const remaining = cooldownText.textContent.trim();
      button.setAttribute('aria-valuetext', remaining === 'READY' ? 'Rapid fire ready' : `Rapid fire cooldown: ${remaining} remaining`);
      button.title = remaining === 'READY' ? 'Rapid fire ready' : `Rapid fire cooldown: ${remaining} remaining`;
    }
  }

  syncProgress();
  new MutationObserver(syncProgress).observe(progressBar, { attributes: true, attributeFilter: ['style'] });
  if (cooldownText) {
    new MutationObserver(syncProgress).observe(cooldownText, { childList: true, characterData: true, subtree: true });
  }
})();
