(function(){
  'use strict';

  // Mobile nav
  var toggle=document.getElementById('navtoggle');
  var links=document.getElementById('navlinks');
  if(toggle&&links){
    // Plus membership is paused - strip any leftover nav link (cached HTML / old deploy)
    [].forEach.call(links.querySelectorAll('a[href="/plus"], a[href="/plus/"], a[href="/vantage-ai"], a[href="/vantage-ai/"]'), function(a){
      if(a.parentNode) a.parentNode.removeChild(a);
    });
    var backdrop=document.querySelector('.nav-backdrop');
    if(!backdrop){
      backdrop=document.createElement('div');
      backdrop.className='nav-backdrop';
      backdrop.setAttribute('aria-hidden','true');
      document.body.appendChild(backdrop);
    }
    function setNavOpen(open){
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
      document.documentElement.classList.toggle('nav-open', open);
    }
    toggle.setAttribute('aria-controls', 'navlinks');
    if(!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click',function(e){
      e.stopPropagation();
      setNavOpen(!links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){setNavOpen(false);});
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape' && links.classList.contains('open')) setNavOpen(false);
    });
    document.addEventListener('click',function(e){
      if(!links.classList.contains('open')) return;
      if(links.contains(e.target) || toggle.contains(e.target)) return;
      setNavOpen(false);
    });
    backdrop.addEventListener('click',function(){setNavOpen(false);});
    var closeOnScroll=function(){
      if(links.classList.contains('open')) setNavOpen(false);
    };
    window.addEventListener('scroll',closeOnScroll,{passive:true});
  }

  // Shared page scroll: fixed duration + easing (no CSS scroll-behavior conflict)
  var vtScrollRaf = 0;
  var vtScrollListeners = null;
  var VT_SCROLL_MS = 700;
  function vtEaseInOutCubic(t){
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function vtStopSmoothScroll(){
    if(vtScrollRaf){
      cancelAnimationFrame(vtScrollRaf);
      vtScrollRaf = 0;
    }
    if(vtScrollListeners){
      window.removeEventListener('wheel', vtScrollListeners);
      window.removeEventListener('touchstart', vtScrollListeners);
      window.removeEventListener('keydown', vtScrollListeners);
      vtScrollListeners = null;
    }
  }
  function vtHeaderOffset(){
    var header = document.querySelector('header');
    if(!header) return 88;
    return Math.max(72, Math.round(header.getBoundingClientRect().bottom) + 12);
  }
  function vtSmoothScrollTo(targetY, opts){
    opts = opts || {};
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var startY = window.scrollY || window.pageYOffset || 0;
    var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var endY = Math.max(0, Math.min(Number(targetY) || 0, maxY));
    var dist = endY - startY;
    if(Math.abs(dist) < 2) return;
    vtStopSmoothScroll();
    if(reduce){
      window.scrollTo(0, endY);
      return;
    }
    var duration = opts.duration != null ? opts.duration : VT_SCROLL_MS;
    var start = performance.now();
    var alive = true;
    function onUserCancel(e){
      if(e.type === 'keydown'){
        var k = e.key;
        if(k !== 'Escape' && k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'PageUp' && k !== 'PageDown' && k !== 'Home' && k !== 'End' && k !== ' ') return;
      }
      alive = false;
      vtStopSmoothScroll();
    }
    vtScrollListeners = onUserCancel;
    window.addEventListener('wheel', onUserCancel, {passive:true});
    window.addEventListener('touchstart', onUserCancel, {passive:true});
    window.addEventListener('keydown', onUserCancel);
    function frame(now){
      if(!alive) return;
      var t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startY + dist * vtEaseInOutCubic(t));
      if(t < 1) vtScrollRaf = requestAnimationFrame(frame);
      else vtStopSmoothScroll();
    }
    vtScrollRaf = requestAnimationFrame(frame);
  }
  function vtSmoothScrollIntoView(el, opts){
    if(!el) return;
    opts = opts || {};
    var delay = opts.delay != null ? opts.delay : 0;
    var run = function(){
      if(!el.isConnected) return;
      var sm = parseFloat(getComputedStyle(el).scrollMarginTop);
      if(isNaN(sm)) sm = 0;
      var extra = opts.offset != null ? opts.offset : 0;
      // Prefer explicit offset, else scroll-margin, else live header clearance
      var pad = extra > 0 ? extra : (sm > 0 ? sm : vtHeaderOffset());
      var y = (window.scrollY || window.pageYOffset || 0) + el.getBoundingClientRect().top - pad;
      vtSmoothScrollTo(y, opts);
    };
    if(delay > 0) setTimeout(run, delay);
    else requestAnimationFrame(function(){ requestAnimationFrame(run); });
  }
  window.vtSmoothScrollTo = vtSmoothScrollTo;
  window.vtSmoothScrollIntoView = vtSmoothScrollIntoView;
  window.vtStopSmoothScroll = vtStopSmoothScroll;
  if('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Same-page hash links: eased scroll to target
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href === '#' || href.indexOf('#') !== 0) return;
    if(a.hasAttribute('download') || a.getAttribute('target') === '_blank') return;
    var id = decodeURIComponent(href.slice(1));
    if(!id) return;
    var target = document.getElementById(id);
    if(!target) return;
    e.preventDefault();
    if(history.pushState) history.pushState(null, '', href);
    else location.hash = href;
    vtSmoothScrollIntoView(target);
  });

  // Hero: stacked power words scroll up + rest phrase wipe from left
  var typed=document.getElementById('typed');
  var cursor=document.getElementById('cursor');
  var powerList=document.getElementById('heroPowerList');
  var typedShell=document.getElementById('typedShell');
  if(typed && powerList){
    var linesAttr=typed.getAttribute('data-lines')||'Shape the career you want.';
    var lines=linesAttr.split('|').map(function(s){return s.trim();}).filter(Boolean);
    var parsed=lines.map(function(line){
      var i=line.indexOf(' ');
      if(i<0) return {power:line, rest:''};
      return {power:line.slice(0,i), rest:line.slice(i+1).replace(/^\s+/,'')};
    });
    var n=parsed.length;
    var html='';
    // Duplicate list for seamless loop; focus sits on the top row
    for(var copy=0;copy<2;copy++){
      for(var i=0;i<n;i++){
        html+='<span class="hero-power-item" data-i="'+i+'">'+parsed[i].power+'</span>';
      }
    }
    powerList.innerHTML=html;
    var items=powerList.querySelectorAll('.hero-power-item');
    var step=1.2; // em - keep in sync with CSS --hero-row
    var w=0, phase='in', slide=0;
    var reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var headline=typed.closest('.hero-headline');
    if(cursor) cursor.hidden=true;

    var powerWidths={};
    function measurePowerWidths(){
      for(var pi=0;pi<n;pi++){
        var probe=null;
        for(var pk=0;pk<items.length;pk++){
          if(parseInt(items[pk].getAttribute('data-i'),10)===pi){ probe=items[pk]; break; }
        }
        powerWidths[pi]=probe ? Math.ceil(probe.getBoundingClientRect().width) : 0;
      }
    }
    measurePowerWidths();

    function setPhraseOn(on){
      if(!headline) return;
      headline.classList.toggle('is-phrase-on', !!on);
      if(!on && typedShell) typedShell.style.width='';
    }

    function setGreyCollapsed(on){
      if(!headline) return;
      headline.classList.toggle('is-grey-collapsed', !!on);
    }

    function paintClasses(activeIdx, prevIdx){
      for(var k=0;k<items.length;k++){
        var item=items[k];
        var di=parseInt(item.getAttribute('data-i'),10);
        item.classList.remove('is-active','is-near','is-exit','is-enter');
        if(di===activeIdx) item.classList.add('is-active');
        else if(di===(activeIdx+1)%n || di===(activeIdx+2)%n){
          item.classList.add('is-near');
          if(prevIdx!=null && di===prevIdx) item.classList.add('is-exit');
          if(di===(activeIdx+1)%n) item.classList.add('is-enter');
        }
      }
    }

    function setSlide(idx, animating){
      powerList.style.transition=animating && !reduce ? 'transform .79s cubic-bezier(.14,.82,.16,1)' : 'none';
      powerList.style.transform='translate3d(0,'+(-idx*step)+'em,0)';
    }

    function snapIfNeeded(){
      if(slide<n) return;
      slide=slide%n;
      setSlide(slide,false);
    }

    function syncPowerWidth(idx){
      if(!typedShell || !headline) return;
      var i = typeof idx==='number' ? idx : w;
      var activeW = powerWidths[i] || 0;
      headline.style.setProperty('--active-w', activeW + 'px');
      typedShell.style.setProperty('--power-w', activeW + 'px');
      // Narrow viewports + long power words: stack rest under power to avoid crush/overlap
      var shellW = typedShell.getBoundingClientRect().width || 0;
      var stack = shellW > 0 && activeW > shellW * 0.4;
      headline.classList.toggle('is-hero-stack', stack);
    }

    // Size the gradient shell to the phrase ink box so the wipe ends at the text
    // with the same edge thickness as the left pad (no empty overshoot on the right).
    function fitPhraseShell(){
      if(!typedShell || !typed || !headline) return;
      typedShell.style.width='';
      if(!headline.classList.contains('is-phrase-on')) return;
      void typedShell.offsetWidth;
      var padX=parseFloat(window.getComputedStyle(typedShell).paddingLeft)||0;
      var shellLeft=typedShell.getBoundingClientRect().left;
      var right=shellLeft;
      try{
        var range=document.createRange();
        range.selectNodeContents(typed);
        var rects=range.getClientRects();
        for(var ri=0;ri<rects.length;ri++){
          if(rects[ri].width>0) right=Math.max(right, rects[ri].right);
        }
      }catch(err){}
      right=Math.max(right, typed.getBoundingClientRect().right);
      var parent=typedShell.parentElement;
      var maxW=parent ? parent.getBoundingClientRect().width : right-shellLeft+padX;
      // CJK letter-spacing can outrun getClientRects; keep a small end buffer
      var isZh = document.documentElement.classList.contains('lang-zh') || (document.documentElement.lang || '').indexOf('zh') === 0;
      var padEnd = isZh ? Math.ceil((parseFloat(window.getComputedStyle(typed).fontSize) || 16) * 0.35) : 0;
      var next=Math.ceil(right-shellLeft+padX+padEnd);
      if(next>0) typedShell.style.width=Math.min(next, Math.floor(maxW))+'px';
    }

    // Keep in sync with --hero-wipe-in / --hero-wipe-out / --hero-slide in home-landing.css
    var WIPE_IN=1265, OUT_WIPE=605, SLIDE_MS=790, HOLD_MS=1600, AFTER_OUT=160;

    function showRest(text){
      // Indent first, then text - avoids a one-frame wrong wrap
      syncPowerWidth(w);
      typed.textContent=text;
      if(!typedShell) return;
      typedShell.classList.remove('is-out');
      setPhraseOn(true);
      setGreyCollapsed(true);
      fitPhraseShell();
      // Start wipe in the same frame as grey leave so they track together
      void typedShell.offsetWidth;
      typedShell.classList.add('is-in');
    }

    // Reserve the tallest phrase's height so the lede and CTAs never shift
    function reserveHeadlineHeight(){
      if(!headline || !typedShell) return;
      var saveText=typed.textContent;
      var saveOn=headline.classList.contains('is-phrase-on');
      var saveGrey=headline.classList.contains('is-grey-collapsed');
      var saveStack=headline.classList.contains('is-hero-stack');
      var saveWidth=typedShell.style.width;
      headline.classList.add('is-measuring');
      headline.style.minHeight='';
      typedShell.style.width='';
      var max=0;
      for(var mi=0;mi<n;mi++){
        typed.textContent=parsed[mi].rest;
        for(var on=0;on<2;on++){
          headline.classList.toggle('is-phrase-on', !!on);
          headline.classList.toggle('is-grey-collapsed', !!on);
          syncPowerWidth(mi);
          if(on) fitPhraseShell();
          else typedShell.style.width='';
          max=Math.max(max, headline.getBoundingClientRect().height);
        }
      }
      typed.textContent=saveText;
      headline.classList.toggle('is-phrase-on', saveOn);
      headline.classList.toggle('is-grey-collapsed', saveGrey);
      syncPowerWidth(w);
      headline.classList.toggle('is-hero-stack', saveStack);
      typedShell.style.width=saveWidth;
      if(saveOn) fitPhraseShell();
      void headline.offsetHeight;
      headline.classList.remove('is-measuring');
      headline.style.minHeight=Math.ceil(max)+'px';
    }

    setSlide(0,false);
    paintClasses(0,null);
    syncPowerWidth(0);
    typed.textContent=parsed[0].rest;
    reserveHeadlineHeight();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ measurePowerWidths(); reserveHeadlineHeight(); });
    if(reduce){
      setPhraseOn(true);
      setGreyCollapsed(true);
      if(typedShell) typedShell.classList.add('is-in');
    }else{
      (function tick(){
        var delay=100;
        if(phase==='out'){
          // Wipe left: retract phrase and reveal grey together
          if(typedShell){
            typedShell.classList.remove('is-in');
            typedShell.classList.add('is-out');
          }
          setGreyCollapsed(false);
          phase='unphrase';
          delay=OUT_WIPE;
        }else if(phase==='unphrase'){
          // Phrase gone + grey open: clear phrase layout, then scroll
          setPhraseOn(false);
          phase='swap';
          delay=AFTER_OUT;
        }else if(phase==='swap'){
          var prev=w;
          w=(w+1)%n;
          slide+=1;
          setSlide(slide,true);
          paintClasses(w,prev);
          syncPowerWidth(w);
          setTimeout(snapIfNeeded,SLIDE_MS+40);
          phase='in';
          delay=SLIDE_MS;
        }else{
          showRest(parsed[w].rest);
          phase='out';
          delay=WIPE_IN+HOLD_MS;
        }
        setTimeout(tick,delay);
      })();
    }
    var reserveTimer=null;
    window.addEventListener('resize', function(){
      measurePowerWidths();
      syncPowerWidth(w);
      if(headline && headline.classList.contains('is-phrase-on')) fitPhraseShell();
      clearTimeout(reserveTimer);
      reserveTimer=setTimeout(reserveHeadlineHeight,120);
    });
  }else if(typed){
    // Fallback: plain typing if power stack markup missing
    var fallbackLines=(typed.getAttribute('data-lines')||typed.getAttribute('data-words')||'QCE.').split(/[|,]/).map(function(s){return s.trim();}).filter(Boolean);
    var fw=0,fc=0,fdel=false;
    (function tick(){
      var word=fallbackLines[fw];
      typed.textContent=fdel?word.substring(0,fc--):word.substring(0,fc++);
      var delay=fdel?36:58;
      if(!fdel&&fc===word.length+1){fdel=true;delay=2200;}
      else if(fdel&&fc<0){fdel=false;fw=(fw+1)%fallbackLines.length;fc=0;delay=320;}
      setTimeout(tick,delay);
    })();
  }

  // Featured tutors marquee (homepage - photo tutors only, 2 staggered rows)
  var marqueeA=document.getElementById('marqueeA');
  var marqueeB=document.getElementById('marqueeB');
  if(marqueeA && marqueeB){
    var tutors=[
      {name:'Jason',atar:'99.85',img:'/assets/tutors/jason-liu.jpg',tops:[]},
      {name:'Yun',atar:'99.90',img:'/assets/tutors/yun-hao.jpg',tops:[{s:'100',l:'Methods'},{s:'100',l:'Physics'}]},
      {name:'Lincoln',atar:'99.80',img:'/assets/tutors/lincoln-murray-brown.jpg',tops:[{s:'100',l:'Methods'},{s:'99',l:'Physics'}]},
      {name:'Ishaan',atar:'99.90',img:'/assets/tutors/ishaan-tiwari.jpg',tops:[{s:'100',l:'Methods'},{s:'99',l:'Physics'}]},
      {name:'Jerry',atar:'99.90',img:'/assets/tutors/jerry-zhang.jpg',tops:[{s:'100',l:'Literature'},{s:'100',l:'Methods'}]},
      {name:'Keeran',atar:'99.50',img:'/assets/tutors/keeran-subendranathan.jpg',tops:[{s:'100',l:'Literature'},{s:'99',l:'Economics'}]},
      {name:'Brooklyn',atar:'99.75',img:'/assets/tutors/brooklyn-tran.jpg',tops:[{s:'100',l:'Literature'},{s:'99',l:'Chemistry'}]},
      {name:'Jize',atar:'99.85',img:'/assets/tutors/jize-peng.jpg',tops:[{s:'100',l:'Methods'},{s:'100',l:'Physics'}]},
      {name:'Ezekiel',atar:'99.85',img:'/assets/tutors/ezekiel-singh.jpg',tops:[{s:'99',l:'Methods'},{s:'99',l:'Physics'}]},
      {name:'Aniruddha',atar:'99.85',img:'/assets/tutors/aniruddha-das.jpg',tops:[{s:'98',l:'Chemistry'},{s:'98',l:'Physics'}]}
    ];
    function chipHtml(t){
      var tops='';
      if(t.tops && t.tops.length){
        tops='<span class="chip-subs">';
        for(var j=0;j<t.tops.length;j++){
          if(j) tops+='<span class="chip-sub-sep" aria-hidden="true">·</span>';
          tops+='<span class="chip-sub"><b>'+t.tops[j].s+'</b> '+t.tops[j].l+'</span>';
        }
        tops+='</span>';
      }
      return '<a class="chip" href="/tutors"><img class="chip-av" src="'+t.img+'" alt="" width="96" height="96" loading="lazy" decoding="async"><span class="chip-body"><span class="chip-name"><b>'+t.name+'</b><span class="score">'+t.atar+' ATAR</span></span>'+tops+'</span></a>';
    }
    var row1='', row2='';
    for(var i=0;i<tutors.length;i++){
      var chip=chipHtml(tutors[i]);
      if(i%2===0) row1+=chip; else row2+=chip;
    }
    // One repeat of the half is enough for a calm, seamless -50% loop
    function padMarqueeHalf(html){
      var half=html;
      var guard=0;
      while((half.match(/class="chip"/g)||[]).length < 6 && guard < 4){
        half+=html;
        guard++;
      }
      return half;
    }
    var halfA=padMarqueeHalf(row1);
    var halfB=padMarqueeHalf(row2);
    marqueeA.innerHTML=halfA+halfA;
    marqueeB.innerHTML=halfB+halfB;
  }

  // Animated counters
  var counters=document.querySelectorAll('.num[data-count]');
  if(counters.length){
    var counted=false;
    function run(){
      if(counted)return;counted=true;
      counters.forEach(function(el){
        var target=parseFloat(el.getAttribute('data-count'));
        var dec=parseInt(el.getAttribute('data-decimals')||'0',10);
        var suffix=el.getAttribute('data-suffix')||'';
        var start=null,dur=1600;
        function step(ts){
          if(!start)start=ts;
          var p=Math.min((ts-start)/dur,1);
          var eased=1-Math.pow(1-p,3);
          var val=(target*eased).toFixed(dec);
          el.textContent=Number(val).toLocaleString('en-AU',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suffix;
          if(p<1)requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    var anchor=document.querySelector('.stats')||counters[0];
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){run();io.disconnect();}});
    },{threshold:.4});
    io.observe(anchor);
  }

  // Scroll reveal
  var reveals=document.querySelectorAll('.reveal');
  if(reveals.length){
    var rio=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target);}});
    },{threshold:.12});
    reveals.forEach(function(el,i){el.style.transitionDelay=(i%4*70)+'ms';rio.observe(el);});
  }

  // Other subject field toggle (Student 1 + Student 2)
  function wireOtherSubject(cbId, wrapId, inputId){
    var otherCb=document.getElementById(cbId);
    var otherWrap=document.getElementById(wrapId);
    var otherInput=document.getElementById(inputId);
    if(!otherCb||!otherWrap) return;
    function syncOther(){
      var on=otherCb.checked && !otherCb.disabled;
      otherWrap.hidden=!on;
      if(otherInput){
        otherInput.required=on;
        if(!on)otherInput.value='';
      }
    }
    otherCb.addEventListener('change',syncOther);
    syncOther();
    return syncOther;
  }
  wireOtherSubject('subjectOther','otherSubjectWrap','other_subject');
  var syncOtherSubject2=wireOtherSubject('subjectOther2','otherSubjectWrap2','other_subject_2');

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function(btn){
    btn.addEventListener('click',function(){
      var item=btn.closest('.faq-item');
      var open=item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function(i){i.classList.remove('open');});
      if(!open)item.classList.add('open');
    });
  });

  // Form backend AJAX (Formspree enrol + FormBold careers)
  function wireAjaxForm(formId, successId){
    var form=document.getElementById(formId);
    if(!form) return;
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var btn=form.querySelector('button[type=submit]');
      var original=btn.innerHTML;
      btn.textContent='Sending…';btn.disabled=true;
      var data=new FormData(form);
      fetch(form.action,{method:'POST',body:data,headers:{'Accept':'application/json'}})
        .then(function(r){
          if(r.ok){
            form.style.display='none';
            var intro=form.parentElement && form.parentElement.querySelector('.form-intro');
            if(intro) intro.style.display='none';
            var ok=document.getElementById(successId);
            if(ok)ok.classList.add('show');
            return;
          }
          return r.json().then(function(d){
            var msg=(d && d.errors)?d.errors.map(function(x){return x.message;}).join(', '):(d && d.message)||'Oops, something went wrong. Please email us instead.';
            alert(msg);
            btn.innerHTML=original;btn.disabled=false;
          }).catch(function(){
            alert('Oops, something went wrong. Please email hello@vantagetutoring.com.au instead.');
            btn.innerHTML=original;btn.disabled=false;
          });
        })
        .catch(function(){
          alert('Network error, please email hello@vantagetutoring.com.au instead.');
          btn.innerHTML=original;btn.disabled=false;
        });
    });
  }
  wireAjaxForm('contactForm','formSuccess');
  wireAjaxForm('careersForm','careersFormSuccess');
  wireAjaxForm('vantageAiForm','vantageAiFormSuccess');

  // Masterclass sample PDF gate (rates page)
  (function(){
    var form = document.getElementById('mcSampleForm');
    if(!form) return;
    var gate = form.closest('[data-mc-sample-gate]') || form.parentElement;
    var unlock = gate ? gate.querySelector('[data-mc-sample-unlock]') : null;
    var status = form.querySelector('[data-mc-sample-status]');
    var pdfUrl = form.getAttribute('data-mc-pdf') || '';
    var pdfName = form.getAttribute('data-mc-pdf-name') || 'Vantage-Masterclass-sample.pdf';
    var isZh = document.documentElement.classList.contains('lang-zh') || (document.documentElement.lang || '').indexOf('zh') === 0;
    try{ localStorage.removeItem('vantage_mc_sample_unlocked_methods_1_1'); }catch(e){}

    function setStatus(msg, isError){
      if(!status) return;
      status.hidden = !msg;
      status.classList.toggle('is-error', !!isError);
      status.textContent = msg || '';
    }

    function fieldValue(name){
      var el = form.elements[name];
      if(!el) return '';
      if(el.type === 'checkbox') return el.checked ? String(el.value || '').trim() : '';
      return String(el.value || '').trim();
    }

    function validateGate(){
      var name = fieldValue('student_name');
      var phone = fieldValue('phone');
      var email = fieldValue('email');
      var newsletter = form.elements.newsletter;
      if(!name) return isZh ? '请填写学生姓名。' : 'Please enter the student name.';
      if(!phone) return isZh ? '请填写电话号码。' : 'Please enter a phone number.';
      if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return isZh ? '请填写有效的电子邮箱。' : 'Please enter a valid email address.';
      if(!newsletter || !newsletter.checked) return isZh ? '请订阅 Vantage tips 通讯以解锁下载。' : 'Please sign up to the Vantage tips newsletter to unlock the download.';
      if(!pdfUrl) return isZh ? '下载暂时不可用，请邮件联系 hello@vantagetutoring.com.au。' : 'Download is temporarily unavailable. Please email hello@vantagetutoring.com.au.';
      return '';
    }

    function showUnlocked(){
      form.hidden = true;
      if(!unlock) return;
      unlock.hidden = false;
      var link = unlock.querySelector('[data-mc-sample-download]');
      if(link){
        link.href = pdfUrl;
        link.setAttribute('download', pdfName);
      }
    }

    if(unlock){
      unlock.hidden = true;
      unlock.addEventListener('click', function(e){
        var a = e.target.closest ? e.target.closest('[data-mc-sample-download]') : null;
        if(!a) return;
        var href = a.getAttribute('href') || '';
        if(!href || href === '#') e.preventDefault();
      });
    }
    form.hidden = false;

    form.addEventListener('submit', function(e){
      e.preventDefault();
      setStatus('', false);
      var err = validateGate();
      if(err){
        setStatus(err, true);
        return;
      }
      var btn = form.querySelector('button[type=submit]');
      var original = btn ? btn.innerHTML : '';
      if(btn){ btn.textContent = 'Unlocking…'; btn.disabled = true; }
      var data = new FormData(form);
      fetch(form.action, { method:'POST', body:data, headers:{ 'Accept':'application/json' } })
        .then(function(r){
          if(r.ok){
            showUnlocked();
            return;
          }
          return r.json().then(function(d){
            var msg = (d && d.errors) ? d.errors.map(function(x){ return x.message; }).join(', ') : (d && d.message) || 'Something went wrong. Please try again or email hello@vantagetutoring.com.au.';
            setStatus(msg, true);
            if(btn){ btn.innerHTML = original; btn.disabled = false; }
          }).catch(function(){
            setStatus('Something went wrong. Please email hello@vantagetutoring.com.au.', true);
            if(btn){ btn.innerHTML = original; btn.disabled = false; }
          });
        })
        .catch(function(){
          setStatus('Network error. Please try again or email hello@vantagetutoring.com.au.', true);
          if(btn){ btn.innerHTML = original; btn.disabled = false; }
        });
    });
  })();

  // Careers tutor application: subjects + scores, ABN/Blue Card numbers, availability summary
  (function(){
    var form = document.getElementById('careersForm');
    if(!form) return;

    var subjectRoot = document.getElementById('studiedSubjects');
    var scoresEl = document.getElementById('subjectScores');
    var countEl = document.getElementById('subjectCount');
    var summaryEl = document.getElementById('subjectScoresSummary');
    var otherCb = document.getElementById('studiedOther');
    var otherWrap = document.getElementById('studiedOtherWrap');
    var otherInput = document.getElementById('c_other_subject');
    var abnSelect = document.getElementById('c_abn');
    var abnWrap = document.getElementById('abnNumberWrap');
    var abnInput = document.getElementById('c_abn_number');
    var blueSelect = document.getElementById('c_blue');
    var blueWrap = document.getElementById('blueNumberWrap');
    var blueInput = document.getElementById('c_blue_number');
    var availHidden = document.getElementById('careersAvailabilitySelected');
    var MAX_SUBJECTS = 6;

    function selectedSubjectBoxes(){
      return [].filter.call(
        subjectRoot ? subjectRoot.querySelectorAll('input[type="checkbox"]') : [],
        function(el){ return el.checked; }
      );
    }

    function subjectLabel(cb){
      if(cb.value === 'Other' && otherInput && otherInput.value.trim()){
        return otherInput.value.trim();
      }
      return cb.getAttribute('data-subject') || cb.value;
    }

    function syncOtherSubject(){
      var on = !!(otherCb && otherCb.checked);
      if(otherWrap) otherWrap.hidden = !on;
      if(otherInput){
        if(on) otherInput.setAttribute('required','required');
        else {
          otherInput.removeAttribute('required');
          otherInput.value = '';
        }
      }
    }

    function syncScoreFields(){
      if(!scoresEl) return;
      var checked = selectedSubjectBoxes();
      var existing = {};
      [].forEach.call(scoresEl.querySelectorAll('input[data-score-for]'), function(inp){
        existing[inp.getAttribute('data-score-for')] = inp.value;
      });
      scoresEl.innerHTML = '';
      checked.forEach(function(cb){
        var key = cb.value;
        var label = subjectLabel(cb);
        var id = 'score_' + key.replace(/\s+/g,'_');
        var row = document.createElement('div');
        row.className = 'career-score-row';
        var lab = document.createElement('label');
        lab.setAttribute('for', id);
        lab.textContent = label + ' score';
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.id = id;
        inp.name = 'subject_score_' + key.replace(/\s+/g,'_');
        inp.setAttribute('data-score-for', key);
        inp.placeholder = 'e.g. 98';
        inp.required = true;
        inp.inputMode = 'numeric';
        if(existing[key]) inp.value = existing[key];
        row.appendChild(lab);
        row.appendChild(inp);
        scoresEl.appendChild(row);
      });
      if(countEl){
        countEl.textContent = checked.length + ' of ' + MAX_SUBJECTS + ' selected';
        countEl.classList.toggle('is-complete', checked.length === MAX_SUBJECTS);
      }
      syncScoreSummary();
    }

    function syncScoreSummary(){
      if(!summaryEl || !scoresEl) return;
      var parts = [];
      [].forEach.call(scoresEl.querySelectorAll('.career-score-row'), function(row){
        var lab = row.querySelector('label');
        var inp = row.querySelector('input');
        if(!lab || !inp || !inp.value.trim()) return;
        parts.push(lab.textContent.replace(/ score$/, '') + ': ' + inp.value.trim());
      });
      summaryEl.value = parts.join('; ');
    }

    function syncAvailSummary(){
      if(!availHidden) return;
      var mode = document.getElementById('careersAvailHalfHour');
      var half = mode && mode.checked;
      var root = document.getElementById(half ? 'careersAvailModeHalf' : 'careersAvailModeHour') || form;
      var picks = [].map.call(
        root.querySelectorAll('input[name="availability[]"]:checked:not(:disabled)'),
        function(el){ return el.value; }
      );
      availHidden.value = picks.join(', ');
    }

    function syncAvailGranularity(){
      var toggle = document.getElementById('careersAvailHalfHour');
      var hourMode = document.getElementById('careersAvailModeHour');
      var halfMode = document.getElementById('careersAvailModeHalf');
      if(!toggle || !hourMode || !halfMode) return;
      var half = !!toggle.checked;
      hourMode.hidden = half;
      halfMode.hidden = !half;
      [].forEach.call(hourMode.querySelectorAll('input[name="availability[]"]'), function(el){
        el.disabled = half;
        if(half) el.checked = false;
      });
      [].forEach.call(halfMode.querySelectorAll('input[name="availability[]"]'), function(el){
        el.disabled = !half;
        if(!half) el.checked = false;
      });
      syncAvailSummary();
    }

    function syncAbn(){
      var need = abnSelect && abnSelect.value === 'I have an ABN';
      if(abnWrap) abnWrap.hidden = !need;
      if(abnInput){
        if(need) abnInput.setAttribute('required','required');
        else {
          abnInput.removeAttribute('required');
          abnInput.value = '';
        }
      }
    }

    function syncBlue(){
      var need = blueSelect && blueSelect.value === 'I have a Blue Card';
      if(blueWrap) blueWrap.hidden = !need;
      if(blueInput){
        if(need) blueInput.setAttribute('required','required');
        else {
          blueInput.removeAttribute('required');
          blueInput.value = '';
        }
      }
    }

    if(subjectRoot){
      subjectRoot.addEventListener('change', function(e){
        var t = e.target;
        if(!t || t.type !== 'checkbox') return;
        var checked = selectedSubjectBoxes();
        if(t.checked && checked.length > MAX_SUBJECTS){
          t.checked = false;
          alert('Please select exactly ' + MAX_SUBJECTS + ' Year 12 subjects.');
          return;
        }
        syncOtherSubject();
        syncScoreFields();
      });
    }

    if(otherInput){
      otherInput.addEventListener('input', function(){
        var lab = scoresEl && scoresEl.querySelector('input[data-score-for="Other"]');
        if(lab){
          var rowLab = lab.closest('.career-score-row');
          var labelEl = rowLab && rowLab.querySelector('label');
          if(labelEl) labelEl.textContent = subjectLabel(otherCb) + ' score';
        }
        syncScoreSummary();
      });
    }

    if(scoresEl){
      scoresEl.addEventListener('input', syncScoreSummary);
    }

    if(abnSelect) abnSelect.addEventListener('change', syncAbn);
    if(blueSelect) blueSelect.addEventListener('change', syncBlue);

    var halfToggle = document.getElementById('careersAvailHalfHour');
    if(halfToggle) halfToggle.addEventListener('change', syncAvailGranularity);

    form.addEventListener('change', function(e){
      if(e.target && e.target.name === 'availability[]') syncAvailSummary();
    });

    form.addEventListener('submit', function(e){
      var checked = selectedSubjectBoxes();
      if(checked.length !== MAX_SUBJECTS){
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('Please select all ' + MAX_SUBJECTS + ' subjects you studied in Year 12, and enter each score.');
        if(subjectRoot){
          if(window.vtSmoothScrollIntoView) window.vtSmoothScrollIntoView(subjectRoot, {offset: 80});
          else subjectRoot.scrollIntoView({behavior:'smooth', block:'center'});
        }
        return;
      }
      var missingScore = scoresEl && [].some.call(scoresEl.querySelectorAll('input'), function(inp){
        return !inp.value.trim();
      });
      if(missingScore){
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('Please enter a score for each selected subject.');
        return;
      }
      syncScoreSummary();
      syncAvailSummary();
    }, true);

    syncOtherSubject();
    syncScoreFields();
    syncAbn();
    syncBlue();
    syncAvailGranularity();
    syncAvailSummary();
  })();

  // Enquiry form routing (1-on-1 / masterclass / general)
  (function(){
    var form = document.getElementById('contactForm');
    if(!form) return;

    function cloneAvailabilityMode(src, suffix){
      var clone = src.cloneNode(true);
      clone.id = clone.id + suffix;
      [].forEach.call(clone.querySelectorAll('[id]'), function(el){
        if(el.id) el.id = el.id + suffix;
      });
      [].forEach.call(clone.querySelectorAll('[data-avail-expand]'), function(btn){
        btn.setAttribute('data-avail-expand', btn.getAttribute('data-avail-expand') + suffix);
      });
      [].forEach.call(clone.querySelectorAll('input[name="availability[]"]'), function(el){
        el.name = 'availability_2[]';
        el.disabled = true;
        el.checked = false;
      });
      return clone;
    }

    function buildStudent2Availability(){
      var mount = document.getElementById('student2AvailMount');
      var hourSrc = document.getElementById('availModeHour');
      var halfSrc = document.getElementById('availModeHalf');
      if(!mount || mount.dataset.built || !hourSrc || !halfSrc) return;

      var block = document.createElement('div');
      block.className = 'form-q';
      block.innerHTML = '<span class="form-q-title">When is this student available?</span><p class="avail-hint">Click or drag to select multiple times. Uses the same hour / 30-minute setting as Student 1.</p>';

      var hourClone = cloneAvailabilityMode(hourSrc, '2');
      var halfClone = cloneAvailabilityMode(halfSrc, '2');
      halfClone.hidden = true;
      block.appendChild(hourClone);
      block.appendChild(halfClone);

      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'availability_2_selected';
      hidden.id = 'availabilitySelected2';
      hidden.value = '';
      hidden.setAttribute('data-route-field', '');
      block.appendChild(hidden);

      mount.appendChild(block);
      mount.dataset.built = '1';
    }
    buildStudent2Availability();

    var finish = document.getElementById('formFinish');
    var typeGrid = document.getElementById('enquiryTypeGrid');
    var routeMap = {
      'Tutoring': 'routeTutoring',
      '1-on-1 tutoring': 'routeTutoring',
      'Masterclass': 'routeMasterclass',
      'Weekly subject masterclass': 'routeMasterclass',
      'UCAT masterclass': 'routeMasterclass',
      'General enquiry': 'routeGeneral',
      'Vantage Plus': 'routeGeneral'
    };
    var routePanelIds = ['routeTutoring', 'routeMasterclass', 'routeGeneral'];

    function isTutoringEnquiry(){
      return !!form.querySelector('input[name="enquiry_type"][value="Tutoring"]:checked')
        || !!form.querySelector('input[name="enquiry_type"][value="1-on-1 tutoring"]:checked');
    }

    function isStudent2Enrolled(){
      var toggle = document.getElementById('enrolSecondStudent');
      return !!(toggle && toggle.checked && isTutoringEnquiry());
    }

    function syncStudent2Fields(){
      var toggle = document.getElementById('enrolSecondStudent');
      var wrap = document.getElementById('student2Wrap');
      if(!toggle || !wrap) return;
      var on = !!toggle.checked && isTutoringEnquiry();
      wrap.hidden = !on;
      [].forEach.call(wrap.querySelectorAll('input, select, textarea'), function(el){
        el.disabled = !on;
        if(el.id === 'student2_name'){
          if(on) el.setAttribute('required','required');
          else el.removeAttribute('required');
        }
      });
      if(!on){
        [].forEach.call(wrap.querySelectorAll('input[name="availability_2[]"]'), function(el){
          el.checked = false;
        });
      }
      if(typeof syncOtherSubject2 === 'function') syncOtherSubject2();
      syncAvailGranularity();
      syncAvailabilitySummary();
    }

    function syncMasterclassKind(){
      var weekly = form.querySelector('input[name="masterclass_kind"][value="Weekly subject"]:checked');
      var ucat = form.querySelector('input[name="masterclass_kind"][value="UCAT"]:checked');
      var weeklyEl = document.getElementById('masterclassWeeklyFields');
      var ucatEl = document.getElementById('masterclassUcatFields');
      var masterclassOn = !!form.querySelector('input[name="enquiry_type"][value="Masterclass"]:checked');
      if(weeklyEl){
        weeklyEl.hidden = !masterclassOn || !weekly;
        [].forEach.call(weeklyEl.querySelectorAll('input, select, textarea'), function(el){
          var active = masterclassOn && !!weekly;
          el.disabled = !active;
          if(el.hasAttribute('data-route-required')){
            if(active) el.setAttribute('required','required');
            else el.removeAttribute('required');
          }
        });
      }
      if(ucatEl){
        ucatEl.hidden = !masterclassOn || !ucat;
        [].forEach.call(ucatEl.querySelectorAll('input, select, textarea'), function(el){
          var active = masterclassOn && !!ucat;
          el.disabled = !active;
          if(el.hasAttribute('data-route-required')){
            if(active) el.setAttribute('required','required');
            else el.removeAttribute('required');
          }
        });
      }
    }

    function showPanel(el, on){
      if(!el) return;
      var visible = !el.hasAttribute('hidden');
      if(on){
        if(visible) return;
        el.removeAttribute('hidden');
        el.classList.add('is-in');
      }else if(visible){
        el.classList.remove('is-in');
        el.setAttribute('hidden','');
      }
    }

    function syncHomeAddress(){
      var wrap = document.getElementById('homeAddressWrap');
      var input = document.getElementById('address');
      var suburb = document.getElementById('homeSuburb');
      if(!wrap) return;
      var homeOn = !!form.querySelector('input[name="location[]"][value="In person (student\'s home)"]:checked');
      var tutoringOn = isTutoringEnquiry();
      var show = tutoringOn && homeOn;
      wrap.hidden = !show;
      if(input){
        input.disabled = !show;
        if(!show) input.value = '';
      }
      if(suburb){
        suburb.disabled = !show;
        if(show) suburb.setAttribute('required', 'required');
        else{
          suburb.removeAttribute('required');
          suburb.value = '';
        }
      }
    }

    function populateHomeSuburbPicker(){
      var select = document.getElementById('homeSuburb');
      if(!select || !window.VTLoc) return;
      VTLoc.loadBoundaries().then(function(){
        VTLoc.populateSuburbSelect(select, 'Select suburb');
      });
    }
    populateHomeSuburbPicker();

    function syncStudentName(){
      var wrap = document.getElementById('studentNameWrap');
      var input = document.getElementById('student');
      if(!wrap) return;
      var parent = !!form.querySelector('input[name="role"][value="Parent/caregiver"]:checked');
      wrap.hidden = !parent;
      if(input){
        input.disabled = !parent;
        if(parent) input.setAttribute('required','required');
        else {
          input.removeAttribute('required');
          input.value = '';
        }
      }
    }

    function syncAvailabilitySummary(){
      var hidden = document.getElementById('availabilitySelected');
      var mode = document.getElementById('availHalfHour');
      var half = mode && mode.checked;
      var root = document.getElementById(half ? 'availModeHalf' : 'availModeHour') || form;
      if(hidden){
        var picks = [].map.call(
          root.querySelectorAll('input[name="availability[]"]:checked:not(:disabled)'),
          function(el){ return el.value; }
        );
        hidden.value = picks.join(', ');
      }

      var hidden2 = document.getElementById('availabilitySelected2');
      if(hidden2){
        var root2 = document.getElementById(half ? 'availModeHalf2' : 'availModeHour2');
        if(root2){
          var picks2 = [].map.call(
            root2.querySelectorAll('input[name="availability_2[]"]:checked:not(:disabled)'),
            function(el){ return el.value; }
          );
          hidden2.value = picks2.join(', ');
        }else{
          hidden2.value = '';
        }
      }
    }

    function syncAvailGranularity(){
      var toggle = document.getElementById('availHalfHour');
      var hourMode = document.getElementById('availModeHour');
      var halfMode = document.getElementById('availModeHalf');
      if(!toggle || !hourMode || !halfMode) return;
      var half = !!toggle.checked;
      var tutoringOn = isTutoringEnquiry();
      var student2On = isStudent2Enrolled();
      hourMode.hidden = half;
      halfMode.hidden = !half;
      [].forEach.call(hourMode.querySelectorAll('input[name="availability[]"]'), function(el){
        el.disabled = !tutoringOn || half;
        if(half) el.checked = false;
      });
      [].forEach.call(halfMode.querySelectorAll('input[name="availability[]"]'), function(el){
        el.disabled = !tutoringOn || !half;
        if(!half) el.checked = false;
      });

      var hourMode2 = document.getElementById('availModeHour2');
      var halfMode2 = document.getElementById('availModeHalf2');
      if(hourMode2 && halfMode2){
        hourMode2.hidden = half;
        halfMode2.hidden = !half;
        [].forEach.call(hourMode2.querySelectorAll('input[name="availability_2[]"]'), function(el){
          el.disabled = !tutoringOn || half || !student2On;
          if(half || !student2On) el.checked = false;
        });
        [].forEach.call(halfMode2.querySelectorAll('input[name="availability_2[]"]'), function(el){
          el.disabled = !tutoringOn || !half || !student2On;
          if(!half || !student2On) el.checked = false;
        });
      }
      syncAvailabilitySummary();
    }

    function setRoute(value){
      var activePanelId = value && routeMap[value] ? routeMap[value] : null;

      routePanelIds.forEach(function(panelId){
        var panel = document.getElementById(panelId);
        if(!panel) return;
        var on = panelId === activePanelId;
        showPanel(panel, on);

        [].forEach.call(panel.querySelectorAll('input, select, textarea'), function(el){
          el.disabled = !on;
          var needsRequired = el.hasAttribute('data-route-required');
          if(needsRequired){
            if(on) el.setAttribute('required','required');
            else el.removeAttribute('required');
          }
        });
      });

      showPanel(finish, !!value);
      if(finish){
        [].forEach.call(finish.querySelectorAll('input, select, textarea, button'), function(el){
          el.disabled = !value;
        });
      }
      syncHomeAddress();
      syncStudentName();
      syncStudent2Fields();
      syncMasterclassKind();
      syncAvailGranularity();
      syncAvailabilitySummary();
    }

    function selectedType(){
      var checked = form.querySelector('input[name="enquiry_type"]:checked');
      return checked ? checked.value : null;
    }

    function applySelected(){
      // Keep "What are you after?" fixed in the viewport while panels open below
      var before = typeGrid ? typeGrid.getBoundingClientRect().top : null;
      setRoute(selectedType());
      if(typeGrid && before != null){
        var delta = typeGrid.getBoundingClientRect().top - before;
        if(Math.abs(delta) > 0.5) window.scrollBy(0, delta);
      }
    }

    [].forEach.call(form.querySelectorAll('input[name="enquiry_type"]'), function(r){
      r.addEventListener('change', applySelected);
    });

    [].forEach.call(form.querySelectorAll('.enquiry-type'), function(label){
      label.addEventListener('click', function(e){
        var input = label.querySelector('input[name="enquiry_type"]');
        if(!input) return;
        if(input.checked){
          e.preventDefault();
          applySelected();
          return;
        }
        input.checked = true;
        applySelected();
        e.preventDefault();
      });
    });

    [].forEach.call(form.querySelectorAll('input[name="location[]"]'), function(el){
      el.addEventListener('change', syncHomeAddress);
    });

    [].forEach.call(form.querySelectorAll('input[name="role"]'), function(el){
      el.addEventListener('change', syncStudentName);
    });
    syncStudentName();

    var secondStudentToggle = document.getElementById('enrolSecondStudent');
    if(secondStudentToggle){
      secondStudentToggle.addEventListener('change', syncStudent2Fields);
    }

    [].forEach.call(form.querySelectorAll('input[name="masterclass_kind"]'), function(el){
      el.addEventListener('change', syncMasterclassKind);
    });

    var halfToggle = document.getElementById('availHalfHour');
    if(halfToggle){
      halfToggle.addEventListener('change', syncAvailGranularity);
    }

    form.addEventListener('change', function(e){
      if(e.target && (e.target.name === 'availability[]' || e.target.name === 'availability_2[]')) syncAvailabilitySummary();
    });

    // Click-drag paint lives in shared handler below (contact + careers)
    applySelected();

    [].forEach.call(document.querySelectorAll('[data-enquiry]'), function(a){
      a.addEventListener('click', function(){
        var map = {
          masterclass:'Masterclass',
          'ucat-masterclass':'Masterclass',
          tutoring:'Tutoring',
          plus:'General enquiry'
        };
        var val = map[a.getAttribute('data-enquiry')];
        if(!val) return;
        var input = form.querySelector('input[name="enquiry_type"][value="'+val+'"]');
        if(input){
          input.checked = true;
          applySelected();
          if(val === 'Masterclass'){
            var kind = a.getAttribute('data-enquiry') === 'ucat-masterclass' ? 'UCAT' : 'Weekly subject';
            var kindInput = form.querySelector('input[name="masterclass_kind"][value="'+kind+'"]');
            if(kindInput){
              kindInput.checked = true;
              syncMasterclassKind();
            }
          }
        }
      });
    });

    try{
      var params = new URLSearchParams(window.location.search);
      var typeParam = params.get('type');
      var typeMap = {
        masterclass:'Masterclass',
        'ucat-masterclass':'Masterclass',
        tutoring:'Tutoring',
        plus:'General enquiry'
      };
      var typeVal = typeMap[typeParam];
      if(typeVal){
        var typeInput = form.querySelector('input[name="enquiry_type"][value="'+typeVal+'"]');
        if(typeInput){
          typeInput.checked = true;
          applySelected();
          if(typeVal === 'Masterclass' && typeParam === 'ucat-masterclass'){
            var ucatKind = form.querySelector('input[name="masterclass_kind"][value="UCAT"]');
            if(ucatKind){
              ucatKind.checked = true;
              syncMasterclassKind();
            }
          }
        }
      }
    }catch(err){}
  })();

  // Click-drag to paint availability slots (enrol + careers)
  [].forEach.call(document.querySelectorAll('.avail-wrap'), function(wrap){
    if(wrap.classList.contains('avail-wrap--display')) return;
    var painting = false;
    var paintOn = true;
    var touchDragged = false;
    var touchStartX = 0;
    var touchStartY = 0;
    var touchStartCell = null;
    var suppressClick = false;
    var TOUCH_DRAG_PX = 12;

    function cellFromEvent(e){
      var t = e.target;
      if(!t) return null;
      return t.closest ? t.closest('.avail-cell') : null;
    }

    function paint(cell){
      if(!cell) return;
      var input = cell.querySelector('input[type=checkbox]');
      if(!input || input.disabled) return;
      input.checked = paintOn;
      if(typeof input.dispatchEvent === 'function'){
        input.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }

    wrap.addEventListener('mousedown', function(e){
      if(e.button !== 0) return;
      var cell = cellFromEvent(e);
      if(!cell) return;
      var input = cell.querySelector('input[type=checkbox]');
      if(!input || input.disabled) return;
      painting = true;
      paintOn = !input.checked;
      wrap.classList.add('is-painting');
      paint(cell);
      e.preventDefault();
    });

    wrap.addEventListener('click', function(e){
      if(suppressClick){
        suppressClick = false;
        e.preventDefault();
        return;
      }
      if(!cellFromEvent(e)) return;
      e.preventDefault();
    });

    wrap.addEventListener('mouseover', function(e){
      if(!painting) return;
      paint(cellFromEvent(e));
    });

    function endPaint(){
      if(!painting) return;
      painting = false;
      wrap.classList.remove('is-painting');
    }
    window.addEventListener('mouseup', endPaint);

    wrap.addEventListener('touchstart', function(e){
      var cell = cellFromEvent(e);
      if(!cell || !wrap.contains(cell)) return;
      var input = cell.querySelector('input[type=checkbox]');
      if(!input || input.disabled) return;
      if(e.touches && e.touches[0]){
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
      touchStartCell = cell;
      touchDragged = false;
      painting = true;
      paintOn = !input.checked;
      wrap.classList.add('is-painting');
    }, {passive:true});

    wrap.addEventListener('touchmove', function(e){
      if(!e.touches || !e.touches[0]) return;
      var dx = e.touches[0].clientX - touchStartX;
      var dy = e.touches[0].clientY - touchStartY;
      if(!touchDragged && (dx * dx + dy * dy) > TOUCH_DRAG_PX * TOUCH_DRAG_PX){
        touchDragged = true;
        paint(touchStartCell);
      }
      if(!touchDragged) return;
      var el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
      var cell = el && el.closest ? el.closest('.avail-cell') : null;
      if(!cell || !wrap.contains(cell)) return;
      paint(cell);
    }, {passive:true});

    wrap.addEventListener('touchend', function(e){
      if(painting && !touchDragged && touchStartCell){
        paint(touchStartCell);
        suppressClick = true;
        e.preventDefault();
      }
      touchStartCell = null;
      touchDragged = false;
      endPaint();
    });

    wrap.addEventListener('touchcancel', function(){
      touchStartCell = null;
      touchDragged = false;
      endPaint();
    });
  });

  // Availability expand (enrolment + tutors)
  [].forEach.call(document.querySelectorAll('[data-avail-expand]'), function(btn){
    var id = btn.getAttribute('data-avail-expand');
    var panel = document.getElementById(id);
    var show = btn.querySelector('.avail-expand-show');
    var hide = btn.querySelector('.avail-expand-hide');
    var isDisplay = !!(btn.closest && btn.closest('.avail-wrap--display'));

    // Tutor calendars: morning panel collapsed; label from HTML range + slot count
    if(isDisplay && panel && show){
      var baseLabel = show.getAttribute('data-base-label');
      if(!baseLabel){
        baseLabel = show.textContent.replace(/\s*·\s*(has|no) times\s*$/i, '').trim();
        show.setAttribute('data-base-label', baseLabel);
      }
      var hasMorning = panel.querySelectorAll('.avail-half.on').length > 0;
      show.textContent = hasMorning
        ? baseLabel + ' · has times'
        : baseLabel + ' · no times';
      if(hide) hide.textContent = baseLabel.replace(/^Show\s+/i, 'Hide ');
      btn.classList.toggle('has-morning', hasMorning);
      btn.classList.toggle('no-morning', !hasMorning);
    }

    btn.addEventListener('click', function(){
      if(!panel) return;
      var open = panel.hasAttribute('hidden');
      if(open) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden','');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(show) show.hidden = open;
      if(hide) hide.hidden = !open;
    });
  });

  // Static preview maps (home + contact) + dynamic area controls on tutors page
  var staticMaps=document.querySelectorAll('[data-vt-map-static]');
  if(staticMaps.length && typeof L!=='undefined' && window.VTLoc && VTLoc.initStaticServiceMaps){
    VTLoc.initStaticServiceMaps(staticMaps, L);
  }
  if(window.VTLoc && VTLoc.initServiceAreaMirroring && document.querySelector('[data-vt-dynamic-area]')){
    VTLoc.initServiceAreaMirroring();
  }

  // Footer language toggle: EN ↔ 中文 (/ch/ mirror)
  (function(){
    var path = location.pathname || '/';
    var isZh = path === '/ch' || path === '/ch/' || path.indexOf('/ch/') === 0;
    var enPath = isZh ? (path.replace(/^\/ch/, '') || '/') : path;
    if(enPath.length > 1 && enPath.slice(-1) === '/'){ /* keep trailing slash */ }
    var zhPath = isZh ? path : ('/ch' + (path === '/' ? '/' : path));
    var qs = location.search || '';
    var hash = location.hash || '';
    var footers = document.querySelectorAll('footer .footer-bottom, footer .wrap');
    var host = null;
    var bottom = document.querySelector('footer .footer-bottom');
    if(bottom){
      host = document.createElement('div');
      host.className = 'lang-format-wrap';
      bottom.appendChild(host);
    } else {
      var wrap = document.querySelector('footer .wrap');
      if(!wrap) return;
      host = document.createElement('div');
      host.className = 'lang-format-wrap';
      wrap.appendChild(host);
    }
    host.innerHTML =
      '<div class="lang-format" data-lang-toggle role="group" aria-label="'+(isZh ? '语言' : 'Language')+'">' +
        '<a class="lang-format-btn'+(isZh ? '' : ' is-active')+'" href="'+enPath+qs+hash+'" lang="en"'+(isZh ? '' : ' aria-current="true"')+'>EN</a>' +
        '<a class="lang-format-btn'+(isZh ? ' is-active' : '')+'" href="'+zhPath+qs+hash+'" lang="zh-Hans"'+(isZh ? ' aria-current="true"' : '')+'>中文</a>' +
      '</div>';
  })();

  // Home: subject chip hover/focus preview → tutors page with filter
  var subjectPreview=document.getElementById('subjectPreview');
  var subjectBoard=document.querySelector('.edu-subject-board');
  if(subjectPreview && subjectBoard){
    var subjectPreviewDefault=subjectPreview.textContent;
    var isZhHome = document.documentElement.classList.contains('lang-zh') || (document.documentElement.lang || '').indexOf('zh') === 0;
    function setSubjectPreview(chip){
      if(!chip){
        subjectPreview.textContent=subjectPreviewDefault;
        subjectPreview.classList.remove('is-active');
        return;
      }
      var label=chip.getAttribute('data-label')||chip.textContent.trim();
      var atar=chip.getAttribute('data-atar');
      if(isZhHome){
        subjectPreview.textContent=atar
          ? '查找 '+label+' 导师 · 最高 ATAR '+atar
          : '查找 '+label+' 导师';
      } else {
        subjectPreview.textContent=atar
          ? 'Find a tutor for '+label+' · up to '+atar+' ATAR'
          : 'Find a tutor for '+label;
      }
      subjectPreview.classList.add('is-active');
    }
    subjectBoard.addEventListener('mouseover', function(e){
      var chip=e.target.closest ? e.target.closest('a.edu-subject-chip') : null;
      if(chip) setSubjectPreview(chip);
    });
    subjectBoard.addEventListener('mouseout', function(e){
      if(!subjectBoard.contains(e.relatedTarget)) setSubjectPreview(null);
    });
    subjectBoard.addEventListener('focusin', function(e){
      var chip=e.target.closest ? e.target.closest('a.edu-subject-chip') : null;
      if(chip) setSubjectPreview(chip);
    });
    subjectBoard.addEventListener('focusout', function(e){
      if(!subjectBoard.contains(e.relatedTarget)) setSubjectPreview(null);
    });
  }

})();
