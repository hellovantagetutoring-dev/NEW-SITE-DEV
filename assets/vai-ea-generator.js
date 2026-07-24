(function(){
  'use strict';

  var engine = window.VaiEaEngine || {};
  var syllabus = window.VaiEaSyllabus || {};

  var btn = document.getElementById('vaiGenBtn');
  var btnAgain = document.getElementById('vaiGenAgain');
  var btnShowSol = document.getElementById('vaiGenShowSol');
  var out = document.getElementById('vaiGenOutput');
  var resultEl = document.getElementById('vaiGenResult');
  var solCol = document.getElementById('vaiGenSolCol');
  if(!btn || !out) return;

  var lastQuestionId = null;
  var pendingGuide = '';

  var subjectLabels = {
    methods: 'Mathematical Methods',
    specialist: 'Specialist Mathematics'
  };

  var diffLabels = {
    sf: 'SF · Simple familiar',
    cf: 'CF · Complex familiar',
    cu: 'CU · Complex unfamiliar',
    cuplus: 'CU+ · Cross-topic'
  };

  function typeset(root){ engine.typesetKatex && engine.typesetKatex(root); }

  function hideSolution(){
    if(solCol){
      solCol.classList.add('is-hidden');
      solCol.setAttribute('aria-hidden', 'true');
    }
    if(btnShowSol){
      btnShowSol.hidden = false;
      btnShowSol.textContent = 'Show worked solution';
    }
    var guideEl = document.getElementById('vaiGenGuide');
    if(guideEl) guideEl.innerHTML = '';
  }

  function render(data, subject, mode){
    var figEl = document.getElementById('vaiGenFigure');
    var stemEl = document.getElementById('vaiGenStem');
    var guideEl = document.getElementById('vaiGenGuide');
    var diffEl = document.getElementById('vaiGenDiff');
    var subEl = document.getElementById('vaiGenSubject');
    var title = syllabus.topicTitle ? syllabus.topicTitle(subject, data.topicKey) : data.topicKey;

    out.classList.remove('is-generating', 'is-empty');
    if(resultEl) resultEl.hidden = false;
    hideSolution();
    pendingGuide = data.guide || '';

    var modeBadge = document.getElementById('vaiGenModeBadge');
    if(modeBadge){
      modeBadge.textContent = mode === 'ai' ? 'AI generated' : 'Past exam paper';
      modeBadge.className = 'vai-ea-badge vai-ea-badge--' + (mode === 'ai' ? 'ai' : 'past');
    }

    document.getElementById('vaiGenSyllabus').textContent = title;
    if(subEl){
      subEl.textContent = subjectLabels[subject] || subject;
      subEl.className = 'vai-subject-pill vai-subject-pill--' + subject;
    }
    if(diffEl){
      var d = data.diff || 'cf';
      diffEl.textContent = diffLabels[d] || d.toUpperCase();
      diffEl.className = 'vai-diff-pill' + (d === 'cuplus' ? ' vai-diff-pill--cuplus' : '');
    }
    document.getElementById('vaiGenMarks').textContent = data.marks || '';
    document.getElementById('vaiGenTech').textContent = data.tech || '';
    document.getElementById('vaiGenParts').textContent = data.parts || '';

    if(figEl){
      if(data.graph){
        figEl.innerHTML = data.graph;
        figEl.hidden = false;
        figEl.setAttribute('aria-hidden', 'false');
        figEl.classList.remove('is-replay');
        void figEl.offsetWidth;
        figEl.classList.add('is-replay');
        typeset(figEl);
      }else{
        figEl.innerHTML = '';
        figEl.hidden = true;
        figEl.setAttribute('aria-hidden', 'true');
      }
    }

    stemEl.innerHTML = data.stem;
    typeset(stemEl);
    lastQuestionId = data.id || null;

    if(btnShowSol) btnShowSol.hidden = !data.guide;
  }

  function generate(excludeId){
    var filters = window.VaiEaFilters ? window.VaiEaFilters.read() : { subject: 'methods', diffs: ['sf'], sort: 'syllabus' };
    if(!filters.topics || !filters.topics.length){
      filters.topics = syllabus.allTopicIds ? syllabus.allTopicIds(filters.subject) : [];
    }
    return engine.pickFromBank(filters, filters.sort, excludeId || lastQuestionId);
  }

  function showNoMatch(){
    out.classList.remove('is-generating');
    out.classList.add('is-empty');
    if(resultEl) resultEl.hidden = true;
    var emptyEl = document.getElementById('vaiGenEmpty');
    if(emptyEl){
      emptyEl.innerHTML = '<p>No questions match these filters. Clear a topic, difficulty, year, or question-type filter — or switch between <strong>Past exam papers</strong> and <strong>AI generated</strong> — then generate again.</p>';
      emptyEl.setAttribute('aria-hidden', 'false');
    }
  }

  function runGenerate(){
    btn.disabled = true;
    if(btnAgain) btnAgain.disabled = true;
    var label = btn.querySelector('span');
    if(label) label.textContent = 'Generating…';
    out.classList.add('is-generating');
    window.setTimeout(function(){
      var data = generate(lastQuestionId);
      var filters = window.VaiEaFilters ? window.VaiEaFilters.read() : { subject: 'methods' };
      if(data) render(data, filters.subject, filters.mode);
      else showNoMatch();
      btn.disabled = false;
      if(btnAgain) btnAgain.disabled = false;
      if(label) label.textContent = 'Generate';
    }, 360);
  }

  btn.addEventListener('click', runGenerate);
  if(btnAgain) btnAgain.addEventListener('click', runGenerate);

  if(btnShowSol){
    btnShowSol.addEventListener('click', function(){
      if(!solCol) return;
      var nowHidden = solCol.classList.toggle('is-hidden');
      if(nowHidden){
        solCol.setAttribute('aria-hidden', 'true');
        btnShowSol.textContent = 'Show worked solution';
      }else{
        solCol.setAttribute('aria-hidden', 'false');
        btnShowSol.textContent = 'Hide worked solution';
        var guideEl = document.getElementById('vaiGenGuide');
        if(guideEl) guideEl.innerHTML = pendingGuide;
        typeset(solCol);
      }
    });
  }

})();
