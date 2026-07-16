(function(){
  'use strict';

  // Mobile nav
  var toggle=document.getElementById('navtoggle');
  var links=document.getElementById('navlinks');
  if(toggle&&links){
    toggle.addEventListener('click',function(){links.classList.toggle('open');});
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){links.classList.remove('open');});
    });
  }

  // Typing animation (home)
  var typed=document.getElementById('typed'), cursor=document.getElementById('cursor');
  if(typed){
    var words=(typed.getAttribute('data-words')||'QCE.,ATAR.,future.,A+.').split(',');
    var w=0,c=0,deleting=false;
    (function tick(){
      var word=words[w];
      typed.textContent=deleting?word.substring(0,c--):word.substring(0,c++);
      var delay=deleting?55:110;
      if(!deleting&&c===word.length+1){deleting=true;delay=1500;}
      else if(deleting&&c<0){deleting=false;w=(w+1)%words.length;c=0;delay=350;}
      setTimeout(tick,delay);
    })();
  }

  // Tutor marquee
  var marquee=document.getElementById('marquee');
  if(marquee){
    var tutors=[
      {name:'Jason',atar:'99.85',img:'/assets/tutors/jason-liu.jpg'},
      {name:'Yun',atar:'99.90',img:'/assets/tutors/yun-hao.jpg'},
      {name:'Lincoln',atar:'99.80',img:'/assets/tutors/lincoln-murray-brown.jpg'},
      {name:'Keeran',atar:'99.50',img:'/assets/tutors/keeran-subendranathan.jpg'},
      {name:'Brooklyn',atar:'99.75',img:'/assets/tutors/brooklyn-tran.jpg'},
      {name:'Jize',atar:'99.85',img:'/assets/tutors/jize-peng.jpg'},
      {name:'Ken',atar:'99.85',init:'KW'},
      {name:'Crystal',init:'CT'}
    ];
    var html='';
    for(var i=0;i<tutors.length;i++){
      var t=tutors[i];
      var av=t.img
        ? '<img class="chip-av" src="'+t.img+'" alt="" width="40" height="40" loading="eager" decoding="async">'
        : '<span class="chip-av chip-av--init" aria-hidden="true">'+(t.init||t.name.charAt(0))+'</span>';
      var score=t.atar ? '<span class="score">'+t.atar+' ATAR</span>' : '';
      html+='<span class="chip">'+av+'<b>'+t.name+'</b>'+score+'</span>';
    }
    marquee.innerHTML=html+html;
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

  // Other subject field toggle
  var otherCb=document.getElementById('subjectOther');
  var otherWrap=document.getElementById('otherSubjectWrap');
  var otherInput=document.getElementById('other_subject');
  if(otherCb&&otherWrap){
    function syncOther(){
      var on=otherCb.checked;
      otherWrap.hidden=!on;
      if(otherInput){
        otherInput.required=on;
        if(!on)otherInput.value='';
      }
    }
    otherCb.addEventListener('change',syncOther);
    syncOther();
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function(btn){
    btn.addEventListener('click',function(){
      var item=btn.closest('.faq-item');
      var open=item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function(i){i.classList.remove('open');});
      if(!open)item.classList.add('open');
    });
  });

  // Formspree AJAX
  var form=document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var btn=form.querySelector('button[type=submit]');
      var original=btn.innerHTML;
      btn.textContent='Sending…';btn.disabled=true;
      fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}})
        .then(function(r){
          if(r.ok){
            form.style.display='none';
            var ok=document.getElementById('formSuccess');
            if(ok)ok.classList.add('show');
          }else{
            r.json().then(function(d){
              alert(d.errors?d.errors.map(function(x){return x.message;}).join(', '):'Oops, something went wrong. Please email us instead.');
              btn.innerHTML=original;btn.disabled=false;
            });
          }
        })
        .catch(function(){
          alert('Network error, please email hello@vantagetutoring.com.au instead.');
          btn.innerHTML=original;btn.disabled=false;
        });
    });
  }

  // Enquiry form routing (1-on-1 / masterclass / assignment review)
  (function(){
    var form = document.getElementById('contactForm');
    if(!form) return;

    var finish = document.getElementById('formFinish');
    var typeGrid = document.getElementById('enquiryTypeGrid');
    var routeMap = {
      '1-on-1 tutoring': 'routeTutoring',
      'Weekly subject masterclass': 'routeMasterclass',
      'Assignment review': 'routeAssignment'
    };

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
      if(!wrap) return;
      var homeOn = !!form.querySelector('input[name="location[]"][value="In person (student\'s home)"]:checked');
      var tutoringOn = !!form.querySelector('input[name="enquiry_type"][value="1-on-1 tutoring"]:checked');
      var show = tutoringOn && homeOn;
      wrap.hidden = !show;
      if(input){
        input.disabled = !show;
        if(!show) input.value = '';
      }
    }

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
      if(!hidden) return;
      var mode = document.getElementById('availHalfHour');
      var half = mode && mode.checked;
      var root = document.getElementById(half ? 'availModeHalf' : 'availModeHour') || form;
      var picks = [].map.call(
        root.querySelectorAll('input[name="availability[]"]:checked:not(:disabled)'),
        function(el){ return el.value; }
      );
      hidden.value = picks.join(', ');
    }

    function syncAvailGranularity(){
      var toggle = document.getElementById('availHalfHour');
      var hourMode = document.getElementById('availModeHour');
      var halfMode = document.getElementById('availModeHalf');
      if(!toggle || !hourMode || !halfMode) return;
      var half = !!toggle.checked;
      var tutoringOn = !!form.querySelector('input[name="enquiry_type"][value="1-on-1 tutoring"]:checked');
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
      syncAvailabilitySummary();
    }

    function setRoute(value){
      Object.keys(routeMap).forEach(function(key){
        var panel = document.getElementById(routeMap[key]);
        if(!panel) return;
        var on = !!value && key === value;
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

    var halfToggle = document.getElementById('availHalfHour');
    if(halfToggle){
      halfToggle.addEventListener('change', syncAvailGranularity);
    }

    form.addEventListener('change', function(e){
      if(e.target && e.target.name === 'availability[]') syncAvailabilitySummary();
    });

    // Click-drag to paint multiple availability slots
    [].forEach.call(form.querySelectorAll('.avail-wrap'), function(wrap){
      if(wrap.classList.contains('avail-wrap--display')) return;
      var painting = false;
      var paintOn = true;
      var touchDragged = false;
      var touchCell = null;

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
        syncAvailabilitySummary();
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
        if(!cellFromEvent(e)) return;
        // Mousedown already toggles; block label click to avoid double-toggle.
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

      // Touch: tap toggles once; drag paints without double-toggle
      wrap.addEventListener('touchstart', function(e){
        if(!e.touches || !e.touches[0]) return;
        var el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        var cell = el && el.closest ? el.closest('.avail-cell') : null;
        if(!cell || !wrap.contains(cell)) return;
        var input = cell.querySelector('input[type=checkbox]');
        if(!input || input.disabled) return;
        touchDragged = false;
        touchCell = cell;
        paintOn = !input.checked;
      }, {passive:true});

      wrap.addEventListener('touchmove', function(e){
        if(!e.touches || !e.touches[0]) return;
        touchDragged = true;
        var el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        var cell = el && el.closest ? el.closest('.avail-cell') : null;
        if(!cell || !wrap.contains(cell)) return;
        if(!painting){
          painting = true;
          wrap.classList.add('is-painting');
        }
        paint(cell);
      }, {passive:true});

      wrap.addEventListener('touchend', function(){
        if(!touchDragged && touchCell){
          paint(touchCell);
        }
        touchCell = null;
        touchDragged = false;
        endPaint();
      });

      wrap.addEventListener('touchcancel', function(){
        touchCell = null;
        touchDragged = false;
        endPaint();
      });
    });

    applySelected();

    [].forEach.call(document.querySelectorAll('[data-enquiry]'), function(a){
      a.addEventListener('click', function(){
        var map = {masterclass:'Weekly subject masterclass', assignment:'Assignment review'};
        var val = map[a.getAttribute('data-enquiry')];
        if(!val) return;
        var input = form.querySelector('input[name="enquiry_type"][value="'+val+'"]');
        if(input){
          input.checked = true;
          applySelected();
        }
      });
    });
  })();

  // Availability expand (enrolment + tutors)
  [].forEach.call(document.querySelectorAll('[data-avail-expand]'), function(btn){
    var id = btn.getAttribute('data-avail-expand');
    var panel = document.getElementById(id);
    var show = btn.querySelector('.avail-expand-show');
    var hide = btn.querySelector('.avail-expand-hide');
    var isDisplay = !!(btn.closest && btn.closest('.avail-wrap--display'));

    // Tutor calendars: say if morning section has any available slots
    if(isDisplay && panel && show){
      var hasMorning = panel.querySelectorAll('.avail-half.on').length > 0;
      show.textContent = hasMorning
        ? 'Show 9am – 3pm · has times'
        : 'Show 9am – 3pm · no times';
      if(hide) hide.textContent = 'Hide 9am – 3pm';
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

})();
