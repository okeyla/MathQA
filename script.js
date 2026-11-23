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
