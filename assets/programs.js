(function () {
  'use strict';

  var menu = document.getElementById('proMenu');
  var nav = document.getElementById('proNav');
  var form = document.getElementById('programEnquiryForm');
  var programField = document.getElementById('leadProgram');
  var status = document.getElementById('formStatus');

  menu.addEventListener('click', function () {
    var open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('open', open);
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('open');
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('open');
      menu.focus();
    }
  });

  document.querySelectorAll('.program-select').forEach(function (link) {
    link.addEventListener('click', function () {
      var selectedProgram = link.getAttribute('data-program');
      if (selectedProgram) programField.value = selectedProgram;
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    var name = document.getElementById('leadName').value.trim();
    var email = document.getElementById('leadEmail').value.trim();
    var organization = document.getElementById('leadOrganization').value.trim();
    var program = programField.value;
    var groupSize = document.getElementById('leadGroup').value.trim();
    var timing = document.getElementById('leadTiming').value.trim();
    var message = document.getElementById('leadMessage').value.trim();
    var subject = 'Vizancia program enquiry — ' + program;
    var body = [
      'Hello Vizancia team,',
      '',
      'I would like to enquire about a Vizancia program.',
      '',
      'Name: ' + name,
      'Reply email: ' + email,
      'Organization or household: ' + (organization || 'Not provided'),
      'Program: ' + program,
      'Approximate group size: ' + (groupSize || 'Not provided'),
      'Preferred timing: ' + (timing || 'Not provided'),
      '',
      'What I would like help with:',
      message,
      '',
      'Sent from the enquiry form at https://vizancia.com/programs.html'
    ].join('\n');

    status.textContent = 'Your email app should open now. Review the prepared message and press Send to complete your enquiry.';
    window.location.href = 'mailto:info@vizancia.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function (element) { observer.observe(element); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (element) { element.classList.add('visible'); });
  }
}());
