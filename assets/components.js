/* ============================================
   AmiLurie.com — Shared Components
   Generates nav and footer so changes propagate
   across all pages from a single source.
   ============================================ */

var SiteComponents = (function () {
  "use strict";

  var NAV_LINKS = [
    { label: "Home", href: "index.html" },
    { label: "About", href: "about.html" },
    { label: "Games", href: "games.html" },
    { label: "Myth-o-Magic", href: "myth-o-magic.html" },
    { label: "Adventure", href: "adventure.html" }
  ];

  /**
   * Detect if we're in a subfolder (e.g. games/) and prepend "../"
   */
  function getPrefix() {
    var path = window.location.pathname;
    // If we're inside /games/ or any subfolder, use "../"
    if (/\/games\//.test(path)) return "../";
    return "";
  }

  /**
   * Determine which nav link is "current" based on the URL
   */
  function getCurrentPage() {
    var path = window.location.pathname;
    for (var i = 0; i < NAV_LINKS.length; i++) {
      var href = NAV_LINKS[i].href;
      if (path.indexOf(href.replace(".html", "")) !== -1 ||
          (href === "index.html" && (path.endsWith("/") || path.endsWith("/index.html")))) {
        // Special case: don't match "index" for game pages
        if (href === "index.html" && /\/games\//.test(path)) continue;
        return href;
      }
    }
    return "";
  }

  /**
   * Build and inject the site nav into a placeholder element
   */
  function renderNav(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var prefix = getPrefix();
    var current = getCurrentPage();

    var html = '<nav class="site-nav" aria-label="Main navigation">';
    html += '<div class="nav-inner">';
    html += '<a href="' + prefix + 'index.html" class="nav-logo" aria-label="Ami Lurie — Home">AL</a>';
    html += '<button class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Toggle navigation">';
    html += '<span></span><span></span><span></span>';
    html += '</button>';
    html += '<ul class="nav-links" id="nav-links" role="list">';

    for (var i = 0; i < NAV_LINKS.length; i++) {
      var link = NAV_LINKS[i];
      var ariaCurrent = link.href === current ? ' aria-current="page"' : '';
      html += '<li><a href="' + prefix + link.href + '"' + ariaCurrent + '>' + link.label + '</a></li>';
    }

    html += '</ul></div></nav>';
    container.innerHTML = html;
  }

  /**
   * Build and inject the site footer into a placeholder element
   */
  function renderFooter(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var html = '<footer class="site-footer">';
    html += '<div class="container">';
    html += '<p>&copy; ' + new Date().getFullYear() + ' Ami Lurie. All rights reserved.</p>';
    html += '</div></footer>';
    container.innerHTML = html;
  }

  return {
    renderNav: renderNav,
    renderFooter: renderFooter
  };
})();
