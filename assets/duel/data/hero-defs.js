/* ============================================
   Mythic Duel — Hero Definitions
   Stats, specials, descriptions for 15 heroes
   ============================================ */

var DuelHeroDefs = (function () {
  "use strict";

  var roster = [
    { id: "percy", name: "Percy Jackson", series: "pjo", desc: "Son of Poseidon. Water powers.",
      specialName: "Water Wave", specialId: "percy_water_wave", specialCharges: 4,
      stats: { hp: 120, atk: 14, def: 7, speed: 170 }, color: "#2a6496", unlocked: true },
    { id: "annabeth", name: "Annabeth Chase", series: "pjo", desc: "Daughter of Athena. Strategist.",
      specialName: "Strategic Strike", specialId: "annabeth_strategic", specialCharges: 4,
      stats: { hp: 110, atk: 16, def: 6, speed: 180 }, color: "#c0c0d0", unlocked: true },
    { id: "jason", name: "Jason Grace", series: "hoo", desc: "Son of Jupiter. Lightning.",
      specialName: "Lightning Bolt", specialId: "jason_lightning", specialCharges: 3,
      stats: { hp: 95, atk: 13, def: 5, speed: 165 }, color: "#7832a0", unlocked: true },
    { id: "piper", name: "Piper McLean", series: "hoo", desc: "Daughter of Aphrodite. Charmspeak.",
      specialName: "Charmspeak", specialId: "piper_charmspeak", specialCharges: 2,
      stats: { hp: 85, atk: 10, def: 6, speed: 175 }, color: "#e8a0d0", unlocked: false },
    { id: "leo", name: "Leo Valdez", series: "hoo", desc: "Son of Hephaestus. Fire wielder.",
      specialName: "Fire Blast", specialId: "leo_fire", specialCharges: 3,
      stats: { hp: 85, atk: 13, def: 4, speed: 180 }, color: "#e85020", unlocked: false },
    { id: "frank", name: "Frank Zhang", series: "hoo", desc: "Son of Mars. Shapeshifter.",
      specialName: "Beast Form", specialId: "frank_beast", specialCharges: 2,
      stats: { hp: 110, atk: 11, def: 7, speed: 140 }, color: "#7832a0", unlocked: false },
    { id: "hazel", name: "Hazel Levesque", series: "hoo", desc: "Daughter of Pluto. Mist control.",
      specialName: "Mist Control", specialId: "hazel_mist", specialCharges: 3,
      stats: { hp: 90, atk: 10, def: 6, speed: 160 }, color: "#d4a017", unlocked: false },
    { id: "nico", name: "Nico di Angelo", series: "pjo", desc: "Son of Hades. Shadow travel.",
      specialName: "Shadow Travel", specialId: "nico_shadow", specialCharges: 3,
      stats: { hp: 80, atk: 15, def: 4, speed: 175 }, color: "#2a2a3c", unlocked: false },
    { id: "reyna", name: "Reyna Ramírez-Arellano", series: "hoo", desc: "Praetor of Camp Jupiter.",
      specialName: "Rallying Cry", specialId: "reyna_rally", specialCharges: 2,
      stats: { hp: 100, atk: 12, def: 7, speed: 155 }, color: "#e8c040", unlocked: false },
    { id: "will", name: "Will Solace", series: "pjo", desc: "Son of Apollo. Healer.",
      specialName: "Heal Hymn", specialId: "will_heal", specialCharges: 4,
      stats: { hp: 95, atk: 9, def: 5, speed: 160 }, color: "#e8d44a", unlocked: false },
    { id: "carter", name: "Carter Kane", series: "kc", desc: "Eye of Horus. Avatar combat.",
      specialName: "Avatar Combat", specialId: "carter_avatar", specialCharges: 2,
      stats: { hp: 100, atk: 14, def: 6, speed: 155 }, color: "#2050a0", unlocked: false },
    { id: "sadie", name: "Sadie Kane", series: "kc", desc: "Master of Divine Words.",
      specialName: "Divine Words", specialId: "sadie_divine", specialCharges: 3,
      stats: { hp: 85, atk: 13, def: 5, speed: 170 }, color: "#a050c8", unlocked: false },
    { id: "magnus", name: "Magnus Chase", series: "mc", desc: "Son of Frey. Einherji healer.",
      specialName: "Heal Burst", specialId: "magnus_heal", specialCharges: 5,
      stats: { hp: 130, atk: 12, def: 8, speed: 160 }, color: "#2a8a4e", unlocked: true },
    { id: "alex", name: "Alex Fierro", series: "mc", desc: "Child of Loki. Shapeshifter.",
      specialName: "Shapeshifter", specialId: "alex_shift", specialCharges: 3,
      stats: { hp: 85, atk: 12, def: 5, speed: 180 }, color: "#50c878", unlocked: false },
    { id: "meg", name: "Meg McCaffrey", series: "toa", desc: "Daughter of Demeter. Karpos summoner.",
      specialName: "Karpos Summon", specialId: "meg_karpos", specialCharges: 3,
      stats: { hp: 90, atk: 11, def: 6, speed: 165 }, color: "#4bc76e", unlocked: false }
  ];

  function getById(id) {
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].id === id) return roster[i];
    }
    return null;
  }

  return { roster: roster, getById: getById };
})();
