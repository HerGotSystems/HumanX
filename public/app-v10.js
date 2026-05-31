const API = '';
const LS_USER = 'humanx_public_user_v1';
const LS_ADMIN = 'humanx_admin_token_v1';

let claims = [];
let evidenceVault = [];
let truths = [];
let beliefSnapshots = [];
let graphStatus = null;
let selected = null;
let mode = 'home';
let lastPacket = '';
let live = false;
let user = null;
let lastBeliefSnapshot = null;
let reviewQueue = { claims: [], truths: [], review: [] };

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}
function toast(t) { const e=document.createElement('div'); e.className='toast'; e.textContent=t; document.body.appendChild(e); setTimeout(()=>e.remove(),1800); }
function headers(){return{'content-type':'application/json','x-humanx-user':user?.id||''}}
function adminToken(){return localStorage.getItem(LS_ADMIN)||''}
function adminHeaders(){return {...headers(),'x-humanx-admin':adminToken()}}
async function api(path,opts={}){const r=await fetch(API+path,{...opts,headers:{...headers(),...(opts.headers||{})}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||data.error||'Request failed');return data}
function localUser(){let u=JSON.parse(localStorage.getItem(LS_USER)||'null');if(!u){u={id:'usr_'+crypto.randomUUID().replaceAll('-','').slice(0,18),handle:'anon-'+Math.random().toString(36).slice(2,8)};localStorage.setItem(LS_USER,JSON.stringify(u))}return u}
function sourceLink(url){if(!url)return'';const safe=esc(url);return`<p class="small source"><a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a></p>`}
function cleanStance(v){v=String(v||'support').toLowerCase().trim();return v==='pressure'?'pressure':'support'}
function cleanClaimLabel(s){return String(s||'').replace(/\s*[—-]\s*this statement reflects reality consistently enough to survive evidence and repeatable pressure testing\.?/ig,'').replace(/\s*[—-]\s*X\s*$/,'').trim()}
function isFullBeliefProfile(s){return String(s?.source||'').includes('standalone-humanx-belief-engine')||String(s?.engineVersion||'').includes('humanx-belief-engine')||String(s?.label||'').includes('Belief Engine Profile')}
function parseAnalysis(text){try{const o=JSON.parse(String(text||''));if(o&&typeof o==='object'&&(o.verdict||o.strongest_support||o.strongest_pressure||o.missing_tests))return o}catch{}return null}
function shortText(s,n=420){s=String(s||'').trim();return s.length>n?s.slice(0,n)+'…':s}
function listBits(arr){return Array.isArray(arr)?`<ul>${arr.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
async function boot(){user=localUser();document.getElementById('who').textContent=user.handle;try{const h=await api('/api/health');live=h.mode==='d1-live';setStatus(live?'D1 live':'Demo fallback',live);try{const s=await api('/api/session',{method:'POST',body:JSON.stringify(user)});if(s.user){user={...user,...s.user};document.getElementById('who').textContent=user.handle;localStorage.setItem(LS_USER,JSON.stringify(user))}}catch{}await Promise.all([loadGraphStatus(),loadClaims(false)]);render()}catch(e){setStatus('Backend unreachable',false,true);renderError(e)}}
function setStatus(t,ok,bad=false){document.getElementById('status').textContent=t;const d=document.getElementById('dot');d.className='dot '+(bad?'bad':ok?'live':'')}
async function loadGraphStatus(){try{graphStatus=await api('/api/graph-status')}catch{graphStatus=null}}
function q(){return encodeURIComponent(document.getElementById('search')?.value||'')}
async function loadClaims(doRender=true){try{const f=encodeURIComponent(document.getElementById('filter')?.value||'all');const data=await api(`/api/claims?q=${q()}&status=${f}`);claims=data.claims||[];if(data.warning)setStatus(data.warning,false);if(doRender)render()}catch(e){renderError(e)}}
async function loadEvidenceVault(){const data=await api(`/api/evidence-vault?q=${q()}`);evidenceVault=data.evidence||[]}
async function loadTruths(){const data=await api(`/api/truths?q=${q()}`);truths=data.truths||[]}
async function loadBeliefSnapshots(){const data=await api('/api/belief-snapshots?limit=30');beliefSnapshots=data.snapshots||[]}
async function loadReviewQueue(){const data=await api('/api/review',{headers:adminHeaders()});reviewQueue={claims:data.claims||[],truths:data.truths||[],review:data.review||[]};return reviewQueue}
async function searchCurrent(){if(mode==='vault')return renderVault();if(mode==='truths')return renderTruths();if(mode==='review')return renderReview();if(mode==='belief')return renderBelief();if(mode==='drift')return renderDrift();if(mode==='home')return renderHome();await loadClaims(true)}
function setMode(m){mode=m;if(m!=='export')selected=null;document.body.classList.remove('study-mode');document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.getElementById('tab-'+m)?.classList.add('active');render()}
function cls(s){if(s==='Proven'||String(s).includes('Supported')||String(s).includes('rising'))return'b-green';if(String(s).includes('Disproven')||String(s).includes('Collapse')||String(s).includes('falling'))return'b-red';if(s==='Plausible')return'b-blue';return'b-yellow'}
function meter(n,v){v=Math.max(0,Math.min(100,Number(v||0)));return`<div class="meter"><span>${n}</span><div class="bar"><div class="fill" style="width:${v}%"></div></div></div>`}
function deltaMeter(n,v){const sign=v>0?'+':'';return`<div class="meter"><span>${n} ${sign}${esc(v)}</span><div class="bar"><div class="fill" style="width:${Math.min(100,Math.abs(Number(v||0)))}%"></div></div></div>`}
function graphVal(v){return v===null||v===undefined?'ERR':v}
function graphBox(){const g=graphStatus?.graph||{};const items=[['Claims',g.claims],['Evidence',g.evidence],['Truths',g.truths],['Links',g.evidenceClaimLinks],['Votes',g.claimVotes],['Reports',g.reports]];const err=graphStatus&&graphStatus.ok===false?`<p class="small error">Graph schema warning: ${esc(Object.keys(graphStatus.errors||{}).join(', ')||'unknown')}</p>`:'';return`<div class="graph-status">${items.map(([k,v])=>`<span><b>${esc(graphVal(v))}</b><small>${k}</small></span>`).join('')}</div>${err}`}
function helperText(){if(mode==='drift')return'<p class="small">Drift separates full Belief Engine profiles from quick belief records.</p>';if(mode==='belief')return'<p class="small">Belief Engine: record belief structure, source, identity load, inheritance, pressure, and what could change your mind.</p>';if(mode==='home')return'<p class="small">HumanX separates belief, repeated truth, public claims and reusable evidence.</p>'+graphBox();if(mode==='vault')return'<p class="small">Evidence Vault: attach one evidence object to many claims as support or pressure.</p>'+graphBox();if(mode==='truths')return'<p class="small">Truths: repeated certainties, slogans and doctrines. Convert useful ones into pressure-testable claims.</p>'+graphBox();if(mode==='review')return'<p class="small">Admin review: approve, reject, or keep claims and truths in review. Requires HUMANX_ADMIN_TOKEN.</p>'+graphBox();if(mode==='export')return selected?`<p class="small">Selected for RunPack:<br><b>${esc(selected.claim)}</b></p><p class="small">Legacy AIP compatible.</p>`:'<p class="small">No selected claim. Open a claim first, then generate a RunPack packet. Legacy AIP compatible.</p>';if(mode==='submit')return'<p class="small">Submit one clear claim. Add evidence later in study mode.</p>';return'<p class="small">Claims: browse, open Study Claim, inspect evidence, pressure, tests, votes and RunPack.</p>'+graphBox()}
function render(){if(mode==='home')return renderHome();if(mode==='belief')return renderBelief();if(mode==='drift')return renderDrift();if(mode==='submit')return renderSubmit();if(mode==='vault')return renderVault();if(mode==='truths')return renderTruths();if(mode==='review')return renderReview();if(mode==='export')return renderExport();renderArena()}
