(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var menu = document.getElementById("proMenu");
  var nav = document.getElementById("proNav");
  if (menu && nav) {
    function closeMenu() {
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open menu");
      nav.classList.remove("open");
    }
    menu.addEventListener("click", function () {
      var open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("open", open);
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        closeMenu();
        menu.focus();
      }
    });
  }
  var sample = document.getElementById("session-sample");
  if (sample) {
    var evidence = document.getElementById("sample-evidence");
    var feedback = document.getElementById("sample-feedback");
    var begin = document.getElementById("sample-begin");
    var compare = document.getElementById("sample-compare");
    var reset = document.getElementById("sample-reset");
    // The entire example remains readable without JavaScript.
    evidence.hidden = true;
    feedback.hidden = true;
    begin.hidden = false;
    compare.hidden = false;
    reset.hidden = false;
    begin.addEventListener("click", function () {
      evidence.hidden = false;
      begin.setAttribute("aria-expanded", "true");
      evidence.querySelector("h3").focus();
    });
    compare.addEventListener("click", function () {
      feedback.hidden = false;
      compare.setAttribute("aria-expanded", "true");
      feedback.querySelector("h3").focus();
    });
    reset.addEventListener("click", function () {
      evidence.hidden = true;
      feedback.hidden = true;
      begin.setAttribute("aria-expanded", "false");
      compare.setAttribute("aria-expanded", "false");
      sample.querySelectorAll("details").forEach(function (d) {
        d.open = false;
      });
      begin.focus();
    });
  }
  var choices = document.querySelector(".passport-choices");
  var data = document.getElementById("passport-examples");
  if (choices && data) {
    var examples = JSON.parse(data.textContent);
    choices.hidden = false;
    choices.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        var example = examples[button.getAttribute("data-decision")];
        choices.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === button));
        });
        ["choice", "reason", "evidence", "followup"].forEach(function (key) {
          document.getElementById("example-" + key).textContent = example[key];
        });
        document.getElementById("passport-followup").open = false;
      });
    });
  }
})();
