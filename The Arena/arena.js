/* ============================================================
   The Arena — real-time demigod action RPG (tile + interiors)
   ============================================================ */
(function () {
"use strict";

// ===== CONFIG =====
const W = 960, H = 600;
const TS = 32; // tile size
const PLAYER_SPEED = 170;

// ===== WEAPONS =====
const WEAPONS = {
  bronze:   { name: "Bronze Dagger",      dmg: 8,  reach: 28, cd: 0.32 },
  c1:       { name: "Bolt of Zeus",        dmg: 18, reach: 38, cd: 0.45 },
  c2:       { name: "Sacred Mace (Hera)",  dmg: 11, reach: 30, cd: 0.32 },
  c3:       { name: "Riptide (Poseidon)",  dmg: 16, reach: 34, cd: 0.32 },
  c4:       { name: "Sickle (Demeter)",    dmg: 12, reach: 30, cd: 0.30 },
  c5:       { name: "Spear of Ares",       dmg: 15, reach: 40, cd: 0.40 },
  c6:       { name: "Owl Blade (Athena)",  dmg: 13, reach: 32, cd: 0.28 },
  c7:       { name: "Bow of Apollo",       dmg: 12, reach: 220, cd: 0.45, ranged: true },
  c8:       { name: "Hunters' Knife (Artemis)", dmg: 14, reach: 30, cd: 0.26 },
  c9:       { name: "War Hammer (Hephaestus)",  dmg: 20, reach: 36, cd: 0.55 },
  c10:      { name: "Charm Dagger (Aphrodite)", dmg: 10, reach: 28, cd: 0.24 },
  c11:      { name: "Caduceus (Hermes)",   dmg: 11, reach: 30, cd: 0.22 },
  c12:      { name: "Vine Whip (Dionysus)", dmg: 12, reach: 42, cd: 0.35 },
  gold:     { name: "Gold Sword",           dmg: 24, reach: 38, cd: 0.32 },
};

// ===== MONSTERS =====
const MONSTERS = {
  myrmeke:    { name: "Myrmeke",     level: 2, color: "#1a1a1a" },
  shark:      { name: "Shark",       level: 3, color: "#7a8492" },
  demigod:    { name: "Demigod",     level: 2, color: "#c0d860" },
  mrsDodds:   { name: "Mrs. Dodds",  level: 2, color: "#666c78" },
  empousa:    { name: "Empousa",     level: 4, color: "#e04848", note: "lures with charm" },
  hyperion:   { name: "Hyperion",    level: 5, color: "#ff5020" },
  hellhound:  { name: "Hellhound",   level: 3, color: "#1d1418" },
  dracaena:   { name: "Dracaena",    level: 3, color: "#3a8a4a" },
  laistry:    { name: "Laistrygonian Giant", level: 3, color: "#6b4422" },
  chimera:    { name: "Chimera",     level: 6, color: "#8a8076" },
  echidna:    { name: "Echidna",     level: 6, color: "#9a8276" },
  medusa:     { name: "Medusa",      level: 5, color: "#5aa860" },
  lotus:      { name: "Lotus Eater", level: 5, color: "#d090e0" },
  atlas:      { name: "Atlas",       level: 7, color: "#8c8c8c" },
  enceladus:  { name: "Enceladus",   level: 7, color: "#a06038" },
  procrustes: { name: "Procrustes",  level: 3, color: "#7d7d7d" },
  ghost:      { name: "Rogue Ghost", level: 3, color: "#c8d0e0" },
  thanatos:   { name: "Thanatos",    level: 6, color: "#0a0a0a", note: "freezes 3s on hit" },
  hades:      { name: "Hades",       level: 8, color: "#1a0a1a" },
  fury:       { name: "Fury",        level: 6, color: "#404048" },
  persephone: { name: "Persephone",  level: 6, color: "#a02030" },
  charon:     { name: "Charon",      level: 6, color: "#1a1a1a" },
  cerberus:   { name: "Cerberus",    level: 7, color: "#5a3a20" },
  sheep:      { name: "Sheep",       level: 4, color: "#f0f0f0" },
  polyphemus: { name: "Polyphemus",  level: 7, color: "#90897a" },
  scylla:     { name: "Scylla",      level: 6, color: "#c84040" },
  charybdis:  { name: "Charybdis",   level: 6, color: "#3060a0", note: "sucks you in" },
  circe:      { name: "Circe",       level: 6, color: "#a060c0" },
  siren:      { name: "Siren",       level: 6, color: "#9090a0" },
  ares:       { name: "Ares",        level: 6, color: "#c02020" },
  octavian:   { name: "Octavian",    level: 2, color: "#cfb98f" },
  legion:     { name: "Roman Legionnaire", level: 3, color: "#a04030" },
};

function statsFor(lv) {
  const table = {
    1: { hp: 25,  dmg: 3,  speed: 95 },
    2: { hp: 40,  dmg: 4,  speed: 105 },
    3: { hp: 60,  dmg: 5,  speed: 110 },
    4: { hp: 90,  dmg: 7,  speed: 115 },
    5: { hp: 130, dmg: 9,  speed: 120 },
    6: { hp: 180, dmg: 12, speed: 125 },
    7: { hp: 240, dmg: 15, speed: 130 },
    8: { hp: 330, dmg: 18, speed: 135 },
  };
  return table[lv] || table[3];
}

const CHARACTERS = {
  tyson:     { name: "Tyson",                 desc: "Cyclops half-brother. +20 max HP." },
  hazel:     { name: "Hazel Levesque",        desc: "Curses your foes with cursed gold." },
  selina:    { name: "Selina Beauregard",     desc: "Ace charioteer. Faster movement." },
  rachel:    { name: "Rachel Elizabeth Dare", desc: "Mortal oracle. Reveals weak points." },
  beckendorf:{ name: "Charles Beckendorf",    desc: "Hephaestus smith. Stronger weapons." },
  frank:     { name: "Frank Zhang",           desc: "Shapeshifter and bow master." },
  grover:    { name: "Grover Underwood",      desc: "Satyr scout. Sense quests." },
  piper:     { name: "Piper McLean",          desc: "Charmspeak disarms enemies briefly." },
  annabeth:  { name: "Annabeth Chase",        desc: "Strategist. Specials cooldown faster." },
  leo:       { name: "Leo Valdez",            desc: "Fire user. Burn-on-hit." },
  bianca:    { name: "Bianca di Angelo",      desc: "Hunter. Bonus crit chance." },
  nico:      { name: "Nico di Angelo",        desc: "Ghost King. Raise the dead." },
  clarisse:  { name: "Clarisse La Rue",       desc: "Ares' champion. +25% damage." },
  mrsOleary: { name: "Mrs. O'Leary",          desc: "Pet hellhound. Fights at your side." },
};

const ACHIEVEMENTS = {
  gladiator:     { icon: "⚔️", name: "Gladiator",            desc: "Fight 3 demigods in the Camp Half-Blood Arena." },
  firstBlood:    { icon: "🩸", name: "First Blood",          desc: "Kill a monster." },
  monsterSlayer: { icon: "💀", name: "Monster Slayer",       desc: "Kill 5 monsters." },
  citySlicker:   { icon: "🏙️", name: "City Slicker",         desc: "Visit Manhattan." },
  newRome:       { icon: "🏛️", name: "Welcome to New Rome",  desc: "Go to Camp Jupiter." },
  ghostKing:     { icon: "🪦", name: "Ghost King's Realm",   desc: "Go to the Underworld." },
  ascension:     { icon: "⚡", name: "Ascension",             desc: "Visit Olympus." },
};

const QUESTS = {
  bolt: {
    name: "The Master Bolt",
    desc: "Zeus's master bolt was stolen. Travel to the Underworld and retrieve it — Hades is the prime suspect.",
    reward: "A gold sword.",
  },
  fleece: {
    name: "The Golden Fleece",
    desc: "Sail to the Sea of Monsters and steal the Golden Fleece from Polyphemus's island.",
    reward: "The Golden Fleece (heals on use).",
  },
  artemis: {
    name: "Free Artemis",
    desc: "Atlas has tricked Artemis into bearing the sky. Defeat Atlas on Mount Tam.",
    reward: "A boar mount that fights and defends you.",
  },
};

// ===== TILE STYLES per map =====
// Each tile style returns a color for a tile at (col, row) using a simple hash.
function tileHash(c, r) { return ((c * 73856093) ^ (r * 19349663)) >>> 0; }
const TILE_STYLES = {
  grass:    (c, r) => ["#5a8a3a","#658f3f","#557f35","#618c3b","#598a39"][tileHash(c,r) % 5],
  sand:     (c, r) => ["#d4b06a","#c8a05a","#dfb872","#cda863","#d8b070"][tileHash(c,r) % 5],
  pavement: (c, r) => ["#7a7a82","#85858d","#6e6e76","#7d7d85","#80808a"][tileHash(c,r) % 5],
  city:     (c, r) => ["#4a4a58","#525261","#3f3f4d","#494957","#525261"][tileHash(c,r) % 5],
  cave:     (c, r) => ["#2a1d2d","#321e30","#241827","#2c1d2d","#3a2230"][tileHash(c,r) % 5],
  water:    (c, r) => ["#3a78b0","#3170a8","#4a82b8","#3974ac","#3478b0"][tileHash(c,r) % 5],
  cloud:    (c, r) => ["#dde4ff","#e2e9ff","#d6dff8","#e6ecff","#dee7ff"][tileHash(c,r) % 5],
  shadow:   (c, r) => ["#1a0710","#220a18","#180510","#1f0814","#1a0712"][tileHash(c,r) % 5],
  wood:     (c, r) => ["#8a5a30","#80522a","#90603a","#7a4d28","#88582e"][tileHash(c,r) % 5],
  stone:    (c, r) => ["#6e6e6e","#787878","#666666","#727272","#6a6a6a"][tileHash(c,r) % 5],
  arena:    (c, r) => ["#b8843c","#a87836","#c0883e","#ad7c38","#b27e3a"][tileHash(c,r) % 5],
  marble:   (c, r) => ["#e8e6dd","#dad6c8","#e2dfd4","#d6d2c4","#e0dcd0"][tileHash(c,r) % 5],
  // overworld: per-region colors
  overworld: (c, r) => {
    const x = c * TS, y = r * TS;
    // 3x2 region grid
    const reg = (y < H/2 ? 0 : 1) * 3 + (x < W/3 ? 0 : (x < 2*W/3 ? 1 : 2));
    const palettes = [
      ["#5a8a3a","#658f3f","#557f35","#618c3b"], // 0: camp-hb area
      ["#3a78b0","#3170a8","#4a82b8","#3974ac"], // 1: long island
      ["#c89a5a","#b88c4a","#d0a062","#c2954e"], // 2: camp jupiter
      ["#5e5e6e","#666674","#54545f","#5a5a68"], // 3: manhattan
      ["#d4a847","#c89c3a","#dab050","#c89e3c"], // 4: vegas
      ["#d4664a","#c8583c","#dc6e54","#c85940"], // 5: l.a.
    ];
    const p = palettes[reg];
    return p[tileHash(c, r) % p.length];
  },
};

// ===== MAPS =====
function pos(x, y, w, h) { return { x, y, w, h }; }

const MAPS = {
  // ============ MAIN OVERWORLD ============
  main: {
    label: "The World",
    tileStyle: "overworld",
    spawn: { x: 480, y: 320 },
    subzones: [
      { id: "camp-hb",     name: "Camp Half-Blood",   outdoor: true, ...pos( 40,  40, 240, 200), color: "#a8c97e", action: { type: "goto", to: "camp-hb" } },
      { id: "long-island", name: "Long Island Sound", outdoor: true, ...pos(360,  40, 240, 200), color: "#5a93c8", action: { type: "goto", to: "long-island" } },
      { id: "camp-j",      name: "Camp Jupiter",      outdoor: true, ...pos(680,  40, 240, 200), color: "#c89a5a", action: { type: "goto", to: "camp-j", achievement: "newRome" } },
      { id: "manhattan",   name: "Manhattan",         outdoor: true, ...pos( 40, 360, 240, 200), color: "#7e7e8c", action: { type: "goto", to: "manhattan", achievement: "citySlicker" } },
      { id: "vegas",       name: "Las Vegas",         outdoor: true, ...pos(360, 360, 240, 200), color: "#d4a847", action: { type: "goto", to: "vegas" } },
      { id: "la",          name: "L.A.",              outdoor: true, ...pos(680, 360, 240, 200), color: "#e08068", action: { type: "goto", to: "la" } },
    ],
  },

  // ============ CAMP HALF-BLOOD ============
  "camp-hb": {
    label: "Camp Half-Blood",
    parent: "main",
    tileStyle: "grass",
    spawn: { x: 480, y: 540 },
    subzones: [
      ...Array.from({ length: 12 }, (_, i) => {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const gx = 40 + col * 150;
        const gy = 30 + row * 110;
        const cabinNames = ["Zeus","Hera","Poseidon","Demeter","Ares","Athena","Apollo","Artemis","Hephaestus","Aphrodite","Hermes","Dionysus"];
        const cabinColors = ["#fff7a8","#dfd0ff","#9bd0f0","#d8ef9b","#f09898","#e8e0b8","#fff0a0","#d0e8ff","#d4a070","#ffc8d8","#d0d0d0","#b88dd0"];
        return {
          id: `cabin${i+1}`,
          name: `Cabin ${i+1}: ${cabinNames[i]}`,
          x: gx, y: gy, w: 110, h: 70,
          color: cabinColors[i],
          interior: "cabin",
          action: { type: "cabin", weapon: `c${i+1}`, label: cabinNames[i] },
        };
      }),
      { id: "arena",     name: "Arena",         ...pos(360, 380, 200, 130), color: "#c98a4a", interior: "arena",    action: { type: "arena" } },
      { id: "bighouse",  name: "Big House",     ...pos( 60, 380, 200, 130), color: "#854a2a", interior: "bighouse", action: { type: "bighouse" } },
      { id: "myrmekes",  name: "Myrmekes Lair", ...pos(680, 380, 200, 130), color: "#2a2a2a", interior: "lair",     action: { type: "fight", mons: ["myrmeke","myrmeke","myrmeke"], reward: "First Blood" } },
    ],
  },

  // ============ LONG ISLAND SOUND ============
  "long-island": {
    label: "Long Island Sound",
    parent: "main",
    tileStyle: "water",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "som-portal", name: "Sea of Monsters →",  ...pos( 80, 70, 280, 180), color: "#5aa8d8", interior: "portal", action: { type: "goto", to: "sea-of-monsters" } },
      { id: "poseidon",   name: "Poseidon's Palace",  ...pos(600, 70, 280, 180), color: "#7ac8f0", interior: "palace", action: { type: "fight", mons: ["shark","shark"], unlock: "tyson", reqInfo: "Defeat the sharks to unlock Tyson." } },
    ],
  },

  // ============ CAMP JUPITER ============
  "camp-j": {
    label: "Camp Jupiter",
    parent: "main",
    tileStyle: "sand",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "temple-j",   name: "Temple of Jupiter", ...pos( 60,  60, 220, 140), color: "#e8c068", interior: "temple", action: { type: "dialog", id: "octavian" } },
      { id: "temple-m",   name: "Temple of Mars",    ...pos(360,  60, 240, 140), color: "#c84040", interior: "temple", action: { type: "shop", id: "mars" } },
      { id: "field-mars", name: "Field of Mars",     ...pos(680,  60, 220, 140), color: "#8a4030", interior: "fortress", action: { type: "fight", mons: ["legion","legion","legion","legion"], unlock: "hazel", reqInfo: "Invade the fortress to unlock Hazel." } },
      { id: "mess",       name: "Mess Hall",         ...pos(360, 380, 240, 140), color: "#d4b878", interior: "mess",  action: { type: "heal", amount: "full", msg: "You eat your fill. Fully healed." } },
    ],
  },

  // ============ MANHATTAN ============
  "manhattan": {
    label: "Manhattan",
    parent: "main",
    tileStyle: "city",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "central-park", name: "Central Park",    ...pos( 30,  30, 200, 120), color: "#7ea860", interior: "portal", action: { type: "goto", to: "underworld", achievement: "ghostKing", msg: "You found the hidden entrance to the Underworld." } },
      { id: "met",          name: "The MET",         ...pos( 30, 170, 200, 120), color: "#a09078", interior: "museum", action: { type: "fight", mons: ["mrsDodds"], unlock: "selina", reqInfo: "Defeat Mrs. Dodds to unlock Selina." } },
      { id: "plaza",        name: "The Plaza",       ...pos(260,  30, 200, 120), color: "#c8a060", interior: "hotel",  action: { type: "fight", mons: ["empousa"], grant: "automatons", reqInfo: "Defeat the Empousa to summon the automatons." } },
      { id: "grand-central",name: "Grand Central",   ...pos(260, 170, 200, 120), color: "#9c8a60", interior: "station",action: { type: "fight", mons: ["hyperion"], allyIfFlag: "automatons", allyMons: "demigod", reqInfo: "Defeat Hyperion. Defeated Empousa? Hermes statue helps." } },
      { id: "wmbridge",     name: "Williamsburg Br.",...pos(490,  30, 200, 120), color: "#6a6a78", interior: "bridge", action: { type: "fight", mons: ["hellhound","hellhound","hellhound","hellhound","hellhound"], packBonus: true, unlock: "mrsOleary", reqInfo: "Win to befriend Mrs. O'Leary." } },
      { id: "meriwether",   name: "Meriwether Prep", ...pos(490, 170, 200, 120), color: "#a89868", interior: "school", action: { type: "fight", mons: ["laistry","laistry","laistry"], unlock: "rachel", reqInfo: "Defeat the Giants to unlock Rachel." } },
      { id: "library",      name: "NY Public Library",...pos(720, 30, 210, 120), color: "#b89870", interior: "library",action: { type: "fight", mons: ["dracaena","dracaena","dracaena"], packBonus: true, allyIfFlag: "automatons", unlock: "beckendorf", reqInfo: "Have automatons? The lion statue will help. Unlocks Beckendorf." } },
      { id: "esb",          name: "Empire State Bldg",...pos(720,170, 210, 120), color: "#7080a0", interior: "portal", action: { type: "goto", to: "olympus", achievement: "ascension" } },
    ],
  },

  // ============ LAS VEGAS ============
  "vegas": {
    label: "Las Vegas",
    parent: "main",
    tileStyle: "sand",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "arch",      name: "Gateway Arch",     ...pos( 60,  60, 240, 240), color: "#b8b8b8", interior: "arch",     action: { type: "fight", mons: ["chimera","echidna"], unlock: "frank", reqInfo: "Defeat Chimera & Echidna to unlock Frank." } },
      { id: "garden",    name: "Auntie Em's",      ...pos(360,  60, 240, 240), color: "#7aa84a", interior: "garden",   action: { type: "fight", mons: ["medusa"], unlock: "grover", reqInfo: "Defeat Medusa to unlock Grover." } },
      { id: "lotus",     name: "Lotus Hotel",      ...pos(660,  60, 240, 240), color: "#e0a8d8", interior: "hotel",    action: { type: "fight", mons: Array(10).fill("lotus"), unlock: "piper", reqInfo: "Win against 10 lotus eaters to unlock Piper." } },
    ],
  },

  // ============ L.A. ============
  "la": {
    label: "L.A.",
    parent: "main",
    tileStyle: "pavement",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "mt-tam",     name: "Mount Tam",                ...pos( 30,  60, 220, 240), color: "#8c8c8c", interior: "mountain", action: { type: "fight", mons: ["atlas"], unlock: "annabeth", quest: "artemis", reqInfo: "Defeat Atlas to free Artemis and unlock Annabeth." } },
      { id: "mt-diablo",  name: "Mount Diablo",             ...pos(280,  60, 220, 240), color: "#a04030", interior: "mountain", action: { type: "fight", mons: ["enceladus"], unlock: "leo", reqInfo: "Defeat Enceladus to unlock Leo." } },
      { id: "crusty",     name: "Crusty's Waterbed Palace", ...pos(530,  60, 200, 240), color: "#aaa",    interior: "shop",     action: { type: "fight", mons: ["procrustes"], unlock: "bianca", reqInfo: "Defeat Procrustes to unlock Bianca." } },
      { id: "doa",        name: "D.O.A. Studio",            ...pos(760,  60, 170, 240), color: "#1a1a1a", interior: "portal",   action: { type: "goto", to: "underworld", achievement: "ghostKing" } },
    ],
  },

  // ============ UNDERWORLD ============
  "underworld": {
    label: "The Underworld",
    parent: "main",
    tileStyle: "shadow",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "tartarus-portal", name: "Entrance to Tartarus", ...pos( 40,  60, 230, 180), color: "#1a0a1a", interior: "portal", action: { type: "goto", to: "tartarus" } },
      { id: "hades-palace",    name: "Palace of Hades",      ...pos(370,  60, 230, 180), color: "#4a2030", interior: "portal", action: { type: "goto", to: "hades-palace" } },
      { id: "asphodel",        name: "Fields of Asphodel",   ...pos(700,  60, 220, 180), color: "#6a5a6a", interior: "fields", action: { type: "fight", mons: ["ghost","ghost","ghost"], grant: "wingedShoes", reqInfo: "Win to claim the Winged Shoes (flight)." } },
      { id: "styx-exit",       name: "River Styx (Exit)",    ...pos(370, 380, 230, 150), color: "#0a4a6a", interior: "river",  action: { type: "fight", mons: ["charon","cerberus"], grant: "ghostArmy", reqInfo: "Survive Charon & Cerberus to gain Ghost Army (2 uses)." } },
    ],
  },

  // ============ PALACE OF HADES ============
  "hades-palace": {
    label: "Palace of Hades",
    parent: "underworld",
    tileStyle: "cave",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "entrance",   name: "Entrance",            ...pos( 40,  60, 280, 220), color: "#3a1a3a", interior: "throne",  action: { type: "fight", mons: ["thanatos"], msg: "Survive Thanatos and you keep your life." } },
      { id: "throne",     name: "Throne Room (Hades)", ...pos(360,  60, 240, 220), color: "#4a1a30", interior: "throne",  action: { type: "fight", mons: ["hades"], unlock: "nico", reqInfo: "Hades is hard. Try to reason with him — or defeat him to unlock Nico." } },
      { id: "hall",       name: "Hall of the Furies",  ...pos(640,  60, 240, 220), color: "#3a3030", interior: "throne",  action: { type: "fight", mons: ["fury","fury","fury"], unlock: "nico", reqInfo: "Defeat the Furies to unlock Nico." } },
      { id: "garden",     name: "Persephone's Garden", ...pos(290, 360, 360, 170), color: "#6a3060", interior: "garden",  action: { type: "fight", mons: ["persephone"], grant: "ghostArmy", reqInfo: "Defeat Persephone for Ghost Army (2 uses)." } },
    ],
  },

  // ============ SEA OF MONSTERS ============
  "sea-of-monsters": {
    label: "Sea of Monsters",
    parent: "long-island",
    tileStyle: "water",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "ccs",       name: "C.C.'s Spa & Resort",  ...pos( 40,  60, 220, 220), color: "#b070c0", interior: "spa",      action: { type: "fight", mons: ["circe"], grant: "waterbreath", reqInfo: "Defeat Circe to gain underwater breathing." } },
      { id: "polyphemus",name: "Polyphemus's Island",  ...pos(370,  60, 220, 220), color: "#a08050", interior: "cave",     action: { type: "fight", mons: ["polyphemus","sheep","sheep","sheep"], grant: "fleece", quest: "fleece", reqInfo: "Win to claim the Golden Fleece (healing item)." } },
      { id: "sirens",    name: "The Sirens",           ...pos(700,  60, 220, 220), color: "#a0a0c0", interior: "cliff",    action: { type: "fight", mons: ["siren","siren","siren"], rangedRequired: true, reqInfo: "Their song drags you in — bow recommended." } },
      { id: "scylla",    name: "Scylla & Charybdis",   ...pos(290, 360, 380, 180), color: "#7a3040", interior: "cliff",    action: { type: "fight", mons: ["scylla","charybdis"], unlock: "clarisse", reqInfo: "Get past Scylla & Charybdis to unlock Clarisse." } },
    ],
  },

  // ============ OLYMPUS ============
  olympus: {
    label: "Olympus (600th Floor)",
    parent: "main",
    tileStyle: "cloud",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "throne-hall", name: "Throne Hall",      ...pos(280,  80, 400, 240), color: "#fffae0", interior: "throne",  action: { type: "dialog", id: "olympus" } },
      { id: "muses",       name: "Hall of Muses",    ...pos( 40, 380, 280, 140), color: "#e0f0ff", interior: "temple",  action: { type: "heal", amount: 50, msg: "The Muses sing — you recover 50 HP." } },
      { id: "forge",       name: "Hephaestus' Forge",...pos(640, 380, 280, 140), color: "#a06040", interior: "forge",   action: { type: "shop", id: "forge" } },
    ],
  },

  // ============ TARTARUS ============
  tartarus: {
    label: "Tartarus",
    parent: "underworld",
    tileStyle: "shadow",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "pit",      name: "The Pit",            ...pos(180,  60, 280, 240), color: "#2a0a1a", interior: "cave", action: { type: "fight", mons: ["fury","fury","hellhound","hellhound","hellhound"], packBonus: true, msg: "You survived the Pit. The dark whispers fade." } },
      { id: "doors",    name: "Doors of Death",     ...pos(500,  60, 280, 240), color: "#1a0a05", interior: "cave", action: { type: "fight", mons: ["thanatos","cerberus"], msg: "You sealed the Doors of Death." } },
    ],
  },
};

// ===== STATE =====
const G = {
  canvas: null, ctx: null, hud: null, toastStack: null, overlay: null, overlayPanel: null,
  keys: {}, pressedThisFrame: {},
  lastT: 0,
  mode: "play",              // play | interior | combat | menu
  mapId: "camp-hb",
  prevMapId: null,
  player: null,
  entities: [],
  combat: null,
  swing: null,
  interior: null,            // { zone, w, h, walls, door, objects, player }
  exitCooldown: 0,           // grace after entering/leaving interiors
};

function defaultPlayer() {
  return {
    x: 480, y: 540, w: 18, h: 18,
    dir: { x: 0, y: -1 },
    hp: 100, maxHp: 100,
    weapon: "bronze",
    weapons: ["bronze"],
    characters: [],
    achievements: [],
    flags: {},
    arenaWins: 0,
    monsterKills: 0,
    quests: { bolt: "available", fleece: "available", artemis: "available" },
    specialCooldown: 0,
    moveSpeed: PLAYER_SPEED,
  };
}

// ===== SAVE / LOAD =====
const SAVE_KEY = "theArena.save.v2";

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      player: G.player, mapId: G.mapId,
    }));
  } catch (e) {}
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    G.player = Object.assign(defaultPlayer(), data.player || {});
    G.mapId = data.mapId || "camp-hb";
    return true;
  } catch (e) { return false; }
}
function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  G.player = defaultPlayer();
  G.mapId = "camp-hb";
  G.mode = "play";
  G.interior = null;
  enterMap("camp-hb");
  toast("New game started.", "info");
  save();
}

// ===== TOAST / HUD =====
function toast(msg, kind) {
  const el = document.createElement("div");
  el.className = "toast " + (kind || "");
  el.textContent = msg;
  G.toastStack.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}
function updateHUD() {
  let label = MAPS[G.mapId].label;
  if (G.mode === "interior" && G.interior) label += " — " + G.interior.zone.name;
  document.getElementById("loc-label").textContent = label;
  document.getElementById("hp-label").textContent = `HP ${Math.max(0, Math.round(G.player.hp))}/${G.player.maxHp}`;
  document.getElementById("hp-fill").style.width = (100 * G.player.hp / G.player.maxHp) + "%";
  document.getElementById("weapon-label").textContent = WEAPONS[G.player.weapon].name;
  document.getElementById("special-pip").classList.toggle("cooldown", G.player.specialCooldown > 0);
}

// ===== OVERLAY =====
function openOverlay(html) {
  G.overlayPanel.innerHTML = html;
  G.overlay.classList.add("open");
  G._prevMode = G.mode;
  G.mode = "menu";
}
function closeOverlay() {
  G.overlay.classList.remove("open");
  G.overlayPanel.innerHTML = "";
  G.mode = G._prevMode || (G.combat ? "combat" : (G.interior ? "interior" : "play"));
}
function openInventory() {
  const p = G.player;
  let html = `<h2>Inventory</h2>`;
  html += `<h3>Weapons</h3><div class="grid">`;
  Object.keys(WEAPONS).forEach(k => {
    const w = WEAPONS[k];
    const owned = p.weapons.includes(k);
    const active = p.weapon === k;
    html += `<div class="item ${owned ? (active?'active':'') : 'locked'}" data-weapon="${k}">
      <span class="name">${w.name}</span>
      <span class="meta">${w.dmg} dmg · ${w.ranged?'ranged':'melee'}${owned?(active?' · equipped':' · click to equip'):' · locked'}</span>
    </div>`;
  });
  html += `</div>`;
  html += `<h3>Heroes</h3><div class="grid">`;
  Object.keys(CHARACTERS).forEach(k => {
    const c = CHARACTERS[k];
    const owned = p.characters.includes(k);
    html += `<div class="item ${owned?'':'locked'}">
      <span class="name">${c.name}</span>
      <span class="meta">${owned ? c.desc : "Locked"}</span>
    </div>`;
  });
  html += `</div>`;
  const items = [];
  if (p.flags.wingedShoes) items.push({ n: "Winged Shoes", d: "Flight (faster movement)" });
  if (p.flags.fleece)       items.push({ n: "Golden Fleece", d: "Heal to full once" });
  if (p.flags.waterbreath)  items.push({ n: "Underwater Breathing", d: "Sea travel safe" });
  if (p.flags.automatons)   items.push({ n: "Manhattan Automatons", d: "Statue allies in NY" });
  if (typeof p.flags.ghostArmyUses === "number" && p.flags.ghostArmyUses > 0)
    items.push({ n: `Ghost Army (×${p.flags.ghostArmyUses})`, d: "Press special in combat to summon" });
  if (p.flags.boar)         items.push({ n: "Boar Mount", d: "Rideable ally — defends you" });
  if (items.length === 0) items.push({ n: "—", d: "No items yet" });
  html += `<h3>Items</h3><div class="grid">`;
  items.forEach(it => html += `<div class="item"><span class="name">${it.n}</span><span class="meta">${it.d}</span></div>`);
  html += `</div>`;
  html += `<h3>Achievements</h3><div class="grid">`;
  Object.keys(ACHIEVEMENTS).forEach(k => {
    const a = ACHIEVEMENTS[k];
    const owned = p.achievements.includes(k);
    html += `<div class="item ${owned?'':'locked'}">
      <span class="name">${a.icon} ${a.name}</span>
      <span class="meta">${a.desc}</span>
    </div>`;
  });
  html += `</div>`;
  html += `<h3>Quests</h3><div class="grid">`;
  Object.keys(QUESTS).forEach(k => {
    const q = QUESTS[k];
    const s = p.quests[k] || "available";
    html += `<div class="item ${s==='complete'?'active':(s==='inprogress'?'':'locked')}">
      <span class="name">${q.name} ${s==='complete'?'✓':''}</span>
      <span class="meta">${q.desc}<br><b>Reward:</b> ${q.reward}</span>
    </div>`;
  });
  html += `</div>`;
  html += `<div style="display:flex;gap:8px;"><button id="close-inv">Close (Shift / Esc)</button></div>`;
  openOverlay(html);
  document.getElementById("close-inv").onclick = closeOverlay;
  G.overlayPanel.querySelectorAll("[data-weapon]").forEach(el => {
    el.onclick = () => {
      const k = el.getAttribute("data-weapon");
      if (G.player.weapons.includes(k)) {
        G.player.weapon = k; save(); openInventory();
        toast("Equipped " + WEAPONS[k].name, "info");
      } else toast("Locked — visit Cabin " + (parseInt(k.slice(1))||"?"), "bad");
    };
  });
}
function openDialog(opts) {
  let html = `<h2>${opts.title}</h2><p style="line-height:1.7;color:var(--text);margin-bottom:1rem;">${opts.text}</p>`;
  html += `<div class="choice-list">`;
  opts.choices.forEach((c, i) => html += `<button data-choice="${i}">${c.label}</button>`);
  html += `</div>`;
  openOverlay(html);
  G.overlayPanel.querySelectorAll("[data-choice]").forEach(el => {
    el.onclick = () => {
      const i = parseInt(el.getAttribute("data-choice"));
      const c = opts.choices[i];
      closeOverlay();
      if (c.onClick) c.onClick();
    };
  });
}
function openShop(id) {
  const shops = {
    bighouse: {
      title: "Big House — Chiron's Provisions",
      lines: ["Chiron offers you supplies. Nectar and ambrosia keep you fighting."],
      items: [
        { label: "Heal 30 HP",   run: () => { heal(30); toast("+30 HP", "good"); }},
        { label: "Heal to Full", run: () => { G.player.hp = G.player.maxHp; toast("Healed.", "good"); save(); }},
        { label: "Talk to Chiron (Quests)", run: () => openChiron() },
      ],
    },
    mars: {
      title: "Temple of Mars — Weapon Stand",
      lines: ["Roman steel rests on the altar. Take what you can use."],
      items: [{ label: "Take Pilum (Spear of Ares)", run: () => { addWeapon("c5"); toast("Acquired Spear of Ares.", "good"); }}],
    },
    forge: {
      title: "Hephaestus' Forge — Olympus",
      lines: ["Hephaestus tunes a celestial bronze edge for you."],
      items: [{ label: "Take Gold Sword", run: () => { addWeapon("gold"); toast("Acquired Gold Sword.", "good"); }}],
    },
  };
  const s = shops[id]; if (!s) { closeOverlay(); return; }
  let html = `<h2>${s.title}</h2>`;
  s.lines.forEach(l => html += `<p style="margin-bottom:.6rem;color:var(--muted);">${l}</p>`);
  html += `<div class="choice-list">`;
  s.items.forEach((it, i) => html += `<button data-i="${i}">${it.label}</button>`);
  html += `</div><div style="margin-top:.75rem;"><button class="secondary" id="leave">Leave</button></div>`;
  openOverlay(html);
  G.overlayPanel.querySelectorAll("[data-i]").forEach(el => {
    el.onclick = () => { s.items[parseInt(el.dataset.i)].run(); save(); closeOverlay(); };
  });
  document.getElementById("leave").onclick = closeOverlay;
}
function openChiron() {
  const p = G.player;
  const choices = [];
  Object.keys(QUESTS).forEach(qk => {
    const q = QUESTS[qk];
    const s = p.quests[qk];
    if (s === "available") {
      choices.push({ label: `Accept: ${q.name}`, onClick: () => { p.quests[qk] = "inprogress"; save(); toast(`Quest started: ${q.name}`, "info"); }});
    } else if (s === "inprogress") {
      choices.push({ label: `In progress: ${q.name}`, onClick: () => toast("Already on it.", "info") });
    } else {
      choices.push({ label: `✓ ${q.name}`, onClick: () => toast("Quest complete.", "good") });
    }
  });
  choices.push({ label: "Leave", onClick: () => {} });
  openDialog({
    title: "Chiron",
    text: "\"Hero, the Fates are restless. Three quests need a champion. Which will you take?\"",
    choices,
  });
}

// ===== TRIGGER ACTIONS =====
function triggerAction(zone) {
  const a = zone.action;
  if (!a) return;
  const p = G.player;
  if (a.type === "goto") {
    if (a.achievement) grantAchievement(a.achievement);
    if (a.msg) toast(a.msg, "info");
    leaveInterior(false);
    enterMap(a.to);
    return;
  }
  if (a.type === "cabin") {
    if (!p.weapons.includes(a.weapon)) {
      p.weapons.push(a.weapon);
      p.weapon = a.weapon;
      toast(`${a.label}'s gift — acquired ${WEAPONS[a.weapon].name}.`, "good");
      save();
    } else {
      toast(`${a.label}'s cabin. You already took the weapon.`, "info");
    }
    return;
  }
  if (a.type === "bighouse") { openShop("bighouse"); return; }
  if (a.type === "shop")     { openShop(a.id); return; }
  if (a.type === "heal") {
    if (a.amount === "full") p.hp = p.maxHp; else heal(a.amount);
    toast(a.msg || "Healed.", "good"); save(); return;
  }
  if (a.type === "dialog")   { openDialogScene(a.id); return; }
  if (a.type === "arena") {
    startCombat({
      mons: ["demigod"],
      label: "Camp Arena Duel",
      onWin: () => {
        p.arenaWins++;
        toast(`Arena wins: ${p.arenaWins}/3`, "info");
        if (p.arenaWins >= 3) grantAchievement("gladiator");
        save();
      }
    });
    return;
  }
  if (a.type === "fight") {
    if (a.reqInfo) toast(a.reqInfo, "info");
    startCombat({
      mons: a.mons,
      label: zone.name,
      packBonus: !!a.packBonus,
      allyIfFlag: a.allyIfFlag,
      rangedRequired: !!a.rangedRequired,
      onWin: () => {
        if (a.unlock)  unlockCharacter(a.unlock);
        if (a.grant)   grantFlag(a.grant);
        if (a.quest)   completeQuest(a.quest);
        if (a.msg)     toast(a.msg, "good");
        save();
      },
    });
    return;
  }
}
function openDialogScene(id) {
  if (id === "octavian") {
    openDialog({
      title: "Octavian, Augur of Camp Jupiter",
      text: "\"The omens are clear! You must march on Camp Half-Blood at dawn… or buy more stuffed animals for sacrifice. Either way, war is the answer.\"",
      choices: [
        { label: "Ignore his terrible advice.", onClick: () => toast("Wise choice.", "info") },
        { label: "Sigh. Loudly.", onClick: () => toast("Octavian glares.", "info") },
      ],
    });
  } else if (id === "olympus") {
    openDialog({
      title: "The Throne of the Gods",
      text: "Twelve thrones tower above you. Zeus's lightning crackles. The gods size you up. \"You are welcome here, hero. For now.\"",
      choices: [
        { label: "Bow respectfully.", onClick: () => { grantAchievement("ascension"); toast("Your name is remembered on Olympus.", "good"); }},
        { label: "Leave.", onClick: () => {}},
      ],
    });
  }
}

// ===== UNLOCKS =====
function grantAchievement(id) {
  if (!ACHIEVEMENTS[id]) return;
  if (G.player.achievements.includes(id)) return;
  G.player.achievements.push(id);
  toast(`Achievement: ${ACHIEVEMENTS[id].icon} ${ACHIEVEMENTS[id].name}`, "good");
  save();
}
function unlockCharacter(id) {
  if (!CHARACTERS[id]) return;
  if (G.player.characters.includes(id)) return;
  G.player.characters.push(id);
  toast(`Hero unlocked: ${CHARACTERS[id].name}`, "good");
  if (id === "tyson") { G.player.maxHp += 20; G.player.hp += 20; }
  if (id === "selina") { G.player.moveSpeed = PLAYER_SPEED * 1.15; }
  save();
}
function grantFlag(name) {
  if (name === "automatons") { G.player.flags.automatons = true; toast("Automatons available in Manhattan.", "good"); }
  else if (name === "wingedShoes") { G.player.flags.wingedShoes = true; G.player.moveSpeed = Math.max(G.player.moveSpeed, PLAYER_SPEED * 1.25); toast("Winged Shoes equipped — you move faster.", "good"); }
  else if (name === "waterbreath") { G.player.flags.waterbreath = true; toast("You can now breathe underwater.", "good"); }
  else if (name === "fleece") { G.player.flags.fleece = true; toast("The Golden Fleece glows in your pack.", "good"); }
  else if (name === "ghostArmy") { G.player.flags.ghostArmyUses = (G.player.flags.ghostArmyUses || 0) + 2; toast("Ghost Army summons available: 2 charges.", "good"); }
  else if (name === "boar") { G.player.flags.boar = true; G.player.maxHp += 30; G.player.hp += 30; toast("A boar joins your side. +30 max HP.", "good"); }
  save();
}
function completeQuest(id) {
  if (G.player.quests[id] !== "complete") {
    G.player.quests[id] = "complete";
    toast(`Quest complete: ${QUESTS[id].name}`, "good");
    if (id === "bolt") addWeapon("gold");
    if (id === "fleece") G.player.flags.fleece = true;
    if (id === "artemis") grantFlag("boar");
  }
}
function addWeapon(k) { if (!G.player.weapons.includes(k)) { G.player.weapons.push(k); G.player.weapon = k; } }
function heal(amount) { G.player.hp = Math.min(G.player.maxHp, G.player.hp + amount); }
function onKillMonster() {
  G.player.monsterKills++;
  grantAchievement("firstBlood");
  if (G.player.monsterKills >= 5) grantAchievement("monsterSlayer");
  save();
}

// ===== COMBAT =====
function startCombat(opts) {
  G.mode = "combat";
  G.combat = { label: opts.label || "Combat", onWin: opts.onWin || (()=>{}), onLose: opts.onLose, packBonus: !!opts.packBonus, allyIfFlag: opts.allyIfFlag, rangedRequired: !!opts.rangedRequired };
  G.entities = [];
  G.player.x = 100; G.player.y = H/2;
  (opts.mons || []).forEach((mid, i) => {
    const base = MONSTERS[mid]; if (!base) return;
    let lv = base.level;
    if (opts.packBonus && (mid === "hellhound" || mid === "dracaena")) lv = Math.min(8, lv + 1);
    const s = statsFor(lv);
    G.entities.push({
      mid, name: base.name, color: base.color, note: base.note,
      x: 700 + (i % 3) * 60 - 60 + (Math.random()*40 - 20),
      y: 120 + (i % 4) * 100 + (Math.random()*40 - 20),
      w: 22, h: 22,
      hp: s.hp, maxHp: s.hp, dmg: s.dmg, speed: s.speed,
      attackCd: 0, stunT: 0, level: lv,
    });
  });
  G.entities.forEach(e => { e.y = Math.max(60, Math.min(H - 60, e.y)); });
  if (opts.allyIfFlag && G.player.flags[opts.allyIfFlag]) {
    G.entities.push({ mid: "ally", name: "Bronze Automaton", color: "#d4a040", x: 160, y: H/2 + 60, w: 22, h: 22, hp: 80, maxHp: 80, dmg: 6, speed: 110, attackCd: 0, level: 4, ally: true });
    toast("An Automaton statue grinds to life and joins you.", "info");
  }
  if (G.combat.rangedRequired && !WEAPONS[G.player.weapon].ranged) toast("A ranged weapon (Bow of Apollo) would help here.", "info");
}
function endCombat(won) {
  if (won) { toast(`Victory: ${G.combat.label}`, "good"); G.combat.onWin && G.combat.onWin(); }
  else {
    toast("You fell. Respawning at Half-Blood Hill.", "bad");
    G.combat.onLose && G.combat.onLose();
    G.player.hp = G.player.maxHp;
    G.interior = null;
    enterMap("camp-hb");
  }
  G.combat = null; G.entities = []; G.swing = null;
  if (G.interior) G.mode = "interior"; else G.mode = "play";
  save();
}

// ===== MAP TRANSITIONS =====
function enterMap(id) {
  if (!MAPS[id]) return;
  G.prevMapId = G.mapId;
  G.mapId = id;
  const m = MAPS[id];
  G.player.x = m.spawn.x;
  G.player.y = m.spawn.y;
  G.interior = null;
  G.mode = "play";
  G.exitCooldown = 0.5;
  save();
}

// ===== BUILDINGS: walls & doors =====
const WALL_T = 8;
const DOOR_W = 44;
function buildingDoor(z) {
  return { x: z.x + z.w/2 - DOOR_W/2, y: z.y + z.h - WALL_T, w: DOOR_W, h: WALL_T + 4 };
}
function buildingWalls(z) {
  const d = buildingDoor(z);
  return [
    { x: z.x, y: z.y, w: z.w, h: WALL_T },                                      // top
    { x: z.x, y: z.y + z.h - WALL_T, w: d.x - z.x, h: WALL_T },                 // bottom-left
    { x: d.x + d.w, y: z.y + z.h - WALL_T, w: z.x + z.w - (d.x + d.w), h: WALL_T }, // bottom-right
    { x: z.x, y: z.y, w: WALL_T, h: z.h },                                      // left
    { x: z.x + z.w - WALL_T, y: z.y, w: WALL_T, h: z.h },                       // right
  ];
}

function collidesWithWalls(walls, x, y, w, h) {
  for (const r of walls) {
    if (x + w > r.x && x < r.x + r.w && y + h > r.y && y < r.y + r.h) return true;
  }
  return false;
}

function gatherOutdoorWalls(map) {
  const walls = [];
  for (const z of map.subzones) {
    if (z.outdoor) continue;
    walls.push(...buildingWalls(z));
  }
  return walls;
}

function tryMoveOutdoor(p, dx, dy) {
  const map = MAPS[G.mapId];
  const walls = map._walls = map._walls || gatherOutdoorWalls(map);
  const nx = p.x + dx;
  if (!collidesWithWalls(walls, nx, p.y, p.w, p.h)) p.x = nx;
  const ny = p.y + dy;
  if (!collidesWithWalls(walls, p.x, ny, p.w, p.h)) p.y = ny;
  p.x = Math.max(2, Math.min(W - 2 - p.w, p.x));
  p.y = Math.max(2, Math.min(H - 2 - p.h, p.y));
}

// ===== INTERIORS =====
const IW = 760, IH = 500;          // interior room size
const IX = (W - IW) / 2, IY = (H - IH) / 2;

function makeInterior(zone) {
  const kind = zone.interior || "cabin";
  const doorW = 80;
  const doorX = IX + IW/2 - doorW/2;
  const walls = [
    { x: IX,            y: IY,            w: IW,                h: WALL_T },                   // top
    { x: IX,            y: IY + IH - WALL_T, w: doorX - IX,        h: WALL_T },                // bottom-left
    { x: doorX + doorW, y: IY + IH - WALL_T, w: IX + IW - (doorX + doorW), h: WALL_T },        // bottom-right
    { x: IX,            y: IY,            w: WALL_T,             h: IH },                      // left
    { x: IX + IW - WALL_T, y: IY,         w: WALL_T,             h: IH },                      // right
  ];
  const door = { x: doorX, y: IY + IH - WALL_T - 2, w: doorW, h: WALL_T + 6 };

  const interior = {
    zone, kind, walls, door,
    objects: [],
    spawn: { x: IX + IW/2 - 9, y: IY + IH - 50 },
  };

  const cx = IX + IW/2, cy = IY + IH/2;
  const a = zone.action || {};

  function addPedestal(label, color, onStep, w=64, h=64) {
    interior.objects.push({ kind: "pedestal", x: cx - w/2, y: cy - h/2, w, h, label, color, onStep });
  }
  function addNPC(label, color, onStep) {
    interior.objects.push({ kind: "npc", x: cx - 18, y: cy - 40, w: 36, h: 44, label, color, onStep });
  }
  function addMonsters(mons, onContact) {
    mons.forEach((mid, i) => {
      const base = MONSTERS[mid] || { color: "#a44", name: mid };
      const cols = Math.min(4, mons.length);
      const r = Math.floor(i / cols), c = i % cols;
      interior.objects.push({
        kind: "monster", mid, name: base.name, color: base.color,
        x: IX + 80 + c * 90 + (Math.random()*20 - 10),
        y: IY + 70 + r * 70 + (Math.random()*20 - 10),
        w: 28, h: 28,
        onStep: onContact,
      });
    });
  }
  function addDecor(items) {
    items.forEach(it => interior.objects.push(Object.assign({ kind: "decor" }, it)));
  }

  if (a.type === "cabin") {
    addPedestal(`${a.label}'s gift`, "#ffe040", () => triggerAction(zone));
    // Beds
    addDecor([
      { x: IX + 40, y: IY + 60, w: 110, h: 60, color: "#a89878", label: "Bed" },
      { x: IX + IW - 150, y: IY + 60, w: 110, h: 60, color: "#a89878", label: "Bed" },
      { x: IX + 40, y: IY + IH - 120, w: 80, h: 30, color: "#5a3a20", label: "Trunk" },
      { x: IX + IW - 120, y: IY + IH - 120, w: 80, h: 30, color: "#5a3a20", label: "Trunk" },
    ]);
    // banner
    interior.banner = a.label;
  }
  else if (a.type === "bighouse") {
    addNPC("Chiron", "#7a4a2a", () => triggerAction(zone));
    addDecor([
      { x: IX + 40, y: IY + IH - 120, w: 160, h: 40, color: "#6a4a2a", label: "Couch" },
      { x: IX + IW - 200, y: IY + IH - 120, w: 160, h: 40, color: "#6a4a2a", label: "Couch" },
      { x: IX + 60, y: IY + 60, w: 80, h: 80, color: "#3a2812", label: "Bookshelf" },
      { x: IX + IW - 140, y: IY + 60, w: 80, h: 80, color: "#3a2812", label: "Bookshelf" },
    ]);
  }
  else if (a.type === "arena") {
    interior.objects.push({ kind: "ring", x: cx - 140, y: cy - 80, w: 280, h: 160, color: "#a87836", label: "Step inside to duel", onStep: () => triggerAction(zone) });
  }
  else if (a.type === "fight") {
    addMonsters(a.mons, () => triggerAction(zone));
    if (a.allyIfFlag && G.player.flags[a.allyIfFlag]) {
      addDecor([{ x: IX + IW/2 - 30, y: IY + IH - 100, w: 60, h: 50, color: "#d4a040", label: "Statue (will help)" }]);
    }
  }
  else if (a.type === "goto") {
    interior.objects.push({ kind: "portal", x: cx - 50, y: cy - 50, w: 100, h: 100, color: "#6080ff", label: zone.name, onStep: () => triggerAction(zone) });
  }
  else if (a.type === "heal") {
    interior.objects.push({ kind: "fountain", x: cx - 40, y: cy - 40, w: 80, h: 80, color: "#80d0ff", label: "Rest", onStep: () => triggerAction(zone) });
  }
  else if (a.type === "shop") {
    addNPC("Browse Wares", "#c0a060", () => triggerAction(zone));
    addDecor([
      { x: IX + 60, y: IY + 80, w: 100, h: 40, color: "#7a5a30", label: "Display" },
      { x: IX + IW - 160, y: IY + 80, w: 100, h: 40, color: "#7a5a30", label: "Display" },
    ]);
  }
  else if (a.type === "dialog") {
    addNPC("Speak", "#ddb060", () => triggerAction(zone));
  }

  return interior;
}

function enterInterior(zone) {
  G.interior = makeInterior(zone);
  // Place player just inside the door
  G.player.x = G.interior.spawn.x;
  G.player.y = G.interior.spawn.y;
  G.player.dir = { x: 0, y: -1 };
  G.mode = "interior";
  G.exitCooldown = 0.4;
  toast(`Entered ${zone.name}`, "info");
}

function leaveInterior(showToast=true) {
  if (!G.interior) return;
  const z = G.interior.zone;
  G.interior = null;
  G.mode = "play";
  // Stand player just outside the building door
  const out = buildingDoor(z);
  G.player.x = out.x + out.w/2 - G.player.w/2;
  G.player.y = out.y + out.h + 4;
  G.exitCooldown = 0.5;
  if (showToast) toast(`Left ${z.name}`, "info");
  save();
}

function tryMoveInterior(p, dx, dy) {
  const inter = G.interior;
  const nx = p.x + dx;
  if (!collidesWithWalls(inter.walls, nx, p.y, p.w, p.h) && !collidesWithSolidObjs(inter, nx, p.y, p.w, p.h)) p.x = nx;
  const ny = p.y + dy;
  if (!collidesWithWalls(inter.walls, p.x, ny, p.w, p.h) && !collidesWithSolidObjs(inter, p.x, ny, p.w, p.h)) p.y = ny;
  // Clamp to interior bounds + a little padding for the door
  p.x = Math.max(IX, Math.min(IX + IW - p.w, p.x));
  p.y = Math.max(IY, Math.min(IY + IH + 30, p.y));
}

function collidesWithSolidObjs(inter, x, y, w, h) {
  for (const o of inter.objects) {
    if (o.kind !== "decor") continue;
    if (x + w > o.x && x < o.x + o.w && y + h > o.y && y < o.y + o.h) return true;
  }
  return false;
}

// ===== INPUT =====
function setupInput() {
  window.addEventListener("keydown", e => {
    if (G.keys[e.code]) return;
    G.keys[e.code] = true;
    G.pressedThisFrame[e.code] = true;
    if (e.code === "Escape") {
      e.preventDefault();
      if (G.mode === "menu") { closeOverlay(); return; }
      if (G.mode === "interior") { leaveInterior(); return; }
      if (G.mode === "play") {
        const m = MAPS[G.mapId];
        if (m.parent) enterMap(m.parent);
      }
      return;
    }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      e.preventDefault();
      if (G.mode === "menu") { closeOverlay(); return; }
      openInventory();
      return;
    }
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","Enter","KeyW","KeyA","KeyS","KeyD"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", e => { G.keys[e.code] = false; });
}

// ===== UPDATE =====
function inputAxis() {
  let dx = 0, dy = 0;
  if (G.keys.ArrowLeft || G.keys.KeyA) dx -= 1;
  if (G.keys.ArrowRight || G.keys.KeyD) dx += 1;
  if (G.keys.ArrowUp || G.keys.KeyW) dy -= 1;
  if (G.keys.ArrowDown || G.keys.KeyS) dy += 1;
  if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
  return { dx, dy };
}

function updatePlay(dt) {
  const p = G.player;
  if (p.specialCooldown > 0) p.specialCooldown = Math.max(0, p.specialCooldown - dt);
  if (G.exitCooldown > 0) G.exitCooldown = Math.max(0, G.exitCooldown - dt);

  const { dx, dy } = inputAxis();
  const speed = p.moveSpeed;
  if (dx || dy) { p.dir.x = dx; p.dir.y = dy; }
  tryMoveOutdoor(p, dx * speed * dt, dy * speed * dt);

  // Check for door step on buildings, or zone overlap for outdoor zones
  const m = MAPS[G.mapId];
  for (const z of m.subzones) {
    if (z.outdoor) {
      // Walking onto an outdoor region triggers transition
      const inside = (p.x + p.w > z.x && p.x < z.x + z.w &&
                      p.y + p.h > z.y && p.y < z.y + z.h);
      if (inside && G.exitCooldown <= 0) {
        triggerAction(z);
        return;
      }
    } else {
      // Building: stepping onto the door enters interior
      if (G.exitCooldown > 0) continue;
      const d = buildingDoor(z);
      const onDoor = (p.x + p.w > d.x && p.x < d.x + d.w &&
                      p.y + p.h > d.y && p.y < d.y + d.h);
      if (onDoor) { enterInterior(z); return; }
    }
  }

  if (G.pressedThisFrame.Enter) tryUseSpecial();
}

function updateInterior(dt) {
  const p = G.player;
  if (p.specialCooldown > 0) p.specialCooldown = Math.max(0, p.specialCooldown - dt);
  if (G.exitCooldown > 0) G.exitCooldown = Math.max(0, G.exitCooldown - dt);
  const inter = G.interior;
  const { dx, dy } = inputAxis();
  if (dx || dy) { p.dir.x = dx; p.dir.y = dy; }
  tryMoveInterior(p, dx * p.moveSpeed * dt, dy * p.moveSpeed * dt);

  // Door exit (step out through the door at the bottom)
  if (G.exitCooldown <= 0) {
    const d = inter.door;
    if (p.y + p.h > d.y + 4 && p.x + p.w > d.x && p.x < d.x + d.w) {
      leaveInterior();
      return;
    }
  }

  // Action object overlap
  for (const o of inter.objects) {
    if (!o.onStep) continue;
    const inside = (p.x + p.w > o.x && p.x < o.x + o.w &&
                    p.y + p.h > o.y && p.y < o.y + o.h);
    if (inside) {
      o.onStep();
      // For most actions we leave the interior or open an overlay; protect against re-trigger
      G.exitCooldown = 0.6;
      break;
    }
  }

  if (G.pressedThisFrame.Enter) tryUseSpecial();
}

// ===== COMBAT UPDATE =====
function updateCombat(dt) {
  const p = G.player;
  if (p.specialCooldown > 0) p.specialCooldown = Math.max(0, p.specialCooldown - dt);
  const { dx, dy } = inputAxis();
  p.x += dx * p.moveSpeed * dt;
  p.y += dy * p.moveSpeed * dt;
  if (dx || dy) { p.dir.x = dx; p.dir.y = dy; }
  p.x = Math.max(10, Math.min(W - 10 - p.w, p.x));
  p.y = Math.max(60, Math.min(H - 10 - p.h, p.y));
  if (G.pressedThisFrame.Space && !G.swing) {
    G.swing = { t: 0, weapon: p.weapon, dx: p.dir.x, dy: p.dir.y, hits: [] };
  }
  if (G.swing) {
    G.swing.t += dt;
    const w = WEAPONS[G.swing.weapon];
    if (G.swing.t >= w.cd * 0.35 && G.swing.hits.length === 0) {
      const reach = w.reach;
      const angleArc = w.ranged ? Math.PI/8 : Math.PI/3;
      const dlen = Math.hypot(G.swing.dx, G.swing.dy) || 1;
      const ax = G.swing.dx / dlen, ay = G.swing.dy / dlen;
      for (const e of G.entities) {
        if (e.dead || e.ally) continue;
        const ex = e.x + e.w/2 - (p.x + p.w/2);
        const ey = e.y + e.h/2 - (p.y + p.h/2);
        const d = Math.hypot(ex, ey);
        if (d > reach) continue;
        const dot = (ex*ax + ey*ay) / (d || 1);
        if (dot < Math.cos(angleArc)) continue;
        const baseDmg = w.dmg + (G.player.characters.includes("clarisse") ? Math.round(w.dmg * 0.25) : 0);
        const crit = G.player.characters.includes("bianca") && Math.random() < 0.18 ? 2 : 1;
        const damage = baseDmg * crit;
        e.hp -= damage;
        G.swing.hits.push(e);
        spawnFloat(e.x + e.w/2, e.y, `-${damage}${crit>1?"!":""}`, "#ffd060");
        if (e.hp <= 0) { e.dead = true; if (e.mid !== "ally") onKillMonster(); }
      }
    }
    if (G.swing.t >= w.cd) G.swing = null;
  }
  if (G.pressedThisFrame.Enter) tryUseSpecial();
  for (const e of G.entities) {
    if (e.ally && !e.dead) {
      let nearest = null, nd = Infinity;
      for (const m of G.entities) { if (m === e || m.dead || m.ally) continue; const d = Math.hypot(m.x - e.x, m.y - e.y); if (d < nd) { nd = d; nearest = m; }}
      if (nearest) {
        const dx2 = nearest.x - e.x, dy2 = nearest.y - e.y;
        const dl = Math.hypot(dx2, dy2) || 1;
        e.x += (dx2/dl) * e.speed * dt;
        e.y += (dy2/dl) * e.speed * dt;
        e.attackCd = (e.attackCd || 0) - dt;
        if (nd < 28 && e.attackCd <= 0) {
          nearest.hp -= e.dmg; e.attackCd = 0.7;
          spawnFloat(nearest.x + nearest.w/2, nearest.y, `-${e.dmg}`, "#d4a040");
          if (nearest.hp <= 0) { nearest.dead = true; onKillMonster(); }
        }
      }
    }
  }
  for (const e of G.entities) {
    if (e.dead || e.ally) continue;
    if (e.stunT > 0) { e.stunT -= dt; continue; }
    if (e.mid === "charybdis") {
      const dx2 = e.x - p.x, dy2 = e.y - p.y;
      const dl = Math.hypot(dx2, dy2) || 1;
      p.x += (dx2/dl) * 30 * dt; p.y += (dy2/dl) * 30 * dt;
    }
    let speedMul = 1;
    if (e.mid === "siren") speedMul = 0.6;
    if (e.mid === "polyphemus") speedMul = 0.8;
    const dx2 = (p.x + p.w/2) - (e.x + e.w/2);
    const dy2 = (p.y + p.h/2) - (e.y + e.h/2);
    const dl = Math.hypot(dx2, dy2) || 1;
    if (dl > 18) {
      e.x += (dx2/dl) * e.speed * speedMul * dt;
      e.y += (dy2/dl) * e.speed * speedMul * dt;
    }
    e.attackCd = (e.attackCd || 0) - dt;
    if (dl < 26 && e.attackCd <= 0) {
      let dmg = e.dmg;
      if (e.mid === "empousa" && Math.random() < 0.25) dmg *= 2;
      p.hp -= dmg; e.attackCd = 0.9;
      spawnFloat(p.x + p.w/2, p.y, `-${dmg}`, "#ff7070");
      if (e.mid === "thanatos" && Math.random() < 0.3) { p.frozenT = 3.0; toast("Thanatos freezes you for 3 seconds.", "bad"); }
    }
  }
  if (p.frozenT > 0) p.frozenT -= dt;
  G.entities = G.entities.filter(e => !e.dead || (e.deadT = (e.deadT || 0) + dt) < 0.35);
  const enemies = G.entities.filter(e => !e.dead && !e.ally);
  if (enemies.length === 0) { endCombat(true); return; }
  if (p.hp <= 0) { endCombat(false); return; }
}

function tryUseSpecial() {
  const p = G.player;
  if (p.specialCooldown > 0) { toast(`Special on cooldown (${Math.ceil(p.specialCooldown)}s)`, "bad"); return; }
  if (G.mode === "combat" && p.flags.ghostArmyUses > 0) {
    p.flags.ghostArmyUses--;
    for (let i = 0; i < 3; i++) {
      G.entities.push({ mid: "ally", name: "Ghost", color: "#c8d0e0", x: G.player.x + 24, y: G.player.y + (i-1)*30, w: 18, h: 18, hp: 40, maxHp: 40, dmg: 8, speed: 130, ally: true, attackCd: 0, level: 4 });
    }
    toast(`Ghost Army summoned! Remaining uses: ${p.flags.ghostArmyUses}`, "good");
    p.specialCooldown = 10; save(); return;
  }
  const before = p.hp; heal(30); const healed = p.hp - before;
  toast(healed > 0 ? `+${healed} HP` : "Already full HP.", healed > 0 ? "good" : "info");
  p.specialCooldown = G.player.characters.includes("annabeth") ? 6 : 10;
  save();
}

// ===== FLOATS =====
const floats = [];
function spawnFloat(x, y, text, color) { floats.push({ x, y, text, color, t: 0 }); }

// ===== RENDER =====
function render() {
  const ctx = G.ctx;
  ctx.clearRect(0, 0, W, H);
  if (G.mode === "combat" || (G.mode === "menu" && G.combat)) renderCombat();
  else if (G.mode === "interior" || (G.mode === "menu" && G.interior)) renderInterior();
  else renderPlay();

  // Floating numbers (combat)
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.t += 0.016;
    if (f.t > 0.8) { floats.splice(i, 1); continue; }
    ctx.fillStyle = f.color; ctx.font = "bold 16px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center"; ctx.globalAlpha = 1 - f.t / 0.8;
    ctx.fillText(f.text, f.x, f.y - f.t * 40); ctx.globalAlpha = 1;
  }
  updateHUD();
}

function renderTiles(map) {
  const ctx = G.ctx;
  const style = TILE_STYLES[map.tileStyle] || TILE_STYLES.grass;
  const cols = Math.ceil(W / TS), rows = Math.ceil(H / TS);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = style(c, r);
      ctx.fillRect(c * TS, r * TS, TS, TS);
    }
  }
  // Subtle grid
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(c*TS, 0); ctx.lineTo(c*TS, H); ctx.stroke(); }
  for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(0, r*TS); ctx.lineTo(W, r*TS); ctx.stroke(); }
}

function renderBuilding(z) {
  const ctx = G.ctx;
  // Floor inside
  ctx.fillStyle = z.color;
  ctx.fillRect(z.x, z.y, z.w, z.h);
  // Roof shadow (top stripe)
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(z.x, z.y, z.w, 12);
  // Walls (block style)
  const d = buildingDoor(z);
  const walls = buildingWalls(z);
  ctx.fillStyle = "#3a2a1a";
  for (const r of walls) ctx.fillRect(r.x, r.y, r.w, r.h);
  // Brick lines on top/bottom walls
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  for (let x = z.x + 4; x < z.x + z.w; x += 12) {
    ctx.beginPath(); ctx.moveTo(x, z.y); ctx.lineTo(x, z.y + WALL_T); ctx.stroke();
  }
  // Door
  ctx.fillStyle = "#1a0e08";
  ctx.fillRect(d.x, d.y - 2, d.w, d.h + 2);
  ctx.fillStyle = "#f0c050";
  ctx.fillRect(d.x + d.w - 8, d.y + 2, 3, 6);
  // Label above
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.font = "bold 12px -apple-system, sans-serif";
  ctx.textAlign = "center";
  wrapText(ctx, z.name, z.x + z.w/2, z.y + 8, z.w - 8, 14, 2);
}

function renderOutdoorZone(z) {
  const ctx = G.ctx;
  const t = performance.now() / 700;
  const pulse = 0.18 + 0.12 * (Math.sin(t + z.x*0.01) * 0.5 + 0.5);
  ctx.fillStyle = z.color;
  ctx.globalAlpha = 0.75;
  roundRect(ctx, z.x, z.y, z.w, z.h, 12); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.textAlign = "center";
  wrapText(ctx, z.name, z.x + z.w/2, z.y + z.h/2 + 5, z.w - 12, 18);
}

function renderPlay() {
  const ctx = G.ctx;
  const m = MAPS[G.mapId];
  renderTiles(m);
  // Map label faint
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = "bold 36px -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(m.label, W - 16, H - 18);
  // Esc hint
  if (m.parent) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Esc — back to " + MAPS[m.parent].label, 12, H - 10);
  }
  // Zones / buildings
  for (const z of m.subzones) {
    if (z.outdoor) renderOutdoorZone(z);
    else renderBuilding(z);
  }
  // Half-Blood Hill marker
  if (G.mapId === "camp-hb") {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "italic 12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Half-Blood Hill", 480, 525);
    // hill mound
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath(); ctx.ellipse(480, 555, 80, 16, 0, 0, Math.PI*2); ctx.fill();
  }
  drawPlayer(ctx);
}

function renderInterior() {
  const ctx = G.ctx;
  const inter = G.interior;
  // Dark surround
  ctx.fillStyle = "#0a0810";
  ctx.fillRect(0, 0, W, H);
  // Floor — wood/stone based on zone type
  const floorStyle = ({
    cabin: "wood", bighouse: "wood", arena: "arena", lair: "cave",
    portal: "stone", palace: "marble", temple: "marble", fortress: "stone",
    mess: "wood", museum: "marble", hotel: "marble", station: "stone",
    bridge: "stone", school: "wood", library: "wood",
    arch: "marble", garden: "grass", mountain: "stone",
    shop: "wood", fields: "grass", river: "water", throne: "marble",
    forge: "stone", spa: "marble", cave: "cave", cliff: "stone",
  })[inter.kind] || "stone";
  const style = TILE_STYLES[floorStyle];
  const cols = Math.ceil(IW / TS), rows = Math.ceil(IH / TS);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = style(c, r);
      const x = IX + c * TS, y = IY + r * TS;
      ctx.fillRect(x, y, Math.min(TS, IX + IW - x), Math.min(TS, IY + IH - y));
    }
  }
  // Grid
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(IX + c*TS, IY); ctx.lineTo(IX + c*TS, IY + IH); ctx.stroke(); }
  for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(IX, IY + r*TS); ctx.lineTo(IX + IW, IY + r*TS); ctx.stroke(); }
  // Walls
  ctx.fillStyle = "#3a2a1a";
  for (const w of inter.walls) ctx.fillRect(w.x, w.y, w.w, w.h);
  // Banner
  if (inter.banner) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = "bold 22px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(inter.banner, IX + IW/2, IY + 30);
  }
  // Door
  const d = inter.door;
  ctx.fillStyle = "#2a1a0a";
  ctx.fillRect(d.x, d.y - 2, d.w, d.h + 4);
  ctx.fillStyle = "rgba(255,220,140,0.6)";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Door (step out)", d.x + d.w/2, d.y + d.h + 16);
  // Objects
  const tpulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
  for (const o of inter.objects) {
    if (o.kind === "decor") {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      if (o.label) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "10px -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(o.label, o.x + o.w/2, o.y + o.h/2 + 3);
      }
    } else if (o.kind === "pedestal") {
      // glow
      ctx.fillStyle = `rgba(255,220,80,${0.2 + 0.2*tpulse})`;
      ctx.beginPath(); ctx.arc(o.x + o.w/2, o.y + o.h/2, 50, 0, Math.PI*2); ctx.fill();
      // base
      ctx.fillStyle = "#7a5a30";
      ctx.fillRect(o.x, o.y + o.h - 20, o.w, 20);
      // item
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x + o.w/2 - 14, o.y + 10, 28, o.h - 30);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(o.label, o.x + o.w/2, o.y - 6);
    } else if (o.kind === "npc") {
      ctx.fillStyle = o.color;
      roundRect(ctx, o.x, o.y, o.w, o.h, 6); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(o.x + o.w/2, o.y + 10, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(o.label, o.x + o.w/2, o.y - 6);
    } else if (o.kind === "monster") {
      ctx.fillStyle = o.color;
      roundRect(ctx, o.x, o.y, o.w, o.h, 4); ctx.fill();
      ctx.strokeStyle = "#ff6060";
      ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#ffb0b0";
      ctx.font = "10px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(o.name, o.x + o.w/2, o.y - 4);
    } else if (o.kind === "ring") {
      ctx.fillStyle = "rgba(255,180,80,0.18)";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = "#e8a050";
      ctx.lineWidth = 3;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 12px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(o.label, o.x + o.w/2, o.y + o.h/2 + 4);
    } else if (o.kind === "portal") {
      ctx.fillStyle = `rgba(100,140,255,${0.3 + 0.3*tpulse})`;
      ctx.beginPath(); ctx.arc(o.x + o.w/2, o.y + o.h/2, 55, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(o.x + o.w/2, o.y + o.h/2, 35, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(o.label, o.x + o.w/2, o.y - 6);
    } else if (o.kind === "fountain") {
      ctx.fillStyle = `rgba(120,200,255,${0.3 + 0.3*tpulse})`;
      ctx.beginPath(); ctx.arc(o.x + o.w/2, o.y + o.h/2, 50, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#6090c0";
      ctx.beginPath(); ctx.arc(o.x + o.w/2, o.y + o.h/2, 30, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(o.label, o.x + o.w/2, o.y - 6);
    }
  }
  // Esc / leave hint
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "12px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Esc — leave " + inter.zone.name, IX + 12, IY + IH + 28);
  // Player
  drawPlayer(ctx);
}

function renderCombat() {
  const ctx = G.ctx;
  ctx.fillStyle = "#1a1424"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#251934";
  for (let i = 0; i < 30; i++) for (let j = 0; j < 18; j++) if ((i + j) % 2 === 0) ctx.fillRect(i * 32, j * 32 + 40, 32, 32);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "bold 14px -apple-system, sans-serif"; ctx.textAlign = "center";
  ctx.fillText(G.combat.label, W/2, 28);
  for (const e of G.entities) {
    if (e.deadT !== undefined) ctx.globalAlpha = Math.max(0, 1 - e.deadT / 0.35);
    ctx.fillStyle = e.color; roundRect(ctx, e.x, e.y, e.w, e.h, 4); ctx.fill();
    if (e.ally) { ctx.strokeStyle = "#80f0a0"; ctx.lineWidth = 2; ctx.stroke(); }
    if (!e.dead) {
      const barW = Math.max(28, e.w);
      ctx.fillStyle = "#3a0a0a";
      ctx.fillRect(e.x - (barW - e.w)/2, e.y - 8, barW, 4);
      ctx.fillStyle = e.ally ? "#5cd97e" : "#e04848";
      ctx.fillRect(e.x - (barW - e.w)/2, e.y - 8, barW * (e.hp/e.maxHp), 4);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`${e.name} L${e.level}`, e.x + e.w/2, e.y - 12);
    }
    ctx.globalAlpha = 1;
  }
  drawPlayer(ctx);
  if (G.swing) {
    const p = G.player; const w = WEAPONS[G.swing.weapon];
    const dlen = Math.hypot(G.swing.dx, G.swing.dy) || 1;
    const ax = G.swing.dx / dlen, ay = G.swing.dy / dlen;
    const cx = p.x + p.w/2, cy = p.y + p.h/2;
    const tr = G.swing.t / w.cd;
    ctx.save(); ctx.translate(cx, cy);
    ctx.rotate(Math.atan2(ay, ax));
    ctx.strokeStyle = w.ranged ? "#a0e0ff" : "#ffe898";
    ctx.lineWidth = w.ranged ? 2 : 4;
    ctx.globalAlpha = 1 - tr;
    ctx.beginPath();
    if (w.ranged) { ctx.moveTo(0, 0); ctx.lineTo(w.reach * (tr*1.5), 0); }
    else { const arc = Math.PI/3; ctx.arc(0, 0, w.reach, -arc/2 + tr*arc, arc/2); }
    ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "11px -apple-system, sans-serif"; ctx.textAlign = "left";
  ctx.fillText("(flee with Esc — combat will end)", 10, H - 10);
}

function drawPlayer(ctx) {
  const p = G.player;
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(p.x + p.w/2, p.y + p.h + 4, p.w/2, 4, 0, 0, Math.PI*2); ctx.fill();
  // Body
  ctx.fillStyle = "#5fb8ff";
  roundRect(ctx, p.x, p.y, p.w, p.h, 4); ctx.fill();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
  // Facing dot
  const cx = p.x + p.w/2, cy = p.y + p.h/2;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx + p.dir.x * 7, cy + p.dir.y * 7, 2, 0, Math.PI*2); ctx.fill();
  if (p.frozenT > 0) {
    ctx.strokeStyle = "#80d0ff"; ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function wrapText(ctx, text, x, y, maxW, lh, maxLines) {
  const words = text.split(" ");
  let line = "", lines = [];
  for (let w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  if (maxLines) lines = lines.slice(0, maxLines);
  const start = y - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, start + i * lh));
}

// ===== LOOP =====
function loop(t) {
  const dt = Math.min(0.05, (t - G.lastT) / 1000) || 0;
  G.lastT = t;
  if (G.mode === "play") updatePlay(dt);
  else if (G.mode === "interior") updateInterior(dt);
  else if (G.mode === "combat") updateCombat(dt);
  render();
  G.pressedThisFrame = {};
  requestAnimationFrame(loop);
}

// ===== INIT =====
function init() {
  G.canvas = document.getElementById("arena");
  G.ctx = G.canvas.getContext("2d");
  G.toastStack = document.getElementById("toast-stack");
  G.overlay = document.getElementById("overlay");
  G.overlayPanel = document.getElementById("overlay-panel");
  document.getElementById("reset-btn").onclick = () => { if (confirm("Erase your save and start a new game?")) resetSave(); };
  setupInput();
  if (!load()) {
    G.player = defaultPlayer();
    G.mapId = "camp-hb";
    toast("Welcome to The Arena. You spawn at Half-Blood Hill.", "info");
  } else {
    toast("Save loaded.", "info");
  }
  if (!MAPS[G.mapId]) G.mapId = "camp-hb";
  G.player.x = G.player.x || MAPS[G.mapId].spawn.x;
  G.player.y = G.player.y || MAPS[G.mapId].spawn.y;
  requestAnimationFrame(loop);
}
document.addEventListener("DOMContentLoaded", init);

})();
