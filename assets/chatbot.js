/* Siddhi chatbot (guided, no AI service needed).
   Name, buttons, every message and all Q&A answers are editable in Admin > Settings > Chatbot.
   Every conversation is sent to /api/chat and appears in Admin > Chat sheets. */
(()=>{
if(window.__skChat)return;window.__skChat=1;
const C=window.SITE_CONFIG||{},API=(C.API_BASE||'').replace(/\/$/,''),K='sk_chat_v1';
let S={sid:'',msgs:[],step:'',lead:{}},queue=[],busy=false,typingTimer=null;
try{S=Object.assign(S,JSON.parse(localStorage[K]||'{}'))}catch(e){}
if(!Array.isArray(S.msgs))S.msgs=[];
if(!S.lead||typeof S.lead!=='object'||Array.isArray(S.lead))S.lead={};
const uid=()=>crypto.randomUUID?crypto.randomUUID():'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
if(!/^[A-Za-z0-9_-]{8,64}$/.test(S.sid||''))S.sid=uid();
const save=()=>{try{localStorage[K]=JSON.stringify(S)}catch(e){}};
const db=()=>window.SITE_DB||{settings:{},items:[]};
const pub=t=>db().items.filter(i=>i.type===t&&i.published!==false);

/* --- admin-driven text ------------------------------------------------ */
const mapText=x=>{const o={};for(const l of String(x||'').split('\n')){const p=l.indexOf('|');if(p<1)continue;const k=l.slice(0,p).trim();if(k)o[k]=l.slice(p+1).trim()}return o};
let CT={},KB=[];
function cfg(){
 const s=db().settings||{};CT=mapText(s.chatText);KB=[];
 for(const l of String(s.chatKB||'').split('\n')){
  const m=l.match(/^(.+?)\s+\|\s+(.+)$/);if(!m)continue;
  const keys=m[1].split('|').map(x=>x.trim()).filter(Boolean);if(!keys.length)continue;
  try{KB.push([new RegExp(keys.join('|'),'i'),m[2].trim()])}catch(e){}
 }
}
const T=(k,d)=>{const v=CT[k];return v==null||v===''?d:v};
const F=(t,v)=>String(t==null?'':t).replace(/\{(\w+)\}/g,(_,k)=>v&&v[k]!=null?v[k]:'');
const TX=(k,d)=>F(T(k,d),vars());
const vars=()=>{const s=db().settings||{};return{
 name:T('name','Siddhi Assistant'),
 hours:String(s.hours||'Mo-Sa 10:00-19:00').replace('Mo-Sa','Monday to Saturday'),
 address:[s.address,s.city,s.state,s.postal].filter(Boolean).join(', '),
 phone:s.phone||'',email:s.email||'',brand:s.brand||'Siddhi'
}};
const is=(t,k,d)=>{const v=T(k,d).trim().toLowerCase();return !!v&&t.toLowerCase()===v};
const eq=(t,v)=>t.toLowerCase()===String(v||'').trim().toLowerCase();
const re=(x,d)=>{try{return new RegExp(T(x,d),'i')}catch(e){return new RegExp(d,'i')}};

/* --- backend transcript ------------------------------------------------ */
function flush(extra){if(!API||!S.msgs.some(m=>m.role==='customer')||(!queue.length&&!extra))return;
 fetch(API+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({sid:S.sid,page:location.href.split('#')[0].slice(0,200),messages:queue.splice(0),...(extra||{})})}).catch(()=>{})}

/* --- UI ---------------------------------------------------------------- */
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const root=el('div','skc-root');
root.innerHTML=`<button class="skc-btn" id="skb" aria-label="Chat"><img src="assets/logo.png" alt="" width="44" height="38"></button>
<section class="skc" id="skp" role="dialog" aria-label="Chat" hidden><header><img id="ski2" src="assets/logo.png" alt="" width="40" height="35"><div><b id="sknm">Siddhi Assistant</b><small id="sksb">Ask about services, pricing or support</small></div><button id="skx" aria-label="Close chat">✕</button></header><div class="skc-log" id="skl" aria-live="polite"></div><div class="skc-qr" id="skq"></div><form id="skf"><input id="ski" maxlength="300" placeholder="Type your message" autocomplete="off" aria-label="Message"><button id="sks">Send</button></form><p class="skc-note" id="skn"></p></section>`;
document.body.append(root);
const $=id=>document.getElementById(id),log=$('skl'),qr=$('skq'),inp=$('ski');
function refresh(){
 cfg();const s=db().settings||{},show=s.chatShow!==false;
 root.hidden=!show;if(!show){$('skp').hidden=true;$('skb').hidden=false;return}
 const icon=s.chatIcon||'assets/logo.png';
 root.querySelectorAll('#skb img,#ski2').forEach(i=>i.src=icon);
 $('skb').setAttribute('aria-label',T('chatLabel','Chat'));
 $('sknm').textContent=T('name','Siddhi Assistant');
 $('sksb').textContent=T('subtitle','Ask about services, pricing or support');
 $('skx').setAttribute('aria-label',T('close','Close chat'));
 $('ski').placeholder=T('placeholder','Type your message');
 $('sks').textContent=T('send','Send');
 $('skn').textContent=API?T('note','Your messages are saved so our team can follow up.'):T('noteDemo','Demo mode: messages are not saved or sent.');
 if(!$('skp').hidden&&S.msgs.length<2)quick(menu());
}
window.addEventListener('sitedata',refresh);
refresh();

/* A conversation is temporary: every new page load starts a fresh chat. */
function resetChat(){
 if(typingTimer){clearTimeout(typingTimer);typingTimer=null}
 busy=false;queue=[];
 S.msgs=[];S.step='';S.lead={};S.sid=uid();
 if(log)log.replaceChildren();if(qr)qr.replaceChildren();if(inp)inp.value='';
 save();
}
resetChat();

const bubble=(r,t)=>{const b=el('div','skc-m '+r,t);log.append(b);log.scrollTop=log.scrollHeight;return b};
/* options: plain text = reply button, {t,href} = link button */
const quick=a=>{qr.replaceChildren(...a.map(o=>{const t=o.t||o,b=el('button',o.href?'lnk':null,o.href?t+' ↗':t);b.type='button';b.style.setProperty('--d',(a.indexOf(o)*60)+'ms');b.onclick=()=>o.href?window.open(o.href,'_blank','noopener'):user(t);return b}));log.scrollTop=log.scrollHeight};
function say(t,q){S.msgs.push({role:'bot',text:t});queue.push({role:'bot',text:t});bubble('bot',t);if(q)quick(q);else qr.replaceChildren();save();flush()}
/* "thinking" animation: bouncing dots + a changing caption, then the answer */
const THINK=['Thinking…','Checking our services…','Preparing your options…'];
const later=(t,q)=>{busy=true;qr.replaceChildren();const d=el('div','skc-m bot typing');d.innerHTML='<span class="dots"><i></i><i></i><i></i></span><small></small>';const cap=d.querySelector('small');let n=0;cap.textContent=THINK[0];
 const iv=setInterval(()=>{n=(n+1)%THINK.length;cap.textContent=THINK[n]},620);log.append(d);log.scrollTop=log.scrollHeight;
 typingTimer=setTimeout(()=>{typingTimer=null;clearInterval(iv);d.remove();busy=false;say(t,q)},650+Math.min(String(t).length*5,650))};

/* --- website knowledge ---------------------------------------------------- */
const STOP=/^(development|application|applications|services?|software|management|solutions?|online|your|and|for|with|the|sector|industry)$/;
const words=t=>String(t).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);
const nice=t=>String(t).replace(/\w\S*/g,w=>w.length>3&&w===w.toUpperCase()?w[0]+w.slice(1).toLowerCase():w);
const everything=()=>[...pub('service'),...pub('solution'),...pub('industry'),...pub('product'),...pub('casestudy')];
const byTitle=t=>everything().find(i=>eq(nice(i.title),t)||eq(i.title,t));
const uurl=i=>`detail.html?t=${i.type}&s=${encodeURIComponent(i.slug)}`;
function best(t,pool){const w=words(t);let b=null,bs=0;
 for(const i of pool||[...pub('service'),...pub('solution'),...pub('industry')]){
  const tw=words(i.title).filter(x=>!STOP.test(x));
  let sc=tw.filter(x=>w.some(y=>y.startsWith(x.slice(0,4))||x.startsWith(y.slice(0,4)))).length;
  if(/app|apps|android|ios|mobile/i.test(t)&&/mobile/i.test(i.title))sc+=2;
  if(/website|web|site|portal/i.test(t)&&/web/i.test(i.title))sc+=2;
  if(/saas|subscription/i.test(t)&&/saas/i.test(i.title))sc+=3;
  if(/offshore|dedicated team|outsourc/i.test(t)&&/offshore/i.test(i.title))sc+=3;
  if(/sms|whatsapp message/i.test(t)&&/sms/i.test(i.title))sc+=3;
  if(/school|college|coaching|student/i.test(t)&&/school|education|exam/i.test(i.title))sc+=2;
  if(/transport|truck|logistic|fleet/i.test(t)&&/trans/i.test(i.title))sc+=2;
  if(sc>bs){bs=sc;b=i}}
 return b}
const list=t=>pub(t).slice(0,8).map(i=>nice(i.title));
const phoneOk=v=>String(v).replace(/\D/g,'').length>=8;
const mailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const MENU=['Plan my project','Our services','Ready solutions','Pricing','Book a demo'];
const menu=()=>MENU;
const itemOpts=(i,extra)=>[i?'Get a quote for this':'Plan my project',...(i?[{t:'View '+nice(i.title),href:uurl(i)}]:[]),...(extra||['Our services']),'Main menu'];
const infoOf=i=>nice(i.title)+': '+(i.excerpt||'')+(i.metric?'\nResult: '+i.metric:'');

/* --- guided project planner ------------------------------------------------ */
const PLAN=['who','need','stage','budget','time','name','phone','email','how'];
const prog=()=>{const i=PLAN.indexOf(S.step),b=$('sksb');if(i>=0&&S.lead.kind!=='callback')b.textContent='Step '+(i+1)+' of '+PLAN.length+' · about 1 minute';else b.textContent=T('subtitle','Ask about services, pricing or support')};
function startPlan(need){S.lead={kind:'plan'};if(need)S.lead.need=need;S.step=need?'stage':'who';prog();
 if(need)return later('Good choice: '+need+'. Where are you in this project right now?',['Just an idea','I have requirements','Upgrading existing software','Need a team for ongoing work','Start over']);
 later('Let us find the right fit for you. Which best describes your business?',[...pub('industry').slice(0,6).map(i=>nice(i.title)),'Something else','Start over'])}
function startCall(){S.lead={kind:'callback',need:'Call back request'};S.step='name';prog();later('Happy to help. Our team will call you. What is your name?',['Start over'])}
function reco(){const L=S.lead,it=best((L.need||'')+' '+(L.who||''),[...pub('service'),...pub('solution')])||best(L.who||'',pub('industry'));L.reco=it?nice(it.title):'';
 S.step='reco';prog();
 const intro='Thanks. Here is what we have for you';
 if(!it)return later(intro+': our team will first understand your workflow and suggest the best way, with a written scope and fixed cost. Shall we take your contact details?',['Yes, continue','Our services','Start over']);
 later(intro+':\n\n'+infoOf(it)+'\n\nWe can start with a free consultation and a fixed-cost plan. Shall we take your contact details so a specialist can reach you?',['Yes, continue',{t:'View '+nice(it.title),href:uurl(it)},'Our services','Start over'])}
function ask(step,msg,q){S.step=step;prog();later(msg,q)}
async function send(){const L=S.lead;let ok=true;
 const msg=[L.kind==='callback'?'Call back request via chatbot.':'Project enquiry via chatbot.',L.who&&'Business: '+L.who,L.need&&'Needs: '+L.need,L.stage&&'Stage: '+L.stage,L.budget&&'Budget: '+L.budget,L.time&&'Timeline: '+L.time,L.reco&&'Suggested: '+L.reco,L.how&&'Prefers: '+L.how,L.email&&'Email: '+L.email,'Page: '+location.pathname.split('/').pop()].filter(Boolean).join('\n');
 if(API){try{const r=await fetch(API+'/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:L.name,phone:L.phone,email:L.email||'',service:(L.need||T('leadService','Chatbot enquiry')).slice(0,140),budget:L.budget||'',message:msg})});ok=r.ok}catch(e){ok=false}}
 S.step='';prog();flush({name:L.name,phone:L.phone,email:L.email||''});save();
 if(!API)return later(T('demo','Demo mode: nothing was sent. Once the backend is connected, your details will reach our team.'),menu());
 const v=vars();later(ok?F(T('thanks','Thank you {name}. Our team will contact you on {phone} within one working day.'),{...v,name:L.name,phone:L.phone}):F(T('fail','Sorry, we could not send your details. Please call or WhatsApp us on +{phone}.'),v),ok?['Our services','Book a demo','Main menu']:[{t:'Call us',href:'tel:+'+v.phone},'Main menu'])}
function step(t){const L=S.lead;
 if(eq(t,'Start over')){S.step='';S.lead={};prog();return later('No problem. What would you like to do?',menu())}
 switch(S.step){
 case 'who':L.who=t.slice(0,80);return ask('need','What do you need? Tap one, or type your own.',[...list('service').slice(0,6),'Ready-made solution','Not sure yet','Start over']);
 case 'need':L.need=t.slice(0,150);return ask('stage','Where are you in this project right now?',['Just an idea','I have requirements','Upgrading existing software','Need a team for ongoing work','Start over']);
 case 'stage':L.stage=t.slice(0,100);return ask('budget','What budget range are you comfortable with?',['Under ₹50,000','₹50,000 – ₹2 lakh','₹2 – ₹5 lakh','Above ₹5 lakh','Not sure yet']);
 case 'budget':L.budget=t.slice(0,60);return ask('time','When would you like to start?',['As soon as possible','Within 1 month','In 2–3 months','Just exploring']);
 case 'time':L.time=t.slice(0,60);return reco();
 case 'reco':if(/^(yes|ok|sure|continue|haan)/i.test(t)||/yes, continue/i.test(t))return ask('name','Great. What is your name?',['Start over']);
  S.step='';prog();return user(t);
 case 'name':L.name=t.slice(0,60);return ask('phone',F('Nice to meet you, {n}. What is your phone number?',{n:L.name}),['Start over']);
 case 'phone':if(!phoneOk(t))return later('Please enter a valid phone number with at least 8 digits.');L.phone=t.slice(0,20);
  if(L.kind==='callback')return ask('how','When should we call you?',['Morning','Afternoon','Evening','Any time']);
  return ask('email','Your email, so we can send the proposal? You can skip this.',['Skip','Start over']);
 case 'email':if(!eq(t,'Skip')){if(!mailOk(t))return later('That email does not look right. Please check it or tap Skip.',['Skip']);L.email=t.slice(0,120)}
  return ask('how','How should we reach you?',['Phone call','WhatsApp','Email','Any is fine']);
 case 'how':L.how=t.slice(0,40);S.step='confirm';prog();
  return later('Please confirm:\n\nName: '+L.name+'\nPhone: '+L.phone+(L.email?'\nEmail: '+L.email:'')+(L.need?'\nNeed: '+L.need:'')+(L.budget?'\nBudget: '+L.budget:'')+(L.time?'\nStart: '+L.time:'')+'\n\nShall I send this to our team?',['Yes, send it','Start over']);
 case 'confirm':if(/^yes|send|ok|confirm/i.test(t))return send();S.step='';return user(t)}}

/* --- free questions: answered from the website data ------------------------ */
function answer(t){const v=vars(),s=db().settings||{};
 for(const [r,a] of KB)if(r.test(t))return[F(a,v),[/price|quote|cost/i.test(a)?'Get a quote':'Plan my project','Our services','Main menu']];
 if(/^(main menu|menu|home|back)$/i.test(t))return['What would you like to know?',menu()];
 if(/our services|services|what do you do|what we do|offer/i.test(t))return['We work in these areas. Tap one to know more:',[...list('service'),'Plan my project']];
 if(/solution|ready|product|erp|software for/i.test(t)&&!best(t,pub('service')))return['Ready solutions you can start with quickly. Tap one:',[...list('solution'),...list('product').slice(0,2),'Plan my project']];
 if(/industr|sector|who do you (work|serve)/i.test(t))return['We build for these industries. Tap yours:',[...list('industry').slice(0,7),'Plan my project']];
 if(/price|pricing|cost|plan|charge|rate|how much|fees/i.test(t)){const pl=pub('plan').map(p=>nice(p.title));return['Custom software is priced after a free consultation, with a written scope and fixed cost, so you pay only for what you need.'+(pl.length?'\n\nFor our ready solutions we offer: '+pl.join(', ')+'.':''),['Get a quote','Book a demo','Our services','Main menu']]}
 if(/demo|meeting|schedule|appointment|book a call|video call|zoom|google meet/i.test(t))return[T('demoMsg','You can book a free 30-minute demo with our team. Choose a date and time on our demo calendar.'),[{t:'Open demo calendar',href:'schedule.html'},'Get a quote','Main menu']];
 if(/rating|review|google|trusted|testimonial/i.test(t))return['Our customers rate us '+(s.rating||'4.7')+' on Google. We keep every project in writing, with demos every week, and support after launch.',['Plan my project','Case studies','Main menu']];
 if(/case stud|portfolio|work you|clients?/i.test(t)){const c=pub('casestudy').slice(0,3);return['Some of our work:\n\n'+c.map(i=>'• '+nice(i.title)+(i.metric?' – '+i.metric:'')).join('\n'),[...c.slice(0,2).map(i=>({t:nice(i.title).slice(0,32),href:uurl(i)})),'Plan my project']]}
 if(/where|address|location|office|visit|map/i.test(t))return['Our office: '+v.address+'.\nOpen '+v.hours+'.',[{t:'Open in Maps',href:'https://www.google.com/maps/search/'+encodeURIComponent(v.address)},'Talk to our team','Main menu']];
 if(/hour|timing|open|close/i.test(t))return['We are open '+v.hours+'.',['Talk to our team','Main menu']];
 if(/phone|call|email|mail|contact|whatsapp|number|reach/i.test(t)&&!/call me|callback|call back/i.test(t))return['You can reach us on +'+v.phone+' or '+v.email+'. We reply within one working day.',[{t:'Call us',href:'tel:+'+v.phone},{t:'WhatsApp',href:'https://wa.me/'+(s.whatsapp||v.phone).replace(/\D/g,'')},'Talk to our team']];
 if(/career|job|hiring|vacanc|intern/i.test(t))return['We hire developers, designers and marketers from time to time. See current openings on our careers page.',[{t:'View careers',href:'list.html?t=job'},'Main menu']];
 const it=best(t);if(it)return[infoOf(it),itemOpts(it)];
 return null}
function user(t){t=t.trim();if(!t||busy)return;S.msgs.push({role:'customer',text:t});queue.push({role:'customer',text:t});bubble('customer',t);qr.replaceChildren();save();inp.value='';flush();
 if(S.step)return step(t);
 if(/^(plan my project|get a quote|yes, continue)$/i.test(t)||eq(t,T('quoteAsk','Get a quote'))||/^(i need|i want|need|want) .*(software|app|website|portal|system)/i.test(t))return startPlan();
 if(/^get a quote for this$/i.test(t)){const l=[...S.msgs].reverse().find(m=>m.role==='bot'&&/^[^\n]+: /.test(m.text)),k=l&&byTitle(l.text.split(':')[0]);return startPlan(k?nice(k.title):'')}
 if(/^(talk to our team|talk to team|call me back|yes, call me back|callback|call back)$/i.test(t)||eq(t,T('talkAsk','Talk to our team'))||eq(t,T('callBack','Yes, call me back')))return startCall();
 if(/^book a demo$/i.test(t))return later(T('demoMsg','You can book a free 30-minute demo with our team. Choose a date and time on our demo calendar.'),[{t:'Open demo calendar',href:'schedule.html'},'Get a quote','Main menu']);
 const ex=byTitle(t);if(ex)return later(infoOf(ex),itemOpts(ex));
 const a=answer(t);if(a)return later(a[0],a[1]);
 later(T('fallback','I could not find that on our website. Would you like our team to call you back?'),['Talk to our team','Plan my project','Our services'])}
function open(){const p=$('skp');p.hidden=false;$('skb').hidden=true;
 if(!S.msgs.length){const g=TX('greeting','Namaste! I am the {name}. Tell me what you are looking for and I will guide you. Just tap an option below.');S.msgs.push({role:'bot',text:g});queue.push({role:'bot',text:g});save()}
 log.replaceChildren();S.msgs.forEach(m=>bubble(m.role,m.text));if(S.msgs.length<2)quick(menu());inp.focus()}
function close(){const p=$('skp');p.hidden=true;$('skb').hidden=false;resetChat();prog();$('skb').focus()}
$('skb').onclick=open;$('skx').onclick=close;$('skf').onsubmit=e=>{e.preventDefault();user(inp.value)};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('skp').hidden)close()});
})();
