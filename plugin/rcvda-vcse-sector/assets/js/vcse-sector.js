/* RCVDA VCSE Sector — "State of the Sector" living dashboard front end.
 * For every .rcvda-vcse-sector container it fetches two living datasets from the
 * public repo (jsDelivr, bundled fallbacks): the counts spine (over-time trends)
 * and the analytics aggregates (the snapshot detail sections). The Authority
 * filter drives every scope; the Measure filter drives the trend charts. Borough
 * colours are resolved live from rcvda-core's shared tokens (DESIGN.md hex as
 * fallback), so SVG works cross-browser and tracks the estate's dark mode. No
 * external libraries. */
(function(){
  "use strict";
  var SEGMENTS=["Charities","CICs","Societies","CASCs"];
  function segLabel(s){ return s==="Charities"?"Registered Charities":s; }
  var BORO=[["Darlington","Darlington"],["Hartlepool","Hartlepool"],["Middlesbrough","Middlesbrough"],["Redcar-and-Cleveland","Redcar & Cleveland"],["Stockton-on-Tees","Stockton-on-Tees"]];
  var LA_TOKEN={"Darlington":["--la-darlington","#900030"],"Hartlepool":["--la-hartlepool","#248000"],"Middlesbrough":["--la-middlesbrough","#EF8A00"],"Redcar-and-Cleveland":["--la-redcar-cleveland","#217887"],"Stockton-on-Tees":["--la-stockton","#1D8AD7"]};
  var SEG_TOKEN={Charities:["--c-charity","#211D47"],CICs:["--c-cic","#E52D13"],Societies:["--c-society","#6C1D45"],CASCs:["--c-casc","#0E8A4F"]};
  var DECADES=["Pre-1960","1960s","1970s","1980s","1990s","2000s","2010s","2020s"];
  var BANDS=["£1m +","£500k - £1m","£250k - £500k","£100k - £250k","£75k - £100k","£50k - £75k","Over 25k","Over 10k","Under 10k"];
  var VIC={
    'trending-up':'<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    'chart-pie':'<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    'calendar':'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    'pound-sterling':'<path d="M18 7c0-5.333-8-5.333-8 0"/><path d="M10 7v14"/><path d="M6 21h12"/><path d="M6 13h10"/>',
    'globe':'<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    'building':'<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    'book-open':'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    'scale':'<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    'users':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'map-pin':'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'gauge':'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>'};
  function vicon(n,sz){ return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(VIC[n]||'')+'</svg>'; }
  var LA_INK_LIGHT={"Darlington":"#900030","Hartlepool":"#248000","Middlesbrough":"#ac6300","Redcar-and-Cleveland":"#217887","Stockton-on-Tees":"#1a79bd"};
  var LA_INK_DARK={"Darlington":"#C24A72","Hartlepool":"#5AAE3A","Middlesbrough":"#F2A133","Redcar-and-Cleveland":"#4FA3B2","Stockton-on-Tees":"#5AAEE6"};
  function rcIsDark(){ var t=document.documentElement.getAttribute('data-theme'); if(t) return t==='dark'; return !!(window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches); }
  var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function fmtDate(s){ if(!s) return "—"; var p=s.split('-'); return (+p[2])+" "+MONTHS[+p[1]-1]+" "+p[0]; }
  function fmtShort(s){ var p=s.split('-'); return MONTHS[+p[1]-1]+" "+p[0].slice(2); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function commas(n){ return (n==null?"—":Number(n).toLocaleString()); }
  function gbp(n){ n=+n||0; if(n>=1e6) return "£"+(n/1e6).toFixed(n>=1e7?0:1)+"m"; if(n>=1e3) return "£"+Math.round(n/1e3)+"k"; return "£"+n; }
  function gbpFull(n){ return "£"+Number(Math.round(n||0)).toLocaleString(); }

  function ensureTip(){ var t=document.querySelector('.rcvda-vcse-sector-tip'); if(!t){ t=document.createElement('div'); t.className='rcvda-vcse-sector-tip'; document.body.appendChild(t);} return t; }
  function parseCSV(t){
    var lines=t.replace(/\r/g,'').split('\n').filter(function(l){return l.trim();});
    if(!lines.length) return [];
    var head=lines.shift().split(',');
    return lines.map(function(l){ var c=l.split(','), o={}; head.forEach(function(h,i){o[h]=c[i];}); return o; });
  }
  function colours(root){
    var cs=getComputedStyle(root);
    function v(n,f){ var x=cs.getPropertyValue(n).trim(); return x||f; }
    var bor={}; BORO.forEach(function(b){ bor[b[0]]=v(LA_TOKEN[b[0]][0],LA_TOKEN[b[0]][1]); });
    var seg={}; SEGMENTS.forEach(function(s){ seg[s]=v(SEG_TOKEN[s][0],SEG_TOKEN[s][1]); });
    return { bor:bor, tv:v('--tv-navy','#2A3B72'), seg:seg, accent:v('--wp--preset--color--brand-light','#033E8C'), muted:v('--wp--preset--color--muted','#51607A') };
  }

  function fetchChain(urls,cb){
    if(!urls.length){ cb(null,false); return; }
    var u=urls.shift(), live=(/cdn\.jsdelivr\.net|raw\.githubusercontent/.test(u));
    var ac=('AbortController' in window)?new AbortController():null;
    var to=setTimeout(function(){ if(ac) ac.abort(); },7000);
    fetch(u,ac?{signal:ac.signal,cache:"no-store"}:{cache:"no-store"})
      .then(function(r){ if(!r.ok) throw 0; return r.text(); })
      .then(function(t){ clearTimeout(to); cb(t,live); })
      .catch(function(){ clearTimeout(to); fetchChain(urls,cb); });
  }

  var GLOSS='<div class="gloss"><div class="gh">Organisation types</div><dl>'
    +'<dt>Registered charity</dt><dd>On the Charity Commission register. <b>Includes CIOs</b> — this counts every registered charity, whatever its legal structure.</dd>'
    +'<dt>CIC — Community Interest Company</dt><dd>A company that trades for community benefit, regulated by the CIC Regulator, not the Charity Commission — so not a charity.</dd>'
    +'<dt>Registered society / mutual</dt><dd>A co-operative or community benefit society registered with the FCA. Includes credit unions and working men’s clubs.</dd>'
    +'<dt>CASC — Community Amateur Sports Club</dt><dd>A local sports club registered with HMRC for tax reliefs.</dd></dl>'
    +'<div class="gh">Terms</div><dl>'
    +'<dt>Based in</dt><dd>The organisation’s <b>registered office</b> is in the borough — the canonical headline measure, kept separate from the wider “operating-from” reach measure.</dd>'
    +'<dt>Active</dt><dd>Currently on the register — not removed or dissolved.</dd>'
    +'<dt>Sector turnover</dt><dd>The total latest-year income of the active organisations that report one; many small groups report none.</dd>'
    +'<dt>NAVCA model</dt><dd>A national estimate that registered charities are about 26% of the whole VCFSE sector, used to project the unregistered community groups no register captures.</dd></dl></div>';

  function markup(title,area){
    return '<div class="wrap">'
      +'<header class="masthead"><div><div class="eyebrow">'+esc(area)+' · Registered VCFSE Sector · Living time series</div><h1>'+esc(title)+'</h1></div>'
      +'<div class="meta">Latest snapshot <b class="j-snap">—</b><br>Updated weekly · Source: Find That Charity</div>'
      +'<p class="lede"><b>State of the Sector</b> is a timed series produced by Redcar and Cleveland Voluntary Development Agency (RCVDA) that records the registered <b>Voluntary, Community, Faith and Social-Enterprise</b> (VCFSE) sector <b>based-in and trading from</b> the <b>five Tees Valley Authorities</b>. It brings together <b>Registered Charities</b> – including Charitable Incorporated Organisations (CIOs); <b>Social Enterprises</b> – including Community Interest Companies (CICs), Registered Friendly Societies and Mutuals; and <b>Community Amateur Sports Clubs</b> (CASCs).</p></header>'
      +'<div class="note"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      +'<div><b>A living measure.</b> This dashboard reads the open dataset that RCVDA rebuilds every Monday from Find That Charity, so each weekly point appears automatically. The over-time charts are seeded from earlier snapshots; the detailed analytics describe the latest snapshot and build up week by week. Data: <a href="https://github.com/rcvda/tees-valley-vcse-sector" target="_blank" rel="noopener">rcvda/tees-valley-vcse-sector</a> (CC&nbsp;BY-NC-SA&nbsp;4.0).</div></div>'
      +'<div class="filterbar">'
      +'<input type="hidden" class="j-bor" value="TV">'
      +'<div class="borchips j-borchips" role="group" aria-label="Authority">'
      +'<button type="button" class="borchip is-active" data-value="TV" aria-pressed="true" style="--cat:var(--tv-navy,#2A3B72)">'+esc(area)+' (all five)</button>'
      +'<button type="button" class="borchip" data-value="Darlington" aria-pressed="false" style="--cat:var(--la-darlington,#900030)">Darlington</button>'
      +'<button type="button" class="borchip" data-value="Hartlepool" aria-pressed="false" style="--cat:var(--la-hartlepool,#248000)">Hartlepool</button>'
      +'<button type="button" class="borchip" data-value="Middlesbrough" aria-pressed="false" style="--cat:var(--la-middlesbrough,#EF8A00)">Middlesbrough</button>'
      +'<button type="button" class="borchip" data-value="Redcar-and-Cleveland" aria-pressed="false" style="--cat:var(--la-redcar-cleveland,#217887)">Redcar &amp; Cleveland</button>'
      +'<button type="button" class="borchip" data-value="Stockton-on-Tees" aria-pressed="false" style="--cat:var(--la-stockton,#1D8AD7)">Stockton-on-Tees</button>'
      +'</div></div>'
      +'<div class="band"><h3>'+vicon("gauge",20)+'Headline Figures</h3><div class="rule"></div></div>'
      +'<section class="kpis j-kpis"><div class="loading">Loading the latest snapshot…</div></section>'

      +'<div class="band"><h3>'+vicon("trending-up",20)+'Sector size over time</h3><div class="rule"></div></div>'
      +'<div class="trendctl rangebox"><div class="rangehead"><label>Range</label><span class="rangebar j-range" role="group" aria-label="Trend time range"><button type="button" data-r="fit" class="on">Recent</button><button type="button" data-r="12m">12 mths</button><button type="button" data-r="all">All</button></span><span class="rangeout j-rangeout"></span></div><div class="rangeline j-rangeline"></div></div>'
      +'<section class="grid"><div class="panel col-7"><div class="panel-head"><h2 class="j-c2t">Active VCFSE over time</h2><div class="sub">Based-in, active · total and four segments</div></div><div class="j-chart2"></div><div class="legend j-leg2"></div></div>'
      +'<div class="panel col-5 panel--noscope"><div class="panel-head"><h2>Latest snapshot</h2><div class="sub j-mxsub">Active based-in organisations</div></div><table class="matrix j-matrix"></table></div></section>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2 class="j-c1t">Active VCFSE organisations by authority</h2><div class="sub j-c1sub">Based-in, active · one line per authority</div></div><div class="trendctl trendctl--inpanel"><label>Measure</label><input type="hidden" class="j-seg" value="ALL"><div class="segchips" role="group" aria-label="Measure"><button type="button" class="borchip is-active" data-value="ALL" aria-pressed="true" style="--cat:var(--tv-navy,#2A3B72)">All VCFSE</button><button type="button" class="borchip" data-value="Charities" aria-pressed="false" style="--cat:var(--c-charity,#211D47)">Registered Charities</button><button type="button" class="borchip" data-value="CICs" aria-pressed="false" style="--cat:var(--c-cic,#E52D13)">CICs</button><button type="button" class="borchip" data-value="Societies" aria-pressed="false" style="--cat:var(--c-society,#6C1D45)">Societies</button><button type="button" class="borchip" data-value="CASCs" aria-pressed="false" style="--cat:var(--c-casc,#0E8A4F)">CASCs</button></div><span class="tag j-scope"></span></div><div class="j-chart1"><div class="loading">Loading…</div></div><div class="legend j-leg1"></div></div></section>'

      +'<div class="band"><h3>'+vicon("chart-pie",20)+'The sector by type</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>Active sector by type</h2><div class="sub j-typesub"></div></div><div class="bars j-type"></div></div>'
      +'<div class="panel col-6"><div class="panel-head"><h2>'+vicon("users",18)+'Projected whole sector</h2><div class="sub">What NAVCA predicts vs what’s on the register</div></div><div class="j-proj"></div></div></section>'

      +'<div class="band"><h3>'+vicon("calendar",20)+'Structure &amp; age</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2>When the sector was founded</h2><div class="sub">Active organisations by decade of registration, coloured by type (oldest to most recent). CASCs carry no registration date, so are not shown.</div></div><div class="bars j-decades"></div><div class="legend j-decleg"></div></div></section>'

      +'<div class="band"><h3>'+vicon("pound-sterling",20)+'Money</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>'+vicon("pound-sterling",18)+'Turnover of the active sector</h2><div class="sub j-incsub"></div></div><div class="bars j-income"></div></div>'
      +'<div class="panel col-6"><div class="panel-head"><h2>'+vicon("scale",18)+'Large vs small</h2><div class="sub">How the money concentrates by organisation size</div></div><div class="j-size"></div></div>'
      +'<div class="panel col-12"><div class="panel-head"><h2>'+vicon("chart-pie",18)+'Income concentration</h2><div class="sub j-concsub"></div></div><div class="conc-bar"><div class="top j-conctop"></div></div><div class="mini j-concmini"></div></div></section>'

      +'<div class="band"><h3>'+vicon("globe",20)+'Digital &amp; projection</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>'+vicon("globe",18)+'Digital presence</h2><div class="sub">Active organisations with a website</div></div><div class="donut-wrap"><svg class="j-donut" width="122" height="122" viewBox="0 0 132 132" role="img"></svg><div class="mini j-digmini" style="flex:1"></div></div></div>'
      +'<div class="panel col-6"><div class="panel-head"><h2>Charity legal structure</h2><div class="sub j-legalsub"></div></div><div class="split j-legalsplit"></div><div class="mini j-legalmini"></div></div></section>'

      +'<div class="band"><h3>'+vicon("building",20)+'The largest organisations</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2>'+vicon("building",18)+'Ten largest active organisations by income</h2><div class="sub j-topsub"></div></div><table class="toptable j-top"></table></div></section>'

      +'<div class="band band--noscope"><h3>'+vicon("book-open",20)+'Glossary</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12 panel--noscope">'+GLOSS+'</div></section>'

      +'<footer><b>Method.</b> Candidates are drawn from Find That Charity for the five '+esc(area)+' local-authority areas, classified by registered organisation type and filtered to those whose <b>registered office (HQ)</b> is in the borough. Scope: registered charities (including CIOs), CICs, registered societies / mutuals and CASCs; statutory bodies (schools, NHS, councils) excluded. Each weekly run recomputes the counts and the analytics; figures describe the active sector. The over-time series is seeded from earlier dated snapshots. <span class="j-built"></span>'
      +'<br><b>Sources.</b> Organisation records aggregated by <b>Find That Charity</b> (findthatcharity.uk, David Kane) from the primary UK registers — the <b>Charity Commission for England &amp; Wales</b>, <b>Companies House</b> (CICs), the <b>FCA Mutuals Public Register</b> (registered societies) and <b>HMRC</b> (CASCs). Register data © the respective bodies under the Open Government Licence v3.0; Find That Charity is published under CC-BY 4.0.'
      +'<br><b>© RCVDA</b> · Peter Neal · Data CC BY-NC-SA 4.0 · Code MIT.</footer></div>';
  }

  function initOne(root,tip){
    var SRC=root.getAttribute('data-src')||'', FB=root.getAttribute('data-fallback')||'';
    var ASRC=root.getAttribute('data-agg-src')||'', AFB=root.getAttribute('data-agg-fallback')||'';
    var TITLE=root.getAttribute('data-title')||'State of the Sector', AREA=root.getAttribute('data-area')||'Tees Valley';
    root.innerHTML=markup(TITLE,AREA);
    var S={ root:root, tip:tip, DATA:[], AGG:null, hidden1:{}, hidden2:{}, range:'fit' };
    S.q=function(c){ return root.querySelector(c); };
    var spineChain=[]; if(SRC)spineChain.push(SRC); if(FB&&FB!==SRC)spineChain.push(FB);
    var aggChain=[]; if(ASRC)aggChain.push(ASRC); if(AFB&&AFB!==ASRC)aggChain.push(AFB);
    var pending=2, live=false;
    function done(){ if(--pending>0) return; boot(S,live); }
    fetchChain(spineChain.slice(),function(t,l){ if(t){ S.DATA=normalizeClusters(parseSpine(t)); if(l)live=true; } done(); });
    fetchChain(aggChain.slice(),function(t,l){ if(t){ try{ S.AGG=JSON.parse(t); }catch(e){} } done(); });
    var reRender=function(){ if(S.DATA.length||S.AGG) render(S); };
    if('MutationObserver' in window){ new MutationObserver(reRender).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']}); }
    if(window.matchMedia){ try{ window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',reRender); }catch(e){} }
    if('ResizeObserver' in window){ new ResizeObserver(reRender).observe(S.q('.j-chart1')); }
    S.root.querySelectorAll('.segchips .borchip').forEach(function(b){ b.addEventListener('click',function(){ var hid=S.q('.j-seg'); if(hid.value===b.getAttribute('data-value')) return; hid.value=b.getAttribute('data-value'); S.root.querySelectorAll('.segchips .borchip').forEach(function(x){ var on=(x===b); x.classList.toggle('is-active',on); x.setAttribute('aria-pressed',on?'true':'false'); }); render(S); }); });
    S.root.querySelectorAll('.j-borchips .borchip').forEach(function(b){ b.addEventListener('click',function(){ var hid=S.q('.j-bor'); if(hid.value===b.getAttribute('data-value')) return; hid.value=b.getAttribute('data-value'); S.root.querySelectorAll('.j-borchips .borchip').forEach(function(x){ var on=(x===b); x.classList.toggle('is-active',on); x.setAttribute('aria-pressed',on?'true':'false'); }); var nv=hid.value; S.hidden1={}; if(nv!=="TV"){ BORO.forEach(function(bb){ if(bb[0]!==nv) S.hidden1[bb[0]]=true; }); } render(S); }); });
    S.q('.j-range').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return;
      S.range=b.getAttribute('data-r');
      this.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on',x===b); });
      render(S); });
  }
  function parseSpine(t){
    return parseCSV(t).filter(function(r){ return r.definition==="based-in" && SEGMENTS.indexOf(r.segment)>=0 && LA_TOKEN[r.borough]; })
      .map(function(r){ return {seg:r.segment,bor:r.borough,date:r.snapshot_date,t:Date.parse(r.snapshot_date),active:+r.active||0}; })
      .filter(function(r){ return !isNaN(r.t); });
  }
  /* Historical seeds were captured borough-by-borough across a few days, so a
     single logical snapshot is spread over several dates. Chain dates whose
     consecutive gap is <= 5 days into one cluster (weekly cadence is 7 days, so
     real weekly points never merge), stamp the cluster to its last capture day,
     and keep the latest value per borough+segment within it. */
  function normalizeClusters(rows){
    if(!rows.length) return rows;
    var ds={}; rows.forEach(function(r){ ds[r.date]=r.t; });
    var keys=Object.keys(ds).sort(function(a,b){return ds[a]-ds[b];});
    var canon={}, WIN=5*864e5, i=0;
    while(i<keys.length){ var j=i; while(j+1<keys.length && (ds[keys[j+1]]-ds[keys[j]])<=WIN) j++;
      var c=keys[j]; for(var k=i;k<=j;k++) canon[keys[k]]=c; i=j+1; }
    var best={};
    rows.forEach(function(r){ var cd=canon[r.date], key=cd+'|'+r.bor+'|'+r.seg;
      if(!best[key] || r.t>best[key]._ot) best[key]={seg:r.seg,bor:r.bor,date:cd,t:Date.parse(cd),active:r.active,_ot:r.t}; });
    return Object.keys(best).map(function(k){ var o=best[k]; delete o._ot; return o; });
  }
  function boot(S,live){
    S.live=live;
    var latest="—";
    if(S.AGG && S.AGG.latest) latest=S.AGG.latest;
    else if(S.DATA.length){ var d=S.DATA.map(function(r){return r.date;}).sort(); latest=d[d.length-1]; }
    S.q('.j-snap').textContent=fmtDate(latest);
    S.q('.j-built').textContent="Built "+fmtDate(latest)+(live?" · read live from the open dataset.":" · showing the bundled copy (live fetch unavailable).");
    render(S);
  }
  function latestDate(S){ if(S.AGG&&S.AGG.latest) return S.AGG.latest; var d=S.DATA.map(function(r){return r.date;}).sort(); return d[d.length-1]; }
  function scopeAgg(S,scope){ if(!S.AGG||!S.AGG.snapshots) return null; var blk=S.AGG.snapshots[S.AGG.latest]; if(!blk) return null; return blk[scope==="TV"?"Tees Valley":scope]||null; }

  /* ---- spine series helpers (trends) ---- */
  function boroughSeries(S,bor,measure){
    var byDate={};
    S.DATA.forEach(function(r){ if(r.bor!==bor) return; (byDate[r.date]=byDate[r.date]||{})[r.seg]=r.active; });
    var out=[];
    Object.keys(byDate).forEach(function(d){ var row=byDate[d];
      if(measure==="ALL"){ var have=SEGMENTS.filter(function(s){return s in row;});
        if(have.length) out.push({t:Date.parse(d),date:d,v:have.reduce(function(a,s){return a+row[s];},0),partial:have.length<SEGMENTS.length}); }
      else if(measure in row){ out.push({t:Date.parse(d),date:d,v:row[measure],partial:false}); } });
    return out.sort(function(a,b){return a.t-b.t;});
  }
  function tvSeries(S,measure){
    var perDate={};
    BORO.forEach(function(b){ boroughSeries(S,b[0],measure).forEach(function(p){ (perDate[p.date]=perDate[p.date]||{})[b[0]]=p; }); });
    var out=[]; Object.keys(perDate).forEach(function(d){ var row=perDate[d], bs=Object.keys(row);
      out.push({t:Date.parse(d),date:d,v:bs.reduce(function(a,k){return a+row[k].v;},0),
        partial:bs.length<BORO.length||bs.some(function(k){return row[k].partial;})}); });
    return out.sort(function(a,b){return a.t-b.t;});
  }
  function segmentSeries(S,scope,seg){
    if(scope==="TV"){ var perDate={};
      BORO.forEach(function(b){ S.DATA.forEach(function(r){ if(r.bor===b[0]&&r.seg===seg) (perDate[r.date]=perDate[r.date]||{})[b[0]]=r.active; }); });
      var out=[]; Object.keys(perDate).forEach(function(d){ var row=perDate[d], bs=Object.keys(row);
        out.push({t:Date.parse(d),date:d,v:bs.reduce(function(a,k){return a+row[k];},0),partial:bs.length<BORO.length}); });
      return out.sort(function(a,b){return a.t-b.t;}); }
    return S.DATA.filter(function(r){return r.bor===scope&&r.seg===seg;}).map(function(r){return {t:r.t,date:r.date,v:r.active,partial:false};}).sort(function(a,b){return a.t-b.t;});
  }

  function render(S){
    var col=colours(S.root); S.col=col;
    var measure=S.q('.j-seg').value, scope=S.q('.j-bor').value;
    computeWindow(S);
    if(S.q('.j-rangeout')) S.q('.j-rangeout').textContent=(S.winFrom!=null?fmtTS(S.winFrom)+" \u2013 "+fmtTS(S.winTo):"");
    renderRangeLine(S);
    S.root.classList.toggle('rc-borough', scope!=='TV');
    if(scope!=='TV'){ var selInk=(rcIsDark()?LA_INK_DARK:LA_INK_LIGHT)[scope]||col.bor[scope]; S.root.style.setProperty('--sel', col.bor[scope]); S.root.style.setProperty('--sel-ink', selInk); S.accFill=col.bor[scope]; S.accInk=selInk; } else { S.accFill=col.accent; S.accInk=col.accent; }
    (function(){ var tag='';
      if(scope!=='TV'){ var nm=(BORO.filter(function(b){return b[0]===scope;})[0]||['',scope])[1];
        var ink=(rcIsDark()?LA_INK_DARK:LA_INK_LIGHT)[scope]||col.bor[scope];
        tag='<span class="scopetag" style="color:'+ink+'">'+vicon('map-pin',15)+'<span>'+esc(nm)+'</span></span>'; }
      S.root.querySelectorAll('.panel:not(.panel--noscope)').forEach(function(p){ var ex=p.querySelector(':scope > .scopetag');
        if(!tag){ if(ex) ex.remove(); p.classList.remove('has-scopetag'); return; }
        if(ex){ ex.outerHTML=tag; } else { p.insertAdjacentHTML('afterbegin', tag); } p.classList.add('has-scopetag'); }); })();
    var sLabel=scope==="TV"?"Tees Valley":(BORO.filter(function(b){return b[0]===scope;})[0]||["",scope])[1];
    S.q('.j-scope').innerHTML="Showing <b>"+esc(measure==="ALL"?"All VCFSE":measure)+"</b> · "+esc(sLabel);
    var A=scopeAgg(S,scope);
    renderKPIs(S,A,sLabel);
    // trends
    if(S.DATA.length){
      var series1=BORO.map(function(b){ return {key:b[0],name:b[1],color:col.bor[b[0]],pts:boroughSeries(S,b[0],measure)}; });
      if(scope==="TV"){
        S.q('.j-c1t').textContent=(measure==="ALL"?"Active VCFSE organisations":("Active "+segLabel(measure)))+" by authority";
        S.q('.j-c1sub').textContent="Based-in, active \u00b7 one line per authority";
      } else {
        S.q('.j-c1t').textContent=(measure==="ALL"?"Active VCFSE organisations":("Active "+segLabel(measure)))+" in "+sLabel;
        S.q('.j-c1sub').textContent="Based-in, active \u00b7 "+sLabel+" shown \u2014 tap another authority to compare";
      }
      drawChart(S,'.j-chart1',series1.filter(function(s){return !S.hidden1[s.key]&&s.pts.length;}),'.j-leg1',series1,S.hidden1);
      var series2=[{key:"TOTAL",name:"Total VCFSE",color:col.tv,pts:(scope==="TV"?tvSeries(S,"ALL"):boroughSeries(S,scope,"ALL")),dashed:true}];
      SEGMENTS.forEach(function(s){ series2.push({key:s,name:segLabel(s),color:col.seg[s],pts:segmentSeries(S,scope,s)}); });
      S.q('.j-c2t').textContent="Active VCFSE over time — "+sLabel;
      drawChart(S,'.j-chart2',series2.filter(function(s){return !S.hidden2[s.key]&&s.pts.length;}),'.j-leg2',series2,S.hidden2);
      renderMatrix(S);
    }
    if(A) renderDetail(S,A,sLabel);
  }

  /* KPI strip — two data-basis groups. The first two tiles describe the whole
     registered VCFSE sector (and the NAVCA whole-sector projection); the other
     four are charity-derived — income and websites only exist on the Charity
     Commission register, so they are grouped and captioned as charities-only.
     The website rate is therefore charities-denominated (has_web / total
     charities), not diluted by the non-charity segments that cannot file one. */
  function renderKPIs(S,A,sLabel){
    var box=S.q('.j-kpis');
    if(!A){ box.innerHTML='<div class="loading">Loading the latest snapshot…</div>'; return; }
    function tile(it,grp){ return '<div class="kpi '+grp+'"><div class="v tnum">'+esc(it[0])+'</div><div class="l">'+esc(it[1])+'</div><div class="s">'+esc(it[2])+'</div></div>'; }
    var charN=(A.legal&&A.legal.total_charities)||0;
    var webChar=charN?Math.round(100*A.has_web/charN):A.web_pct;
    var allTiles=[
      [commas(A.active),"Registered Orgs","based-in · "+fmtDate(latestDate(S))],
      ["~"+commas(A.navca.total),"Est. Whole Sector","inc. unregistered"]
    ];
    var charTiles=[
      [gbp(A.sector_value),"Sector turnover","latest-year income"],
      [gbpFull(A.median_income),"Median income","of those reporting"],
      [A.concentration.top10+"%","Top-10 share","of charity income"],
      [webChar+"%","Declared a website","of registered charities"]
    ];
    box.innerHTML='<div class="kheads"><div class="ghead ghead-all"><span class="sw sw-all"></span>All VCFSE · whole registered sector</div><div class="ghead ghead-char"><span class="sw sw-char"></span>Registered charities only</div></div>'
      +'<div class="kpiblock">'+allTiles.map(function(it){return tile(it,'g-all');}).join('')+charTiles.map(function(it){return tile(it,'g-char');}).join('')+'</div>'
      +'<div class="kfoots"><p class="kfoot kfoot-all"><b>Whole sector count</b> includes unregistered organisations projected through the NAVCA model.</p><p class="kfoot kfoot-char"><b>Income and website figures cover registered charities only.</b> CICs, registered societies and CASCs don’t file income or a website through their registers, so the sector’s true turnover and online presence are higher than shown.</p></div>';
  }

  function renderDetail(S,A,sLabel){
    var col=S.col;
    // by type
    S.q('.j-typesub').textContent="Active based-in organisations · "+sLabel;
    var maxSeg=Math.max.apply(null,SEGMENTS.map(function(s){return A.by_segment[s]||0;}))||1;
    S.q('.j-type').innerHTML=SEGMENTS.map(function(s){ var n=A.by_segment[s]||0;
      return '<div class="bar-row"><div class="lab">'+segLabel(s)+'</div><div class="track"><div class="fill" style="width:'+(100*n/maxSeg)+'%;background:'+col.seg[s]+'"></div></div><div class="val">'+commas(n)+'</div></div>'; }).join("");
    // legal
    var L=A.legal; S.q('.j-legalsub').textContent=commas(L.total_charities)+" active registered charities";
    var inc=L.incorporated, uninc=L.unincorporated, tot=inc+uninc||1;
    S.q('.j-legalsplit').innerHTML='<div style="flex:'+inc+';background:'+col.seg.Charities+'" title="Incorporated">'+(inc/tot>0.12?"Incorporated "+commas(inc):"")+'</div>'
      +'<div style="flex:'+uninc+';background:'+col.accent+'" title="Unincorporated">'+(uninc/tot>0.12?"Unincorporated "+commas(uninc):"")+'</div>';
    S.q('.j-legalmini').innerHTML=[["CIO — foundation",L.cio_foundation],["CIO — association",L.cio_association],["Charitable company",L.charitable_company],["Trust",L.trust]]
      .map(function(r){return '<div class="r"><span class="k">'+r[0]+'</span><span>'+commas(r[1])+'</span></div>';}).join("");
    // decades — horizontal bars, stacked by segment type (handles legacy flat shape too)
    var DEC_ORDER=["Societies","Charities","CICs","CASCs"];
    function decSegs(d){ var v=A.decades[d]; if(v&&typeof v==='object'){ return DEC_ORDER.map(function(s){return [s,v[s]||0];}); } return [["",(+v||0)]]; }
    function decTot(d){ return decSegs(d).reduce(function(a,x){return a+x[1];},0); }
    var maxD=Math.max.apply(null,DECADES.map(decTot))||1;
    S.q('.j-decades').innerHTML=DECADES.map(function(d){ var tot=decTot(d);
      var stack=decSegs(d).filter(function(x){return x[1]>0;}).map(function(x){ var c=x[0]?col.seg[x[0]]:col.accent; return '<span style="width:'+(100*x[1]/maxD)+'%;background:'+c+'" title="'+esc((x[0]?segLabel(x[0]):'All')+': '+commas(x[1]))+'"></span>'; }).join('');
      return '<div class="bar-row"><div class="lab">'+esc(d)+'</div><div class="track stack">'+stack+'</div><div class="val">'+commas(tot)+'</div></div>'; }).join("");
    var present=DEC_ORDER.filter(function(s){ return DECADES.some(function(d){ var v=A.decades[d]; return v&&typeof v==='object'&&(v[s]||0)>0; }); });
    S.q('.j-decleg').innerHTML=present.map(function(s){ return '<span class="legitem"><span class="dot" style="background:'+col.seg[s]+'"></span>'+esc(segLabel(s))+'</span>'; }).join('');
    // income bands
    S.q('.j-incsub').textContent=commas(A.no_income)+" report no income · avg "+gbpFull(A.avg_income);
    var maxB=Math.max.apply(null,BANDS.map(function(b){return A.income_bands[b]||0;}))||1;
    S.q('.j-income').innerHTML=BANDS.map(function(b){ var n=A.income_bands[b]||0;
      return '<div class="bar-row"><div class="lab">'+b+'</div><div class="track"><div class="fill" style="width:'+(100*n/maxB)+'%"></div></div><div class="val">'+commas(n)+'</div></div>'; }).join("");
    // size
    var sz=A.size, sv=A.sector_value||1;
    S.q('.j-size').innerHTML=[["large","£100k and over"],["medium","£10k–£100k"],["small","under £10k"],["none","no income reported"]].map(function(k){ var b=sz[k[0]];
      return '<div class="size-row"><div class="sl">'+({large:"Large",medium:"Medium",small:"Small",none:"None"})[k[0]]+'<small>'+k[1]+'</small></div>'
        +'<div class="track"><div class="fill" style="width:'+(b.pct||(b.n?2:0))+'%;background:'+S.accFill+'"></div></div>'
        +'<div class="sv">'+commas(b.n)+'<small>'+gbp(b.val)+' · '+b.pct+'%</small></div></div>'; }).join("");
    // concentration
    S.q('.j-concsub').textContent="Share of the sector's "+gbp(A.sector_value)+" held by the largest organisations";
    var t10=A.concentration.top10; S.q('.j-conctop').style.width=t10+"%"; S.q('.j-conctop').textContent=t10>=12?("Top 10 = "+t10+"%"):"";
    S.q('.j-concmini').innerHTML='<div class="r"><span class="k">Largest 10 organisations</span><span>'+t10+'% of the money</span></div><div class="r"><span class="k">Largest 25 organisations</span><span>'+A.concentration.top25+'% of the money</span></div>';
    // digital donut
    var pct=A.web_pct, r=52, c=2*Math.PI*r, on=c*pct/100;
    S.q('.j-donut').innerHTML='<circle cx="66" cy="66" r="52" fill="none" stroke="'+col.muted+'" stroke-opacity=".25" stroke-width="16"/>'
      +'<circle cx="66" cy="66" r="52" fill="none" stroke="'+S.accFill+'" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+on+' '+c+'" transform="rotate(-90 66 66)"/>'
      +'<text x="66" y="62" text-anchor="middle" font-size="24" font-weight="800" fill="'+S.accInk+'">'+pct+'%</text>'
      +'<text x="66" y="82" text-anchor="middle" font-size="11" fill="'+col.muted+'">have a site</text>';
    S.q('.j-digmini').innerHTML='<div class="r"><span class="k">With a website</span><span>'+commas(A.has_web)+'</span></div><div class="r"><span class="k">No website found</span><span>'+commas(A.active-A.has_web)+'</span></div>';
    // projection
    var nv=A.navca;
    S.q('.j-proj').innerHTML='<div class="mini" style="margin-top:2px">'
      +'<div class="r"><span class="k">Registered charities (on the register)</span><span>'+commas(nv.registered)+'</span></div>'
      +'<div class="r"><span class="k">Unregistered community groups (est.)</span><span>~'+commas(nv.community)+'</span></div>'
      +'<div class="r"><span class="k">Social enterprises (est.)</span><span>~'+commas(nv.social)+'</span></div>'
      +'<div class="r" style="border-bottom:none"><span class="k"><b>Estimated whole sector</b></span><span><b>~'+commas(nv.total)+'</b></span></div></div>';
    // top10
    S.q('.j-topsub').textContent="By latest-year income · "+sLabel;
    var maxI=(A.top10[0]&&A.top10[0].income)||1;
    S.q('.j-top').innerHTML='<thead><tr><th>#</th><th>Organisation</th><th>Authority</th><th></th><th class="n">Income</th></tr></thead><tbody>'
      +A.top10.map(function(o,i){ return '<tr><td>'+(i+1)+'</td><td>'+esc(o.name)+'</td><td>'+esc(o.la.replace("Redcar-and-Cleveland","Redcar & Cleveland"))+'</td>'
        +'<td style="width:110px"><div class="tbar" style="width:'+Math.max(4,100*o.income/maxI)+'%"></div></td><td class="n">'+gbp(o.income)+'</td></tr>'; }).join("")+'</tbody>';
  }

  function renderMatrix(S){
    var L=latestDate(S), t=S.q('.j-matrix');
    S.q('.j-mxsub').textContent="Active based-in organisations · "+fmtDate(L);
    var head="<thead><tr><th>Authority</th>"+SEGMENTS.map(function(s){return "<th>"+(s==="Charities"?"Char.":s)+"</th>";}).join("")+"<th>Total</th></tr></thead>";
    var body="<tbody>", colTot={}, grand=0; SEGMENTS.forEach(function(s){colTot[s]=0;});
    BORO.forEach(function(b){ body+="<tr><td><span class='chip' style='background:"+S.col.bor[b[0]]+"'></span>"+esc(b[1])+"</td>"; var rt=0;
      SEGMENTS.forEach(function(s){ var rows=S.DATA.filter(function(r){return r.bor===b[0]&&r.seg===s&&r.date===L;}); var v=rows.length?rows[0].active:null; if(v!=null){rt+=v;colTot[s]+=v;} body+="<td>"+(v==null?"–":v)+"</td>"; });
      grand+=rt; body+="<td><b>"+rt+"</b></td></tr>"; });
    body+="</tbody>";
    var foot="<tfoot><tr><td>Tees Valley</td>"+SEGMENTS.map(function(s){return "<td>"+colTot[s]+"</td>";}).join("")+"<td>"+grand+"</td></tr></tfoot>";
    t.innerHTML=head+body+foot;
  }

  function niceStep(x){ if(x<=0)return 1; var p=Math.pow(10,Math.floor(Math.log(x)/Math.LN10)), f=x/p; return (f<1.5?1:f<3?2:f<7?5:10)*p; }
  function fitScale(vals){
    if(!vals.length) return {v0:0,v1:1};
    var dmin=Math.min.apply(null,vals), dmax=Math.max.apply(null,vals), sp=(dmax-dmin)||dmax||1;
    var a=(dmin<=dmax*0.2)?0:(dmin-sp*0.15), b=dmax+sp*0.12;
    var st=niceStep((b-a)/4); a=Math.max(0,Math.floor(a/st)*st); b=Math.ceil(b/st)*st; if(b<=a)b=a+st;
    return {v0:a,v1:b};
  }
  function drawChart(S,hostSel,series,legSel,allSeries,hiddenMap){
    var host=S.q(hostSel), tip=S.tip;
    var cardBg=getComputedStyle((host.closest&&host.closest('.panel'))||host).backgroundColor||'#fff';
    var lo=(S.winFrom!=null)?S.winFrom:-Infinity, hi=(S.winTo!=null)?S.winTo:Infinity;
    var vseries=series.map(function(s){ return {key:s.key,name:s.name,color:s.color,dashed:s.dashed,secondary:s.secondary,pts:s.pts.filter(function(p){return p.t>=lo && p.t<=hi && !p.partial;})}; });
    var leg=S.q(legSel); leg.innerHTML="";
    allSeries.forEach(function(s){ if(!s.pts.length) return;
      var b=document.createElement('button'); b.setAttribute('aria-pressed',hiddenMap[s.key]?"false":"true");
      b.innerHTML='<span class="dot" style="background:'+s.color+'"></span>'+esc(s.name);
      b.addEventListener('click',function(){ hiddenMap[s.key]=!hiddenMap[s.key]; render(S); }); leg.appendChild(b); });
    var anyPartial=vseries.some(function(s){return s.pts.some(function(p){return p.partial;});});
    var pri=vseries.filter(function(s){return !s.secondary && s.pts.length;});
    var sec=vseries.filter(function(s){return s.secondary && s.pts.length;});
    var dual=(pri.length>0 && sec.length>0);
    if(dual){ var sn=document.createElement('span'); sn.className='leg-note'; sn.innerHTML='<span class="ax2-key" style="background:'+sec[0].color+'"></span>right axis'; leg.appendChild(sn); }
    if(anyPartial){ var pn=document.createElement('span'); pn.className='leg-note'; pn.innerHTML='<span class="mk-part-key"></span>partial snapshot'; leg.appendChild(pn); }
    var ts=[]; vseries.forEach(function(s){s.pts.forEach(function(p){ts.push(p.t);});});
    if(!ts.length){ host.innerHTML='<div class="loading">No data for this selection yet.</div>'; return; }
    var W=host.clientWidth||680, H=300, P={t:14,r:(dual?52:20),b:30,l:42};
    var t0=Math.min.apply(null,ts), t1=Math.max.apply(null,ts); if(t0===t1){t0-=6e8;t1+=6e8;}
    var leftVals=[]; (dual?pri:vseries).forEach(function(s){s.pts.forEach(function(p){leftVals.push(p.v);});});
    var L=fitScale(leftVals);
    var rightVals=[]; sec.forEach(function(s){s.pts.forEach(function(p){rightVals.push(p.v);});});
    var R=dual?fitScale(rightVals):L;
    function X(t){return P.l+(t-t0)/(t1-t0)*(W-P.l-P.r);}
    function YL(v){return H-P.b-(v-L.v0)/(L.v1-L.v0)*(H-P.t-P.b);}
    function YR(v){return H-P.b-(v-R.v0)/(R.v1-R.v0)*(H-P.t-P.b);}
    function yFor(s){return (s.secondary&&dual)?YR(s.v):YL(s.v);}
    var svg='<svg class="chart" viewBox="0 0 '+W+' '+H+'" width="100%" preserveAspectRatio="xMidYMid meet" role="img">';
    for(var i=0;i<=4;i++){ var y=H-P.b-(H-P.t-P.b)*i/4;
      svg+='<line class="grid-l" x1="'+P.l+'" y1="'+y.toFixed(1)+'" x2="'+(W-P.r)+'" y2="'+y.toFixed(1)+'"/>';
      svg+='<text class="axlab" x="'+(P.l-7)+'" y="'+(y+3).toFixed(1)+'" text-anchor="end">'+commas(Math.round(L.v0+(L.v1-L.v0)*i/4))+'</text>';
      if(dual) svg+='<text class="axlab ax2" x="'+(W-P.r+7)+'" y="'+(y+3).toFixed(1)+'" text-anchor="start" fill="'+sec[0].color+'">'+commas(Math.round(R.v0+(R.v1-R.v0)*i/4))+'</text>';
    }
    svg+='<line class="axis" x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'"/>';
    var allDates={}; vseries.forEach(function(s){s.pts.forEach(function(p){allDates[p.date]=p.t;});});
    var dk=Object.keys(allDates).sort(function(a,b){return allDates[a]-allDates[b];});
    var lastLX=-1e9, minLGap=52;
    dk.forEach(function(d,idx){
      var lx=X(allDates[d]), isEnd=(idx===0||idx===dk.length-1);
      if(!isEnd && (lx-lastLX)<minLGap) return;
      var la=(lx<=P.l+2?'start':(lx>=W-P.r-2?'end':'middle'));
      svg+='<text class="axlab" x="'+lx.toFixed(1)+'" y="'+(H-P.b+16)+'" text-anchor="'+la+'">'+fmtShort(d)+'</text>'; lastLX=lx;
    });
    var topKey=null,topV=-1; pri.forEach(function(s){ var lv=s.pts[s.pts.length-1].v; if(lv>topV){topV=lv;topKey=s.key;}});
    var marks='', endlabs=[];
    vseries.forEach(function(s){
      var YP=function(v){return (s.secondary&&dual)?YR(v):YL(v);};
      var comp=s.pts.filter(function(p){return !p.partial;});
      if(comp.length){ var d=''; comp.forEach(function(p,i){ d+=(i?'L':'M')+X(p.t).toFixed(1)+' '+YP(p.v).toFixed(1)+' '; });
        svg+='<path class="series" d="'+d+'" stroke="'+s.color+'"'+(s.dashed?' stroke-dasharray="5 4" stroke-width="1.8"':'')+'/>'; }
      var showAll=comp.length<=14;
      s.pts.forEach(function(p,i){
        var isEndPt=(i===0||i===s.pts.length-1);
        if(p.partial){ marks+='<circle class="mk" cx="'+X(p.t).toFixed(1)+'" cy="'+YP(p.v).toFixed(1)+'" r="3.2" fill="'+cardBg+'" stroke="'+s.color+'" stroke-width="1.6"/>'; }
        else if(showAll||isEndPt){ marks+='<circle class="mk" cx="'+X(p.t).toFixed(1)+'" cy="'+YP(p.v).toFixed(1)+'" r="3.4" fill="'+s.color+'" stroke="'+cardBg+'" stroke-width="1.2"/>'; }
        marks+='<circle class="mk-hit" cx="'+X(p.t).toFixed(1)+'" cy="'+YP(p.v).toFixed(1)+'" r="11" data-l="'+esc(s.name+' · '+fmtDate(p.date)+': '+commas(p.v)+(p.partial?' · partial':''))+'"/>';
      });
      if(comp.length){ var last=comp[comp.length-1];
        if(s.secondary&&dual){ endlabs.push({x:X(last.t)-7,y:YP(last.v)+3,color:s.color,text:commas(last.v),anchor:'end'}); }
        else { endlabs.push({x:X(last.t)+6,y:YP(last.v)+3,color:s.color,text:commas(last.v),anchor:'start'}); } }
    });
    endlabs.sort(function(a,b){return a.y-b.y;});
    for(var e=1;e<endlabs.length;e++){ if(endlabs[e].y-endlabs[e-1].y<13) endlabs[e].y=endlabs[e-1].y+13; }
    endlabs.forEach(function(l){ svg+='<text class="dlab" x="'+l.x.toFixed(1)+'" y="'+l.y.toFixed(1)+'" text-anchor="'+(l.anchor||'start')+'" fill="'+l.color+'">'+l.text+'</text>'; });
    svg+=marks+'</svg>'; host.innerHTML=svg;
    host.querySelectorAll('.mk-hit').forEach(function(c){
      c.addEventListener('mousemove',function(e){ tip.textContent=c.getAttribute('data-l'); tip.style.opacity=1; tip.style.left=(e.clientX+12)+'px'; tip.style.top=(e.clientY-10)+'px'; });
      c.addEventListener('mouseleave',function(){ tip.style.opacity=0; }); });
  }

  function spineDates(S){ var dm={}; (S.DATA||[]).forEach(function(r){ if(r&&r.date!=null) dm[r.date]=r.t; }); return Object.keys(dm).map(function(d){return {date:d,t:dm[d]};}).sort(function(a,b){return a.t-b.t;}); }
  function computeWindow(S){ var ds=spineDates(S); if(!ds.length){ S.winFrom=null; S.winTo=null; return; } var t0=ds[0].t, t1=ds[ds.length-1].t; S.winTo=t1; if(S.range==='custom'){ if(S.winFrom==null||S.winFrom<t0||S.winFrom>t1) S.winFrom=t0; return; } if(S.range==='all'){ S.winFrom=t0; } else if(S.range==='12m'){ S.winFrom=Math.max(t0,t1-365*864e5); } else { S.winFrom=Math.max(t0,t1-548*864e5); } }
  function fmtTS(t){ var d=new Date(t); return MONTHS[d.getUTCMonth()]+" "+String(d.getUTCFullYear()).slice(2); }
  function renderRangeLine(S){
    var host=S.q('.j-rangeline'); if(!host) return;
    var ds=spineDates(S); if(ds.length<2){ host.innerHTML=''; return; }
    var t0=ds[0].t, t1=ds[ds.length-1].t, W=host.clientWidth||620, H=34, Pl=10, Pr=10, base=H-14;
    function X(t){ return Pl+(t-t0)/(t1-t0)*(W-Pl-Pr); }
    var from=(S.winFrom!=null)?S.winFrom:t0, to=(S.winTo!=null)?S.winTo:t1;
    S._rl={t0:t0,t1:t1,W:W,ds:ds,X:X};
    var svg='<svg class="rlsvg" width="100%" height="'+H+'" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="Data timeline and selected range">';
    svg+='<line class="rl-base" x1="'+Pl+'" y1="'+base+'" x2="'+(W-Pr)+'" y2="'+base+'"/>';
    svg+='<rect class="rl-win" x="'+X(from).toFixed(1)+'" y="'+(base-6)+'" width="'+Math.max(0,(X(to)-X(from))).toFixed(1)+'" height="12" rx="2"/>';
    ds.forEach(function(d){ var x=X(d.t), on=(d.t>=from&&d.t<=to); svg+='<line class="rl-tick'+(on?' on':'')+'" x1="'+x.toFixed(1)+'" y1="'+(base-6)+'" x2="'+x.toFixed(1)+'" y2="'+(base+4)+'"/>'; });
    var hx=X(from).toFixed(1);
    svg+='<g class="rl-h"><line x1="'+hx+'" y1="'+(base-10)+'" x2="'+hx+'" y2="'+(base+6)+'"/><circle cx="'+hx+'" cy="'+(base-2)+'" r="5.5"/></g>';
    svg+='</svg>';
    host.innerHTML=svg+'<span class="rl-lab rl-lab-l">'+esc(fmtShort(ds[0].date))+'</span><span class="rl-lab rl-lab-r">'+esc(fmtShort(ds[ds.length-1].date))+'</span>';
    if(!host.__rlbound){ host.__rlbound=1; var dragging=false;
      function pxOf(e){ var r=host.getBoundingClientRect(); return (e.clientX-r.left)/r.width*S._rl.W; }
      function nearestT(px){ var best=S._rl.ds[0], bd=1e18; S._rl.ds.forEach(function(d){ var dx=Math.abs(S._rl.X(d.t)-px); if(dx<bd){bd=dx;best=d;} }); return best.t; }
      function live(px){ S.winFrom=nearestT(px); S.winTo=S._rl.t1; renderRangeLine(S); }
      function commit(){ S.range='custom'; var rb=S.q('.j-range'); if(rb) rb.querySelectorAll('button').forEach(function(x){x.classList.remove('on');}); render(S); }
      host.addEventListener('pointerdown',function(e){ dragging=true; try{host.setPointerCapture(e.pointerId);}catch(_){} live(pxOf(e)); e.preventDefault(); });
      host.addEventListener('pointermove',function(e){ if(!dragging)return; live(pxOf(e)); });
      host.addEventListener('pointerup',function(e){ if(!dragging)return; dragging=false; commit(); });
      host.addEventListener('pointercancel',function(){ if(!dragging)return; dragging=false; commit(); });
    }
  }
  function bootAll(){ var tip=ensureTip(); var list=document.querySelectorAll('.rcvda-vcse-sector'); for(var i=0;i<list.length;i++){ if(!list[i].__sots){ list[i].__sots=1; initOne(list[i],tip); } } }
  if(document.readyState!=="loading") bootAll(); else document.addEventListener('DOMContentLoaded',bootAll);
})();
