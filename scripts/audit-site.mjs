import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules']);
const htmlFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (entry.name.endsWith('.html')) htmlFiles.push(fullPath);
  }
}

function stripTarget(value) {
  return value.split('#')[0].split('?')[0];
}

function isExternal(value) {
  return /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value) || value.startsWith('#');
}

await walk(root);
const errors = [];
const warnings = [];

for (const file of htmlFiles) {
  const source = await readFile(file, 'utf8');
  const relative = path.relative(root, file);
  const isRedirect = relative === 'legal.html';
  const isErrorPage = relative === '404.html';
  const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = source.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1]?.trim();
  const h1Count = (source.match(/<h1\b/gi) || []).length;
  const canonical = source.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];

  if (!title) errors.push(`${relative}: missing title`);
  if (!description && !isRedirect) errors.push(`${relative}: missing meta description`);
  if (h1Count !== 1 && !isRedirect) errors.push(`${relative}: expected one h1, found ${h1Count}`);
  if (!canonical && !isRedirect && !isErrorPage) errors.push(`${relative}: missing canonical URL`);
  if (!isRedirect && !isErrorPage && !/property=["']og:image["']/i.test(source)) warnings.push(`${relative}: missing og:image`);

  for (const jsonMatch of source.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(jsonMatch[1]); }
    catch (error) { errors.push(`${relative}: invalid JSON-LD (${error.message})`); }
  }

  for (const linkMatch of source.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const raw = linkMatch[1];
    if (isExternal(raw)) continue;
    const target = stripTarget(raw);
    if (!target) continue;
    const resolved = target.startsWith('/') ? path.join(root, target) : path.resolve(path.dirname(file), target);
    try {
      const targetStat = await stat(resolved);
      if (targetStat.isDirectory()) await stat(path.join(resolved, 'index.html'));
    } catch {
      errors.push(`${relative}: missing local target ${raw}`);
    }
  }
}

const forbiddenClaims = [
  /100%\s+free/i,
  /nothing\s+leaves\s+the\s+device/i,
  /no\s+data\s+collected/i,
  /everything\s+runs\s+on\s+the\s+device/i,
  /available\s+to\s+users\s+of\s+all\s+ages/i
];

const staleProductClaims = [
  /96\+\s+(?:short\s+)?lessons/i,
  /\b576\s+(?:authored\s+|hand-crafted\s+|practice\s+)?questions\b/i,
  /\b11\s+mini-games\b/i,
  /\beleven\s+different\s+ways\b/i,
  /\b20\s+levels\b/i,
  /\b27\s+(?:local\s+)?achievements\b/i,
  /\bEthics Court\b/i,
  /\bPrompt Craft\b/i,
  /\bthree\s+age\s+modes\b/i,
  /\bthree\s+learning\s+modes\b/i,
  /\bin-app\s+report\s+control\b/i,
  /\bwe\s+do\s+not\s+ask\s+for\s+a\s+name\b/i,
];

for (const file of htmlFiles) {
  const relative = path.relative(root, file);
  if (relative === 'privacy.html' || relative === 'editorial-policy.html') continue;
  const source = await readFile(file, 'utf8');
  for (const pattern of forbiddenClaims) {
    if (pattern.test(source)) warnings.push(`${relative}: review potentially absolute claim ${pattern}`);
  }
}

for (const file of htmlFiles) {
  const relative = path.relative(root, file);
  const source = await readFile(file, 'utf8');
  for (const pattern of staleProductClaims) {
    if (pattern.test(source)) errors.push(`${relative}: stale pre-3.5 product claim ${pattern}`);
  }
}

console.log(`Audited ${htmlFiles.length} HTML files.`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s).`);
if (errors.length) process.exitCode = 1;
