/* ============================================
   Mythic Duel — Palettes & Body Templates
   Shared color definitions and humanoid templates
   ============================================ */

var DuelPalettes = (function () {
  "use strict";

  /* ---- Master color palette ---- */
  var C = {
    skin: "#f0c8a0", skinD: "#d4a878", skinDark: "#8a6432", skinDarkD: "#6a4a20",
    outline: "#282840", black: "#1a1a2e", white: "#e8e6f0",
    /* Blues */ blue: "#2a6496", blueD: "#1e4a70", blueL: "#4a9ade",
    /* Purples */ purple: "#7832a0", purpleD: "#5a2478", purpleL: "#a050c8",
    /* Greens */ green: "#2a8a4e", greenD: "#1e6438", greenL: "#4bc76e",
    /* Reds */ red: "#c83030", redD: "#a02020", redL: "#e85555",
    /* Oranges */ orange: "#e85020", orangeD: "#c83010",
    /* Yellows */ gold: "#d4a017", goldD: "#a07810", yellow: "#e8c832",
    /* Browns */ brown: "#8a6432", brownD: "#6a4a20",
    /* Grays */ gray: "#6a6a7a", grayD: "#4a4a5a", grayL: "#9a96b0",
    /* Dark */ dark: "#2a2a3c", darkD: "#1a1a28",
    /* Cyan */ cyan: "#7ac4e8", cyanD: "#50a0c0",
    /* Pink */ pink: "#e8a0d0", pinkD: "#c080b0",
    /* Copper */ copper: "#c8783c", copperD: "#a05a28",
    /* Silver */ silver: "#c0c0d0", silverD: "#9090a0",
    /* Imperial gold */ igold: "#e8c040", igoldD: "#c0a020"
  };

  /* ---- Humanoid body templates ---- */
  /* Character codes: h=hair, s=skin, d=skinDark, t=shirt, T=shirtDark, p=pants, w=weapon, o=outline, W=white(eyes), .=transparent */

  var templates = {
    humanoid_idle: [
      "....ohhhhho.....",
      "...ohhhhhhho....",
      "...ohhhhhhhho...",
      "...osssssssso...",
      "...osWsssWsso...",
      "...ossdssdss....",
      "....osssssso....",
      ".....odddo......",
      "....otttttto....",
      "...ottttttto....",
      "...otTtttTto....",
      "..ootttttttoo...",
      "..sdtttttttds...",
      "..ss.ttttt.ss...",
      ".....ttttt......",
      ".....ppppp......",
      "....opppppo.....",
      "....opppppo.....",
      "....op...po.....",
      "....op...po.....",
      "....op...po.....",
      "...oop...poo....",
      "...ooo...ooo....",
      "................"
    ],
    humanoid_walk: [
      "....ohhhhho.....",
      "...ohhhhhhho....",
      "...ohhhhhhhho...",
      "...osssssssso...",
      "...osWsssWsso...",
      "...ossdssdss....",
      "....osssssso....",
      ".....odddo......",
      "....otttttto....",
      "...ottttttto....",
      "...otTtttTto....",
      "..ootttttttoo...",
      "..sdtttttttds...",
      "..ss.ttttt.ss...",
      ".....ttttt......",
      ".....ppppp......",
      "....opppppo.....",
      "....op..ppo.....",
      "....op....po....",
      "...oop....po....",
      "...ooo...oop....",
      "..........ooo...",
      "................",
      "................"
    ],
    humanoid_attack: [
      "....ohhhhho.....",
      "...ohhhhhhho....",
      "...ohhhhhhhho...",
      "...osssssssso...",
      "...osWsssWsso...",
      "...ossdssdss....",
      "....osssssso....",
      ".....odddo......",
      "....ottttttoswww",
      "...otttttttoswww",
      "...otTtttTto..ww",
      "..ootttttttoo...",
      "...ttttttttt....",
      ".....ttttt......",
      ".....ttttt......",
      ".....ppppp......",
      "....opppppo.....",
      "....opppppo.....",
      "....op...po.....",
      "...oop...po.....",
      "...ooo..oop.....",
      ".........ooo....",
      "................",
      "................"
    ],
    humanoid_block: [
      "....ohhhhho.....",
      "...ohhhhhhho....",
      "...ohhhhhhhho...",
      "...osssssssso...",
      "...osWsssWsso...",
      "...ossdssdss....",
      "....osssssso....",
      ".....odddo......",
      "oo.otttttto.....",
      "oootttttttto....",
      "oo.otTtttTto....",
      "..ootttttttoo...",
      "...ttttttttt....",
      ".....ttttt......",
      ".....ttttt......",
      ".....ppppp......",
      "....opppppo.....",
      "....opppppo.....",
      "....op...po.....",
      "...oop...po.....",
      "...ooo...ooo....",
      "................",
      "................",
      "................"
    ],
    humanoid_hurt: [
      ".....ohhhhho....",
      "....ohhhhhhho...",
      "....ohhhhhhhho..",
      "....osssssssso..",
      "....osWsssWsso..",
      "....ossdssdss...",
      ".....osssssso...",
      "......odddo.....",
      ".....otttttto...",
      "....ottttttto...",
      "....otTtttTto...",
      "...ootttttttoo..",
      "..sdtttttttds...",
      "..ss.ttttt.ss...",
      ".....ttttt......",
      ".....ppppp......",
      "....opppppo.....",
      "....opppppo.....",
      "...oop...poo....",
      "...ooo...ooo....",
      "................",
      "................",
      "................",
      "................"
    ],
    humanoid_duck: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "....ohhhhho.....",
      "...ohhhhhhhho...",
      "...osssssssso...",
      "...osWsssWsso...",
      "...ossdssdss....",
      "....osssssso....",
      "....otttttto....",
      "...otTtttTto....",
      "..ootttttttoo...",
      "..sdtttttttds...",
      "..ss.ttttt.ss...",
      ".....ttttt......",
      "....opppppo.....",
      "..ooppppppoo....",
      "..ooo.....ooo...",
      "................"
    ]
  };

  /* ---- Parse a template with a palette ---- */
  function parseFrame(rows, palette) {
    var frame = [];
    for (var r = 0; r < rows.length; r++) {
      var row = [];
      for (var c = 0; c < rows[r].length; c++) {
        row.push(palette[rows[r][c]] || 0);
      }
      frame.push(row);
    }
    return frame;
  }

  function heroFromTemplate(palMap, overrides) {
    var frames = {};
    var bases = ["idle", "walk", "attack", "block", "hurt", "duck"];
    for (var i = 0; i < bases.length; i++) {
      var key = bases[i];
      var src = (overrides && overrides[key]) ? overrides[key] : templates["humanoid_" + key];
      frames[key] = parseFrame(src, palMap);
    }
    return frames;
  }

  return { C: C, templates: templates, parseFrame: parseFrame, heroFromTemplate: heroFromTemplate };
})();
