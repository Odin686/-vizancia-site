import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDirectory = '/tmp/vizancia-site-qa';
const profileDirectory = mkdtempSync('/tmp/vizancia-site-qa-profile-');
const debuggingPort = 9223;
const baseUrl = process.env.VIZANCIA_PREVIEW_URL || 'http://127.0.0.1:4173';
const previewOrigin = new URL(baseUrl).origin;
const corePages = [
  { name: 'home', path: '/' },
  { name: 'parents', path: '/parents/' },
  { name: 'homeschool', path: '/homeschool/' },
];
const coreViewports = [
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'compact-desktop', width: 1024, height: 900, mobile: false },
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
];
const previews = [
  ...corePages.flatMap(page => coreViewports.flatMap(viewport => [
    { ...viewport, name: `${page.name}-${viewport.name}-consent`, path: page.path },
    { ...viewport, name: `${page.name}-${viewport.name}`, path: page.path, rejectConsent: true },
  ])),
  { name: 'home-mobile-menu', path: '/', width: 390, height: 844, mobile: true, click: '#proMenu' },
  { name: 'parents-mobile-menu', path: '/parents/', width: 390, height: 844, mobile: true, click: '#parentMenu' },
  { name: 'resources-mobile', path: '/resources/', width: 390, height: 844, mobile: true },
  { name: 'resources-mobile-menu', path: '/resources/', width: 390, height: 844, mobile: true, click: '#menuToggle' },
  { name: 'sandbox-desktop', path: '/sandbox.html', width: 1440, height: 1000, mobile: false },
  { name: 'support-desktop', path: '/support.html', width: 1440, height: 1000, mobile: false },
];

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForChrome() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('Chrome DevTools did not become available.');
}

async function createPageClient() {
  const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/new?about:blank`, { method: 'PUT' });
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

mkdirSync(outputDirectory, { recursive: true });
const chromeProcess = spawn(chrome, [
  '--headless=new',
  '--hide-scrollbars',
  '--no-first-run',
  `--remote-debugging-port=${debuggingPort}`,
  `--user-data-dir=${profileDirectory}`,
  'about:blank',
], { stdio: 'ignore' });

try {
  await waitForChrome();
  for (const preview of previews) {
    const { name, path, width, height, mobile, rejectConsent, click } = preview;
    const client = await createPageClient();
    await client.send('Page.enable');
    await client.send('Storage.clearDataForOrigin', {
      origin: previewOrigin,
      storageTypes: 'local_storage',
    });
    await client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
      screenWidth: width,
      screenHeight: height,
    });
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
    await client.send('Page.navigate', { url: `${baseUrl}${path}` });
    await sleep(1600);
    if (rejectConsent) {
      await client.send('Runtime.evaluate', {
        expression: "document.querySelector('.privacy-consent__button--secondary')?.click()",
      });
      await sleep(250);
    }
    if (click) {
      await client.send('Runtime.evaluate', {
        expression: `document.querySelector(${JSON.stringify(click)})?.click()`,
      });
      await sleep(250);
    }
    const layout = await client.send('Runtime.evaluate', {
      expression: `({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth})`,
      returnByValue: true,
    });
    const { clientWidth, scrollWidth } = layout.result.value;
    if (scrollWidth > clientWidth + 1) {
      throw new Error(`${name} has horizontal overflow: ${scrollWidth}px content in a ${clientWidth}px viewport.`);
    }
    const screenshot = await client.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const output = join(outputDirectory, `${name}.png`);
    writeFileSync(output, Buffer.from(screenshot.data, 'base64'));
    client.socket.close();
    await fetch(`http://127.0.0.1:${debuggingPort}/json/close/${client.target.id}`);
    console.log(`${output} (${clientWidth}px viewport, no horizontal overflow)`);
  }
} finally {
  chromeProcess.kill('SIGTERM');
}
