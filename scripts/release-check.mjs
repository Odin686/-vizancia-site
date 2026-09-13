import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const facts = JSON.parse(await readFile('data/app-releases.json', 'utf8'));
const release = await readFile('releases.html', 'utf8');
const home = await readFile('index.html', 'utf8');
for (const [name, count] of Object.entries(facts.counts)) {
  assert.match(release, new RegExp(`data-release-count="${name}">${count}</span>`), `${name}: release page differs from recorded facts`);
}
for (const [label, name] of [['short lessons','lessons'],['practice games','games'],['learning paths','paths']]) {
  assert.ok(home.includes(`${facts.counts[name]} ${label}`), `Homepage ${label} differs from release facts`);
}
assert.equal(createHash('sha256').update(await readFile('assets/app-icon.png')).digest('hex'), facts.appIconSha256, 'Shared app icon changed');
for (const platform of ['ios', 'android']) {
  assert.match(facts[platform].sourceCommit, /^[a-f0-9]{40}$/);
  assert.ok(['published','unconfirmed'].includes(facts[platform].storeStatus));
}
assert.ok(release.includes(`${facts.ios.version} available`));
assert.ok(release.includes(`${facts.android.version} update prepared`));
assert.ok(home.includes('Android update prepared, Play availability not yet confirmed'));
// Optional local release gate: compare BOTH repositories with the recorded source.
// A new commit requires a fresh content/privacy/store review, even if only docs changed.
const args = process.argv.slice(2);
if (args.length) {
  assert.equal(args.length, 2, 'Usage: node scripts/release-check.mjs IOS_REPO ANDROID_REPO');
  for (const [index, platform] of ['ios','android'].entries()) {
    const dir = path.resolve(args[index]);
    const head = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
    const dirty = execFileSync('git', ['-C', dir, 'status', '--porcelain'], {encoding:'utf8'}).trim();
    assert.equal(dirty, '', `${platform} working tree is not clean`);
    assert.equal(head, facts[platform].sourceCommit, `${platform} source changed: review website facts and policies`);
    const remote = execFileSync('git', ['-C', dir, 'ls-remote', 'origin', 'refs/heads/main'], {encoding:'utf8'}).trim().split(/\s+/)[0];
    assert.equal(head, remote, `${platform} checkout differs from GitHub main`);
  }
}
console.log('Release facts, homepage counts and shared app icon verified.');
