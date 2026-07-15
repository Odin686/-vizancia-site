import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const brandDirectory = join(root, 'assets', 'brand', 'google-business');
const assets = [
  { source: join(root, 'assets', 'vizancia-mark.svg'), output: join(root, 'assets', 'vizancia-mark-720.png'), width: 720, height: 720 },
  { source: join(root, 'assets', 'vizancia-mark.svg'), output: join(brandDirectory, 'vizancia-logo-720.png'), width: 720, height: 720 },
  { source: join(root, 'assets', 'vizancia-logo-horizontal.svg'), output: join(root, 'assets', 'vizancia-logo-horizontal-1200.png'), width: 1200, height: 360 },
  { source: join(brandDirectory, 'vizancia-cover-1080x608.svg'), output: join(brandDirectory, 'vizancia-cover-1080x608.png'), width: 1080, height: 608 },
  { source: join(brandDirectory, 'vizancia-campus-720.svg'), output: join(brandDirectory, 'vizancia-campus-720.png'), width: 720, height: 720 },
  { source: join(brandDirectory, 'vizancia-learn-720.svg'), output: join(brandDirectory, 'vizancia-learn-720.png'), width: 720, height: 720 },
];

if (!existsSync(chrome)) throw new Error('Google Chrome is required to render brand assets.');
mkdirSync(brandDirectory, { recursive: true });

for (const asset of assets) {
  const result = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--default-background-color=00000000',
    '--force-device-scale-factor=1',
    '--window-size=' + asset.width + ',' + asset.height,
    '--screenshot=' + asset.output,
    pathToFileURL(asset.source).href,
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('Failed to render ' + asset.source + ': ' + (result.stderr || result.stdout));
  console.log('Rendered ' + asset.output.replace(root + '/', ''));
}
