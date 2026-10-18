// Catch privacy and release-status drift across visible copy, metadata and facts.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const facts = JSON.parse(await readFile('data/app-releases.json', 'utf8'));
const disclosures = JSON.parse(await readFile('data/ios-app-disclosures.json', 'utf8'));
const candidate = facts.iosCandidate;
assert.equal(candidate.version, disclosures.candidateVersion);
assert.equal(candidate.build, disclosures.candidateBuild);
assert.equal(candidate.analyticsDefault, 'off');
assert.equal(candidate.storeStatus, 'not-submitted', 'Review all candidate messaging before changing distribution status');
assert.match(candidate.sourceCommit, /^[a-f0-9]{40}$/);
assert.match(disclosures.sourcePolicySha256, /^[a-f0-9]{64}$/);
assert.equal(disclosures.sections.map(s => s.sourceSection).join(','), '5,6,7,8,9,10,11,12,13');

const skip = new Set(['.git', '.openai', 'dist', 'docs', 'node_modules']);
async function pages(dir = '.') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await pages(file));
    else if (file.endsWith('.html')) result.push(file);
  }
  return result;
}
for (const file of await pages()) {
  const text = await readFile(file, 'utf8');
  assert.doesNotMatch(text, /(?:does not (?:include|contain)|without)[^.<]{0,100}(?:analytics SDK|behavioural analytics)/i, `${file}: obsolete no-SDK claim`);
  assert.doesNotMatch(text, /4\.3 (?:is (?:live|available)|available|on both stores)/i, `${file}: candidate presented as published`);
  assert.doesNotMatch(text, /info@vizancia\.com/i, `${file}: use the confirmed support contact`);
}
const release = await readFile('releases.html', 'utf8');
assert.ok(release.includes(`${candidate.practiceActivities} practice activities`) || release.includes(`${candidate.practiceActivities} activities`));
assert.ok(release.includes(`${candidate.practiceQuestions} questions`));
assert.ok(release.includes(`FirebaseAnalyticsCore ${candidate.firebaseSdkVersion}`));
assert.ok(release.includes('has not been uploaded or submitted'));

// Search engines must see the same privacy answer a visitor can read.
const support = await readFile('support.html', 'utf8');
const faq = [...support.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(m => JSON.parse(m[1])).find(d => d['@type'] === 'FAQPage');
const normalize = text => text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
for (const entry of faq.mainEntity) {
  const detail = [...support.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)]
    .find(m => normalize(m[1].match(/<summary>([\s\S]*?)<\/summary>/)?.[1] || '') === entry.name);
  assert.ok(detail, `Missing visible FAQ: ${entry.name}`);
  const answer = detail[1].replace(/<summary>[\s\S]*?<\/summary>/, '');
  assert.equal(normalize(answer), normalize(entry.acceptedAnswer.text), `FAQ metadata differs: ${entry.name}`);
}
console.log('iOS candidate, consent boundaries, contact and visible/structured FAQ consistency verified.');
