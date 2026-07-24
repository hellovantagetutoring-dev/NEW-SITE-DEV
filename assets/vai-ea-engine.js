(function(global){
  'use strict';

  var COPY_RE = [
    /Cambridge Senior Maths for Queensland[\s\S]*?party\./gi,
    /ISBN\s*978[\d\-Xx]+[\s\S]*?Press\.?/gi,
    /©\s*Evans et al\.[\s\S]*?party\./gi,
    /Photocopying is restricted[\s\S]*?party\./gi,
    /Cambridge University Press/gi,
    /Attach your barcode ID label here/gi,
    /Book of books used/gi,
    /of books used/gi,
    /LUI School code[\s\S]*?Family name/gi,
    /Question and response book[\s\S]*?(?=QUESTION\s+\d+|Question\s+\d+|$)/gi,
    /Multiple choice question book[\s\S]*?(?=\d{1,2}\s+[A-Za-z]|$)/gi,
    /Sample assessment\s+\d{4}[\s\S]*?(?=QUESTION\s+\d+|Question\s+\d+|\d{1,2}\s+[A-Za-z]|$)/gi,
    /External assessment\s+\d{4}/gi,
    /Time allowed\s*•[\s\S]*?Planning paper will not be marked\.?/gi,
    /General instructions\s*•[\s\S]*?(?=Section\s+\d|QUESTION\s+\d+|Question\s+\d+|$)/gi,
    /Section\s+\d+\s+Instructions\s*•[\s\S]*?(?=QUESTION\s+\d+|Question\s+\d+|\d{1,2}\s*\.|$)/gi,
    /Use a 2B pencil[\s\S]*?answer bubble[\s\S]*?/gi,
    /QCAA formula (?:book|sheet) provided\.?/gi,
    /DO NOT WRITE ON THIS PAGE[\s\S]*?/gi,
    /THIS PAGE WILL NOT BE MARKED[\s\S]*?/gi,
    /CONTINUE TO THE NEXT PAGE[\s\S]*?/gi,
    /Do not write outside this box\.?/gi,
    /margin trimmed off/gi,
    /_{5,}/g,
    /—\s*Public use\s*—/gi,
    /\s*—\s*Public use\s*—\s*/gi,
    /\bPublic use\b/gi
  ];

  var JUNK_MARKERS = [
    'question and response book',
    'multiple choice question book',
    'lui school code',
    'attach your barcode',
    'section 1 instructions',
    'use a 2b pencil',
    'general instructions',
    'planning paper will not be marked'
  ];

  var QUESTION_VERB = /\b(find|show|prove|evaluate|calculate|solve|which|determine|sketch|explain|write|simplify|expand|factor|differentiate|integrate|state|graph|given|let|hence|verify|identify|select|choose|true|false)\b/i;

  function stripExamFooters(s){
    var prev;
    do {
      prev = s;
      s = s.replace(/\s+\d{1,2}\s+of\s+\d{1,2}\s+DO NOT WRITE[\s\S]*?(?=(?:QUESTION|Question)\s+\d+|$)/gi, ' ');
      s = s.replace(/\s+\d{1,2}\s+of\s+\d{1,2}(?:\s+DO NOT WRITE[\s\S]*)?$/gi, ' ');
    } while (s !== prev);
    s = s.replace(/\s+END OF PAPER\s*/gi, ' ');
    s = s.replace(/(\s+\d{1,2}\s+of\s+\d{1,2})+/g, ' ');
    s = s.replace(/\s+Do not write outside this box\.?\s*/gi, ' ');
    return s;
  }

  function repairStemMath(s){
    s = s.replace(
      /defined over the interval\s*,\s*is uniformly distributed if its probability density function is defined by:\s*The expected value and variance of a uniform random variable X are\s*/gi,
      'defined over the interval [a, b], is uniformly distributed if its probability density function is defined by:\n\n' +
      '[[DISPLAY:f(x)=\\begin{cases}\\dfrac{1}{b-a}, & a \\le x \\le b \\\\ 0, & \\text{otherwise}\\end{cases}]]\n\n' +
      'The expected value and variance of a uniform random variable X are\n\n' +
      '[[DISPLAY:E(X)=\\dfrac{a+b}{2},\\quad \\mathrm{Var}(X)=\\dfrac{(b-a)^2}{12}.]]\n\n'
    );
    s = s.replace(/defined over the interval\s*,\s*is/gi, 'defined over the interval [a, b], is');
    s = s.replace(
      /probability density function is defined by:\s*(?=The expected value)/gi,
      'probability density function is defined by:\n\n[[DISPLAY:f(x)=\\dfrac{1}{b-a}\\ \\text{for}\\ a \\le x \\le b\\ \\text{(0 otherwise)}]]\n\n'
    );
    s = s.replace(
      /The continuous random variable X has the probability density function\s*[\s\S]*?Determine the 36th percentile of X\.?/gi,
      'The continuous random variable X has the probability density function\n\n' +
      '[[DISPLAY:f(x)=\\begin{cases}2x-2, & 1 \\le x \\le 2 \\\\ 0, & \\text{otherwise}\\end{cases}]]\n\n' +
      'Determine the 36th percentile of X.'
    );
    return s;
  }

  function esc(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function mathDisplayHtml(tex){
    return '<div class="vai-stem-math" role="img" aria-label="Formula">' +
      '<span class="vai-katex" data-katex="' + esc(tex) + '" data-display="1"></span></div>';
  }

  var SUBPART_LINE = /^[a-e]\)\s*/i;
  var SUBPART_SPLIT = /(?=\s*[a-e]\)\s)/i;
  var SUBPART_SPLIT_NL = /(?=\n[a-e]\)\s)/i;

  function renderInlineTokens(text){
    var html = '';
    var stemMath = global.VaiEaStemMath;
    if(stemMath) text = stemMath.mathifyPlainText(String(text || ''));
    var re = /\[\[(DISPLAY|INLINE):([\s\S]*?)\]\]|\[\[MARK:(\d+)\]\]/g;
    var last = 0;
    var m;
    while((m = re.exec(text)) !== null){
      if(m.index > last) html += esc(text.slice(last, m.index));
      if(m[1] === 'DISPLAY') html += mathDisplayHtml(m[2]);
      else if(m[1] === 'INLINE') html += mathInlineHtml(m[2]);
      else if(m[3]) html += '<span class="vai-stem-mark">' + esc(m[3] + ' mark' + (m[3] === '1' ? '' : 's')) + '</span>';
      last = re.lastIndex;
    }
    if(last < text.length) html += esc(text.slice(last));
    return html;
  }

  function paragraphHtml(chunk){
    chunk = chunk.trim();
    if(!chunk) return '';
    if(/\[\[DISPLAY:/.test(chunk)){
      var out = '';
      var re = /\[\[DISPLAY:([\s\S]*?)\]\]/g;
      var last = 0;
      var m;
      while((m = re.exec(chunk)) !== null){
        var before = chunk.slice(last, m.index).trim();
        if(before) out += '<p>' + renderInlineTokens(before) + '</p>';
        out += mathDisplayHtml(m[1]);
        last = re.lastIndex;
      }
      var tail = chunk.slice(last).trim();
      if(tail) out += '<p>' + renderInlineTokens(tail) + '</p>';
      return out;
    }
    return '<p>' + renderInlineTokens(chunk) + '</p>';
  }

  function mathInlineHtml(tex){
    return '<span class="vai-stem-inline-math vai-katex" data-katex="' + esc(tex) + '"></span>';
  }

  function isExamJunk(stem){
    if(!stem || stem.length < 40) return true;
    var low = stem.toLowerCase();
    var i;
    for(i = 0; i < JUNK_MARKERS.length; i++){
      if(low.indexOf(JUNK_MARKERS[i]) >= 0 && !QUESTION_VERB.test(stem)) return true;
    }
    if(/^(sample assessment|external assessment|section\s+\d+\s*\()/i.test(stem) && !QUESTION_VERB.test(stem)) return true;
    return false;
  }

  function formatExamStemHtml(text){
    var stemMath = global.VaiEaStemMath;
    text = stemMath ? stemMath.flattenExamStem(String(text || '')) : String(text || '');
    text = cleanStem(text);
    if(stemMath) text = stemMath.prepareExamStem(text);
    text = repairStemMath(text);
    if(isExamJunk(text) || (stemMath && stemMath.isMathBroken(text))){
      return '<p class="vai-stem-empty">Question text unavailable — try another question.</p>';
    }

    var head = '';
    var body = text;
    var qn = text.match(/^\[\[QNUM:(\d+)\]\]\s*\n?([\s\S]*)$/);
    if(qn){
      head = 'Question ' + qn[1];
      body = qn[2].trim();
    }
    var hm = !head && text.match(/^(QUESTION\s+\d+\s*\([^)]+\))\s*([\s\S]*)$/i);
    if(hm){
      head = hm[1];
      body = hm[2].trim();
    }

    var html = '';
    if(head) html += '<p class="vai-stem-heading">' + esc(head) + '</p>';

    var lines = body.split(/\n+/).map(function(l){ return l.trim(); }).filter(Boolean);
    var subparts = [];
    var lead = [];
    lines.forEach(function(line){
      if(SUBPART_LINE.test(line)) subparts.push(line);
      else if(subparts.length) subparts[subparts.length - 1] += ' ' + line;
      else lead.push(line);
    });

    if(!subparts.length){
      subparts = body.split(SUBPART_SPLIT).filter(function(p){ return p.trim(); });
      if(subparts.length <= 1){
        subparts = body.split(SUBPART_SPLIT_NL).filter(function(p){ return p.trim(); });
      }
      if(subparts.length > 1 || /^[a-e]\)/i.test(body)){
        lead = [];
      }else{
        subparts = [];
        lead = [body];
      }
    }

    if(lead.length){
      if(lead.some(function(l){ return /\[\[DISPLAY:/.test(l); })){
        lead.forEach(function(l){ html += paragraphHtml(l); });
      }else{
        html += paragraphHtml(lead.join(' '));
      }
    }

    if(subparts.length){
      subparts.forEach(function(sp){
        sp = sp.trim();
        var sm = sp.match(/^([a-e]\))\s*([\s\S]*)$/i);
        if(sm){
          var partBody = sm[2].trim();
          if(partBody.length < 2 && /^[a-e]\)$/i.test(sm[1])) return;
          html += '<p class="vai-stem-part"><span class="vai-stem-part-label">' + esc(sm[1]) + '</span> ' + renderInlineTokens(partBody) + '</p>';
        }else{
          html += paragraphHtml(sp);
        }
      });
      return html || paragraphHtml(body);
    }

    var blocks = body.split(/\n\n+/);
    if(blocks.length > 1){
      blocks.forEach(function(b){ html += paragraphHtml(b.trim()); });
      return html;
    }

    var scenario = body.match(/^([\s\S]*?)(\s+A manufacturer[\s\S]*)$/i);
    if(scenario && scenario[1].length > 40 && scenario[2].length > 30){
      html += paragraphHtml(scenario[1].trim());
      html += '<p class="vai-stem-scenario">' + esc(scenario[2].trim()) + '</p>';
      return html;
    }

    if(html) return html;
    return paragraphHtml(body);
  }

  function formatMcStemHtml(text){
    var stemMath = global.VaiEaStemMath;
    text = stemMath ? stemMath.flattenExamStem(String(text || '')) : String(text || '');
    text = cleanStem(text);
    if(stemMath && stemMath.prepareMcStem) text = stemMath.prepareMcStem(text);
    else if(stemMath) text = stemMath.prepareExamStem(text);
    text = repairStemMath(text);

    var hm = text.match(/^QUESTION\s+(\d+)\s*(?:\((\d+)\s*marks?\))?\s*\n?([\s\S]*)$/i);
    var head = hm ? 'Question ' + hm[1] + (hm[2] ? ' (' + hm[2] + ' marks)' : '') : '';
    var body = hm ? hm[3].trim() : text.trim();

    body = body.replace(/\s*QUESTION\s+\d+[\s\S]*$/i, '').trim();

    var optIdx = body.search(/\([A-D]\)/);
    if(optIdx < 0) return formatExamStemHtml(hm ? ('QUESTION ' + hm[1] + '\n' + body) : text);

    var prompt = body.slice(0, optIdx).trim();
    var optStr = body.slice(optIdx);
    var options = [];
    var re = /\(([A-D])\)\s*([\s\S]*?)(?=\([A-D]\)\s*|$)/gi;
    var m;
    while((m = re.exec(optStr)) !== null){
      var val = m[2].replace(/\s+\(\s*$/g, '').replace(/\s*QUESTION\s+\d+[\s\S]*$/i, '').trim();
      if(val) options.push({ label: m[1], val: val });
    }
    if(!options.length) return formatExamStemHtml(hm ? ('QUESTION ' + hm[1] + '\n' + body) : text);

    var html = '';
    if(head) html += '<p class="vai-stem-heading">' + esc(head) + '</p>';
    if(prompt) html += '<div class="vai-mc-prompt">' + paragraphHtml(prompt) + '</div>';
    html += '<ul class="vai-mc-options">';
    options.forEach(function(o){
      html += '<li class="vai-mc-option"><span class="vai-mc-label">' + esc(o.label) + '</span> ' +
        renderInlineTokens(o.val) + '</li>';
    });
    html += '</ul>';
    return html;
  }

  function cleanStem(text){
    var s = String(text || '');
    COPY_RE.forEach(function(re){ s = s.replace(re, ' '); });
    s = stripExamFooters(s);
    s = s.replace(/_{10,}/g, ' ');
    s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return s;
  }

  function stemFromText(text, qtype){
    if(qtype === 'mc') return formatMcStemHtml(text);
    return formatExamStemHtml(text);
  }

  function stemSliceRenderable(raw, qtype){
    var stemMath = global.VaiEaStemMath;
    if(qtype === 'mc' && stemMath && stemMath.splitMcBundle){
      var parts = stemMath.splitMcBundle(raw);
      if(parts.length > 1){
        for(var i = 0; i < parts.length; i++){
          if(stemIsRenderable(parts[i])) return true;
        }
        return false;
      }
    }
    return stemIsRenderable(raw);
  }

  function guideFromSteps(steps){
    if(!steps || !steps.length) return '';
    var n = 0;
    return steps.map(function(s){
      if(s.h) return '<p class="vai-sol-heading">' + esc(s.h) + '</p>';
      if(s.m || s.f){
        n += 1;
        var tex = s.f || s.m;
        var line = '<div class="vai-sol-math' + (s.f ? ' vai-sol-final' : '') + '">' +
          '<span class="vai-katex" data-katex="' + esc(tex) + '" data-display="1"></span></div>';
        var exp = s.e ? '<p class="vai-sol-exp">' + esc(s.e) + '</p>' : '';
        return '<div class="vai-sol-step"><span class="vai-sol-n">' + n + '</span><div class="vai-sol-body">' + line + exp + '</div></div>';
      }
      n += 1;
      var body = s.t === 'math-display'
        ? '<div class="vai-sol-math"><span class="vai-katex" data-katex="' + esc(s.v) + '" data-display="1"></span></div>'
        : s.t === 'math'
        ? '<span class="vai-katex" data-katex="' + esc(s.v) + '"></span>'
        : esc(s.v);
      return '<div class="vai-sol-step"><span class="vai-sol-n">' + n + '</span><div class="vai-sol-body">' + body + '</div></div>';
    }).join('');
  }

  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  var usedBySession = {};

  function sessionKey(filters){
    return JSON.stringify({
      s: filters.subject,
      t: (filters.topics || []).slice().sort().join(','),
      d: (filters.diffs || []).slice().sort().join(','),
      src: (filters.sources || []).slice().sort().join(','),
      y: (filters.years || []).slice().sort().join(','),
      q: (filters.qtypes || []).slice().sort().join(',')
    });
  }

  function matchesFilters(q, filters){
    if(q.subject !== filters.subject) return false;
    if(filters.topics && filters.topics.length){
      var okTopic = filters.topics.indexOf(q.topic) >= 0;
      if(!okTopic && q.topics){
        okTopic = q.topics.some(function(t){ return filters.topics.indexOf(t) >= 0; });
      }
      if(!okTopic) return false;
    }
    if(filters.diffs && filters.diffs.length && filters.diffs.indexOf(q.diff) < 0) return false;
    if(filters.sources && filters.sources.length && filters.sources.indexOf(q.source) < 0) return false;
    if(filters.years && filters.years.length && filters.years.indexOf(q.year) < 0) return false;
    if(filters.qtypes && filters.qtypes.length){
      var qt = q.qtype || 'response';
      if(filters.qtypes.indexOf(qt) < 0) return false;
    }
    return true;
  }

  function sortPool(pool, mode){
    var copy = pool.slice();
    if(mode === 'random'){
      for(var i = copy.length - 1; i > 0; i--){
        var j = Math.floor(Math.random() * (i + 1));
        var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
      }
      return copy;
    }
    if(mode === 'hard'){
      var rank = { cuplus: 0, cu: 1, cf: 2, sf: 3 };
      copy.sort(function(a, b){ return (rank[a.diff] || 2) - (rank[b.diff] || 2); });
    }
    return copy;
  }

  function vizFor(item, V){
    if(!V || !V.graphProjectile) return '';
    var v = item.viz || 'none';
    if(v === 'projectile') return V.graphProjectile(pick([40, 50, 60]), pick([30, 45, 60]));
    if(v === 'argand') return V.graphArgand([{re:pick([1,2,-1]), im:pick([1,2,-2]), label:'z'}]);
    if(v === 'vectors') return V.graphVectors([{x:3,y:2,label:'a'},{x:-1,y:4,label:'b'}]);
    if(v === 'matrix') return V.graphMatrixTransform(2, 1, 0, 1);
    if(v === 'exp') return V.graphExp(pick([2, 3]));
    if(v === 'trig') return V.graphTrig(pick([2, 3]));
    if(v === 'normal') return V.graphNormal(70, 8);
    if(v === 'area') return V.graphShaded(function(x){ return x*x; }, 0, 2, 0, 2.5);
    return '';
  }

  function stemIsRenderable(raw){
    var stemMath = global.VaiEaStemMath;
    var text = stemMath ? stemMath.flattenExamStem(String(raw || '')) : String(raw || '');
    text = cleanStem(text);
    if(stemMath) text = stemMath.prepareExamStem(text);
    text = repairStemMath(text);
    if(isExamJunk(text)) return false;
    if(stemMath && stemMath.isMathBroken(text)) return false;
    if(!/\([A-D]\)\s*[\w\[\-\\]/i.test(text) && /QUESTION\s+\d+/i.test(text) && text.length < 400){
      if(!/\bDetermine\b|\bFind\b|\bShow\b|\bsolution\b/i.test(text)) return false;
    }
    return true;
  }

  function pickFromBank(filters, sortMode, excludeId){
    var bank = global.VaiEaTextbookBank || [];
    var pool = bank.filter(function(q){
      return matchesFilters(q, filters) && stemSliceRenderable(q.stem, q.qtype);
    });
    if(!pool.length) return null;

    pool = sortPool(pool, sortMode || 'syllabus');
    var key = sessionKey(filters);
    var used = usedBySession[key] || [];
    var candidates = pool.filter(function(q){
      if(q.id === excludeId) return false;
      if(used.indexOf(q.id) >= 0) return false;
      if(q.qtype === 'mc' && excludeId && excludeId.indexOf(q.id + '#Q') === 0) return false;
      return true;
    });
    if(!candidates.length){
      usedBySession[key] = [];
      candidates = pool.filter(function(q){ return q.id !== excludeId; });
    }
    if(!candidates.length) return null;

    var item = pick(candidates);
    var stemMath = global.VaiEaStemMath;
    var resolved = { text: item.stem, displayId: item.id };
    if(item.qtype === 'mc' && stemMath && stemMath.resolveMcStem){
      resolved = stemMath.resolveMcStem(item.stem, item.id, excludeId, used);
    }
    usedBySession[key] = (usedBySession[key] || []).concat(resolved.displayId);
    if(usedBySession[key].length > 40) usedBySession[key] = usedBySession[key].slice(-40);

    var V = global.VaiEaViz || {};
    var steps = item.steps;
    if(global.VaiEaSolutions && global.VaiEaSolutions.forStem){
      var customSteps = global.VaiEaSolutions.forStem(resolved.text);
      if(customSteps && customSteps.length) steps = customSteps;
    }

    return {
      id: resolved.displayId,
      topicKey: item.topic,
      stem: stemFromText(resolved.text, item.qtype),
      guide: guideFromSteps(steps),
      marks: item.marks || '3 marks',
      tech: item.tech || 'Technology-free',
      parts: item.parts || '',
      graph: vizFor(item, V),
      source: item.source,
      year: item.year,
      diff: item.diff
    };
  }

  function typesetKatex(root){
    if(!global.katex || !root) return;
    root.querySelectorAll('.vai-katex').forEach(function(el){
      var tex = el.getAttribute('data-katex');
      if(!tex) return;
      try{
        global.katex.render(tex, el, {
          throwOnError: false,
          displayMode: el.getAttribute('data-display') === '1'
        });
      }catch(e){}
    });
  }

  global.VaiEaEngine = {
    pickFromBank: pickFromBank,
    typesetKatex: typesetKatex,
    cleanStem: cleanStem,
    esc: esc
  };
})(typeof window !== 'undefined' ? window : this);
