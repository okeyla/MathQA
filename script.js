(function(){
  var root=document.documentElement;
  function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function load(k){try{return localStorage.getItem(k)}catch(e){return null}}

  /* ===== 日期分頁＋題目分頁 ===== */
  var days=[].slice.call(document.querySelectorAll('.day'));
  var dateTabs=document.getElementById('dateTabs');
  days.forEach(function(day){
    var b=document.createElement('button');
    b.className='date-tab';b.setAttribute('role','tab');
    b.textContent=day.dataset.title||day.dataset.date;
    b.onclick=function(){showDay(day.dataset.date,true)};
    b.dataset.date=day.dataset.date;
    dateTabs.appendChild(b);

    var qs=[].slice.call(day.querySelectorAll('.q'));
    var qt=day.querySelector('.q-tabs');
    qs.forEach(function(q,i){
      var t=document.createElement('button');
      t.className='q-tab';t.setAttribute('role','tab');t.textContent=q.dataset.q;
      t.onclick=function(){showQ(day,i,true)};
      qt.appendChild(t);
    });

    var tg=document.createElement('button');
    tg.className='toggle-all';tg.type='button';
    var setLabel=function(){
      var all=day.querySelectorAll('details.step'),open=day.querySelectorAll('details.step[open]');
      tg.textContent=open.length===all.length?'全部收起':'全部展開';
    };
    tg.onclick=function(){
      var expand=tg.textContent==='全部展開';
      day.querySelectorAll('details.step').forEach(function(d){d.open=expand});
      setLabel();
    };
    day.querySelectorAll('details.step').forEach(function(d){d.addEventListener('toggle',setLabel)});
    qt.appendChild(tg);setLabel();
  });

  function showQ(day,i,push){
    var qs=day.querySelectorAll('.q'),ts=day.querySelectorAll('.q-tab');
    for(var k=0;k<qs.length;k++){qs[k].hidden=k!==i;ts[k].setAttribute('aria-selected',k===i)}
    if(push){history.replaceState(null,'','#'+day.dataset.date+'-'+(i+1));}
  }
  function showDay(date,push){
    days.forEach(function(d){d.hidden=d.dataset.date!==date});
    [].forEach.call(dateTabs.children,function(b){b.setAttribute('aria-selected',b.dataset.date===date)});
    var day=days.filter(function(d){return d.dataset.date===date})[0];
    if(push){showQ(day,0,true);window.scrollTo({top:0})}
  }

  // 預設顯示最新日期（最後一個 section），或網址 #MMDD-n
  var m=/^#(\w+?)(?:-(\d+))?$/.exec(location.hash);
  var startDay=days[days.length-1];
  if(m){var f=days.filter(function(d){return d.dataset.date===m[1]})[0];if(f)startDay=f;}
  showDay(startDay.dataset.date,false);
  var qi=m&&m[2]?Math.max(0,Math.min(+m[2]-1,startDay.querySelectorAll('.q').length-1)):0;
  showQ(startDay,qi,false);

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
