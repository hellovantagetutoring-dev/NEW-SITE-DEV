(function(global){
  'use strict';

  var syllabus = global.VaiEaSyllabus;
  if(!syllabus) return;

  function pillCheckbox(name, value, label, extraClass, checked){
    return '<label class="vai-toggle-pill' + (extraClass ? ' ' + extraClass : '') + '">' +
      '<input type="checkbox" name="' + name + '" value="' + value + '"' +
      (checked ? ' checked' : '') + '>' +
      '<span>' + label + '</span></label>';
  }

  function pillRadio(name, value, label, checked){
    return '<label class="vai-toggle-pill vai-toggle-pill--radio">' +
      '<input type="radio" name="' + name + '" value="' + value + '"' +
      (checked ? ' checked' : '') + '>' +
      '<span>' + label + '</span></label>';
  }

  function shortTopicTitle(title){
    return title.replace(/^Topic \d+: /, '');
  }

  function buildTopicFilters(container, subject){
    if(!container) return;
    var data = subject === 'specialist' ? syllabus.specialist : syllabus.methods;
    var html = '';
    ['unit3', 'unit4'].forEach(function(uk){
      var u = data[uk];
      html += '<div class="vai-filter-unit"><p class="vai-filter-unit-title">' + u.title + '</p><div class="vai-toggle-grid">';
      u.topics.forEach(function(t){
        html += pillCheckbox('vai_topic', t.id, shortTopicTitle(t.title), 'vai-toggle-pill--topic', false);
      });
      html += '</div></div>';
    });
    html += '<div class="vai-filter-unit"><p class="vai-filter-unit-title">' + data.cuplus.title + '</p><div class="vai-toggle-grid">';
    html += pillCheckbox('vai_topic', data.cuplus.id, 'CU+ mixed', 'vai-toggle-pill--cuplus', false);
    html += '</div></div>';
    container.innerHTML = html;
  }

  function buildStaticPills(){
    var diffHost = document.getElementById('vaiFilterDiff');
    if(diffHost){
      diffHost.innerHTML =
        pillCheckbox('vai_diff', 'sf', 'SF', '', true) +
        pillCheckbox('vai_diff', 'cf', 'CF', '', true) +
        pillCheckbox('vai_diff', 'cu', 'CU', '', true) +
        pillCheckbox('vai_diff', 'cuplus', 'CU+', 'vai-toggle-pill--cuplus', false);
    }
    var yearHost = document.getElementById('vaiFilterYears');
    if(yearHost){
      yearHost.innerHTML = ['2020','2021','2022','2023'].map(function(y){
        return pillCheckbox('vai_year', y, y, '', false);
      }).join('');
    }
    var qtHost = document.getElementById('vaiFilterQtype');
    if(qtHost){
      qtHost.innerHTML =
        pillCheckbox('vai_qtype', 'response', 'Short response', '', false) +
        pillCheckbox('vai_qtype', 'mc', 'Multiple choice', '', false);
    }
    var sortHost = document.getElementById('vaiFilterSort');
    if(sortHost){
      sortHost.innerHTML =
        pillRadio('vai_gen_sort', 'syllabus', 'Syllabus', true) +
        pillRadio('vai_gen_sort', 'random', 'Random', false) +
        pillRadio('vai_gen_sort', 'hard', 'Harder first', false);
    }
  }

  function getCheckedValues(name){
    return Array.prototype.map.call(
      document.querySelectorAll('input[name="' + name + '"]:checked'),
      function(el){ return el.value; }
    );
  }

  function getMode(){
    var r = document.querySelector('input[name="vai_gen_mode"]:checked');
    return r ? r.value : 'past';
  }

  function syncModePanels(){
    var mode = getMode();
    var mockPanel = document.getElementById('vaiPanelMock');
    var aiPanel = document.getElementById('vaiPanelAi');
    if(mockPanel) mockPanel.hidden = mode !== 'past';
    if(aiPanel) aiPanel.hidden = mode !== 'ai';
    var badge = document.getElementById('vaiGenModeBadge');
    if(badge){
      badge.textContent = mode === 'past' ? 'Past exam paper' : 'AI generated';
      badge.className = 'vai-ea-badge vai-ea-badge--' + (mode === 'past' ? 'past' : mode);
    }
  }

  function readFilters(){
    var subjectEl = document.querySelector('input[name="vai_gen_subject"]:checked');
    var subject = subjectEl ? subjectEl.value : 'methods';
    var mode = getMode();
    var topics = getCheckedValues('vai_topic');
    var diffs = getCheckedValues('vai_diff');
    var years = getCheckedValues('vai_year');
    var qtypes = getCheckedValues('vai_qtype');
    var sortEl = document.querySelector('input[name="vai_gen_sort"]:checked');
    var sources;
    if(mode === 'past'){
      sources = ['mock'];
    }else{
      sources = ['textbook', 'synthetic'];
    }
    return {
      mode: mode,
      subject: subject,
      topics: topics,
      diffs: diffs.length ? diffs : ['sf', 'cf', 'cu', 'cuplus'],
      sources: sources,
      years: mode === 'past' ? years : [],
      qtypes: mode === 'past' ? qtypes : [],
      sort: sortEl ? sortEl.value : 'syllabus'
    };
  }

  function init(){
    var topicHost = document.getElementById('vaiFilterTopics');
    buildStaticPills();

    function refreshTopics(){
      var sub = document.querySelector('input[name="vai_gen_subject"]:checked');
      buildTopicFilters(topicHost, sub ? sub.value : 'methods');
    }

    document.querySelectorAll('input[name="vai_gen_subject"]').forEach(function(el){
      el.addEventListener('change', refreshTopics);
    });
    document.querySelectorAll('input[name="vai_gen_mode"]').forEach(function(el){
      el.addEventListener('change', syncModePanels);
    });

    refreshTopics();
    syncModePanels();

    global.VaiEaFilters = {
      read: readFilters,
      refreshTopics: refreshTopics,
      getMode: getMode,
      syncModePanels: syncModePanels
    };
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})(typeof window !== 'undefined' ? window : this);
