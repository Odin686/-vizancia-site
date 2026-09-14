import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile('programs.html', 'utf8');
const code = await readFile('assets/programs.js', 'utf8');

test('Programs uses the actual form markup and prepares an encoded email only after validation', () => {
  // Use IDs from the real page so a merge that renames only JS or HTML fails.
  const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, {
    value: '', listeners: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    querySelectorAll() { return []; },
  }]));
  const document = {
    getElementById: (id) => nodes.get(id), querySelectorAll: () => [], addEventListener() {},
  };
  const window = { location: { href: 'https://vizancia.com/programs.html' } };
  vm.runInNewContext(code, { document, window });
  const form = nodes.get('programInquiryForm');
  form.reportValidity = () => false;
  const event = { prevented: false, preventDefault() { this.prevented = true; } };
  form.listeners.submit(event);
  assert.equal(event.prevented, true);
  assert.equal(window.location.href, 'https://vizancia.com/programs.html');

  const fields = {
    leadName: 'Test Educator', leadEmail: 'teacher@example.org', leadCountry: 'Canada',
    leadProgram: 'Family AI Safety Lab', leadMessage: 'A & B? Please explain\nNext line.',
  };
  for (const [id, value] of Object.entries(fields)) nodes.get(id).value = value;
  form.reportValidity = () => true;
  form.listeners.submit(event);
  const email = new URL(window.location.href);
  assert.equal(email.protocol, 'mailto:');
  assert.equal(email.pathname, 'info@vizancia.com');
  assert.equal(email.searchParams.get('subject'), 'Vizancia program inquiry — Family AI Safety Lab');
  assert.ok(email.searchParams.get('body').includes('Country or region: Canada'));
  assert.ok(email.searchParams.get('body').includes(fields.leadMessage));
  assert.match(nodes.get('formStatus').textContent, /Review the prepared message and press Send/);
  assert.match(html, /id="enquire"/, 'older links keep a working destination');
  assert.match(html, /id="book"/);
  assert.match(html, /class="inquiry-form reveal" id="programInquiryForm"/);
  assert.match(html, /Do not include student names/);
});
