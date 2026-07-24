(function(global){
  'use strict';

  /** QCAA General senior syllabus 2025 — Unit 3 & 4 topic titles (Mathematical Methods v1.3). */
  var methods = {
    unit3: {
      title: 'Unit 3: Further calculus and introduction to statistics',
      topics: [
        { id: 'mm-u3-t1', title: 'Topic 1: Differentiation of exponential and logarithmic functions' },
        { id: 'mm-u3-t2', title: 'Topic 2: Differentiation of trigonometric functions and differentiation rules' },
        { id: 'mm-u3-t3', title: 'Topic 3: Further applications of differentiation' },
        { id: 'mm-u3-t4', title: 'Topic 4: Introduction to integration' },
        { id: 'mm-u3-t5', title: 'Topic 5: Discrete random variables' }
      ]
    },
    unit4: {
      title: 'Unit 4: Further calculus, trigonometry and statistics',
      topics: [
        { id: 'mm-u4-t1', title: 'Topic 1: Further integration' },
        { id: 'mm-u4-t2', title: 'Topic 2: Trigonometry' },
        { id: 'mm-u4-t3', title: 'Topic 3: Continuous random variables and the normal distribution' },
        { id: 'mm-u4-t4', title: 'Topic 4: Sampling and proportions' },
        { id: 'mm-u4-t5', title: 'Topic 5: Interval estimates for proportions' }
      ]
    },
    cuplus: { id: 'methods-cuplus', title: 'CU+: Cross-topic (Units 3 & 4)' }
  };

  /**
   * Specialist Mathematics — QCAA General senior syllabus 2025 (Unit 3 & 4 topic titles).
   * Methods titles are verbatim from syllabus v1.3. Confirm Specialist titles against your school’s syllabus PDF if required.
   */
  var specialist = {
    unit3: {
      title: 'Unit 3: Further calculus, vectors and proofs',
      topics: [
        { id: 'sm-u3-t1', title: 'Topic 1: Mathematical induction' },
        { id: 'sm-u3-t2', title: 'Topic 2: Vectors and matrices' },
        { id: 'sm-u3-t3', title: 'Topic 3: Complex numbers' },
        { id: 'sm-u3-t4', title: 'Topic 4: Further integration and applications' },
        { id: 'sm-u3-t5', title: 'Topic 5: Vector calculus' }
      ]
    },
    unit4: {
      title: 'Unit 4: Further calculus, complex numbers and statistical inference',
      topics: [
        { id: 'sm-u4-t1', title: 'Topic 1: Integration techniques' },
        { id: 'sm-u4-t2', title: 'Topic 2: Differential equations' },
        { id: 'sm-u4-t3', title: 'Topic 3: Modelling motion' },
        { id: 'sm-u4-t4', title: 'Topic 4: Statistical inference' },
        { id: 'sm-u4-t5', title: 'Topic 5: Further applications of calculus' }
      ]
    },
    cuplus: { id: 'specialist-cuplus', title: 'CU+: Cross-topic (Units 3 & 4)' }
  };

  function allTopicIds(subject){
    var s = subject === 'specialist' ? specialist : methods;
    return s.unit3.topics.map(function(t){ return t.id; })
      .concat(s.unit4.topics.map(function(t){ return t.id; }))
      .concat([s.cuplus.id]);
  }

  function topicTitle(subject, id){
    var s = subject === 'specialist' ? specialist : methods;
    var found;
    s.unit3.topics.concat(s.unit4.topics).some(function(t){
      if(t.id === id){ found = t.title; return true; }
      return false;
    });
    if(found) return found;
    if(id === s.cuplus.id) return s.cuplus.title;
    return id;
  }

  global.VaiEaSyllabus = {
    methods: methods,
    specialist: specialist,
    allTopicIds: allTopicIds,
    topicTitle: topicTitle
  };
})(typeof window !== 'undefined' ? window : this);
