(function(global){
  'use strict';

  /*
   * Curated worked solutions for past-exam stems.
   * Step schema (strict line-by-line):
   *   { m: '<latex>', e: '<one-sentence explanation>' }  — one mathematical step per line
   *   { h: '<heading>' }                                 — section heading
   *   { f: '<latex>', e: '<explanation>' }               — final answer (bold emphasis)
   * Legacy schema { t: 'text'|'math'|'math-display', v: ... } is still rendered by the engine.
   */

  function rabbitsFoxesSteps(){
    return [
      { h: 'Set up the model' },
      { m: 'F(t),\\ R(t)\\ \\text{in thousands},\\ t\\ \\text{in months}', e: 'Define fox and rabbit populations as functions of time.' },
      { m: 'F(t) + R(t) > 25', e: 'State the condition for the claim, working in thousands.' },
      { m: '25 \\times 1000 = 25\\,000', e: 'Confirm that 25 thousand matches the 25 000 in the claim.' },
      { h: 'Test the minimum-total region' },
      { m: 'F(0) = 14.5', e: 'Read the fox population at t = 0 from the graph.' },
      { m: 'R(0) = 9', e: 'Read the rabbit population at t = 0 from the graph.' },
      { m: 'F(0) + R(0) = 14.5 + 9', e: 'Substitute both values into the total.' },
      { m: 'F(0) + R(0) = 23.5', e: 'Add the two populations.' },
      { m: '23.5 < 25', e: 'The total does not exceed the threshold at t = 0.' },
      { h: 'Test the maximum-total region' },
      { m: 'F(12) = 14.5', e: 'Read the fox population at t = 12 from the graph.' },
      { m: 'R(12) = 14.5', e: 'Read the rabbit population at t = 12 from the graph.' },
      { m: 'F(12) + R(12) = 14.5 + 14.5', e: 'Substitute both values into the total.' },
      { m: 'F(12) + R(12) = 29', e: 'Add the two populations.' },
      { m: '29 > 25', e: 'The total exceeds the threshold near t = 12.' },
      { m: '29 \\times 1000 = 29\\,000 > 25\\,000', e: 'Convert to a raw count to match the claim.' },
      { h: 'Conclusion' },
      { f: '\\text{Jane\u2019s claim is reasonable}', e: 'The combined population exceeds 25 000 for a period around t = 12 months (and by periodicity, around t = 0 it does not, so the claim holds only for parts of the two years — which is what Jane asserted).' }
    ];
  }

  function drugBloodstreamSteps(){
    return [
      { h: 'a) Find A and b' },
      { m: 'M(t) = Ate^{-bt}', e: 'State the model.' },
      { m: "M'(t) = A e^{-bt} + At \\cdot (-b)e^{-bt}", e: 'Differentiate using the product rule.' },
      { m: "M'(t) = Ae^{-bt}(1 - bt)", e: 'Factor out the common term.' },
      { m: "M'(t) = 0", e: 'The maximum occurs where the derivative is zero.' },
      { m: 'Ae^{-bt} \\ne 0 \\;\\Rightarrow\\; 1 - bt = 0', e: 'The exponential factor is never zero, so set the bracket to zero.' },
      { m: 't = \\frac{1}{b}', e: 'Solve for the time of the maximum.' },
      { m: '\\frac{1}{b} = 2', e: 'The maximum is given at t = 2 hours.' },
      { m: 'b = \\frac{1}{2}', e: 'Solve for b.' },
      { m: 'M(2) = A \\cdot 2 \\cdot e^{-\\frac{1}{2}(2)} = 120', e: 'Substitute t = 2 and the maximum value 120 mg.' },
      { m: '2Ae^{-1} = 120', e: 'Simplify the exponent.' },
      { m: 'A = \\frac{120e}{2}', e: 'Multiply both sides by e and divide by 2.' },
      { f: 'A = 60e, \\quad b = \\tfrac{1}{2}', e: 'Exact values of the parameters.' },
      { h: 'b) Evaluate reasonableness' },
      { m: 'M(0) = 0', e: 'The model gives no drug in the bloodstream at t = 0, consistent with a dose being absorbed.' },
      { m: "M'(t) > 0 \\text{ for } t < 2, \\quad M'(t) < 0 \\text{ for } t > 2", e: 'The sign change confirms t = 2 is a maximum, matching the given information.' },
      { m: 't \\to \\infty \\;\\Rightarrow\\; M(t) \\to 0', e: 'The drug is eliminated over time, which is physically sensible.' },
      { f: '\\text{The solution is reasonable}', e: 'The model rises to a single maximum of 120 mg at 2 hours and decays to zero, consistent with how a drug behaves in the bloodstream.' }
    ];
  }

  function matchDrugBloodstream(stem){
    return /drug in the bloodstream/i.test(stem) && /maximum amount of the drug/i.test(stem);
  }

  function matchRabbitsFoxes(stem){
    return /Rabbits and foxes/i.test(stem) && /Jane believes/i.test(stem) &&
      /total population of foxes and rabbits/i.test(stem);
  }

  function forStem(stem){
    var s = String(stem || '');
    if(matchRabbitsFoxes(s)) return rabbitsFoxesSteps();
    if(matchDrugBloodstream(s)) return drugBloodstreamSteps();
    return null;
  }

  global.VaiEaSolutions = { forStem: forStem };
})(typeof window !== 'undefined' ? window : this);
