// Render the shared classroom page model as editable Figma frames.
// Caller substitutes STATE and PAGES; helpers follow the scoped print library.
const STATE=__STATE__;
const PAGES=__PAGES__;
const page=await figma.getNodeByIdAsync(STATE.pageId);await figma.setCurrentPageAsync(page);
await Promise.all(['Regular','Bold','Semi Bold'].map(style=>figma.loadFontAsync({family:'Inter',style})));
const variables=Object.fromEntries(await Promise.all(Object.entries(STATE.variables).map(async([k,id])=>[k,await figma.variables.getVariableByIdAsync(id)])));
const masters=Object.fromEntries(await Promise.all(Object.entries(STATE.components).map(async([k,v])=>[k,await figma.getNodeByIdAsync(v.id)])));
const styles=Object.fromEntries(await Promise.all(Object.entries(STATE.styles).map(async([k,id])=>[k,await figma.getStyleByIdAsync(id)])));
const ids=[],mutated=[],frames=[];const track=n=>(ids.push(n.id),n);
const paint=key=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',variables[key]);
function auto(parent,name,width=520,direction='VERTICAL',gap=14){
 const n=track(figma.createAutoLayout(direction));parent.appendChild(n);n.name=name;n.resize(width,10);n.fills=[];n.primaryAxisSizingMode=direction==='VERTICAL'?'AUTO':'FIXED';n.counterAxisSizingMode=direction==='VERTICAL'?'FIXED':'AUTO';n.itemSpacing=gap;return n;
}
function text(parent,name,value,width=520,style='body',color='ink'){
 const n=track(figma.createText());parent.appendChild(n);n.name=name;n.fontName=styles[style].fontName;n.textStyleId=styles[style].id;n.characters=value;n.textAutoResize='HEIGHT';n.resize(width,n.height);n.fills=[paint(color)];return n;
}
function instance(parent,key,props,width=520){
 const n=track(masters[key].createInstance());parent.appendChild(n);n.name='Vizancia / '+key;
 const p={};for(const[k,v]of Object.entries(props||{}))p[STATE.components[key].props[k]]=v;
 if(Object.keys(p).length)n.setProperties(p);
 n.resize(width,n.height);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';
 return n;
}
function divider(parent,width=520){const n=track(figma.createRectangle());parent.appendChild(n);n.name='Editorial rule';n.resize(width,.6);n.fills=[paint('line')];return n;}
function note(parent,b,width=520){return instance(parent,'note_'+(b.kind||'human'),{label:b.label.toUpperCase(),body:b.text},width);}
function table(parent,b){
 const t=auto(parent,'Table',520,'VERTICAL',0);
 const count=b.headers.length,widths=b.widths||b.headers.map(()=>520/count);
 for(const [r,row]of [b.headers,...b.rows].entries()){
  const line=auto(t,r===0?'Table heading':'Evidence row '+r,520,'HORIZONTAL',0);line.counterAxisAlignItems='MIN';line.fills=[paint(r===0?'ink':r%2?'mist':'paper')];
  for(const [i,value]of row.entries())instance(line,r===0?'tableHeading':'tableCell',{text:value},widths[i]);
  divider(t);
 }
 return t;
}
function cover(parent){
 const metrics=auto(parent,'Scope',520,'HORIZONTAL',12);
 for(const[label,body]of [['FOR','Grades 6-8'],['CORE','4 x 45 minutes'],['BEFORE','8-minute baseline']]){
  const col=auto(metrics,label,165,'VERTICAL',6);text(col,'Metric label',label,165,'label','purple');text(col,'Metric',body,165,'strong');
 }
 divider(parent);
 const stages=[['01 / THINK','Your own view first.'],['02 / BRIEF','Direct useful help.'],['03 / REPORT','Record the contribution.'],['04 / CHECK','Investigate independently.'],['05 / ITERATE','Return with better inputs.'],['06 / OWN','Defend your decision.']];
 for(let r=0;r<2;r++){
  const row=auto(parent,'Human judgment cycle '+r,520,'HORIZONTAL',12);
  for(const[label,body]of stages.slice(r*3,r*3+3))note(row,{kind:r===0?'human':'check',label,text:body},165.3);
 }
 text(parent,'Delivery boundary','PREPARED EXCHANGES / OPTIONAL TEACHER DEMO',520,'label','teal');
}
for(const data of PAGES){
 const existing=page.children.find(n=>n.name===data.code+' / '+data.title.replaceAll('\n',' '));
 if(existing)throw new Error('Frame already exists: '+data.code+'. Inspect before retrying.');
 const f=track(figma.createAutoLayout('VERTICAL'));page.appendChild(f);f.name=data.code+' / '+data.title.replaceAll('\n',' ');f.resize(612,792);f.primaryAxisSizingMode='FIXED';f.counterAxisSizingMode='FIXED';f.fills=[paint('paper')];f.paddingTop=28;f.paddingLeft=f.paddingRight=46;f.paddingBottom=24;f.itemSpacing=16;f.clipsContent=false;
 f.x=200+(data.index%5)*676;f.y=120+Math.floor(data.index/5)*856;
 const h=instance(f,'header',{section:data.section.toUpperCase()});h.primaryAxisSizingMode='FIXED';h.counterAxisSizingMode='AUTO';h.resize(520,16);h.layoutMode='HORIZONTAL';h.primaryAxisAlignItems='SPACE_BETWEEN';
 divider(f);
 const content=auto(f,'Editable publication content',520,'VERTICAL',data.gap||14);
 const title=auto(content,'Page heading',520,'VERTICAL',10);
 text(title,'Page code',data.code+' / '+(data.code.startsWith('S')?'STUDENT WORKSPACE':'CLASSROOM STUDIO'),520,'label','purple');
 text(title,'Title',data.title,520,data.code==='T00'?'cover':'title');
 text(title,'Subtitle',data.subtitle,520,data.code==='T00'?'subtitle':'body','muted');
 for(const b of data.blocks){
  if(b.type==='cover'){cover(content);continue;}
  if(b.type==='note'){note(content,b);continue;}
  if(b.type==='table'){table(content,b);continue;}
  if(b.type==='text'){
   const g=auto(content,b.label,520,'VERTICAL',6);text(g,'Subheading',b.label,520,'strong');text(g,'Paragraph',b.text);continue;
  }
  if(b.type==='source'){
   const n=note(content,{kind:'human',label:b.label,text:b.source+'\n\n'+b.text});n.name='Source / '+b.label;continue;
  }
  if(b.type==='field'){
   const n=instance(content,'response',{label:b.label.toUpperCase(),prompt:b.prompt||'Use words, drawing or an oral response as agreed.'});
   const space=n.findOne(x=>x.name==='Writing space');if(space){space.resize(520,b.height);mutated.push(space.id);}
   continue;
  }
  throw new Error('Unknown block '+b.type);
 }
 const foot=instance(f,'footer',{code:'Evidence to Action / Classroom studio 2 / October 2026',page:data.code});foot.layoutMode='HORIZONTAL';foot.primaryAxisSizingMode='FIXED';foot.counterAxisSizingMode='AUTO';foot.resize(520,10);foot.primaryAxisAlignItems='SPACE_BETWEEN';foot.layoutPositioning='ABSOLUTE';foot.x=46;foot.y=756;
 const rule=track(figma.createRectangle());f.appendChild(rule);rule.name='Footer rule';rule.resize(520,.6);rule.fills=[paint('line')];rule.layoutPositioning='ABSOLUTE';rule.x=46;rule.y=743;
 frames.push({id:f.id,code:data.code,name:f.name,contentId:content.id,contentBottom:content.y+content.height,width:f.width,height:f.height});
}
return {createdNodeIds:ids,mutatedNodeIds:mutated,frames,frameCount:frames.length};
