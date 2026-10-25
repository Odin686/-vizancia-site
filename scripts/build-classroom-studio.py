#!/usr/bin/env python3
"""Render the classroom studio review PDF from the editable Figma page model.

Matches the Figma print tokens and auto-layout block vocabulary. This renderer
requires no Figma tool quota. --publish creates the named publication exports;
public download files are copied explicitly after verification.
"""
from pathlib import Path
import json,hashlib,os,re,sys
from datetime import datetime,timezone
from html import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfdoc import PDFString
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'data/evidence-to-action-studio.json').read_text())
OUT=ROOT/'output/pdf';OUT.mkdir(parents=True,exist_ok=True)
os.environ.setdefault('SOURCE_DATE_EPOCH',str(int(datetime(2026,10,25,tzinfo=timezone.utc).timestamp())))
for weight in ['Regular','Bold']:pdfmetrics.registerFont(TTFont('Studio'+weight,str(ROOT/f'scripts/pdf_assets/inter/Inter-{weight}.ttf')))
C={k:colors.HexColor(v) for k,v in {'ink':'#14243B','muted':'#506078','purple':'#5141BF','teal':'#087C80','paper':'#FFFFFF','line':'#D6DDE6','mist':'#F2F5F8','lavender':'#F2F0FA','mint':'#EDF6F3','amber':'#8C5918','sand':'#FCF4E8'}.items()}
L,W=46,520
STYLES={'cover':(56,58,True),'title':(27,32,True),'subtitle':(12,17,False),'body':(10.5,15,False),'small':(9.5,13,False),'strong':(10.5,15,True),'label':(8,11,True),'caption':(7.5,10,False),'brand':(13,16,True)}
LOG=[]
def clean(t):return str(t).translate(str.maketrans({'\u2014':'-','\u2013':'-','\u2011':'-','\u2019':"'",'\u2018':"'",'\u201c':'"','\u201d':'"'}))
def para(value,style='body',color='ink'):
 size,lead,bold=STYLES[style]
 return Paragraph(escape(clean(value)).replace('\n','<br/>'),ParagraphStyle('studio',fontName='StudioBold' if bold else 'StudioRegular',fontSize=size,leading=lead,textColor=C[color]))
class Page:
 def __init__(self,c,p):
  self.c=c;self.p=p;self.code=p['code'];self.boxes=[]
  self.text('Vizancia',764,110,'brand')
  self.text(p['section'].upper(),764,380,'caption','muted',x=186,align=2)
  self.rule(731.4);self.rule(49)
  self.text('Evidence to Action / Classroom studio 2 / October 2026',36,430,'caption','muted',footer=True)
  self.text(self.code,36,50,'caption','muted',x=516,align=2,footer=True)
 def text(self,value,y,width=W,style='body',color='ink',x=L,align=0,footer=False):
  p=para(value,style,color);p.style.alignment=align;_,h=p.wrap(width,900);bottom=y-h
  if bottom<(23 if footer else 51):raise ValueError(f'{self.code}: text overflow {bottom}: {value[:70]}')
  p.drawOn(self.c,x,bottom);self.boxes.append((x,bottom,width,h,clean(value)));return bottom
 def rule(self,y,width=W,x=L):self.c.setStrokeColor(C['line']);self.c.setLineWidth(.6);self.c.line(x,y,x+width,y)
 def note(self,b,y,width=W,x=L):
  kind=b.get('kind','human');bg,accent={'human':('mist','ink'),'ai':('lavender','purple'),'check':('mint','teal'),'teacher':('sand','amber')}[kind]
  label=para(b['label'].upper(),'label',accent);body=para(b['text'],b.get('bodyStyle','body'));h1=label.wrap(width-24,900)[1];h2=body.wrap(width-24,900)[1];height=24+h1+8+h2
  if y-height<51:raise ValueError(f'{self.code}: note overflow {y-height}')
  self.c.setFillColor(C[bg]);self.c.rect(x,y-height,width,height,fill=1,stroke=0)
  a=self.text(b['label'].upper(),y-12,width-24,'label',accent,x+12)-8
  self.text(b['text'],a,width-24,style=b.get('bodyStyle','body'),x=x+12);return y-height
 def table(self,b,y):
  rows=[b['headers']]+b['rows'];widths=b.get('widths') or [W/len(rows[0])]*len(rows[0])
  values=[[para(v,'label' if r==0 else 'small','paper' if r==0 else 'ink') for v in row] for r,row in enumerate(rows)]
  t=Table(values,colWidths=widths);commands=[('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),('BACKGROUND',(0,0),(-1,0),C['ink']),('LINEBELOW',(0,0),(-1,-1),.6,C['line'])]
  for r in range(1,len(rows)):
   if r%2:commands.append(('BACKGROUND',(0,r),(-1,r),C['mist']))
  t.setStyle(TableStyle(commands));_,h=t.wrap(W,900)
  if y-h<51:raise ValueError(f'{self.code}: table overflow {y-h}')
  t.drawOn(self.c,L,y-h);return y-h
 def field(self,b,y):
  y=self.text(b['label'].upper(),y,style='label')-8
  y=self.text(b.get('prompt') or 'Use words, drawing or an oral response as agreed.',y,style='small',color='muted')-8
  h=b['height']-(12 if self.code=='S14' and b['label'].startswith('02 /') else 0);bottom=y-h
  if bottom<51:raise ValueError(f'{self.code}: writing box overflow {bottom}')
  self.c.setStrokeColor(C['line']);self.c.setLineWidth(.6);self.c.rect(L,bottom,W,h,stroke=1,fill=0)
  return bottom
 def cover(self,y):
  for i,(label,value) in enumerate([('FOR','Grades 6-8'),('CORE','4 x 45 minutes'),('BEFORE','8-minute baseline')]):
   x=L+i*177.3;a=self.text(label,y,165,'label','purple',x)-6;self.text(value,a,165,'strong',x=x)
  y-=32+14;self.rule(y);y-=14
  stages=[('01 / THINK','Your own view first.'),('02 / BRIEF','Direct useful help.'),('03 / REPORT','Record the contribution.'),('04 / CHECK','Investigate independently.'),('05 / ITERATE','Return with better inputs.'),('06 / OWN','Defend your decision.')]
  for row in range(2):
   bottoms=[]
   for i,(label,body) in enumerate(stages[row*3:row*3+3]):bottoms.append(self.note(dict(label=label,text=body,kind='human' if row==0 else 'check'),y,165.3,L+i*177.3))
   y=min(bottoms)-14
  return self.text('PREPARED EXCHANGES / OPTIONAL TEACHER DEMO',y,style='label',color='teal')
 def render(self):
  p=self.p;y=self.text(p['code']+' / '+('STUDENT WORKSPACE' if p['code'].startswith('S') else 'CLASSROOM STUDIO'),715.4,style='label',color='purple')-10
  y=self.text(p['title'],y,style='cover' if p['code']=='T00' else 'title')-10
  y=self.text(p['subtitle'],y,style='subtitle' if p['code']=='T00' else 'body',color='muted')-14
  for b in p['blocks']:
   if b['type']=='cover':y=self.cover(y)
   elif b['type']=='note':y=self.note(b,y)
   elif b['type']=='source':y=self.note(dict(label=b['label'],text=b['source']+'\n\n'+b['text']),y)
   elif b['type']=='table':y=self.table(b,y)
   elif b['type']=='field':y=self.field(b,y)
   elif b['type']=='text':
    y=self.text(b['label'],y,style='strong')-6;y=self.text(b['text'],y)
   else:raise ValueError(b['type'])
   y-=14
  LOG.append(dict(code=self.code,bottom=y+14,boxes=self.boxes))
def build(name,pages):
 c=canvas.Canvas(str(OUT/name),pagesize=(612,792),pageCompression=1,invariant=1);c.setTitle('Evidence to Action / '+('Educator pilot' if '--publish' in sys.argv else 'Review draft')+' / '+('Complete classroom packet' if len(pages)==len(DATA['pages']) else 'Teacher guide' if pages[0]['code'].startswith('T') else 'Student handouts'));c.setAuthor('Vizancia Incorporated');c.setCreator('Vizancia classroom publishing / Figma-aligned review export');c.setSubject('Prepared AI exchanges, human judgment, independent checking and iteration / Grades 6-8');c._doc.Catalog.Lang=PDFString('en-CA');c.setViewerPreference('DisplayDocTitle','true')
 for p in pages:
  c.bookmarkPage(p['code']);c.addOutlineEntry(p['code']+' / '+p['title'].replace('\n',' '),p['code'],0);Page(c,p).render();c.showPage()
 c.save();return dict(file=name,pages=len(pages),sha256=hashlib.sha256((OUT/name).read_bytes()).hexdigest())
if __name__=='__main__':
 files=[];publish='--publish' in sys.argv;teacher_count=DATA['teacherPages']
 exports=[('evidence-to-action-complete.pdf' if publish else 'evidence-to-action-studio-draft.pdf',DATA['pages']),('evidence-to-action-teacher-guide.pdf' if publish else 'evidence-to-action-teacher-studio-draft.pdf',DATA['pages'][:teacher_count]),('evidence-to-action-student-handouts.pdf' if publish else 'evidence-to-action-student-studio-draft.pdf',DATA['pages'][teacher_count:])]
 for name,pages in exports:
  result=build(name,pages);files.append(result);print(result['file'],result['pages'],'pages')
 (OUT/'studio-manifest.json').write_text(json.dumps(dict(edition=DATA['edition'],publication=DATA['publication'] if publish else 'local review draft',figma='https://www.figma.com/design/'+DATA['figmaFileKey'],files=files),indent=2)+'\n')
 (ROOT/'tmp/pdfs/studio-layout-log.json').write_text(json.dumps(LOG,indent=2)+'\n')
