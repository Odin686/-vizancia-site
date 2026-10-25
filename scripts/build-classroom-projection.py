#!/usr/bin/env python3
"""Build the no-input, offline classroom projection from the published page model."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/evidence-to-action-studio.json').read_text())
by={p['code']:p for p in d['pages']};slides=[]
def add(n,kind,title,body,notes=''):
 slides.append(dict(session=n,sessionTitle=['Frame the problem','Audit the AI contribution','Question, iterate and decide','Apply independently'][n-1],kind=kind,title=title,body=body,notes=notes))
def fields(p):
 return '\n\n'.join(b['label']+'\n'+b['prompt'] for b in p['blocks'] if b['type']=='field')
def source(n,code):
 for b in by[code]['blocks']:
  if b['type']=='source':add(n,'Original record',b['label'],b['source']+'\n\n'+b['text'])
def notes(n):
 return next(b['text'] for b in by['T'+str(n+4).zfill(2)]['blocks'] if b['type']=='note')
for n in range(1,5):
 add(n,'Begin',['Frame the problem before asking for help','Report and question the AI contribution','Use new findings to improve the decision','Apply the routine to a new problem'][n-1],['S01-S04: keep a first view, inspect the records, write a bounded brief.','S05-S07 plus S03: inspect fixed replies, report a contribution and check a claim.','S08-S11: consider people, rebrief, inspect the prepared revision and defend your recommendation.','S12-S14: preserve an individual first response before feedback or supported revision.'][n-1]+'\n\nThink -> Brief -> Report -> Check -> Iterate -> Own')
 if n==1:
  add(n,'The assignment',by['S01']['title'].replace('\n',' '),by['S01']['blocks'][0]['text'])
  add(n,'Human first',by['S02']['title'].replace('\n',' '),fields(by['S02']))
  source(n,'S03')
  add(n,'Direct the help',by['S04']['title'].replace('\n',' '),fields(by['S04'])+'\n\nKeep your brief before inspecting the prepared reply. It is not generated from your wording.')
 elif n==2:
  source(n,'S05')
  add(n,'AI contribution report',by['S06']['title'].replace('\n',' '),fields(by['S06']))
  add(n,'Independent check',by['S07']['title'].replace('\n',' '),fields(by['S07']),notes(n))
 elif n==3:
  source(n,'S08')
  add(n,'Question and rebrief',by['S09']['title'].replace('\n',' '),fields(by['S09'])+'\n\nWrite your revised brief before the next slide.')
  add(n,'Prepared AI revision',by['S10']['title'].replace('\n',' '),by['S10']['blocks'][0]['text']+'\n\nFixed authored example, not a new source or a response to your own wording.')
  add(n,'Evaluate the change','What improved? What remains yours?',fields(by['S10']))
  add(n,'Human ownership',by['S11']['title'].replace('\n',' '),fields(by['S11']),notes(n))
 else:
  source(n,'S12')
  add(n,'Independent first response',by['S13']['title'].replace('\n',' '),fields(by['S13'])+'\n\nPreserve the first response before discussion. The next slide is for after feedback.')
  add(n,'After the first response is preserved',by['S14']['title'].replace('\n',' '),fields(by['S14']),notes(n))
template=(ROOT/'scripts/pdf_assets/classroom-projection.html.in').read_text()
assert template.count('__SLIDES__')==1
(ROOT/'teachers/activity/index.html').write_text(template.replace('__SLIDES__',json.dumps(slides,ensure_ascii=False).replace('</','<\\/')))
print('Built',len(slides),'slides across four sessions; no input, storage or live requests.')
