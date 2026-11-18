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
const menu=()=>String(T('quick','Our services | Ready solutions | Pricing | Get a quote')).split('|').map(x=>x.trim()).filter(Boolean);
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

const bubble=(r,t)=>{const b=el('div','skc-m '+r,t);log.append(b);log.scrollTop=log.scrollHeight};
const quick=a=>{qr.replaceChildren(...a.map(t=>{const b=el('button',null,t);b.type='button';b.onclick=()=>user(t);return b}));log.scrollTop=log.scrollHeight};
function say(t,q){S.msgs.push({role:'bot',text:t});queue.push({role:'bot',text:t});bubble('bot',t);if(q)quick(q);else qr.replaceChildren();save();flush()}
const later=(t,q)=>{busy=true;const d=el('div','skc-m bot typing','…');log.append(d);log.scrollTop=log.scrollHeight;typingTimer=setTimeout(()=>{typingTimer=null;d.remove();busy=false;say(t,q)},450)};
const STOP=/^(development|application|services?|software|management|solutions?|online|your|and|for|with|the)$/;
function match(t){
 for(const [re,ans] of KB)if(re.test(t)){
  const q=[];if(/price|quote|cost/i.test(ans))q.push(T('quoteAsk','Get a quote'));q.push(menu()[0]);return[F(ans,vars()),q];
 }
 const w=t.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);let best=null,bs=0;
 for(const i of[...pub('service'),...pub('solution'),...pub('industry')]){
  const tw=i.title.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2&&!STOP.test(x));
  let sc=tw.filter(x=>w.some(y=>y.startsWith(x.slice(0,4))||x.startsWith(y.slice(0,4)))).length;
  if(re('wordsMobile','app|apps|android|ios|mobile').test(t)&&/mobile/i.test(i.title))sc+=2;
  if(re('wordsWeb','website|web|site').test(t)&&/website/i.test(i.title))sc+=2;
  if(sc>bs){bs=sc;best=i}
 }
 return best?[best.title+': '+best.excerpt,[T('quoteAsk','Get a quote'),menu()[0]]]:null;
}
const list=t=>pub(t).slice(0,8).map(i=>i.title).join(', ');
const phoneOk=v=>String(v).replace(/\D/g,'').length>=8;
async function send(){const L=S.lead,msg=TX('leadMsg','Chatbot enquiry. Needs: {need}');let ok=true;
 if(API){try{const r=await fetch(API+'/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:L.name,phone:L.phone,service:T('leadService','Chatbot enquiry'),message:msg})});ok=r.ok}catch(e){ok=false}}
 S.step='';flush({name:L.name,phone:L.phone});save();
 if(!API)return later(T('demo','Demo mode: nothing was sent. Once the backend is connected, your details will reach our team.'),menu());
 const okMsg=TX('thanks','Thank you {name}. Our team will contact you on {phone} within one working day.');
 const badMsg=TX('fail','Sorry, we could not send your details. Please call or WhatsApp us on +{phone}.');
 later(ok?okMsg:badMsg,menu())}
function step(t){const L=S.lead;
 if(S.step==='name'){L.name=t.slice(0,60);S.step='phone';return later(TX('nameNext','Nice to meet you, {name}. What is your phone number?'))}
 if(S.step==='phone'){if(!phoneOk(t))return later(T('phoneBad','Please enter a valid phone number with at least 8 digits.'));L.phone=t.slice(0,20);S.step='need';return later(T('needAsk','What do you need? One line is enough, for example "school software" or "mobile app".'))}
 if(S.step==='need'){L.need=t.slice(0,300);return send()}}
function user(t){t=t.trim();if(!t||busy)return;S.msgs.push({role:'customer',text:t});queue.push({role:'customer',text:t});bubble('customer',t);qr.replaceChildren();save();inp.value='';flush();
 if(S.step)return step(t);
 const q=menu();
 if(is(t,'quoteAsk','Get a quote')||is(t,'talkAsk','Talk to our team')||is(t,'callBack','Yes, call me back')||eq(t,'get a quote')||eq(t,'talk to our team')||eq(t,'yes, call me back')||eq(t,'call me back')){S.step='name';S.lead={};return later(T('nameAsk','Happy to help. What is your name?'))}
 if(q[0]&&eq(t,q[0]))return later(T('services','We offer: {list}.').replace('{list}',list('service')),[T('mobileAsk','Mobile apps'),T('quoteAsk','Get a quote')]);
 if(q[1]&&eq(t,q[1]))return later(T('solutions','Ready solutions: {list}.').replace('{list}',list('solution')),[T('quoteAsk','Get a quote')]);
 const m=match(t);if(m)return later(m[0],m[1]);
 later(T('fallback','I could not find that on our website. Would you like our team to call you back?'),[T('callBack','Yes, call me back'),q[0]])}
function open(){const p=$('skp');p.hidden=false;$('skb').hidden=true;
 if(!S.msgs.length){const g=TX('greeting','Namaste! I am the {name}. How can I help you today?');S.msgs.push({role:'bot',text:g});queue.push({role:'bot',text:g});save()}
 log.replaceChildren();S.msgs.forEach(m=>bubble(m.role,m.text));if(S.msgs.length<2)quick(menu());inp.focus()}
function close(){const p=$('skp');p.hidden=true;$('skb').hidden=false;resetChat();$('skb').focus()}
$('skb').onclick=open;$('skx').onclick=close;$('skf').onsubmit=e=>{e.preventDefault();user(inp.value)};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('skp').hidden)close()});
})();
