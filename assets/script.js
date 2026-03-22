/* ============================================
   AmiLurie.com — Global Scripts
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  /* ----- Render shared components ----- */
  if (typeof SiteComponents !== "undefined") {
    SiteComponents.renderNav("site-nav");
    SiteComponents.renderFooter("site-footer");
  }

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

  /* ----- Secret Lightning Trigger ----- */
  (function initLightningTrigger() {
    var trigger = document.querySelector(".lightning-trigger");
    if (!trigger) return;

    var prefix = /\/games\//.test(window.location.pathname) ? "../" : "";
    trigger.addEventListener("click", function () {
      window.location.href = prefix + "games/secret.html";
    });
  })();
});
