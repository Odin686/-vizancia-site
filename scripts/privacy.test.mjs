import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const code = await readFile('assets/privacy-consent.js', 'utf8');
for (const gpc of [false, true]) {
  for (const saved of [null, 'accepted', 'rejected']) {
    for (const blocked of [false, true]) {
      test(`no advertising requests: GPC=${gpc}, prior=${saved}, storage blocked=${blocked}`, () => {
        const elements = [];
        const storage = new Map(saved ? [['vizancia_google_ads_consent', JSON.stringify({choice:saved,savedAt:Date.now()})]] : []);
        const window = {localStorage:{removeItem(key){if(blocked)throw Error('blocked');storage.delete(key);}}};
        const document = {
          readyState:'complete',
          getElementById(id){return elements.find(x=>x.id===id);},
          createElement(tag){assert.equal(tag,'a','Must not create a tracking script, iframe or pixel');return {tag};},
          body:{appendChild(element){elements.push(element);}},
        };
        vm.runInNewContext(code, {window, document, navigator:{globalPrivacyControl:gpc}});
        assert.equal(elements.length,1);
        assert.equal(elements[0].href,'/privacy.html#website-measurement');
        assert.equal(window.gtag, undefined);
        assert.equal(window.dataLayer, undefined);
        if(!blocked) assert.equal(storage.size,0);
        vm.runInNewContext(code, {window, document, navigator:{globalPrivacyControl:gpc}});
        assert.equal(elements.length,1,'Do not duplicate the privacy link');
      });
    }
  }
}
test('initialization waits for the document when loaded in the head', () => {
  let callback;
  const document={readyState:'loading',addEventListener(type,fn){assert.equal(type,'DOMContentLoaded');callback=fn;}};
  vm.runInNewContext(code,{window:{localStorage:{removeItem(){}}},document});
  assert.equal(typeof callback,'function');
});
test('public source cannot load an external script or queue advertising events', async () => {
  async function walk(dir){
    for(const file of await readdir(dir,{withFileTypes:true})){
      if(['.git','node_modules','dist','scripts','docs','.openai'].includes(file.name))continue;
      const target=path.join(dir,file.name);
      if(file.isDirectory()){await walk(target);continue;}
      if(!/\.(html|js)$/.test(file.name))continue;
      const text=await readFile(target,'utf8');
      assert.doesNotMatch(text,/<script[^>]+src=["'](?:https?:)?\/\//i,target);
      assert.doesNotMatch(text,/googletagmanager\.com|google-analytics\.com|gtag\s*\(|fbq\s*\(/,target);
    }
  }
  await walk('.');
});
test('projection view contains no input form, storage API or live request', async()=>{
  const text=await readFile('teachers/activity/index.html','utf8');
  assert.doesNotMatch(text,/<(?:input|textarea|form)\b|localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/);
  assert.ok(text.includes('fictional') || text.includes('Fictional'));
});
