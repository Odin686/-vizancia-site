/*
 * Vizancia website measurement consent, v5.
 * Google Consent Mode v2, strict opt-in. Plain ES5, no dependencies, no innerHTML.
 *
 * Tag IDs
 *   GA4 property "Vizancia" 545697150, stream "Vizancia Website": G-Z5P9FY92DE
 *   Google Ads 113-359-6517, Google tag: AW-18320211414 (served by the same gtag.js load)
 *   GA4 events to verify as key events/import into Google Ads: app_store_click, play_store_click
 *
 * Rules enforced by this file (scripts/privacy.test.mjs checks them in CI)
 *   1. The first dataLayer entry is a consent default that denies ad_storage, ad_user_data,
 *      ad_personalization, analytics_storage, functionality_storage and personalization_storage
 *      (security_storage granted, wait_for_update 500).
 *   2. Global Privacy Control (navigator.globalPrivacyControl === true) is a refusal: no Google
 *      script is loaded, no notice is shown, the stored choice is neither read nor written, no
 *      event is sent, and a saved acceptance is never honoured. Only the plain "Website privacy"
 *      link renders.
 *   3. The legacy key vizancia_google_ads_consent is removed and never reused.
 *   4. The visitor's choice lives in localStorage under vizancia_consent_v2 as
 *      {accepted: boolean, savedAt: number}, valid for 180 days. Blocked storage behaves like "no choice yet".
 *   5. STRICT MODE: gtag.js is not loaded and no event is pushed until measurement is on.
 *      Measurement is on only when not GPC and (a saved accepted:true exists, or the visitor
 *      clicks "Accept measurement" on this page).
 *   6. enableMeasurement pushes consent update (ad_storage, ad_user_data, analytics_storage
 *      granted; ad_personalization stays denied), injects gtag.js once, then pushes
 *      gtag('js'), config G-Z5P9FY92DE (allow_ad_personalization_signals:false,
 *      allow_google_signals:false, cookie_expires 33696000, cookie_update:false) and config
 *      AW-18320211414 (allow_ad_personalization_signals:false).
 *   7. disableMeasurement pushes consent update with all four keys denied and expires the
 *      first-party Google cookies (_ga, _gid, _gat, _gcl_au, _gcl_aw, _gcl_gs, _ga_*) for the
 *      current hostname and the apex domain, path=/. No other cookie is touched. GA4 is disabled
 *      immediately, then a tagged page reloads to unload Google's running scripts.
 *   8. One capturing click listener on document records app_store_click (apps.apple.com) and
 *      play_store_click (play.google.com) with link_url, placement and transport_type 'beacon',
 *      and only while measurement is on.
 *   9. The notice (#privacy-notice) renders on DOMContentLoaded only when not GPC and no
 *      stored choice exists. It never takes focus: no autofocus, no focus() calls, no dialog role.
 *  10. The "Website privacy" link (#privacy-choices-button) is appended once. When not GPC it
 *      reopens the notice without duplicating it; under GPC it is a plain link to the policy.
 *  11. Only the UI rendering waits for DOMContentLoaded. Consent defaults, legacy-key removal,
 *      stored-choice application and the click listener run synchronously in <head>.
 *  12. Personalised advertising, remarketing audiences and Google Signals are never enabled.
 */
(function () {
  'use strict';

  var GA4_ID = 'G-Z5P9FY92DE';
  var ADS_ID = 'AW-18320211414';
  var GTAG_SRC = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
  var STORAGE_KEY = 'vizancia_consent_v2';
  var CHOICE_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  var LEGACY_KEY = 'vizancia_google_ads_consent';
  var POLICY_HREF = '/privacy.html#website-measurement';
  var GOOGLE_COOKIES = ['_ga', '_gid', '_gat', '_gcl_au', '_gcl_aw', '_gcl_gs'];
  var NOTICE_TEXT = 'We use Google Analytics and Google Ads conversion measurement to see how ' +
    'people find this site and whether they continue to the App Store or Google Play. ' +
    'Google measurement stays off unless you accept. We save either choice in this browser for 180 days. ' +
    'No personalised advertising. ';

  // 1. dataLayer, gtag stub and the consent default come before anything else.
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () { window.dataLayer.push(arguments); };
  }
  function gtag() { window.gtag.apply(window, arguments); }

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });

  // 2. Global Privacy Control is a refusal that overrides everything, including a saved acceptance.
  var gpc = typeof navigator !== 'undefined' && navigator !== null && navigator.globalPrivacyControl === true;

  // 3. The pre-September-13 preference is removed and never reused.
  try { window.localStorage.removeItem(LEGACY_KEY); } catch (error) { /* storage blocked */ }

  var measurementOn = false;
  var tagInjected = false;
  var publicOrigin = /^(?:www\.)?vizancia\.com$/i.test(window.location.hostname);
  window['ga-disable-' + GA4_ID] = true;

  // 4. Stored choice helpers. Blocked storage behaves like "no choice yet".
  function readChoice() {
    if (gpc) return null;
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.accepted !== 'boolean') return null;
      if (typeof parsed.savedAt !== 'number' || !isFinite(parsed.savedAt) ||
          parsed.savedAt > Date.now() || Date.now() - parsed.savedAt >= CHOICE_MAX_AGE) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function saveChoice(accepted) {
    if (gpc) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: accepted === true, savedAt: Date.now() }));
    } catch (error) {
      // A failed refusal write must not leave an old saved acceptance behind.
      if (!accepted) {
        try { window.localStorage.removeItem(STORAGE_KEY); } catch (ignored) { /* storage blocked */ }
      }
    }
  }

  // 6. Turn measurement on: consent update, then one gtag.js load and both config calls.
  function enableMeasurement() {
    if (gpc || !publicOrigin) return;
    window['ga-disable-' + GA4_ID] = false;
    measurementOn = true;
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });
    if (tagInjected) return;
    tagInjected = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = GTAG_SRC;
    var head = document.head || (document.getElementsByTagName && document.getElementsByTagName('head')[0]) || document.documentElement;
    head.appendChild(script);
    gtag('js', new Date());
    gtag('config', GA4_ID, {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      cookie_expires: 33696000,
      cookie_update: false
    });
    gtag('config', ADS_ID, { allow_ad_personalization_signals: false });
  }

  // 7. Turn measurement off and expire the first-party Google cookies this site can control.
  function disableMeasurement() {
    measurementOn = false;
    window['ga-disable-' + GA4_ID] = true;
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
    clearGoogleCookies();
    // A denied Consent Mode update alone can still permit cookieless pings.
    // Reload only after a tag was injected so the next document contains no Google code.
    if (tagInjected) window.location.reload();
  }

  function trim(value) { return String(value).replace(/^\s+|\s+$/g, ''); }

  function clearGoogleCookies() {
    var names = GOOGLE_COOKIES.slice();
    var raw = '';
    try { raw = document.cookie || ''; } catch (error) { raw = ''; }
    var parts = raw.split(';');
    for (var i = 0; i < parts.length; i++) {
      var name = trim(parts[i].split('=')[0]);
      if (/^_(?:ga|gat|gcl)_/.test(name) && names.indexOf(name) === -1) names.push(name);
    }
    var host = '';
    try { host = (window.location && window.location.hostname) || ''; } catch (error) { host = ''; }
    var domains = [''];
    if (host && !/^\d+(?:\.\d+){3}$/.test(host) && host !== 'localhost') {
      domains.push(host);
      var labels = host.split('.');
      if (labels.length > 2) domains.push(labels.slice(-2).join('.'));
    }
    var expiry = '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    for (var n = 0; n < names.length; n++) {
      for (var d = 0; d < domains.length; d++) {
        try {
          document.cookie = names[n] + '=' + expiry + (domains[d] ? '; domain=' + domains[d] : '');
        } catch (error) { /* cookie access blocked */ }
      }
    }
  }

  // 8. Store-click measurement. Nothing happens until measurement is on.
  function tagName(node) {
    return node && node.tagName ? String(node.tagName).toLowerCase() : '';
  }

  function closestAnchor(node) {
    while (node && node.nodeType !== 9) {
      if (tagName(node) === 'a' && node.getAttribute && node.getAttribute('href')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function placementFor(anchor) {
    var explicit = anchor.getAttribute('data-placement');
    if (explicit) return explicit;
    var node = anchor.parentNode;
    while (node && node.nodeType !== 9) {
      var tag = tagName(node);
      if ((tag === 'section' || tag === 'header' || tag === 'footer' || tag === 'nav' || tag === 'main') && node.id) return node.id;
      node = node.parentNode;
    }
    return 'unknown';
  }

  function storeEventFor(href) {
    if (/^https?:\/\/(?:[^\/?#]*\.)?apps\.apple\.com(?:[\/?#]|$)/i.test(href)) return 'app_store_click';
    if (/^https?:\/\/(?:[^\/?#]*\.)?play\.google\.com(?:[\/?#]|$)/i.test(href)) return 'play_store_click';
    return null;
  }

  document.addEventListener('click', function (event) {
    if (!measurementOn) return;
    var anchor = closestAnchor(event.target);
    if (!anchor) return;
    var href = anchor.href || anchor.getAttribute('href') || '';
    var eventName = storeEventFor(href);
    if (!eventName) return;
    gtag('event', eventName, {
      link_url: href,
      placement: placementFor(anchor),
      transport_type: 'beacon'
    });
  }, true);

  // 9. Notice UI. Built with createElement only; never takes focus.
  function removeNotice() {
    var notice = document.getElementById('privacy-notice');
    if (notice && notice.parentNode) notice.parentNode.removeChild(notice);
  }

  function makeButton(className, label, onClick) {
    var button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function renderNotice() {
    if (gpc || !publicOrigin) return;
    if (document.getElementById('privacy-notice')) return;
    if (!document.body) return;

    var notice = document.createElement('div');
    notice.id = 'privacy-notice';
    notice.className = 'privacy-notice';
    notice.setAttribute('role', 'region');
    notice.setAttribute('aria-label', 'Website measurement choice');

    var text = document.createElement('p');
    text.className = 'privacy-notice-text';
    text.appendChild(document.createTextNode(NOTICE_TEXT));
    var how = document.createElement('a');
    how.href = POLICY_HREF;
    how.textContent = 'How this works';
    text.appendChild(how);
    text.appendChild(document.createTextNode('.'));

    var actions = document.createElement('div');
    actions.className = 'privacy-notice-actions';
    actions.appendChild(makeButton('privacy-notice-accept', 'Accept measurement', function () {
      saveChoice(true);
      enableMeasurement();
      removeNotice();
    }));
    actions.appendChild(makeButton('privacy-notice-decline', 'Essential only', function () {
      saveChoice(false);
      disableMeasurement();
      removeNotice();
    }));

    notice.appendChild(text);
    notice.appendChild(actions);
    document.body.appendChild(notice);
  }

  // 10. Persistent "Website privacy" link, appended once.
  function renderPrivacyLink() {
    if (document.getElementById('privacy-choices-button')) return;
    if (!document.body) return;
    var link = document.createElement('a');
    link.id = 'privacy-choices-button';
    link.className = 'privacy-choices-button';
    link.href = POLICY_HREF;
    link.textContent = 'Website privacy';
    if (!gpc && publicOrigin) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        renderNotice();
      });
    }
    document.body.appendChild(link);
  }

  function renderUi() {
    renderPrivacyLink();
    if (!gpc && !readChoice()) renderNotice();
  }

  // 5 and 11. Apply a saved acceptance synchronously; defer only the UI.
  var choice = readChoice();
  if (choice && choice.accepted === true) enableMeasurement();
  else clearGoogleCookies();

  // A refusal in another tab, or a restored page, must stop a previously loaded tag too.
  function refreshChoice() {
    gpc = navigator.globalPrivacyControl === true;
    var current = readChoice();
    if (measurementOn && (gpc || !current || !current.accepted)) disableMeasurement();
  }
  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY || event.key === null) refreshChoice();
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) refreshChoice();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderUi, { once: true });
  } else {
    renderUi();
  }
}());
