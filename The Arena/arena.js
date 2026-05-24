/* ============================================================
   The Arena — real-time demigod action RPG
   ============================================================ */
(function () {
"use strict";

// ===== CONFIG =====
const W = 960, H = 600;
const TILE = 16;
const PLAYER_SPEED = 180; // px/s

// ===== DATA =====

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

// Monster base stats — color, level, then derived hp/damage/speed
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

// Level → HP/damage/speed table
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

// ===== MAPS =====
// Each map has: bg color, optional parent, label, spawn point,
// and an array of subzones {id, name, x, y, w, h, color, glow, action}.
// action.type ∈ {goto, fight, dialog, heal, shop, cabin, special}
// If a subzone needs a precondition or unlocks something else, action handlers wire it up.

function pos(x, y, w, h) { return { x, y, w, h }; }

const MAPS = {
  // ============ MAIN OVERWORLD ============
  main: {
    label: "The World",
    bg: "#4a6b3b",
    bgPattern: "grass",
    spawn: { x: 480, y: 540, facing: "up" },
    subzones: [
      { id: "camp-hb",       name: "Camp Half-Blood",   ...pos( 40,  40, 240, 180), color: "#a8c97e", action: { type: "goto", to: "camp-hb" } },
      { id: "long-island",   name: "Long Island Sound", ...pos(360,  40, 240, 180), color: "#5a93c8", action: { type: "goto", to: "long-island" } },
      { id: "camp-j",        name: "Camp Jupiter",      ...pos(680,  40, 240, 180), color: "#c89a5a", action: { type: "goto", to: "camp-j", achievement: "newRome" } },
      { id: "manhattan",     name: "Manhattan",         ...pos( 40, 360, 240, 200), color: "#7e7e8c", action: { type: "goto", to: "manhattan", achievement: "citySlicker" } },
      { id: "vegas",         name: "Las Vegas",         ...pos(360, 360, 240, 200), color: "#d4a847", action: { type: "goto", to: "vegas" } },
      { id: "la",            name: "L.A.",              ...pos(680, 360, 240, 200), color: "#e08068", action: { type: "goto", to: "la" } },
    ],
  },

  // ============ CAMP HALF-BLOOD ============
  "camp-hb": {
    label: "Camp Half-Blood",
    parent: "main",
    bg: "#7da854",
    spawn: { x: 480, y: 540 }, // Half-Blood Hill at the bottom
    subzones: [
      // 12 cabins, two rows of 6 along the top
      ...Array.from({ length: 12 }, (_, i) => {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const gx = 60 + col * 140;
        const gy = 40 + row * 90;
        const cabinNames = ["Zeus","Hera","Poseidon","Demeter","Ares","Athena","Apollo","Artemis","Hephaestus","Aphrodite","Hermes","Dionysus"];
        const cabinColors = ["#fff7a8","#dfd0ff","#9bd0f0","#d8ef9b","#f09898","#e8e0b8","#fff0a0","#d0e8ff","#d4a070","#ffc8d8","#d0d0d0","#b88dd0"];
        return {
          id: `cabin${i+1}`,
          name: `Cabin ${i+1}`,
          x: gx, y: gy, w: 100, h: 60,
          color: cabinColors[i],
          action: { type: "cabin", weapon: `c${i+1}`, label: cabinNames[i] },
        };
      }),
      { id: "arena",     name: "Arena",         ...pos(360, 380, 200, 130), color: "#c98a4a", action: { type: "arena" } },
      { id: "bighouse",  name: "Big House",     ...pos( 60, 380, 200, 130), color: "#854a2a", action: { type: "bighouse" } },
      { id: "myrmekes",  name: "Myrmekes Lair", ...pos(660, 380, 200, 130), color: "#2a2a2a", action: { type: "fight", mons: ["myrmeke","myrmeke","myrmeke"], reward: "First Blood" } },
    ],
  },

  // ============ LONG ISLAND SOUND ============
  "long-island": {
    label: "Long Island Sound",
    parent: "main",
    bg: "#3a78b0",
    bgPattern: "water",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "som-portal", name: "Sea of Monsters →",  ...pos( 60, 60, 240, 140), color: "#5aa8d8", action: { type: "goto", to: "sea-of-monsters" } },
      { id: "poseidon",   name: "Poseidon's Palace",  ...pos(660, 60, 240, 140), color: "#7ac8f0", action: { type: "fight", mons: ["shark","shark"], unlock: "tyson", reqInfo: "Defeat the sharks to unlock Tyson." } },
    ],
  },

  // ============ CAMP JUPITER ============
  "camp-j": {
    label: "Camp Jupiter",
    parent: "main",
    bg: "#b8884a",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "temple-j",   name: "Temple of Jupiter", ...pos( 60,  60, 220, 130), color: "#e8c068", action: { type: "dialog", id: "octavian" } },
      { id: "temple-m",   name: "Temple of Mars",    ...pos(360,  60, 240, 130), color: "#c84040", action: { type: "shop", id: "mars" } },
      { id: "field-mars", name: "Field of Mars",     ...pos(680,  60, 220, 130), color: "#8a4030", action: { type: "fight", mons: ["legion","legion","legion","legion"], unlock: "hazel", reqInfo: "Invade the fortress to unlock Hazel." } },
      { id: "mess",       name: "Mess Hall",         ...pos(360, 380, 240, 140), color: "#d4b878", action: { type: "heal", amount: "full", msg: "You eat your fill. Fully healed." } },
    ],
  },

  // ============ MANHATTAN ============
  "manhattan": {
    label: "Manhattan",
    parent: "main",
    bg: "#5a5a6e",
    bgPattern: "city",
    spawn: { x: 480, y: 540 },
    subzones: [
      // Block 1
      { id: "central-park", name: "Central Park",    ...pos( 30,  40, 200, 100), color: "#7ea860", action: { type: "goto", to: "underworld", achievement: "ghostKing", msg: "You found the hidden entrance to the Underworld." } },
      { id: "met",          name: "The MET",         ...pos( 30, 160, 200, 100), color: "#a09078", action: { type: "fight", mons: ["mrsDodds"], unlock: "selina", reqInfo: "Defeat Mrs. Dodds to unlock Selina." } },
      // Block 2
      { id: "plaza",        name: "The Plaza",       ...pos(250,  40, 200, 100), color: "#c8a060", action: { type: "fight", mons: ["empousa"], grant: "automatons", reqInfo: "Defeat the Empousa to summon the automatons." } },
      { id: "grand-central",name: "Grand Central",   ...pos(250, 160, 200, 100), color: "#9c8a60", action: { type: "fight", mons: ["hyperion"], allyIfFlag: "automatons", allyMons: "demigod", reqInfo: "Defeat Hyperion. Defeated Empousa? Hermes statue helps." } },
      // Block 3
      { id: "wmbridge",     name: "Williamsburg Br.", ...pos(470,  40, 200, 100), color: "#6a6a78", action: { type: "fight", mons: ["hellhound","hellhound","hellhound","hellhound","hellhound"], packBonus: true, unlock: "mrsOleary", reqInfo: "Win to befriend Mrs. O'Leary." } },
      { id: "meriwether",   name: "Meriwether Prep", ...pos(470, 160, 200, 100), color: "#a89868", action: { type: "fight", mons: ["laistry","laistry","laistry"], unlock: "rachel", reqInfo: "Defeat the Giants to unlock Rachel." } },
      // Block 4
      { id: "library",      name: "NY Public Library",...pos(690,  40, 200, 100), color: "#b89870", action: { type: "fight", mons: ["dracaena","dracaena","dracaena"], packBonus: true, allyIfFlag: "automatons", unlock: "beckendorf", reqInfo: "Have automatons? The lion statue will help. Unlocks Beckendorf." } },
      { id: "esb",          name: "Empire State Bldg",...pos(690, 160, 200, 100), color: "#7080a0", action: { type: "goto", to: "olympus", achievement: "ascension" } },
    ],
  },

  // ============ LAS VEGAS ============
  "vegas": {
    label: "Las Vegas",
    parent: "main",
    bg: "#d09a3a",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "arch",      name: "Gateway Arch",     ...pos( 60,  60, 240, 220), color: "#b8b8b8", action: { type: "fight", mons: ["chimera","echidna"], unlock: "frank", reqInfo: "Defeat Chimera & Echidna to unlock Frank." } },
      { id: "garden",    name: "Auntie Em's",      ...pos(360,  60, 240, 220), color: "#7aa84a", action: { type: "fight", mons: ["medusa"], unlock: "grover", reqInfo: "Defeat Medusa to unlock Grover." } },
      { id: "lotus",     name: "Lotus Hotel",      ...pos(660,  60, 240, 220), color: "#e0a8d8", action: { type: "fight", mons: Array(10).fill("lotus"), unlock: "piper", reqInfo: "Win against 10 lotus eaters to unlock Piper." } },
    ],
  },

  // ============ L.A. ============
  "la": {
    label: "L.A.",
    parent: "main",
    bg: "#d4664a",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "mt-tam",     name: "Mount Tam",                ...pos( 40,  60, 220, 220), color: "#8c8c8c", action: { type: "fight", mons: ["atlas"], unlock: "annabeth", quest: "artemis", reqInfo: "Defeat Atlas to free Artemis and unlock Annabeth." } },
      { id: "mt-diablo",  name: "Mount Diablo",             ...pos(290,  60, 220, 220), color: "#a04030", action: { type: "fight", mons: ["enceladus"], unlock: "leo", reqInfo: "Defeat Enceladus to unlock Leo." } },
      { id: "crusty",     name: "Crusty's Waterbed Palace", ...pos(540,  60, 200, 220), color: "#aaa", action: { type: "fight", mons: ["procrustes"], unlock: "bianca", reqInfo: "Defeat Procrustes to unlock Bianca." } },
      { id: "doa",        name: "D.O.A. Recording Studio",  ...pos(770,  60, 150, 220), color: "#1a1a1a", action: { type: "goto", to: "underworld", achievement: "ghostKing" } },
    ],
  },

  // ============ UNDERWORLD ============
  "underworld": {
    label: "The Underworld",
    parent: "main",
    bg: "#2c1d2d",
    bgPattern: "shadow",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "tartarus-portal", name: "Entrance to Tartarus", ...pos( 40,  60, 230, 160), color: "#1a0a1a", action: { type: "goto", to: "tartarus" } },
      { id: "hades-palace",    name: "Palace of Hades",      ...pos(370,  60, 230, 160), color: "#4a2030", action: { type: "goto", to: "hades-palace" } },
      { id: "asphodel",        name: "Fields of Asphodel",   ...pos(700,  60, 220, 160), color: "#6a5a6a", action: { type: "fight", mons: ["ghost","ghost","ghost"], grant: "wingedShoes", reqInfo: "Win to claim the Winged Shoes (flight)." } },
      { id: "styx-exit",       name: "River Styx (Exit)",    ...pos(370, 380, 230, 140), color: "#0a4a6a", action: { type: "fight", mons: ["charon","cerberus"], grant: "ghostArmy", reqInfo: "Survive Charon & Cerberus to gain Ghost Army (2 uses)." } },
    ],
  },

  // ============ PALACE OF HADES ============
  "hades-palace": {
    label: "Palace of Hades",
    parent: "underworld",
    bg: "#1a0a1a",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "entrance",   name: "Entrance",            ...pos( 40,  60, 280, 200), color: "#3a1a3a", action: { type: "fight", mons: ["thanatos"], msg: "Survive Thanatos and you keep your life." } },
      { id: "throne",     name: "Throne Room (Hades)", ...pos(360,  60, 240, 200), color: "#4a1a30", action: { type: "fight", mons: ["hades"], unlock: "nico", reqInfo: "Hades is hard. Try to reason with him — or defeat him to unlock Nico." } },
      { id: "hall",       name: "Hall of the Furies",  ...pos(640,  60, 240, 200), color: "#3a3030", action: { type: "fight", mons: ["fury","fury","fury"], unlock: "nico", reqInfo: "Defeat the Furies to unlock Nico." } },
      { id: "garden",     name: "Persephone's Garden", ...pos(290, 380, 360, 140), color: "#6a3060", action: { type: "fight", mons: ["persephone"], grant: "ghostArmy", reqInfo: "Defeat Persephone for Ghost Army (2 uses)." } },
    ],
  },

  // ============ SEA OF MONSTERS ============
  "sea-of-monsters": {
    label: "Sea of Monsters",
    parent: "long-island",
    bg: "#1f5a85",
    bgPattern: "water",
    spawn: { x: 480, y: 540 }, // Scylla & Charybdis area at bottom
    subzones: [
      { id: "ccs",       name: "C.C.'s Spa & Resort",  ...pos( 40,  60, 220, 200), color: "#b070c0", action: { type: "fight", mons: ["circe"], grant: "waterbreath", reqInfo: "Defeat Circe to gain underwater breathing." } },
      { id: "polyphemus",name: "Polyphemus's Island",  ...pos(370,  60, 220, 200), color: "#a08050", action: { type: "fight", mons: ["polyphemus","sheep","sheep","sheep"], grant: "fleece", quest: "fleece", reqInfo: "Win to claim the Golden Fleece (healing item)." } },
      { id: "sirens",    name: "The Sirens",           ...pos(700,  60, 220, 200), color: "#a0a0c0", action: { type: "fight", mons: ["siren","siren","siren"], rangedRequired: true, reqInfo: "Their song drags you in — bow recommended." } },
      { id: "scylla",    name: "Scylla & Charybdis",   ...pos(290, 380, 380, 160), color: "#7a3040", action: { type: "fight", mons: ["scylla","charybdis"], unlock: "clarisse", reqInfo: "Get past Scylla & Charybdis to unlock Clarisse." } },
    ],
  },

  // ============ OLYMPUS ============
  olympus: {
    label: "Olympus (600th Floor)",
    parent: "main",
    bg: "#d4d8ff",
    bgPattern: "clouds",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "throne-hall", name: "Throne Hall",      ...pos(280,  80, 400, 240), color: "#fffae0", action: { type: "dialog", id: "olympus" } },
      { id: "muses",       name: "Hall of Muses",    ...pos( 40, 380, 280, 140), color: "#e0f0ff", action: { type: "heal", amount: 50, msg: "The Muses sing — you recover 50 HP." } },
      { id: "forge",       name: "Hephaestus' Forge",...pos(640, 380, 280, 140), color: "#a06040", action: { type: "shop", id: "forge" } },
    ],
  },

  // ============ TARTARUS ============
  tartarus: {
    label: "Tartarus",
    parent: "underworld",
    bg: "#160510",
    bgPattern: "shadow",
    spawn: { x: 480, y: 540 },
    subzones: [
      { id: "pit",      name: "The Pit",            ...pos(180,  60, 280, 220), color: "#2a0a1a", action: { type: "fight", mons: ["fury","fury","hellhound","hellhound","hellhound"], packBonus: true, msg: "You survived the Pit. The dark whispers fade." } },
      { id: "doors",    name: "Doors of Death",     ...pos(500,  60, 280, 220), color: "#1a0a05", action: { type: "fight", mons: ["thanatos","cerberus"], msg: "You sealed the Doors of Death." } },
    ],
  },
};

// ===== STATE =====
const G = {
  canvas: null,
  ctx: null,
  hud: null,
  toastStack: null,
  overlay: null,
  overlayPanel: null,
  keys: {},
  pressedThisFrame: {}, // edge-trigger
  lastT: 0,
  mode: "play",            // play | combat | menu
  mapId: "camp-hb",
  prevMapId: null,
  player: null,            // initialized in newGame()
  entities: [],            // combat enemies
  combat: null,            // { mons:[], reward, ... }
  swing: null,             // { t, dir, weapon }
  toasts: [],
  cooldownTouch: {},       // subzone id -> timestamp last entered, to debounce
};

function defaultPlayer() {
  return {
    x: 480, y: 540, w: 18, h: 18,
    dir: { x: 0, y: 1 }, // facing
    hp: 100, maxHp: 100,
    weapon: "bronze",
    weapons: ["bronze"],
    characters: [],
    achievements: [],
    flags: {},     // { automatons:true, wingedShoes:true, waterbreath:true, fleece:true, ghostArmyUses:2, ... }
    arenaWins: 0,
    monsterKills: 0,
    quests: { bolt:"available", fleece:"available", artemis:"available" },
    specialCooldown: 0,
    moveSpeed: PLAYER_SPEED,
  };
}

// ===== SAVE / LOAD =====
const SAVE_KEY = "theArena.save.v1";

function save() {
  try {
    const data = {
      player: G.player,
      mapId: G.mapId,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
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
  enterMap("camp-hb");
  toast("New game started.", "info");
  save();
}

// ===== TOAST / UI =====
function toast(msg, kind) {
  const el = document.createElement("div");
  el.className = "toast " + (kind || "");
  el.textContent = msg;
  G.toastStack.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function updateHUD() {
  document.getElementById("loc-label").textContent = MAPS[G.mapId].label;
  document.getElementById("hp-label").textContent = `HP ${Math.max(0, Math.round(G.player.hp))}/${G.player.maxHp}`;
  document.getElementById("hp-fill").style.width = (100 * G.player.hp / G.player.maxHp) + "%";
  document.getElementById("weapon-label").textContent = WEAPONS[G.player.weapon].name;
  const pip = document.getElementById("special-pip");
  pip.classList.toggle("cooldown", G.player.specialCooldown > 0);
}

// ===== OVERLAY (menus / dialogs) =====
function openOverlay(html) {
  G.overlayPanel.innerHTML = html;
  G.overlay.classList.add("open");
  G.mode = "menu";
}
function closeOverlay() {
  G.overlay.classList.remove("open");
  G.overlayPanel.innerHTML = "";
  if (G.combat) G.mode = "combat"; else G.mode = "play";
}

function openInventory() {
  const p = G.player;
  let html = `<h2>Inventory</h2>`;
  // Weapons
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
  // Characters
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
  // Items / flags
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
  items.forEach(it => {
    html += `<div class="item"><span class="name">${it.n}</span><span class="meta">${it.d}</span></div>`;
  });
  html += `</div>`;
  // Achievements
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
  // Quests
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
  // weapon equip
  G.overlayPanel.querySelectorAll("[data-weapon]").forEach(el => {
    el.onclick = () => {
      const k = el.getAttribute("data-weapon");
      if (G.player.weapons.includes(k)) {
        G.player.weapon = k;
        save();
        openInventory(); // refresh
        toast("Equipped " + WEAPONS[k].name, "info");
      } else {
        toast("Locked — visit Cabin " + (parseInt(k.slice(1))||"?"), "bad");
      }
    };
  });
}

function openDialog(opts) {
  // opts: { title, text, choices: [{label, onClick}] }
  let html = `<h2>${opts.title}</h2><p style="line-height:1.7;color:var(--text);margin-bottom:1rem;">${opts.text}</p>`;
  html += `<div class="choice-list">`;
  opts.choices.forEach((c, i) => {
    html += `<button data-choice="${i}">${c.label}</button>`;
  });
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
        { label: "Heal 30 HP", run: () => { heal(30); toast("+30 HP", "good"); }},
        { label: "Heal to Full", run: () => { G.player.hp = G.player.maxHp; toast("Healed.", "good"); save(); }},
        { label: "Talk to Chiron (Quests)", run: () => openChiron() },
      ],
    },
    mars: {
      title: "Temple of Mars — Weapon Stand",
      lines: ["Roman steel rests on the altar. Take what you can use."],
      items: [
        { label: "Take Pilum (+12 dmg weapon)", run: () => { addWeapon("c5"); toast("Acquired Spear of Ares.", "good"); }},
      ],
    },
    forge: {
      title: "Hephaestus' Forge — Olympus",
      lines: ["Hephaestus tunes a celestial bronze edge for you."],
      items: [
        { label: "Take Gold Sword (+24 dmg)", run: () => { addWeapon("gold"); toast("Acquired Gold Sword.", "good"); }},
      ],
    },
  };
  const s = shops[id];
  if (!s) { closeOverlay(); return; }
  let html = `<h2>${s.title}</h2>`;
  s.lines.forEach(l => { html += `<p style="margin-bottom:.6rem;color:var(--muted);">${l}</p>`; });
  html += `<div class="choice-list">`;
  s.items.forEach((it, i) => { html += `<button data-i="${i}">${it.label}</button>`; });
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
      choices.push({ label: `Accept: ${q.name}`, onClick: () => {
        p.quests[qk] = "inprogress"; save();
        toast(`Quest started: ${q.name}`, "info");
      }});
    } else if (s === "inprogress") {
      choices.push({ label: `In progress: ${q.name}`, onClick: () => toast("Already on it.", "info") });
    } else if (s === "complete") {
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

// ===== ACTIONS ON SUBZONE ENTER =====
function triggerAction(zone) {
  const a = zone.action;
  if (!a) return;
  const p = G.player;

  if (a.type === "goto") {
    if (a.achievement) grantAchievement(a.achievement);
    if (a.msg) toast(a.msg, "info");
    enterMap(a.to);
    return;
  }
  if (a.type === "cabin") {
    if (!p.weapons.includes(a.weapon)) {
      p.weapons.push(a.weapon);
      p.weapon = a.weapon;
      toast(`Cabin ${zone.id.slice(5)} (${a.label}) — acquired ${WEAPONS[a.weapon].name}.`, "good");
      save();
    } else {
      toast(`Cabin ${zone.id.slice(5)} — ${a.label}. Already explored.`, "info");
    }
    return;
  }
  if (a.type === "bighouse") {
    openShop("bighouse");
    return;
  }
  if (a.type === "shop") {
    openShop(a.id);
    return;
  }
  if (a.type === "heal") {
    if (a.amount === "full") p.hp = p.maxHp;
    else heal(a.amount);
    toast(a.msg || "Healed.", "good");
    save();
    return;
  }
  if (a.type === "dialog") {
    openDialogScene(a.id);
    return;
  }
  if (a.type === "arena") {
    // Pick a random demigod-level encounter
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
        if (a.unlock) unlockCharacter(a.unlock);
        if (a.grant) grantFlag(a.grant);
        if (a.quest) completeQuest(a.quest);
        if (a.msg) toast(a.msg, "good");
        save();
      },
      onLose: () => {
        // handled by combat code
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

// ===== UNLOCKS / FLAGS / ACHIEVEMENTS =====
function grantAchievement(id) {
  if (!ACHIEVEMENTS[id]) return;
  if (G.player.achievements.includes(id)) return;
  G.player.achievements.push(id);
  const a = ACHIEVEMENTS[id];
  toast(`Achievement: ${a.icon} ${a.name}`, "good");
  save();
}
function unlockCharacter(id) {
  if (!CHARACTERS[id]) return;
  if (G.player.characters.includes(id)) return;
  G.player.characters.push(id);
  const c = CHARACTERS[id];
  toast(`Hero unlocked: ${c.name}`, "good");
  if (id === "tyson") { G.player.maxHp += 20; G.player.hp += 20; }
  if (id === "selina") { G.player.moveSpeed = PLAYER_SPEED * 1.15; }
  save();
}
function grantFlag(name) {
  if (name === "automatons") { G.player.flags.automatons = true; toast("Automatons available in Manhattan.", "good"); }
  else if (name === "wingedShoes") { G.player.flags.wingedShoes = true; G.player.moveSpeed = Math.max(G.player.moveSpeed, PLAYER_SPEED * 1.25); toast("Winged Shoes equipped — you move faster.", "good"); }
  else if (name === "waterbreath") { G.player.flags.waterbreath = true; toast("You can now breathe underwater.", "good"); }
  else if (name === "fleece") { G.player.flags.fleece = true; toast("The Golden Fleece glows in your pack.", "good"); }
  else if (name === "ghostArmy") {
    G.player.flags.ghostArmyUses = (G.player.flags.ghostArmyUses || 0) + 2;
    toast("Ghost Army summons available: 2 charges.", "good");
  } else if (name === "boar") {
    G.player.flags.boar = true; G.player.maxHp += 30; G.player.hp += 30;
    toast("A boar joins your side. +30 max HP.", "good");
  }
  save();
}
function completeQuest(id) {
  if (G.player.quests[id] === "inprogress" || G.player.quests[id] === "available") {
    G.player.quests[id] = "complete";
    toast(`Quest complete: ${QUESTS[id].name}`, "good");
    if (id === "bolt") addWeapon("gold");
    if (id === "fleece") G.player.flags.fleece = true;
    if (id === "artemis") grantFlag("boar");
  }
}
function addWeapon(k) {
  if (!G.player.weapons.includes(k)) {
    G.player.weapons.push(k);
    G.player.weapon = k;
  }
}
function heal(amount) {
  G.player.hp = Math.min(G.player.maxHp, G.player.hp + amount);
}

// ===== KILLS =====
function onKillMonster(mid) {
  G.player.monsterKills++;
  grantAchievement("firstBlood");
  if (G.player.monsterKills >= 5) grantAchievement("monsterSlayer");
  save();
}

// ===== COMBAT =====
function startCombat(opts) {
  G.mode = "combat";
  G.combat = {
    label: opts.label || "Combat",
    onWin: opts.onWin || (() => {}),
    onLose: opts.onLose,
    packBonus: !!opts.packBonus,
    allyIfFlag: opts.allyIfFlag,
    rangedRequired: !!opts.rangedRequired,
    timer: 0,
  };
  G.entities = [];

  // place player
  G.player.x = 100; G.player.y = H/2;

  // spawn enemies
  const mons = opts.mons || [];
  mons.forEach((mid, i) => {
    const base = MONSTERS[mid];
    if (!base) return;
    let lv = base.level;
    if (opts.packBonus && (mid === "hellhound" || mid === "dracaena")) lv = Math.min(8, lv + 1);
    const s = statsFor(lv);
    const e = {
      mid, name: base.name, color: base.color, note: base.note,
      x: 700 + (i % 3) * 60 - 60,
      y: 120 + (i % 4) * 100,
      w: 22, h: 22,
      hp: s.hp, maxHp: s.hp, dmg: s.dmg, speed: s.speed,
      attackCd: 0,
      stunT: 0,
      level: lv,
    };
    // Adjust spawn positions a bit
    e.x += (Math.random()*40 - 20);
    e.y += (Math.random()*40 - 20);
    e.y = Math.max(60, Math.min(H - 60, e.y));
    G.entities.push(e);
  });

  // ally summon from automatons
  if (opts.allyIfFlag && G.player.flags[opts.allyIfFlag]) {
    G.entities.push({
      mid: "ally", name: "Bronze Automaton", color: "#d4a040",
      x: 160, y: H/2 + 60, w: 22, h: 22,
      hp: 80, maxHp: 80, dmg: 6, speed: 110,
      attackCd: 0, level: 4, ally: true,
    });
    toast("An Automaton statue grinds to life and joins you.", "info");
  }

  if (G.combat.rangedRequired && !WEAPONS[G.player.weapon].ranged) {
    toast("A ranged weapon (Bow of Apollo) would help here.", "info");
  }
}

function endCombat(won) {
  if (won) {
    toast(`Victory: ${G.combat.label}`, "good");
    G.combat.onWin && G.combat.onWin();
  } else {
    toast("You fell. Respawning at Half-Blood Hill.", "bad");
    G.combat.onLose && G.combat.onLose();
    G.player.hp = G.player.maxHp;
    enterMap("camp-hb");
  }
  G.combat = null;
  G.entities = [];
  G.swing = null;
  G.mode = "play";
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
  G.cooldownTouch = {}; // reset
  save();
}

// ===== INPUT =====
function setupInput() {
  window.addEventListener("keydown", e => {
    if (G.keys[e.code]) return; // ignore repeat for edge triggers
    G.keys[e.code] = true;
    G.pressedThisFrame[e.code] = true;

    // Global
    if (e.code === "Escape") {
      e.preventDefault();
      if (G.mode === "menu") { closeOverlay(); return; }
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

    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","Enter","KeyW","KeyA","KeyS","KeyD"].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", e => {
    G.keys[e.code] = false;
  });
}

// ===== UPDATE — PLAY MODE =====
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

  const { dx, dy } = inputAxis();
  const speed = p.moveSpeed;
  p.x += dx * speed * dt;
  p.y += dy * speed * dt;
  if (dx || dy) { p.dir.x = dx; p.dir.y = dy; }

  // Clamp inside canvas with a border
  p.x = Math.max(10, Math.min(W - 10 - p.w, p.x));
  p.y = Math.max(10, Math.min(H - 10 - p.h, p.y));

  // Subzone overlap → trigger
  const m = MAPS[G.mapId];
  const now = performance.now();
  for (const z of m.subzones) {
    const inside = (p.x + p.w > z.x && p.x < z.x + z.w &&
                    p.y + p.h > z.y && p.y < z.y + z.h);
    if (inside) {
      const last = G.cooldownTouch[z.id] || 0;
      if (now - last > 800) {
        G.cooldownTouch[z.id] = now;
        // Push player out of the zone so they don't re-trigger
        const cx = z.x + z.w/2, cy = z.y + z.h/2;
        const tx = p.x + p.w/2, ty = p.y + p.h/2;
        const ddx = tx - cx, ddy = ty - cy;
        if (Math.abs(ddx) > Math.abs(ddy)) {
          p.x = ddx > 0 ? z.x + z.w + 2 : z.x - p.w - 2;
        } else {
          p.y = ddy > 0 ? z.y + z.h + 2 : z.y - p.h - 2;
        }
        p.x = Math.max(10, Math.min(W - 10 - p.w, p.x));
        p.y = Math.max(10, Math.min(H - 10 - p.h, p.y));
        triggerAction(z);
        break;
      }
    }
  }

  // Special key — heal in play mode too
  if (G.pressedThisFrame.Enter) tryUseSpecial();
}

// ===== UPDATE — COMBAT =====
function updateCombat(dt) {
  const p = G.player;
  if (p.specialCooldown > 0) p.specialCooldown = Math.max(0, p.specialCooldown - dt);

  // Move player
  const { dx, dy } = inputAxis();
  p.x += dx * p.moveSpeed * dt;
  p.y += dy * p.moveSpeed * dt;
  if (dx || dy) { p.dir.x = dx; p.dir.y = dy; }
  p.x = Math.max(10, Math.min(W - 10 - p.w, p.x));
  p.y = Math.max(60, Math.min(H - 10 - p.h, p.y));

  // Attack
  if (G.pressedThisFrame.Space && !G.swing) {
    const w = WEAPONS[p.weapon];
    G.swing = { t: 0, weapon: p.weapon, dx: p.dir.x, dy: p.dir.y, hits: [] };
  }
  if (G.swing) {
    G.swing.t += dt;
    const w = WEAPONS[G.swing.weapon];
    // damage application halfway through swing
    if (G.swing.t >= w.cd * 0.35 && G.swing.hits.length === 0) {
      const reach = w.reach;
      const angleArc = w.ranged ? Math.PI/8 : Math.PI/3;
      // direction vector
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
        if (e.hp <= 0) {
          e.dead = true;
          if (e.mid !== "ally") onKillMonster(e.mid);
        }
      }
    }
    if (G.swing.t >= w.cd) G.swing = null;
  }

  // Special: heal 30
  if (G.pressedThisFrame.Enter) tryUseSpecial();

  // Allies attack nearest enemy
  for (const e of G.entities) {
    if (e.ally && !e.dead) {
      let nearest = null, nd = Infinity;
      for (const m of G.entities) {
        if (m === e || m.dead || m.ally) continue;
        const d = Math.hypot(m.x - e.x, m.y - e.y);
        if (d < nd) { nd = d; nearest = m; }
      }
      if (nearest) {
        const dx2 = nearest.x - e.x, dy2 = nearest.y - e.y;
        const dl = Math.hypot(dx2, dy2) || 1;
        e.x += (dx2/dl) * e.speed * dt;
        e.y += (dy2/dl) * e.speed * dt;
        e.attackCd = (e.attackCd || 0) - dt;
        if (nd < 28 && e.attackCd <= 0) {
          nearest.hp -= e.dmg;
          e.attackCd = 0.7;
          spawnFloat(nearest.x + nearest.w/2, nearest.y, `-${e.dmg}`, "#d4a040");
          if (nearest.hp <= 0) { nearest.dead = true; onKillMonster(nearest.mid); }
        }
      }
    }
  }

  // Enemy AI: move toward player, contact damage
  for (const e of G.entities) {
    if (e.dead || e.ally) continue;
    if (e.stunT > 0) { e.stunT -= dt; continue; }
    // Some monsters (charybdis) suck player in instead of chasing
    if (e.mid === "charybdis") {
      // pull player toward enemy
      const dx2 = e.x - p.x, dy2 = e.y - p.y;
      const dl = Math.hypot(dx2, dy2) || 1;
      p.x += (dx2/dl) * 30 * dt;
      p.y += (dy2/dl) * 30 * dt;
    }
    // Sirens prefer to keep distance
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
      // empousa charm: occasional double-damage
      if (e.mid === "empousa" && Math.random() < 0.25) dmg *= 2;
      p.hp -= dmg;
      e.attackCd = 0.9;
      spawnFloat(p.x + p.w/2, p.y, `-${dmg}`, "#ff7070");
      // thanatos freeze
      if (e.mid === "thanatos" && Math.random() < 0.3) {
        p.frozenT = 3.0;
        toast("Thanatos freezes you for 3 seconds.", "bad");
      }
    }
  }

  // Player frozen
  if (p.frozenT > 0) {
    p.frozenT -= dt;
    // override movement: snap back
    // (handled by not letting them move would be cleaner; this is a soft penalty)
  }

  // Remove dead enemies after delay
  G.entities = G.entities.filter(e => !e.dead || (e.deadT = (e.deadT || 0) + dt) < 0.35);

  // Check end of combat
  const enemies = G.entities.filter(e => !e.dead && !e.ally);
  if (enemies.length === 0) {
    endCombat(true);
    return;
  }
  if (p.hp <= 0) {
    endCombat(false);
    return;
  }
}

function tryUseSpecial() {
  const p = G.player;
  if (p.specialCooldown > 0) {
    toast(`Special on cooldown (${Math.ceil(p.specialCooldown)}s)`, "bad");
    return;
  }
  // Ghost army option in combat
  if (G.mode === "combat" && p.flags.ghostArmyUses > 0) {
    p.flags.ghostArmyUses--;
    for (let i = 0; i < 3; i++) {
      G.entities.push({
        mid: "ally", name: "Ghost", color: "#c8d0e0",
        x: G.player.x + 24, y: G.player.y + (i-1)*30,
        w: 18, h: 18, hp: 40, maxHp: 40, dmg: 8, speed: 130,
        ally: true, attackCd: 0, level: 4,
      });
    }
    toast(`Ghost Army summoned! Remaining uses: ${p.flags.ghostArmyUses}`, "good");
    p.specialCooldown = 10;
    save();
    return;
  }
  // Default: heal 30
  const beforeHp = p.hp;
  heal(30);
  const healed = p.hp - beforeHp;
  toast(healed > 0 ? `+${healed} HP` : "Already full HP.", healed > 0 ? "good" : "info");
  const cd = G.player.characters.includes("annabeth") ? 6 : 10;
  p.specialCooldown = cd;
  save();
}

// ===== FLOATING NUMBERS =====
const floats = [];
function spawnFloat(x, y, text, color) {
  floats.push({ x, y, text, color, t: 0 });
}

// ===== RENDER =====
function render() {
  const ctx = G.ctx;
  ctx.clearRect(0, 0, W, H);

  if (G.mode === "play" || G.mode === "menu" && !G.combat) renderPlay();
  if (G.mode === "combat" || (G.mode === "menu" && G.combat)) renderCombat();

  // Floating damage numbers
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.t += 0.016;
    if (f.t > 0.8) { floats.splice(i, 1); continue; }
    ctx.fillStyle = f.color;
    ctx.font = "bold 16px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.globalAlpha = 1 - f.t / 0.8;
    ctx.fillText(f.text, f.x, f.y - f.t * 40);
    ctx.globalAlpha = 1;
  }

  updateHUD();
}

function renderPlay() {
  const ctx = G.ctx;
  const m = MAPS[G.mapId];

  // Background
  ctx.fillStyle = m.bg;
  ctx.fillRect(0, 0, W, H);
  drawBgPattern(m.bgPattern);

  // Map label / parent
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = "bold 36px -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(m.label, W - 16, H - 18);

  // Esc hint
  if (m.parent) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Esc — leave to " + MAPS[m.parent].label, 12, H - 10);
  }

  // Sub-zones
  for (const z of m.subzones) {
    // Glow pulse
    const t = performance.now() / 700;
    const pulse = 0.15 + 0.1 * (Math.sin(t + z.x*0.01) * 0.5 + 0.5);
    ctx.fillStyle = z.color;
    ctx.globalAlpha = 0.85;
    roundRect(ctx, z.x, z.y, z.w, z.h, 10);
    ctx.fill();
    // Border
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255," + pulse + ")";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.textAlign = "center";
    wrapText(ctx, z.name, z.x + z.w/2, z.y + z.h/2 + 4, z.w - 8, 16);
  }

  // Half-Blood Hill marker on Camp HB
  if (G.mapId === "camp-hb") {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "italic 12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Half-Blood Hill", 480, 530);
  }

  drawPlayer(ctx);
}

function renderCombat() {
  const ctx = G.ctx;
  ctx.fillStyle = "#1a1424";
  ctx.fillRect(0, 0, W, H);
  // Combat arena tiles
  ctx.fillStyle = "#251934";
  for (let i = 0; i < 30; i++) {
    for (let j = 0; j < 18; j++) {
      if ((i + j) % 2 === 0) ctx.fillRect(i * 32, j * 32 + 40, 32, 32);
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "bold 14px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(G.combat.label, W/2, 28);

  // Enemies
  for (const e of G.entities) {
    if (e.deadT !== undefined) ctx.globalAlpha = Math.max(0, 1 - e.deadT / 0.35);
    ctx.fillStyle = e.color;
    roundRect(ctx, e.x, e.y, e.w, e.h, 4); ctx.fill();
    if (e.ally) {
      ctx.strokeStyle = "#80f0a0";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // HP bar
    if (!e.dead) {
      const barW = Math.max(28, e.w);
      ctx.fillStyle = "#3a0a0a";
      ctx.fillRect(e.x - (barW - e.w)/2, e.y - 8, barW, 4);
      ctx.fillStyle = e.ally ? "#5cd97e" : "#e04848";
      ctx.fillRect(e.x - (barW - e.w)/2, e.y - 8, barW * (e.hp/e.maxHp), 4);
      // name
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "10px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${e.name} L${e.level}`, e.x + e.w/2, e.y - 12);
    }
    ctx.globalAlpha = 1;
  }

  // Player
  drawPlayer(ctx);

  // Swing arc
  if (G.swing) {
    const p = G.player;
    const w = WEAPONS[G.swing.weapon];
    const dlen = Math.hypot(G.swing.dx, G.swing.dy) || 1;
    const ax = G.swing.dx / dlen, ay = G.swing.dy / dlen;
    const cx = p.x + p.w/2, cy = p.y + p.h/2;
    const tr = G.swing.t / w.cd;
    ctx.save();
    ctx.translate(cx, cy);
    const angle = Math.atan2(ay, ax);
    ctx.rotate(angle);
    ctx.strokeStyle = w.ranged ? "#a0e0ff" : "#ffe898";
    ctx.lineWidth = w.ranged ? 2 : 4;
    ctx.globalAlpha = 1 - tr;
    ctx.beginPath();
    if (w.ranged) {
      ctx.moveTo(0, 0);
      ctx.lineTo(w.reach * (tr*1.5), 0);
    } else {
      const arc = Math.PI/3;
      ctx.arc(0, 0, w.reach, -arc/2 + tr*arc, arc/2);
    }
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Esc hint
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("(flee with Esc — but you lose progress)", 10, H - 10);
}

function drawPlayer(ctx) {
  const p = G.player;
  ctx.fillStyle = "#5fb8ff";
  roundRect(ctx, p.x, p.y, p.w, p.h, 4); ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Facing dot
  const cx = p.x + p.w/2, cy = p.y + p.h/2;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx + p.dir.x * 7, cy + p.dir.y * 7, 2, 0, Math.PI*2);
  ctx.fill();

  // Frozen visual
  if (p.frozenT > 0) {
    ctx.strokeStyle = "#80d0ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6);
  }
}

// Drawing helpers
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "", lines = [];
  for (let w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line); line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  const start = y - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, start + i * lh));
}
function drawBgPattern(p) {
  const ctx = G.ctx;
  if (!p) return;
  ctx.save();
  ctx.globalAlpha = 0.12;
  if (p === "grass") {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 60; i++) {
      const x = (i * 137) % W, y = (i * 79) % H;
      ctx.fillRect(x, y, 2, 6);
    }
  } else if (p === "water") {
    ctx.strokeStyle = "#cfe8ff";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      const yy = i * 55 + ((performance.now()/30)%55);
      ctx.moveTo(0, yy);
      for (let x = 0; x < W; x += 30) ctx.quadraticCurveTo(x + 15, yy - 4, x + 30, yy);
      ctx.stroke();
    }
  } else if (p === "city") {
    ctx.fillStyle = "#000";
    for (let i = 0; i < 30; i++) ctx.fillRect((i*61)%W, (i*97)%H, 1, 60);
  } else if (p === "shadow") {
    ctx.fillStyle = "#000";
    for (let i = 0; i < 100; i++) ctx.fillRect((i*41)%W, (i*73)%H, 3, 3);
  } else if (p === "clouds") {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 14; i++) {
      const x = (i * 89 + (performance.now()/40)) % (W + 200) - 100;
      const y = (i * 51) % H;
      ctx.beginPath();
      ctx.ellipse(x, y, 70, 18, 0, 0, Math.PI*2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ===== LOOP =====
function loop(t) {
  const dt = Math.min(0.05, (t - G.lastT) / 1000) || 0;
  G.lastT = t;

  if (G.mode === "play") updatePlay(dt);
  else if (G.mode === "combat") updateCombat(dt);
  // menu mode: paused

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

  document.getElementById("reset-btn").onclick = () => {
    if (confirm("Erase your save and start a new game?")) resetSave();
  };

  setupInput();

  if (!load()) {
    G.player = defaultPlayer();
    G.mapId = "camp-hb";
    toast("Welcome to The Arena. You spawn at Half-Blood Hill.", "info");
  } else {
    toast("Save loaded.", "info");
  }

  // First load: ensure correct spawn
  if (!MAPS[G.mapId]) G.mapId = "camp-hb";
  // Don't re-snap player if save included position — keep their place
  G.player.x = G.player.x || MAPS[G.mapId].spawn.x;
  G.player.y = G.player.y || MAPS[G.mapId].spawn.y;

  requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", init);

})();
