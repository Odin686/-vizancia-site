(function(){
  'use strict';

  document.querySelectorAll('[data-quiz]').forEach(function(quiz){
    var feedback=quiz.querySelector('[data-feedback]');
    quiz.querySelectorAll('.quiz-option').forEach(function(option){
      option.addEventListener('click',function(){
        quiz.querySelectorAll('.quiz-option').forEach(function(item){item.classList.remove('correct','incorrect');});
        var correct=option.dataset.correct==='true';
        option.classList.add(correct?'correct':'incorrect');
        feedback.textContent=correct
          ? 'Correct. A language model predicts likely patterns from training; a confident answer still needs verification.'
          : 'Not quite. Language models predict patterns rather than looking up guaranteed truths or thinking like a person.';
      });
    });
  });

  var tabs=document.querySelectorAll('[role="tab"]');
  tabs.forEach(function(tab){
    tab.addEventListener('click',function(){
      tabs.forEach(function(item){item.setAttribute('aria-selected','false');});
      document.querySelectorAll('[role="tabpanel"]').forEach(function(panel){panel.classList.remove('active');panel.hidden=true;});
      tab.setAttribute('aria-selected','true');
      var panel=document.getElementById(tab.getAttribute('aria-controls'));
      panel.hidden=false;panel.classList.add('active');
    });
    tab.addEventListener('keydown',function(event){
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();
      var list=Array.prototype.slice.call(tabs);
      var direction=event.key==='ArrowRight'?1:-1;
      var next=list[(list.indexOf(tab)+direction+list.length)%list.length];
      next.focus();next.click();
    });
  });

  var sticky=document.querySelector('[data-sticky-download]');
  var hero=document.querySelector('.hero');
  if(sticky&&hero&&'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){sticky.classList.toggle('visible',!entries[0].isIntersecting);},{threshold:.12}).observe(hero);
  }

  var navLinks=document.querySelectorAll('.nav-tab');
  var sections=document.querySelectorAll('main [data-nav-section]');
  if('IntersectionObserver' in window){
    var sectionObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){if(entry.isIntersecting){navLinks.forEach(function(link){link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id);});}});
    },{rootMargin:'-25% 0px -65% 0px'});
    sections.forEach(function(section){sectionObserver.observe(section);});
  }
}());
