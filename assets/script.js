/* ============================================
   AmiLurie.com — Global Scripts
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  /* ----- Mobile Navigation Toggle ----- */
  (function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      links.classList.toggle("open");
    });

    // Close nav when a link is clicked (mobile)
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  })();

  /* ----- Footer Year ----- */
  (function initFooterYear() {
    var el = document.getElementById("footer-year");
    if (el) {
      el.textContent = new Date().getFullYear();
    }
  })();

  /* ----- Secret Lightning Trigger ----- */
  (function initLightningTrigger() {
    var trigger = document.querySelector(".lightning-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function () {
      window.location.href = "games/secret.html";
    });
  })();
});
