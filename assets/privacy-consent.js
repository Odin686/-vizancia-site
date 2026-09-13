(function () {
  'use strict';
  // Advertising measurement was removed for the classroom-focused website.
  // Never load Google tags, queue events, or reuse a historical acceptance.
  try { window.localStorage.removeItem('vizancia_google_ads_consent'); } catch (error) {
    // Storage may be blocked. No saved choice can enable measurement.
  }
  function renderPrivacyLink() {
    if (document.getElementById('privacy-choices-button')) return;
    var link = document.createElement('a');
    link.id = 'privacy-choices-button';
    link.className = 'privacy-choices-button';
    link.href = '/privacy.html#website-measurement';
    link.textContent = 'Website privacy';
    document.body.appendChild(link);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPrivacyLink, { once: true });
  } else {
    renderPrivacyLink();
  }
}());
