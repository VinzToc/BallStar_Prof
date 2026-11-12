/* Ball Star Prof — interface professeur (Mes Apps EPS).
   - Réglages du jeu (seul endroit où ils se modifient) + fichier de réglages signé pour les élèves.
   - Import des fichiers .xlsx des élèves dans la base « MesAppsEPS » (feuille « ballstar », une ligne par match).
   - Suivi de la classe et fiche de progression par élève. L'XP est TOUJOURS recalculée avec les réglages du prof. */
(function(){
const APP_ID='ballstar';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R_=window.BSRULES,{ACTS,NIV,N,norm,isWin,isOk,nbObs,DEFIS}=R_;
const STARS=n=>'<span class="on">'+'★'.repeat(n)+'</span><span class="off">'+'★'.repeat(3-n)+'</span>';
const {AVATARS,NIVEAUX,avatarSVG,badgeSVG,logoSVG}=window.BSART;
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const fileSafe=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w-]+/g,'_').replace(/^_+|_+$/g,'');
const fmtDate=d=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(String(d||''));return m?`${m[3]}/${m[2]}/${m[1]}`:String(d||'')};
const today=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};

/* ───────── Réglages ───────── */
const CFG_KEY='BALLSTAR_PROF_CONFIG';
let CFG=(()=>{try{const o=JSON.parse(ls.get(CFG_KEY)||'null');if(o)return R_.clean(o)}catch(e){}return R_.clean(R_.DEF)})();
const saveCfg=()=>ls.set(CFG_KEY,JSON.stringify(CFG));

/* ───────── Données ───────── */
let ELEVES=[],DATA=[],CUR=null;   // DATA : [{e, p (progression recalculée), conf:{ok,ko}}]
const full=e=>`${e.prenom} ${String(e.nom).toUpperCase()}`;
async function load(){ELEVES=(await EPS.all()).sort((a,b)=>(a.classe||'').localeCompare(b.classe||'','fr',{numeric:true})||(a.nom+a.prenom).localeCompare(b.nom+b.prenom,'fr'));compute()}
function rowsOf(e){const d=(e.ext||{})[APP_ID];return d&&Array.isArray(d.lignes)?d.lignes:[]}

/* Retrouve l'élève désigné par le nom d'adversaire tapé par un élève (même nom + prénom, sinon prénom unique dans la classe). */
let NAMEIDX=new Map();
function buildIdx(){NAMEIDX=new Map();const add=(k,e)=>{if(!k)return;if(!NAMEIDX.has(k))NAMEIDX.set(k,[]);NAMEIDX.get(k).push(e)};
 ELEVES.forEach(e=>{add(norm(e.prenom+e.nom),e);add(norm(e.nom+e.prenom),e)})}
function resolveAdv(name,classe,selfId){const k=norm(name);if(!k)return null;
 let c=(NAMEIDX.get(k)||[]).filter(e=>e.id!==selfId);if(c.length>1)c=c.filter(e=>norm(e.classe)===norm(classe));if(c.length===1)return c[0];
 const same=ELEVES.filter(e=>e.id!==selfId&&norm(e.classe)===norm(classe)&&norm(e.prenom)===k);return same.length===1?same[0]:null}
/* ✔ si l'adversaire a enregistré le même match (même jour, score inversé), ≠ s'il a enregistré un autre score ce jour-là contre cet élève. */
function confirmation(e,r){const t=resolveAdv(r.Adversaire,e.classe,e.id);if(!t)return'';
 const mine=rowsOf(t).filter(x=>String(x.Date)===String(r.Date)&&(resolveAdv(x.Adversaire,t.classe,t.id)||{}).id===e.id);if(!mine.length)return'';
 return mine.some(x=>N(x['Mon score'])===N(r['Score adversaire'])&&N(x['Score adversaire'])===N(r['Mon score']))?'ok':'ko'}
function compute(){buildIdx();DATA=ELEVES.map(e=>{const rows=rowsOf(e),p=R_.progression(CFG,rows,{recalc:true});
 p.R.forEach(r=>r._conf=confirmation(e,r));
 return{e,p,conf:{ok:p.R.filter(r=>r._conf==='ok').length,ko:p.R.filter(r=>r._conf==='ko').length},last:p.R.length?p.R[p.R.length-1].Date:''}})}

/* ───────── Interface commune ───────── */
const VIEWS=['vClasse','vEleve','vImport','vReglages'];
function go(v){VIEWS.forEach(x=>$('#'+x).hidden=x!==v);$$('.ptabs button').forEach(b=>b.classList.toggle('on',b.dataset.go===v||(v==='vEleve'&&b.dataset.go==='vClasse')));
 if(v==='vReglages')renderReglages();if(v==='vClasse')renderClasse();window.scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});
function toast(msg,ko){const t=document.createElement('div');t.className='toast'+(ko?' ko':'');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3500)}
function modal(html,btns){return new Promise(res=>{const m=$('#modal');m.innerHTML=`<div class="modal"><div class="mbox">${html}<div class="row">${btns.map((b,i)=>`<button class="btn ${b.cls||''}" data-i="${i}">${b.t}</button>`).join('')}</div></div></div>`;
 m.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{m.innerHTML='';res(btns[+b.dataset.i].v)})})}
function renderWho(){const n=ELEVES.length,a=DATA.filter(d=>d.p.n).length;
 $('#who').innerHTML=n?`👥 <b>${n}</b> élève(s) dans Mes Apps EPS sur cet appareil · <b>${a}</b> avec des matchs Ball Star · Réglages : <b>${R_.isDefault(CFG)?'par défaut':'personnalisés (code '+R_.codeCourt(CFG)+')'}</b>`
  :`⚠ Aucune liste d'élèves sur cet appareil. Ouvrez Mes Apps EPS dans ce navigateur, ou chargez la liste dans l'onglet « 📥 Import ».`}

/* ───────── Classe ───────── */
function classes(){return[...new Set(ELEVES.map(e=>e.classe||'').filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}))}
function renderFiltres(){const cur=$('#fClasse').value||ls.get('BALLSTAR_PROF_CLASSE')||'',cl=classes();
 const withData=new Set(DATA.filter(d=>d.p.n).map(d=>d.e.classe||''));
 $('#fClasse').innerHTML=`<option value="">Toutes les classes</option>`+cl.map(c=>`<option value="${esc(c)}" ${c===cur?'selected':''}>${esc(c)}${withData.has(c)?' ⭐':''}</option>`).join('')}
function liste(){const c=$('#fClasse').value,tous=$('#fTous').checked,tri=$('#fTri').value;
 let L=DATA.filter(d=>(!c||d.e.classe===c)&&(tous||d.p.n));
 const by={xp:(a,b)=>b.p.xp-a.p.xp,nom:(a,b)=>(a.e.nom+a.e.prenom).localeCompare(b.e.nom+b.e.prenom,'fr'),matchs:(a,b)=>b.p.n-a.p.n,conf:(a,b)=>b.conf.ok-a.conf.ok};
 return L.sort((a,b)=>by[tri](a,b)||by.nom(a,b))}
const pc=(a,b)=>b?Math.round(a/b*100)+'%':'–';
const avatarOf=p=>AVATARS.find(a=>a.niveau===p.lvl);
function renderClasse(){renderFiltres();const L=liste(),act=L.filter(d=>d.p.n),M=act.reduce((s,d)=>s+d.p.n,0);
 $('#cStats').innerHTML=`<div class="stat"><b>${act.length}</b><span>Élèves actifs</span></div><div class="stat"><b>${M}</b><span>Matchs</span></div>
 <div class="stat"><b>${act.length?Math.round(act.reduce((s,d)=>s+d.p.xp,0)/act.length):0}</b><span>XP moyenne</span></div><div class="stat"><b>${pc(act.reduce((s,d)=>s+d.conf.ok,0),M)}</b><span>Confirmés</span></div>`;
 $('#cNiv').innerHTML=NIV.map((n,i)=>`<span>${badgeSVG(i,22)} ${n} : ${act.filter(d=>d.p.lvl===i).length}</span>`).join('');
 if(!L.length){$('#cTable').innerHTML=`<tbody><tr><td><div class="empty">${ELEVES.length?"Aucun match Ball Star pour cette sélection. Importez les fichiers des élèves dans l'onglet « 📥 Import ».":"Aucun élève sur cet appareil : chargez votre liste dans l'onglet « 📥 Import »."}</div></td></tr></tbody>`;return}
 const tri=$('#fTri').value;
 $('#cTable').innerHTML=`<thead><tr>${tri==='xp'?'<th>#</th>':''}<th>Élève</th><th>Niveau</th><th style="text-align:right">XP</th><th style="text-align:right">Matchs</th><th style="text-align:right">V – D</th><th style="text-align:right">Observables</th><th style="text-align:right">Étoiles</th><th>Confirmés</th><th>Dernier match</th><th>Alerte</th></tr></thead><tbody>${
 L.map((d,i)=>{const p=d.p,e=d.e,a=avatarOf(p),diff=p.declare-p.xp;
  return `<tr class="clk" data-id="${esc(e.id)}">${tri==='xp'?`<td class="rk">${p.n?i+1:'–'}</td>`:''}<td><div class="who2"><span class="mini">${avatarSVG(a,{k:'t'+i})}</span><div><b>${esc(full(e))}</b><small>${esc(e.classe||'')}</small></div></div></td>
  <td><span class="lvl" style="font-size:1rem">${badgeSVG(p.lvl,22)} ${NIV[p.lvl]}</span></td><td class="n">${p.xp}</td><td class="n">${p.n}</td><td class="n">${p.w} – ${p.l}</td><td class="n">${p.obs}</td>
  <td class="n"><span class="stars">★</span> ${p.etoiles} / ${p.defis.length*3}</td>
  <td>${p.n?`<span class="tag ok">✔ ${d.conf.ok}</span>${d.conf.ko?` <span class="tag ko">≠ ${d.conf.ko}</span>`:''}`:''}</td><td>${esc(fmtDate(d.last))}</td>
  <td>${p.n&&diff?`<span class="tag wa" title="XP déclarée par l'appli élève : ${p.declare}">⚠ XP ${diff>0?'+':''}${diff}</span>`:''}</td></tr>`}).join('')}</tbody>`}
['#fClasse','#fTri','#fTous'].forEach(s=>$(s).addEventListener('change',()=>{ls.set('BALLSTAR_PROF_CLASSE',$('#fClasse').value);renderClasse()}));
$('#cTable').addEventListener('click',e=>{const tr=e.target.closest('tr[data-id]');if(tr)openEleve(tr.dataset.id)});
$('#cExport').onclick=()=>{const L=liste().filter(d=>d.p.n);if(!L.length)return toast('Aucun élève avec des matchs dans cette sélection.',true);
 const rows=[['Nom','Prénom','Classe','Niveau','XP (réglages prof)','XP déclarée par l\'élève','Matchs','Victoires','Défaites','Observables validés','Étoiles de défis (sur 18)','Matchs confirmés','Matchs contestés','Dernier match']];
 L.forEach(d=>{const p=d.p;rows.push([d.e.nom,d.e.prenom,d.e.classe||'',NIV[p.lvl],p.xp,p.declare,p.n,p.w,p.l,p.obs,p.etoiles,d.conf.ok,d.conf.ko,fmtDate(d.last)])});
 const det=[['Nom','Prénom','Classe','Date','Activité','Adversaire','Mon score','Score adversaire','Résultat','Observable','Observables validés','Validé par','XP (réglages prof)','XP déclarée','Vérification']];
 L.forEach(d=>d.p.R.forEach(r=>det.push([d.e.nom,d.e.prenom,d.e.classe||'',fmtDate(r.Date),r['Activité']||'',r.Adversaire||'',N(r['Mon score']),N(r['Score adversaire']),r['Résultat'],r.Observable||'',nbObs(r),r['Validé par']||'',r['XP gagnée'],r._declare,r._conf==='ok'?'Confirmé':r._conf==='ko'?'Contesté':''])));
 const c=$('#fClasse').value;BSX.download(BSX.write([{name:'Bilan',rows},{name:'Matchs',rows:det}]),`BallStar_Bilan_${fileSafe(c||'toutes_classes')}_${today()}.xlsx`);toast('Bilan exporté')};
$('#cExportData').onclick=async()=>{const L=liste().filter(d=>d.p.n);if(!L.length)return toast('Aucune donnée Ball Star dans cette sélection.',true);
 EPS.downloadXLSX(await EPS.exportXLSX({ids:L.map(d=>d.e.id),apps:[APP_ID]}),`BallStar_${fileSafe($('#fClasse').value||'toutes_classes')}_${today()}.xlsx`);toast('Données exportées')};

/* ───────── Fiche élève ───────── */
function openEleve(id){CUR=id;renderEleve();go('vEleve')}
function renderEleve(){const d=DATA.find(x=>x.e.id===CUR);if(!d)return go('vClasse');const p=d.p,e=d.e,a=avatarOf(p),s=CFG.seuils;
 const nx=p.lvl<3?s[p.lvl+1]:null,pct=nx?Math.max(2,Math.min(100,(p.xp-s[p.lvl])/(nx-s[p.lvl])*100)):100,diff=p.declare-p.xp;
 $('#eHead').innerHTML=`<div class="pic">${avatarSVG(a,{k:'eh'})}</div><div class="info"><div class="nm">${esc(full(e))}</div><div class="tt">${esc(e.classe||'')}</div>
 <div class="lvl">${badgeSVG(p.lvl,34)} ${NIV[p.lvl]}</div><div class="xpbar"><i style="width:${pct}%"></i><b>${nx?`${p.xp} / ${nx} XP`:`${p.xp} XP`}</b></div>
 <div class="xpnext">${nx?`Encore ${nx-p.xp} XP pour passer ${NIV[p.lvl+1]}`:'Niveau maximum atteint'}${p.n&&diff?` · <span class="tag wa">⚠ l'appli de l'élève affichait ${p.declare} XP</span>`:''}</div></div>
 <div class="stats" style="grid-column:1/-1"><div class="stat"><b>${p.n}</b><span>Matchs</span></div><div class="stat"><b>${p.w}</b><span>Victoires</span></div><div class="stat"><b>${p.l}</b><span>Défaites</span></div>
 <div class="stat"><b>${p.obs}</b><span>Observables</span></div><div class="stat"><b>${d.conf.ok}</b><span>Confirmés</span></div><div class="stat"><b>${p.etoiles}/${p.defis.length*3}</b><span>Étoiles</span></div></div>`;
 $('#eChart').innerHTML=chart(p);
 $('#eDefis').innerHTML=p.defis.map(x=>{const av=AVATARS.find(v=>v.defi===x.id);return `<div class="defi ${x.done?'done':''}"><div class="pic">${avatarSVG(av,{locked:!x.done,k:'ed',stars:x.etoiles})}</div><div><b>${esc(x.nom)} <span class="stars">${STARS(x.etoiles)}</span></b><small>${x.etoiles>=3?'Défi terminé':esc(x.texte)}</small><div class="pbar"><i style="width:${Math.min(100,Math.round(x.v/x.cible*100))}%"></i></div><small class="pal">${x.paliers.map((n,i)=>`<span class="${x.etoiles>i?'on':''}">${'★'.repeat(i+1)} ${n}</span>`).join('')}<span class="cur">${Math.min(x.v,x.cible)} / ${x.cible}</span></small></div></div>`}).join('');
 const obs={};p.R.forEach(r=>{const k=r.Observable||'—';(obs[k]=obs[k]||{n:0,ok:0}).n++;obs[k].ok+=nbObs(r)});
 $('#eObs').innerHTML=p.n?`<table><thead><tr><th>Observable</th><th style="text-align:right">Matchs</th><th style="text-align:right">Validés</th><th style="text-align:right">Moyenne</th></tr></thead><tbody>${Object.entries(obs).sort((x,y)=>y[1].n-x[1].n).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${v.n}</td><td class="n">${v.ok}</td><td class="n"><span class="pct">${(v.ok/v.n).toFixed(1).replace('.',',')}</span></td></tr>`).join('')}</tbody></table>`:'<div class="empty">Aucun match.</div>';
 const ba=ACTS.map(x=>{const L=p.R.filter(r=>r['Activité']===x.n);return{x,n:L.length,w:L.filter(isWin).length,xp:L.reduce((s2,r)=>s2+N(r['XP gagnée']),0)}}).filter(y=>y.n);
 $('#eAct').innerHTML=ba.length?`<table><thead><tr><th>Activité</th><th style="text-align:right">Matchs</th><th style="text-align:right">V</th><th style="text-align:right">XP</th></tr></thead><tbody>${ba.map(y=>`<tr><td>${y.x.e} ${esc(y.x.n)}</td><td class="n">${y.n}</td><td class="n">${y.w}</td><td class="n">${y.xp}</td></tr>`).join('')}</tbody></table>`:'';
 $('#eMatchs').innerHTML=p.n?`<thead><tr><th>Date</th><th>Activité</th><th>Adversaire</th><th style="text-align:right">Score</th><th>Résultat</th><th>Observable</th><th>Validé par</th><th style="text-align:right">XP</th><th>Vérif.</th><th></th></tr></thead><tbody>${
  [...p.R].reverse().map((r,i)=>{const act=ACTS.find(x=>x.n===r['Activité'])||{e:'🎮'},dx=r._declare!==N(r['XP gagnée']);
  return `<tr><td>${esc(fmtDate(r.Date))}</td><td>${act.e} ${esc(r['Activité']||'')}</td><td>${esc(r.Adversaire||'')}</td><td class="n">${N(r['Mon score'])} – ${N(r['Score adversaire'])}</td>
  <td><span class="tag ${isWin(r)?'ok':r['Résultat']==='Défaite'?'ko':'nu'}">${esc(r['Résultat'])}</span></td><td>🎯 ${nbObs(r)} × ${esc(r.Observable||'')}</td><td>${esc(r['Validé par']||'')}</td>
  <td class="n">+${N(r['XP gagnée'])}${dx?` <span class="tag wa" title="XP déclarée par l'élève">${r._declare}</span>`:''}</td>
  <td>${r._conf==='ok'?'<span class="tag ok">✔ confirmé</span>':r._conf==='ko'?'<span class="tag ko">≠ contesté</span>':'<span class="tag nu">non vérifié</span>'}</td>
  <td><button class="del" data-del="${p.R.length-1-i}" title="Supprimer ce match">🗑️</button></td></tr>`}).join('')}</tbody>`:'<tbody><tr><td><div class="empty">Aucun match enregistré.</div></td></tr></tbody>'}
$('#eMatchs').addEventListener('click',async ev=>{const b=ev.target.closest('[data-del]');if(!b)return;const d=DATA.find(x=>x.e.id===CUR),r=d.p.R[+b.dataset.del];
 const v=await modal(`<h2>Supprimer ce match ?</h2><p>${esc(fmtDate(r.Date))} · ${esc(r.Adversaire||'')} · ${N(r['Mon score'])} – ${N(r['Score adversaire'])}<br>Le match est retiré de la fiche de l'élève dans Mes Apps EPS. Il reviendra si vous réimportez un fichier qui le contient.</p>`,[{t:'Supprimer',v:1,cls:'r'},{t:'Annuler',v:0,cls:'g'}]);if(!v)return;
 const key=x=>String(x.Date)+'|'+String(x.Heure||'')+'|'+String(x.Adversaire||'')+'|'+N(x['Mon score'])+'|'+N(x['Score adversaire']);
 const rest=rowsOf(d.e).filter(x=>key(x)!==key(r));await EPS.setExt(APP_ID,d.e.id,{lignes:rest});await load();renderEleve();toast('Match supprimé')});

/* Graphique : XP cumulée match après match, avec les seuils de niveau */
function chart(p){if(!p.n)return'<div class="empty">Aucun match pour l\'instant.</div>';
 const W=760,H=280,L=46,Rm=70,T=16,B=36,s=CFG.seuils,R=p.R,n=R.length;
 const nextS=s.find(v=>v>p.xp),ymax=Math.max(p.xp,nextS||p.xp)*1.08||10;
 const X=i=>L+(n<=1?0:(i/(n))*(W-L-Rm))+(n<=1?(W-L-Rm)/2:0),Y=v=>T+(H-T-B)*(1-v/ymax);
 const pts=[[X(0),Y(0)],...R.map((r,i)=>[X(i+1),Y(r._cum)])];
 const xi=n<=1?[0,1]:null;
 const P=(n<=1?[[L,Y(0)],[X(1),Y(R[0]._cum)]]:pts);
 const line=P.map(q=>q.join(',')).join(' ');
 const area=`M${P[0][0]},${Y(0)} L${line.replace(/ /g,' L')} L${P[P.length-1][0]},${Y(0)} Z`;
 const thr=s.map((v,i)=>({v,i})).filter(t=>t.i>0&&t.v<=ymax).map(t=>`<line x1="${L}" x2="${W-Rm}" y1="${Y(t.v)}" y2="${Y(t.v)}" stroke="${NIVEAUX[t.i].c2}" stroke-width="2" stroke-dasharray="6 6"/><text x="${W-Rm+6}" y="${Y(t.v)+4}" fill="${NIVEAUX[t.i].c1}" font-size="12" font-weight="800">${NIV[t.i]} ${t.v}</text>`).join('');
 const ticks=[0,.25,.5,.75,1].map(f=>Math.round(ymax*f/10)*10).filter((v,i,a)=>a.indexOf(v)===i).map(v=>`<line x1="${L}" x2="${W-Rm}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ffffff14"/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end" fill="#b9a8e6" font-size="11">${v}</text>`).join('');
 const step=Math.max(1,Math.ceil(n/8));
 const xl=R.map((r,i)=>(i%step===0||i===n-1)?`<text x="${P[n<=1?1:i+1][0]}" y="${H-B+18}" text-anchor="middle" fill="#b9a8e6" font-size="11">${esc(fmtDate(r.Date).slice(0,5))}</text>`:'').join('');
 const dots=R.map((r,i)=>{const q=P[n<=1?1:i+1];return`<circle cx="${q[0]}" cy="${q[1]}" r="${i===n-1?6:4}" fill="${isWin(r)?'#3dffa0':r['Résultat']==='Défaite'?'#ff5c7a':'#b9a8e6'}" stroke="#1a0b33" stroke-width="2"><title>${esc(fmtDate(r.Date))} · ${esc(r.Adversaire||'')} · +${N(r['XP gagnée'])} XP (total ${r._cum})</title></circle>`}).join('');
 const lp=P[P.length-1];
 return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="XP cumulée : ${p.xp} XP après ${n} matchs"><defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe14a" stop-opacity=".35"/><stop offset="1" stop-color="#ffe14a" stop-opacity="0"/></linearGradient></defs>
 ${ticks}${thr}<path d="${area}" fill="url(#ar)"/><polyline points="${line}" fill="none" stroke="#ffe14a" stroke-width="3.5" stroke-linejoin="round"/>${dots}
 <text x="${Math.min(lp[0],W-Rm-4)}" y="${lp[1]-12}" text-anchor="end" fill="#ffe14a" font-size="14" font-weight="900">${p.xp} XP</text>${xl}
 <text x="${L}" y="${H-4}" fill="#b9a8e6" font-size="11"><tspan fill="#3dffa0">●</tspan> victoire   <tspan fill="#ff5c7a">●</tspan> défaite   <tspan fill="#ffe14a">- - -</tspan> seuils de niveau</text></svg>`}

/* ───────── Import ───────── */
async function importer(files){const log=$('#impLog');log.innerHTML='';const creer=$('#impCreer').checked;let tot=0;
 for(const f of files){try{const r=await EPS.importXLSX(await f.arrayBuffer(),f.name,{ignorerEleves:true,creer});
   const msg=r.ids.length?`✅ <b>${esc(f.name)}</b> : ${r.ids.length} élève(s) mis à jour${r.add?`, ${r.add} créé(s)`:''}`:`⚠ <b>${esc(f.name)}</b> : aucun élève reconnu`;
   log.insertAdjacentHTML('beforeend',`<div class="${r.ign||!r.ids.length?'wa':''}">${msg}${r.ign?` · ${r.ign} ligne(s) ignorée(s) : élève absent de votre liste ou homonyme (cochez « Créer les élèves absents » si besoin)`:''}</div>`);tot+=r.ids.length}
  catch(x){log.insertAdjacentHTML('beforeend',`<div class="ko">❌ <b>${esc(f.name)}</b> : ${esc(x.message||x)}</div>`)}}
 await load();renderWho();if(tot)toast(`${tot} fiche(s) élève mise(s) à jour`)}
$('#impFiles').onchange=e=>{const f=[...e.target.files];e.target.value='';if(f.length)importer(f)};
const drop=$('#drop');['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('on')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('on')}));
drop.addEventListener('drop',e=>{const f=[...e.dataTransfer.files].filter(x=>/\.xlsx$/i.test(x.name));if(f.length)importer(f);else toast('Déposez des fichiers .xlsx',true)});
$('#listeFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{const r=await EPS.importFile(f);toast(`✅ ${r.add} élève(s) ajouté(s), ${r.upd} mis à jour`);await load();renderWho();$('#impCreer').checked=!ELEVES.length}catch(x){toast('❌ '+(x.message||x),true)}};

/* ───────── Réglages ───────── */
const lines=t=>[...new Set(String(t||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean))];
function renderReglages(){const c=CFG;$('#pJoue').value=c.xp.joue;$('#pVict').value=c.xp.victoire;$('#pBonus').value=c.xp.bonus;$('#pMaxObs').value=c.xp.maxObs;
 $('#pDefis').innerHTML=DEFIS.map(d=>`<div class="defrow"><b>${esc(d.nom)}</b><small>${esc(d.desc('…'))}</small><div class="defin">${[0,1,2].map(i=>`<label>${'★'.repeat(i+1)}<input type="number" min="1" id="pD_${d.id}_${i}" value="${c.defis[d.id][i]}" aria-label="${esc(d.nom)}, ${i+1} étoile(s)"></label>`).join('')}</div></div>`).join('');
 const e=[...c.ecart];while(e.length<3)e.push([0,0]);
 $('#pEcart').innerHTML=e.slice(0,3).map((x,i)=>`<div class="ecart">Écart ≥ <input type="number" min="0" id="pE${i}" value="${x[0]}" aria-label="Écart minimal ${i+1}"> points → + <input type="number" min="0" id="pX${i}" value="${x[1]}" aria-label="XP de l'écart ${i+1}"> XP</div>`).join('')+`<p class="mut" style="margin:6px 0 0">Mettez 0 pour désactiver un palier.</p>`;
 [1,2,3].forEach(i=>$('#pS'+i).value=c.seuils[i]);
 $('#pActs').innerHTML=ACTS.map((a,i)=>{const x=c.acts[a.n];return `<div class="actbox"><h4>${a.e} ${esc(a.n)}</h4>
  <label class="f">Liste des observables<textarea id="pO${i}">${esc(x.obs.join('\n'))}</textarea></label>
  <label class="f">Observable de la classe<select id="pI${i}"><option value="">Libre : l'élève choisit</option>${x.obs.map(o=>`<option ${o===x.impose?'selected':''}>${esc(o)}</option>`).join('')}</select></label></div>`}).join('');
 ACTS.forEach((a,i)=>$('#pO'+i).addEventListener('change',()=>{const sel=$('#pI'+i),cur=sel.value;sel.innerHTML=`<option value="">Libre : l'élève choisit</option>`+lines($('#pO'+i).value).map(o=>`<option ${o===cur?'selected':''}>${esc(o)}</option>`).join('')}));
 $('#gCode').innerHTML=`Réglages actuels : <b>${R_.isDefault(c)?'par défaut':'personnalisés'}</b> · code <b>${R_.codeCourt(c)}</b> (affiché aussi dans l'appli de l'élève et dans chaque match qu'il enregistre).`}
$('#pSave').onclick=()=>{const s=[0,N($('#pS1').value),N($('#pS2').value),N($('#pS3').value)];
 if(!(s[1]>0&&s[2]>s[1]&&s[3]>s[2]))return toast('Les seuils doivent augmenter : Argent < Or < Star.',true);
 const acts={};for(const [i,a] of ACTS.entries()){const obs=lines($('#pO'+i).value);if(!obs.length)return toast(`Ajoutez au moins un observable en ${a.n}.`,true);acts[a.n]={obs,impose:$('#pI'+i).value}}
 const defis={};for(const d of DEFIS){const v=[0,1,2].map(i=>N($(`#pD_${d.id}_${i}`).value));if(!(v[0]>0&&v[1]>v[0]&&v[2]>v[1]))return toast(`${d.nom} : les paliers doivent augmenter (1★ < 2★ < 3★).`,true);defis[d.id]=v}
 CFG=R_.clean({xp:{joue:N($('#pJoue').value),victoire:N($('#pVict').value),bonus:N($('#pBonus').value),maxObs:Math.max(1,N($('#pMaxObs').value))},defis,ecart:[0,1,2].map(i=>[N($('#pE'+i).value),N($('#pX'+i).value)]),seuils:s,acts});
 saveCfg();compute();renderWho();renderReglages();toast('Réglages enregistrés. Pensez à redonner le fichier de réglages aux élèves.')};
$('#gReset').onclick=async()=>{const v=await modal('<h2>Réglages par défaut ?</h2><p>Les observables et le barème reviennent aux valeurs de départ. L\'XP de tous les élèves est recalculée.</p>',[{t:'Rétablir',v:1},{t:'Annuler',v:0,cls:'g'}]);
 if(v){CFG=R_.clean(R_.DEF);saveCfg();compute();renderWho();renderReglages();toast('Réglages par défaut rétablis')}};
$('#gExport').onclick=()=>{const lis=[['Ball Star — fichier de réglages du professeur'],[''],["À déposer sur l'ENT ou à partager aux élèves. Ils l'importent dans Ball Star (onglet Défis → Règles du jeu, ou écran Match)."],
 ["Ne pas modifier ce fichier : il contient un code de contrôle. Un fichier modifié est refusé par l'appli élève. Pour changer les réglages, utilisez Ball Star Prof et exportez un nouveau fichier."],[''],['Code des réglages',R_.codeCourt(CFG)]];
 BSX.download(BSX.write([{name:'Lisez-moi',rows:lis},{name:R_.CFG_SHEET,rows:R_.versLignes(CFG)}]),`BallStar_Reglages_${R_.codeCourt(CFG)}.xlsx`);toast('Fichier de réglages exporté')};
$('#gImport').onclick=()=>$('#gFile').click();
$('#gFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{const sh=(await BSX.read(await f.arrayBuffer())).find(s=>norm(s.name)===norm(R_.CFG_SHEET));if(!sh)throw new Error('feuille « '+R_.CFG_SHEET+' » introuvable');
  const r=R_.depuisLignes(sh.rows);CFG=r.cfg;saveCfg();compute();renderWho();renderReglages();
  toast(r.valide?'Réglages importés ✔':'Réglages importés. Le fichier avait été modifié : exportez un nouveau fichier pour les élèves.')}
 catch(x){toast('Fichier non reconnu : '+(x.message||x),true)}};

/* ───────── Démarrage ───────── */
(async()=>{try{await load()}catch(e){console.error(e)}renderWho();renderClasse();$('#impCreer').checked=!ELEVES.length})();
if('serviceWorker' in navigator&&location.protocol==='https:'&&!window.BALLSTAR_NO_SW)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
