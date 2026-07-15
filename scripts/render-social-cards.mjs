import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const cards = [
  'og-home',
  'og-home-v2',
  'og-homeschool',
  'og-learning-hub',
  'og-parents',
  'og-sandbox',
  'og-support',
];

if (!existsSync(chrome)) {
  throw new Error(`Google Chrome was not found at ${chrome}`);
}

for (const card of cards) {
  const source = join(root, 'assets', `${card}.svg`);
  const output = join(root, 'assets', `${card}.png`);
  const result = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    `--screenshot=${output}`,
    pathToFileURL(source).href,
  ], { encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`Failed to render ${card}: ${result.stderr || result.stdout}`);
  }

  console.log(`Rendered assets/${card}.png`);
}
