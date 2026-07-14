(function () {
  'use strict';

  var GOOGLE_ADS_ID = 'AW-18320211414';
  var STORAGE_KEY = 'vizancia_google_ads_consent';
  var CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  var googleTagLoaded = false;

  // Add the conversion destinations supplied by Google Ads after the two
  // website conversion actions are created. Expected format:
  // AW-18320211414/AbCdEfGhIjKlMnOp
  var CONVERSION_DESTINATIONS = {
    app_store: '',
    google_play: ''
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
  window.gtag('set', 'ads_data_redaction', true);

  function readChoice() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (!saved || !saved.choice || !saved.savedAt) return null;
      if (Date.now() - saved.savedAt > CONSENT_MAX_AGE) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return saved.choice;
    } catch (error) {
      return null;
    }
  }

  function saveChoice(choice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        choice: choice,
        savedAt: Date.now()
      }));
    } catch (error) {
      // If storage is unavailable, the visitor will be asked again next time.
    }
  }

  function applyGlobalPrivacyControl() {
    if (navigator.globalPrivacyControl !== true || readChoice()) return;
    saveChoice('rejected');
    updateConsent(false);
  }

  function updateConsent(accepted) {
    window.gtag('consent', 'update', {
      ad_storage: accepted ? 'granted' : 'denied',
      ad_user_data: accepted ? 'granted' : 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
  }

  function loadGoogleTag() {
    if (googleTagLoaded) return;
    googleTagLoaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_ADS_ID;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_ADS_ID);
  }

  function setBannerVisible(visible) {
    var banner = document.getElementById('privacy-consent-banner');
    var choicesButton = document.getElementById('privacy-choices-button');
    if (!banner || !choicesButton) return;
    banner.hidden = !visible;
    choicesButton.hidden = visible;
    if (visible) {
      var firstButton = banner.querySelector('button');
      if (firstButton) firstButton.focus();
    } else {
      choicesButton.focus();
    }
  }

  function makeButton(label, className, handler) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  function renderControls() {
    var banner = document.createElement('aside');
    banner.id = 'privacy-consent-banner';
    banner.className = 'privacy-consent';
    banner.setAttribute('aria-labelledby', 'privacy-consent-title');
    banner.hidden = true;

    var content = document.createElement('div');
    content.className = 'privacy-consent__content';
    content.innerHTML =
      '<div class="privacy-consent__copy">' +
        '<strong id="privacy-consent-title">Your privacy choices</strong>' +
        '<p>With your permission, Vizancia uses Google Ads measurement to understand whether our ads lead to website visits and app-store clicks. The mobile app itself has no advertising or analytics SDKs. You can accept or reject this optional website measurement.</p>' +
        '<a href="/privacy.html#website-measurement">Read our privacy policy</a>' +
        '<span aria-hidden="true"> · </span>' +
        '<a href="https://business.safety.google/privacy/" target="_blank" rel="noopener noreferrer">How Google uses business data</a>' +
      '</div>';

    var actions = document.createElement('div');
    actions.className = 'privacy-consent__actions';
    actions.appendChild(makeButton('Reject', 'privacy-consent__button privacy-consent__button--secondary', function () {
      saveChoice('rejected');
      updateConsent(false);
      setBannerVisible(false);
    }));
    actions.appendChild(makeButton('Accept measurement', 'privacy-consent__button privacy-consent__button--primary', function () {
      saveChoice('accepted');
      updateConsent(true);
      loadGoogleTag();
      setBannerVisible(false);
    }));
    content.appendChild(actions);
    banner.appendChild(content);

    var choicesButton = makeButton('Privacy choices', 'privacy-choices-button', function () {
      setBannerVisible(true);
    });
    choicesButton.id = 'privacy-choices-button';
    choicesButton.hidden = true;

    document.body.appendChild(banner);
    document.body.appendChild(choicesButton);

    document.querySelectorAll('a[href*="apps.apple.com"], a[href*="play.google.com"]').forEach(function (link) {
      link.addEventListener('click', function () {
        var store = link.href.indexOf('play.google.com') !== -1 ? 'google_play' : 'app_store';
        var eventParameters = {
          store: store,
          landing_page: window.location.pathname,
          link_url: link.href,
          transport_type: 'beacon'
        };

        window.gtag('event', 'store_click', {
          store: eventParameters.store,
          landing_page: eventParameters.landing_page,
          link_url: eventParameters.link_url,
          transport_type: eventParameters.transport_type
        });

        if (CONVERSION_DESTINATIONS[store]) {
          window.gtag('event', 'conversion', {
            send_to: CONVERSION_DESTINATIONS[store],
            event_category: 'app_acquisition',
            event_label: store,
            transport_type: 'beacon'
          });
        }
      });
    });

    var choice = readChoice();
    if (choice === 'accepted') {
      updateConsent(true);
      loadGoogleTag();
      choicesButton.hidden = false;
    } else if (choice === 'rejected') {
      updateConsent(false);
      choicesButton.hidden = false;
    } else {
      setBannerVisible(true);
    }
  }

  var existingChoice = readChoice();
  if (existingChoice === 'accepted') {
    updateConsent(true);
    loadGoogleTag();
  }

  applyGlobalPrivacyControl();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderControls);
  } else {
    renderControls();
  }
}());
