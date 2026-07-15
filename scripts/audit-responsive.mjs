import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profileDirectory = mkdtempSync('/tmp/vizancia-responsive-audit-');
const debuggingPort = 9224;
const baseUrl = process.env.VIZANCIA_PREVIEW_URL || 'http://127.0.0.1:4173';
const ignored = new Set(['.git', 'node_modules']);
const pagePaths = [];
const viewports = [
  { name: 'small-phone', width: 360, height: 800, mobile: true },
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
];

async function findPages(directory = root) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await findPages(fullPath);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    const relative = path.relative(root, fullPath).split(path.sep).join('/');
    if (relative === 'index.html') pagePaths.push('/');
    else if (relative.endsWith('/index.html')) pagePaths.push('/' + relative.slice(0, -10));
    else pagePaths.push('/' + relative);
  }
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForChrome() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:' + debuggingPort + '/json/version');
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('Chrome DevTools did not become available.');
}

async function createPageClient() {
  const response = await fetch('http://127.0.0.1:' + debuggingPort + '/json/new?about:blank', { method: 'PUT' });
  const target = await response.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let requestId = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  return {
    target,
    socket,
    send(method, params = {}) {
      requestId += 1;
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        socket.send(JSON.stringify({ id: requestId, method, params }));
      });
    },
  };
}

function auditPage() {
  const root = document.documentElement;
  const viewportWidth = root.clientWidth;
  const visible = element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const identify = element => {
    if (element.id) return '#' + element.id;
    const classes = [...element.classList].slice(0, 2).join('.');
    const source = element.tagName === 'IMG' ? '[src="' + element.getAttribute('src') + '"]' : '';
    return element.tagName.toLowerCase() + (classes ? '.' + classes : '') + source;
  };
  const brokenImages = [...document.images]
    .filter(image => image.complete && image.naturalWidth === 0)
    .map(identify);
  const distortedImages = [...document.images]
    .filter(visible)
    .filter(image => {
      if (!image.naturalWidth || !image.naturalHeight) return false;
      const style = getComputedStyle(image);
      if (style.objectFit === 'cover' || style.objectFit === 'contain') return false;
      const rect = image.getBoundingClientRect();
      const horizontalExtras = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
      const verticalExtras = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      const renderedWidth = rect.width - horizontalExtras;
      const renderedHeight = rect.height - verticalExtras;
      const naturalRatio = image.naturalWidth / image.naturalHeight;
      const renderedRatio = renderedWidth / renderedHeight;
      return Math.abs(renderedRatio / naturalRatio - 1) > 0.08;
    })
    .map(identify);
  const primaryControls = [...document.querySelectorAll(
    'button, [role="button"], a[class*="button"], a[class*="btn"], a[class*="cta"], a[class*="badge"]'
  )]
    .filter(visible)
    .filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width < 24 || rect.height < 24;
    })
    .map(identify);
  const zoomRiskFields = viewportWidth <= 768
    ? [...document.querySelectorAll('input, select, textarea')]
        .filter(visible)
        .filter(element => parseFloat(getComputedStyle(element).fontSize) < 16)
        .map(identify)
    : [];
  return {
    title: document.title,
    hasViewportMeta: Boolean(document.querySelector('meta[name="viewport"]')),
    clientWidth: viewportWidth,
    scrollWidth: root.scrollWidth,
    bodyScrollWidth: document.body?.scrollWidth || 0,
    brokenImages,
    distortedImages,
    primaryControls,
    zoomRiskFields,
  };
}

await findPages();
pagePaths.sort();

const chromeProcess = spawn(chrome, [
  '--headless=new',
  '--hide-scrollbars',
  '--no-first-run',
  '--remote-debugging-port=' + debuggingPort,
  '--user-data-dir=' + profileDirectory,
  'about:blank',
], { stdio: 'ignore' });

const errors = [];
const warnings = [];

try {
  await waitForChrome();
  const client = await createPageClient();
  await client.send('Page.enable');

  for (const viewport of viewports) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });
    await client.send('Emulation.setTouchEmulationEnabled', {
      enabled: viewport.mobile,
      maxTouchPoints: viewport.mobile ? 5 : 1,
    });

    for (const pagePath of pagePaths) {
      await client.send('Page.navigate', { url: baseUrl + pagePath });
      await sleep(180);
      await client.send('Runtime.evaluate', {
        expression: 'document.fonts?.ready',
        awaitPromise: true,
      });
      await client.send('Runtime.evaluate', {
        expression: "document.querySelector('.privacy-consent__button--secondary')?.click()",
      });

      const audit = await client.send('Runtime.evaluate', {
        expression: '(' + auditPage.toString() + ')()',
        returnByValue: true,
      });

      const result = audit.result.value;
      const label = pagePath + ' @ ' + viewport.name + ' (' + viewport.width + 'px)';
      if (!result.title) errors.push(label + ': document failed to render');
      if (!result.hasViewportMeta) errors.push(label + ': missing viewport metadata');
      if (result.scrollWidth > result.clientWidth + 1 || result.bodyScrollWidth > result.clientWidth + 1) {
        errors.push(label + ': horizontal overflow (' + Math.max(result.scrollWidth, result.bodyScrollWidth) + 'px in ' + result.clientWidth + 'px)');
      }
      if (result.brokenImages.length) errors.push(label + ': broken images ' + result.brokenImages.join(', '));
      if (result.distortedImages.length) errors.push(label + ': distorted images ' + result.distortedImages.join(', '));
      if (result.primaryControls.length) warnings.push(label + ': primary controls below 24px ' + result.primaryControls.join(', '));
      if (result.zoomRiskFields.length) warnings.push(label + ': form fields below 16px ' + result.zoomRiskFields.join(', '));
    }
    console.log('Checked ' + pagePaths.length + ' pages at ' + viewport.width + 'px.');
  }

  client.socket.close();
  await fetch('http://127.0.0.1:' + debuggingPort + '/json/close/' + client.target.id);
} finally {
  chromeProcess.kill('SIGTERM');
}

console.log('Responsive audit covered ' + pagePaths.length + ' pages across ' + viewports.length + ' viewport sizes.');
for (const warning of warnings) console.warn('WARN ' + warning);
for (const error of errors) console.error('ERROR ' + error);
console.log(errors.length + ' error(s), ' + warnings.length + ' warning(s).');
if (errors.length) process.exitCode = 1;
