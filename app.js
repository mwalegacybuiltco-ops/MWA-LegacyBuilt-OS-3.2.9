/* © 2025 MWA LegacyBuiltCO™ — LegacyBuilt Command OS™ v3.2.9
   Created by April Lungal. All Rights Reserved. */
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));

// Storage wrapper (works across browsers)
const LBStore = (()=>{
  try{
    const t='__lbtest__'+Date.now(); localStorage.setItem(t,'1'); localStorage.removeItem(t);
    return {
      get:(k)=>{ const v=localStorage.getItem(k); try{return JSON.parse(v);}catch(e){return v;} },
      set:(k,v)=> localStorage.setItem(k, typeof v==='string'? v : JSON.stringify(v)),
      remove:(k)=> localStorage.removeItem(k),
    };
  }catch(e){
    console.warn('LocalStorage unavailable; using in-memory store');
    const mem={};
    return { get:(k)=>mem[k], set:(k,v)=>{mem[k]=v}, remove:(k)=>{delete mem[k]} };
  }
})();

// Nav with delegation + guards
function nav(tab){
  try{
    $$('.tab').forEach(t=>t.classList.add('hide'));
    const tgt = document.getElementById(`tab-${tab}`);
    if(tgt){ tgt.classList.remove('hide'); }
    $$('.nav button').forEach(b=>{
      b.classList.toggle('active', b.dataset.tab===tab);
    });
    LBStore.set('lb_active_tab', tab);
    if(tab==='calendar'){ renderCalendar(); renderUpcoming(); }
    if(tab==='system'){ refreshStats(); }
    if(tab==='brand'){ renderBrandPreview(); }
    if(tab==='planner'){ plRender(); }
  }catch(e){ $('#status').textContent='Nav error: '+e.message; }
}
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-tab]');
  if(btn){ e.preventDefault(); nav(btn.dataset.tab); }
});

window.addEventListener('load', ()=>{
  const t = LBStore.get('lb_active_tab') || 'dashboard';
  nav(t);
  loadFocus(); loadLeads(); loadTextAreas(); loadLibrary(); renderCalendar(); renderUpcoming(); refreshStats(); renderBrandPreview(); qiRender(); qiTotals(); qtRender(); loadWins(); plRender();
});

function toast(msg){ $('#status').textContent = msg; setTimeout(()=>$('#status').textContent='Ready', 1500); }

/* Dashboard */
function saveFocus(){ LBStore.set('lb_focus', $('#focus').value||''); $('#focusSaved').textContent='Saved ✅'; toast('Focus saved'); }
function loadFocus(){ $('#focus').value = LBStore.get('lb_focus') || ''; }

/* Quick Income + Quick Tasks */
function qiGet(){ return LBStore.get('lb_qi')||[]; }
function qiSet(a){ LBStore.set('lb_qi', a); }
function qiTotals(){
  const list=qiGet(); const total=list.reduce((s,it)=>s+Number(it.amt||0),0);
  const done=list.filter(it=>!!it.done); const doneTotal = done.reduce((s,it)=>s+Number(it.amt||0),0);
  const el=$('#qiTotals'); if(el){ el.textContent=`Total planned: $${total.toFixed(2)} • Completed: $${doneTotal.toFixed(2)} (${done.length}/${list.length})`; }
}
function qiRender(){
  const c=$('#qiList'); c.innerHTML='';
  qiGet().forEach((item, idx)=>{
    const div=document.createElement('div'); div.className='row'; div.style.margin='6px 0';
    div.innerHTML = `
      <input type="checkbox" ${item.done?'checked':''} data-idx="${idx}" class="qiChk" style="flex:0 0 20px;">
      <input value="${item.text||''}" data-idx="${idx}" class="qiTxt">
      <input type="number" step="0.01" value="${item.amt??''}" data-idx="${idx}" class="qiAmt" style="max-width:140px" placeholder="$">
      <button class="ghost" data-act="del" data-idx="${idx}">Delete</button>`;
    c.appendChild(div);
  });
  c.onclick=(e)=>{
    const idx=e.target.getAttribute('data-idx'); if(idx==null) return;
    const list=qiGet();
    if(e.target.classList.contains('qiChk')){ list[idx].done=e.target.checked; }
    if(e.target.dataset.act==='del'){ list.splice(idx,1); }
    qiSet(list); qiRender(); qiTotals();
  };
  c.oninput=(e)=>{
    const idx=e.target.getAttribute('data-idx'); if(idx==null) return;
    const list=qiGet();
    if(e.target.classList.contains('qiTxt')) list[idx].text=e.target.value;
    if(e.target.classList.contains('qiAmt')) list[idx].amt=e.target.value;
    qiSet(list); qiTotals();
  };
}
function qiAdd(){
  const v=($('#qiInput').value||'').trim(); const amt=Number($('#qiAmt').value||0);
  if(!v) return; const list=qiGet(); list.push({text:v, done:false, amt:isNaN(amt)?0:amt});
  qiSet(list); $('#qiInput').value=''; $('#qiAmt').value=''; qiRender(); qiTotals();
}

function qtGet(){ return LBStore.get('lb_qt')||[]; }
function qtSet(a){ LBStore.set('lb_qt', a); }
function qtRender(){
  const c=$('#qtList'); c.innerHTML='';
  qtGet().forEach((item, idx)=>{
    const div=document.createElement('div'); div.className='row'; div.style.margin='6px 0';
    div.innerHTML = `
      <input type="checkbox" ${item.done?'checked':''} data-idx="${idx}" class="qtChk" style="flex:0 0 20px;">
      <input value="${item.text||''}" data-idx="${idx}" class="qtTxt">
      <button class="ghost" data-act="del" data-idx="${idx}">Delete</button>`;
    c.appendChild(div);
  });
  c.onclick=(e)=>{
    const idx=e.target.getAttribute('data-idx'); if(idx==null) return;
    const list=qtGet();
    if(e.target.classList.contains('qtChk')){ list[idx].done=e.target.checked; }
    if(e.target.dataset.act==='del'){ list.splice(idx,1); }
    qtSet(list); qtRender();
  };
  c.oninput=(e)=>{
    const idx=e.target.getAttribute('data-idx'); if(idx==null) return;
    const list=qtGet();
    if(e.target.classList.contains('qtTxt')) list[idx].text=e.target.value;
    qtSet(list);
  };
}
function qtAdd(){
  const v=($('#qtInput').value||'').trim(); if(!v) return;
  const list=qtGet(); list.push({text:v, done:false}); qtSet(list); $('#qtInput').value=''; qtRender();
}

/* Leads + Calendar data */
function getLeads(){ return LBStore.get('lb_leads')||[]; }
function setLeads(arr){ LBStore.set('lb_leads', arr); }
function addLead(){
  const lead={
    id: Date.now(),
    name: $('#leadName').value.trim(),
    platform: $('#leadPlatform').value.trim(),
    contact: $('#leadContact').value.trim(),
    notes: $('#leadNotes').value.trim(),
    follow: $('#leadFollow').value
  };
  if(!lead.name){ alert('Name is required'); return; }
  if(!lead.follow){ alert('Follow-up date/time is required to add to Calendar'); return; }
  const leads=getLeads(); leads.push(lead); setLeads(leads);
  $('#leadSaved').textContent='Lead saved and added to Upcoming ✅';
  ['leadName','leadPlatform','leadContact','leadNotes','leadFollow'].forEach(id=>$('#'+id).value='');
  loadLeads(); renderUpcoming(); refreshStats(); renderCalendar(); toast('Lead saved');
}
function loadLeads(){
  const container=$('#leadList'); container.innerHTML='';
  const leads=getLeads().sort((a,b)=> (a.follow||'').localeCompare(b.follow||''));
  leads.forEach(ld=>{
    const div=document.createElement('div'); div.className='card';
    div.innerHTML=`
      <div><strong>${ld.name}</strong> • ${ld.platform||''} • <span class="small">${ld.contact||''}</span></div>
      <div class="small">${ld.notes||''}</div>
      <div class="row">
        <input type="datetime-local" value="${ld.follow||''}" data-id="${ld.id}" class="fField" />
        <button class="ghost" data-act="save" data-id="${ld.id}">Save</button>
        <button class="ghost" data-act="del" data-id="${ld.id}">Delete</button>
      </div>`;
    container.appendChild(div);
  });
  container.onclick=(e)=>{
    const id=e.target.getAttribute('data-id'); if(!id) return;
    const leads=getLeads(); const idx=leads.findIndex(x=> String(x.id)===String(id)); if(idx<0) return;
    const act=e.target.getAttribute('data-act');
    if(act==='del'){ leads.splice(idx,1); setLeads(leads); loadLeads(); renderUpcoming(); refreshStats(); renderCalendar(); toast('Lead deleted'); }
    if(act==='save'){ const f=container.querySelector(`input.fField[data-id="${id}"]`).value; leads[idx].follow=f; setLeads(leads); renderUpcoming(); refreshStats(); renderCalendar(); toast('Lead updated'); }
  };
}

/* Calendar view (month grid + upcoming) */
const calState = (()=>{ const d=new Date(); return { y:d.getFullYear(), m:d.getMonth() }; })();
function calTitleText(y,m){ return new Date(y,m,1).toLocaleString(undefined,{month:'long',year:'numeric'}); }
function calPrev(){ calState.m--; if(calState.m<0){ calState.m=11; calState.y--; } renderCalendar(); }
function calNext(){ calState.m++; if(calState.m>11){ calState.m=0; calState.y++; } renderCalendar(); }
function renderCalendar(){
  const y=calState.y, m=calState.m; $('#calTitle').textContent=calTitleText(y,m);
  const grid=$('#calGrid'); grid.innerHTML='';
  const first=new Date(y,m,1); const startDay=first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  let day=1; const leads=getLeads();
  const rows = Math.ceil((startDay + daysInMonth)/7);
  for(let r=0;r<rows;r++){
    for(let c=0;c<7;c++){
      const cell=document.createElement('div'); cell.className='cal-cell';
      const idx=r*7+c;
      if(idx>=startDay && day<=daysInMonth){
        const dStr = new Date(y,m,day).toISOString().slice(0,10);
        cell.innerHTML=`<div class="cal-day">${day}</div>`;
        const events = leads.filter(l=> l.follow && l.follow.slice(0,10)===dStr);
        events.forEach(ev=>{
          const b=document.createElement('div'); b.className='badge'; b.textContent=ev.name; cell.appendChild(b);
        });
        day++;
      }else{
        cell.style.opacity=.35;
      }
      grid.appendChild(cell);
    }
  }
}
function renderUpcoming(){
  const container=$('#upcomingList'); container.innerHTML='';
  const leads=getLeads().filter(l=>l.follow && l.follow.length>0).sort((a,b)=> a.follow.localeCompare(b.follow));
  if(leads.length===0){ container.innerHTML='<p class="small">No upcoming follow-ups.</p>'; return; }
  leads.forEach(ld=>{
    const div=document.createElement('div'); const dt=new Date(ld.follow); div.className='card';
    div.innerHTML = `<div><strong>${ld.name}</strong> — ${dt.toLocaleString()}</div><div class="small">${ld.notes||''}</div>`;
    container.appendChild(div);
  });
}

/* Mindset */
function saveAffirmations(){ LBStore.set('lb_affirmations', $('#affirmations').value); toast('Affirmations saved'); }
function saveJournal(){
  const arr = LBStore.get('lb_journals')||[]; arr.push({id:Date.now(), text: $('#journal').value});
  LBStore.set('lb_journals', arr); $('#journal').value=''; $('#journalCount').textContent = `${arr.length} entries`; toast('Journal saved');
}
function loadTextAreas(){
  $('#affirmations').value = LBStore.get('lb_affirmations')||'';
  const arr = LBStore.get('lb_journals')||[]; $('#journalCount').textContent = `${arr.length} entries`;
}
function copyText(id){ const el=document.getElementById(id); el.select(); document.execCommand('copy'); toast('Copied'); }

/* Brand */
function saveBrand(){
  const data={ name:$('#brandName').value, tag:$('#brandTag').value, colors:$('#brandColors').value, tone:$('#brandTone').value };
  LBStore.set('lb_brand', data); renderBrandPreview(); toast('Brand saved');
}
function renderBrandPreview(){
  const d = LBStore.get('lb_brand')||{};
  $('#brandName').value=d.name||''; $('#brandTag').value=d.tag||''; $('#brandColors').value=d.colors||''; $('#brandTone').value=d.tone||'';
  $('#brandPreview').textContent = JSON.stringify(d, null, 2);
}

/* Content: Post + Caption + Hashtag Generators */
function generatePost(){
  const topic = ($('#pgTopic').value||'digital freedom'); const notes=$('#pgNotes').value||'';
  const brand=LBStore.get('lb_brand')||{}; const tag=brand.tag||'From Fifth Wheel Wi-Fi to Digital Freedom';
  const hooks=[
    "I built from $130 and a Wi-Fi signal. Here’s what changed.",
    "If you’re still posting and praying, this is your sign.",
    "Gen-X and rebuilding? Read this.",
    "Your next chapter won’t need permission."
  ];
  const hook = hooks[Math.floor(Math.random()*hooks.length)];
  const cta='DM "COMMAND" for access.';
  const post = `${hook}\n\n${topic} — in plain English:\n${notes?`• ${notes}\n`:''}Here’s how I do it:\n• System that runs offline and online\n• Lead tracker that moves into your calendar\n• Content vault that writes with you\n• Mindset vault so you don’t self-sabotage\n\nThis isn’t theory. It’s ${tag}.\nReady to stop scrolling and start building?\n${cta}`;
  $('#pgOutput').value = post; toast('Post generated');
}
function saveGeneratedPost(){
  const v=$('#pgOutput').value; if(!v.trim()){ alert('Nothing to save'); return; }
  const prev=LBStore.get('lb_savedCaptions')||''; LBStore.set('lb_savedCaptions', (prev?prev+"\n\n":"")+v);
  loadLibrary(); toast('Saved to Vault');
}
function generateCaption(){
  const topic = ($('#capTopic').value||'digital freedom').trim();
  const style = $('#capStyle').value; const notes=$('#capNotes').value||'';
  const bank={ curiosity:["What if the thing you’re waiting for is waiting on you","This isn’t luck it’s systems and proof","Most people scroll past this and miss it"],
               educational:["3 things to stop doing if you want momentum","Here’s the simple system behind my results","Do this before you post today"],
               disruptive:["Stop posting and praying","Busy isn’t building","You don’t need permission to pivot"],
               ugc:["POV: You’re building from your phone","Unboxing the system that finally made it simple","Day 1 vs Day 30 – receipts"] };
  const hook=(bank[style]||bank.curiosity)[Math.floor(Math.random()*(bank[style]||bank.curiosity).length)];
  const cta='DM "COMMAND" for details';
  const caption = `${hook} \n\n${topic} in plain words:\n${notes?`• ${notes}\n`:''}• Built to work online + offline\n• Lead tracker pushes to calendar\n• Content vault writes with you\n\n${cta}`;
  $('#capOut').value=caption; toast('Caption generated');
}
function generateHashtags(){
  const topic = ($('#hashTopic').value||'digital freedom, genx, wifi income').toLowerCase();
  const n = Math.max(5, Math.min(30, parseInt($('#hashN').value||15)));
  const base = topic.split(/[, ]+/).filter(Boolean);
  const bank = ["digitalbusiness","workfromwifi","genx","sidehustle","contentcreator","affiliateincome","mwalegacybuilt","legacybuilt","lwa","mindsetshift","nlp","ugclife","womeninbusiness","over40andthriving","freedomlifestyle","remotework","makeithappen","proofnotpromises","builtnevergiven","canadabusiness"];
  base.forEach(b=>{ if(!bank.includes(b)) bank.unshift(b); });
  const seen={}; const tags=[];
  for(let i=0;i<bank.length && tags.length<n;i++){ const t=bank[i].replace(/[^a-z0-9]/g,''); if(!t||seen[t]) continue; seen[t]=1; tags.push('#'+t); }
  while(tags.length<n) tags.push('#legacybuilt'+tags.length);
  $('#hashOut').value = tags.join(' '); toast('Hashtags generated');
}
function saveCaptionHash(){
  const cap=$('#capOut').value.trim(); const hs=$('#hashOut').value.trim();
  if(!cap && !hs){ alert('Generate a caption or hashtags first'); return; }
  const chunk = (cap?cap+'\n':'') + (hs?hs+'\n':'') + '\n';
  const prev = LBStore.get('lb_savedCaptions')||'';
  LBStore.set('lb_savedCaptions', prev + chunk); loadLibrary(); toast('Saved to Library');
}
function saveLibrary(){ LBStore.set('lb_savedCaptions', $('#savedCaptions').value); toast('Library saved'); }
function loadLibrary(){ $('#savedCaptions').value = LBStore.get('lb_savedCaptions')||''; }

/* Settings */
function exportData(){
  const data = {
    focus: LBStore.get('lb_focus')||'',
    leads: LBStore.get('lb_leads')||[],
    brand: LBStore.get('lb_brand')||{},
    savedCaptions: LBStore.get('lb_savedCaptions')||'',
    qi: LBStore.get('lb_qi')||[],
    qt: LBStore.get('lb_qt')||[]
  };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='LB_Command_OS_v3_2_9_backup.json';
  document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove(); toast('Backup exported');
}
function resetAll(){
  const keys=['lb_focus','lb_leads','lb_brand','lb_savedCaptions','lb_qi','lb_qt','lb_journals','lb_affirmations','lb_active_tab'];
  keys.forEach(k=>LBStore.remove(k));
  loadFocus(); loadLeads(); renderCalendar(); renderUpcoming(); renderBrandPreview(); loadLibrary(); qiRender(); qiTotals(); qtRender(); toast('All data cleared');
}

/* Mindset helpers for stats */
function refreshStats(){
  const leads = (LBStore.get('lb_leads')||[]).length;
  const upcoming = (LBStore.get('lb_leads')||[]).filter(l=>l.follow && l.follow.length>0).length;
  const posts = 0; const journals = (LBStore.get('lb_journals')||[]).length;
  $('#statLeads').textContent=leads; $('#statUpcoming').textContent=upcoming; $('#statPosts').textContent=posts; $('#statJournals').textContent=journals;
  const setProg=(id,val,max=20)=>{ const pc=Math.min(100, Math.round((val/max)*100)); document.getElementById(id).style.width=pc+'%'; };
  setProg('progLeads',leads); setProg('progUpcoming',upcoming); setProg('progPosts',posts); setProg('progJournals',journals);
}
function loadWins(){ /* Optional extension */ }

/* Planner */
function plGet(){ return LBStore.get('lb_plan')||[]; }
function plSet(a){ LBStore.set('lb_plan', a); }
function plRender(){
  const c=$('#plList'); if(!c) return; c.innerHTML='';
  const arr=plGet().sort((a,b)=> (a.due||'').localeCompare(b.due||''));
  if(arr.length===0){ c.innerHTML='<p class="small">No planner tasks yet.</p>'; return; }
  arr.forEach(t=>{
    const div=document.createElement('div'); div.className='card';
    div.innerHTML = `
      <div class="row" style="align-items:center">
        <input type="checkbox" ${t.done?'checked':''} data-id="${t.id}" class="plChk" style="flex:0 0 20px;">
        <input value="${t.title}" data-id="${t.id}" class="plTitle">
        <input type="date" value="${t.due||''}" data-id="${t.id}" class="plDue" style="max-width:180px">
        <button class="ghost" data-act="del" data-id="${t.id}">Delete</button>
      </div>
      <textarea class="plNotes" data-id="${t.id}" placeholder="Notes">${t.notes||''}</textarea>`;
    c.appendChild(div);
  });
  c.onchange=(e)=>{
    const id=e.target.getAttribute('data-id'); if(!id) return; const arr=plGet(); const idx=arr.findIndex(x=> String(x.id)===String(id)); if(idx<0) return;
    if(e.target.classList.contains('plChk')) arr[idx].done=e.target.checked;
    if(e.target.classList.contains('plDue')) arr[idx].due=e.target.value;
    plSet(arr); plRender();
  };
  c.oninput=(e)=>{
    const id=e.target.getAttribute('data-id'); if(!id) return; const arr=plGet(); const idx=arr.findIndex(x=> String(x.id)===String(id)); if(idx<0) return;
    if(e.target.classList.contains('plTitle')) arr[idx].title=e.target.value;
    if(e.target.classList.contains('plNotes')) arr[idx].notes=e.target.value;
    plSet(arr);
  };
  c.onclick=(e)=>{
    const id=e.target.getAttribute('data-id'); if(!id) return;
    if(e.target.dataset.act==='del'){ const arr=plGet().filter(x=> String(x.id)!==String(id)); plSet(arr); plRender(); }
  };
}
function plAdd(){
  const title=($('#plTitle').value||'').trim(); const due=$('#plDue').value; const notes=$('#plNotes').value||'';
  if(!title){ alert('Title required'); return; }
  const arr=plGet(); arr.push({id:Date.now(), title, due, notes, done:false}); plSet(arr);
  $('#plTitle').value=''; $('#plDue').value=''; $('#plNotes').value=''; plRender(); toast('Planner task added');
}
function plExport(){
  const data=plGet(); const blob=new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='LB_Planner.json'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove(); toast('Planner exported');
}