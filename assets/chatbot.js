/* Siddhi chatbot (guided, no AI service needed). Answers come from the site's own content.
   Every conversation is sent to the backend (/api/chat) and appears in Admin > Chat sheets. */
(()=>{
if(window.__skChat)return;window.__skChat=1;
const C=window.SITE_CONFIG||{},API=(C.API_BASE||'').replace(/\/$/,''),K='sk_chat_v1';
let S={sid:'',msgs:[],step:'',lead:{}},queue=[],busy=false;
try{S=Object.assign(S,JSON.parse(localStorage[K]||'{}'))}catch(e){}
const uid=()=>crypto.randomUUID?crypto.randomUUID():'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
if(!/^[A-Za-z0-9_-]{8,64}$/.test(S.sid||''))S.sid=uid();
const save=()=>{try{localStorage[K]=JSON.stringify(S)}catch(e){}},db=()=>window.SITE_DB||{settings:{},items:[]};
const pub=t=>db().items.filter(i=>i.type===t&&i.published!==false);
function flush(extra){if(!API||!S.msgs.some(m=>m.role==='customer')||(!queue.length&&!extra))return;
 fetch(API+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({sid:S.sid,page:location.href.split('#')[0].slice(0,200),messages:queue.splice(0),...(extra||{})})}).catch(()=>{})}
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const root=el('div','skc-root');
root.innerHTML=`<button class="skc-btn" id="skb" aria-label="Chat with Siddhi Assistant"><img src="assets/logo.png" alt="" width="44" height="38"></button>
<section class="skc" id="skp" role="dialog" aria-label="Chat" hidden><header><img src="assets/logo.png" alt="" width="40" height="35"><div><b>Siddhi Assistant</b><small>Ask about services, pricing or support</small></div><button id="skx" aria-label="Close chat">✕</button></header><div class="skc-log" id="skl" aria-live="polite"></div><div class="skc-qr" id="skq"></div><form id="skf"><input id="ski" maxlength="300" placeholder="Type your message" autocomplete="off" aria-label="Message"><button>Send</button></form><p class="skc-note" id="skn"></p></section>`;
document.body.append(root);
window.addEventListener('sitedata',()=>{const i=((window.SITE_DB||{}).settings||{}).chatIcon,m=root.querySelector('#skb img');if(i&&m)m.src=i});
const $=id=>document.getElementById(id),log=$('skl'),qr=$('skq'),inp=$('ski');
$('skn').textContent=API?'Your messages are saved so our team can follow up.':'Demo mode: messages are not saved or sent.';
const bubble=(r,t)=>{const b=el('div','skc-m '+r,t);log.append(b);log.scrollTop=log.scrollHeight};
const quick=a=>{qr.replaceChildren(...a.map(t=>{const b=el('button',null,t);b.type='button';b.onclick=()=>user(t);return b}));log.scrollTop=log.scrollHeight};
function say(t,q){S.msgs.push({role:'bot',text:t});queue.push({role:'bot',text:t});bubble('bot',t);if(q)quick(q);else qr.replaceChildren();save();flush()}
const later=(t,q)=>{busy=true;const d=el('div','skc-m bot typing','…');log.append(d);log.scrollTop=log.scrollHeight;setTimeout(()=>{d.remove();busy=false;say(t,q)},450)};
const MENU=['Our services','Ready solutions','Pricing','Get a quote'];
const STOP=/^(development|application|services?|software|management|solutions?|online|your|and|for|with|the)$/;
const KB=[
[/^(hi|hello|hey|namaste|namaskar|hii)\b/i,()=>'Namaste! I am the Siddhi Assistant. How can I help you today?',MENU],
[/(thank|thanks|shukriya|dhanyavad)/i,()=>'You are welcome! Anything else I can help with?',MENU],
[/(price|pricing|cost|quote|charge|rate|kitna paisa|kitne paise|paise|fees)/i,()=>'The price depends on scope, so I do not want to guess a number. Share your requirement and our team will send a clear written quote.',['Get a quote','Our services']],
[/(hours|opening|timings?|open on|kab khulta)/i,()=>'Our office hours: '+(db().settings.hours||'Mo-Sa 10:00-19:00').replace('Mo-Sa','Monday to Saturday')+'.'],
[/(how long|timeline|duration|kitna time|kab tak|kitne din|weeks)/i,()=>'A business website usually takes 2 to 4 weeks. Web apps and mobile apps depend on scope and are quoted after a short discovery call.',['Get a quote']],
[/(support|maintenance|after launch|bug)/i,()=>'Yes. We give 24x7 online support and maintenance after go-live.'],
[/(where|address|location|office|kahan|map)/i,()=>{const s=db().settings;return 'Our office: '+[s.address,s.city,s.state,s.postal].filter(Boolean).join(', ')+'.'}],
[/(phone|call me|number|contact|whatsapp|email|mail)/i,()=>{const s=db().settings;return 'Call or WhatsApp +'+s.phone+' or email '+s.email+'. Or leave your number here and we will call you.'},['Talk to our team']]];
function match(t){for(const k of KB)if(k[0].test(t))return[k[1](),k[2]];
 const w=t.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);let best=null,bs=0;
 for(const i of[...pub('service'),...pub('solution'),...pub('industry')]){const tw=i.title.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2&&!STOP.test(x));let sc=tw.filter(x=>w.some(y=>y.startsWith(x.slice(0,4))||x.startsWith(y.slice(0,4)))).length;if(/\b(app|apps|android|ios|mobile)\b/i.test(t)&&/mobile/i.test(i.title))sc+=2;if(/\b(website|web|site)\b/i.test(t)&&/website/i.test(i.title))sc+=2;if(sc>bs){bs=sc;best=i}}
 return best?[best.title+': '+best.excerpt,['Get a quote','Our services']]:null}
function list(t){return pub(t).slice(0,8).map(i=>i.title).join(', ')}
const phoneOk=v=>String(v).replace(/\D/g,'').length>=8;
async function send(){const L=S.lead,msg='Chatbot enquiry. Needs: '+L.need;let ok=true;
 if(API){try{const r=await fetch(API+'/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:L.name,phone:L.phone,service:'Chatbot enquiry',message:msg})});ok=r.ok}catch(e){ok=false}}
 S.step='';flush({name:L.name,phone:L.phone});save();
 if(!API)return later('Demo mode: nothing was sent. Once the backend is connected, your details will reach our team.',MENU);
 later(ok?'Thank you '+L.name+'. Our team will contact you on '+L.phone+' within one working day.':'Sorry, we could not send your details. Please call or WhatsApp us on +'+db().settings.phone+'.',MENU)}
function step(t){const L=S.lead;
 if(S.step==='name'){L.name=t.slice(0,60);S.step='phone';return later('Nice to meet you, '+L.name+'. What is your phone number?')}
 if(S.step==='phone'){if(!phoneOk(t))return later('Please enter a valid phone number with at least 8 digits.');L.phone=t.slice(0,20);S.step='need';return later('What do you need? One line is enough, for example "school software" or "mobile app".')}
 if(S.step==='need'){L.need=t.slice(0,300);return send()}}
function user(t){t=t.trim();if(!t||busy)return;S.msgs.push({role:'customer',text:t});queue.push({role:'customer',text:t});bubble('customer',t);qr.replaceChildren();save();inp.value='';flush();
 if(S.step)return step(t);
 if(/^(get a quote|talk to our team|yes, call me back|call me back)$/i.test(t)){S.step='name';S.lead={};return later('Happy to help. What is your name?')}
 if(/^our services$/i.test(t))return later('We offer: '+list('service')+'.',['Mobile apps','Pricing','Get a quote']);
 if(/^ready solutions$/i.test(t))return later('Ready solutions: '+list('solution')+'.',['Pricing','Get a quote']);
 const m=match(t);if(m)return later(m[0],m[1]);
 later('I could not find that on our website. Would you like our team to call you back?',['Yes, call me back','Our services'])}
function open(){const p=$('skp');p.hidden=false;$('skb').hidden=true;if(!S.msgs.length){S.msgs.push({role:'bot',text:'Namaste! I am the Siddhi Assistant. How can I help you today?'});queue.push(S.msgs[0]);save()}
 log.replaceChildren();S.msgs.forEach(m=>bubble(m.role,m.text));if(S.msgs.length<2)quick(MENU);inp.focus()}
$('skb').onclick=open;$('skx').onclick=()=>{$('skp').hidden=true;$('skb').hidden=false};$('skf').onsubmit=e=>{e.preventDefault();user(inp.value)};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('skp').hidden)$('skx').onclick()});
})();
