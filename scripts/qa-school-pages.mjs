import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputDirectory =
  process.env.VIZANCIA_QA_OUTPUT || "/private/tmp/vizancia-school-qa";
const profileDirectory = mkdtempSync("/private/tmp/vizancia-school-browser-");
const debuggingPort = 9241;
const baseUrl = process.env.VIZANCIA_PREVIEW_URL || "http://127.0.0.1:4187";
const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForChrome() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${debuggingPort}/json/version`,
      );
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error("Chrome DevTools did not become available.");
}

async function createPageClient() {
  const response = await fetch(
    `http://127.0.0.1:${debuggingPort}/json/new?about:blank`,
    { method: "PUT" },
  );
  const target = await response.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let requestId = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
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
const chromeProcess = spawn(
  chrome,
  [
    "--headless=new",
    "--hide-scrollbars",
    "--no-first-run",
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${profileDirectory}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);
let client;
const report = [];
try {
  await waitForChrome();
  client = await createPageClient();
  await client.send("Page.enable");
  const e = async (expression) => {
    const r = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails)
      throw new Error(
        r.exceptionDetails.exception?.description || "Evaluation error",
      );
    return r.result.value;
  };
  const viewport = async (width, height) =>
    client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 800,
    });
  const go = async (path) => {
    await client.send("Page.navigate", { url: baseUrl + path });
    await sleep(650);
    await e("document.fonts.ready");
    await e(
      "document.querySelector('.privacy-consent__button--secondary')?.click()",
    );
    await sleep(180);
  };
  const capture = async (name, selector) => {
    if (selector)
      await e(
        `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})`,
      );
    else await e("scrollTo(0,0)");
    await sleep(650);
    assert.ok(
      await e("document.documentElement.scrollWidth <= innerWidth+1"),
      name + " overflow",
    );
    const shot = await client.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    writeFileSync(
      join(outputDirectory, name + ".png"),
      Buffer.from(shot.data, "base64"),
    );
  };
  await viewport(390, 844);
  await go("/schools/");
  assert.equal(
    await e("document.getElementById('sample-evidence').hidden"),
    true,
  );
  assert.equal(
    await e("document.getElementById('sample-feedback').hidden"),
    true,
  );
  await capture("schools-phone");
  await e("document.getElementById('sample-begin').click()");
  assert.equal(
    await e("document.getElementById('sample-evidence').hidden"),
    false,
  );
  assert.equal(
    await e("document.getElementById('sample-feedback').hidden"),
    true,
  );
  await e("document.querySelector('#sample-evidence details').open=true");
  await capture("schools-evidence-phone", "#sample-evidence");
  await e("document.getElementById('sample-compare').click()");
  assert.equal(
    await e("document.getElementById('sample-feedback').hidden"),
    false,
  );
  await e("document.getElementById('sample-reset').click()");
  assert.equal(
    await e("document.getElementById('sample-evidence').hidden"),
    true,
  );
  assert.equal(await e("document.activeElement.id"), "sample-begin");
  report.push({
    name: "Sample keeps evidence and feedback behind separate reasoning steps and resets correctly",
    passed: true,
  });
  await e("document.getElementById('proMenu').click()");
  assert.equal(
    await e("document.getElementById('proMenu').getAttribute('aria-expanded')"),
    "true",
  );
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  assert.equal(
    await e("document.getElementById('proMenu').getAttribute('aria-expanded')"),
    "false",
  );
  assert.equal(await e("document.activeElement.id"), "proMenu");
  await go("/passport.html");
  await capture("passport-phone");
  const before = await e("JSON.stringify({...localStorage})");
  const options = await e(
    "[...document.querySelectorAll('[data-decision]')].map(b=>b.dataset.decision)",
  );
  assert.equal(options.length, 6);
  for (const option of options) {
    await e(`document.querySelector('[data-decision="${option}"]').click()`);
    assert.equal(
      await e(
        "document.querySelectorAll('[data-decision][aria-pressed=true]').length",
      ),
      1,
    );
    assert.ok(
      await e(
        "document.getElementById('example-reason').textContent.length>20",
      ),
    );
  }
  await e(
    "document.querySelector('[data-decision=noAI]').click();document.getElementById('passport-followup').open=true",
  );
  assert.equal(await e("JSON.stringify({...localStorage})"), before);
  const thirdParty = await e(
    "performance.getEntriesByType('resource').filter(r=>r.name.includes('googletagmanager.com')||r.name.includes('google-analytics.com')).length",
  );
  assert.equal(thirdParty, 0);
  await capture("passport-example-phone", "#example");
  report.push({
    name: "Six fictional Passport decisions, dated follow-up, unchanged browser storage and no measurement tag after rejection",
    passed: true,
  });
  await go("/programs.html");
  await e(
    "document.querySelector('[data-program=\"School AI Literacy Pilot — scoped quote\"]').click()",
  );
  assert.equal(
    await e("document.getElementById('leadProgram').value"),
    "School AI Literacy Pilot — scoped quote",
  );
  report.push({
    name: "School support inquiry preselects the correct offer without sending a message",
    passed: true,
  });
  await viewport(1440, 1000);
  for (const [name, path] of [
    ["home", "/"],
    ["schools", "/schools/"],
    ["passport", "/passport.html"],
    ["releases", "/releases.html"],
    ["programs", "/programs.html"],
  ]) {
    await go(path);
    await capture(name + "-desktop");
    if (name === "home") await capture("home-passport-desktop", "#product");
    if (name === "passport")
      await capture("passport-example-desktop", "#example");
  }
  await viewport(390, 844);
  await go("/");
  await capture("home-phone");
  await go("/releases.html");
  await capture("releases-phone");
  await client.send("Emulation.setScriptExecutionDisabled", { value: true });
  await go("/schools/");
  assert.equal(
    await e(
      "getComputedStyle(document.getElementById('sample-evidence')).display==='none'",
    ),
    false,
  );
  assert.equal(await e("document.getElementById('sample-begin').hidden"), true);
  await go("/passport.html");
  assert.equal(
    await e(
      "getComputedStyle(document.querySelector('.passport-choices')).display",
    ),
    "none",
  );
  assert.ok(
    await e(
      "document.getElementById('example-reason').textContent.includes('practise')",
    ),
  );
  await client.send("Emulation.setScriptExecutionDisabled", { value: false });
  report.push({
    name: "No-JavaScript school sample and default Passport example remain readable without inert controls",
    passed: true,
  });
  await client.send("Page.navigate", {
    url: "file://" + resolve("schools/trust/index.html"),
  });
  await sleep(600);
  assert.equal(
    await e("document.getElementById('position').textContent"),
    "Slide 1 of 28",
  );
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "ArrowRight",
    code: "ArrowRight",
  });
  assert.equal(
    await e("document.getElementById('position').textContent"),
    "Slide 2 of 28",
  );
  assert.equal(await e("document.getElementById('notes').hidden"), true);
  report.push({
    name: "Downloaded projection runs from a local file, keyboard advances slides and notes start hidden",
    passed: true,
  });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.push({ error: String(error.stack || error) });
  console.error(error);
  process.exitCode = 1;
} finally {
  writeFileSync(
    join(outputDirectory, "report.json"),
    JSON.stringify(report, null, 2),
  );
  client?.socket.close();
  chromeProcess.kill("SIGTERM");
}
