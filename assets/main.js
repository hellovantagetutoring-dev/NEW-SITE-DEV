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

  // Featured tutors marquee (homepage - photo tutors only)
  var marquee=document.getElementById('marquee');
  if(marquee){
    var tutors=[
      {name:'Jason',atar:'99.85',img:'/assets/tutors/jason-liu.jpg'},
      {name:'Yun',atar:'99.90',img:'/assets/tutors/yun-hao.jpg'},
      {name:'Lincoln',atar:'99.80',img:'/assets/tutors/lincoln-murray-brown.jpg'},
      {name:'Ishaan',atar:'99.90',img:'/assets/tutors/ishaan-tiwari.jpg'},
      {name:'Jerry',atar:'99.90',img:'/assets/tutors/jerry-zhang.jpg'},
      {name:'Keeran',atar:'99.50',img:'/assets/tutors/keeran-subendranathan.jpg'},
      {name:'Brooklyn',atar:'99.75',img:'/assets/tutors/brooklyn-tran.jpg'},
      {name:'Jize',atar:'99.85',img:'/assets/tutors/jize-peng.jpg'},
      {name:'Theo',atar:'99.30',img:'/assets/tutors/theo.jpg'},
      {name:'Ezekiel',atar:'99.85',img:'/assets/tutors/ezekiel-singh.jpg'}
    ];
    var html='';
    for(var i=0;i<tutors.length;i++){
      var t=tutors[i];
      html+='<a class="chip" href="/tutors"><img class="chip-av" src="'+t.img+'" alt="" width="56" height="56" loading="eager" decoding="async"><b>'+t.name+'</b><span class="score">'+t.atar+' ATAR</span></a>';
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
        if(subjectRoot) subjectRoot.scrollIntoView({behavior:'smooth', block:'center'});
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

  // Enquiry form routing (1-on-1 / masterclass / assignment review)
  (function(){
    var form = document.getElementById('contactForm');
    if(!form) return;

    var finish = document.getElementById('formFinish');
    var typeGrid = document.getElementById('enquiryTypeGrid');
    var routeMap = {
      '1-on-1 tutoring': 'routeTutoring',
      'Bring a friend (shared lessons)': 'routeTutoring',
      'Weekly subject masterclass': 'routeMasterclass',
      'Assignment review': 'routeAssignment'
    };
    var routePanelIds = ['routeTutoring', 'routeMasterclass', 'routeAssignment'];

    function isTutoringEnquiry(){
      return !!form.querySelector('input[name="enquiry_type"][value="1-on-1 tutoring"]:checked')
        || !!form.querySelector('input[name="enquiry_type"][value="Bring a friend (shared lessons)"]:checked');
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
      if(!wrap) return;
      var homeOn = !!form.querySelector('input[name="location[]"][value="In person (student\'s home)"]:checked');
      var tutoringOn = isTutoringEnquiry();
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
      var tutoringOn = isTutoringEnquiry();
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

    // Click-drag paint lives in shared handler below (contact + careers)
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

  // Click-drag to paint availability slots (enrol + careers)
  [].forEach.call(document.querySelectorAll('.avail-wrap'), function(wrap){
    if(wrap.classList.contains('avail-wrap--display')) return;
    var painting = false;
    var paintOn = true;
    var touchDragged = false;
    var touchStartX = 0;
    var touchStartY = 0;
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
      touchDragged = false;
      painting = true;
      paintOn = !input.checked;
      wrap.classList.add('is-painting');
      paint(cell);
    }, {passive:true});

    wrap.addEventListener('touchmove', function(e){
      if(!e.touches || !e.touches[0]) return;
      var dx = e.touches[0].clientX - touchStartX;
      var dy = e.touches[0].clientY - touchStartY;
      if(!touchDragged && (dx * dx + dy * dy) > TOUCH_DRAG_PX * TOUCH_DRAG_PX){
        touchDragged = true;
      }
      if(!touchDragged) return;
      var el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
      var cell = el && el.closest ? el.closest('.avail-cell') : null;
      if(!cell || !wrap.contains(cell)) return;
      paint(cell);
    }, {passive:true});

    wrap.addEventListener('touchend', function(){
      touchDragged = false;
      endPaint();
    });

    wrap.addEventListener('touchcancel', function(){
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

  // Venue + suburb service maps (contact + homepage)
  var mapNodes=document.querySelectorAll('[data-vt-map]');
  if(mapNodes.length && typeof L!=='undefined'){
    var venues=[
      {id:'slq',name:'State Library of Queensland',detail:'Preferred venue · South Bank',lat:-27.4714,lng:153.0185,query:'State+Library+of+Queensland+South+Bank',tab:'State Library'},
      {id:'uq',name:'University of Queensland',detail:'St Lucia campus',lat:-27.4975,lng:153.0137,query:'University+of+Queensland+St+Lucia',tab:'UQ St Lucia'},
      {id:'griffith',name:'Griffith University',detail:'Nathan campus',lat:-27.5537,lng:153.0546,query:'Griffith+University+Nathan',tab:'Griffith University'},
      {id:'garden',name:'Garden City',detail:'Upper Mount Gravatt',lat:-27.5636,lng:153.0825,query:'Westfield+Garden+City+Upper+Mount+Gravatt',tab:'Garden City'}
    ];
    var suburbs=[
      {name:'Ferny Grove',lat:-27.4028,lng:152.9282,query:'Ferny+Grove+QLD'},
      {name:'Ashgrove',lat:-27.4456,lng:152.9928,query:'Ashgrove+QLD'},
      {name:'Indooroopilly',lat:-27.5030,lng:152.9752,query:'Indooroopilly+QLD'},
      {name:'Mount Ommaney',lat:-27.5491,lng:152.9390,query:'Mount+Ommaney+QLD'},
      {name:'Carindale',lat:-27.5058,lng:153.1020,query:'Carindale+QLD'},
      {name:'Robertson',lat:-27.5666,lng:153.0563,query:'Robertson+QLD'},
      {name:'Rochedale',lat:-27.5702,lng:153.1269,query:'Rochedale+QLD'},
      {name:'Acacia Ridge',lat:-27.5858,lng:153.0261,query:'Acacia+Ridge+QLD'},
      {name:'Sunnybank Hills',lat:-27.5955,lng:153.0516,query:'Sunnybank+Hills+QLD'},
      {name:'Parkinson',lat:-27.6434,lng:153.0301,query:'Parkinson+QLD'},
      {name:'Browns Plains',lat:-27.6608,lng:153.0417,query:'Browns+Plains+QLD'}
    ];
    var lightTiles='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    var darkTiles='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    var preferDark=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var tileUrl=preferDark?darkTiles:lightTiles;
    var suburbList=suburbs.map(function(s){return s.name;}).join(', ');
    var ferny=null,browns=null;
    suburbs.forEach(function(s){
      if(s.name==='Ferny Grove') ferny=s;
      if(s.name==='Browns Plains') browns=s;
    });
    var serviceCenter=L.latLng(
      (ferny.lat+browns.lat)/2,
      (ferny.lng+browns.lng)/2
    );
    var serviceRadius=serviceCenter.distanceTo(L.latLng(ferny.lat,ferny.lng))+1000;

    [].forEach.call(mapNodes,function(el){
      var map=L.map(el,{
        scrollWheelZoom:false,
        attributionControl:true,
        zoomControl:true
      });
      L.tileLayer(tileUrl,{
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains:'abcd',
        maxZoom:19
      }).addTo(map);

      L.circle(serviceCenter,{
        radius:serviceRadius,
        color:'#6B4CE0',
        weight:1.5,
        opacity:.55,
        fillColor:'#E8B84B',
        fillOpacity:.12
      }).addTo(map).bindPopup('<strong>Home visits</strong><br>Service suburbs across greater Brisbane, including '+suburbList+'.<br>Online available anywhere.');

      var venueIcon=L.divIcon({
        className:'vt-pin vt-pin--venue',
        html:'<span></span>',
        iconSize:[14,14],
        iconAnchor:[7,7],
        popupAnchor:[0,-8]
      });
      var suburbIcon=L.divIcon({
        className:'vt-pin vt-pin--suburb',
        html:'<span></span>',
        iconSize:[11,11],
        iconAnchor:[5.5,5.5],
        popupAnchor:[0,-6]
      });
      var bounds=[];
      var venueMarkers={};
      venues.forEach(function(v){
        bounds.push([v.lat,v.lng]);
        var marker=L.marker([v.lat,v.lng],{icon:venueIcon})
          .addTo(map)
          .bindPopup(
            '<strong>'+v.name+'</strong><br>'+v.detail+
            '<br><a href="https://www.google.com/maps/search/?api=1&query='+v.query+'" target="_blank" rel="noopener">Open in Google Maps</a>'
          );
        venueMarkers[v.id]=marker;
      });
      suburbs.forEach(function(s){
        bounds.push([s.lat,s.lng]);
        L.marker([s.lat,s.lng],{icon:suburbIcon})
          .addTo(map)
          .bindPopup(
            '<strong>'+s.name+'</strong><br>Home-visit suburb'+
            '<br><a href="https://www.google.com/maps/search/?api=1&query='+s.query+'" target="_blank" rel="noopener">Open in Google Maps</a>'
          );
      });
      map.fitBounds(bounds,{padding:[24,24],maxZoom:11});

      var wrap=el.closest('[data-vt-map-wrap]');
      if(wrap){
        var titleEl=wrap.querySelector('[data-vt-title]');
        var detailEl=wrap.querySelector('[data-vt-detail]');
        var linkEl=wrap.querySelector('[data-vt-link]');
        var tabs=wrap.querySelectorAll('[data-vt-venue]');
        [].forEach.call(tabs,function(tab){
          tab.addEventListener('click',function(){
            var id=tab.getAttribute('data-vt-venue');
            [].forEach.call(tabs,function(t){
              t.classList.toggle('is-active',t===tab);
              t.setAttribute('aria-selected',t===tab?'true':'false');
            });
            if(id==='all'){
              map.fitBounds(bounds,{padding:[28,28],maxZoom:11});
              if(titleEl) titleEl.textContent='Brisbane service area';
              if(detailEl) detailEl.textContent='Meet-up venues plus home visits across '+suburbList+'. Online available anywhere.';
              if(linkEl) linkEl.href='https://www.google.com/maps/search/?api=1&query=Vantage+Tutoring+Brisbane';
              return;
            }
            var v=null;
            for(var i=0;i<venues.length;i++){ if(venues[i].id===id){ v=venues[i]; break; } }
            if(!v) return;
            map.setView([v.lat,v.lng],14,{animate:true});
            if(venueMarkers[id]) venueMarkers[id].openPopup();
            if(titleEl) titleEl.textContent=v.name;
            if(detailEl) detailEl.textContent=v.detail;
            if(linkEl) linkEl.href='https://www.google.com/maps/search/?api=1&query='+v.query;
          });
        });
      }

      setTimeout(function(){ map.invalidateSize(); },120);
      window.addEventListener('load',function(){ map.invalidateSize(); });
    });
  }

})();
