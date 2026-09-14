// Privacy and measurement guarantees for assets/privacy-consent.js (v5, Consent Mode v2, opt-in).
// node:test + node:vm only. A small fake DOM drives the script exactly as a browser would.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const code = await readFile('assets/privacy-consent.js', 'utf8');
const codeWithoutComments = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js?id=G-Z5P9FY92DE';
const APPLE = 'https://apps.apple.com/ca/app/vizancia/id6759349861?ct=home_hero';
const PLAY = 'https://play.google.com/store/apps/details?id=com.vizancia.app&referrer=utm_source%3Dvizancia.com%26utm_campaign%3Dhome_hero';

// ---------- fake DOM ----------
class FakeNode {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.nodeType = 1;
    this.childNodes = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
    this.id = '';
    this.className = '';
    this.textContent = '';
  }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === 'id') this.id = String(value); }
  getAttribute(name) {
    if (name === 'id') return this.id || null;
    if (name === 'href') return this.href ?? this.attributes.href ?? null;
    return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
  }
  appendChild(node) {
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) { this.childNodes.splice(index, 1); node.parentNode = null; }
    return node;
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
}

function find(node, predicate, results = []) {
  if (!node || node.nodeType !== 1) return results;
  if (predicate(node)) results.push(node);
  for (const child of node.childNodes) find(child, predicate, results);
  return results;
}

function textOf(node) {
  if (node.nodeType === 3) return node.textContent;
  if (!node.childNodes.length) return node.textContent;
  return node.childNodes.map(textOf).join('');
}

function makeDocument({ readyState = 'complete', cookie = '' } = {}) {
  const doc = { nodeType: 9, readyState, listeners: {}, cookieWrites: [], cookieValue: cookie };
  doc.documentElement = new FakeNode('html');
  doc.documentElement.parentNode = doc;
  doc.head = doc.documentElement.appendChild(new FakeNode('head'));
  doc.body = doc.documentElement.appendChild(new FakeNode('body'));
  doc.createElement = (tag) => new FakeNode(tag);
  doc.createTextNode = (text) => ({ nodeType: 3, textContent: String(text), parentNode: null });
  doc.getElementById = (id) => find(doc.documentElement, (n) => n.id === id)[0];
  doc.getElementsByTagName = (tag) => find(doc.documentElement, (n) => n.tagName === tag.toUpperCase());
  doc.addEventListener = (type, fn) => { (doc.listeners[type] ||= []).push(fn); };
  Object.defineProperty(doc, 'cookie', {
    get() { return doc.cookieValue; },
    set(value) { doc.cookieWrites.push(String(value)); },
  });
  return doc;
}

function click(doc, target) {
  const event = { target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  for (const fn of doc.listeners.click || []) fn(event); // capturing document listener runs first
  for (let node = target; node && node.nodeType === 1; node = node.parentNode) {
    for (const fn of node.listeners.click || []) fn(event);
  }
  return event;
}

function boot({ gpc = false, saved = null, savedAt = Date.now(), blocked = false, readyState = 'complete', cookie = '', hostname = 'www.vizancia.com', document: existing } = {}) {
  const storage = new Map([['vizancia_google_ads_consent', JSON.stringify({ choice: 'accepted', savedAt: 1 })]]);
  if (saved !== null) storage.set('vizancia_consent_v2', JSON.stringify({ accepted: saved, savedAt }));
  const guard = () => { if (blocked) throw new Error('storage blocked'); };
  const localStorage = {
    getItem(key) { guard(); return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { guard(); storage.set(key, String(value)); },
    removeItem(key) { guard(); storage.delete(key); },
  };
  const window = { localStorage, reloads: 0, listeners: {}, location: { hostname, reload() { window.reloads++; } } };
  window.addEventListener = (type, fn) => { (window.listeners[type] ||= []).push(fn); };
  const document = existing || makeDocument({ readyState, cookie });
  vm.runInNewContext(code, { window, document, navigator: { globalPrivacyControl: gpc } });
  const page = {
    window, document, storage,
    layer: () => window.dataLayer.map((entry) => Array.from(entry)),
    scripts: () => find(document.head, (n) => n.tagName === 'SCRIPT'),
    notice: () => document.getElementById('privacy-notice'),
    link: () => document.getElementById('privacy-choices-button'),
    notices: () => find(document.body, (n) => n.id === 'privacy-notice'),
    links: () => find(document.body, (n) => n.id === 'privacy-choices-button'),
    button: (cls) => find(document.body, (n) => n.className === cls)[0],
    events: () => page.layer().filter((entry) => entry[0] === 'event'),
    stored: () => (storage.has('vizancia_consent_v2') ? JSON.parse(storage.get('vizancia_consent_v2')) : null),
    addLink(href, { placement, containerId, containerTag = 'section' } = {}) {
      const container = document.createElement(containerTag);
      if (containerId) container.id = containerId;
      const anchor = document.createElement('a');
      anchor.href = href;
      if (placement) anchor.setAttribute('data-placement', placement);
      const image = anchor.appendChild(document.createElement('img'));
      container.appendChild(anchor);
      document.body.appendChild(container);
      return image; // clicking the image exercises the closest-anchor walk
    },
  };
  return page;
}

const DEFAULT_DENIED = JSON.stringify(['consent', 'default', {
  ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
  functionality_storage: 'denied', personalization_storage: 'denied', security_storage: 'granted', wait_for_update: 500,
}]);
const UPDATE_GRANTED = JSON.stringify(['consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied', analytics_storage: 'granted' }]);
const UPDATE_DENIED = JSON.stringify(['consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' }]);
const CONFIG_GA4 = JSON.stringify(['config', 'G-Z5P9FY92DE', { allow_ad_personalization_signals: false, allow_google_signals: false, cookie_expires: 33696000, cookie_update: false }]);
const CONFIG_ADS = JSON.stringify(['config', 'AW-18320211414', { allow_ad_personalization_signals: false }]);

function assertNothingLoaded(page, label) {
  assert.equal(page.scripts().length, 0, `${label}: no script may be added to head`);
  assert.equal(page.layer().filter((e) => e[0] === 'js' || e[0] === 'config' || e[0] === 'event').length, 0, `${label}: no js/config/event entries`);
}

// ---------- behaviour ----------
test('consent default is denied first; no stored choice shows the notice and loads nothing', () => {
  const page = boot();
  assert.equal(JSON.stringify(page.layer()[0]), DEFAULT_DENIED, 'first dataLayer entry must be the denied consent default');
  assert.equal(page.layer().length, 1, 'nothing else is pushed before a choice');
  assertNothingLoaded(page, 'fresh visit');
  const notice = page.notice();
  assert.ok(notice, 'notice renders');
  assert.equal(notice.getAttribute('role'), 'region');
  assert.equal(notice.getAttribute('aria-label'), 'Website measurement choice');
  assert.notEqual(notice.getAttribute('role'), 'dialog');
  assert.ok(textOf(notice).includes('Google measurement stays off unless you accept. We save either choice in this browser for 180 days. No personalised advertising. How this works.'));
  const how = find(notice, (n) => n.tagName === 'A')[0];
  assert.equal(how.href, '/privacy.html#website-measurement');
  assert.equal(page.button('privacy-notice-accept').textContent, 'Accept measurement');
  assert.equal(page.button('privacy-notice-decline').textContent, 'Essential only');
  assert.equal(page.button('privacy-notice-accept').getAttribute('type'), 'button');
  assert.equal(page.button('privacy-notice-decline').getAttribute('type'), 'button');
  const link = page.link();
  assert.ok(link, 'privacy link renders');
  assert.equal(link.href, '/privacy.html#website-measurement');
  assert.equal(link.textContent, 'Website privacy');
  assert.equal(page.storage.has('vizancia_google_ads_consent'), false, 'legacy key removed');
  assert.equal(page.stored(), null, 'no choice stored until the visitor decides');
  assert.doesNotMatch(codeWithoutComments, /\.focus\s*\(|autofocus|dialog|innerHTML/, 'notice must not steal focus or use innerHTML');
});

test('Accept loads the tag once and only then records store clicks', () => {
  const page = boot();
  const apple = page.addLink(APPLE, { placement: 'home_hero' });
  const play = page.addLink(PLAY, { placement: 'home_download' });
  const other = page.addLink('https://example.com/elsewhere', { placement: 'nope' });
  click(page.document, apple);
  click(page.document, play);
  assert.equal(page.events().length, 0, 'store click before consent pushes nothing');
  assertNothingLoaded(page, 'before accept');

  click(page.document, page.button('privacy-notice-accept'));
  const scripts = page.scripts();
  assert.equal(scripts.length, 1, 'exactly one script');
  assert.equal(scripts[0].src, GTAG_SRC);
  assert.equal(scripts[0].async, true);
  const layer = page.layer();
  assert.equal(JSON.stringify(layer[0]), DEFAULT_DENIED);
  assert.equal(JSON.stringify(layer[1]), UPDATE_GRANTED, 'ad_personalization stays denied');
  assert.equal(layer[2][0], 'js');
  assert.equal(typeof layer[2][1].getTime, 'function');
  assert.equal(JSON.stringify(layer[3]), CONFIG_GA4);
  assert.equal(JSON.stringify(layer[4]), CONFIG_ADS);
  assert.equal(layer.length, 5);
  assert.equal(page.notice(), undefined, 'notice closes');
  assert.equal(page.stored().accepted, true);
  assert.equal(typeof page.stored().savedAt, 'number');

  click(page.document, apple);
  click(page.document, play);
  click(page.document, other);
  const events = page.events();
  assert.equal(events.length, 2, 'non-store link pushes nothing');
  assert.equal(JSON.stringify(events[0]), JSON.stringify(['event', 'app_store_click', { link_url: APPLE, placement: 'home_hero', transport_type: 'beacon' }]));
  assert.equal(JSON.stringify(events[1]), JSON.stringify(['event', 'play_store_click', { link_url: PLAY, placement: 'home_download', transport_type: 'beacon' }]));
  assert.equal(page.scripts().length, 1, 'tag is never injected twice');
});

test('placement falls back to the closest landmark id, then unknown', () => {
  const page = boot({ saved: true });
  const inSection = page.addLink(APPLE, { containerId: 'download' });
  const inFooter = page.addLink(PLAY, { containerId: 'site-footer', containerTag: 'footer' });
  const bare = page.addLink(APPLE, { containerTag: 'div' });
  click(page.document, inSection);
  click(page.document, inFooter);
  click(page.document, bare);
  assert.equal(page.events().map((e) => e[2].placement).join(','), 'download,site-footer,unknown');
});

test('Essential only stores a refusal, loads nothing and keeps store clicks silent', () => {
  const page = boot();
  const apple = page.addLink(APPLE, { placement: 'home_hero' });
  click(page.document, page.button('privacy-notice-decline'));
  assert.equal(page.stored().accepted, false);
  assert.equal(page.notice(), undefined, 'notice closes');
  assertNothingLoaded(page, 'after decline');
  assert.equal(JSON.stringify(page.layer()[1]), UPDATE_DENIED);
  click(page.document, apple);
  assert.equal(page.events().length, 0);
});

test('a saved acceptance loads the tag without a notice; a saved refusal loads nothing', () => {
  const accepted = boot({ saved: true });
  assert.equal(accepted.notice(), undefined);
  assert.ok(accepted.link());
  assert.equal(accepted.scripts().length, 1);
  assert.equal(accepted.scripts()[0].src, GTAG_SRC);
  assert.equal(JSON.stringify(accepted.layer()[1]), UPDATE_GRANTED);
  assert.equal(JSON.stringify(accepted.layer()[3]), CONFIG_GA4);
  assert.equal(JSON.stringify(accepted.layer()[4]), CONFIG_ADS);

  const refused = boot({ saved: false });
  assert.equal(refused.notice(), undefined);
  assert.ok(refused.link());
  assertNothingLoaded(refused, 'saved refusal');
  const apple = refused.addLink(APPLE, { placement: 'x' });
  click(refused.document, apple);
  assert.equal(refused.events().length, 0);
});

for (const saved of [null, true, false]) {
  test(`Global Privacy Control overrides everything (saved=${saved})`, () => {
    const page = boot({ gpc: true, saved });
    assertNothingLoaded(page, 'GPC');
    assert.equal(page.notice(), undefined, 'no notice under GPC');
    const link = page.link();
    assert.ok(link, 'privacy link still renders');
    assert.equal(link.href, '/privacy.html#website-measurement');
    assert.equal(page.layer().length, 1, 'consent stays at the denied default');
    assert.equal(JSON.stringify(page.layer()[0]), DEFAULT_DENIED);
    const event = click(page.document, link);
    assert.equal(event.defaultPrevented, false, 'link is a plain link under GPC');
    assert.equal(page.notice(), undefined, 'clicking the link does not open the notice');
    const apple = page.addLink(APPLE, { placement: 'x' });
    const play = page.addLink(PLAY, { placement: 'x' });
    click(page.document, apple);
    click(page.document, play);
    assert.equal(page.events().length, 0);
    assertNothingLoaded(page, 'GPC after clicks');
    assert.equal(page.stored() === null ? null : page.stored().accepted, saved, 'stored choice is neither written nor changed');
  });
}

test('blocked localStorage does not throw, shows the notice, and Accept still loads the tag', () => {
  const page = boot({ blocked: true });
  assert.ok(page.notice());
  assert.ok(page.link());
  assertNothingLoaded(page, 'blocked storage');
  click(page.document, page.button('privacy-notice-accept'));
  assert.equal(page.scripts().length, 1);
  assert.equal(page.scripts()[0].src, GTAG_SRC);
  assert.equal(page.notice(), undefined);
  const apple = page.addLink(APPLE, { placement: 'p' });
  click(page.document, apple);
  assert.equal(page.events().length, 1);
});

test('the privacy link reopens the notice and nothing is duplicated', () => {
  const page = boot();
  click(page.document, page.button('privacy-notice-decline'));
  assert.equal(page.notice(), undefined);
  const event = click(page.document, page.link());
  assert.equal(event.defaultPrevented, true);
  assert.equal(page.notices().length, 1, 'notice reopens');
  click(page.document, page.link());
  click(page.document, page.link());
  assert.equal(page.notices().length, 1, 'repeated clicks do not duplicate the notice');
  assert.equal(page.links().length, 1);
  boot({ document: page.document }); // repeated initialisation on the same document
  assert.equal(page.links().length, 1, 'repeated initialisation does not duplicate the link');
  assert.equal(page.notices().length, 1, 'repeated initialisation does not duplicate the notice');
});

test('withdrawing after acceptance denies consent and expires only Google cookies', () => {
  const page = boot({ saved: true, cookie: '_ga=GA1.1.1; _ga_ABC123=GS1.1; _gcl_au=1.1; session=keep; _gat=1', hostname: 'www.vizancia.com' });
  assert.equal(page.scripts().length, 1);
  click(page.document, page.link());
  assert.ok(page.notice(), 'notice reopens for a change of choice');
  click(page.document, page.button('privacy-notice-decline'));
  assert.equal(page.stored().accepted, false);
  assert.equal(JSON.stringify(page.layer().at(-1)), UPDATE_DENIED);
  assert.equal(page.window['ga-disable-G-Z5P9FY92DE'], true, 'GA4 is disabled before navigating');
  assert.equal(page.window.reloads, 1, 'withdrawal unloads the running tag');
  const writes = page.document.cookieWrites;
  const named = (name) => writes.filter((w) => w.startsWith(`${name}=`));
  for (const name of ['_ga', '_ga_ABC123', '_gid', '_gat', '_gcl_au', '_gcl_aw', '_gcl_gs']) {
    assert.ok(named(name).length >= 1, `${name} is expired`);
    for (const write of named(name)) {
      assert.match(write, /expires=Thu, 01 Jan 1970 00:00:00 GMT/);
      assert.match(write, /path=\//);
    }
    assert.ok(named(name).some((w) => w.includes('domain=www.vizancia.com')), `${name} expired for hostname`);
    assert.ok(named(name).some((w) => w.includes('domain=vizancia.com')), `${name} expired for apex`);
  }
  assert.equal(named('session').length, 0, 'unrelated cookies are untouched');
  assert.ok(writes.every((w) => /^(_ga|_ga_ABC123|_gid|_gat|_gcl_au|_gcl_aw|_gcl_gs)=/.test(w)), 'only Google cookies are written');
  const apple = page.addLink(APPLE, { placement: 'p' });
  click(page.document, apple);
  assert.equal(page.events().length, 0, 'store clicks stop after withdrawal');
});

test('expired, future or malformed consent cannot load measurement', () => {
  for (const savedAt of [1, Date.now() - 180 * 86400000, Date.now() + 86400000, 'yesterday', null]) {
    const page = boot({ saved: true, savedAt });
    assertNothingLoaded(page, `invalid timestamp ${savedAt}`);
    assert.ok(page.notice());
    assert.equal(page.window['ga-disable-G-Z5P9FY92DE'], true);
  }
});

test('a refusal in another tab or on a restored page unloads a previously accepted tag', () => {
  for (const type of ['storage', 'pageshow']) {
    const page = boot({ saved: true });
    assert.equal(page.window['ga-disable-G-Z5P9FY92DE'], false);
    page.storage.set('vizancia_consent_v2', JSON.stringify({ accepted: false, savedAt: Date.now() }));
    const event = type === 'storage' ? { key: 'vizancia_consent_v2' } : { persisted: true };
    page.window.listeners[type][0](event);
    assert.equal(page.window.reloads, 1);
    assert.equal(page.window['ga-disable-G-Z5P9FY92DE'], true);
    click(page.document, page.addLink(APPLE));
    assert.equal(page.events().length, 0);
  }
});

test('a failed refusal write removes any old saved acceptance', () => {
  const page = boot({ saved: true });
  page.window.localStorage.setItem = () => { throw new Error('quota'); };
  click(page.document, page.link());
  click(page.document, page.button('privacy-notice-decline'));
  assert.equal(page.stored(), null);
  assert.equal(page.window.reloads, 1);
});

test('refusal clears additional Google cookie variants without clearing unrelated storage', () => {
  const page = boot({ saved: false, cookie: '_gcl_ls=test; _gat_gtag_G_123=test; session=keep' });
  assert.ok(page.document.cookieWrites.some((s) => s.startsWith('_gcl_ls=')));
  assert.ok(page.document.cookieWrites.some((s) => s.startsWith('_gat_gtag_G_123=')));
  assert.ok(page.document.cookieWrites.every((s) => !s.startsWith('session=')));
  assert.equal(page.window.reloads, 0, 'a page without a loaded tag never reloads');
});

test('private previews and localhost never load production measurement', () => {
  for (const hostname of ['localhost', '127.0.0.1', 'preview.chatgpt.site', 'vizancia.com.example.org']) {
    const page = boot({ hostname, saved: true });
    assertNothingLoaded(page, hostname);
    assert.equal(page.window['ga-disable-G-Z5P9FY92DE'], true);
    assert.equal(click(page.document, page.link()).defaultPrevented, false);
  }
});

test('when the document is still loading, nothing renders until DOMContentLoaded', () => {
  const page = boot({ readyState: 'loading' });
  assert.equal(JSON.stringify(page.layer()[0]), DEFAULT_DENIED, 'consent default runs synchronously');
  assert.equal(page.storage.has('vizancia_google_ads_consent'), false, 'legacy key removed synchronously');
  assert.equal(page.document.listeners.click?.length, 1, 'click listener registered synchronously');
  assert.equal(page.notice(), undefined);
  assert.equal(page.link(), undefined);
  const handlers = page.document.listeners.DOMContentLoaded;
  assert.equal(handlers?.length, 1);
  handlers[0]();
  assert.ok(page.notice());
  assert.ok(page.link());
});

test('a saved acceptance while loading injects the tag synchronously in head', () => {
  const page = boot({ readyState: 'loading', saved: true });
  assert.equal(page.scripts().length, 1);
  assert.equal(page.link(), undefined, 'UI still waits');
  page.document.listeners.DOMContentLoaded[0]();
  assert.ok(page.link());
  assert.equal(page.notice(), undefined);
});

// ---------- source and page checks ----------
const SKIP_DIRS = ['.git', 'node_modules', 'dist', 'scripts', 'docs', '.openai'];
async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(target, files);
    else files.push(target);
  }
  return files;
}

test('public source has no third-party script tags and no tag code outside the consent script', async () => {
  for (const file of await walk('.')) {
    if (!/\.(html|js)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    assert.doesNotMatch(text, /<script[^>]+src=["'](?:https?:)?\/\//i, `${file}: third-party script tag`);
    if (path.normalize(file) === path.normalize('assets/privacy-consent.js')) continue;
    assert.doesNotMatch(text, /googletagmanager\.com|google-analytics\.com|gtag\s*\(|fbq\s*\(/, `${file}: measurement code outside the consent script`);
  }
});

test('every public page loads privacy-consent v5 synchronously', async () => {
  const exempt = ['404.html', 'legal.html', path.join('teachers', 'activity', 'index.html')];
  let checked = 0;
  for (const file of await walk('.')) {
    if (!file.endsWith('.html')) continue;
    const relative = path.relative('.', file);
    if (exempt.includes(relative)) continue;
    const text = await readFile(file, 'utf8');
    assert.match(text, /<script\s+src=["'][^"']*privacy-consent\.js\?v=5["']\s*><\/script>/, `${relative}: consent script v5 without defer/async`);
    assert.match(text, /privacy-consent\.css\?v=5["']/, `${relative}: consent stylesheet v5`);
    assert.doesNotMatch(text, /<script[^>]*privacy-consent\.js[^>]*\b(?:defer|async)\b/, `${relative}: consent script must not be deferred or async`);
    assert.equal((text.match(/<script[^>]*privacy-consent\.js/g) || []).length, 1, `${relative}: consent script tag appears once`);
    checked += 1;
  }
  assert.ok(checked >= 25, `expected to check the public pages, checked ${checked}`);
});

test('projection view contains no input form, storage API or live request', async () => {
  const text = await readFile('teachers/activity/index.html', 'utf8');
  assert.doesNotMatch(text, /<(?:input|textarea|form)\b|localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/);
  assert.ok(text.includes('fictional') || text.includes('Fictional'));
});
