import { cp, mkdir, readdir, rm } from 'node:fs/promises';
// Explicit public output: exclude Git history, internal review docs and tooling.
await rm('dist', {recursive:true,force:true});
await mkdir('dist');
for (const item of await readdir('.',{withFileTypes:true})) {
  if ((item.isFile() && /\.(html|css|ico|png|xml|txt)$/.test(item.name)) ||
      ['assets','parents','homeschool','resources','teachers','data'].includes(item.name)) {
    await cp(item.name, `dist/${item.name}`, {recursive:true});
  }
}
console.log('Static site built in dist/. Existing GitHub Pages root deployment is preserved.');
