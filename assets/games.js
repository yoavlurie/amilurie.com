/* ============================================
   AmiLurie.com — Shared Game Utilities
   ============================================ */

var GameUtils = (function () {
  "use strict";

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  return {
    randomInt: randomInt,
    pickRandom: pickRandom,
    shuffleArray: shuffleArray,
    generateId: generateId
  };
})();
