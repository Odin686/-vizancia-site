(function(){
  'use strict';

  var progress=document.querySelector('[data-reading-progress]');
  if(progress){
    var updateProgress=function(){
      var height=document.documentElement.scrollHeight-window.innerHeight;
      var percent=height>0?Math.min(100,Math.max(0,(window.scrollY/height)*100)):0;
      progress.style.width=percent+'%';
    };
    document.addEventListener('scroll',updateProgress,{passive:true});
    updateProgress();
  }

  var filters=document.querySelectorAll('[data-resource-filter]');
  var cards=document.querySelectorAll('[data-resource-card]');
  filters.forEach(function(button){
    button.addEventListener('click',function(){
      var filter=button.dataset.resourceFilter;
      filters.forEach(function(item){item.setAttribute('aria-pressed',String(item===button));});
      cards.forEach(function(card){
        var topics=(card.dataset.topics||'').split(' ');
        card.hidden=filter!=='all'&&topics.indexOf(filter)===-1;
      });
    });
  });

  var tocLinks=document.querySelectorAll('.article-toc a');
  var headings=document.querySelectorAll('.article-body h2[id]');
  if(tocLinks.length&&headings.length&&'IntersectionObserver' in window){
    var headingObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){tocLinks.forEach(function(link){link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id);});}
      });
    },{rootMargin:'-25% 0px -65% 0px'});
    headings.forEach(function(heading){headingObserver.observe(heading);});
  }
}());
