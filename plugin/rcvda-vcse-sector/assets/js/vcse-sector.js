/* RCVDA VCSE Sector — "State of the Sector" living dashboard front end.
 * Renders every .rcvda-vcse-sector container: reads its data-src (jsDelivr CDN),
 * falls back to data-fallback (bundled CSV), parses the time-series spine and
 * draws the KPI tiles, the two over-time line charts and the latest-snapshot
 * matrix. Borough colours are resolved live from rcvda-core's shared borough
 * tokens (DESIGN.md hex as fallback) so SVG works cross-browser and tracks the
 * estate's dark mode. No external libraries. */
(function(){
  "use strict";
  var SEGMENTS=["Charities","CICs","Societies","CASCs"];
  var BORO=[["Darlington","Darlington"],["Hartlepool","Hartlepool"],["Middlesbrough","Middlesbrough"],["Redcar-and-Cleveland","Redcar & Cleveland"],["Stockton-on-Tees","Stockton-on-Tees"]];
  var LA_TOKEN={"Darlington":["--la-darlington","#900030"],"Hartlepool":["--la-hartlepool","#248000"],"Middlesbrough":["--la-middlesbrough","#EF8A00"],"Redcar-and-Cleveland":["--la-redcar-cleveland","#217887"],"Stockton-on-Tees":["--la-stockton","#1D8AD7"]};
  var SEG_TOKEN={Charities:["--c-charity","#033E8C"],CICs:["--c-cic","#F29F05"],Societies:["--c-society","#6E9FC9"],CASCs:["--c-casc","#D91E0D"]};
  var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function fmtDate(s){ if(!s) return "—"; var p=s.split('-'); return (+p[2])+" "+MONTHS[+p[1]-1]+" "+p[0]; }
  function fmtShort(s){ var p=s.split('-'); return MONTHS[+p[1]-1]+" "+p[0].slice(2); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

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
    return { bor:bor, tv:v('--tv-navy','#2A3B72'), seg:seg };
  }

  function markup(title,area){
    return '<div class="wrap">'
      +'<header class="masthead"><div><div class="eyebrow">'+esc(area)+' · Registered VCSE Sector · Living time series</div>'
      +'<h1>'+esc(title)+'</h1></div>'
      +'<div class="meta">Latest snapshot <b class="j-snap">—</b><br>Updated weekly · Source: Find That Charity</div>'
      +'<p class="lede">The size of the registered voluntary, community and social-enterprise sector <b>based in</b> each of the five '+esc(area)+' authorities — registered charities (including CIOs), Community Interest Companies (CICs), registered societies / mutuals and Community Amateur Sports Clubs (CASCs). &ldquo;Based in&rdquo; means the organisation&rsquo;s registered office is in the borough. Figures describe the <b>active</b> sector and update automatically each week.</p></header>'
      +'<div class="note"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      +'<div><b>A living measure.</b> This dashboard reads the open time-series dataset that RCVDA rebuilds every Monday from Find That Charity, so each new weekly point appears here automatically. The series is seeded from earlier dated snapshots and grows from late&nbsp;2026 onward. The headline is the <b>based-in</b> (registered-office) count; the wider &ldquo;operating-from&rdquo; reach measure is tracked separately. Data: <a href="https://github.com/rcvda/tees-valley-vcse-sector" target="_blank" rel="noopener">rcvda/tees-valley-vcse-sector</a> (CC&nbsp;BY-NC-SA&nbsp;4.0).</div></div>'
      +'<div class="filterbar">'
      +'<label><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> Measure</label>'
      +'<select class="j-seg"><option value="ALL">All VCSE (total)</option><option value="Charities">Charities</option><option value="CICs">CICs</option><option value="Societies">Societies</option><option value="CASCs">CASCs</option></select>'
      +'<label style="margin-left:6px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> Authority</label>'
      +'<select class="j-bor"><option value="TV">'+esc(area)+' (all five)</option><option value="Darlington">Darlington</option><option value="Hartlepool">Hartlepool</option><option value="Middlesbrough">Middlesbrough</option><option value="Redcar-and-Cleveland">Redcar &amp; Cleveland</option><option value="Stockton-on-Tees">Stockton-on-Tees</option></select>'
      +'<span class="tag j-scope"></span></div>'
      +'<section class="kpis j-kpis"><div class="loading">Loading the latest snapshot…</div></section>'
      +'<div class="band"><h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> Sector size over time</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-12"><div class="panel-head"><h2 class="j-c1t">Active VCSE organisations by authority</h2><div class="sub">Based-in, active · one line per authority</div></div><div class="j-chart1"><div class="loading">Loading time series…</div></div><div class="legend j-leg1"></div></div></section>'
      +'<div class="band"><h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> By organisation type</h3><div class="rule"></div></div>'
      +'<section class="grid"><div class="panel col-7"><div class="panel-head"><h2 class="j-c2t">The four segments over time</h2><div class="sub">Based-in, active · one line per segment</div></div><div class="j-chart2"><div class="loading">Loading…</div></div><div class="legend j-leg2"></div></div>'
      +'<div class="panel col-5"><div class="panel-head"><h2>Latest snapshot</h2><div class="sub j-mxsub">Active based-in organisations</div></div><table class="matrix j-matrix"></table></div></section>'
      +'<footer><b>Method.</b> Candidates are drawn from Find That Charity for the five '+esc(area)+' local-authority areas, classified by registered organisation type and filtered to those whose <b>registered office (HQ)</b> is in the borough — the canonical &ldquo;based-in&rdquo; measure. Scope: registered charities (including CIOs), CICs, registered societies / mutuals and CASCs; statutory bodies (schools, NHS, councils) excluded. Each weekly run recomputes the counts and appends one point per authority and segment; counts describe the active sector. The series is seeded from earlier dated snapshots, so early points are sparse and spacing is irregular until weekly updates accrue. <span class="j-built"></span>'
      +'<br><b>Sources.</b> Organisation records aggregated by <b>Find That Charity</b> (findthatcharity.uk, David Kane) from the primary UK registers — the <b>Charity Commission for England &amp; Wales</b>, <b>Companies House</b> (CICs), the <b>FCA Mutuals Public Register</b> (registered societies) and <b>HMRC</b> (CASCs). Register data © the respective bodies under the Open Government Licence v3.0; Find That Charity is published under CC-BY 4.0.'
      +'<br><b>© RCVDA</b> · Peter Neal · Data CC BY-NC-SA 4.0 · Code MIT.</footer>'
      +'</div>';
  }

  function initOne(root,tip){
    var SRC=root.getAttribute('data-src')||'';
    var FB=root.getAttribute('data-fallback')||'';
    var TITLE=root.getAttribute('data-title')||'State of the Sector';
    var AREA=root.getAttribute('data-area')||'Tees Valley';
    root.innerHTML=markup(TITLE,AREA);
    var S={ root:root, tip:tip, DATA:[], hidden1:{TV:true}, hidden2:{} };
    function q(c){ return root.querySelector(c); }
    S.q=q;

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

    var chain=[]; if(SRC)chain.push(SRC); if(FB&&FB!==SRC)chain.push(FB);
    fetchChain(chain.slice(),function(text,live){
      if(text===null){ q('.j-chart1').innerHTML='<div class="loading">The sector dataset could not be loaded.</div>'; return; }
      S.live=live; boot(S,parseCSV(text));
    });

    // re-render on dark-mode change so resolved colours track the estate
    var reRender=function(){ if(S.DATA.length) render(S); };
    if('MutationObserver' in window){ new MutationObserver(reRender).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']}); }
    if(window.matchMedia){ try{ window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',reRender); }catch(e){} }
    if('ResizeObserver' in window){ new ResizeObserver(reRender).observe(q('.j-chart1')); }

    q('.j-seg').addEventListener('change',function(){ render(S); });
    q('.j-bor').addEventListener('change',function(){ render(S); });
  }

  function boot(S,rows){
    S.DATA=rows.filter(function(r){ return r.definition==="based-in" && SEGMENTS.indexOf(r.segment)>=0 && LA_TOKEN[r.borough]; })
      .map(function(r){ return {seg:r.segment,bor:r.borough,date:r.snapshot_date,t:Date.parse(r.snapshot_date),active:+r.active||0}; })
      .filter(function(r){ return !isNaN(r.t); });
    var dates=S.DATA.map(function(r){return r.date;}).sort();
    var latest=dates[dates.length-1];
    S.q('.j-snap').textContent=fmtDate(latest);
    S.q('.j-built').textContent="Built "+fmtDate(latest)+(S.live?" · read live from the open dataset.":" · showing the bundled copy (live fetch unavailable).");
    render(S);
  }

  function latestDate(S){ var d=S.DATA.map(function(r){return r.date;}).sort(); return d[d.length-1]; }

  function boroughSeries(S,bor,measure){
    var byDate={};
    S.DATA.forEach(function(r){ if(r.bor!==bor) return; (byDate[r.date]=byDate[r.date]||{})[r.seg]=r.active; });
    var out=[];
    Object.keys(byDate).forEach(function(d){
      var row=byDate[d], v=null;
      if(measure==="ALL"){ if(SEGMENTS.every(function(s){return s in row;})) v=SEGMENTS.reduce(function(a,s){return a+row[s];},0); }
      else if(measure in row){ v=row[measure]; }
      if(v!==null) out.push({t:Date.parse(d),date:d,v:v});
    });
    return out.sort(function(a,b){return a.t-b.t;});
  }
  function tvSeries(S,measure){
    var perDate={};
    BORO.forEach(function(b){ boroughSeries(S,b[0],measure).forEach(function(p){ (perDate[p.date]=perDate[p.date]||{})[b[0]]=p.v; }); });
    var out=[];
    Object.keys(perDate).forEach(function(d){ var row=perDate[d]; if(BORO.every(function(b){return b[0] in row;})) out.push({t:Date.parse(d),date:d,v:BORO.reduce(function(a,b){return a+row[b[0]];},0)}); });
    return out.sort(function(a,b){return a.t-b.t;});
  }
  function segmentSeries(S,scope,seg){
    if(scope==="TV"){
      var perDate={};
      BORO.forEach(function(b){ S.DATA.forEach(function(r){ if(r.bor===b[0]&&r.seg===seg) (perDate[r.date]=perDate[r.date]||{})[b[0]]=r.active; }); });
      var out=[];
      Object.keys(perDate).forEach(function(d){ var row=perDate[d]; if(BORO.every(function(b){return b[0] in row;})) out.push({t:Date.parse(d),date:d,v:BORO.reduce(function(a,b){return a+row[b[0]];},0)}); });
      return out.sort(function(a,b){return a.t-b.t;});
    }
    return S.DATA.filter(function(r){return r.bor===scope&&r.seg===seg;}).map(function(r){return {t:r.t,date:r.date,v:r.active};}).sort(function(a,b){return a.t-b.t;});
  }

  function render(S){
    if(!S.DATA.length) return;
    var col=colours(S.root); S.col=col;
    var measure=S.q('.j-seg').value, scope=S.q('.j-bor').value;
    var mLabel=measure==="ALL"?"All VCSE":measure;
    var sLabel=scope==="TV"?"Tees Valley":(BORO.filter(function(b){return b[0]===scope;})[0]||["",scope])[1];
    S.q('.j-scope').innerHTML="Showing <b>"+esc(mLabel)+"</b> · "+esc(sLabel);
    renderKPIs(S,measure);
    var series1=BORO.map(function(b){ return {key:b[0],name:b[1],color:col.bor[b[0]],pts:boroughSeries(S,b[0],measure)}; });
    series1.push({key:"TV",name:"Tees Valley total",color:col.tv,pts:tvSeries(S,measure),dashed:true});
    S.q('.j-c1t').textContent=(measure==="ALL"?"Active VCSE organisations":("Active "+measure))+" by authority";
    drawChart(S,'.j-chart1',series1.filter(function(s){return !S.hidden1[s.key]&&s.pts.length;}),'.j-leg1',series1,S.hidden1);
    var series2=SEGMENTS.map(function(s){ return {key:s,name:s,color:col.seg[s],pts:segmentSeries(S,scope,s)}; });
    S.q('.j-c2t').textContent="The four segments over time — "+sLabel;
    drawChart(S,'.j-chart2',series2.filter(function(s){return !S.hidden2[s.key]&&s.pts.length;}),'.j-leg2',series2,S.hidden2);
    renderMatrix(S);
  }

  function renderKPIs(S,measure){
    var L=latestDate(S), tv=tvSeries(S,measure), box=S.q('.j-kpis'); box.innerHTML="";
    function tile(v,l,s,bar){ var d=document.createElement('div'); d.className="kpi"; if(bar)d.style.setProperty('--bar',bar);
      d.innerHTML='<div class="v tnum">'+(v==null?"—":v.toLocaleString())+'</div><div class="l">'+esc(l)+'</div><div class="s">'+esc(s)+'</div>'; box.appendChild(d); }
    tile(tv.length?tv[tv.length-1].v:null,(measure==="ALL"?"All VCSE":measure)+" · Tees Valley","based-in active · "+fmtDate(L),S.col.tv);
    BORO.forEach(function(b){ var s=boroughSeries(S,b[0],measure); tile(s.length?s[s.length-1].v:null,b[1],"based-in active",S.col.bor[b[0]]); });
  }

  function renderMatrix(S){
    var L=latestDate(S), t=S.q('.j-matrix');
    S.q('.j-mxsub').textContent="Active based-in organisations · "+fmtDate(L);
    var head="<thead><tr><th>Authority</th>"+SEGMENTS.map(function(s){return "<th>"+(s==="Charities"?"Char.":s)+"</th>";}).join("")+"<th>Total</th></tr></thead>";
    var body="<tbody>", colTot={}, grand=0; SEGMENTS.forEach(function(s){colTot[s]=0;});
    BORO.forEach(function(b){
      body+="<tr><td><span class='chip' style='background:"+S.col.bor[b[0]]+"'></span>"+esc(b[1])+"</td>"; var rt=0;
      SEGMENTS.forEach(function(s){ var rows=S.DATA.filter(function(r){return r.bor===b[0]&&r.seg===s&&r.date===L;}); var v=rows.length?rows[0].active:null; if(v!=null){rt+=v;colTot[s]+=v;} body+="<td>"+(v==null?"–":v)+"</td>"; });
      grand+=rt; body+="<td><b>"+rt+"</b></td></tr>";
    });
    body+="</tbody>";
    var foot="<tfoot><tr><td>Tees Valley</td>"+SEGMENTS.map(function(s){return "<td>"+colTot[s]+"</td>";}).join("")+"<td>"+grand+"</td></tr></tfoot>";
    t.innerHTML=head+body+foot;
  }

  function drawChart(S,hostSel,series,legSel,allSeries,hiddenMap){
    var host=S.q(hostSel), tip=S.tip;
    var W=host.clientWidth||680, H=320, P={t:14,r:16,b:30,l:38};
    var ts=[],vs=[]; series.forEach(function(s){s.pts.forEach(function(p){ts.push(p.t);vs.push(p.v);});});
    var leg=S.q(legSel); leg.innerHTML="";
    allSeries.forEach(function(s){
      if(!s.pts.length) return;
      var b=document.createElement('button'); b.setAttribute('aria-pressed',hiddenMap[s.key]?"false":"true");
      b.innerHTML='<span class="dot" style="background:'+s.color+'"></span>'+esc(s.name);
      b.addEventListener('click',function(){ hiddenMap[s.key]=!hiddenMap[s.key]; render(S); });
      leg.appendChild(b);
    });
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
    var dk=Object.keys(allDates).sort(function(a,b){return allDates[a]-allDates[b];});
    var every=Math.ceil(dk.length/6);
    dk.forEach(function(d,idx){ if(idx%every!==0 && idx!==dk.length-1) return; svg+='<text class="axlab" x="'+X(allDates[d])+'" y="'+(H-P.b+16)+'" text-anchor="middle">'+fmtShort(d)+'</text>'; });
    var topKey=null,topV=-1; series.forEach(function(s){var lv=s.pts[s.pts.length-1].v; if(lv>topV){topV=lv;topKey=s.key;}});
    var marks='';
    series.forEach(function(s){
      var d=''; s.pts.forEach(function(p,i){ d+=(i?'L':'M')+X(p.t).toFixed(1)+' '+Y(p.v).toFixed(1)+' '; });
      svg+='<path class="series" d="'+d+'" stroke="'+s.color+'"'+(s.dashed?' stroke-dasharray="5 4" stroke-width="1.8"':'')+'/>';
      s.pts.forEach(function(p){
        marks+='<circle class="mk" cx="'+X(p.t)+'" cy="'+Y(p.v)+'" r="3.4" fill="'+s.color+'"/>';
        marks+='<circle class="mk-hit" cx="'+X(p.t)+'" cy="'+Y(p.v)+'" r="11" data-l="'+esc(s.name+' · '+fmtDate(p.date)+': '+p.v)+'"/>';
      });
      if(s.key===topKey){ var last=s.pts[s.pts.length-1]; svg+='<text class="dlab" x="'+(X(last.t)+6)+'" y="'+(Y(last.v)+3)+'" fill="'+s.color+'">'+last.v+'</text>'; }
    });
    svg+=marks+'</svg>';
    host.innerHTML=svg;
    host.querySelectorAll('.mk-hit').forEach(function(c){
      c.addEventListener('mousemove',function(e){ tip.textContent=c.getAttribute('data-l'); tip.style.opacity=1; tip.style.left=(e.clientX+12)+'px'; tip.style.top=(e.clientY-10)+'px'; });
      c.addEventListener('mouseleave',function(){ tip.style.opacity=0; });
    });
  }

  function bootAll(){ var tip=ensureTip(); var list=document.querySelectorAll('.rcvda-vcse-sector'); for(var i=0;i<list.length;i++){ if(!list[i].__sots){ list[i].__sots=1; initOne(list[i],tip); } } }
  if(document.readyState!=="loading") bootAll(); else document.addEventListener('DOMContentLoaded',bootAll);
})();
