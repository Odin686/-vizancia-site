#!/usr/bin/env python3
"""Build Vizancia's print-first classroom guide from the reviewed fictional case.

Developer dependency: ReportLab 5.0.1. Bundled Inter fonts are OFL-licensed.
The case and teaching excerpts are versioned in data/evidence-to-action.json.
This publication changes neither the app nor the 28-slide projection's pedagogy.
"""
from pathlib import Path
from html import escape
import json, re, hashlib, os
from datetime import datetime, timezone
os.environ.setdefault("SOURCE_DATE_EPOCH",str(int(datetime(2026,10,25,tzinfo=timezone.utc).timestamp())))
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfdoc import PDFString
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'data/evidence-to-action.json').read_text())
OUT=ROOT/'output/pdf';OUT.mkdir(parents=True,exist_ok=True)
for name in ['Regular','Bold']:
 pdfmetrics.registerFont(TTFont('Inter'+('-Bold' if name=='Bold' else ''),str(ROOT/f'scripts/pdf_assets/inter/Inter-{name}.ttf')))
INK=colors.HexColor('#14243B');MUTED=colors.HexColor('#506078')
BLUE=colors.HexColor('#5141BF');TEAL=colors.HexColor('#087C80')
LINE=colors.HexColor('#D6DDE6');PALE=colors.HexColor('#F2F5F8');LILAC=colors.HexColor('#F2F0FA')
WHITE=colors.white;W,H=612,792;L,R,CW=46,566,520
TITLE='Evidence to Action';EDITION='Classroom edition 1 / October 2026'
BASELINE=('A supplier says its AI lunch-queue sign halves waiting time for every school. On one Tuesday, one queue using the sign averaged 4 minutes; a different queue on Monday averaged 8. Menus and staffing differed. The trial did not measure how many students got lunch. An AI-style summary repeats the claim without naming a source.')
PAGE_LOG=[]

def clean(t):
 return str(t).translate(str.maketrans({'\u2014':'-','\u2013':'-','\u2011':'-','\u2019':"'",'\u2018':"'",'\u201c':'"','\u201d':'"','\u00a0':' '}))
def para(t,size=10.5,lead=None,bold=False,color=INK):
 return Paragraph(escape(clean(t)).replace('\n','<br/>'),ParagraphStyle('p',fontName='Inter-Bold' if bold else 'Inter',fontSize=size,leading=lead or size*1.4,textColor=color))

class Page:
 def __init__(self,c,code,section,number,total):
  self.c=c;self.code=code;self.section=section;self.number=number;self.total=total;self.elements=[]
  c.setFillColor(WHITE);c.rect(0,0,W,H,fill=1,stroke=0)
  c.setFillColor(BLUE);c.rect(L,757,20,3,fill=1,stroke=0)
  self.text('Vizancia',747,13,16,True,x=L,width=110)
  self.text(section.upper(),744,7.8,10,color=MUTED,x=290,width=276,align='right')
  self.rule(721)
  self.rule(46)
  self.text(TITLE+' / '+self.code+' / '+EDITION,34,7.1,10,color=MUTED,width=420,footer=True)
  self.text(f'{number:02d} / {total:02d}',34,8,10,True,x=510,width=56,align='right',footer=True)
 def text(self,t,y,size=10.5,lead=None,bold=False,color=INK,x=L,width=CW,align=None,footer=False):
  p=para(t,size,lead,bold,color)
  if align=='right':p.style.alignment=2
  _,h=p.wrap(width,1000);bottom=y-h
  if bottom<(22 if footer else 60):raise ValueError(f'{self.code}: overflow at {bottom:.1f}: {t[:90]}')
  p.drawOn(self.c,x,bottom);self.elements.append((x,bottom,width,h,clean(t)))
  return bottom
 def label(self,t,y,x=L,width=CW,color=BLUE):return self.text(t.upper(),y,8,11,True,color,x,width)
 def rule(self,y,x=L,width=CW,color=LINE,weight=.6):
  self.c.setStrokeColor(color);self.c.setLineWidth(weight);self.c.line(x,y,x+width,y)
 def header(self,kicker,title,sub=''):
  self.label(kicker,701)
  y=self.text(title,677,27,32,True)-13
  if sub:y=self.text(sub,y,11,16,color=MUTED)-20
  return y
 def block(self,label,text,y,width=CW,x=L):
  y=self.text(label,y,12,16,True,x=x,width=width)-7
  y=self.text(text,y,10.5,15,x=x,width=width)-19
  return y
 def callout(self,label,text,y,color=TEAL,width=CW,x=L):
  h1=para(label,10,14,True,color).wrap(width-30,1000)[1]
  h2=para(text,10.2,14.5).wrap(width-30,1000)[1];height=h1+h2+29
  if y-height<60:raise ValueError(f'{self.code}: callout overflow')
  self.c.setFillColor(PALE);self.c.rect(x,y-height,width,height,fill=1,stroke=0)
  self.c.setFillColor(color);self.c.rect(x,y-height,3,height,fill=1,stroke=0)
  z=self.text(label,y-11,10,14,True,color,x+15,width-30)-6
  self.text(text,z,10.2,14.5,x=x+15,width=width-30)
  return y-height-19
 def table(self,rows,widths,y,size=9.5,lead=13.5,header=True):
  rendered=[[para(cell,size,lead,r==0 and header,WHITE if r==0 and header else INK) for cell in row] for r,row in enumerate(rows)]
  t=Table(rendered,colWidths=widths,hAlign='LEFT');commands=[('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),('LINEBELOW',(0,0),(-1,-1),.5,LINE)]
  if header:commands += [('BACKGROUND',(0,0),(-1,0),INK)]
  for i in range(1 if header else 0,len(rows)):
   if i%2:commands.append(('BACKGROUND',(0,i),(-1,i),PALE))
  t.setStyle(TableStyle(commands));_,h=t.wrap(CW,1000)
  if y-h<60:raise ValueError(f'{self.code}: table overflow {y-h}')
  t.drawOn(self.c,L,y-h);return y-h-20
 def response(self,label,y,height,prompt=None):
  y=self.label(label,y,color=INK)-7
  if prompt:y=self.text(prompt,y,9,12,color=MUTED)-8
  self.c.setStrokeColor(LINE);self.c.setLineWidth(.6);self.c.rect(L,y-height,CW,height,fill=0,stroke=1)
  for k in range(1,int(height/21)):
   self.rule(y-k*21,x=L+10,width=CW-20,color=LINE,weight=.35)
  return y-height-20
 def finish(self):PAGE_LOG.append({'code':self.code,'elements':self.elements})

def cover(p):
 p.label('Classroom investigations / '+('Complete packet' if p.total==20 else 'Teacher handbook'),691)
 p.text('Evidence\nto Action',649,57,61,True,width=500)
 p.text(DATA['subtitle'],493,20,27,width=490)
 p.text('Four practical investigations in evidence, uncertainty\nand responsible decisions.',416,12,18,color=MUTED)
 p.rule(355,color=BLUE,weight=1.8)
 for i,(label,value) in enumerate([('FOR','Grades 6-8'),('SEQUENCE','4 x 45 min'),('START WITH','8-min baseline')]):
  x=L+i*179;p.label(label,336,x,160);p.text(value,314,15,20,True,x=x,width=160)
 # The conceptual diagram is vector-based, with a restrained three-part reading order.
 for i,(label,body) in enumerate([('01 / FRAME','State the claim.\nKeep your first view.'),('02 / INVESTIGATE','Inspect original records.\nName what is missing.'),('03 / DECIDE','Choose an action.\nExplain what changed.')]):
  x=L+i*179;p.rule(250,x=x,width=155,color=TEAL,weight=2)
  p.label(label,234,x,155,TEAL);p.text(body,210,10.5,15,x=x,width=155)
 p.text('Paper-first. No live AI or student accounts required.',133,11,16,True)
 p.text('Fictional cases and prepared replies. Classroom pilot for educator review;\nnot a validated assessment or a claim of school approval.',105,8.5,12,color=MUTED)

def brief(p):
 y=p.header('01 / Programme brief','Teach the reasoning behind\nthe recommendation.','The goal is a supported decision a learner can explain, rather than a polished answer they cannot defend.')
 y=p.table([['Learning objective','Look for this in the learner\'s work'],['Connect claims to sources','An exact detail from an original record, with a statement of what it supports.'],['Recognise uncertainty','A specific limit involving the measure, comparison, sample or duration.'],['Choose proportionate action','A feasible next check, justified pause or conditional recommendation.'],['Retain responsibility','A reason for the help chosen, a meaningful revision and a person responsible.']],[183,337],y,size=10)
 y=p.block('Use this as a complete paper pathway','Print the learner pages, provide pencils, and use a board for the shared discussion. A projector and the Vizancia app are optional. The supplied AI-style replies are fixed authored examples, not outputs generated from students\' instructions.',y)
 y=p.block('What this edition includes','Teacher notes and worked examples: T01-T10. Learner handouts in the complete packet or separate student PDF: S00-S08. Stable page codes connect the versions. Keep teacher keys away from first attempts.',y)
 p.callout('Print only what you need','Baseline: S00. Session 1: S01-S02. Session 2: S03-S04 plus S01. Session 3: S05-S06 plus S01. Session 4: S07-S08. Keep the garden evidence for sessions 2 and 3.',y)

def roadmap(p):
 y=p.header('02 / Learning sequence','Build the routine.\nThen test it in a new setting.','Four sessions, each with one clear student output. Allow about eight additional minutes for the baseline before session 1.')
 y=p.table([['Session','Central question','Evidence of learning'],['01 / Check the claim','What can this small test support?','A qualified headline or a justified request for a better test.'],['02 / Verify the reply','What improved, and what is still unsupported?','A checked recommendation with the invented price removed.'],['03 / Make the decision','Whose needs, approval and safeguards matter?','A recommendation with an owner, conditions and a review or stop rule.'],['04 / Apply independently','Can I use the routine without copying the earlier answer?','An individual first response, then a clearly separated supported revision.']],[116,191,213],y,size=10)
 y=p.block('A consistent 45-minute rhythm','5 minutes: think first. 8 minutes: inspect the evidence. 12 minutes: examine or apply. 12 minutes: recommend or discuss. 8 minutes: explain and reflect. Each session plan specifies the activity within that structure.',y)
 p.callout('Protect the final independent attempt','Do not reveal the quiet-desk solution, hints about the measurement error or worked responses until S08\'s first response has been preserved. Keep agreed access supports; record any extra content help.',y)

def preparation(p):
 y=p.header('03 / Facilitation protocol','Make thinking visible\nbefore offering help.','Use the same expectations for oral, written, drawn or scribed explanations.')
 y=p.table([['Before the sequence','During every session'],['Read the cases, keys and answer-release order. Confirm local approval, accessibility and device rules.','Ask for an initial view. Withhold the worked answer. Ask learners to point to the detail supporting their claim.'],['Print selected pages. Plan pairs or groups of three. A reader, checker and reporter can rotate.','Let students distinguish observation, interpretation and uncertainty. Accept a justified no-AI route.'],['Complete S00 individually before substantive teaching. Keep identified work within the school.','Use prepared replies only. Do not require a live service, account, student name, photo or private disclosure.']],[260,260],y,size=10)
 y=p.block('A brief for useful help','Ask learners to state the task, audience, sources, constraints and kind of help before inspecting the prepared replies. A helpful instruction can improve organisation; it cannot make an unsupported detail true.',y)
 y=p.block('A repeatable record','My first view -> help I chose -> independent check -> decision -> revision. Ask what the learner found, what it changed and why. A second AI-style reply alone is not an independent check.',y)
 p.callout('Access support is not an answer','Read aloud, enlarge print, allow oral answers and use a scribe or familiar assistive tool. Do not assess spelling, handwriting, speed, confidence or willingness to disclose personal experiences. Keep access support distinct from substantive hints.',y)

LESSON_TITLES=['A small test does not\nestablish a universal claim.','A clearer reply still\nneeds a source check.','A responsible decision\nneeds conditions and an owner.','Independent transfer comes\nbefore coached revision.']
KEYS=[
 ('Teach the distinction','A claim is a statement to evaluate. A source is a record to inspect. Evidence is the relevant detail in that record. A recommendation connects the evidence to a decision.'),
 ('Teach the distinction','A prompt is an instruction, not a guarantee. A reply can be well organised and still contain an invented detail. Verify each factual sentence against an original record.'),
 ('Teach the distinction','Evidence describes what is supported; values describe what matters. A vote does not establish that a system works. A proposal does not authorise a purchase or a trial.'),
 ('Preserve the independent attempt','Give S07 and S08 before discussing the new case. Remind learners of the routine without pointing out the error. Preserve the first response before feedback or substantive hints.')]
STEPS=[
 [('0-5','Think first','Read the claim aloud; record a first view on S02 before showing the records.'),('5-13','Inspect','Read the three records. Clarify unfamiliar words without supplying the conclusion.'),('13-25','Trace','In pairs, connect each claim to a record. Does the poster add a new test?'),('25-37','Recommend','Write a headline that stays within the evidence, or explain why more testing is needed.'),('37-45','Explain','Name a source, a limit and a useful next check. Record what changed.')],
 [('0-5','Set criteria','Write what a responsible recommendation must include. Choose a kind of help.'),('5-13','Compare','Read S03 alongside S01. Both replies are authored simulations.'),('13-25','Verify','Check each factual sentence. Use the source inventory to test the price claim.'),('25-37','Revise','Remove unsupported content. Write a checked recommendation and a more precise brief.'),('37-45','Explain','Identify the edit, the source behind it and what remains unresolved.')],
 [('0-5','Take a view','Name affected people and record the initial recommendation on S06.'),('5-13','Inspect roles','Read S05. Separate a reported need, a preference and a fact to verify.'),('13-25','Deliberate','Rotate reader, checker and reporter. Paraphrase one disagreement fairly.'),('25-37','Specify','Write the conditions, owner, approval and review or stop rule.'),('37-45','Reflect','Explain how a perspective changed the recommendation or why it was retained.')],
 [('0-5','Think first','Introduce the claim without diagnosing it. Record the initial view.'),('5-13','Inspect','Read S07 individually, with agreed accessibility support.'),('13-25','Apply alone','Complete the first S08 recommendation before feedback. Collect or preserve it.'),('25-37','Discuss','Only now compare reasoning and reveal the case key. Mark any support used.'),('37-45','Revise','Use the separate revision area to explain a meaningful change or justified recheck.')]]
MODEL=[
 ('A responsible headline','"Small two-day garden test used 10 rather than 20 litres; plant health and results in other conditions remain untested." This preserves the observation without endorsing a universal claim.'),
 ('A source-driven correction','"The records do not establish a price, so I removed the 30-credit claim. I kept the small-test result and would request verified costs before a purchase decision." Unknown is not the same as zero.'),
 ('A conditional recommendation','"Consider a supervised trial only after approval, a verified cost and an accessible alternative are agreed. Name an adult to monitor plant health, compare with a simpler timer and pause if the agreed safeguards fail." Waiting can also be justified.'),
 ('Reveal only after the first response','The trial counted pages, not comprehension. Different groups, materials and noise levels weaken the comparison. Unnamed websites add no traceable evidence. A fair next check must measure understanding and retain accessible alternatives.')]

def lesson(p,index):
 s=DATA['case']['sessions'][index];n=index+1
 y=p.header(f'0{n+3} / Session {n} facilitator plan',LESSON_TITLES[index],f'45 minutes / '+['S01-S02; preserve S01','S03-S04 plus S01','S05-S06 plus S01','S07-S08; preserve first response'][index])
 y=p.block(*KEYS[index],y)
 y=p.table([['Minutes','Teacher move','Learner task']]+[list(row) for row in STEPS[index]],[61,110,349],y,size=9.5,lead=13)
 y=p.callout(*MODEL[index],y)
 # One actionable coaching question; exact teacher keys remain in the source snapshot.
 q=['Which record measured that, and which conditions would your headline need to retain?','Which sentence did you check, what did the source establish, and what did you change?','What would make your group pause or stop, and who has authority to decide?','After preserving the first response: what was measured, and what did the claim promise?'][index]
 p.block('Coach the reasoning',q,y)

def assessment(p):
 y=p.header('08 / Assessment and feedback','Assess the explanation,\nnot agreement with an option.','Use the original informal rubric for the baseline and the first session-4 response. Keep supported revisions separate.')
 rows=[['Dimension','0 / Not yet shown','1 / Partial','2 / Explained']]
 rows += [
 ['Evidence','No relevant detail or an unsupported claim.','Names a relevant source detail.','Explains what it supports; separates repetition from independent support.'],
 ['Limits','Accepts or rejects without a reason.','Names a relevant uncertainty.','Explains how the measure, comparison, sample or duration limits the claim.'],
 ['Next action','No useful next step.','Suggests a relevant check.','Specifies a feasible check and links it to the decision or affected people.'],
 ['Help and responsibility','No reason for the help chosen.','Gives a relevant reason.','Connects help to verification, permission or learning; retains human responsibility.']]
 y=p.table(rows,[96,132,132,160],y,size=9.1,lead=12.5)
 y=p.block('Use the result descriptively','Each dimension is 0-2; a total of 0-8 describes this task. It is not a certification, a validated scale or a grade of a person. Missing work is missing, not zero. Multiple actions can be defensible when the reasoning is supported.',y)
 p.callout('Do not infer a programme effect','Baseline and transfer cases are related, not equivalent standardised tests. Practice, teaching, attendance, task differences and support can affect responses. Use these scores only for this activity; do not combine them with a different rubric or claim a causal gain.',y)

def coaching(p):
 y=p.header('09 / Worked examples','Locate one reasoning gap.\nCoach one meaningful revision.','Teacher reference only. Use these examples after the relevant first attempt.')
 for i in [0,1]:
  t=DATA['teaching'][i]
  y=p.label('Session '+str(i+1)+' / '+t['concept'],y)-14
  rows=[['Illustrative learner response','What to notice / next prompt']]
  for j,(level,answer,notice,prompt) in enumerate(t['samples'][:2]):
   coaching=[['The result has lost its conditions. Ask: which words would keep the claim limited to this test?', 'The observation is bounded and linked to a next check. Ask: why does plant health matter to this decision?'], ['A longer prompt is being treated as proof. Ask: which factual sentence did you verify against a source?', 'The correction follows a source check. Ask: how will you verify the next version?']][i][j]
   rows.append([answer,coaching])
  y=p.table(rows,[244,276],y,size=9.5,lead=13)
 p.callout('Review cycle','Locate the source connection. Name one gap. Ask a focused question. Let the learner revise or justify retaining the answer. Recheck the change. A longer or smoother answer alone is not evidence of stronger understanding.',y)

def close(p):
 y=p.header('10 / Review and resources','Keep useful evidence.\nChoose the next teaching step.','A brief local review helps distinguish a usable lesson from a claim about impact.')
 y=p.table([['Review question','Record locally'],['Did the sequence run as planned?','Actual teaching time; selected route; access supports; interruptions or additional help.'],['Where did reasoning break down?','Aggregate patterns: source connection, limits, next check, or responsibility. Keep missing responses separate.'],['What should happen next?','Reteach one distinction, use another fictional claim, or plan a locally approved extension.'],['What may be shared?','Only non-identifying material feedback or safe aggregate observations. Never send student work, names or private reflections.']],[200,320],y,size=9.6,lead=13.5)
 y=p.block('Use the projection as an optional aid','vizancia.com/teachers/activity/ provides the original four-case projection. It retains its earlier case title. Use paper for individual responses; keep facilitator notes and model answers off screen until students give reasons. An app or live AI service is not needed.',y)
 y=p.block('Further educator reading','UNESCO, AI competency framework for students (2024). NIST AI 600-1, Generative AI Profile (2024). These support background reading, not an endorsement or validation of this programme.',y)
 y=p.text('UNESCO: unesco.org/en/articles/ai-competency-framework-students\nNIST: doi.org/10.6028/NIST.AI.600-1',y,8.5,12,color=TEAL)-7
 p.c.linkURL('https://www.unesco.org/en/articles/ai-competency-framework-students',(L,y+19,R,y+31),relative=0,thickness=0)
 p.c.linkURL('https://doi.org/10.6028/NIST.AI.600-1',(L,y+7,R,y+19),relative=0,thickness=0)
 y=p.text('Fictional learning cases. Classroom copying permitted; no resale or implied endorsement. Educator-review pilot, not field-tested or validated.',y,9,13,color=MUTED)-16
 p.text('Contact: info@vizancia.ca / Privacy: vizancia.com/privacy.html',y,9,13,color=MUTED)

def baseline(p):
 y=p.header('Student baseline / S00 / About 8 minutes','Begin with your own judgment.','Complete before session 1. Use the support agreed with your teacher; leave out names and personal details.')
 y=p.callout('A fictional lunch-queue proposal',BASELINE,y,color=BLUE)
 y=p.response('01 / Would you recommend using the sign now?',y,85,'Use a detail from the case to explain your reasoning.')
 y=p.response('02 / What remains uncertain? What would you check next?',y,85)
 p.response('03 / What help would you choose, and why?',y,75,'Your own work, a person, another tool, AI help, or unsure are possible choices.')

def evidence(p,index):
 s=DATA['case']['sessions'][index];code=f'S{index*2+1:02d}'
 title=['Check the claim.','Verify the reply.','Make the decision.','Apply the routine.'][index]
 y=p.header(f'Student evidence / {code} / Session {index+1}',title,s['goal'])
 y=p.callout('The task',s['claim'],y,color=BLUE)
 for i,card in enumerate(s['cards']):
  y=p.label(chr(65+i)+' / '+re.sub(r'^[A-C][.)]\s*','',card['title']),y,color=TEAL)-5
  y=p.text(card['source'],y,8.5,12,color=MUTED)-7
  y=p.text(card['body'],y,10.5,15)-15
  p.rule(y+5)
 p.text('All records and replies on this page are fictional, authored learning examples.\nAn AI-style summary is not an independent source.',y-3,8.5,12,color=MUTED)

def response(p,index):
 s=DATA['case']['sessions'][index];code=f'S{index*2+2:02d}'
 y=p.header(f'Student response / {code} / Session {index+1}','Make the reasoning visible.','Use a source detail, a limit and a useful next check. Explain which help you chose and why.')
 if index==3:
  y=p.response('01 / Initial view before reading the new records',y,54)
  y=p.response('02 / Individual first recommendation - before feedback',y,170,'Include your evidence, its limit, your next action and the help you chose. Your teacher will preserve this before discussion.')
  y=p.response('03 / Supported revision - after discussion',y,100,'What would you change or retain, and why? Note any feedback or extra help used.')
  p.text('A different answer is not required. A clearer reason or a justified recheck can be a useful revision. Keep private reflections private.',y,9,13,color=MUTED)
 else:
  y=p.response('01 / My first view - before the evidence or replies',y,44)
  y=p.response('02 / My check - source detail and what it supports',y,65,'Name a limitation or something the records do not establish.')
  y=p.response('03 / My recommendation - and a useful next step',y,70, ['Write a responsible headline, or explain why you would wait.','Correct unsupported details. What would your next brief ask the help to do?','Name a responsible person, approval, and a review or stop condition.'][index])
  y=p.response('04 / My revision and the help I chose',y,44,'What changed, or why did you retain your view? What did you check for yourself?')
  p.text('You may choose to use no AI. Another tool or a knowledgeable person can help. Explain the choice; leave out private information. Use extra paper or an oral response if needed.',y,9,13,color=MUTED)

TEACHER=[('T00','Classroom investigations','Cover',cover),('T01','Teacher guide / Programme brief','Programme brief',brief),('T02','Teacher guide / Learning sequence','Learning sequence',roadmap),('T03','Teacher guide / Preparation','Preparation',preparation)]
for i in range(4):TEACHER.append((f'T0{i+4}',f'Teacher guide / Session {i+1}',f'Session {i+1}',lambda p,i=i:lesson(p,i)))
TEACHER += [('T08','Teacher guide / Assessment','Assessment',assessment),('T09','Teacher guide / Worked examples','Worked examples',coaching),('T10','Teacher guide / Review and resources','Review and resources',close)]
STUDENT=[('S00','Student handout / Baseline','Baseline',baseline)]
for i in range(4):
 STUDENT.extend([(f'S{i*2+1:02d}',f'Student handout / Session {i+1}',f'Session {i+1} evidence',lambda p,i=i:evidence(p,i)),(f'S{i*2+2:02d}',f'Student handout / Session {i+1}',f'Session {i+1} response',lambda p,i=i:response(p,i))])

def build(name,pages):
 c=canvas.Canvas(str(OUT/name),pagesize=(W,H),pageCompression=1,invariant=1)
 c.setTitle(TITLE+' / '+('Student handouts' if pages==STUDENT else 'Teacher guide' if pages==TEACHER else 'Complete classroom packet'))
 c.setAuthor('Vizancia Incorporated');c.setSubject('Grades 6-8 / Evidence, uncertainty and responsible decisions / Educator-review pilot')
 c.setCreator('Vizancia classroom publishing');c.setKeywords('AI literacy, evidence, verification, classroom, educator review')
 c.setViewerPreference('DisplayDocTitle','true');c._doc.Catalog.Lang=PDFString('en-CA')
 for n,(code,part,title,render) in enumerate(pages,1):
  c.bookmarkPage(code);c.addOutlineEntry(code+' / '+title,code,0)
  p=Page(c,code,part,n,len(pages));render(p);p.finish();c.showPage()
 c.save()
 return {'file':name,'pages':len(pages),'sha256':hashlib.sha256((OUT/name).read_bytes()).hexdigest(),'codes':[a[0] for a in pages]}
if __name__=='__main__':
 manifest={'title':TITLE,'edition':EDITION,'sourceCaseSha256':DATA['sourceCaseSha256'],'files':[]}
 for name,pages in [('evidence-to-action-complete.pdf',TEACHER+STUDENT),('evidence-to-action-teacher-guide.pdf',TEACHER),('evidence-to-action-student-handouts.pdf',STUDENT)]:
  result=build(name,pages);manifest['files'].append(result);print(name,result['pages'],'pages')
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 (ROOT/'tmp/pdfs/layout-log.json').write_text(json.dumps(PAGE_LOG,indent=2)+'\n')
