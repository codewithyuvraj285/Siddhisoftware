/* Schedule a Demo: Calendly-style booking flow (date -> time -> details -> confirmation).
   Bookings are sent to the backend as leads (Admin > Leads) with the chosen slot.
   Edit the availability in SCH below. Times are in India time (IST). */
(()=>{
const SCH={
  title:'Schedule a Demo',            // heading on the left panel
  minutes:30,                         // length of one demo
  days:[1,2,3,4,5,6],                 // 0=Sun ... 6=Sat (Sunday off)
  from:'10:00',to:'18:00',            // working hours in IST
  breakFrom:'13:00',breakTo:'14:00',  // lunch break (no slots). Set both to '' for none
  ahead:60,                           // how many days ahead can be booked
  noticeHours:4,                      // earliest booking = now + this many hours
  tzList:['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','Europe/Berlin','America/New_York','America/Chicago','America/Los_Angeles','Australia/Sydney']
};
/* Availability and every label are controlled from Admin > Settings (Schedule) and Admin > Settings > Website labels. Defaults stay here as a safety net. */
const T=(k,d)=>{try{return window.SITE_TX?window.SITE_TX(k,d):d}catch(e){return d}};
const applyCfg=()=>{const x=(window.SITE_DB&&window.SITE_DB.settings)||{},num=(v,d)=>{v=parseFloat(v);return isFinite(v)&&v>0?v:d},tm=(v,d)=>/^\d{1,2}:\d{2}$/.test(String(v||'').trim())?String(v).trim():d;
  SCH.title=T('schedTitle',SCH.title);SCH.minutes=num(x.schedMinutes,SCH.minutes);
  const dd=String(x.schedDays==null?'':x.schedDays).split(/[ ,]+/).filter(a=>/^[0-6]$/.test(a)).map(Number);if(dd.length)SCH.days=dd;
  SCH.from=tm(x.schedFrom,SCH.from);SCH.to=tm(x.schedTo,SCH.to);
  if(x.schedBreakFrom===''||x.schedBreakTo===''){}else{SCH.breakFrom=tm(x.schedBreakFrom,SCH.breakFrom);SCH.breakTo=tm(x.schedBreakTo,SCH.breakTo)}
  if(x.schedNoBreak){SCH.breakFrom='';SCH.breakTo=''}
  SCH.ahead=Math.round(num(x.schedAhead,SCH.ahead));if(x.schedNotice!==undefined&&x.schedNotice!==''&&isFinite(parseFloat(x.schedNotice)))SCH.noticeHours=Math.max(0,parseFloat(x.schedNotice));
  const z=String(x.schedZones||'').split(/[\n,]+/).map(a=>a.trim()).filter(Boolean).filter(a=>{try{new Intl.DateTimeFormat('en',{timeZone:a});return true}catch(e){return false}});if(z.length)SCH.tzList=z};
const CFG=window.SITE_CONFIG||{},API=(CFG.API_BASE||'').replace(/\/$/,'');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IST=330*6e4,MIN=6e4;
const hm=t=>{const a=String(t).split(':');return(+a[0])*60+(+a[1]||0)};
let tz=(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Kolkata'}catch(e){return'Asia/Kolkata'}})();
const zones=()=>{const z=[tz,...SCH.tzList];return z.filter((a,i)=>z.indexOf(a)===i)};
const zname=z=>{try{const n=new Intl.DateTimeFormat('en-US',{timeZone:z,timeZoneName:'long'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName');return n?n.value:z}catch(e){return z}};
const fTime=(d,z)=>new Intl.DateTimeFormat('en-US',{timeZone:z,hour:'numeric',minute:'2-digit',hour12:true}).format(d).replace(/\s?(AM|PM)/,(m,a)=>' '+a.toLowerCase());
const fKey=(d,z)=>new Intl.DateTimeFormat('en-CA',{timeZone:z,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const fLong=(d,z)=>new Intl.DateTimeFormat('en-US',{timeZone:z,weekday:'long',month:'long',day:'numeric'}).format(d);
const fFull=(d,z)=>new Intl.DateTimeFormat('en-US',{timeZone:z,weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(d);
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

let all=[],booked=new Set(),st={y:0,m:0,key:'',slot:null,step:1,guests:false,apiDown:false};
/* every bookable slot as a real moment in time (IST working hours) */
function build(){
  all=[];const now=Date.now(),min=now+SCH.noticeHours*36e5,t0=new Date(now+IST);
  const y0=t0.getUTCFullYear(),m0=t0.getUTCMonth(),d0=t0.getUTCDate();
  for(let i=0;i<=SCH.ahead;i++){
    const day=new Date(Date.UTC(y0,m0,d0+i));if(!SCH.days.includes(day.getUTCDay()))continue;
    for(let t=hm(SCH.from);t+SCH.minutes<=hm(SCH.to);t+=SCH.minutes){
      if(SCH.breakFrom&&t<hm(SCH.breakTo)&&t+SCH.minutes>hm(SCH.breakFrom))continue;
      const ts=Date.UTC(day.getUTCFullYear(),day.getUTCMonth(),day.getUTCDate())+t*MIN-IST;
      if(ts>=min&&!booked.has(new Date(ts).toISOString()))all.push(ts)}}
}
/* WhatsApp fallback: if online booking cannot reach the server, the visitor can still send the chosen slot to the team */
const waNum=()=>{const s=(window.SITE_DB&&window.SITE_DB.settings)||{};return String(s.whatsapp||s.phone||'').replace(/\D/g,'')};
const waLink=d=>{const n=waNum();if(!n)return'';const t=['Demo booking request','Time (IST): '+fFull(new Date(st.slot),'Asia/Kolkata')+', '+fTime(new Date(st.slot),'Asia/Kolkata'),'Name: '+d.name,'Phone: '+d.phone,'Email: '+d.email,d.service?'Interested in: '+d.service:'',d.message?'Notes: '+d.message:''].filter(Boolean).join('\n');return'https://wa.me/'+n+'?text='+encodeURIComponent(t)};
const warn=()=>st.apiDown?'<p class="swarn" role="alert" style="background:var(--tint);border:1px solid var(--amb);border-radius:10px;padding:10px 14px;margin:0 0 16px;font-size:14px">Online booking is temporarily unavailable. You can still choose a time; we will give you a WhatsApp button to confirm it with our team.</p>':'';
const byKey=()=>{const o={};for(const ts of all){const k=fKey(new Date(ts),tz);(o[k]=o[k]||[]).push(ts)}return o};
const root=()=>document.getElementById('sch');
const left=extra=>`<div class="sl"><p class="sbn">${esc((window.SITE_DB&&window.SITE_DB.settings&&window.SITE_DB.settings.brand)||'Siddhi Softwares')}</p><h1>${esc(SCH.title)}</h1><p class="si"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${SCH.minutes} min</p><p class="si"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>${esc(T('schedWeb','Web conferencing details provided upon confirmation.'))}</p>${extra||''}</div>`;
const tzSel=()=>`<div class="stz"><b>${esc(T('schedTz','Time zone'))}</b><label class="tzl"><span aria-hidden="true">🌐</span><select id="tz" aria-label="${esc(T('schedTz','Time zone'))}">${zones().map(z=>`<option value="${esc(z)}"${z===tz?' selected':''}>${esc(zname(z))} (${esc(fTime(new Date(),z))})</option>`).join('')}</select></label></div>`;

function cal(){
  const days=byKey(),first=new Date(Date.UTC(st.y,st.m,1)),n=new Date(Date.UTC(st.y,st.m+1,0)).getUTCDate(),off=(first.getUTCDay()+6)%7,todayK=fKey(new Date(),tz);
  const keys=Object.keys(days).sort(),minK=keys[0]||todayK,maxK=keys[keys.length-1]||todayK;
  const ym=(y,m)=>y*12+m,lo=ym(+minK.slice(0,4),+minK.slice(5,7)-1),hi=ym(+maxK.slice(0,4),+maxK.slice(5,7)-1),cur=ym(st.y,st.m);
  let g='';for(let i=0;i<off;i++)g+='<i></i>';
  for(let d=1;d<=n;d++){const k=`${st.y}-${String(st.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,ok=!!days[k];
    g+=`<button type="button" class="d${ok?' ok':''}${k===st.key?' on':''}${k===todayK?' td':''}" data-k="${k}" ${ok?'':'disabled'} aria-label="${MONTHS[st.m]} ${d}${ok?'':' unavailable'}">${d}</button>`}
  return`<div class="cm"><button type="button" class="nv" id="pv" aria-label="Previous month" ${cur<=lo?'disabled':''}>‹</button><b>${MONTHS[st.m]} ${st.y}</b><button type="button" class="nv" id="nx" aria-label="Next month" ${cur>=hi?'disabled':''}>›</button></div><div class="cg h">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<span>${x}</span>`).join('')}</div><div class="cg">${g}</div>${tzSel()}`;
}
function times(){
  const list=(byKey()[st.key]||[]);
  return`<div class="tp"><p class="td2">${esc(fLong(new Date(list[0]||Date.now()),tz))}</p><div class="tl">${list.map(ts=>{const on=st.slot===ts;return on?`<div class="t2"><span>${esc(fTime(new Date(ts),tz))}</span><button type="button" class="nxt" id="nxt">${esc(T('schedNext','Next'))}</button></div>`:`<button type="button" class="t" data-t="${ts}">${esc(fTime(new Date(ts),tz))}</button>`}).join('')||`<p class="mu">${esc(T('schedNone','No times available.'))}</p>`}</div></div>`;
}
function step1(){
  const r=root();r.className='sch'+(st.key?' wide':'');
  r.innerHTML=left()+`<div class="sr">${warn()}<h2>${esc(T('schedSelect','Select a Date & Time'))}</h2><div class="sx"><div class="sc1">${cal()}</div>${st.key?times():''}</div></div>`;
  r.querySelectorAll('.d.ok').forEach(b=>b.onclick=()=>{st.key=b.dataset.k;st.slot=null;step1()});
  r.querySelectorAll('.t').forEach(b=>b.onclick=()=>{st.slot=+b.dataset.t;step1()});
  const nx=r.querySelector('#nxt');if(nx)nx.onclick=()=>{st.step=2;step2()};
  const pv=r.querySelector('#pv'),nn=r.querySelector('#nx');
  const mv=d=>{st.m+=d;if(st.m<0){st.m=11;st.y--}if(st.m>11){st.m=0;st.y++}step1()};
  if(pv)pv.onclick=()=>mv(-1);if(nn)nn.onclick=()=>mv(1);
  r.querySelector('#tz').onchange=e=>{tz=e.target.value;st.key='';st.slot=null;init(true)};
}
const when=()=>{const d=new Date(st.slot),e=new Date(st.slot+SCH.minutes*MIN);return`${fTime(d,tz)} - ${fTime(e,tz)}, ${fFull(d,tz)}`};
const info=()=>`<p class="si"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>${esc(when())}</p><p class="si"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>${esc(zname(tz))}</p>`;
function step2(){
  const r=root();r.className='sch';
  const s=(window.SITE_DB&&window.SITE_DB.items||[]).filter(i=>(i.type==='product'||i.type==='service')&&i.published!==false);
  const pre=new URLSearchParams(location.search).get('for')||'';
  r.innerHTML=left('').replace('<div class="sl">','<div class="sl"><button type="button" class="bk" id="bk" aria-label="Back">←</button>').replace('</div>',info()+'</div>')+`<div class="sr">${warn()}<h2>${esc(T('schedDetails','Enter Details'))}</h2><form id="sf" class="form sf"><label>${esc(T('schedName','Name'))} *<input name="name" required maxlength="80" autocomplete="name"></label><label>${esc(T('schedEmail','Email'))} *<input name="email" type="email" required maxlength="120" autocomplete="email"></label><label>${esc(T('schedPhone','Phone'))} *<input name="phone" type="tel" required maxlength="20" autocomplete="tel"></label><label>Which solution do you want to see?<select name="service"><option value="">Not sure yet</option>${s.map(i=>`<option${i.title===pre?' selected':''}>${esc(i.title)}</option>`).join('')}</select></label><div id="gw">${st.guests?'<label>Guest emails (comma separated)<input name="guests" maxlength="200"></label>':'<button type="button" class="btn ghost sm" id="ag">Add guests</button>'}</div><label>Please share anything that will help prepare for our meeting.<textarea name="message" rows="3" maxlength="500"></textarea></label><input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="tos">By proceeding, you confirm that we may contact you about this demo.</p><button class="btn" id="go">${esc(T('schedConfirm','Schedule Event'))}</button><p class="msg" id="sm" role="status"></p></form></div>`;
  r.querySelector('#bk').onclick=()=>{st.step=1;step1()};
  const ag=r.querySelector('#ag');if(ag)ag.onclick=()=>{st.guests=true;ag.parentNode.innerHTML='<label>Guest emails (comma separated)<input name="guests" maxlength="200"></label>'};
  const f=r.querySelector('#sf'),m=r.querySelector('#sm'),go=r.querySelector('#go');
  f.onsubmit=async e=>{e.preventDefault();m.textContent='';const d=Object.fromEntries(new FormData(f));go.disabled=true;
    const msg=['DEMO BOOKING','Slot (IST): '+fFull(new Date(st.slot),'Asia/Kolkata')+', '+fTime(new Date(st.slot),'Asia/Kolkata')+' - '+fTime(new Date(st.slot+SCH.minutes*MIN),'Asia/Kolkata'),'Customer time zone: '+tz+' ('+fTime(new Date(st.slot),tz)+')',d.guests?'Guests: '+d.guests:'',d.message?'Notes: '+d.message:''].filter(Boolean).join('\n');
    let x=null;
    try{if(!API)throw 1;x=await fetch(API+'/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:d.name,email:d.email,phone:d.phone,service:'Demo: '+(d.service||'General'),message:msg,website:d.website,slot:new Date(st.slot).toISOString()})})}catch(err){x=null}
    if(x&&x.ok){st.apiDown=false;let mj={};try{mj=await x.json()}catch(e){}return done(d,!!mj.mail)}
    if(x&&x.status===409){booked.add(new Date(st.slot).toISOString());st.slot=null;st.step=1;init(true);alert('Sorry, this time was just booked. Please pick another time.');return}
    go.disabled=false;
    let why=!API?'Online booking is not connected yet.':'We could not reach the booking server.';
    if(x&&x.status===429)why='Too many requests from your network. Please wait a few minutes and try again.';
    else if(x&&x.status===400){let j={};try{j=await x.json()}catch(e){}
      if(/time/i.test(j.error||'')){st.slot=null;st.step=1;init(true);alert('This time is no longer available. Please pick another time.');return}
      why=(j.error||'Please check your details')+'.'}
    else if(x)why='The booking server had a problem.';
    const wa=waLink(d);
    m.innerHTML=esc(why)+(wa?' <a href="'+esc(wa)+'" target="_blank" rel="noopener">'+esc(T('schedWa','Send this booking request on WhatsApp'))+'</a>':' Please call us to confirm your time.');
  };
}
const pad=n=>String(n).padStart(2,'0'),iso=ts=>{const d=new Date(ts);return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+pad(d.getUTCMinutes())+'00Z'};
function done(d,mail){
  const r=root(),ti='Demo with Siddhi Softwares',a=iso(st.slot),b=iso(st.slot+SCH.minutes*MIN);
  const g='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(ti)+'&dates='+a+'/'+b+'&details='+encodeURIComponent('Web conferencing details will be sent to '+d.email);
  const ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Siddhi Softwares//Demo//EN\r\nBEGIN:VEVENT\r\nUID:'+a+'@siddhisoftwares\r\nDTSTAMP:'+iso(Date.now())+'\r\nDTSTART:'+a+'\r\nDTEND:'+b+'\r\nSUMMARY:'+ti+'\r\nEND:VEVENT\r\nEND:VCALENDAR';
  r.className='sch ok';
  r.innerHTML=`<div class="cf"><div class="ck" aria-hidden="true">✓</div><h2>${esc(T('schedDone','Your meeting is successfully scheduled'))}</h2><p class="mu">${mail&&d.email?esc(T('schedMailSent','A confirmation has been sent to'))+' '+esc(d.email)+'. ':''}${esc(T('schedLinkLater','We will share the meeting link before the demo.'))}</p><div class="cb"><h3>${esc(SCH.title)}</h3><p class="si"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${SCH.minutes} min</p>${info()}</div><div class="acts" style="justify-content:center"><a class="btn sm" href="${esc(g)}" target="_blank" rel="noopener">${esc(T('schedGcal','Add to Google Calendar'))}</a><a class="btn ghost sm" download="siddhi-demo.ics" href="data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}">${esc(T('schedIcs','Download .ics'))}</a><a class="btn ghost sm" href="index.html">${esc(T('schedHome','Back to home'))}</a></div></div>`;
}
async function init(keep){
  if(!keep&&API){try{const r=await fetch(API+'/api/booked',{cache:'no-store'});if(r.ok){booked=new Set(await r.json());st.apiDown=false}else st.apiDown=true}catch(e){st.apiDown=true}}
  if(!API)st.apiDown=true;
  applyCfg();build();
  if(!keep||!st.y){const k=Object.keys(byKey()).sort()[0]||fKey(new Date(),tz);st.y=+k.slice(0,4);st.m=+k.slice(5,7)-1}
  else{const k=Object.keys(byKey()).sort()[0];if(k){st.y=+k.slice(0,4);st.m=+k.slice(5,7)-1}}
  step1();
}
let started=false;const go=()=>{if(started||!root())return;started=true;init(false)};
window.addEventListener('sitedata',go);if(window.SITE_DB&&root())go();
})();
