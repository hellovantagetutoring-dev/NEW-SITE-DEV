(function(global){
  'use strict';
  var V = global.VaiEaViz || {};
  var L = V.L || function(t){ return t; };

  function G(lines){
    return lines.map(function(line){
      return '<p><span class="vai-katex" data-katex="' + String(line).replace(/"/g,'&quot;') + '"></span></p>';
    }).join('');
  }

  function Q(stem, marks, tech, parts, guideLines, graph){
    return function(){
      return {
        stem: stem,
        marks: marks,
        tech: tech,
        parts: parts,
        guide: G(guideLines),
        graph: graph
      };
    };
  }

  global.VaiEaSpecBank = {
    'sm-ind': {
      sf: [
        Q('<p>Show that ' + L('5\\mid(6^n-1)') + ' for ' + L('n=1,2,3') + '.</p>', '3 marks', 'Technology-free', 'divisibility',
          ['6^1-1=5', '6^2-1=35', '6^3-1=215']),
        Q('<p>Prove that ' + L('1+2+\\cdots+n=\\dfrac{n(n+1)}{2}') + ' for ' + L('n=1,2,3') + ' by direct substitution.</p>', '3 marks', 'Technology-free', 'sum formula',
          ['n=1:\\;1=1', 'n=2:\\;1+2=3', 'n=3:\\;6=\\dfrac{3\\cdot4}{2}'])
      ],
      cf: [
        Q('<p>Use induction to prove ' + L('4^n>3n+1') + ' for integers ' + L('n\\ge 2') + '.</p>', '5 marks', 'Technology-free', 'inequality induction',
          ['\\text{Base }n=2:\\;16>7', '\\text{Assume }4^k>3k+1', '4^{k+1}=4\\cdot4^k>12k+4>3(k+1)+1\\text{ for }k\\ge2'])
      ],
      cu: [
        Q('<p>Prove by mathematical induction that, for all ' + L('n\\ge 1') + ',</p>' + L('1^2+2^2+\\cdots+n^2=\\dfrac{n(n+1)(2n+1)}{6}', true), '6 marks', 'Technology-free', 'sum of squares',
          ['n=1:\\;1=1', '\\sum_{i=1}^{k+1}i^2=k^2(k+1)^2/6+(k+1)^2', '=(k+1)(k+2)(2k+1)/6'])
      ]
    },
    'sm-vec': {
      sf: [
        Q('<p>Let ' + L('\\mathbf{a}=3\\mathbf{i}-4\\mathbf{j}') + '. Find ' + L('|\\mathbf{a}|') + '.</p>', '2 marks', 'Technology-free', 'magnitude',
          ['|\\mathbf{a}|=\\sqrt{9+16}=5'], V.graphVectors && V.graphVectors([{x:3,y:-4,label:'a'}]))
      ],
      cf: [
        Q('<p>For ' + L('\\mathbf{a}=2\\mathbf{i}+\\mathbf{j}') + ' and ' + L('\\mathbf{b}=-\\mathbf{i}+3\\mathbf{j}') + ', find ' + L('\\mathbf{a}\\cdot\\mathbf{b}') + ' and the angle between them.</p>', '4 marks', 'Technology-free', 'scalar product',
          ['\\mathbf{a}\\cdot\\mathbf{b}=-2+3=1', '\\cos\\theta=\\dfrac{1}{\\sqrt5\\cdot\\sqrt{10}}'], V.graphVectors && V.graphVectors([{x:2,y:1,label:'a'},{x:-1,y:3,label:'b'}]))
      ],
      cu: [
        Q('<p>Points ' + L('A,B,C') + ' have position vectors ' + L('\\mathbf{a}=\\mathbf{i}+2\\mathbf{j}') + ', ' + L('\\mathbf{b}=4\\mathbf{i}-\\mathbf{j}') + ', ' + L('\\mathbf{c}=7\\mathbf{i}+5\\mathbf{j}') + '. Show ' + L('A,B,C') + ' are collinear.</p>', '4 marks', 'Technology-free', 'collinearity',
          ['\\overrightarrow{AB}=3\\mathbf{i}-3\\mathbf{j}', '\\overrightarrow{AC}=6\\mathbf{i}+3\\mathbf{j}', '\\text{Parallel }\\Rightarrow\\text{ collinear}'])
      ]
    },
    'sm-veq': {
      sf: [
        Q('<p>Find a vector equation of the line through ' + L('(1,2,3)') + ' parallel to ' + L('2\\mathbf{i}-\\mathbf{j}+4\\mathbf{k}') + '.</p>', '3 marks', 'Technology-free', 'vector line',
          ['\\mathbf{r}=(\\mathbf{i}+2\\mathbf{j}+3\\mathbf{k})+\\lambda(2\\mathbf{i}-\\mathbf{j}+4\\mathbf{k})'])
      ],
      cf: [
        Q('<p>Lines ' + L('\\mathbf{r}_1=\\mathbf{i}+\\lambda(2\\mathbf{i}+\\mathbf{j})') + ' and ' + L('\\mathbf{r}_2=3\\mathbf{i}+\\mathbf{j}+\\mu(\\mathbf{i}-\\mathbf{j})') + '. Determine if they intersect.</p>', '4 marks', 'Technology-free', 'line intersection',
          ['\\text{Equate components, solve }\\lambda,\\mu', '\\text{Consistent }\\Rightarrow\\text{ point of intersection}'])
      ],
      cu: [
        Q('<p>Find the shortest distance between skew lines with direction vectors ' + L('\\mathbf{d}_1=\\mathbf{i}+\\mathbf{j}') + ' and ' + L('\\mathbf{d}_2=\\mathbf{i}-\\mathbf{j}+\\mathbf{k}') + '.</p>', '5 marks', 'Technology-active', 'skew lines',
          ['\\text{Use }|\\overrightarrow{AB}\\cdot(\\mathbf{d}_1\\times\\mathbf{d}_2)|/|\\mathbf{d}_1\\times\\mathbf{d}_2|'])
      ]
    },
    'sm-linear': {
      sf: [
        Q('<p>Solve the system: ' + L('2x+y=7') + ', ' + L('x-y=2') + '.</p>', '3 marks', 'Technology-free', '2×2 system',
          ['x=3,\\;y=1'])
      ],
      cf: [
        Q('<p>Write the augmented matrix for</p>' + L('\\begin{cases}x+2y-z=4\\\\2x-y+z=1\\end{cases}', true) + '<p>and solve using row operations.</p>', '4 marks', 'Technology-free', 'augmented matrix',
          ['\\left[\\begin{array}{ccc|c}1&2&-1&4\\\\2&-1&1&1\\end{array}\\right]', '\\text{Gauss-Jordan to RREF}'])
      ],
      cu: [
        Q('<p>For which values of ' + L('k') + ' does the system ' + L('x+ky=1') + ', ' + L('2x+2y=3') + ' have no solution, a unique solution, or infinitely many?</p>', '5 marks', 'Technology-free', 'parameter systems',
          ['k=1:\\;\\text{parallel distinct}', 'k\\neq1:\\;\\text{unique}'])
      ]
    },
    'sm-mat': {
      sf: [
        Q('<p>Evaluate ' + L('\\begin{pmatrix}1&2\\\\0&3\\end{pmatrix}\\begin{pmatrix}4\\\\-1\\end{pmatrix}') + '.</p>', '2 marks', 'Technology-free', 'matrix product',
          ['\\begin{pmatrix}2\\\\-3\\end{pmatrix}'], V.graphMatrixTransform && V.graphMatrixTransform(1,2,0,3))
      ],
      cf: [
        Q('<p>Find ' + L('A^{-1}') + ' for ' + L('A=\\begin{pmatrix}2&1\\\\5&3\\end{pmatrix}') + '.</p>', '3 marks', 'Technology-free', 'inverse',
          ['\\det A=1', 'A^{-1}=\\begin{pmatrix}3&-1\\\\-5&2\\end{pmatrix}'], V.graphMatrixTransform && V.graphMatrixTransform(2,1,5,3))
      ],
      cu: [
        Q('<p>A Leslie matrix models a population with three age classes. Given ' + L('L=\\begin{pmatrix}0&1.2&0.8\\\\0.5&0&0\\\\0&0.3&0\\end{pmatrix}') + ', find the population after two time steps from ' + L('\\mathbf{p}_0=(100,0,0)^T') + '.</p>', '5 marks', 'Technology-active', 'Leslie matrix',
          ['\\mathbf{p}_1=L\\mathbf{p}_0', '\\mathbf{p}_2=L\\mathbf{p}_1'])
      ]
    },
    'sm-vcalc': {
      sf: [
        Q('<p>For ' + L('\\mathbf{r}(t)=t^2\\mathbf{i}+(3t)\\mathbf{j}') + ', find ' + L('\\mathbf{v}(t)') + ' and ' + L('\\mathbf{a}(t)') + '.</p>', '3 marks', 'Technology-free', 'vector kinematics',
          ['\\mathbf{v}=2t\\mathbf{i}+3\\mathbf{j}', '\\mathbf{a}=2\\mathbf{i}'], V.graphProjectile && V.graphProjectile(50, 30))
      ],
      cf: [
        Q('<p>Projectile: ' + L('\\mathbf{r}(t)=400t\\mathbf{i}+(500t-5t^2)\\mathbf{j}') + ', ' + L('t\\ge0') + '. Find time to return to ground and maximum height.</p>', '5 marks', 'Technology-free', 'projectile',
          ['500t-5t^2=0\\Rightarrow t=100', 'H=\\dfrac{v^2}{2g}\\text{ from vertex}'], V.graphProjectile && V.graphProjectile(400, 45))
      ],
      cu: [
        Q('<p>Particle moves on a circle ' + L('\\mathbf{r}(t)=3\\cos t\\,\\mathbf{i}+3\\sin t\\,\\mathbf{j}') + '. Find speed and show it is constant.</p>', '4 marks', 'Technology-free', 'circular motion',
          ['|\\mathbf{v}(t)|=3', '\\text{Speed constant}'], V.graphPolarRose && V.graphPolarRose(1))
      ]
    },
    'sm-cplx': {
      sf: [
        Q('<p>For ' + L('z=3+4i') + ', find ' + L('|z|') + ' and ' + L('z\\bar{z}') + '.</p>', '3 marks', 'Technology-free', 'modulus',
          ['|z|=5', 'z\\bar{z}=25'], V.graphArgand && V.graphArgand([{re:3,im:4,label:'z'}]))
      ],
      cf: [
        Q('<p>Write ' + L('(1+i)^5') + ' in the form ' + L('a+bi') + ' using De Moivre.</p>', '4 marks', 'Technology-free', 'De Moivre',
          ['1+i=\\sqrt2\\,\\mathrm{cis}\\,\\pi/4', '(\\sqrt2)^5\\,\\mathrm{cis}\\,5\\pi/4'], V.graphArgand && V.graphArgand([{re:1,im:1,label:'1+i'}]))
      ],
      cu: [
        Q('<p>Solve ' + L('z^2+2z+5=0') + ' over ' + L('\\mathbb{C}') + ' and plot roots on an Argand diagram.</p>', '4 marks', 'Technology-free', 'quadratics over C',
          ['z=-1\\pm2i'], V.graphArgand && V.graphArgand([{re:-1,im:2,label:'z₁'},{re:-1,im:-2,label:'z₂'}]))
      ]
    },
    'sm-int': {
      sf: [
        Q('<p>Find ' + L('\\int \\dfrac{1}{9+x^2}\\,dx') + '.</p>', '2 marks', 'Technology-free', 'inverse tan',
          ['\\dfrac{1}{3}\\tan^{-1}(x/3)+C'], V.graphShaded && V.graphShaded(function(x){return 1/(9+x*x);},0,2,-2,3))
      ],
      cf: [
        Q('<p>Evaluate ' + L('\\int_0^{\\pi/2} \\sin^2 x\\,dx') + '.</p>', '4 marks', 'Technology-free', 'trig identity',
          ['\\int \\dfrac{1-\\cos2x}{2}dx', '\\Bigl[\\dfrac{x}{2}-\\dfrac{\\sin2x}{4}\\Bigr]_0^{\\pi/2}=\\dfrac{\\pi}{4}'])
      ],
      cu: [
        Q('<p>Find ' + L('\\int x e^{2x}\\,dx') + ' using integration by parts.</p>', '4 marks', 'Technology-free', 'by parts',
          ['u=x,\\;dv=e^{2x}dx', '\\dfrac{x}{2}e^{2x}-\\dfrac{1}{4}e^{2x}+C'], V.graphExp && V.graphExp(2))
      ]
    },
    'sm-appint': {
      sf: [
        Q('<p>Find the area between ' + L('y=x^2') + ' and ' + L('y=x') + ' for ' + L('0\\le x\\le 1') + '.</p>', '3 marks', 'Technology-free', 'area between curves',
          ['\\int_0^1(x-x^2)dx=\\dfrac{1}{6}'], V.graphShaded && V.graphShaded(function(x){return x*x;},0,1,0,1))
      ],
      cf: [
        Q('<p>Region under ' + L('y=\\sqrt{x}') + ' from ' + L('x=0') + ' to ' + L('x=4') + ' is rotated about the ' + L('x') + '-axis. Find the volume.</p>', '4 marks', 'Technology-active', 'volume of revolution',
          ['V=\\pi\\int_0^4 x\\,dx=8\\pi'])
      ],
      cu: [
        Q('<p>Use Simpson’s rule with ' + L('n=4') + ' subintervals to estimate ' + L('\\int_0^2 e^{-x^2}\\,dx') + '.</p>', '5 marks', 'Technology-active', 'Simpson’s rule',
          ['w=\\dfrac{b-a}{n}', 'S=\\dfrac{w}{3}[f_0+4f_1+2f_2+\\cdots+f_n]'])
      ]
    },
    'sm-de': {
      sf: [
        Q('<p>Find ' + L('\\dfrac{dy}{dx}') + ' if ' + L('x^2+y^2=25') + '.</p>', '3 marks', 'Technology-free', 'implicit',
          ['2x+2y\\dfrac{dy}{dx}=0', '\\dfrac{dy}{dx}=-\\dfrac{x}{y}'])
      ],
      cf: [
        Q('<p>Solve ' + L('\\dfrac{dy}{dx}=\\dfrac{x}{y}') + ' given ' + L('y(1)=2') + '.</p>', '4 marks', 'Technology-free', 'separable',
          ['y\\,dy=x\\,dx', 'y^2=x^2+3'])
      ],
      cu: [
        Q('<p>A tank mixes so ' + L('\\dfrac{dx}{dt}=-\\dfrac{4x}{50-2t}') + ' with ' + L('x(0)=50') + '. Find ' + L('x(10)') + '.</p>', '5 marks', 'Technology-active', 'related rates · DE',
          ['\\text{Separate variables}', 'x(10)=50\\left(\\dfrac{30}{50}\\right)^2'])
      ]
    },
    'sm-motion': {
      sf: [
        Q('<p>Particle with ' + L('v=3t^2-12') + ' m/s. Find displacement from ' + L('t=0') + ' to ' + L('t=2') + '.</p>', '3 marks', 'Technology-free', 'kinematics',
          ['s=\\int_0^2(3t^2-12)dt=-16\\text{ m}'])
      ],
      cf: [
        Q('<p>Mass ' + L('5') + ' kg, horizontal force ' + L('20') + ' N, friction ' + L('16') + ' N. Find acceleration and distance in ' + L('5') + ' s from rest.</p>', '4 marks', 'Technology-free', 'Newton’s laws',
          ['F_{\\text{net}}=4\\text{ N}', 'a=0.8\\text{ m/s}^2', 's=10\\text{ m}'])
      ],
      cu: [
        Q('<p>SHM: ' + L('a=-16x') + '. If ' + L('x(0)=0.25') + ', ' + L('v(0)=0') + ', find ' + L('x(t)') + '.</p>', '5 marks', 'Technology-free', 'simple harmonic motion',
          ['\\omega=4', 'x=0.25\\cos(4t)'])
      ]
    },
    'sm-stats': {
      sf: [
        Q('<p>Independent ' + L('X\\sim N(10,4)') + ', ' + L('Y\\sim N(6,9)') + '. Find ' + L('E(X-Y)') + ' and ' + L('\\mathrm{Var}(X-Y)') + '.</p>', '3 marks', 'Technology-free', 'linear combinations',
          ['E(X-Y)=4', '\\mathrm{Var}(X-Y)=4+9=13'])
      ],
      cf: [
        Q('<p>A sample of ' + L('n=25') + ' has mean ' + L('\\bar{x}=48') + ' from ' + L('N(\\mu,25)') + '. Find a ' + L('95\\%') + ' confidence interval for ' + L('\\mu') + '.</p>', '4 marks', 'Technology-active', 'confidence interval',
          ['\\bar{x}\\pm z_{0.025}\\dfrac{\\sigma}{\\sqrt{n}}', '48\\pm1.96'])
      ],
      cu: [
        Q('<p>Explain why the sampling distribution of ' + L('\\bar{X}') + ' is approximately normal for large ' + L('n') + ' even when ' + L('X') + ' is not normal.</p>', '4 marks', 'Technology-free', 'CLT reasoning',
          ['\\text{Central Limit Theorem}', '\\text{Mean of sample means }\\to\\mu'])
      ]
    }
  };
})(typeof window !== 'undefined' ? window : this);
