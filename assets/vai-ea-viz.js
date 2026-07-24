(function(global){
  'use strict';

  function escAttr(s){
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  }

  function L(tex, display){
    return '<span class="vai-katex" data-katex="' + escAttr(tex) + '"' +
      (display ? ' data-display="1"' : '') + '></span>';
  }

  function svgWrap(w, h, inner, label, captionTex){
    return '<figure class="vai-figure-card">' +
      '<svg class="vai-figure-svg vai-figure-animate" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + escAttr(label) + '">' +
      inner + '</svg>' +
      (captionTex ? '<figcaption>' + L(captionTex, false) + '</figcaption>' : '') +
      '</figure>';
  }

  function axes(w, h, pad, ox, oy){
    ox = ox != null ? ox : pad;
    oy = oy != null ? oy : h - pad;
    return '<line class="vai-axis" x1="' + pad + '" y1="' + oy + '" x2="' + (w-pad) + '" y2="' + oy + '"/>' +
      '<line class="vai-axis" x1="' + ox + '" y1="' + pad + '" x2="' + ox + '" y2="' + (h-pad) + '"/>';
  }

  function pathFromFn(fn, x0, x1, n, mapX, mapY){
    var pts = [];
    for(var i = 0; i <= n; i++){
      var x = x0 + (x1 - x0) * i / n;
      var y = fn(x);
      var px = mapX(x);
      var py = mapY(y);
      pts.push((i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1));
    }
    return pts.join(' ');
  }

  function graphLog(k){
    var w = 340, h = 200, pad = 32;
    var xmin = 0.35, xmax = 4.2;
    var d = pathFromFn(function(x){ return Math.log(k * x); }, xmin, xmax, 90,
      function(x){ return pad + (x - xmin) / (xmax - xmin) * (w - 2 * pad); },
      function(y){ return h - pad - (y + 0.5) / 2.8 * (h - 2 * pad); }
    );
    return svgWrap(w, h, axes(w, h, pad) +
      '<path class="vai-draw-path" d="' + d + '" fill="none"/>',
      'Logarithmic graph', 'y=\\ln(' + k + 'x)');
  }

  function graphTrig(n){
    var w = 340, h = 200, pad = 32;
    var d = pathFromFn(function(x){ return Math.cos(n * x); }, 0, Math.PI, 100,
      function(x){ return pad + x / Math.PI * (w - 2 * pad); },
      function(y){ return h / 2 - y * (h / 2 - pad); }
    );
    return svgWrap(w, h,
      '<line class="vai-axis" x1="' + pad + '" y1="' + (h/2) + '" x2="' + (w-pad) + '" y2="' + (h/2) + '"/>' +
      '<path class="vai-draw-path" d="' + d + '" fill="none"/>',
      'Cosine graph', 'y=\\cos(' + n + 'x)\\text{ on }[0,\\pi]');
  }

  function graphExp(k){
    var w = 340, h = 200, pad = 32;
    var xmax = 2.2;
    var ymax = Math.exp(k * xmax);
    var d = pathFromFn(function(x){ return Math.exp(k * x); }, -0.2, xmax, 90,
      function(x){ return pad + (x + 0.2) / (xmax + 0.2) * (w - 2 * pad); },
      function(y){ return h - pad - (y - 1) / (ymax - 1) * (h - 2 * pad); }
    );
    return svgWrap(w, h, axes(w, h, pad) +
      '<path class="vai-draw-path" d="' + d + '" fill="none"/>',
      'Exponential graph', 'y=e^{' + k + 'x}');
  }

  function graphNormal(mu, sigma){
    var w = 340, h = 200, pad = 32;
    var zmin = -3.2, zmax = 3.2;
    var d = pathFromFn(function(z){ return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }, zmin, zmax, 100,
      function(z){ return pad + (z - zmin) / (zmax - zmin) * (w - 2 * pad); },
      function(y){ return h - pad - y / 0.42 * (h - 2 * pad); }
    );
    return svgWrap(w, h, axes(w, h, pad) +
      '<path class="vai-fill-path vai-draw-path" d="' + d + ' Z"/>',
      'Normal curve', '\\mathcal{N}(' + mu + ',\\,' + sigma + '^2)\\text{ reference}');
  }

  function graphArgand(points, extras){
    var w = 340, h = 200, pad = 36, cx = w/2, cy = h/2, scale = 28;
    var inner = axes(w, h, pad, cx, cy);
    inner += '<circle class="vai-argand-ring" cx="' + cx + '" cy="' + cy + '" r="' + (scale * 2) + '"/>';
    points.forEach(function(p, i){
      var px = cx + p.re * scale;
      var py = cy - p.im * scale;
      inner += '<line class="vai-vector-line vai-draw-path" x1="' + cx + '" y1="' + cy + '" x2="' + px + '" y2="' + py + '"/>';
      inner += '<circle class="vai-point" cx="' + px + '" cy="' + py + '" r="4"/>';
      if(p.label) inner += '<text class="vai-svg-label" x="' + (px + 6) + '" y="' + (py - 6) + '">' + escAttr(p.label) + '</text>';
    });
    if(extras && extras.arc){
      inner += '<path class="vai-draw-path vai-argand-arc" d="' + extras.arc + '" fill="none"/>';
    }
    return svgWrap(w, h, inner, 'Argand diagram', extras && extras.caption ? extras.caption : '\\text{Complex plane}');
  }

  function graphVectors(vecs){
    var w = 340, h = 200, pad = 36, ox = pad + 20, oy = h - pad - 20, scale = 22;
    var inner = axes(w, h, pad, ox, oy);
    vecs.forEach(function(v){
      var ex = ox + v.x * scale, ey = oy - v.y * scale;
      inner += '<line class="vai-vector-line vai-draw-path" x1="' + ox + '" y1="' + oy + '" x2="' + ex + '" y2="' + ey + '"/>';
      inner += '<polygon class="vai-arrow-head" points="' +
        ex + ',' + ey + ' ' + (ex-8) + ',' + (ey+4) + ' ' + (ex-8) + ',' + (ey-4) + '"/>';
      if(v.label){
        inner += '<text class="vai-svg-label" x="' + (ex + 4) + '" y="' + (ey - 4) + '">' + escAttr(v.label) + '</text>';
      }
    });
    return svgWrap(w, h, inner, 'Vector diagram', '\\text{Components in }\\mathbf{i},\\mathbf{j}');
  }

  function graphProjectile(u, thetaDeg){
    var w = 340, h = 200, pad = 32;
    var g = 9.8, th = thetaDeg * Math.PI / 180;
    var tmax = 2 * u * Math.sin(th) / g;
    var xmax = u * Math.cos(th) * tmax;
    var d = pathFromFn(function(t){
      return u * Math.sin(th) * t - 0.5 * g * t * t;
    }, 0, tmax, 80,
      function(t){ return pad + (u * Math.cos(th) * t) / xmax * (w - 2 * pad); },
      function(y){
        var ymax = u * Math.sin(th) * u * Math.sin(th) / (2 * g);
        return h - pad - (y / ymax) * (h - 2 * pad);
      }
    );
    return svgWrap(w, h, axes(w, h, pad) +
      '<path class="vai-draw-path" d="' + d + '" fill="none"/>' +
      '<circle class="vai-point vai-pulse" cx="' + pad + '" cy="' + (h-pad) + '" r="5"/>',
      'Projectile path', 'y=x\\tan\\theta-\\frac{gx^2}{2u^2\\sec^2\\theta}');
  }

  function graphShaded(f, a, b, x0, x1){
    var w = 340, h = 200, pad = 32;
    var ymin = 0, ymax = 1;
    for(var j = 0; j <= 40; j++){
      var xx = x0 + (x1 - x0) * j / 40;
      ymax = Math.max(ymax, f(xx));
    }
    var curve = pathFromFn(f, x0, x1, 80,
      function(x){ return pad + (x - x0) / (x1 - x0) * (w - 2 * pad); },
      function(y){ return h - pad - (y - ymin) / (ymax - ymin) * (h - 2 * pad); }
    );
    var xA = pad + (a - x0) / (x1 - x0) * (w - 2 * pad);
    var xB = pad + (b - x0) / (x1 - x0) * (w - 2 * pad);
    var base = h - pad;
    var fill = 'M' + xA + ' ' + base + ' L' + curve.replace(/^M/, '') + ' L' + xB + ' ' + base + ' Z';
    return svgWrap(w, h, axes(w, h, pad) +
      '<path class="vai-fill-region" d="' + fill + '"/>' +
      '<path class="vai-draw-path" d="' + curve + '" fill="none"/>',
      'Area under curve', '\\int_{' + a + '}^{' + b + '} f(x)\\,dx');
  }

  function graphMatrixTransform(a, b, c, d){
    var w = 340, h = 200, pad = 40, ox = pad + 30, oy = h - pad - 30, s = 18;
    var unit = [
      {x:1,y:0,c:'#e8b84b'},{x:0,y:1,c:'#7eb8da'}
    ];
    var inner = axes(w, h, pad, ox, oy);
    unit.forEach(function(u, idx){
      var tx = a * u.x + b * u.y, ty = c * u.x + d * u.y;
      var col = idx ? 'var(--accent)' : 'var(--gold)';
      inner += '<line stroke="' + col + '" stroke-opacity=".35" x1="' + ox + '" y1="' + oy + '" x2="' + (ox+u.x*s) + '" y2="' + (oy-u.y*s) + '"/>';
      inner += '<line class="vai-vector-line vai-draw-path" stroke="' + col + '" x1="' + ox + '" y1="' + oy + '" x2="' + (ox+tx*s) + '" y2="' + (oy-ty*s) + '"/>';
    });
    return svgWrap(w, h, inner, 'Linear transformation',
      '\\begin{pmatrix}x\'\\\\y\'\\end{pmatrix}=\\begin{pmatrix}' + a + '&' + b + '\\\\' + c + '&' + d + '\\end{pmatrix}\\begin{pmatrix}x\\\\y\\end{pmatrix}');
  }

  function graphPolarRose(n){
    var w = 340, h = 200, pad = 36, cx = w/2, cy = h/2, R = 72;
    var pts = [];
    for(var i = 0; i <= 120; i++){
      var t = i / 120 * 2 * Math.PI;
      var r = Math.cos(n * t);
      var px = cx + r * R * Math.cos(t);
      var py = cy - r * R * Math.sin(t);
      pts.push((i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1));
    }
    return svgWrap(w, h,
      '<circle class="vai-argand-ring" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' +
      '<path class="vai-draw-path" d="' + pts.join(' ') + '" fill="none"/>',
      'Polar curve', 'r=\\cos(' + n + '\\theta)');
  }

  global.VaiEaViz = {
    L: L,
    graphLog: graphLog,
    graphTrig: graphTrig,
    graphExp: graphExp,
    graphNormal: graphNormal,
    graphArgand: graphArgand,
    graphVectors: graphVectors,
    graphProjectile: graphProjectile,
    graphShaded: graphShaded,
    graphMatrixTransform: graphMatrixTransform,
    graphPolarRose: graphPolarRose
  };
})(typeof window !== 'undefined' ? window : this);
