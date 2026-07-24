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

})();
