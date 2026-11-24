(function(){
  var root=document.documentElement;
  function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function load(k){try{return localStorage.getItem(k)}catch(e){return null}}

  /* ===== 日期分頁＋題目列表 ===== */
  // 每個日期：先顯示「題目列表」，點一題才進入該題；題目頁上方有「回列表／上一題／下一題」。
  // 網址：#MMDD 是列表，#MMDD-n 是第 n 題（手機返回鍵可回列表）。
  var days=[].slice.call(document.querySelectorAll('.day'));
  var dateTabs=document.getElementById('dateTabs');
  days.forEach(function(day){
    var date=day.dataset.date;
    var b=document.createElement('button');
    b.className='date-tab';b.setAttribute('role','tab');
    b.textContent=day.dataset.title||date;
    b.dataset.date=date;
    b.onclick=function(){go('#'+date)};
    dateTabs.appendChild(b);

    var qs=[].slice.call(day.querySelectorAll('.q'));
    var holder=day.querySelector('.q-tabs');

    // 題目列表：相鄰、同主題（data-group）的題目放在同一個色塊，色塊用主題色的深淺區隔
    var list=document.createElement('div');
    list.className='q-groups';
    var tones=[[6,35],[20,60],[36,85],[52,100]]; // [底色濃度%, 邊條濃度%]
    var gs=[],ol=null;
    qs.forEach(function(q,i){
      var g=q.dataset.group||'';
      if(!ol||g!==gs[gs.length-1].name){
        var t=tones[gs.length%tones.length];
        var box=document.createElement('section');
        box.className='q-group';
        box.style.setProperty('--mix',t[0]+'%');box.style.setProperty('--edge',t[1]+'%');
        if(g)box.innerHTML='<div class="q-group-h"><span class="q-group-name">'+g+'</span><span class="q-group-range"></span></div>';
        ol=document.createElement('ol');ol.className='q-list';
        box.appendChild(ol);list.appendChild(box);
        gs.push({name:g,box:box,from:i,to:i,tone:t});
      }
      var G=gs[gs.length-1];G.to=i;q._g=G;
      var li=document.createElement('li');
      var a=document.createElement('a');
      a.href='#'+date+'-'+(i+1);
      var h3=q.querySelector('.card h3');
      var tags=[].map.call(q.querySelectorAll('.card .q-meta .tag'),function(t){return '<span class="tag">'+t.textContent+'</span>'}).join('');
      a.innerHTML='<span class="q-no">'+(i+1)+'</span><span class="q-main"><span class="q-name">'+q.dataset.q+'</span>'+
        (h3?'<span class="q-sub">'+h3.innerHTML+'</span>':'')+(tags?'<span class="q-tags">'+tags+'</span>':'')+'</span><span class="q-go">›</span>';
      a.onclick=function(e){e.preventDefault();go(a.getAttribute('href'))};
      li.appendChild(a);ol.appendChild(li);
    });
    gs.forEach(function(G){
      var r=G.box.querySelector('.q-group-range');
      if(r)r.textContent=G.from===G.to?'第 '+(G.from+1)+' 題':'第 '+(G.from+1)+'–'+(G.to+1)+' 題';
    });

    // 題目頁上方的導覽列
    var nav=document.createElement('div');
    nav.className='q-nav';
    nav.innerHTML='<button type="button" class="nav-back">← 題目列表</button>'+
      '<span class="nav-pos"></span>'+
      '<button type="button" class="nav-prev">‹ 上一題</button>'+
      '<button type="button" class="nav-next">下一題 ›</button>'+
      '<button type="button" class="toggle-all"></button>';
    var tg=nav.querySelector('.toggle-all');
    var setLabel=function(){
      var cur=day.querySelector('.q:not([hidden])');if(!cur)return;
      var all=cur.querySelectorAll('details.step'),open=cur.querySelectorAll('details.step[open]');
      tg.hidden=!all.length;
      tg.textContent=all.length&&open.length===all.length?'全部收起':'全部展開';
    };
    tg.onclick=function(){
      var cur=day.querySelector('.q:not([hidden])');if(!cur)return;
      var expand=tg.textContent==='全部展開';
      cur.querySelectorAll('details.step').forEach(function(d){d.open=expand});
      setLabel();
    };
    day.querySelectorAll('details.step').forEach(function(d){d.addEventListener('toggle',setLabel)});
    nav.querySelector('.nav-back').onclick=function(){go('#'+date)};
    day._setLabel=setLabel;day._list=list;day._nav=nav;day._qs=qs;

    holder.replaceWith(list);
    list.parentNode.insertBefore(nav,list.nextSibling);
  });

  function go(hash){
    if(location.hash!==hash)history.pushState(null,'',hash);
    route();window.scrollTo({top:0});
  }
  function route(){
    var m=/^#(\w+?)(?:-(\d+))?$/.exec(location.hash);
    var day=days[days.length-1]; // 預設：最新日期
    if(m){var f=days.filter(function(d){return d.dataset.date===m[1]})[0];if(f)day=f;}
    var date=day.dataset.date;
    days.forEach(function(d){d.hidden=d!==day});
    [].forEach.call(dateTabs.children,function(b){b.setAttribute('aria-selected',b.dataset.date===date)});
    var qs=day._qs,n=qs.length;
    var i=m&&m[2]?Math.max(0,Math.min(+m[2]-1,n-1)):-1;
    var head=day.querySelector('.day-head');
    if(i<0){ // 列表模式
      qs.forEach(function(q){q.hidden=true});
      day._list.hidden=false;day._nav.hidden=true;if(head)head.hidden=false;
      return;
    }
    qs.forEach(function(q,k){q.hidden=k!==i});
    day._list.hidden=true;day._nav.hidden=false;if(head)head.hidden=true;
    var nav=day._nav;
    var G=qs[i]._g;
    nav.style.setProperty('--mix',G.tone[0]+'%');nav.style.setProperty('--edge',G.tone[1]+'%');
    nav.querySelector('.nav-pos').innerHTML=(G.name?'<b>'+G.name+'</b>｜':'')+'第 '+(i+1)+' / '+n+' 題';
    var pv=nav.querySelector('.nav-prev'),nx=nav.querySelector('.nav-next');
    pv.disabled=i===0;nx.disabled=i===n-1;
    pv.onclick=function(){go('#'+date+'-'+i)};
    nx.onclick=function(){go('#'+date+'-'+(i+2))};
    day._setLabel();
    window.dispatchEvent(new Event('resize')); // 讓互動圖在顯示後重畫
  }
  window.addEventListener('popstate',route);
  route();

  /* ===== Q1 機率表 ===== */
  var rN=document.getElementById('robotN');
  if(rN){
    var fr=function(num,den){ // 化簡分數
      var g=function(a,b){return b?g(b,a%b):a};var d=g(num,den);
      num/=d;den/=d;return den===1?String(num):num+'/'+den;
    };
    var draw=function(){
      var n=+rN.value;document.getElementById('robotNv').textContent=n;
      // 用整數分子、分母 4^k 精確計算
      var a=1,b=0,c=0,d=0,den=1,rows=[];
      rows.push([0,a,b,c,d,den]);
      for(var k=1;k<=n;k++){
        var na=2*a+b+c, nb=2*b+a+d, nc=2*c+a+d, nd=2*d+b+c;
        a=na;b=nb;c=nc;d=nd;den*=4;rows.push([k,a,b,c,d,den]);
      }
      var h='<thead><tr><th>n</th><th>a<sub>n</sub></th><th>b<sub>n</sub></th><th>c<sub>n</sub></th><th>d<sub>n</sub></th><th>a<sub>n</sub>+d<sub>n</sub></th></tr></thead><tbody>';
      rows.forEach(function(r){
        h+='<tr'+(r[0]===n?' class="hl"':'')+'><td>'+r[0]+'</td><td>'+fr(r[1],r[5])+'</td><td>'+fr(r[2],r[5])+'</td><td>'+fr(r[3],r[5])+'</td><td>'+fr(r[4],r[5])+'</td><td>'+fr(r[1]+r[4],r[5])+'</td></tr>';
      });
      document.getElementById('robotTbl').innerHTML=h+'</tbody>';
    };
    rN.addEventListener('input',draw);draw();
  }


  /* ===== 11/24 小圖：三次函數草圖 ===== */
  var miniFns={
    two:{f:function(x){return x*x*x-3*x},x0:-2.2,x1:2.2,sx:34,sy:12,cx:80,cy:60},
    flat:{f:function(x){return x*x*x},x0:-1.6,x1:1.6,sx:45,sy:12,cx:80,cy:60},
    mono:{f:function(x){return x*x*x+x},x0:-1.4,x1:1.4,sx:52,sy:12,cx:80,cy:60},
    hike:{f:function(x){return x*x*x-3*x},x0:-2.15,x1:2.15,sx:62,sy:18,cx:150,cy:100},
    x3m3x:{f:function(x){return x*x*x-3*x},x0:-2.25,x1:2.25,sx:60,sy:20,cx:150,cy:110}
  };
  document.querySelectorAll('[data-fn]').forEach(function(el){
    var cfg=miniFns[el.dataset.fn];if(!cfg)return;
    var line=el.tagName.toLowerCase()==='polyline'?el:el.querySelector('polyline');
    var pts=[];
    for(var i=0;i<=80;i++){var x=cfg.x0+(cfg.x1-cfg.x0)*i/80;pts.push((cfg.cx+cfg.sx*x).toFixed(1)+','+(cfg.cy-cfg.sy*cfg.f(x)).toFixed(1));}
    line.setAttribute('points',pts.join(' '));
  });

  /* ===== 11/24 互動：三次函數 ===== */
  var cv=document.getElementById('cubicCv');
  if(cv){
    var ids=['A','B','C','D'],inp={};
    ids.forEach(function(k){inp[k]=document.getElementById('cb'+k)});
    var showD=document.getElementById('cbShowD'),info=document.getElementById('cbInfo');
    var X0=-5,X1=5,Y0=-12,Y1=12;
    var num=function(v){v=Math.round(v*100)/100;if(v===0)v=0;return (v<0?'−':'')+Math.abs(v)};
    var poly=function(cs,pw){ // 係數由高次到低次
      var s='',sup=['','','²','³'];
      cs.forEach(function(c,i){
        var p=pw-i;if(Math.abs(c)<1e-9)return;
        var ac=Math.abs(c),sign=c<0?' − ':' + ';
        if(s==='')sign=c<0?'−':'';
        var coef=(p>0&&Math.abs(ac-1)<1e-9)?'':String(Math.round(ac*100)/100);
        s+=sign+coef+(p>0?'x':'')+(p>1?sup[p]:'');
      });
      return s||'0';
    };
    var col=function(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()};
    var drawCubic=function(){
      var a=+inp.A.value,b=+inp.B.value,c=+inp.C.value,d=+inp.D.value;
      ids.forEach(function(k){document.getElementById('cb'+k+'v').textContent=num(+inp[k].value)});
      var W=cv.clientWidth,H=cv.clientHeight;
      if(!W)return; // 分頁沒顯示時不畫
      var dpr=window.devicePixelRatio||1;
      cv.width=W*dpr;cv.height=H*dpr;var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
      var px=function(x){return (x-X0)/(X1-X0)*W},py=function(y){return H-(y-Y0)/(Y1-Y0)*H};
      g.clearRect(0,0,W,H);
      g.lineWidth=1;g.strokeStyle=col('--line');
      var x,y;
      for(x=X0;x<=X1;x++){g.beginPath();g.moveTo(px(x),0);g.lineTo(px(x),H);g.stroke();}
      for(y=Y0;y<=Y1;y+=2){g.beginPath();g.moveTo(0,py(y));g.lineTo(W,py(y));g.stroke();}
      g.strokeStyle=col('--muted');g.lineWidth=1.5;
      g.beginPath();g.moveTo(0,py(0));g.lineTo(W,py(0));g.moveTo(px(0),0);g.lineTo(px(0),H);g.stroke();
      g.fillStyle=col('--muted');g.font='12px sans-serif';
      for(x=X0+1;x<X1;x++){if(x)g.fillText(x,px(x)-4,py(0)+14);}
      for(y=Y0+4;y<Y1;y+=4){if(y)g.fillText(y,px(0)+4,py(y)+4);}
      var f=function(x){return ((a*x+b)*x+c)*x+d},fp=function(x){return (3*a*x+2*b)*x+c};
      var curve=function(fn,color,width,dash){
        g.strokeStyle=color;g.lineWidth=width;g.setLineDash(dash||[]);g.beginPath();
        for(var i=0;i<=400;i++){var x=X0+(X1-X0)*i/400,y=Math.max(Y0-50,Math.min(Y1+50,fn(x)));if(i)g.lineTo(px(x),py(y));else g.moveTo(px(x),py(y));}
        g.stroke();g.setLineDash([]);
      };
      var dot=function(x,y,color,label){
        g.fillStyle=color;g.beginPath();g.arc(px(x),py(y),6,0,7);g.fill();
        g.font='bold 13px sans-serif';g.fillText(label,px(x)+8,py(y)-8);
      };
      if(a===0){
        curve(f,col('--accent'),3);
        info.innerHTML='<div class="verdict-box warn">a = 0 時就不是三次函數了，請把 a 調成非 0。</div>';return;
      }
      if(showD.checked)curve(fp,col('--muted'),2,[6,5]);
      curve(f,col('--accent'),3);
      var D=b*b-3*a*c,h=-b/(3*a),k=f(h),ext=[];
      if(D>1e-9){
        var r=Math.sqrt(D),x1=(-b-r)/(3*a),x2=(-b+r)/(3*a);
        if(x1>x2){var t=x1;x1=x2;x2=t;}
        ext=[x1,x2];
      }
      // a>0：左邊是極大、右邊是極小；a<0 相反
      ext.forEach(function(x,i){dot(x,f(x),col('--ok'),((a>0)===(i===0))?'極大':'極小')});
      dot(h,k,col('--miss'),'反曲點');
      var html='';
      html+='<div class="row"><span class="k">f(x)</span><b>'+poly([a,b,c,d],3)+'</b></div>';
      html+='<div class="row"><span class="k">f′(x)（斜率）</span><b>'+poly([3*a,2*b,c],2)+'</b></div>';
      html+='<div class="row"><span class="k">b² − 3ac</span><b>('+num(b)+')² − 3·('+num(a)+')·('+num(c)+') = '+num(D)+'</b></div>';
      html+='<div class="row"><span class="k">反曲點</span><b>x = −b/(3a) = '+num(h)+'，坐標 ('+num(h)+', '+num(k)+')</b></div>';
      var dir=a>0?'往上':'往下',v;
      if(D>1e-9){
        html+='<div class="row"><span class="k">f′(x)=0 的根</span><b>x = '+num(ext[0])+'、'+num(ext[1])+'（兩相異實根）</b></div>';
        html+='<div class="row"><span class="k">極值</span><b>f('+num(ext[0])+') = '+num(f(ext[0]))+'，f('+num(ext[1])+') = '+num(f(ext[1]))+'</b></div>';
        v=a>0?'b² − 3ac > 0：兩個彎，圖形 上 → 下 → 上，有極大值、極小值':'b² − 3ac > 0：兩個彎，圖形 下 → 上 → 下，有極小值、極大值';
      }else if(Math.abs(D)<=1e-9){
        html+='<div class="row"><span class="k">f′(x)=0 的根</span><b>x = '+num(h)+'（重根）</b></div>';
        v='b² − 3ac = 0：一路'+dir+'，只在反曲點躺平一下（平台），沒有極值';
      }else{
        html+='<div class="row"><span class="k">f′(x)=0 的根</span><b>沒有實根</b></div>';
        v='b² − 3ac < 0：一路'+dir+'，沒有彎，沒有極值';
      }
      info.innerHTML=html+'<div class="verdict-box">'+v+'</div>';
    };
    ids.forEach(function(k){inp[k].addEventListener('input',drawCubic)});
    showD.addEventListener('change',drawCubic);
    document.querySelectorAll('[data-preset]').forEach(function(bt){
      bt.addEventListener('click',function(){
        var v=bt.dataset.preset.split(',');ids.forEach(function(k,i){inp[k].value=v[i]});drawCubic();
      });
    });
    window.addEventListener('resize',drawCubic);
    new MutationObserver(drawCubic).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-accent','data-font']});
    if(window.matchMedia)window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',drawCubic);
    // 分頁切換後才有寬度，切換時重畫
    document.querySelectorAll('.q-tab,.date-tab').forEach(function(t){t.addEventListener('click',function(){setTimeout(drawCubic,0)})});
    drawCubic();
  }


  /* ===== 11/24 三角與算幾：互動圖解 ===== */
  var D2R=Math.PI/180;
  var r3=function(v){return (Math.round(v*1000)/1000).toFixed(3)};
  var L=function(x1,y1,x2,y2,cls){return '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" class="'+cls+'"/>'};
  var T=function(x,y,s,cls,anchor){return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" class="'+(cls||'fig-s')+'"'+(anchor?' text-anchor="'+anchor+'"':'')+'>'+s+'</text>'};
  var Pg=function(pts,cls){return '<polygon points="'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1)}).join(' ')+'" class="'+cls+'"/>'};
  var Dot=function(x,y,cls){return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4.5" class="'+(cls||'fig-dot')+'"/>'};
  // 以 (cx,cy) 為圓心、半徑 r，從角度 a0 到 a1（數學角度，逆時針）畫弧
  var Arc=function(cx,cy,r,a0,a1,cls){
    var x0=cx+r*Math.cos(a0*D2R),y0=cy-r*Math.sin(a0*D2R),x1=cx+r*Math.cos(a1*D2R),y1=cy-r*Math.sin(a1*D2R);
    return '<path d="M'+x0.toFixed(1)+','+y0.toFixed(1)+' A'+r+','+r+' 0 '+((a1-a0)>180?1:0)+' 0 '+x1.toFixed(1)+','+y1.toFixed(1)+'" class="'+(cls||'fig-arc-s')+'"/>';
  };
  var wire=function(ids,fn){
    var ok=true;ids.forEach(function(id){if(!document.getElementById(id))ok=false});
    if(!ok)return;
    ids.forEach(function(id){document.getElementById(id).addEventListener('input',fn)});
    fn();
  };

  // ---- 和角公式 ----
  wire(['saA','saB'],function(){
    var a=+document.getElementById('saA').value,b=+document.getElementById('saB').value;
    document.getElementById('saAv').textContent=a+'°';document.getElementById('saBv').textContent=b+'°';
    var S=230,ox=30,oy=270,mx=function(x){return ox+S*x},my=function(y){return oy-S*y};
    var A=[Math.cos(b*D2R)*Math.cos(a*D2R),Math.cos(b*D2R)*Math.sin(a*D2R)];
    var B=[Math.cos((a+b)*D2R),Math.sin((a+b)*D2R)];
    var Ax=mx(A[0]),Ay=my(A[1]),Bx=mx(B[0]),By=my(B[1]);
    var s='';
    s+=L(8,oy,334,oy,'fig-line');
    s+=Pg([[ox,oy],[Ax,Ay],[Ax,oy]],'tri1');
    s+=Pg([[Ax,Ay],[Ax,By],[Bx,By]],'tri2');
    s+=L(Bx,By,Bx,oy,'fig-dash');
    s+=L(ox,oy,Ax,Ay,'fig-line')+L(Ax,Ay,Bx,By,'fig-line');
    s+=L(Ax,oy,Ax,Ay,'seg-ok')+L(Ax,Ay,Ax,By,'seg-ok2')+L(Bx,By,Ax,By,'seg-bad');
    s+=L(ox,oy,Bx,By,'seg-acc');
    s+=Arc(ox,oy,42,0,a)+Arc(ox,oy,60,a,a+b,'fig-arc-s2')+Arc(Ax,Ay,22,90,90+a);
    s+=T(ox+52*Math.cos(a/2*D2R),oy-52*Math.sin(a/2*D2R)+5,'α','fig-s acc-t');
    s+=T(ox+72*Math.cos((a+b/2)*D2R)-4,oy-72*Math.sin((a+b/2)*D2R)+5,'β','fig-s acc-t');
    s+=T(Ax+30*Math.cos((90+a/2)*D2R)-4,Ay-30*Math.sin((90+a/2)*D2R)+4,'α','fig-s acc-t');
    s+=T((ox+Bx)/2-14,(oy+By)/2,'1','fig-s acc-t');
    s+=T((ox+Ax)/2+4,(oy+Ay)/2+18,'cos β','fig-xs');
    s+=T((Ax+Bx)/2-10*Math.cos(a*D2R),(Ay+By)/2+10*Math.sin(a*D2R)+8,'sin β','fig-xs',"end");
    s+=T(Ax+6,(oy+Ay)/2+4,'cosβ·sinα','fig-xs ok-t');
    s+=T(Ax+6,(Ay+By)/2+4,'sinβ·cosα','fig-xs ok2-t');
    s+=T((Ax+Bx)/2,By-7,'sinβ·sinα','fig-xs bad-t','middle');
    s+=T((ox+Ax)/2,oy+17,'cosβ·cosα','fig-xs','middle');
    s+=Dot(ox,oy)+Dot(Ax,Ay)+Dot(Bx,By);
    s+=T(ox-6,oy+18,'O')+T(Ax+6,Ay+16,'A')+T(Bx-9,By+5,'B','fig-s','end');
    document.getElementById('saSvg').innerHTML=s;
    var sa=Math.sin(a*D2R),ca=Math.cos(a*D2R),sb=Math.sin(b*D2R),cb=Math.cos(b*D2R);
    document.getElementById('saInfo').innerHTML=
      '<div class="row"><span class="k">B 的高度</span><b>sin('+(a+b)+'°) = '+r3(Math.sin((a+b)*D2R))+'</b></div>'+
      '<div class="row"><span class="k">兩段相加</span><b>綠 '+r3(cb*sa)+' ＋ 橘 '+r3(sb*ca)+' = '+r3(cb*sa+sb*ca)+' ✔</b></div>'+
      '<div class="row"><span class="k">B 的水平距離</span><b>cos('+(a+b)+'°) = '+r3(Math.cos((a+b)*D2R))+'</b></div>'+
      '<div class="row"><span class="k">走過去再退回</span><b>'+r3(cb*ca)+' − 紅 '+r3(sb*sa)+' = '+r3(cb*ca-sb*sa)+' ✔</b></div>'+
      '<div class="row"><span class="k">對照：錯誤寫法</span><b>sin'+a+'° + sin'+b+'° = '+r3(sa+sb)+' ≠ '+r3(Math.sin((a+b)*D2R))+'</b></div>';
  });

  // ---- 和差化積 ----
  wire(['spA','spB'],function(){
    var A=+document.getElementById('spA').value,B=+document.getElementById('spB').value;
    document.getElementById('spAv').textContent=A+'°';document.getElementById('spBv').textContent=B+'°';
    var R=150,cx=160,cy=190,mx=function(x){return cx+R*x},my=function(y){return cy-R*y};
    var P=[Math.cos(A*D2R),Math.sin(A*D2R)],Q=[Math.cos(B*D2R),Math.sin(B*D2R)];
    var M=[(P[0]+Q[0])/2,(P[1]+Q[1])/2],mid=(A+B)/2,half=(A-B)/2;
    var s='';
    s+=L(4,cy,316,cy,'fig-line')+L(cx,cy,cx,30,'fig-dash');
    s+='<path d="M'+(cx-R)+','+cy+' A'+R+','+R+' 0 0 1 '+(cx+R)+','+cy+'" class="fig-line"/>';
    s+=L(cx,cy,mx(P[0]),my(P[1]),'fig-thin')+L(cx,cy,mx(Q[0]),my(Q[1]),'fig-thin');
    s+=L(cx,cy,mx(Math.cos(mid*D2R)),my(Math.sin(mid*D2R)),'fig-dash');
    s+=L(mx(P[0]),my(P[1]),mx(Q[0]),my(Q[1]),'fig-line');
    s+=L(mx(M[0]),my(M[1]),mx(M[0]),cy,'seg-ok');
    s+=L(cx,cy,mx(M[0]),my(M[1]),'seg-acc');
    if(Math.abs(half)>=4)s+=Arc(cx,cy,34,Math.min(mid,A),Math.max(mid,A));
    s+=Dot(mx(P[0]),my(P[1]))+Dot(mx(Q[0]),my(Q[1]))+Dot(mx(M[0]),my(M[1]),'fig-ok');
    var lab=function(p,txt){var x=mx(p[0]),y=my(p[1]);if(p[0]>0.45)return T(x-4,y+24,txt,'fig-s','end');if(p[0]<-0.45)return T(x+4,y+24,txt,'fig-s','start');return T(x+(p[0]>=0?8:-8),y-8,txt,'fig-s',p[0]>=0?'start':'end')};
    s+=lab(P,'P（角 A）')+lab(Q,'Q（角 B）');
    s+=T(mx(M[0])+(M[0]>=0?8:-8),my(M[1])+16,'M','fig-s ok-t',M[0]>=0?'start':'end');
    var lx=(cx+mx(M[0]))/2,ly=(cy+my(M[1]))/2;
    s+=T(lx+(M[0]>=0?-6:6),ly,'cos((A−B)/2)','fig-xs acc-t',M[0]>=0?'end':'start');
    s+=T(cx,cy+16,'O','fig-s','middle');
    document.getElementById('spSvg').innerHTML=s;
    var sA=Math.sin(A*D2R),sB=Math.sin(B*D2R),cA=Math.cos(A*D2R),cB=Math.cos(B*D2R);
    var cm=Math.cos(half*D2R);
    document.getElementById('spInfo').innerHTML=
      '<div class="row"><span class="k">平均角、半差角</span><b>(A+B)/2 = '+mid+'°，(A−B)/2 = '+half+'°</b></div>'+
      '<div class="row"><span class="k">OM 長度</span><b>cos('+half+'°) = '+r3(cm)+'</b></div>'+
      '<div class="row"><span class="k">sinA + sinB</span><b>'+r3(sA+sB)+'　＝　2·sin('+mid+'°)·cos('+half+'°) = '+r3(2*Math.sin(mid*D2R)*cm)+' ✔</b></div>'+
      '<div class="row"><span class="k">cosA + cosB</span><b>'+r3(cA+cB)+'　＝　2·cos('+mid+'°)·cos('+half+'°) = '+r3(2*Math.cos(mid*D2R)*cm)+' ✔</b></div>'+
      '<div class="row"><span class="k">綠線（M 的高度）</span><b>(sinA + sinB)/2 = '+r3((sA+sB)/2)+'</b></div>';
  });

  // ---- 算幾不等式 ----
  wire(['amA','amB'],function(){
    var a=+document.getElementById('amA').value,b=+document.getElementById('amB').value;
    document.getElementById('amAv').textContent=a;document.getElementById('amBv').textContent=b;
    var by=190,x0=20,W=300,s0=W/(a+b),cx=x0+W/2,R=W/2;
    var Dx=x0+a*s0,h=Math.sqrt(a*b)*s0,Ey=by-h;
    var s='';
    s+=L(x0,by,x0+W,by,'fig-line');
    s+='<path d="M'+x0+','+by+' A'+R+','+R+' 0 0 1 '+(x0+W)+','+by+'" class="fig-line"/>';
    s+=L(x0,by,Dx,Ey,'fig-thin')+L(x0+W,by,Dx,Ey,'fig-thin');
    s+=L(cx,by,cx,by-R,'seg-acc');
    s+=L(Dx,by,Dx,Ey,'seg-ok');
    s+=Dot(cx,by)+Dot(Dx,Ey,'fig-ok');
    var right=Dx>=cx;
    s+=T(cx+(right?-6:6),by-R/2,'(a+b)/2 = '+((a+b)/2),'fig-xs acc-t',right?'end':'start');
    s+=T(Dx+(right?6:-6),(by+Ey)/2+16,'√ab = '+r3(Math.sqrt(a*b)).replace(/\.?0+$/,''),'fig-xs ok-t',right?'start':'end');
    s+=T((x0+Dx)/2,by+16,'a','fig-s','middle')+T((Dx+x0+W)/2,by+16,'b','fig-s','middle');
    document.getElementById('amSvg').innerHTML=s;
    var am=(a+b)/2,gm=Math.sqrt(a*b);
    document.getElementById('amInfo').innerHTML=
      '<div class="row"><span class="k">算術平均（半徑）</span><b>('+a+' + '+b+')/2 = '+am+'</b></div>'+
      '<div class="row"><span class="k">幾何平均（綠線）</span><b>√('+a+' × '+b+') = '+r3(gm)+'</b></div>'+
      '<div class="verdict-box">'+(Math.abs(a-b)<1e-9?'a = b，綠線剛好就是半徑：算術平均 = 幾何平均（等號成立）':'a ≠ b，綠線比半徑短：算術平均 > 幾何平均')+'</div>';
  });

  /* ===== KaTeX ===== */
  function renderMath(){
    if(window.renderMathInElement){
      renderMathInElement(document.getElementById('main'),{delimiters:[{left:'$',right:'$',display:false}],throwOnError:false});
    }
  }
  if(window.renderMathInElement)renderMath();else window.addEventListener('load',renderMath);

  /* ===== 配色／字型切換 ===== */
  var themes=[['auto','預設（跟隨電腦）','linear-gradient(90deg,#f5f1e8 50%,#16181a 50%)'],['light','淺色','#f5f1e8'],['dark','深色','#16181a']];
  var accents=[['indigo','靛青藍','#2b55a8'],['jade','翡翠綠','#1f6b52'],['teal','湖水藍','#0f7285'],['crimson','朱砂紅','#b33a2e'],
               ['rose','胭脂粉','#a8356a'],['amber','琥珀橙','#9a5b00'],['violet','紫藤紫','#6d44a8'],['ink','墨石灰','#3d4650']];
  var fonts=[['noto','思源黑體粗體','Noto Sans TC','"Noto Sans TC"',900],['huninn','粉圓','Huninn','"Huninn"',400],['iansui','芫荽','Iansui','"Iansui"',400]];

  function cur(attr,def){return root.getAttribute(attr)||def}
  function build(id,list,attr,key,def,isFont){
    var box=document.getElementById(id);
    list.forEach(function(it){
      var b=document.createElement('button');b.className='opt';b.dataset.v=it[0];
      if(isFont){b.innerHTML='<span style="font-family:'+it[3].replace(/"/g,"'")+';font-weight:'+it[4]+'">'+it[1]+'</span><small>'+it[2]+'</small>';}
      else{b.innerHTML='<span class="dot" style="background:'+it[2]+'"></span>'+it[1];}
      b.onclick=function(){
        if(it[0]===def)root.removeAttribute(attr);else root.setAttribute(attr,it[0]);
        store(key,it[0]);sync();
      };
      box.appendChild(b);
    });
  }
  build('themeOpts',themes,'data-theme','mq-theme','auto');
  build('accentOpts',accents,'data-accent','mq-accent','indigo');
  build('fontOpts',fonts,'data-font','mq-font','noto',true);
  function sync(){
    [['themeOpts','data-theme','auto'],['accentOpts','data-accent','indigo'],['fontOpts','data-font','noto']].forEach(function(x){
      var v=cur(x[1],x[2]);
      [].forEach.call(document.getElementById(x[0]).children,function(b){b.setAttribute('aria-pressed',b.dataset.v===v)});
    });
  }
  sync();

  var fabs=[].slice.call(document.querySelectorAll('.fab'));
  function closeAll(except){
    fabs.forEach(function(f){
      if(f===except)return;
      f.setAttribute('aria-expanded','false');document.getElementById(f.dataset.panel).hidden=true;
    });
  }
  fabs.forEach(function(f){
    f.addEventListener('click',function(e){
      e.stopPropagation();
      var p=document.getElementById(f.dataset.panel),open=p.hidden;
      closeAll(f);p.hidden=!open;f.setAttribute('aria-expanded',open);
    });
  });
  document.querySelectorAll('.panel').forEach(function(p){p.addEventListener('click',function(e){e.stopPropagation()})});
  document.addEventListener('click',function(){closeAll()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll()});
})();
