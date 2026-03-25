/* ============================================
   Mythic Duel — Controls Module
   Keyboard + mobile touch input
   Added: duck (down), flee
   ============================================ */

var DuelControls = (function () {
  "use strict";

  var keys = {};
  var justPressed = {};
  var prevKeys = {};

  var ACTION_MAP = {
    left:    ["ArrowLeft", "a", "A"],
    right:   ["ArrowRight", "d", "D"],
    jump:    ["ArrowUp", "w", "W"],
    down:    ["ArrowDown", "s", "S"],
    attack:  [" ", "z", "Z"],
    block:   ["Shift", "x", "X"],
    special: ["e", "E", "c", "C"],
    confirm: [" ", "Enter"],
    pause:   ["Escape", "p", "P"],
    flee:    ["q", "Q"],
    questlog:["Tab"],
    mute:    ["m", "M"]
  };

  function isAction(action) {
    var mapped = ACTION_MAP[action];
    if (!mapped) return false;
    for (var i = 0; i < mapped.length; i++) {
      if (keys[mapped[i]]) return true;
    }
    if (keys["touch_" + action]) return true;
    return false;
  }

  function isJustPressed(action) {
    var mapped = ACTION_MAP[action];
    if (!mapped) return false;
    for (var i = 0; i < mapped.length; i++) {
      if (justPressed[mapped[i]]) return true;
    }
    if (justPressed["touch_" + action]) return true;
    return false;
  }

  function updateFrame() {
    justPressed = {};
    for (var k in keys) {
      if (keys[k] && !prevKeys[k]) justPressed[k] = true;
    }
    prevKeys = {};
    for (var k2 in keys) prevKeys[k2] = keys[k2];
  }

  function initKeyboard() {
    document.addEventListener("keydown", function (e) {
      keys[e.key] = true;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown" ||
          e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Tab") {
        e.preventDefault();
      }
    });
    document.addEventListener("keyup", function (e) { keys[e.key] = false; });
    window.addEventListener("blur", function () { keys = {}; });
  }

  function initTouch() {
    var isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    var overlay = document.getElementById("touch-controls");
    var hint = document.getElementById("controls-hint");
    if (!overlay) return;
    if (!isTouchDevice) { overlay.classList.remove("visible"); return; }
    overlay.classList.add("visible");
    if (hint) hint.style.display = "none";

    var buttons = overlay.querySelectorAll(".touch-btn");
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        var action = btn.getAttribute("data-action");
        btn.addEventListener("touchstart", function (e) {
          e.preventDefault(); keys["touch_" + action] = true; btn.classList.add("pressed");
        }, { passive: false });
        btn.addEventListener("touchend", function (e) {
          e.preventDefault(); keys["touch_" + action] = false; btn.classList.remove("pressed");
        }, { passive: false });
        btn.addEventListener("touchcancel", function () {
          keys["touch_" + action] = false; btn.classList.remove("pressed");
        });
      })(buttons[i]);
    }
  }

  function init() { initKeyboard(); initTouch(); }

  return { init: init, isAction: isAction, isJustPressed: isJustPressed, updateFrame: updateFrame };
})();
