(function(global){
  'use strict';

  var MARK_RE = /\[\s*(\d+)\s*marks?\s*\]/gi;
  var DIFF_TAIL = /\s+(SF|CF|CU\+?|CU)\s*(?=[a-e]\s*$|$)/gi;
  var SUBPART_LINE = /^[a-e]\)\s*/i;
  var MINUS = '[-\u2212\u2013\uFF0D−]';
  var MATH_ITALIC = /[\u{1D400}-\u{1D7FF}]/gu;

  function mathAlphanumericToAscii(ch){
    var cp = ch.codePointAt(0);
    if(cp >= 0x1D434 && cp <= 0x1D44D) return String.fromCharCode(cp - 0x1D434 + 65);
    if(cp >= 0x1D44E && cp <= 0x1D467) return String.fromCharCode(cp - 0x1D44E + 97);
    if(cp >= 0x1D468 && cp <= 0x1D481) return String.fromCharCode(cp - 0x1D468 + 97);
    return ch;
  }

  function normalizePdfGlyphs(s){
    s = s.replace(/\u0DAD/g, '\\sqrt{');
    s = s.replace(/[\uFFFD\uF8F0-\uF8FF]/g, ' ');
    s = s.replace(MATH_ITALIC, mathAlphanumericToAscii);
    s = s.replace(/([A-Za-z])\1+(?=\()/g, '$1');
    s = s.replace(/\(([a-z])\1+\)/gi, '($1)');
    s = s.replace(/\b(d){4}\b/gi, 'dM/dt');
    s = s.replace(/Determine\s+(?:if\s+)?dM\/dt\s+if/gi, 'Determine \\frac{dM}{dt} if');
    s = s.replace(/≤/g, '\\le ').replace(/≥/g, '\\ge ');
    s = s.replace(/′/g, "'");
    return s;
  }

  function stripExamAnswerLines(s){
    s = s.replace(/_{5,}/g, ' ');
    s = s.replace(/—\s*Public use\s*—/gi, ' ');
    s = s.replace(/\bPublic use\b/gi, ' ');
    return s;
  }

  function dedupeRepeatedBlocks(s){
    var chunk = s.slice(0, 220);
    if(chunk.length >= 80){
      var idx = s.indexOf(chunk, chunk.length);
      if(idx > 40 && idx < chunk.length + 30) return s.slice(0, idx).trim();
    }
    var len;
    for(len = 200; len >= 90; len -= 15){
      var start = s.slice(0, len).trim();
      if(start.length < 90) continue;
      var at = s.indexOf(start, Math.max(40, start.length - 10));
      if(at > 40 && at < start.length + 50) return s.slice(0, at).trim();
    }
    return s;
  }

  function repairDrugBloodstream(s){
    if(!/drug in the bloodstream/i.test(s)) return s;
    if(!/maximum amount of the drug/i.test(s)) return s;
    return 'QUESTION 18 (5 marks)\n' +
      'The amount of a certain drug in the bloodstream, [[INLINE:M]] (mg), at any time [[INLINE:t]] (hours) is modelled closely by [[INLINE:M(t)=Ate^{-bt}]], where [[INLINE:A]] and [[INLINE:b]] are parameters.\n' +
      'a) Determine the exact values of [[INLINE:A]] and [[INLINE:b]] if the maximum amount of the drug in the bloodstream was 120 mg at [[INLINE:t=2]] hours. [[MARK:3]]\n' +
      'b) Evaluate the reasonableness of your solution. [[MARK:2]]';
  }

  function repairRabbitsFoxesQuestion(s){
    if(!/Rabbits and foxes/i.test(s) || !/Jane believes/i.test(s)) return s;
    s = s.replace(
      /trigonometric functions\.\s*[\s\S]*?(?=Jane believes)/i,
      'trigonometric functions.\n\n' +
      '[[DISPLAY:\\begin{array}{l}' +
      '\\text{Foxes }F(t)\\text{ (thousands): }(0,14.5),\\,(3,11),\\,(6,7.5),\\,(9,7),\\,(12,14.5),\\,(15,11)\\\\' +
      '\\text{Rabbits }R(t)\\text{ (thousands): }(0,9),\\,(6,7.5),\\,(9,7),\\,(12,14.5),\\,(15,11)' +
      '\\end{array}]]\n\n'
    );
    return s;
  }

  function flattenExamStem(s){
    s = s.replace(/\u200b/g, '').replace(/\ufeff/g, '').replace(/\xa0/g, ' ');
    s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
    var lines = s.split('\n');
    var out = [];
    var buf = [];
    function flush(){
      if(buf.length){ out.push(buf.join(' ')); buf = []; }
    }
    lines.forEach(function(line){
      var t = line.trim();
      if(!t){ flush(); return; }
      if(/^QUESTION\s+\d+/i.test(t)){ flush(); out.push(t); return; }
      if(SUBPART_LINE.test(t)){ flush(); out.push(t); return; }
      if(/^a\)\s/i.test(t)){ flush(); out.push(t); return; }
      if(/^[−-]?\d+(\.\d+)?$/.test(t)){ flush(); out.push(t); return; }
      if(/^[dD]{1,4}$/.test(t) || /^1$/.test(t)){ flush(); out.push(t); return; }
      if(/∫|ට|\\sqrt|frac\{dM\}/i.test(t)){ flush(); out.push(t); return; }
      if(t.length <= 14 && !/^[A-Z][a-z]{4,}/.test(t)) buf.push(t);
      else { flush(); out.push(t); }
    });
    flush();
    s = out.join('\n');
    s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
    return s.trim();
  }

  function stripDifficultyTags(s){
    s = s.replace(/\s+(SF|CF|CU\+?|CU)\s+([a-e])\s*\)?\s*$/i, '');
    s = s.replace(DIFF_TAIL, ' ');
    s = s.replace(/\s+(SF|CF|CU\+?|CU)\s*$/i, '');
    s = s.replace(/\s+([a-e])\)?\s*$/i, '');
    return s.trim();
  }

  function expressionToLatex(expr){
    var s = String(expr || '').trim();
    if(!s) return '';
    s = s.replace(/\u2212/g, '-').replace(/–/g, '-').replace(/−/g, '-');
    s = s.replace(/\b([fgh])\s*[′']\s*\(\s*x\s*\)/gi, "$1'(x)");
    s = s.replace(/\b([fgh])\s*\(\s*x\s*\)/gi, '$1(x)');
    s = s.replace(/\bcos\s*\(/gi, '\\cos(');
    s = s.replace(/\bsin\s*\(/gi, '\\sin(');
    s = s.replace(/\btan\s*\(/gi, '\\tan(');
    s = s.replace(/log10/gi, '\\log_{10}');
    s = s.replace(/log2/gi, '\\log_{2}');
    s = s.replace(/\bln\b/g, '\\ln');
    s = s.replace(/√\s*(\d+)/g, '\\sqrt{$1}');
    s = s.replace(/√/g, '\\sqrt{}');
    s = s.replace(/π/g, '\\pi');
    s = s.replace(/(\d+)\s*\\pi\s+(\d+)/g, '\\frac{$1\\pi}{$2}');
    s = s.replace(/(\d+)\s*pi\s+(\d+)/gi, '\\frac{$1\\pi}{$2}');
    s = s.replace(/t\s*=\s*(\d+)\s*\\pi\s*\/?\s*(\d*)/gi, function(_, a, b){
      return b ? 't=\\frac{' + a + '\\pi}{' + b + '}' : 't=' + a + '\\pi';
    });
    s = s.replace(/∈\s*R/gi, '\\in \\mathbb{R}');
    s = s.replace(/∈/g, '\\in ');
    s = s.replace(/×/g, '\\times ');
    s = s.replace(/÷/g, '\\div ');
    s = s.replace(/\bx\s+(\d+)\s+(\d+)\b/g, 'x^{\\frac{$1}{$2}}');
    s = s.replace(/(\d+)\s*\/\s*(\d+)/g, '\\frac{$1}{$2}');
    s = s.replace(/\s+/g, ' ');
    return s;
  }

  function wrapInline(tex){
    return '[[INLINE:' + tex + ']]';
  }

  function mathifyLogExpressions(s){
    var logChunk = '(-?\\d*\\s*log10\\s+\\d+(?:\\s*' + MINUS + '+\\s*(?:\\d+\\s*log10\\s+\\d+|-?\\s*log10\\s+\\d+|\\d+))*)';
    s = s.replace(new RegExp(logChunk, 'gi'), function(m){
      return wrapInline(expressionToLatex(m));
    });
    var log2Chunk = '(-?\\d*\\s*log2\\s+(?:√\\s*\\d+|\\d+)(?:\\s*' + MINUS + '+\\s*(?:\\d+\\s*log2\\s+(?:√\\s*\\d+|\\d+)|log2\\s+(?:√\\s*\\d+|\\d+)|\\d+))*)';
    s = s.replace(new RegExp(log2Chunk, 'gi'), function(m){
      return wrapInline(expressionToLatex(m));
    });
    return s;
  }

  function mathifyPlainSegment(s){
    if(!s || !s.trim()) return s;
    if(/\[\[(?:INLINE|DISPLAY):/.test(s)) return s;
    s = mathifyLogExpressions(s);
    s = s.replace(/(:\s*)(-?\d*\s*log[\s\S]*?)(?=\n[a-e]\)|$)/i, function(_, colon, math){
      return colon + wrapInline(expressionToLatex(math));
    });
    s = s.replace(/(\b[xy]\s*=\s*[^.;\n]+(?:\s+and\s+[xy]\s*=\s*[^.;\n]+)?)/gi, function(m){
      return wrapInline(expressionToLatex(m));
    });
    s = s.replace(/(\bf\s*\(\s*x\s*\)\s*=\s*[^.;\n]+)/gi, function(m){
      return wrapInline(expressionToLatex(m));
    });
    s = s.replace(/(\bg\s*\(\s*x\s*\)\s*=\s*[^.;\n]+)/gi, function(m){
      return wrapInline(expressionToLatex(m));
    });
    s = s.replace(/(\bh\s*\(\s*x\s*\)\s*=\s*[^.;\n]+)/gi, function(m){
      return wrapInline(expressionToLatex(m));
    });
    s = s.replace(/(\bf\s*[′']\s*\(\s*x\s*\)\s*=\s*[^.;\n]+)/gi, function(m){
      return wrapInline(expressionToLatex(m));
    });
    s = s.replace(/(\d+\s*cos\s*\([^)]+\))/gi, function(m){ return wrapInline(expressionToLatex(m)); });
    s = s.replace(/(\d+\s*sin\s*\([^)]+\))/gi, function(m){ return wrapInline(expressionToLatex(m)); });
    s = s.replace(/(\b[NM]\s*'\s*\(\s*\d+\s*\))/gi, function(m){ return wrapInline(expressionToLatex(m)); });
    s = s.replace(/(\b[NM]\s*\(\s*[a-z]\s*\)\s*=\s*[^.;\n]+)/gi, function(m){ return wrapInline(expressionToLatex(m)); });
    s = s.replace(/(\b[NM]\s*'\s*\(\s*[a-z]\s*\))/gi, function(m){ return wrapInline(expressionToLatex(m)); });
    s = s.replace(/(0\s*\\le\s*t\s*\\le\s*8|0\s*≤\s*t\s*≤\s*8)/gi, function(m){ return wrapInline(expressionToLatex(m)); });
    return s;
  }

  function mathifyPlainText(s){
    if(!s) return s;
    if(s.indexOf('[[DISPLAY:') >= 0 && s.indexOf('[[INLINE:') < 0){
      return mathifyPlainSegment(s);
    }
    if(s.indexOf('[[INLINE:') < 0 && s.indexOf('[[DISPLAY:') < 0){
      return mathifyPlainSegment(s);
    }
    return s.split(/(\[\[(?:INLINE|DISPLAY):[\s\S]*?\]\])/).map(function(part){
      if(/^\[\[(?:INLINE|DISPLAY):/.test(part)) return part;
      return mathifyPlainSegment(part);
    }).join('');
  }

  function splitLooseSubparts(body){
    body = body.replace(/\s([a-e])\)\s+/gi, '\n$1) ');
    body = body.replace(/\s([a-e])\s+(?=[fgh]\s*[′'(])/gi, '\n$1) ');
    body = body.replace(/\s([a-e])\s+(?=(?:\d+\s*)?log\d)/gi, '\n$1) ');
    body = body.replace(/\s([a-e])\s+(?=\d+\s*log)/gi, '\n$1) ');
    body = body.replace(/\s([a-e])\s+(?=Find|Show|Prove|Evaluate|Determine|Sketch|Hence|Write|Simplify|Verify|State|Using)\b/gi, '\n$1) ');
    body = body.replace(/(\[\[MARK:\d+\]\])\s*([a-e])\)\s*/gi, '$1\n$2) ');
    return body;
  }

  function repairCustomerQueueQuestion(s){
    if(!/customers.*served|total number of customers/i.test(s)) return s;
    if(!/16\s*\+\s*3\s*t|16\+3t|𝑀|𝑁|\bM\s*\(\s*t\s*\)|\bN\s*\(\s*t\s*\)/i.test(s)) return s;
    return 'QUESTION 13 (6 marks)\n' +
      'a) Determine [[INLINE:\\frac{dM}{dt}]] if [[INLINE:M(t)=\\frac{1}{\\sqrt{16+3t^2}}]] [[MARK:2]]\n' +
      'Let [[INLINE:N(t)=\\int_{-3/2}^{t} 1800t(16+3t^2)^{-3/2}\\,dt]]\n' +
      'b) Using the result from 13a), determine [[INLINE:N(t)]] [[MARK:1]]\n' +
      'c) Determine [[INLINE:N\'(4)]] [[MARK:1]]\n' +
      'The function [[INLINE:N(t)]] models the total number of customers served by staff after [[INLINE:t]] hours during an 8-hour workday ([[INLINE:0 \\le t \\le 8]]). At time [[INLINE:t=0]], no customers had been served.\n' +
      'd) Determine [[INLINE:N(4)]] [[MARK:2]]';
  }

  function repairMcComplexRoots(s){
    if(!/solution of the equation z/i.test(s) || !/other solution/i.test(s)) return s;
    return 'QUESTION 1\n' +
      'A solution of the equation [[INLINE:z^2 = ai]] where [[INLINE:a \\in \\mathbb{R}]] is [[INLINE:z = -2 - 2i]].\n' +
      'The other solution is\n' +
      '(A) [[INLINE:-8i]] (B) [[INLINE:-2+2i]] (C) [[INLINE:2+2i]] (D) [[INLINE:8i]]';
  }

  function repairMcNetballMatrix(s){
    if(!/netball/i.test(s) || !/\bM\s*=/.test(s)) return s;
    return 'QUESTION 2\n' +
      'The win/draw/loss results after a netball competition involving five teams is represented in matrix [[INLINE:M]].\n\n' +
      '[[DISPLAY:M=\\begin{pmatrix}0&1&2&0&2\\\\1&0&0&1&1\\\\0&2&0&0&0\\\\2&1&2&0&2\\\\0&1&2&0&0\\end{pmatrix}\\quad\\text{(rows/cols P,Q,R,S,T)}]]\n\n' +
      'Key: Team P drew with Team Q, defeated Team R and Team T, and lost to Team S.\n' +
      'The model [[INLINE:M + M^2 + M^3]] is used to rank the teams. The final positions from first to fifth are\n' +
      '(A) S, Q, P, R, T (B) S, Q, P, T, R (C) S, P, Q, T, R (D) S, P, Q, R, T';
  }

  function repairMcDiffEquation(s){
    if(!/differential equation/i.test(s) || !/cos\s*\(\s*2\s*x\s*\)/i.test(s)) return s;
    return 'QUESTION 3\n' +
      'Determine the solution of the differential equation [[INLINE:\\frac{dy}{dx} = \\frac{\\sin(2x)}{\\cos(2x)}]] given [[INLINE:y=0]] when [[INLINE:x=\\frac{\\pi}{5}]].\n' +
      '(A) [[INLINE:y = -2\\ln|\\cos(2x)| - 2.35]] (B) [[INLINE:y = -2\\ln|\\cos(2x)| + 2.35]] ' +
      '(C) [[INLINE:y = -\\tfrac{1}{2}\\ln|\\cos(2x)| - 0.59]] (D) [[INLINE:y = -\\tfrac{1}{2}\\ln|\\cos(2x)| + 0.59]]';
  }

  function cleanMcArtifacts(s){
    s = s.replace(/^[\d]{1,2}\s*\n+/m, '');
    s = s.replace(/[\uE000-\uF8FF\uFFFD\uF000-\uF0FF]/g, ' ');
    s = s.replace(/\s+\(\s*$/gm, '');
    s = s.replace(/\bz\s*2\s*=/gi, 'z^2 =');
    s = s.replace(/∈\s*,\s*R/gi, '\\in \\mathbb{R}');
    s = s.replace(/(\bM)\s*2\b/g, '$1^2');
    s = s.replace(/(\bM)\s*3\b/g, '$1^3');
    s = s.replace(/π\s*Determine/gi, '\nDetermine');
    s = s.replace(/x\s*=\s*\.\s*$/gm, 'x = \\frac{\\pi}{5}');
    s = s.replace(/\s+1\s*\(([C-D])\)/g, ' ($1)');
    s = s.replace(/\s+2\s*\(([C-D])\)/g, ' ($1)');
    return s;
  }

  function splitMcBundle(s){
    s = String(s || '').trim();
    s = s.replace(/^\d{1,2}\s*\n+/, '');
    var parts = s.split(/(?=QUESTION\s+\d+\b)/i).map(function(p){ return p.trim(); }).filter(Boolean);
    if(parts.length <= 1) return [s];
    return parts.filter(function(p){ return p.length >= 35; });
  }

  function resolveMcStem(raw, bankId, excludeDisplayId, usedIds){
    var parts = splitMcBundle(raw);
    if(parts.length <= 1){
      return { text: parts[0] || raw, displayId: bankId };
    }
    var candidates = parts.map(function(p, i){
      var qm = p.match(/^QUESTION\s+(\d+)/i);
      var n = qm ? qm[1] : String(i + 1);
      return { text: p, displayId: bankId + '#Q' + n };
    });
    var used = usedIds || [];
    var avail = candidates.filter(function(c){
      return c.displayId !== excludeDisplayId && used.indexOf(c.displayId) < 0;
    });
    if(!avail.length){
      avail = candidates.filter(function(c){ return c.displayId !== excludeDisplayId; });
    }
    if(!avail.length) avail = candidates;
    return avail[Math.floor(Math.random() * avail.length)];
  }

  function prepareMcStem(s){
    s = normalizePdfGlyphs(s);
    s = cleanMcArtifacts(s);
    s = stripExamAnswerLines(s);
    s = repairMcComplexRoots(s);
    s = repairMcNetballMatrix(s);
    s = repairMcDiffEquation(s);
    s = flattenExamStem(s);
    s = marksToTokens(s);
    s = mathifyStem(s);
    s = s.split('\n').map(function(line){ return line.replace(/[ \t]+/g, ' ').trim(); }).filter(Boolean).join('\n');
    return s.trim();
  }

  function repairPercentilePdf(s){
    if(!/36th percentile/i.test(s) || !/probability density/i.test(s)) return s;
    if(!/2\s*x\s*[−-]\s*2|2x-2/i.test(s)) return s;
    return 'QUESTION 18 (4 marks)\n' +
      'A percentile is a measure in statistics showing the value below which a given percentage of observations occur.\n' +
      'The continuous random variable X has the probability density function\n\n' +
      '[[DISPLAY:f(x)=\\begin{cases}2x-2, & 1 \\le x \\le 2 \\\\ 0, & \\text{otherwise}\\end{cases}]]\n\n' +
      'Determine the 36th percentile of X.';
  }

  function repairPiecewisePdfNoise(s){
    s = s.replace(/[]/g, ' ');
    s = s.replace(/f\s*\(\s*x\s*\)\s*=\s*[\s]*2\s*x\s*[−-]\s*2,\s*1\s*[≤<=]\s*x\s*[≤<=]\s*2\s*0\s*,?\s*otherwise/gi,
      '[[DISPLAY:f(x)=\\begin{cases}2x-2, & 1 \\le x \\le 2 \\\\ 0, & \\text{otherwise}\\end{cases}]]');
    return s;
  }

  function normalizeStemStructure(s){
    s = stripDifficultyTags(s);
    if(/^(\d{1,3})\s+/.test(s) && !/^QUESTION\s/i.test(s)){
      s = s.replace(/^(\d{1,3})\s+/, '[[QNUM:$1]]\n');
    }
    s = splitLooseSubparts(s);
    s = s.replace(/\n([a-e])\s*$/i, '\n$1) ');
    return s;
  }

  function normFuncs(s){
    s = s.replace(/\b([fgh])\s*\(\s*x\s*\)/gi, '$1(x)');
    s = s.replace(/\b([fgh])'\s*\(\s*x\s*\)/gi, "$1'(x)");
    s = s.replace(/\(\s*\)\s*'\s*([fgh])\s+([ex])\b/gi, "$1'($2)");
    return s;
  }

  function repairExamMath(s){
    s = normFuncs(s);
    s = repairCustomerQueueQuestion(s);
    s = repairDrugBloodstream(s);
    s = repairRabbitsFoxesQuestion(s);
    s = repairPercentilePdf(s);
    s = repairPiecewisePdfNoise(s);
    s = s.replace(/Determine the derivative of\s*\(\s*\)\s*2\s*1\s*3\s*\+\s*=\s*x\s+f\s+x\s+e\b/gi,
      'Determine the derivative of [[INLINE:f(x)=3e^{2x+1}]]');
    s = s.replace(/Determine the derivative of\s+f\s*\(\s*x\s*\)\s*=\s*3\s*e\s*2\s*x\s*\+\s*1/gi,
      'Determine the derivative of [[INLINE:f(x)=3e^{2x+1}]]');
    s = s.replace(/Given that\s*\(\s*\)\s*\(\s*\)\s*ln\s*=\s*x\s+g\s+x\s+x\b/gi,
      'Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]]');
    s = s.replace(/Given that\s+g\s*\(\s*x\s*\)\s*=\s*ln\s*\(\s*x\s*\)\s*\/\s*x/gi,
      'Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]]');
    s = s.replace(/determine the simplest value of\s+g\s*[′']\s*\(\s*e\s*\)\s*\.?/gi,
      "determine the simplest value of [[INLINE:g'(e)]].");
    s = s.replace(/\[\[MARK:1\]\]\s*ln\s*\(\s*x\s*\)\s*b\)\s*Given that\s+g\s*\(\s*x\s*\)\s*=\s*,/gi,
      "[[MARK:1]] b) Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]],");
    s = s.replace(/ln\s*\(\s*x\s*\)\s*b\)\s*Given that\s+g\s*\(\s*x\s*\)\s*=\s*,/gi,
      "b) Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]],");
    s = s.replace(/\s+x\s+c\)\s/gi, ' c) ');
    s = s.replace(/Determine the second derivative of\s*\(\s*\)\s*\(\s*\)\s*sin\s*=\s*x\s+h\s+x\s+x\b/gi,
      'Determine the second derivative of [[INLINE:h(x)=x\\sin x]]');
    s = s.replace(/Determine the second derivative of\s+h\s*\(\s*x\s*\)\s*=\s*x\s*sin\s*\(\s*x\s*\)/gi,
      'Determine the second derivative of [[INLINE:h(x)=x\\sin x]]');
    return s;
  }

  function mathifyStem(s){
    s = normalizeStemStructure(s);
    s = repairExamMath(s);
    var lines = s.split('\n');
    s = lines.map(function(line){
      line = line.trim();
      if(!line) return '';
      if(/^\[\[QNUM:/.test(line) || /^QUESTION\s/i.test(line)) return line;
      if(SUBPART_LINE.test(line)){
        var m = line.match(/^([a-e]\))\s*(.*)$/i);
        if(!m) return mathifyPlainText(line);
        var rest = m[2].trim();
        if(!rest || rest.length < 2) return line;
        return m[1] + ' ' + mathifyPlainText(rest);
      }
      return mathifyPlainText(line);
    }).filter(Boolean).join('\n');
    return s;
  }

  function isMathBroken(s){
    if(/\(\s*\)\s*[\d\+\s]{2,}\s*=\s*x\s+f\s+x/i.test(s)) return true;
    if(/\(\s*\)\s*\(\s*\)\s*ln\s*=\s*x/i.test(s)) return true;
    if(/\(\s*\)\s*\(\s*\)\s*sin\s*=\s*x/i.test(s)) return true;
    if((s.match(/\( \)/g) || []).length >= 2) return true;
    return false;
  }

  function marksToTokens(s){
    return s.replace(MARK_RE, ' [[MARK:$1]] ');
  }

  function prepareExamStem(s){
    s = normalizePdfGlyphs(s);
    s = stripExamAnswerLines(s);
    s = dedupeRepeatedBlocks(s);
    s = flattenExamStem(s);
    s = marksToTokens(s);
    s = mathifyStem(s);
    s = s.split('\n').map(function(line){ return line.replace(/[ \t]+/g, ' ').trim(); }).filter(Boolean).join('\n');
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
  }

  global.VaiEaStemMath = {
    flattenExamStem: flattenExamStem,
    repairExamMath: repairExamMath,
    isMathBroken: isMathBroken,
    prepareExamStem: prepareExamStem,
    mathifyStem: mathifyStem,
    mathifyPlainText: mathifyPlainText,
    expressionToLatex: expressionToLatex,
    normalizeStemStructure: normalizeStemStructure,
    normalizePdfGlyphs: normalizePdfGlyphs,
    repairCustomerQueueQuestion: repairCustomerQueueQuestion,
    repairPercentilePdf: repairPercentilePdf,
    splitMcBundle: splitMcBundle,
    resolveMcStem: resolveMcStem,
    prepareMcStem: prepareMcStem,
    cleanMcArtifacts: cleanMcArtifacts
  };
})(typeof window !== 'undefined' ? window : this);
