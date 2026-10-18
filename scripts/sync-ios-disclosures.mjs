// Render reviewed Swift-authored disclosures without copying app source or code.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('data/ios-app-disclosures.json', 'utf8'));
assert.equal(data.schemaVersion, 1);
assert.equal(data.platform, 'ios');
assert.equal(data.sections.length, 9);
const escape = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const blocks = data.sections.map(section => {
  const lines = [`<div id="ios-privacy-${section.sourceSection}">`,
    `<h3>${escape(section.heading)}</h3>`, `<p>${escape(section.body)}</p>`];
  if (section.bullets.length) lines.push('<ul>' + section.bullets.map(b => `<li>${escape(b)}</li>`).join('') + '</ul>');
  if (section.footer) lines.push(`<p>${escape(section.footer)}</p>`);
  for (const link of section.links) {
    assert.equal(new URL(link.url).protocol, 'https:');
    lines.push(`<p><a href="${escape(link.url)}" rel="noopener noreferrer">${escape(link.label)}</a></p>`);
  }
  lines.push('</div>');
  return lines.join('\n');
}).join('\n');
const start = '<!-- BEGIN SHARED IOS DISCLOSURES -->';
const end = '<!-- END SHARED IOS DISCLOSURES -->';
const file = 'privacy.html';
const html = await readFile(file, 'utf8');
assert.equal(html.split(start).length, 2, 'Expected one iOS disclosure region');
assert.equal(html.split(end).length, 2, 'Expected one iOS disclosure region');
const rendered = html.slice(0, html.indexOf(start)) + start + '\n' + blocks + '\n' + html.slice(html.indexOf(end));
if (process.argv.includes('--check')) {
  assert.equal(html, rendered, 'iOS policy copy is stale: run npm run sync:ios');
  console.log('Website iOS policy matches the reviewed app disclosure export.');
} else {
  await writeFile(file, rendered);
  console.log('Rendered nine Swift-authored iOS disclosure sections.');
}
