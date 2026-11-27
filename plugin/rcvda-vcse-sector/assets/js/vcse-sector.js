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
    +'<dt>Income vs GVA</dt><dd>Total latest-year income of the active registered charities that report one, shown as a share of the area’s gross value added (ONS, balanced, current prices, '+GVA_YEAR+'). Income is turnover, not value added, so this is a scale comparison, not the sector’s share of the economy.</dd>'
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

      +'<div class="band"><h3>'+vicon("trending-up",20)+'Sector Size Over Time</h3><div class="rule"></div></div>'
      +'<div class="trendctl rangebox"><div class="rangehead"><label>Range</label><span class="rangebar j-range" role="group" aria-label="Trend time range"><button type="button" data-r="fit" class="on">Recent</button><button type="button" data-r="12m">12 mths</button><button type="button" data-r="all">All</button></span><span class="rangeout j-rangeout"></span></div><div class="rangeline j-rangeline"></div></div>'
      +'<section class="grid"><div class="panel col-7"><div class="panel-head"><h2 class="j-c2t">Active VCFSE Over Time</h2><div class="sub">Based-in, active · total and four segments</div></div><div class="j-chart2"></div><div class="legend j-leg2"></div></div>'
      +'<div class="panel col-5 panel--noscope"><div class="panel-head"><h2>Latest Snapshot</h2><div class="sub j-mxsub">Active based-in organisations</div></div><table class="matrix j-matrix"></table></div></section>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2 class="j-c1t">Active VCFSE Organisations by Authority</h2><div class="sub j-c1sub">Based-in, active · one line per authority</div></div><div class="trendctl trendctl--inpanel"><label>Measure</label><input type="hidden" class="j-seg" value="ALL"><div class="segchips" role="group" aria-label="Measure"><button type="button" class="borchip is-active" data-value="ALL" aria-pressed="true" style="--cat:var(--tv-navy,#2A3B72)">All VCFSE</button><button type="button" class="borchip" data-value="Charities" aria-pressed="false" style="--cat:var(--c-charity,#211D47)">Registered Charities</button><button type="button" class="borchip" data-value="CICs" aria-pressed="false" style="--cat:var(--c-cic,#E52D13)">CICs</button><button type="button" class="borchip" data-value="Societies" aria-pressed="false" style="--cat:var(--c-society,#6C1D45)">Societies</button><button type="button" class="borchip" data-value="CASCs" aria-pressed="false" style="--cat:var(--c-casc,#0E8A4F)">CASCs</button></div><span class="tag j-scope"></span></div><div class="j-chart1"><div class="loading">Loading…</div></div><div class="legend j-leg1"></div></div></section>'

      +'<div class="band"><h3>'+vicon("chart-pie",20)+'The Sector by Type</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>Active Sector by Type</h2><div class="sub j-typesub"></div></div><div class="bars j-type"></div></div>'
      +'<div class="panel col-6"><div class="panel-head"><h2>'+vicon("users",18)+'Projected Whole Sector</h2><div class="sub">What NAVCA predicts vs what’s on the register</div></div><div class="j-proj"></div></div></section>'

      +'<div class="band"><h3>'+vicon("calendar",20)+'Structure &amp; Age</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2>When the Sector Was Founded</h2><div class="sub j-decsub">Active organisations by decade of registration, coloured by type (oldest to most recent). CASCs carry no registration date, so are not shown.</div></div><div class="bars j-decades"></div><div class="legend j-decleg"></div></div></section>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2>Registered Charities\u2019 Legal Structure</h2><div class="sub j-legalsub"></div></div><div class="split j-legalsplit"></div><div class="grp2 j-legalgrp"></div></div>'
      +'<div class="panel col-12"><div class="panel-head"><h2>Social Enterprise Types</h2><div class="sub j-sesub"></div></div><div class="split j-sesplit"></div><div class="grp2 j-segrp"></div></div></section>'

      +'<div class="band"><h3>'+vicon("pound-sterling",20)+'Money</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>'+vicon("pound-sterling",18)+'Turnover of the Active Sector</h2><div class="sub j-incsub"></div></div><div class="bars j-income"></div></div>'
      +'<div class="panel col-6"><div class="panel-head"><h2>'+vicon("scale",18)+'Large vs Small</h2><div class="sub">How the money concentrates by organisation size</div></div><div class="j-size"></div></div>'
      +'<div class="panel col-12"><div class="panel-head"><h2>'+vicon("chart-pie",18)+'Income Concentration</h2><div class="sub j-concsub"></div></div><div class="conc-bar"><div class="top j-conctop"></div></div><div class="mini j-concmini"></div></div>'
      +'<div class="panel col-12"><div class="panel-head"><h2>'+vicon("building",18)+'Turnover Compared With the Business Base</h2><div class="sub j-onssub"></div></div><div class="j-onscmp"></div></div></section>'

      +'<div class="band"><h3>'+vicon("globe",20)+'Digital &amp; Projection</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>'+vicon("globe",18)+'Digital Presence</h2><div class="sub">Active organisations with a website</div></div><div class="donut-wrap"><svg class="j-donut" width="122" height="122" viewBox="0 0 132 132" role="img"></svg><div class="mini j-digmini" style="flex:1"></div></div></div></section>'

      +'<div class="band"><h3>'+vicon("building",20)+'The Largest Organisations</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2>'+vicon("building",18)+'Ten Largest Active Organisations by Income</h2><div class="sub j-topsub"></div></div><table class="toptable j-top"></table></div></section>'

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
        S.q('.j-c1t').textContent=(measure==="ALL"?"Active VCFSE Organisations":("Active "+segLabel(measure)))+" by Authority";
        S.q('.j-c1sub').textContent="Based-in, active \u00b7 one line per authority";
      } else {
        S.q('.j-c1t').textContent=(measure==="ALL"?"Active VCFSE Organisations":("Active "+segLabel(measure)))+" in "+sLabel;
        S.q('.j-c1sub').textContent="Based-in, active \u00b7 "+sLabel+" shown \u2014 tap another authority to compare";
      }
      drawChart(S,'.j-chart1',series1.filter(function(s){return !S.hidden1[s.key]&&s.pts.length;}),'.j-leg1',series1,S.hidden1);
      var series2=[{key:"TOTAL",name:"Total VCFSE",color:col.tv,pts:(scope==="TV"?tvSeries(S,"ALL"):boroughSeries(S,scope,"ALL")),dashed:true}];
      SEGMENTS.forEach(function(s){ series2.push({key:s,name:segLabel(s),color:col.seg[s],pts:segmentSeries(S,scope,s)}); });
      S.q('.j-c2t').textContent="Active VCFSE Over Time — "+sLabel;
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
  /* Gross value added (balanced) at current basic prices, £ million — ONS
     "Regional gross domestic product: local authorities", 1998 to 2024 edition
     (released 23/09/2026), Table 1, year 2024 (provisional). Tees Valley = sum
     of the five unitary authorities. Keyed by aggregate-block name. */
  var GVA_YEAR=2024, GVA_M={"Hartlepool":1735,"Middlesbrough":3831,"Redcar-and-Cleveland":2228,"Stockton-on-Tees":6171,"Darlington":3059};
  GVA_M["Tees Valley"]=GVA_M["Hartlepool"]+GVA_M["Middlesbrough"]+GVA_M["Redcar-and-Cleveland"]+GVA_M["Stockton-on-Tees"]+GVA_M["Darlington"];
  /* Tees Valley business base by turnover — ONS UK Business Counts, enterprises by
     industry and turnover size band (Nomis NM_199_1), March 2026, all industries.
     "all" = all VAT and/or PAYE based enterprises; "np" = legal status "Non-profit body
     or mutual association". Counts are rounded by ONS to the nearest 5, so each total
     here is the sum of its bands. Refresh annually (released each autumn). */
  var ONS_TB_DATE="March 2026", ONS_TB_LABELS=["\u00a30\u2013\u00a349k","\u00a350k\u2013\u00a399k","\u00a3100k\u2013\u00a3249k","\u00a3250k\u2013\u00a3499k","\u00a3500k\u2013\u00a3999k","\u00a31m\u2013\u00a31.99m","\u00a32m\u2013\u00a34.99m","\u00a35m\u2013\u00a39.99m","\u00a310m\u2013\u00a349.99m","\u00a350m+"],
  ONS_TB={"Darlington":{all:[410, 675, 1200, 500, 290, 180, 110, 35, 35, 15],np:[15, 15, 25, 25, 10, 10, 5, 0, 0, 0]},"Hartlepool":{all:[235, 430, 850, 325, 190, 110, 55, 20, 25, 5],np:[5, 15, 25, 25, 10, 5, 5, 0, 0, 0]},"Middlesbrough":{all:[330, 700, 1310, 540, 315, 170, 120, 55, 40, 20],np:[5, 20, 25, 15, 20, 10, 5, 0, 0, 0]},"Redcar-and-Cleveland":{all:[295, 705, 1165, 400, 290, 145, 95, 40, 25, 15],np:[10, 20, 35, 25, 15, 5, 5, 0, 0, 0]},"Stockton-on-Tees":{all:[610, 1185, 2010, 780, 460, 315, 225, 90, 85, 25],np:[10, 25, 40, 30, 25, 10, 5, 0, 0, 0]}};
  ONS_TB["Tees Valley"]=(function(){ var t={all:[0,0,0,0,0,0,0,0,0,0],np:[0,0,0,0,0,0,0,0,0,0]}; ["Hartlepool","Middlesbrough","Redcar-and-Cleveland","Stockton-on-Tees","Darlington"].forEach(function(k){ for(var i=0;i<10;i++){ t.all[i]+=ONS_TB[k].all[i]; t.np[i]+=ONS_TB[k].np[i]; } }); return t; })();
  function gvaTile(S,A){
    var blk=S.AGG&&S.AGG.snapshots&&S.AGG.snapshots[S.AGG.latest], key=null;
    if(blk){ for(var k in blk){ if(blk[k]===A){ key=k; break; } } }
    var g=key&&GVA_M[key];
    if(!g) return [gbpFull(A.median_income),"Median income","of those reporting"];
    var pc=100*(A.sector_value||0)/(g*1e6);
    var gs=g>=1e4?"£"+(g/1e3).toFixed(1)+"bn":"£"+(g/1e3).toFixed(2)+"bn";
    return [pc.toFixed(1)+"%","Income vs GVA","of "+gs+" GVA ("+GVA_YEAR+")"];
  }
  /* Workforce — FIXED snapshot, 08/09/2026 (not yet in the weekly runner;
     backfill is an open action). Source: Data/Size of the Voluntary Sector
     (FTC snapshot 2026-09-08)/north-east/north-east-organisations-enriched-2026-09-08.csv,
     active based-in organisations, summing `employees` / `volunteers` where
     reported (charities only). n = organisations reporting the field. */
  var WF_DATE="08/09/2026", WF={
    "Darlington":{employees:1108,employees_n:16,volunteers:4028,volunteers_n:124},
    "Hartlepool":{employees:826,employees_n:15,volunteers:1312,volunteers_n:91},
    "Middlesbrough":{employees:1111,employees_n:22,volunteers:6662,volunteers_n:137},
    "Redcar-and-Cleveland":{employees:253,employees_n:10,volunteers:2306,volunteers_n:120},
    "Stockton-on-Tees":{employees:1836,employees_n:30,volunteers:11543,volunteers_n:200},
    "Tees Valley":{employees:5134,employees_n:93,volunteers:25851,volunteers_n:672}};
  function aggKey(S,A){ var blk=S.AGG&&S.AGG.snapshots&&S.AGG.snapshots[S.AGG.latest]; if(blk){ for(var k in blk){ if(blk[k]===A) return k; } } return null; }
  function wfTile(S,A,f,label){
    // live: A.workforce from the weekly runner (from 25/11/2026); fallback: the fixed September figures
    var L=A.workforce;
    if(L&&L[f+"_n"]) return [commas(L[f]),label,commas(L[f+"_n"])+" charities reporting"];
    var w=WF[aggKey(S,A)];
    if(!w) return ["–",label,"not available"];
    return [commas(w[f]),label,w[f+"_n"]+" reporting · Sep 2026"];
  }
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
      gvaTile(S,A),
      wfTile(S,A,"employees","Employees"),
      wfTile(S,A,"volunteers","Volunteers")
    ];
    box.innerHTML='<div class="kpiblock">'+allTiles.map(function(it){return tile(it,'g-all');}).join('')+charTiles.map(function(it){return tile(it,'g-char');}).join('')+'</div>'
      +'<div class="kheads"><div class="ghead ghead-all"><span class="sw sw-all"></span>All VCFSE · whole registered sector</div><div class="ghead ghead-char"><span class="sw sw-char"></span>Registered charities only</div></div>'
      +'<div class="kfoots"><p class="kfoot kfoot-all"><b>Whole sector count</b> includes unregistered organisations projected through the NAVCA model.</p><p class="kfoot kfoot-char"><b>Income and workforce figures cover registered charities only.</b> CICs, registered societies and CASCs don’t file income or staffing through their registers, so the sector’s true turnover and workforce are higher than shown. Employees and volunteers are summed from each charity’s latest annual return, where reported.</p></div>';
  }

  function renderDetail(S,A,sLabel){
    var col=S.col;
    // Count + share cell for bar rows: count and percentage in fixed columns so both align.
    function cp(n,d,pre){ return '<span class="cn">'+(pre||'')+commas(n)+'</span><em class="pc">'+pct(n,d)+'</em>'; }
    // by type
    S.q('.j-typesub').textContent="Active based-in organisations · "+sLabel+" · % of "+commas(A.active)+" active";
    var maxSeg=Math.max.apply(null,SEGMENTS.map(function(s){return A.by_segment[s]||0;}))||1;
    S.q('.j-type').innerHTML=SEGMENTS.map(function(s){ var n=A.by_segment[s]||0;
      return '<div class="bar-row"><div class="lab">'+segLabel(s)+'</div><div class="track"><div class="fill" style="width:'+(100*n/maxSeg)+'%;background:'+col.seg[s]+'"></div></div><div class="val">'+cp(n,A.active)+'</div></div>'; }).join("");
    // Structure panels (full width): an overall split, then two groups side by side, each
    // with its own bar and list. Sub-types take DESIGN.md shades of the group colour
    // (--sh-<group>-<n>, light/dark in CSS), assigned largest first. Rows show the count and
    // its share of the group; group headings show the share of the whole.
    function pct(n,d){ if(!d) return "–"; var v=100*n/d; return (n>0&&v<0.5)?"<1%":Math.round(v)+"%"; }
    function grpHTML(title,total,whole,swatchVar,shadeKey,items,note){
      items=items.filter(function(x){return x[1]>0;}).sort(function(a,b){return b[1]-a[1];});
      var bar=items.map(function(x,i){ return '<div style="flex:'+x[1]+';background:var(--sh-'+shadeKey+'-'+Math.min(i+1,shadeMax[shadeKey])+')" title="'+esc(x[0])+': '+commas(x[1])+'"></div>'; }).join('');
      var rows=items.map(function(x,i){ return '<div class="r se-sub"><span class="k"><span class="se-sw" style="background:var(--sh-'+shadeKey+'-'+Math.min(i+1,shadeMax[shadeKey])+')"></span>'+esc(x[0])+'</span><span>'+commas(x[1])+' <em class="pc">· '+pct(x[1],total)+'</em></span></div>'; }).join('');
      if(!items.length && note) rows='<div class="r se-sub se-note"><span class="k">'+esc(note)+'</span><span></span></div>';
      return '<div class="sgrp"><div class="r se-head"><span class="k"><span class="se-sw" style="background:'+swatchVar+'"></span>'+esc(title)+'</span><span>'+commas(total)+' <em class="pc">· '+pct(total,whole)+'</em></span></div>'
        +(items.length?'<div class="bar2">'+bar+'</div>':'')+'<div class="mini">'+rows+'</div></div>';
    }
    var shadeMax={cic:3,soc:5,chr:4,unc:2};
    (function(){
      var cic=A.by_segment.CICs||0, soc=A.by_segment.Societies||0, tot=cic+soc||1, SE=A.social_enterprise||{};
      S.q('.j-sesub').textContent=commas(cic+soc)+" active social enterprises (CASCs counted separately)";
      S.q('.j-sesplit').innerHTML='<div class="seg-cic" style="flex:'+cic+';background:'+col.seg.CICs+'" title="Community Interest Companies">'+(cic/tot>0.12?"Community Interest Companies "+commas(cic)+" · "+pct(cic,tot):"")+'</div>'
        +'<div style="flex:'+soc+';background:'+col.seg.Societies+'" title="Registered Societies">'+(soc/tot>0.12?"Registered Societies "+commas(soc)+" · "+pct(soc,tot):"")+'</div>';
      var CS=SE.cic_structure||{}, T=SE.society_types||{};
      S.q('.j-segrp').innerHTML=
        grpHTML("Community Interest Companies",cic,cic+soc,col.seg.CICs,'cic',[["Limited by Guarantee",CS.guarantee||0],["Limited by Shares",CS.shares||0],["Converted / Closed at Companies House",CS.converted||0],["Not Yet Checked",CS.unknown||0]],"Shares / Guarantee Split Not Yet Available")
       +grpHTML("Registered Societies",soc,cic+soc,col.seg.Societies,'soc',[["Community Benefit Societies",T.community_benefit||0],["Co-operative Societies",T.co_operative||0],["Credit Unions",T.credit_union||0],["Working Men\u2019s Clubs",T.working_mens_club||0],["Friendly Societies",T.friendly_society||0],["Other Registered Societies",T.other||0]],"Society Sub-types Appear from the Next Snapshot");
    })();
    // legal
    var L=A.legal; S.q('.j-legalsub').textContent=commas(L.total_charities)+" active registered charities";
    var inc=L.incorporated, uninc=L.unincorporated, tot=inc+uninc||1;
    S.q('.j-legalsplit').innerHTML='<div style="flex:'+inc+';background:'+col.seg.Charities+'" title="Incorporated">'+(inc/tot>0.12?"Incorporated "+commas(inc)+" · "+pct(inc,tot):"")+'</div>'
      +'<div style="flex:'+uninc+';background:'+col.accent+'" title="Unincorporated">'+(uninc/tot>0.12?"Unincorporated "+commas(uninc)+" · "+pct(uninc,tot):"")+'</div>';
    var incOther=Math.max(0,inc-L.cio_foundation-L.cio_association-L.charitable_company), uncOther=Math.max(0,uninc-L.trust);
    S.q('.j-legalgrp').innerHTML=
      grpHTML("Incorporated",inc,inc+uninc,col.seg.Charities,'chr',[["CIO \u2014 Foundation",L.cio_foundation],["CIO \u2014 Association",L.cio_association],["Charitable Company",L.charitable_company],["Other Incorporated",incOther]])
     +grpHTML("Unincorporated",uninc,inc+uninc,col.accent,'unc',[["Trust",L.trust],["Other Unincorporated (Mainly Associations)",uncOther]]);
    // decades — horizontal bars, stacked by segment type (handles legacy flat shape too)
    var DEC_ORDER=["Societies","Charities","CICs","CASCs"];
    function decSegs(d){ var v=A.decades[d]; if(v&&typeof v==='object'){ return DEC_ORDER.map(function(s){return [s,v[s]||0];}); } return [["",(+v||0)]]; }
    function decTot(d){ return decSegs(d).reduce(function(a,x){return a+x[1];},0); }
    var maxD=Math.max.apply(null,DECADES.map(decTot))||1, allD=DECADES.reduce(function(a,d){return a+decTot(d);},0);
    S.q('.j-decsub').textContent="Active organisations by decade of registration, coloured by type (oldest to most recent) · % of the "+commas(allD)+" with a registration date. CASCs carry no registration date, so are not shown.";
    S.q('.j-decades').innerHTML=DECADES.map(function(d){ var tot=decTot(d);
      var stack=decSegs(d).filter(function(x){return x[1]>0;}).map(function(x){ var c=x[0]?col.seg[x[0]]:col.accent; return '<span style="width:'+(100*x[1]/maxD)+'%;background:'+c+'" title="'+esc((x[0]?segLabel(x[0]):'All')+': '+commas(x[1]))+'"></span>'; }).join('');
      return '<div class="bar-row"><div class="lab">'+esc(d)+'</div><div class="track stack">'+stack+'</div><div class="val">'+cp(tot,allD)+'</div></div>'; }).join("");
    var present=DEC_ORDER.filter(function(s){ return DECADES.some(function(d){ var v=A.decades[d]; return v&&typeof v==='object'&&(v[s]||0)>0; }); });
    S.q('.j-decleg').innerHTML=present.map(function(s){ return '<span class="legitem"><span class="dot" style="background:'+col.seg[s]+'"></span>'+esc(segLabel(s))+'</span>'; }).join('');
    // income bands
    var repN=BANDS.reduce(function(a,b){return a+(A.income_bands[b]||0);},0);
    var chTot=(A.by_segment&&A.by_segment.Charities)||repN, noInc=Math.max(0,chTot-repN);
    S.q('.j-incsub').textContent="% of all "+commas(chTot)+" registered charities · "+commas(noInc)+" with no income recorded · avg "+gbpFull(A.avg_income)+" (of those reporting)";
    var maxB=Math.max(noInc,Math.max.apply(null,BANDS.map(function(b){return A.income_bands[b]||0;})))||1;
    S.q('.j-income').innerHTML=BANDS.map(function(b){ var n=A.income_bands[b]||0;
      return '<div class="bar-row"><div class="lab">'+b+'</div><div class="track"><div class="fill" style="width:'+(100*n/maxB)+'%"></div></div><div class="val">'+cp(n,chTot)+'</div></div>'; }).join("")
      +'<div class="bar-row bar-row--none"><div class="lab">No income recorded</div><div class="track"><div class="fill" style="width:'+(100*noInc/maxB)+'%"></div></div><div class="val">'+cp(noInc,chTot)+'</div></div>';
    // size
    var sz=A.size, sv=A.sector_value||1;
    S.q('.j-size').innerHTML=[["large","£100k and over"],["medium","£10k–£100k"],["small","under £10k"],["none","no income reported"]].map(function(k){ var b=sz[k[0]];
      return '<div class="size-row"><div class="sl">'+({large:"Large",medium:"Medium",small:"Small",none:"None"})[k[0]]+'<small>'+k[1]+'</small></div>'
        +'<div class="track"><div class="fill" style="width:'+(b.pct||(b.n?2:0))+'%;background:'+S.accFill+'"></div></div>'
        +'<div class="sv">'+commas(b.n)+'<small>'+gbp(b.val)+' · '+pct(b.val,sv)+'</small></div></div>'; }).join("");
    // concentration
    S.q('.j-concsub').textContent="Share of the sector's "+gbp(A.sector_value)+" held by the largest organisations";
    var t10=A.concentration.top10; S.q('.j-conctop').style.width=t10+"%"; S.q('.j-conctop').textContent=t10>=12?("Top 10 = "+t10+"%"):"";
    S.q('.j-concmini').innerHTML='<div class="r"><span class="k">Largest 10 organisations</span><span>'+t10+'% of the money</span></div><div class="r"><span class="k">Largest 25 organisations</span><span>'+A.concentration.top25+'% of the money</span></div>';
    // ONS business-base comparison — same ten turnover bands for all three series.
    (function(){
      var key=aggKey(S,A), O=ONS_TB[key], ch=A.income_bands_ons, host=S.q('.j-onscmp');
      if(!O||!ch){ S.q('.j-onssub').textContent="Not available for this selection"; host.innerHTML=""; return; }
      function sum(a){ return a.reduce(function(x,y){return x+y;},0); }
      var ser=[{k:"all",name:"All Businesses",d:O.all,c:"var(--ons-all)"},{k:"np",name:"Non-profit Bodies",d:O.np,c:"var(--ons-np)"},{k:"ch",name:"Registered Charities",d:ch,c:col.seg.Charities}];
      ser.forEach(function(s){ s.t=sum(s.d); });
      var mx=0; ser.forEach(function(s){ s.d.forEach(function(n){ mx=Math.max(mx,s.t?n/s.t:0); }); }); mx=mx||1;
      function share(s,from){ return sum(s.d.slice(from))/(s.t||1); }
      S.q('.j-onssub').textContent="Share of each group in the ONS turnover bands \u00b7 "+(key==="Tees Valley"?"Tees Valley":sLabel)+" \u00b7 businesses from ONS UK Business Counts ("+ONS_TB_DATE+"), charities from the latest snapshot";
      var head='<div class="ons-row ons-head"><div class="lab">Turnover</div><div></div>'+ser.map(function(s){ return '<div class="ons-v"><span class="se-sw" style="background:'+s.c+'"></span>'+s.name+'</div>'; }).join('')+'</div>';
      var rows=ONS_TB_LABELS.map(function(l,i){
        var bars=ser.map(function(s){ return '<span style="width:'+(100*(s.t?s.d[i]/s.t:0)/mx)+'%;background:'+(s.d[i]?s.c:'transparent')+'" title="'+esc(s.name+': '+commas(s.d[i]))+'"></span>'; }).join('');
        return '<div class="ons-row"><div class="lab">'+l+'</div><div class="ons-bars">'+bars+'</div>'+ser.map(function(s){ return '<div class="ons-v"><span class="cn">'+commas(s.d[i])+'</span><em class="pc">'+pct(s.d[i],s.t)+'</em></div>'; }).join('')+'</div>';
      }).join('');
      var tot='<div class="ons-row ons-tot"><div class="lab">Total</div><div></div>'+ser.map(function(s){ return '<div class="ons-v"><span class="cn">'+commas(s.t)+'</span><em class="pc">100%</em></div>'; }).join('')+'</div>';
      var hl='<div class="mini ons-mini">'+[["\u00a3100k and over",2],["\u00a3500k and over",4],["\u00a31m and over",5]].map(function(x){
        return '<div class="r"><span class="k">'+x[0]+'</span><span>'+ser.map(function(s){ return '<span class="ons-hl"><span class="se-sw" style="background:'+s.c+'"></span>'+Math.round(100*share(s,x[1]))+'%</span>'; }).join('')+'</span></div>'; }).join('')+'</div>';
      host.innerHTML='<div class="ons-tbl">'+head+rows+tot+'</div>'+hl
        +'<p class="ons-note"><b>Businesses</b> are VAT and/or PAYE registered enterprises on the ONS business register; sole traders registered for neither are not counted. ONS rounds each count to the nearest 5, so totals are the sum of the bands. Business turnover is mostly from VAT returns for an earlier year. <b>Non-profit bodies</b> are the register\u2019s \u201cNon-profit body or mutual association\u201d legal status. <b>Registered charities</b> are active based-in charities reporting income, by latest annual income ('+commas(((A.by_segment&&A.by_segment.Charities)||0)-((A.income_bands_ons||[]).reduce(function(a,b){return a+(b||0);},0)))+' charities report none and are not shown).</p>';
    })();
    // digital donut
    var wp=A.web_pct, r=52, c=2*Math.PI*r, on=c*wp/100;
    S.q('.j-donut').innerHTML='<circle cx="66" cy="66" r="52" fill="none" stroke="'+col.muted+'" stroke-opacity=".25" stroke-width="16"/>'
      +'<circle cx="66" cy="66" r="52" fill="none" stroke="'+S.accFill+'" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+on+' '+c+'" transform="rotate(-90 66 66)"/>'
      +'<text x="66" y="62" text-anchor="middle" font-size="24" font-weight="800" fill="'+S.accInk+'">'+Math.round(wp)+'%</text>'
      +'<text x="66" y="82" text-anchor="middle" font-size="11" fill="'+col.muted+'">have a site</text>';
    S.q('.j-digmini').innerHTML='<div class="r"><span class="k">With a website</span><span>'+commas(A.has_web)+' <em class="pc">· '+pct(A.has_web,A.active)+'</em></span></div><div class="r"><span class="k">No website found</span><span>'+commas(A.active-A.has_web)+' <em class="pc">· '+pct(A.active-A.has_web,A.active)+'</em></span></div>';
    // projection
    var nv=A.navca;
    S.q('.j-proj').innerHTML='<div class="mini" style="margin-top:2px">'
      +'<div class="r"><span class="k">Registered charities (on the register)</span><span>'+commas(nv.registered)+' <em class="pc">· '+pct(nv.registered,nv.total)+'</em></span></div>'
      +'<div class="r"><span class="k">Unregistered community groups (est.)</span><span>~'+commas(nv.community)+' <em class="pc">· '+pct(nv.community,nv.total)+'</em></span></div>'
      +'<div class="r"><span class="k">Social enterprises (est.)</span><span>~'+commas(nv.social)+' <em class="pc">· '+pct(nv.social,nv.total)+'</em></span></div>'
      +'<div class="r" style="border-bottom:none"><span class="k"><b>Estimated whole sector</b></span><span><b>~'+commas(nv.total)+'</b> <em class="pc">· 100%</em></span></div></div>';
    // top10
    S.q('.j-topsub').textContent="By latest-year income · "+sLabel;
    var maxI=(A.top10[0]&&A.top10[0].income)||1;
    S.q('.j-top').innerHTML='<thead><tr><th>#</th><th>Organisation</th><th>Authority</th><th></th><th class="n">Income</th></tr></thead><tbody>'
      +A.top10.map(function(o,i){ return '<tr><td>'+(i+1)+'</td><td>'+esc(o.name)+'</td><td>'+esc(o.la.replace("Redcar-and-Cleveland","Redcar & Cleveland"))+'</td>'
        +'<td style="width:110px"><div class="tbar" style="width:'+Math.max(4,100*o.income/maxI)+'%"></div></td><td class="n">'+gbp(o.income)+'</td></tr>'; }).join("")+'</tbody>';
  }

  var TRI_UP='<svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true"><path d="M5 1.5L9 8.5H1Z"/></svg>';
  var TRI_DN='<svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true"><path d="M5 8.5L9 1.5H1Z"/></svg>';
  function renderMatrix(S){
    var L=latestDate(S), t=S.q('.j-matrix');
    S.q('.j-mxsub').textContent="Active based-in organisations · "+fmtDate(L);
    var ds=spineDates(S), prev=(ds.length>=2)?ds[ds.length-2].date:null;
    function at(bor,seg,date){ if(date==null) return null; for(var i=0;i<S.DATA.length;i++){ var r=S.DATA[i]; if(r.bor===bor&&r.seg===seg&&r.date===date) return r.active; } return null; }
    function delta(now,was){ if(now==null||was==null) return '<span class="dlt"></span>'; var d=now-was, tt=' title="'+(d>0?'+'+d:d)+' since '+esc(fmtShort(prev))+'"'; if(d>0) return '<span class="dlt up"'+tt+'>'+TRI_UP+'</span>'; if(d<0) return '<span class="dlt dn"'+tt+'>'+TRI_DN+'</span>'; return '<span class="dlt st" title="no change">–</span>'; }
    var head="<thead><tr><th>Authority</th>"+SEGMENTS.map(function(s){return "<th>"+(s==="Charities"?"Char.":s)+"</th>";}).join("")+"<th>Total</th></tr></thead>";
    var body="<tbody>", colTot={}, colTotP={}, colHasP={}, grand=0, grandP=0, grandHasP=false; SEGMENTS.forEach(function(s){colTot[s]=0;colTotP[s]=0;colHasP[s]=false;});
    BORO.forEach(function(b){ body+="<tr><td><span class='chip' style='background:"+S.col.bor[b[0]]+"'></span>"+esc(b[1])+"</td>"; var rt=0, rtp=0, rtHasP=false;
      SEGMENTS.forEach(function(s){ var v=at(b[0],s,L), vp=at(b[0],s,prev); if(v!=null){rt+=v;colTot[s]+=v;} if(vp!=null){rtp+=vp;colTotP[s]+=vp;rtHasP=true;colHasP[s]=true;} body+="<td>"+(v==null?"–":v)+delta(v,vp)+"</td>"; });
      grand+=rt; if(rtHasP){grandP+=rtp;grandHasP=true;} body+="<td><b>"+rt+"</b>"+delta(rt, rtHasP?rtp:null)+"</td></tr>"; });
    body+="</tbody>";
    var foot="<tfoot><tr><td>Tees Valley</td>"+SEGMENTS.map(function(s){return "<td>"+colTot[s]+delta(colTot[s], colHasP[s]?colTotP[s]:null)+"</td>";}).join("")+"<td>"+grand+delta(grand, grandHasP?grandP:null)+"</td></tr></tfoot>";
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
      host.addEventListener('mousemove',function(e){ if(dragging) return; var r=host.getBoundingClientRect(); var px=(e.clientX-r.left)/r.width*S._rl.W; var best=S._rl.ds[0],bd=1e18; S._rl.ds.forEach(function(d){ var dx=Math.abs(S._rl.X(d.t)-px); if(dx<bd){bd=dx;best=d;} }); if(bd<16){ S.tip.textContent=fmtDate(best.date); S.tip.style.opacity=1; S.tip.style.left=(e.clientX+12)+'px'; S.tip.style.top=(e.clientY-10)+'px'; } else { S.tip.style.opacity=0; } });
      host.addEventListener('mouseleave',function(){ S.tip.style.opacity=0; });
    }
  }
  function bootAll(){ var tip=ensureTip(); var list=document.querySelectorAll('.rcvda-vcse-sector'); for(var i=0;i<list.length;i++){ if(!list[i].__sots){ list[i].__sots=1; initOne(list[i],tip); } } }
  if(document.readyState!=="loading") bootAll(); else document.addEventListener('DOMContentLoaded',bootAll);
})();
