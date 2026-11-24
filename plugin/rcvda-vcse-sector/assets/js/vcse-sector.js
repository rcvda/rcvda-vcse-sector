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
  var BORO=[["Darlington","Darlington"],["Hartlepool","Hartlepool"],["Middlesbrough","Middlesbrough"],["Redcar-and-Cleveland","Redcar & Cleveland"],["Stockton-on-Tees","Stockton-on-Tees"]];
  var LA_TOKEN={"Darlington":["--la-darlington","#900030"],"Hartlepool":["--la-hartlepool","#248000"],"Middlesbrough":["--la-middlesbrough","#EF8A00"],"Redcar-and-Cleveland":["--la-redcar-cleveland","#217887"],"Stockton-on-Tees":["--la-stockton","#1D8AD7"]};
  var SEG_TOKEN={Charities:["--c-charity","#033E8C"],CICs:["--c-cic","#F29F05"],Societies:["--c-society","#6E9FC9"],CASCs:["--c-casc","#D91E0D"]};
  var DECADES=["Pre-1960","1960s","1970s","1980s","1990s","2000s","2010s","2020s"];
  var BANDS=["£1m +","£500k - £1m","£250k - £500k","£100k - £250k","£75k - £100k","£50k - £75k","Over 25k","Over 10k","Under 10k"];
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
    +'<dt>NAVCA model</dt><dd>A national estimate that registered charities are about 26% of the whole VCSE sector, used to project the unregistered community groups no register captures.</dd></dl></div>';

  function markup(title,area){
    return '<div class="wrap">'
      +'<header class="masthead"><div><div class="eyebrow">'+esc(area)+' · Registered VCSE Sector · Living time series</div><h1>'+esc(title)+'</h1></div>'
      +'<div class="meta">Latest snapshot <b class="j-snap">—</b><br>Updated weekly · Source: Find That Charity</div>'
      +'<p class="lede">The registered voluntary, community and social-enterprise sector <b>based in</b> the five '+esc(area)+' authorities — registered charities (including CIOs), Community Interest Companies (CICs), registered societies / mutuals and Community Amateur Sports Clubs (CASCs). “Based in” means the registered office is in the borough. Figures describe the <b>active</b> sector and update automatically each week. Use the filters to focus on an authority.</p></header>'
      +'<div class="note"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      +'<div><b>A living measure.</b> This dashboard reads the open dataset that RCVDA rebuilds every Monday from Find That Charity, so each weekly point appears automatically. The over-time charts are seeded from earlier snapshots; the detailed analytics describe the latest snapshot and build up week by week. Data: <a href="https://github.com/rcvda/tees-valley-vcse-sector" target="_blank" rel="noopener">rcvda/tees-valley-vcse-sector</a> (CC&nbsp;BY-NC-SA&nbsp;4.0).</div></div>'
      +'<div class="filterbar">'
      +'<label>Measure</label><select class="j-seg"><option value="ALL">All VCSE (total)</option><option value="Charities">Charities</option><option value="CICs">CICs</option><option value="Societies">Societies</option><option value="CASCs">CASCs</option></select>'
      +'<label style="margin-left:6px">Authority</label><select class="j-bor"><option value="TV">'+esc(area)+' (all five)</option><option value="Darlington">Darlington</option><option value="Hartlepool">Hartlepool</option><option value="Middlesbrough">Middlesbrough</option><option value="Redcar-and-Cleveland">Redcar &amp; Cleveland</option><option value="Stockton-on-Tees">Stockton-on-Tees</option></select>'
      +'<span class="tag j-scope"></span></div>'
      +'<section class="kpis j-kpis"><div class="loading">Loading the latest snapshot…</div></section>'

      +'<div class="band"><h3>Sector size over time</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2 class="j-c1t">Active VCSE organisations by authority</h2><div class="sub">Based-in, active · one line per authority</div></div><div class="j-chart1"><div class="loading">Loading…</div></div><div class="legend j-leg1"></div></div></section>'
      +'<section class="grid"><div class="panel col-7"><div class="panel-head"><h2 class="j-c2t">The four segments over time</h2><div class="sub">Based-in, active · one line per segment</div></div><div class="j-chart2"></div><div class="legend j-leg2"></div></div>'
      +'<div class="panel col-5"><div class="panel-head"><h2>Latest snapshot</h2><div class="sub j-mxsub">Active based-in organisations</div></div><table class="matrix j-matrix"></table></div></section>'

      +'<div class="band"><h3>The sector by type</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>Active sector by type</h2><div class="sub j-typesub"></div></div><div class="bars j-type"></div></div>'
      +'<div class="panel col-6"><div class="panel-head"><h2>Charity legal structure</h2><div class="sub j-legalsub"></div></div><div class="split j-legalsplit"></div><div class="mini j-legalmini"></div></div></section>'

      +'<div class="band"><h3>Structure &amp; age</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2>When the sector was founded</h2><div class="sub">Active organisations by decade of registration (oldest to most recent)</div></div><div class="cols j-decades"></div></div></section>'

      +'<div class="band"><h3>Money</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>Turnover of the active sector</h2><div class="sub j-incsub"></div></div><div class="bars j-income"></div></div>'
      +'<div class="panel col-6"><div class="panel-head"><h2>Large vs small</h2><div class="sub">How the money concentrates by organisation size</div></div><div class="j-size"></div></div>'
      +'<div class="panel col-12"><div class="panel-head"><h2>Income concentration</h2><div class="sub j-concsub"></div></div><div class="conc-bar"><div class="top j-conctop"></div></div><div class="mini j-concmini"></div></div></section>'

      +'<div class="band"><h3>Digital &amp; projection</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-6"><div class="panel-head"><h2>Digital presence</h2><div class="sub">Active organisations with a website</div></div><div class="donut-wrap"><svg class="j-donut" width="122" height="122" viewBox="0 0 132 132" role="img"></svg><div class="mini j-digmini" style="flex:1"></div></div></div>'
      +'<div class="panel col-6"><div class="panel-head"><h2>Projected whole sector</h2><div class="sub">What NAVCA predicts vs what’s on the register</div></div><div class="j-proj"></div></div></section>'

      +'<div class="band"><h3>The largest organisations</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2>Ten largest active organisations by income</h2><div class="sub j-topsub"></div></div><table class="toptable j-top"></table></div></section>'

      +'<div class="band"><h3>Glossary</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12">'+GLOSS+'</div></section>'

      +'<footer><b>Method.</b> Candidates are drawn from Find That Charity for the five '+esc(area)+' local-authority areas, classified by registered organisation type and filtered to those whose <b>registered office (HQ)</b> is in the borough. Scope: registered charities (including CIOs), CICs, registered societies / mutuals and CASCs; statutory bodies (schools, NHS, councils) excluded. Each weekly run recomputes the counts and the analytics; figures describe the active sector. The over-time series is seeded from earlier dated snapshots. <span class="j-built"></span>'
      +'<br><b>Sources.</b> Organisation records aggregated by <b>Find That Charity</b> (findthatcharity.uk, David Kane) from the primary UK registers — the <b>Charity Commission for England &amp; Wales</b>, <b>Companies House</b> (CICs), the <b>FCA Mutuals Public Register</b> (registered societies) and <b>HMRC</b> (CASCs). Register data © the respective bodies under the Open Government Licence v3.0; Find That Charity is published under CC-BY 4.0.'
      +'<br><b>© RCVDA</b> · Peter Neal · Data CC BY-NC-SA 4.0 · Code MIT.</footer></div>';
  }

  function initOne(root,tip){
    var SRC=root.getAttribute('data-src')||'', FB=root.getAttribute('data-fallback')||'';
    var ASRC=root.getAttribute('data-agg-src')||'', AFB=root.getAttribute('data-agg-fallback')||'';
    var TITLE=root.getAttribute('data-title')||'State of the Sector', AREA=root.getAttribute('data-area')||'Tees Valley';
    root.innerHTML=markup(TITLE,AREA);
    var S={ root:root, tip:tip, DATA:[], AGG:null, hidden1:{TV:true}, hidden2:{} };
    S.q=function(c){ return root.querySelector(c); };
    var spineChain=[]; if(SRC)spineChain.push(SRC); if(FB&&FB!==SRC)spineChain.push(FB);
    var aggChain=[]; if(ASRC)aggChain.push(ASRC); if(AFB&&AFB!==ASRC)aggChain.push(AFB);
    var pending=2, live=false;
    function done(){ if(--pending>0) return; boot(S,live); }
    fetchChain(spineChain.slice(),function(t,l){ if(t){ S.DATA=parseSpine(t); if(l)live=true; } done(); });
    fetchChain(aggChain.slice(),function(t,l){ if(t){ try{ S.AGG=JSON.parse(t); }catch(e){} } done(); });
    var reRender=function(){ if(S.DATA.length||S.AGG) render(S); };
    if('MutationObserver' in window){ new MutationObserver(reRender).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']}); }
    if(window.matchMedia){ try{ window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',reRender); }catch(e){} }
    if('ResizeObserver' in window){ new ResizeObserver(reRender).observe(S.q('.j-chart1')); }
    S.q('.j-seg').addEventListener('change',function(){ render(S); });
    S.q('.j-bor').addEventListener('change',function(){ render(S); });
  }
  function parseSpine(t){
    return parseCSV(t).filter(function(r){ return r.definition==="based-in" && SEGMENTS.indexOf(r.segment)>=0 && LA_TOKEN[r.borough]; })
      .map(function(r){ return {seg:r.segment,bor:r.borough,date:r.snapshot_date,t:Date.parse(r.snapshot_date),active:+r.active||0}; })
      .filter(function(r){ return !isNaN(r.t); });
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
    Object.keys(byDate).forEach(function(d){ var row=byDate[d],v=null;
      if(measure==="ALL"){ if(SEGMENTS.every(function(s){return s in row;})) v=SEGMENTS.reduce(function(a,s){return a+row[s];},0); }
      else if(measure in row){ v=row[measure]; }
      if(v!==null) out.push({t:Date.parse(d),date:d,v:v}); });
    return out.sort(function(a,b){return a.t-b.t;});
  }
  function tvSeries(S,measure){
    var perDate={};
    BORO.forEach(function(b){ boroughSeries(S,b[0],measure).forEach(function(p){ (perDate[p.date]=perDate[p.date]||{})[b[0]]=p.v; }); });
    var out=[]; Object.keys(perDate).forEach(function(d){ var row=perDate[d]; if(BORO.every(function(b){return b[0] in row;})) out.push({t:Date.parse(d),date:d,v:BORO.reduce(function(a,b){return a+row[b[0]];},0)}); });
    return out.sort(function(a,b){return a.t-b.t;});
  }
  function segmentSeries(S,scope,seg){
    if(scope==="TV"){ var perDate={};
      BORO.forEach(function(b){ S.DATA.forEach(function(r){ if(r.bor===b[0]&&r.seg===seg) (perDate[r.date]=perDate[r.date]||{})[b[0]]=r.active; }); });
      var out=[]; Object.keys(perDate).forEach(function(d){ var row=perDate[d]; if(BORO.every(function(b){return b[0] in row;})) out.push({t:Date.parse(d),date:d,v:BORO.reduce(function(a,b){return a+row[b[0]];},0)}); });
      return out.sort(function(a,b){return a.t-b.t;}); }
    return S.DATA.filter(function(r){return r.bor===scope&&r.seg===seg;}).map(function(r){return {t:r.t,date:r.date,v:r.active};}).sort(function(a,b){return a.t-b.t;});
  }

  function render(S){
    var col=colours(S.root); S.col=col;
    var measure=S.q('.j-seg').value, scope=S.q('.j-bor').value;
    var sLabel=scope==="TV"?"Tees Valley":(BORO.filter(function(b){return b[0]===scope;})[0]||["",scope])[1];
    S.q('.j-scope').innerHTML="Showing <b>"+esc(measure==="ALL"?"All VCSE":measure)+"</b> · "+esc(sLabel);
    var A=scopeAgg(S,scope);
    renderKPIs(S,A,sLabel);
    // trends
    if(S.DATA.length){
      var series1=BORO.map(function(b){ return {key:b[0],name:b[1],color:col.bor[b[0]],pts:boroughSeries(S,b[0],measure)}; });
      series1.push({key:"TV",name:"Tees Valley total",color:col.tv,pts:tvSeries(S,measure),dashed:true});
      S.q('.j-c1t').textContent=(measure==="ALL"?"Active VCSE organisations":("Active "+measure))+" by authority";
      drawChart(S,'.j-chart1',series1.filter(function(s){return !S.hidden1[s.key]&&s.pts.length;}),'.j-leg1',series1,S.hidden1);
      var series2=SEGMENTS.map(function(s){ return {key:s,name:s,color:col.seg[s],pts:segmentSeries(S,scope,s)}; });
      S.q('.j-c2t').textContent="The four segments over time — "+sLabel;
      drawChart(S,'.j-chart2',series2.filter(function(s){return !S.hidden2[s.key]&&s.pts.length;}),'.j-leg2',series2,S.hidden2);
      renderMatrix(S);
    }
    if(A) renderDetail(S,A,sLabel);
  }

  function renderKPIs(S,A,sLabel){
    var box=S.q('.j-kpis'); box.innerHTML="";
    function tile(v,l,s,bar){ var d=document.createElement('div'); d.className="kpi"; if(bar)d.style.setProperty('--bar',bar);
      d.innerHTML='<div class="v tnum">'+esc(v)+'</div><div class="l">'+esc(l)+'</div><div class="s">'+esc(s)+'</div>'; box.appendChild(d); }
    if(!A){ tile("—","Loading…","",S.col.tv); return; }
    tile(commas(A.active), sLabel+" · active VCSE", "based-in · "+fmtDate(latestDate(S)), S.col.tv);
    tile("~"+commas(A.navca.total), "Estimated whole sector", "incl. unregistered (NAVCA)", S.col.accent);
    tile(gbp(A.sector_value), "Sector turnover", "latest-year income reported", S.col.seg.Charities);
    tile(gbpFull(A.median_income), "Median income", "of those reporting", S.col.seg.CICs);
    tile(A.concentration.top10+"%", "Top-10 share", "of the sector's income", S.col.seg.CASCs);
    tile(A.web_pct+"%", "With a website", commas(A.has_web)+" active organisations", S.col.seg.Societies);
  }

  function renderDetail(S,A,sLabel){
    var col=S.col;
    // by type
    S.q('.j-typesub').textContent="Active based-in organisations · "+sLabel;
    var maxSeg=Math.max.apply(null,SEGMENTS.map(function(s){return A.by_segment[s]||0;}))||1;
    S.q('.j-type').innerHTML=SEGMENTS.map(function(s){ var n=A.by_segment[s]||0;
      return '<div class="bar-row"><div class="lab">'+s+'</div><div class="track"><div class="fill" style="width:'+(100*n/maxSeg)+'%;background:'+col.seg[s]+'"></div></div><div class="val">'+commas(n)+'</div></div>'; }).join("");
    // legal
    var L=A.legal; S.q('.j-legalsub').textContent=commas(L.total_charities)+" active registered charities";
    var inc=L.incorporated, uninc=L.unincorporated, tot=inc+uninc||1;
    S.q('.j-legalsplit').innerHTML='<div style="flex:'+inc+';background:'+col.seg.Charities+'" title="Incorporated">'+(inc/tot>0.12?"Incorporated "+commas(inc):"")+'</div>'
      +'<div style="flex:'+uninc+';background:'+col.accent+'" title="Unincorporated">'+(uninc/tot>0.12?"Unincorporated "+commas(uninc):"")+'</div>';
    S.q('.j-legalmini').innerHTML=[["CIO — foundation",L.cio_foundation],["CIO — association",L.cio_association],["Charitable company",L.charitable_company],["Trust",L.trust]]
      .map(function(r){return '<div class="r"><span class="k">'+r[0]+'</span><span>'+commas(r[1])+'</span></div>';}).join("");
    // decades
    var maxD=Math.max.apply(null,DECADES.map(function(d){return A.decades[d]||0;}))||1;
    S.q('.j-decades').innerHTML=DECADES.map(function(d){ var n=A.decades[d]||0;
      return '<div class="colbar"><div class="cn">'+commas(n)+'</div><div class="cfill" style="height:'+(100*n/maxD)+'%;background:'+col.accent+'"></div><div class="cx">'+d.replace("Pre-1960","pre-60")+'</div></div>'; }).join("");
    // income bands
    S.q('.j-incsub').textContent=commas(A.no_income)+" report no income · avg "+gbpFull(A.avg_income);
    var maxB=Math.max.apply(null,BANDS.map(function(b){return A.income_bands[b]||0;}))||1;
    S.q('.j-income').innerHTML=BANDS.map(function(b){ var n=A.income_bands[b]||0;
      return '<div class="bar-row"><div class="lab">'+b+'</div><div class="track"><div class="fill" style="width:'+(100*n/maxB)+'%"></div></div><div class="val">'+commas(n)+'</div></div>'; }).join("");
    // size
    var sz=A.size, sv=A.sector_value||1;
    S.q('.j-size').innerHTML=[["large","£100k and over"],["medium","£10k–£100k"],["small","under £10k"],["none","no income reported"]].map(function(k){ var b=sz[k[0]];
      return '<div class="size-row"><div class="sl">'+({large:"Large",medium:"Medium",small:"Small",none:"None"})[k[0]]+'<small>'+k[1]+'</small></div>'
        +'<div class="track"><div class="fill" style="width:'+(b.pct||(b.n?2:0))+'%;background:'+col.accent+'"></div></div>'
        +'<div class="sv">'+commas(b.n)+'<small>'+gbp(b.val)+' · '+b.pct+'%</small></div></div>'; }).join("");
    // concentration
    S.q('.j-concsub').textContent="Share of the sector's "+gbp(A.sector_value)+" held by the largest organisations";
    var t10=A.concentration.top10; S.q('.j-conctop').style.width=t10+"%"; S.q('.j-conctop').textContent=t10>=12?("Top 10 = "+t10+"%"):"";
    S.q('.j-concmini').innerHTML='<div class="r"><span class="k">Largest 10 organisations</span><span>'+t10+'% of the money</span></div><div class="r"><span class="k">Largest 25 organisations</span><span>'+A.concentration.top25+'% of the money</span></div>';
    // digital donut
    var pct=A.web_pct, r=52, c=2*Math.PI*r, on=c*pct/100;
    S.q('.j-donut').innerHTML='<circle cx="66" cy="66" r="52" fill="none" stroke="'+col.muted+'" stroke-opacity=".25" stroke-width="16"/>'
      +'<circle cx="66" cy="66" r="52" fill="none" stroke="'+col.accent+'" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+on+' '+c+'" transform="rotate(-90 66 66)"/>'
      +'<text x="66" y="62" text-anchor="middle" font-size="24" font-weight="800" fill="'+col.accent+'">'+pct+'%</text>'
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

  function drawChart(S,hostSel,series,legSel,allSeries,hiddenMap){
    var host=S.q(hostSel), tip=S.tip;
    var W=host.clientWidth||680, H=300, P={t:14,r:16,b:30,l:38};
    var ts=[],vs=[]; series.forEach(function(s){s.pts.forEach(function(p){ts.push(p.t);vs.push(p.v);});});
    var leg=S.q(legSel); leg.innerHTML="";
    allSeries.forEach(function(s){ if(!s.pts.length) return;
      var b=document.createElement('button'); b.setAttribute('aria-pressed',hiddenMap[s.key]?"false":"true");
      b.innerHTML='<span class="dot" style="background:'+s.color+'"></span>'+esc(s.name);
      b.addEventListener('click',function(){ hiddenMap[s.key]=!hiddenMap[s.key]; render(S); }); leg.appendChild(b); });
    if(!ts.length){ host.innerHTML='<div class="loading">No data for this selection yet.</div>'; return; }
    var t0=Math.min.apply(null,ts), t1=Math.max.apply(null,ts); if(t0===t1){t0-=6e8;t1+=6e8;}
    var v1=Math.max.apply(null,vs), v0=Math.min(0,Math.min.apply(null,vs)); if(v1===v0)v1=v0+1;
    var step=(v1>400?100:(v1>100?50:20)); v1=Math.ceil(v1/step)*step;
    function X(t){return P.l+(t-t0)/(t1-t0)*(W-P.l-P.r);}
    function Y(v){return H-P.b-(v-v0)/(v1-v0)*(H-P.t-P.b);}
    var svg='<svg class="chart" viewBox="0 0 '+W+' '+H+'" width="100%" preserveAspectRatio="xMidYMid meet" role="img">';
    for(var i=0;i<=4;i++){ var vv=v0+(v1-v0)*i/4, y=Y(vv); svg+='<line class="grid-l" x1="'+P.l+'" y1="'+y+'" x2="'+(W-P.r)+'" y2="'+y+'"/><text class="axlab" x="'+(P.l-7)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(vv)+'</text>'; }
    svg+='<line class="axis" x1="'+P.l+'" y1="'+(H-P.b)+'" x2="'+(W-P.r)+'" y2="'+(H-P.b)+'"/>';
    var allDates={}; series.forEach(function(s){s.pts.forEach(function(p){allDates[p.date]=p.t;});});
    var dk=Object.keys(allDates).sort(function(a,b){return allDates[a]-allDates[b];}); var every=Math.ceil(dk.length/6);
    dk.forEach(function(d,idx){ if(idx%every!==0 && idx!==dk.length-1) return; svg+='<text class="axlab" x="'+X(allDates[d])+'" y="'+(H-P.b+16)+'" text-anchor="middle">'+fmtShort(d)+'</text>'; });
    var topKey=null,topV=-1; series.forEach(function(s){var lv=s.pts[s.pts.length-1].v; if(lv>topV){topV=lv;topKey=s.key;}});
    var marks='';
    series.forEach(function(s){ var d=''; s.pts.forEach(function(p,i){ d+=(i?'L':'M')+X(p.t).toFixed(1)+' '+Y(p.v).toFixed(1)+' '; });
      svg+='<path class="series" d="'+d+'" stroke="'+s.color+'"'+(s.dashed?' stroke-dasharray="5 4" stroke-width="1.8"':'')+'/>';
      s.pts.forEach(function(p){ marks+='<circle class="mk" cx="'+X(p.t)+'" cy="'+Y(p.v)+'" r="3.4" fill="'+s.color+'"/>';
        marks+='<circle class="mk-hit" cx="'+X(p.t)+'" cy="'+Y(p.v)+'" r="11" data-l="'+esc(s.name+' · '+fmtDate(p.date)+': '+p.v)+'"/>'; });
      if(s.key===topKey){ var last=s.pts[s.pts.length-1]; svg+='<text class="dlab" x="'+(X(last.t)+6)+'" y="'+(Y(last.v)+3)+'" fill="'+s.color+'">'+last.v+'</text>'; } });
    svg+=marks+'</svg>'; host.innerHTML=svg;
    host.querySelectorAll('.mk-hit').forEach(function(c){
      c.addEventListener('mousemove',function(e){ tip.textContent=c.getAttribute('data-l'); tip.style.opacity=1; tip.style.left=(e.clientX+12)+'px'; tip.style.top=(e.clientY-10)+'px'; });
      c.addEventListener('mouseleave',function(){ tip.style.opacity=0; }); });
  }

  function bootAll(){ var tip=ensureTip(); var list=document.querySelectorAll('.rcvda-vcse-sector'); for(var i=0;i<list.length;i++){ if(!list[i].__sots){ list[i].__sots=1; initOne(list[i],tip); } } }
  if(document.readyState!=="loading") bootAll(); else document.addEventListener('DOMContentLoaded',bootAll);
})();
