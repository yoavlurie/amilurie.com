/* ============================================================
   The Arena — first-person 3D demigod action RPG
   ============================================================ */
(function () {
"use strict";

// ===== CONFIG =====
const W = 960, H = 600;
const FOV = Math.PI / 2.5;                   // 72°
const HALF_FOV = FOV / 2;
const PROJ = (W / 2) / Math.tan(HALF_FOV);   // perspective projection plane distance
const RAY_STEP = 2;                           // sample every N pixels horizontally
const NUM_RAYS = Math.ceil(W / RAY_STEP);
const WALL_TALL = 60;                         // world-units tall
const PLAYER_R = 10;                          // player collision radius
const MOVE_SPEED = 130;                       // world units / sec
const TURN_SPEED = 2.8;                       // rad / sec
const WORLD_SCALE = 2;                        // multiplier for MAP coordinates

// ===== WEAPONS =====
const WEAPONS = {
  bronze: { name: "Bronze Dagger", dmg: 8,  reach: 60,  cd: 0.32 },
  c1:     { name: "Bolt of Zeus", dmg: 18, reach: 90,  cd: 0.45 },
  c2:     { name: "Sacred Mace (Hera)", dmg: 11, reach: 65, cd: 0.32 },
  c3:     { name: "Riptide (Poseidon)", dmg: 16, reach: 80, cd: 0.32 },
  c4:     { name: "Sickle (Demeter)", dmg: 12, reach: 70, cd: 0.30 },
  c5:     { name: "Spear of Ares", dmg: 15, reach: 100, cd: 0.40 },
  c6:     { name: "Owl Blade (Athena)", dmg: 13, reach: 70, cd: 0.28 },
  c7:     { name: "Bow of Apollo", dmg: 12, reach: 400, cd: 0.45, ranged: true },
  c8:     { name: "Hunters' Knife (Artemis)", dmg: 14, reach: 65, cd: 0.26 },
  c9:     { name: "War Hammer (Hephaestus)", dmg: 20, reach: 80, cd: 0.55 },
  c10:    { name: "Charm Dagger (Aphrodite)", dmg: 10, reach: 60, cd: 0.24 },
  c11:    { name: "Caduceus (Hermes)", dmg: 11, reach: 65, cd: 0.22 },
  c12:    { name: "Vine Whip (Dionysus)", dmg: 12, reach: 90, cd: 0.35 },
  gold:   { name: "Gold Sword", dmg: 24, reach: 80, cd: 0.32 },
};

// ===== MONSTERS =====
// shape: humanoid | beast | ghost | bug | cyclops | snake
const MONSTERS = {
  myrmeke:    { name: "Myrmeke",     level: 2, color: "#1a1a1a", shape: "bug" },
  shark:      { name: "Shark",       level: 3, color: "#7a8492", shape: "beast" },
  demigod:    { name: "Demigod",     level: 2, color: "#c0d860", shape: "humanoid" },
  mrsDodds:   { name: "Mrs. Dodds",  level: 2, color: "#666c78", shape: "humanoid" },
  empousa:    { name: "Empousa",     level: 4, color: "#e04848", shape: "humanoid" },
  hyperion:   { name: "Hyperion",    level: 5, color: "#ff5020", shape: "humanoid" },
  hellhound:  { name: "Hellhound",   level: 3, color: "#1d1418", shape: "beast" },
  dracaena:   { name: "Dracaena",    level: 3, color: "#3a8a4a", shape: "snake" },
  laistry:    { name: "Laistrygonian Giant", level: 3, color: "#6b4422", shape: "humanoid" },
  chimera:    { name: "Chimera",     level: 6, color: "#8a8076", shape: "beast" },
  echidna:    { name: "Echidna",     level: 6, color: "#9a8276", shape: "snake" },
  medusa:     { name: "Medusa",      level: 5, color: "#5aa860", shape: "humanoid" },
  lotus:      { name: "Lotus Eater", level: 5, color: "#d090e0", shape: "humanoid" },
  atlas:      { name: "Atlas",       level: 7, color: "#8c8c8c", shape: "humanoid" },
  enceladus:  { name: "Enceladus",   level: 7, color: "#a06038", shape: "humanoid" },
  procrustes: { name: "Procrustes",  level: 3, color: "#7d7d7d", shape: "humanoid" },
  ghost:      { name: "Rogue Ghost", level: 3, color: "#c8d0e0", shape: "ghost" },
  thanatos:   { name: "Thanatos",    level: 6, color: "#0a0a0a", shape: "humanoid", note: "freezes 3s on hit" },
  hades:      { name: "Hades",       level: 8, color: "#1a0a1a", shape: "humanoid" },
  fury:       { name: "Fury",        level: 6, color: "#404048", shape: "ghost" },
  persephone: { name: "Persephone",  level: 6, color: "#a02030", shape: "humanoid" },
  charon:     { name: "Charon",      level: 6, color: "#1a1a1a", shape: "humanoid" },
  cerberus:   { name: "Cerberus",    level: 7, color: "#5a3a20", shape: "beast" },
  sheep:      { name: "Sheep",       level: 4, color: "#f0f0f0", shape: "beast" },
  polyphemus: { name: "Polyphemus",  level: 7, color: "#90897a", shape: "cyclops" },
  scylla:     { name: "Scylla",      level: 6, color: "#c84040", shape: "snake" },
  charybdis:  { name: "Charybdis",   level: 6, color: "#3060a0", shape: "ghost", note: "sucks you in" },
  circe:      { name: "Circe",       level: 6, color: "#a060c0", shape: "humanoid" },
  siren:      { name: "Siren",       level: 6, color: "#9090a0", shape: "humanoid" },
  ares:       { name: "Ares",        level: 6, color: "#c02020", shape: "humanoid" },
  octavian:   { name: "Octavian",    level: 2, color: "#cfb98f", shape: "humanoid" },
  legion:     { name: "Roman Legionnaire", level: 3, color: "#a04030", shape: "humanoid" },
};

function statsFor(lv) {
  const table = {
    1: { hp: 25, dmg: 3, speed: 60 },
    2: { hp: 40, dmg: 4, speed: 65 },
    3: { hp: 60, dmg: 5, speed: 70 },
    4: { hp: 90, dmg: 7, speed: 75 },
    5: { hp: 130, dmg: 9, speed: 80 },
    6: { hp: 180, dmg: 12, speed: 85 },
    7: { hp: 240, dmg: 15, speed: 90 },
    8: { hp: 330, dmg: 18, speed: 95 },
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
  bolt:    { name: "The Master Bolt",  desc: "Zeus's master bolt was stolen. Travel to the Underworld and retrieve it.", reward: "Gold Sword." },
  fleece:  { name: "The Golden Fleece", desc: "Sail to the Sea of Monsters and steal the Golden Fleece.",                reward: "Golden Fleece (heal)." },
  artemis: { name: "Free Artemis",      desc: "Atlas tricked Artemis into bearing the sky. Defeat Atlas on Mt. Tam.",    reward: "Boar mount." },
};

// ===== MAPS =====
// pos() scales source coords up so the world is bigger than the screen.
function pos(x, y, w, h) { return { x: x * WORLD_SCALE, y: y * WORLD_SCALE, w: w * WORLD_SCALE, h: h * WORLD_SCALE }; }
function sp(x, y) { return { x: x * WORLD_SCALE, y: y * WORLD_SCALE }; }

const MAPS = {
  main: {
    label: "The World", tileStyle: "overworld",
    spawn: sp(480, 540),
    subzones: [
      { id:"camp-hb",     name:"Camp Half-Blood",   outdoor:true, ...pos( 40,  40, 240, 200), color:"#a8c97e", action:{ type:"goto", to:"camp-hb" } },
      { id:"long-island", name:"Long Island Sound", outdoor:true, ...pos(360,  40, 240, 200), color:"#5a93c8", action:{ type:"goto", to:"long-island" } },
      { id:"camp-j",      name:"Camp Jupiter",      outdoor:true, ...pos(680,  40, 240, 200), color:"#c89a5a", action:{ type:"goto", to:"camp-j", achievement:"newRome" } },
      { id:"manhattan",   name:"Manhattan",         outdoor:true, ...pos( 40, 360, 240, 200), color:"#7e7e8c", action:{ type:"goto", to:"manhattan", achievement:"citySlicker" } },
      { id:"vegas",       name:"Las Vegas",         outdoor:true, ...pos(360, 360, 240, 200), color:"#d4a847", action:{ type:"goto", to:"vegas" } },
      { id:"la",          name:"L.A.",              outdoor:true, ...pos(680, 360, 240, 200), color:"#e08068", action:{ type:"goto", to:"la" } },
    ],
  },
  "camp-hb": {
    label: "Camp Half-Blood", parent: "main", tileStyle: "grass",
    spawn: sp(480, 540),
    subzones: [
      ...Array.from({ length: 12 }, (_, i) => {
        const row = Math.floor(i / 6), col = i % 6;
        const cabinNames = ["Zeus","Hera","Poseidon","Demeter","Ares","Athena","Apollo","Artemis","Hephaestus","Aphrodite","Hermes","Dionysus"];
        const cabinColors = ["#fff7a8","#dfd0ff","#9bd0f0","#d8ef9b","#f09898","#e8e0b8","#fff0a0","#d0e8ff","#d4a070","#ffc8d8","#d0d0d0","#b88dd0"];
        return {
          id: `cabin${i+1}`, name: `Cabin ${i+1}: ${cabinNames[i]}`,
          ...pos(40 + col * 150, 30 + row * 110, 110, 70),
          color: cabinColors[i], interior: "cabin",
          action: { type: "cabin", weapon: `c${i+1}`, label: cabinNames[i] },
        };
      }),
      { id:"arena",    name:"Arena",         ...pos(360, 380, 200, 130), color:"#c98a4a", interior:"arena",    action:{ type:"arena" } },
      { id:"bighouse", name:"Big House",     ...pos( 60, 380, 200, 130), color:"#854a2a", interior:"bighouse", action:{ type:"bighouse" } },
      { id:"myrmekes", name:"Myrmekes Lair", ...pos(680, 380, 200, 130), color:"#2a2a2a", interior:"lair",     action:{ type:"fight", mons:["myrmeke","myrmeke","myrmeke"] } },
    ],
  },
  "long-island": {
    label: "Long Island Sound", parent: "main", tileStyle: "water",
    spawn: sp(480, 540),
    subzones: [
      { id:"som-portal", name:"Sea of Monsters →", ...pos( 80, 70, 280, 180), color:"#5aa8d8", interior:"portal", action:{ type:"goto", to:"sea-of-monsters" } },
      { id:"poseidon",   name:"Poseidon's Palace", ...pos(600, 70, 280, 180), color:"#7ac8f0", interior:"palace", action:{ type:"fight", mons:["shark","shark"], unlock:"tyson", reqInfo:"Defeat the sharks to unlock Tyson." } },
    ],
  },
  "camp-j": {
    label: "Camp Jupiter", parent: "main", tileStyle: "sand",
    spawn: sp(480, 540),
    subzones: [
      { id:"temple-j",   name:"Temple of Jupiter", ...pos( 60,  60, 220, 140), color:"#e8c068", interior:"temple",   action:{ type:"dialog", id:"octavian" } },
      { id:"temple-m",   name:"Temple of Mars",    ...pos(360,  60, 240, 140), color:"#c84040", interior:"temple",   action:{ type:"shop",   id:"mars" } },
      { id:"field-mars", name:"Field of Mars",     ...pos(680,  60, 220, 140), color:"#8a4030", interior:"fortress", action:{ type:"fight",  mons:["legion","legion","legion","legion"], unlock:"hazel", reqInfo:"Invade the fortress to unlock Hazel." } },
      { id:"mess",       name:"Mess Hall",         ...pos(360, 380, 240, 140), color:"#d4b878", interior:"mess",     action:{ type:"heal",   amount:"full", msg:"You eat your fill. Fully healed." } },
    ],
  },
  manhattan: {
    label: "Manhattan", parent: "main", tileStyle: "city",
    spawn: sp(480, 540),
    subzones: [
      { id:"central-park", name:"Central Park",       ...pos( 30,  30, 200, 120), color:"#7ea860", interior:"portal",  action:{ type:"goto",  to:"underworld", achievement:"ghostKing", msg:"You found the hidden entrance to the Underworld." } },
      { id:"met",          name:"The MET",            ...pos( 30, 170, 200, 120), color:"#a09078", interior:"museum",  action:{ type:"fight", mons:["mrsDodds"], unlock:"selina", reqInfo:"Defeat Mrs. Dodds to unlock Selina." } },
      { id:"plaza",        name:"The Plaza",          ...pos(260,  30, 200, 120), color:"#c8a060", interior:"hotel",   action:{ type:"fight", mons:["empousa"], grant:"automatons", reqInfo:"Defeat the Empousa to summon the automatons." } },
      { id:"grand-central",name:"Grand Central",      ...pos(260, 170, 200, 120), color:"#9c8a60", interior:"station", action:{ type:"fight", mons:["hyperion"], allyIfFlag:"automatons", reqInfo:"Defeat Hyperion. Defeated Empousa? Hermes statue helps." } },
      { id:"wmbridge",     name:"Williamsburg Br.",   ...pos(490,  30, 200, 120), color:"#6a6a78", interior:"bridge",  action:{ type:"fight", mons:["hellhound","hellhound","hellhound","hellhound","hellhound"], packBonus:true, unlock:"mrsOleary", reqInfo:"Win to befriend Mrs. O'Leary." } },
      { id:"meriwether",   name:"Meriwether Prep",    ...pos(490, 170, 200, 120), color:"#a89868", interior:"school",  action:{ type:"fight", mons:["laistry","laistry","laistry"], unlock:"rachel", reqInfo:"Defeat the Giants to unlock Rachel." } },
      { id:"library",      name:"NY Public Library",  ...pos(720,  30, 210, 120), color:"#b89870", interior:"library", action:{ type:"fight", mons:["dracaena","dracaena","dracaena"], packBonus:true, allyIfFlag:"automatons", unlock:"beckendorf", reqInfo:"Lion statue helps if you have automatons. Unlocks Beckendorf." } },
      { id:"esb",          name:"Empire State Bldg",  ...pos(720, 170, 210, 120), color:"#7080a0", interior:"portal",  action:{ type:"goto",  to:"olympus", achievement:"ascension" } },
    ],
  },
  vegas: {
    label: "Las Vegas", parent: "main", tileStyle: "sand",
    spawn: sp(480, 540),
    subzones: [
      { id:"arch",   name:"Gateway Arch", ...pos( 60, 60, 240, 240), color:"#b8b8b8", interior:"arch",  action:{ type:"fight", mons:["chimera","echidna"], unlock:"frank", reqInfo:"Defeat Chimera & Echidna to unlock Frank." } },
      { id:"garden", name:"Auntie Em's",  ...pos(360, 60, 240, 240), color:"#7aa84a", interior:"garden", action:{ type:"fight", mons:["medusa"], unlock:"grover", reqInfo:"Defeat Medusa to unlock Grover." } },
      { id:"lotus",  name:"Lotus Hotel",  ...pos(660, 60, 240, 240), color:"#e0a8d8", interior:"hotel",  action:{ type:"fight", mons:Array(10).fill("lotus"), unlock:"piper", reqInfo:"Win against 10 lotus eaters to unlock Piper." } },
    ],
  },
  la: {
    label: "L.A.", parent: "main", tileStyle: "pavement",
    spawn: sp(480, 540),
    subzones: [
      { id:"mt-tam",    name:"Mount Tam",                ...pos( 30, 60, 220, 240), color:"#8c8c8c", interior:"mountain", action:{ type:"fight", mons:["atlas"],     unlock:"annabeth", quest:"artemis", reqInfo:"Defeat Atlas to free Artemis and unlock Annabeth." } },
      { id:"mt-diablo", name:"Mount Diablo",             ...pos(280, 60, 220, 240), color:"#a04030", interior:"mountain", action:{ type:"fight", mons:["enceladus"], unlock:"leo", reqInfo:"Defeat Enceladus to unlock Leo." } },
      { id:"crusty",    name:"Crusty's Waterbed Palace", ...pos(530, 60, 200, 240), color:"#aaa",    interior:"shop",     action:{ type:"fight", mons:["procrustes"], unlock:"bianca", reqInfo:"Defeat Procrustes to unlock Bianca." } },
      { id:"doa",       name:"D.O.A. Studio",            ...pos(760, 60, 170, 240), color:"#1a1a1a", interior:"portal",   action:{ type:"goto",  to:"underworld",   achievement:"ghostKing" } },
    ],
  },
  underworld: {
    label: "The Underworld", parent: "main", tileStyle: "shadow",
    spawn: sp(480, 540),
    subzones: [
      { id:"tartarus-portal", name:"Entrance to Tartarus", ...pos( 40,  60, 230, 180), color:"#1a0a1a", interior:"portal", action:{ type:"goto", to:"tartarus" } },
      { id:"hades-palace",    name:"Palace of Hades",      ...pos(370,  60, 230, 180), color:"#4a2030", interior:"portal", action:{ type:"goto", to:"hades-palace" } },
      { id:"asphodel",        name:"Fields of Asphodel",   ...pos(700,  60, 220, 180), color:"#6a5a6a", interior:"fields", action:{ type:"fight", mons:["ghost","ghost","ghost"], grant:"wingedShoes", reqInfo:"Win to claim the Winged Shoes (flight)." } },
      { id:"styx-exit",       name:"River Styx (Exit)",    ...pos(370, 380, 230, 150), color:"#0a4a6a", interior:"river",  action:{ type:"fight", mons:["charon","cerberus"], grant:"ghostArmy", reqInfo:"Survive Charon & Cerberus for Ghost Army (2 uses)." } },
    ],
  },
  "hades-palace": {
    label: "Palace of Hades", parent: "underworld", tileStyle: "cave",
    spawn: sp(480, 540),
    subzones: [
      { id:"entrance", name:"Entrance",            ...pos( 40,  60, 280, 220), color:"#3a1a3a", interior:"throne", action:{ type:"fight", mons:["thanatos"], msg:"Survive Thanatos and you keep your life." } },
      { id:"throne",   name:"Throne Room (Hades)", ...pos(360,  60, 240, 220), color:"#4a1a30", interior:"throne", action:{ type:"fight", mons:["hades"], unlock:"nico", reqInfo:"Defeat Hades to unlock Nico." } },
      { id:"hall",     name:"Hall of the Furies",  ...pos(640,  60, 240, 220), color:"#3a3030", interior:"throne", action:{ type:"fight", mons:["fury","fury","fury"], unlock:"nico", reqInfo:"Defeat the Furies to unlock Nico." } },
      { id:"garden",   name:"Persephone's Garden", ...pos(290, 360, 360, 170), color:"#6a3060", interior:"garden", action:{ type:"fight", mons:["persephone"], grant:"ghostArmy", reqInfo:"Defeat Persephone for Ghost Army (2 uses)." } },
    ],
  },
  "sea-of-monsters": {
    label: "Sea of Monsters", parent: "long-island", tileStyle: "water",
    spawn: sp(480, 540),
    subzones: [
      { id:"ccs",        name:"C.C.'s Spa & Resort",  ...pos( 40,  60, 220, 220), color:"#b070c0", interior:"spa",     action:{ type:"fight", mons:["circe"], grant:"waterbreath", reqInfo:"Defeat Circe to gain underwater breathing." } },
      { id:"polyphemus", name:"Polyphemus's Island",  ...pos(370,  60, 220, 220), color:"#a08050", interior:"cave",    action:{ type:"fight", mons:["polyphemus","sheep","sheep","sheep"], grant:"fleece", quest:"fleece", reqInfo:"Win to claim the Golden Fleece." } },
      { id:"sirens",     name:"The Sirens",           ...pos(700,  60, 220, 220), color:"#a0a0c0", interior:"cliff",   action:{ type:"fight", mons:["siren","siren","siren"], rangedRequired:true, reqInfo:"Their song drags you in — bow recommended." } },
      { id:"scylla",     name:"Scylla & Charybdis",   ...pos(290, 360, 380, 180), color:"#7a3040", interior:"cliff",   action:{ type:"fight", mons:["scylla","charybdis"], unlock:"clarisse", reqInfo:"Get past them to unlock Clarisse." } },
    ],
  },
  olympus: {
    label: "Olympus (600th Floor)", parent: "main", tileStyle: "cloud",
    spawn: sp(480, 540),
    subzones: [
      { id:"throne-hall", name:"Throne Hall",       ...pos(280,  80, 400, 240), color:"#fffae0", interior:"throne", action:{ type:"dialog", id:"olympus" } },
      { id:"muses",       name:"Hall of Muses",     ...pos( 40, 380, 280, 140), color:"#e0f0ff", interior:"temple", action:{ type:"heal", amount:50, msg:"The Muses sing — you recover 50 HP." } },
      { id:"forge",       name:"Hephaestus' Forge", ...pos(640, 380, 280, 140), color:"#a06040", interior:"forge",  action:{ type:"shop", id:"forge" } },
    ],
  },
  tartarus: {
    label: "Tartarus", parent: "underworld", tileStyle: "shadow",
    spawn: sp(480, 540),
    subzones: [
      { id:"pit",   name:"The Pit",        ...pos(180, 60, 280, 240), color:"#2a0a1a", interior:"cave", action:{ type:"fight", mons:["fury","fury","hellhound","hellhound","hellhound"], packBonus:true, msg:"You survived the Pit." } },
      { id:"doors", name:"Doors of Death", ...pos(500, 60, 280, 240), color:"#1a0a05", interior:"cave", action:{ type:"fight", mons:["thanatos","cerberus"], msg:"You sealed the Doors of Death." } },
    ],
  },
};

// World bounds derived from map (1920x1200 by default)
function mapBounds(map) {
  if (map._bounds) return map._bounds;
  let mx = 0, my = 0;
  for (const z of map.subzones) { mx = Math.max(mx, z.x + z.w); my = Math.max(my, z.y + z.h); }
  // pad
  map._bounds = { w: Math.max(mx + 100, 1920), h: Math.max(my + 100, 1200) };
  return map._bounds;
}

// ===== STATE =====
const G = {
  canvas: null, ctx: null,
  hud: null, overlay: null, overlayPanel: null, toastStack: null,
  keys: {}, pressedThisFrame: {},
  lastT: 0,
  mode: "play",            // play | menu (and combat is in-world)
  mapId: "camp-hb",
  player: null,
  interior: null,          // { zone, w, h, walls, door, sprites }
  encounter: null,         // { mons[], onWin, onLose, label }
  sprites: [],             // active sprites in current scene (interior or outdoor)
  exitCooldown: 0,
  swing: null,             // { t, weapon, hit:false }
  hitFlash: 0,
  victoryFlash: 0,
};

function defaultPlayer() {
  return {
    x: 480 * WORLD_SCALE, y: 540 * WORLD_SCALE,
    angle: -Math.PI / 2,            // facing north (up in source coords)
    hp: 100, maxHp: 100,
    weapon: "bronze",
    weapons: ["bronze"],
    characters: [], achievements: [],
    flags: {},
    arenaWins: 0, monsterKills: 0,
    quests: { bolt: "available", fleece: "available", artemis: "available" },
    specialCooldown: 0,
    moveSpeed: MOVE_SPEED,
    frozenT: 0,
  };
}

// ===== SAVE / LOAD =====
const SAVE_KEY = "theArena.save.v3";
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ player: G.player, mapId: G.mapId }));
  } catch (e) {}
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    G.player = Object.assign(defaultPlayer(), d.player || {});
    G.mapId = d.mapId || "camp-hb";
    return true;
  } catch (e) { return false; }
}
function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  G.player = defaultPlayer();
  G.mapId = "camp-hb";
  G.interior = null;
  G.encounter = null;
  G.sprites = [];
  enterMap("camp-hb");
  toast("New game started.", "info"); save();
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
  if (G.interior) label += " — " + G.interior.zone.name;
  if (G.encounter) label += " — combat: " + G.encounter.label;
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
  G.mode = "play";
}
function openInventory() {
  const p = G.player;
  let html = `<h2>Inventory</h2><h3>Weapons</h3><div class="grid">`;
  Object.keys(WEAPONS).forEach(k => {
    const w = WEAPONS[k];
    const owned = p.weapons.includes(k), active = p.weapon === k;
    html += `<div class="item ${owned ? (active?'active':'') : 'locked'}" data-weapon="${k}">
      <span class="name">${w.name}</span>
      <span class="meta">${w.dmg} dmg · ${w.ranged?'ranged':'melee'}${owned?(active?' · equipped':' · click to equip'):' · locked'}</span>
    </div>`;
  });
  html += `</div><h3>Heroes</h3><div class="grid">`;
  Object.keys(CHARACTERS).forEach(k => {
    const c = CHARACTERS[k]; const owned = p.characters.includes(k);
    html += `<div class="item ${owned?'':'locked'}">
      <span class="name">${c.name}</span><span class="meta">${owned ? c.desc : "Locked"}</span>
    </div>`;
  });
  html += `</div>`;
  const items = [];
  if (p.flags.wingedShoes) items.push({ n:"Winged Shoes", d:"Flight (faster movement)" });
  if (p.flags.fleece)       items.push({ n:"Golden Fleece", d:"Heal to full once" });
  if (p.flags.waterbreath)  items.push({ n:"Underwater Breathing", d:"Sea travel safe" });
  if (p.flags.automatons)   items.push({ n:"Manhattan Automatons", d:"Statue allies in NY" });
  if (typeof p.flags.ghostArmyUses === "number" && p.flags.ghostArmyUses > 0)
    items.push({ n:`Ghost Army (×${p.flags.ghostArmyUses})`, d:"Press special in combat to summon" });
  if (p.flags.boar) items.push({ n:"Boar Mount", d:"Rideable ally — defends you" });
  if (items.length === 0) items.push({ n:"—", d:"No items yet" });
  html += `<h3>Items</h3><div class="grid">`;
  items.forEach(it => html += `<div class="item"><span class="name">${it.n}</span><span class="meta">${it.d}</span></div>`);
  html += `</div><h3>Achievements</h3><div class="grid">`;
  Object.keys(ACHIEVEMENTS).forEach(k => {
    const a = ACHIEVEMENTS[k]; const owned = p.achievements.includes(k);
    html += `<div class="item ${owned?'':'locked'}"><span class="name">${a.icon} ${a.name}</span><span class="meta">${a.desc}</span></div>`;
  });
  html += `</div><h3>Quests</h3><div class="grid">`;
  Object.keys(QUESTS).forEach(k => {
    const q = QUESTS[k]; const s = p.quests[k] || "available";
    html += `<div class="item ${s==='complete'?'active':(s==='inprogress'?'':'locked')}">
      <span class="name">${q.name} ${s==='complete'?'✓':''}</span><span class="meta">${q.desc}<br><b>Reward:</b> ${q.reward}</span></div>`;
  });
  html += `</div><div style="display:flex;gap:8px;"><button id="close-inv">Close (Shift / Esc)</button></div>`;
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
  let html = `<h2>${opts.title}</h2><p style="line-height:1.7;margin-bottom:1rem;">${opts.text}</p><div class="choice-list">`;
  opts.choices.forEach((c, i) => html += `<button data-choice="${i}">${c.label}</button>`);
  html += `</div>`;
  openOverlay(html);
  G.overlayPanel.querySelectorAll("[data-choice]").forEach(el => {
    el.onclick = () => {
      const i = parseInt(el.getAttribute("data-choice")); const c = opts.choices[i];
      closeOverlay(); if (c.onClick) c.onClick();
    };
  });
}
function openShop(id) {
  if (id === "bighouse") { openChiron(); return; }
  const shops = {
    mars:    { title:"Temple of Mars", lines:["Roman steel rests on the altar."], items:[ { label:"Take Pilum (Spear of Ares)", run:()=>{ addWeapon("c5"); toast("Acquired Spear of Ares.","good"); }} ]},
    forge:   { title:"Hephaestus' Forge", lines:["Celestial bronze edge."], items:[ { label:"Take Gold Sword", run:()=>{ addWeapon("gold"); toast("Acquired Gold Sword.","good"); }} ]},
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

// ===== CHIRON CONVERSATION =====
function openChiron() {
  const p = G.player;
  const greeting = p._talkedToChiron
    ? "\"Back so soon, hero? What troubles you?\""
    : "\"Welcome to Camp Half-Blood, young one. I am Chiron — trainer of heroes since before your great-grandfather drew breath. How may I help you?\"";
  p._talkedToChiron = true;

  openDialog({
    title: "Chiron, Trainer of Heroes",
    text: greeting,
    choices: [
      { label: "Tell me about a quest", onClick: chironQuests },
      { label: "I need advice — what should I do next?", onClick: chironAdvice },
      { label: "Tell me about the gods and this camp", onClick: chironLore },
      { label: "I need healing", onClick: chironHeal },
      { label: "Goodbye", onClick: () => toast("\"Stay sharp, hero.\"", "info") },
    ],
  });
}

function chironQuests() {
  const p = G.player;
  const choices = [];
  let intro = "\"The Fates whisper of three trials. ";
  const available = Object.keys(QUESTS).filter(k => p.quests[k] === "available").length;
  const inProgress = Object.keys(QUESTS).filter(k => p.quests[k] === "inprogress").length;
  const done = Object.keys(QUESTS).filter(k => p.quests[k] === "complete").length;
  if (done === 3) intro += "And you have completed them all — a true hero of Olympus.\"";
  else if (inProgress > 0) intro += `You are mid-quest. Finish what you began, then return.\"`;
  else if (available === 3) intro += "Choose one — but choose wisely.\"";
  else intro += "Which calls to you?\"";

  Object.keys(QUESTS).forEach(qk => {
    const q = QUESTS[qk]; const s = p.quests[qk];
    if (s === "available") {
      choices.push({ label: `► Accept: ${q.name}`, onClick: () => {
        p.quests[qk] = "inprogress"; save();
        openDialog({
          title: "Chiron",
          text: `"${q.desc}\n\nThe reward, should you succeed: ${q.reward}\n\nGo with the gods' blessing, hero."`,
          choices: [
            { label: "I will not fail.", onClick: () => toast(`Quest started: ${q.name}`, "good") },
            { label: "Tell me more about your other quests", onClick: chironQuests },
          ],
        });
      }});
    } else if (s === "inprogress") {
      choices.push({ label: `… In progress: ${q.name}`, onClick: () => openDialog({
        title: "Chiron",
        text: `"You're already chasing this one: ${q.desc}\n\nReturn when it's done."`,
        choices: [
          { label: "Where do I go again?", onClick: () => { toast(chironQuestHint(qk), "info"); }},
          { label: "Back to Chiron", onClick: openChiron },
        ],
      })});
    } else {
      choices.push({ label: `✓ ${q.name} — complete`, onClick: () => toast("\"Well done, hero.\"", "good") });
    }
  });
  choices.push({ label: "Back", onClick: openChiron });
  openDialog({ title: "Chiron — Quests", text: intro, choices });
}

function chironQuestHint(qk) {
  return {
    bolt:    "The Master Bolt is hidden in the Underworld. Find an entrance — Central Park, D.O.A. Studio, or the Palace of Hades itself.",
    fleece:  "The Fleece is on Polyphemus's island — sail from Long Island Sound to the Sea of Monsters.",
    artemis: "Atlas waits on Mount Tam, in L.A. Bring your strongest weapon.",
  }[qk] || "Trust your instincts, hero.";
}

function chironAdvice() {
  const p = G.player;
  let advice;
  if (p.weapons.length < 3) {
    advice = "\"You're under-armed. Visit the twelve cabins of Camp Half-Blood — each holds a weapon blessed by a god. The Bolt of Zeus and the War Hammer of Hephaestus hit hardest. Apollo's bow has range. Pick what suits your style.\"";
  } else if (p.characters.length === 0) {
    advice = "\"Train alongside heroes. The first ally you can earn is Tyson — sail to Poseidon's Palace at Long Island Sound and defeat the sharks. He will fight beside you.\"";
  } else if (!p.achievements.includes("citySlicker")) {
    advice = "\"Manhattan teems with monsters and allies. Mrs. Dodds haunts the MET. Hellhounds prowl the Williamsburg Bridge. And the Empire State Building hides the entrance to Olympus.\"";
  } else if (!p.achievements.includes("ghostKing")) {
    advice = "\"You should walk the Underworld. Hades is wrathful, but his realm holds answers — and Nico, the Ghost King, will join you if you earn his trust.\"";
  } else if (!p.flags.fleece && p.quests.fleece !== "complete") {
    advice = "\"The Golden Fleece can heal even mortal wounds. Polyphemus guards it. Take the Bow of Apollo if the Sirens lie in your path.\"";
  } else if (p.monsterKills < 10) {
    advice = "\"Combat sharpens a hero. The Myrmekes lair in our own camp is a fair warm-up — fast kills, low risk.\"";
  } else {
    advice = "\"You have already done much. Few heroes survive Tartarus. If you would prove yourself fully, the Doors of Death await sealing.\"";
  }
  openDialog({
    title: "Chiron",
    text: advice,
    choices: [
      { label: "Anything else?", onClick: openChiron },
      { label: "Thank you, Chiron.", onClick: () => toast("\"Walk in glory, hero.\"", "good") },
    ],
  });
}

function chironLore() {
  openDialog({
    title: "Chiron",
    text: "\"What do you wish to know?\"",
    choices: [
      { label: "Camp Half-Blood", onClick: () => openDialog({
        title: "Chiron",
        text: "\"This camp is the only safe haven for demigods in the mortal world. Twelve cabins, one for each Olympian. The arena builds your steel; the Big House mends your wounds. The Myrmekes — giant ants — nest just beyond the trees. Useful practice for greener heroes.\"",
        choices: [{ label: "Back", onClick: chironLore }, { label: "Goodbye", onClick: () => toast("\"Farewell.\"", "info") }],
      })},
      { label: "The gods of Olympus", onClick: () => openDialog({
        title: "Chiron",
        text: "\"Zeus rules the sky. Poseidon, the sea. Hades, the dead — though he refuses a throne on Olympus. Ares delights in war; Athena in strategy; Apollo in light and prophecy. Each god claims children in the mortal world. You are one. Their gifts, you'll find inside their cabins.\"",
        choices: [{ label: "Back", onClick: chironLore }, { label: "Goodbye", onClick: () => toast("\"Farewell.\"", "info") }],
      })},
      { label: "Camp Jupiter and the Romans", onClick: () => openDialog({
        title: "Chiron",
        text: "\"In the West, Jupiter's children train as legionnaires. They favor discipline and the Pilum. Octavian, their augur, reads omens in stuffed animals. Take his advice with a great deal of salt. Hazel Levesque can be earned in their Field of Mars.\"",
        choices: [{ label: "Back", onClick: chironLore }, { label: "Goodbye", onClick: () => toast("\"Farewell.\"", "info") }],
      })},
      { label: "The Underworld", onClick: () => openDialog({
        title: "Chiron",
        text: "\"Three doors lead down: Central Park, D.O.A. Studio in L.A., or your own foolish curiosity. Cerberus guards the Styx. Thanatos can freeze even an immortal. And Hades… try reasoning first. Killing him is harder than it sounds.\"",
        choices: [{ label: "Back", onClick: chironLore }, { label: "Goodbye", onClick: () => toast("\"Farewell.\"", "info") }],
      })},
      { label: "Back", onClick: openChiron },
    ],
  });
}

function chironHeal() {
  const p = G.player;
  openDialog({
    title: "Chiron — Provisions",
    text: `"You stand at ${Math.round(p.hp)}/${p.maxHp} HP. Take what you need."`,
    choices: [
      { label: "Nectar — heal 30 HP", onClick: () => { heal(30); toast("+30 HP", "good"); save(); }},
      { label: "Ambrosia — heal to full", onClick: () => { p.hp = p.maxHp; toast("Fully healed.", "good"); save(); }},
      { label: "Back", onClick: openChiron },
    ],
  });
}

// ===== UNLOCKS =====
function grantAchievement(id) {
  if (!ACHIEVEMENTS[id] || G.player.achievements.includes(id)) return;
  G.player.achievements.push(id);
  toast(`Achievement: ${ACHIEVEMENTS[id].icon} ${ACHIEVEMENTS[id].name}`, "good"); save();
}
function unlockCharacter(id) {
  if (!CHARACTERS[id] || G.player.characters.includes(id)) return;
  G.player.characters.push(id);
  toast(`Hero unlocked: ${CHARACTERS[id].name}`, "good");
  if (id === "tyson") { G.player.maxHp += 20; G.player.hp += 20; }
  if (id === "selina") { G.player.moveSpeed = MOVE_SPEED * 1.15; }
  save();
}
function grantFlag(name) {
  const p = G.player;
  if (name === "automatons") { p.flags.automatons = true; toast("Automatons available in Manhattan.","good"); }
  else if (name === "wingedShoes") { p.flags.wingedShoes = true; p.moveSpeed = Math.max(p.moveSpeed, MOVE_SPEED * 1.25); toast("Winged Shoes equipped.","good"); }
  else if (name === "waterbreath") { p.flags.waterbreath = true; toast("You can now breathe underwater.","good"); }
  else if (name === "fleece") { p.flags.fleece = true; toast("The Golden Fleece glows in your pack.","good"); }
  else if (name === "ghostArmy") { p.flags.ghostArmyUses = (p.flags.ghostArmyUses||0) + 2; toast("Ghost Army: 2 charges.","good"); }
  else if (name === "boar") { p.flags.boar = true; p.maxHp += 30; p.hp += 30; toast("A boar joins your side. +30 max HP.","good"); }
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
function heal(n) { G.player.hp = Math.min(G.player.maxHp, G.player.hp + n); }
function onKillMonster() {
  G.player.monsterKills++;
  grantAchievement("firstBlood");
  if (G.player.monsterKills >= 5) grantAchievement("monsterSlayer");
  save();
}

// ===== TRIGGER ACTIONS =====
function triggerAction(zone) {
  const a = zone.action; if (!a) return;
  const p = G.player;
  if (a.type === "goto") {
    if (a.achievement) grantAchievement(a.achievement);
    if (a.msg) toast(a.msg, "info");
    if (G.interior) G.interior = null;
    enterMap(a.to); return;
  }
  if (a.type === "cabin") {
    if (!p.weapons.includes(a.weapon)) { p.weapons.push(a.weapon); p.weapon = a.weapon; toast(`${a.label}'s gift — ${WEAPONS[a.weapon].name}.`, "good"); save(); }
    else toast(`${a.label}'s cabin. You already took the weapon.`, "info");
    return;
  }
  if (a.type === "bighouse") { openShop("bighouse"); return; }
  if (a.type === "shop")     { openShop(a.id); return; }
  if (a.type === "heal")     { if (a.amount === "full") p.hp = p.maxHp; else heal(a.amount); toast(a.msg || "Healed.", "good"); save(); return; }
  if (a.type === "dialog")   { openDialogScene(a.id); return; }
  if (a.type === "arena") {
    startCombat({ mons:["demigod"], label:"Camp Arena Duel", onWin:()=>{
      p.arenaWins++; toast(`Arena wins: ${p.arenaWins}/3`, "info");
      if (p.arenaWins >= 3) grantAchievement("gladiator"); save();
    }});
    return;
  }
  if (a.type === "fight") {
    if (a.reqInfo) toast(a.reqInfo, "info");
    startCombat({
      mons:a.mons, label:zone.name, packBonus:!!a.packBonus, allyIfFlag:a.allyIfFlag, rangedRequired:!!a.rangedRequired,
      onWin: () => {
        if (a.unlock) unlockCharacter(a.unlock);
        if (a.grant)  grantFlag(a.grant);
        if (a.quest)  completeQuest(a.quest);
        if (a.msg)    toast(a.msg, "good");
        save();
      },
    });
  }
}
function openDialogScene(id) {
  if (id === "octavian") {
    openDialog({ title:"Octavian, Augur of Camp Jupiter",
      text:"\"The omens are clear! You must march on Camp Half-Blood at dawn… or buy more stuffed animals for sacrifice.\"",
      choices:[ { label:"Ignore.", onClick:()=>toast("Wise choice.","info") }, { label:"Sigh.", onClick:()=>toast("Octavian glares.","info") } ]});
  } else if (id === "olympus") {
    openDialog({ title:"The Throne of the Gods",
      text:"Twelve thrones tower above you. The gods size you up. \"You are welcome here, hero. For now.\"",
      choices:[ { label:"Bow respectfully.", onClick:()=>{ grantAchievement("ascension"); toast("Your name is remembered on Olympus.","good"); }}, { label:"Leave.", onClick:()=>{} } ]});
  }
}

// ===== COMBAT (in-world) =====
function startCombat(opts) {
  G.encounter = { mons:opts.mons||[], label:opts.label||"Combat", onWin:opts.onWin||(()=>{}), onLose:opts.onLose,
                  packBonus:!!opts.packBonus, allyIfFlag:opts.allyIfFlag, rangedRequired:!!opts.rangedRequired };
  spawnEncounterEnemies();
  if (G.encounter.rangedRequired && !WEAPONS[G.player.weapon].ranged)
    toast("A ranged weapon (Bow of Apollo) would help here.", "info");
  if (G.encounter.allyIfFlag && G.player.flags[G.encounter.allyIfFlag]) {
    G.sprites.push(makeAllySprite(G.player.x + Math.cos(G.player.angle)*60, G.player.y + Math.sin(G.player.angle)*60));
    toast("An Automaton joins you.", "info");
  }
}
function spawnEncounterEnemies() {
  const enemies = G.encounter.mons;
  enemies.forEach((mid, i) => {
    const base = MONSTERS[mid]; if (!base) return;
    let lv = base.level;
    if (G.encounter.packBonus && (mid === "hellhound" || mid === "dracaena")) lv = Math.min(8, lv + 1);
    const s = statsFor(lv);
    // Spawn 80-220 units away in random direction in front
    const ang = G.player.angle + (Math.random() - 0.5) * Math.PI * 0.8;
    const dist = 100 + (i % 4) * 30 + Math.random() * 60;
    G.sprites.push({
      kind: "enemy", mid, name: base.name, shape: base.shape, color: base.color, note: base.note,
      x: G.player.x + Math.cos(ang) * dist,
      y: G.player.y + Math.sin(ang) * dist,
      size: 28, height: 50,
      hp: s.hp, maxHp: s.hp, dmg: s.dmg, speed: s.speed, level: lv,
      attackCd: 0, stunT: 0,
    });
  });
}
function endCombat(won) {
  if (won) { toast(`Victory: ${G.encounter.label}`, "good"); G.encounter.onWin(); }
  else {
    toast("You fell. Respawning at Half-Blood Hill.", "bad");
    G.encounter.onLose && G.encounter.onLose();
    G.player.hp = G.player.maxHp;
    G.encounter = null; G.interior = null; G.sprites = [];
    enterMap("camp-hb"); return;
  }
  G.encounter = null;
  // remove enemies, allies, and the interior monster previews
  G.sprites = G.sprites.filter(s => s.kind !== "enemy" && s.kind !== "ally" && s.kind !== "enemyPreview");
  save();
}
function makeAllySprite(x, y) {
  return { kind:"ally", name:"Automaton", color:"#d4a040", x, y, size:24, height:48,
           hp:80, maxHp:80, dmg:6, speed:55, attackCd:0, level:4 };
}

// ===== MAP / INTERIOR TRANSITIONS =====
function enterMap(id) {
  if (!MAPS[id]) return;
  G.mapId = id;
  const m = MAPS[id];
  G.player.x = m.spawn.x; G.player.y = m.spawn.y;
  G.player.angle = -Math.PI / 2;
  G.interior = null; G.encounter = null;
  G.sprites = getSceneryFor(m).slice();
  G.mode = "play";
  G.exitCooldown = 0.6;
  save();
}

// ===== SCENERY =====
const SCENERY_KIND = {
  grass:    ["tree","tree","tree","rock"],
  overworld:["tree","sign","sign","rock"],
  sand:     ["cactus","rock","rock"],
  water:    ["rock","seaweed","seaweed"],
  city:     ["lamp","mailbox","lamp","trash"],
  pavement: ["lamp","palm","palm","trash"],
  cave:     ["stalag","stalag","rock"],
  shadow:   ["tomb","tomb","bone","tomb"],
  cloud:    ["pillar","pillar","pillar"],
  stone:    ["rock","rock","pillar"],
};
function getSceneryFor(m) {
  if (m._scenery) return m._scenery;
  const b = mapBounds(m);
  const out = [];
  // Landmark sprites for outdoor zone transitions (so player can SEE where to go)
  for (const z of m.subzones) {
    if (!z.outdoor) continue;
    const cx = z.x + z.w/2, cy = z.y + z.h/2;
    out.push({ kind:"landmark", x: cx, y: cy, size: 30, height: 120, color: z.color, label: z.name });
    // ring of small markers around it
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      out.push({ kind:"marker", x: cx + Math.cos(a) * (z.w/2 - 10), y: cy + Math.sin(a) * (z.h/2 - 10),
                 size: 8, height: 24, color: z.color });
    }
  }
  // Decorative scenery scattered, avoiding subzones
  const kinds = SCENERY_KIND[m.tileStyle] || SCENERY_KIND.grass;
  const density = m.tileStyle === "overworld" ? 60 : 50;
  for (let i = 0; i < density; i++) {
    const sx = Math.random() * (b.w - 80) + 40;
    const sy = Math.random() * (b.h - 80) + 40;
    // skip if inside any subzone or near spawn
    let blocked = false;
    for (const z of m.subzones) {
      if (sx > z.x - 30 && sx < z.x + z.w + 30 && sy > z.y - 30 && sy < z.y + z.h + 30) { blocked = true; break; }
    }
    const spawn = m.spawn;
    if (Math.hypot(sx - spawn.x, sy - spawn.y) < 60) blocked = true;
    if (blocked) continue;
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    out.push(makeScenery(k, sx, sy));
  }
  m._scenery = out;
  return out;
}
function makeScenery(kind, x, y) {
  const presets = {
    tree:    { size: 20, height: 90, color: "#2a5a20" },
    sign:    { size: 12, height: 50, color: "#8a5a30" },
    rock:    { size: 16, height: 24, color: "#7a7a86" },
    cactus:  { size: 12, height: 60, color: "#3a8050" },
    seaweed: { size: 10, height: 40, color: "#3a6080" },
    lamp:    { size: 6,  height: 90, color: "#3a3a44" },
    mailbox: { size: 10, height: 36, color: "#2848a0" },
    palm:    { size: 16, height: 100, color: "#3a7848" },
    trash:   { size: 10, height: 30, color: "#3a3a3a" },
    stalag:  { size: 14, height: 70, color: "#2a1a24" },
    tomb:    { size: 14, height: 50, color: "#5a5a64" },
    bone:    { size: 12, height: 16, color: "#e8e0c8" },
    pillar:  { size: 14, height: 110, color: "#e8e0d0" },
  };
  const p = presets[kind] || presets.rock;
  return { kind: "scenery", scenery: kind, x, y, size: p.size, height: p.height, color: p.color };
}

// Interior dimensions (world units)
const I_W = 600, I_H = 400;
function buildInterior(zone) {
  const a = zone.action || {};
  const T = 8;
  const doorW = 60;
  const doorX = I_W/2 - doorW/2;
  const pat = patternFor(zone.interior);
  // Wall color matches the building's exterior so the interior feels themed
  const wallColor = shadeColor(zone.color || "#7a5a3a", 0.85);
  const wallColorDark = shadeColor(zone.color || "#7a5a3a", 0.6);
  const walls = [
    { x: 0, y: 0, w: I_W, h: T, color: wallColorDark, pattern: pat },
    { x: 0, y: I_H - T, w: doorX, h: T, color: wallColorDark, pattern: pat },
    { x: doorX + doorW, y: I_H - T, w: I_W - doorX - doorW, h: T, color: wallColorDark, pattern: pat },
    { x: 0, y: 0, w: T, h: I_H, color: wallColor, pattern: pat },
    { x: I_W - T, y: 0, w: T, h: I_H, color: wallColor, pattern: pat },
  ];
  const door = { x: doorX, y: I_H - T - 4, w: doorW, h: T + 8 };
  const inter = { zone, w: I_W, h: I_H, walls, door, kind: zone.interior || "cabin" };

  const cx = I_W/2, cy = I_H/2;
  const sprites = [];
  function add(s) { sprites.push(s); }

  if (a.type === "cabin") {
    add({ kind:"pedestal", x: cx, y: cy, size: 30, height: 50, color:"#ffe040", label:`${a.label}'s Gift`, onStep:()=>triggerAction(zone) });
  } else if (a.type === "bighouse") {
    add({ kind:"npc", x: cx, y: cy - 50, size: 24, height: 50, color:"#7a4a2a", label:"Chiron", onStep:()=>triggerAction(zone) });
  } else if (a.type === "arena") {
    add({ kind:"ring", x: cx, y: cy, size: 70, height: 30, color:"#a87836", label:"Step in to duel", onStep:()=>triggerAction(zone) });
  } else if (a.type === "fight") {
    a.mons.forEach((mid, i) => {
      const base = MONSTERS[mid] || { color:"#a44", shape:"humanoid", name:mid };
      const cols = Math.min(4, a.mons.length);
      const r = Math.floor(i / cols), c = i % cols;
      add({ kind:"enemyPreview", mid, name:base.name, shape:base.shape, color:base.color,
            x: 80 + c * 120, y: 80 + r * 100, size:28, height:50, onStep:()=>triggerAction(zone) });
    });
  } else if (a.type === "goto") {
    add({ kind:"portal", x: cx, y: cy, size: 50, height: 90, color:"#5070d0", label: zone.name, onStep:()=>triggerAction(zone) });
  } else if (a.type === "heal") {
    add({ kind:"fountain", x: cx, y: cy, size: 40, height: 30, color:"#80d0ff", label:"Rest", onStep:()=>triggerAction(zone) });
  } else if (a.type === "shop") {
    add({ kind:"npc", x: cx, y: cy - 50, size: 24, height: 50, color:"#c0a060", label:"Shopkeeper", onStep:()=>triggerAction(zone) });
  } else if (a.type === "dialog") {
    add({ kind:"npc", x: cx, y: cy - 50, size: 24, height: 50, color:"#ddb060", label:"Speak", onStep:()=>triggerAction(zone) });
  }
  inter.sprites = sprites;
  return inter;
}
function enterInterior(zone) {
  G.interior = buildInterior(zone);
  G.sprites = G.interior.sprites.slice();
  // Player spawns just inside the door, facing in
  G.player.x = I_W / 2;
  G.player.y = I_H - 40;
  G.player.angle = -Math.PI / 2;
  G.mode = "play";
  G.exitCooldown = 0.5;
  toast(`Entered ${zone.name}`, "info");
}
function leaveInterior(showToast=true) {
  if (!G.interior) return;
  const z = G.interior.zone;
  G.interior = null; G.encounter = null;
  G.sprites = getSceneryFor(MAPS[G.mapId]).slice();
  // Stand player just outside the building door in the outdoor map
  const door = buildingDoor(z);
  G.player.x = door.x + door.w/2;
  G.player.y = door.y + door.h + 14;
  G.player.angle = Math.PI / 2; // facing down/south away from building
  G.mode = "play";
  G.exitCooldown = 0.6;
  if (showToast) toast(`Left ${z.name}`, "info");
  save();
}

// ===== WALLS / DOORS =====
const WALL_T = 8;
const DOOR_W = 44;
const PATTERN_BY_KIND = {
  cabin:"plank", bighouse:"plank", arena:"stone", lair:"stone",
  portal:"metal", palace:"marble", temple:"marble", fortress:"stone",
  mess:"plank", museum:"marble", hotel:"brick", station:"stone",
  bridge:"metal", school:"brick", library:"brick", arch:"marble",
  garden:"stone", mountain:"stone", shop:"plank", fields:"stone",
  river:"stone", throne:"marble", forge:"metal", spa:"marble",
  cave:"stone", cliff:"stone",
};
function patternFor(kind) { return PATTERN_BY_KIND[kind] || "stone"; }

function buildingDoor(z) { return { x: z.x + z.w/2 - DOOR_W/2, y: z.y + z.h - WALL_T, w: DOOR_W, h: WALL_T + 8 }; }
function buildingWalls(z) {
  const d = buildingDoor(z);
  const pat = patternFor(z.interior);
  return [
    { x: z.x, y: z.y, w: z.w, h: WALL_T, color: shadeColor(z.color, 0.7), vertical:false, pattern: pat },
    { x: z.x, y: z.y + z.h - WALL_T, w: d.x - z.x, h: WALL_T, color: shadeColor(z.color, 0.7), vertical:false, pattern: pat },
    { x: d.x + d.w, y: z.y + z.h - WALL_T, w: z.x + z.w - d.x - d.w, h: WALL_T, color: shadeColor(z.color, 0.7), vertical:false, pattern: pat },
    { x: z.x, y: z.y, w: WALL_T, h: z.h, color: z.color, vertical:true, pattern: pat },
    { x: z.x + z.w - WALL_T, y: z.y, w: WALL_T, h: z.h, color: z.color, vertical:true, pattern: pat },
  ];
}
function getOutdoorWalls() {
  const m = MAPS[G.mapId];
  if (m._wallCache) return m._wallCache;
  const walls = [];
  for (const z of m.subzones) {
    if (z.outdoor) continue;
    for (const w of buildingWalls(z)) walls.push(w);
  }
  // Add map bounds as walls
  const b = mapBounds(m);
  walls.push({ x: -10, y: -10, w: b.w + 20, h: 10, color:"#000", vertical:false });
  walls.push({ x: -10, y: b.h, w: b.w + 20, h: 10, color:"#000", vertical:false });
  walls.push({ x: -10, y: -10, w: 10, h: b.h + 20, color:"#000", vertical:true });
  walls.push({ x: b.w, y: -10, w: 10, h: b.h + 20, color:"#000", vertical:true });
  m._wallCache = walls;
  return walls;
}
function getInteriorWalls() {
  return G.interior.walls.map(w => Object.assign({ vertical: w.w < w.h }, w));
}

// Collision against rectangles using point + radius
function collidesCircle(walls, x, y, r) {
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - cx, dy = y - cy;
    if (dx*dx + dy*dy < r*r) return true;
  }
  return false;
}

function moveWithCollision(p, dx, dy, walls) {
  const nx = p.x + dx;
  if (!collidesCircle(walls, nx, p.y, PLAYER_R)) p.x = nx;
  const ny = p.y + dy;
  if (!collidesCircle(walls, p.x, ny, PLAYER_R)) p.y = ny;
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
      if (G.encounter) { toast("You can't escape combat. Fight!", "bad"); return; }
      if (G.interior) { leaveInterior(); return; }
      const m = MAPS[G.mapId]; if (m.parent) enterMap(m.parent);
      return;
    }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      e.preventDefault();
      if (G.mode === "menu") { closeOverlay(); return; }
      openInventory(); return;
    }
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","Enter","KeyW","KeyA","KeyS","KeyD","KeyQ","KeyE","KeyF"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", e => { G.keys[e.code] = false; });
}

// ===== UPDATE =====
function update(dt) {
  if (G.mode !== "play") return;
  const p = G.player;
  if (p.specialCooldown > 0) p.specialCooldown = Math.max(0, p.specialCooldown - dt);
  if (G.exitCooldown > 0) G.exitCooldown = Math.max(0, G.exitCooldown - dt);
  if (G.hitFlash > 0) G.hitFlash = Math.max(0, G.hitFlash - dt);
  if (G.victoryFlash > 0) G.victoryFlash = Math.max(0, G.victoryFlash - dt);

  // Turn
  let turn = 0;
  if (G.keys.ArrowLeft || G.keys.KeyA) turn -= 1;
  if (G.keys.ArrowRight || G.keys.KeyD) turn += 1;
  p.angle += turn * TURN_SPEED * dt;

  // Forward/back/strafe
  let fwd = 0, strafe = 0;
  if (G.keys.ArrowUp   || G.keys.KeyW) fwd += 1;
  if (G.keys.ArrowDown || G.keys.KeyS) fwd -= 1;
  if (G.keys.KeyQ) strafe -= 1;
  if (G.keys.KeyE) strafe += 1;

  const walls = G.interior ? getInteriorWalls() : getOutdoorWalls();
  const sp = p.frozenT > 0 ? 0 : p.moveSpeed;
  if (p.frozenT > 0) p.frozenT -= dt;
  if (fwd || strafe) {
    const dx = (Math.cos(p.angle) * fwd + Math.cos(p.angle + Math.PI/2) * strafe) * sp * dt;
    const dy = (Math.sin(p.angle) * fwd + Math.sin(p.angle + Math.PI/2) * strafe) * sp * dt;
    moveWithCollision(p, dx, dy, walls);
  }

  // Outdoor zone overlap → goto map
  const m = MAPS[G.mapId];
  if (!G.interior) {
    for (const z of m.subzones) {
      if (!z.outdoor) continue;
      if (p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h && G.exitCooldown <= 0) {
        triggerAction(z); return;
      }
    }
    // Door step → enter interior
    for (const z of m.subzones) {
      if (z.outdoor) continue;
      if (G.exitCooldown > 0) continue;
      const d = buildingDoor(z);
      if (p.x > d.x && p.x < d.x + d.w && p.y > d.y - 6 && p.y < d.y + d.h + 6) {
        enterInterior(z); return;
      }
    }
  } else {
    // Interior door → leave
    if (G.exitCooldown <= 0) {
      const d = G.interior.door;
      if (p.x > d.x && p.x < d.x + d.w && p.y > d.y) {
        leaveInterior(); return;
      }
    }
  }

  // Sprite proximity triggers (interior objects + combat AI)
  updateSprites(dt);

  // Attack swing
  if (G.swing) {
    G.swing.t += dt;
    const wpn = WEAPONS[G.swing.weapon];
    if (G.swing.t >= wpn.cd * 0.35 && !G.swing.hit) {
      G.swing.hit = true;
      doSwingHit();
    }
    if (G.swing.t >= wpn.cd) G.swing = null;
  } else if (G.pressedThisFrame.Space) {
    G.swing = { t: 0, weapon: G.player.weapon, hit: false };
  }
  if (G.pressedThisFrame.Enter) tryUseSpecial();

  // Death check
  if (G.player.hp <= 0) {
    if (G.encounter) endCombat(false);
    else { G.player.hp = G.player.maxHp; toast("You collapse. Respawn at Half-Blood Hill.", "bad"); enterMap("camp-hb"); }
  }
}

function updateSprites(dt) {
  const p = G.player;
  const remove = [];
  // Track nearest interactable for "[F] Grab" prompt
  G._nearestInteract = null;
  let nearestD2 = Infinity;
  const FORCED_INTERACT = G.pressedThisFrame.KeyF;
  for (let i = 0; i < G.sprites.length; i++) {
    const s = G.sprites[i];
    // Interactables: walk-into trigger OR press F when nearby
    if (s.onStep && !s._triggered) {
      const dx = s.x - p.x, dy = s.y - p.y;
      const d2 = dx*dx + dy*dy;
      const trigR = (s.size || 24) + PLAYER_R + 24;   // generous auto-trigger
      const promptR = (s.size || 24) + PLAYER_R + 90; // wider for F-prompt + F-press
      if (d2 < trigR * trigR) {
        s._triggered = true;
        s.onStep();
        G.exitCooldown = 0.8;
        break;
      }
      if (d2 < promptR * promptR && d2 < nearestD2) {
        nearestD2 = d2; G._nearestInteract = s;
      }
    }
    // Enemy AI
    if (s.kind === "enemy") {
      if (s.deadT !== undefined) { s.deadT += dt; if (s.deadT > 0.4) remove.push(i); continue; }
      if (s.stunT > 0) { s.stunT -= dt; continue; }
      const dx = p.x - s.x, dy = p.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      // Charybdis sucks player in
      if (s.mid === "charybdis") {
        p.x += (-dx/d) * 30 * dt; // pull player toward s
        p.y += (-dy/d) * 30 * dt;
      }
      let spMul = 1;
      if (s.mid === "siren") spMul = 0.7;
      if (s.mid === "polyphemus") spMul = 0.85;
      const moveD = s.speed * spMul * dt;
      if (d > 30) {
        const walls = G.interior ? getInteriorWalls() : getOutdoorWalls();
        const nx = s.x + (dx/d) * moveD;
        const ny = s.y + (dy/d) * moveD;
        if (!collidesCircle(walls, nx, s.y, s.size/2)) s.x = nx;
        if (!collidesCircle(walls, s.x, ny, s.size/2)) s.y = ny;
      }
      s.attackCd -= dt;
      if (d < 36 && s.attackCd <= 0) {
        let dmg = s.dmg;
        if (s.mid === "empousa" && Math.random() < 0.25) dmg *= 2;
        p.hp -= dmg; s.attackCd = 0.9; G.hitFlash = 0.3;
        if (s.mid === "thanatos" && Math.random() < 0.3) {
          p.frozenT = 3.0; toast("Thanatos freezes you for 3 seconds.", "bad");
        }
      }
    } else if (s.kind === "ally") {
      // find nearest enemy, attack
      let near = null, nd = Infinity;
      for (const e of G.sprites) { if (e.kind !== "enemy" || e.deadT !== undefined) continue;
        const d = Math.hypot(e.x - s.x, e.y - s.y); if (d < nd) { nd = d; near = e; } }
      if (near) {
        const dx = near.x - s.x, dy = near.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        const moveD = s.speed * dt;
        s.x += (dx/d) * moveD; s.y += (dy/d) * moveD;
        s.attackCd -= dt;
        if (d < 32 && s.attackCd <= 0) {
          near.hp -= s.dmg; s.attackCd = 0.7;
          if (near.hp <= 0) { near.deadT = 0; onKillMonster(); }
        }
      }
    }
  }
  for (let i = remove.length - 1; i >= 0; i--) G.sprites.splice(remove[i], 1);
  // F to interact with nearest sprite even at long range
  if (FORCED_INTERACT && G._nearestInteract && !G._nearestInteract._triggered) {
    G._nearestInteract._triggered = true;
    G._nearestInteract.onStep();
    G.exitCooldown = 0.8;
  }
  // Encounter resolution
  if (G.encounter) {
    const enemiesAlive = G.sprites.some(s => s.kind === "enemy" && s.deadT === undefined);
    if (!enemiesAlive) endCombat(true);
  }
}

function doSwingHit() {
  const p = G.player;
  const w = WEAPONS[p.weapon];
  const ax = Math.cos(p.angle), ay = Math.sin(p.angle);
  const arc = w.ranged ? Math.PI/10 : Math.PI/3;
  for (const s of G.sprites) {
    if (s.kind !== "enemy" && s.kind !== "enemyPreview") continue;
    if (s.deadT !== undefined) continue;
    const dx = s.x - p.x, dy = s.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > w.reach) continue;
    const dot = (dx*ax + dy*ay) / d;
    if (dot < Math.cos(arc)) continue;
    // enemyPreview: walking-into triggers fight; here, hitting one also triggers the fight
    if (s.kind === "enemyPreview" && s.onStep && !s._triggered) {
      s._triggered = true;
      s.onStep();
      return;
    }
    const baseDmg = w.dmg + (p.characters.includes("clarisse") ? Math.round(w.dmg * 0.25) : 0);
    const crit = p.characters.includes("bianca") && Math.random() < 0.18 ? 2 : 1;
    const damage = baseDmg * crit;
    s.hp -= damage;
    if (s.hp <= 0) { s.deadT = 0; if (s.kind === "enemy") onKillMonster(); }
  }
}

function tryUseSpecial() {
  const p = G.player;
  if (p.specialCooldown > 0) { toast(`Special on cooldown (${Math.ceil(p.specialCooldown)}s)`, "bad"); return; }
  if (G.encounter && p.flags.ghostArmyUses > 0) {
    p.flags.ghostArmyUses--;
    for (let i = 0; i < 3; i++) {
      G.sprites.push({ kind:"ally", name:"Ghost", color:"#c8d0e0", x: p.x + Math.cos(p.angle + (i-1)*0.3)*40, y: p.y + Math.sin(p.angle + (i-1)*0.3)*40, size:22, height:48, hp:40, maxHp:40, dmg:8, speed:80, attackCd:0, level:4 });
    }
    toast(`Ghost Army summoned (${p.flags.ghostArmyUses} left)`, "good");
    p.specialCooldown = 10; save(); return;
  }
  const before = p.hp; heal(30); const got = p.hp - before;
  toast(got > 0 ? `+${got} HP` : "Already full HP.", got > 0 ? "good" : "info");
  p.specialCooldown = G.player.characters.includes("annabeth") ? 6 : 10;
  save();
}

// ===== COLOR HELPERS =====
function parseColor(hex) {
  if (hex.startsWith("rgb")) {
    const m = hex.match(/\d+/g);
    return { r: +m[0], g: +m[1], b: +m[2] };
  }
  if (!hex.startsWith("#")) hex = "#888";
  if (hex.length === 4) hex = "#" + hex[1]+hex[1] + hex[2]+hex[2] + hex[3]+hex[3];
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
}
function shadeColor(hex, k) {
  const c = parseColor(hex);
  return `rgb(${Math.round(c.r*k)|0},${Math.round(c.g*k)|0},${Math.round(c.b*k)|0})`;
}

// ===== RAYCASTER =====
function raySegT(rx, ry, rdx, rdy, x1, y1, x2, y2) {
  const sx = x2 - x1, sy = y2 - y1;
  const denom = rdx * sy - rdy * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((x1 - rx) * sy - (y1 - ry) * sx) / denom;
  const u = ((x1 - rx) * rdy - (y1 - ry) * rdx) / denom;
  if (t > 0 && u >= 0 && u <= 1) return t;
  return null;
}
function castRay(walls, ox, oy, angle) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let nearest = null;
  for (const w of walls) {
    const segs = [
      [w.x, w.y, w.x + w.w, w.y, false],
      [w.x + w.w, w.y, w.x + w.w, w.y + w.h, true],
      [w.x + w.w, w.y + w.h, w.x, w.y + w.h, false],
      [w.x, w.y + w.h, w.x, w.y, true],
    ];
    for (const s of segs) {
      const t = raySegT(ox, oy, dx, dy, s[0], s[1], s[2], s[3]);
      if (t !== null && t > 0.01) {
        if (!nearest || t < nearest.dist) {
          const hx = ox + dx * t, hy = oy + dy * t;
          nearest = { dist: t, color: w.color, vertical: s[4], pattern: w.pattern, u: s[4] ? hy : hx };
        }
      }
    }
  }
  return nearest;
}

// ===== RENDER =====
function render() {
  const ctx = G.ctx;
  ctx.clearRect(0, 0, W, H);
  const m = MAPS[G.mapId];
  const style = G.interior ? interiorStyle(G.interior.kind) : m.tileStyle;
  const horizonY = H / 2;
  drawSky(style, horizonY);
  drawFloor(style, horizonY);
  const walls = G.interior ? getInteriorWalls() : getOutdoorWalls();
  const depthBuf = renderWalls(walls, horizonY);
  renderSprites(depthBuf, horizonY);
  drawWeaponOverlay();
  drawMinimap();
  drawCrosshair();
  if (G.hitFlash > 0) {
    ctx.fillStyle = `rgba(220,40,40,${G.hitFlash * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (G.encounter) {
    ctx.fillStyle = "rgba(220,70,70,0.85)";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚔  COMBAT: " + G.encounter.label, W/2, 20);
  }
  drawCompass();
  updateHUD();
}

function interiorStyle(kind) {
  const map = { cabin:"wood", bighouse:"wood", arena:"arena", lair:"cave", portal:"stone",
                palace:"marble", temple:"marble", fortress:"stone", mess:"wood",
                museum:"marble", hotel:"marble", station:"stone", bridge:"stone",
                school:"wood", library:"wood", arch:"marble", garden:"grass",
                mountain:"stone", shop:"wood", fields:"grass", river:"water",
                throne:"marble", forge:"stone", spa:"marble", cave:"cave", cliff:"stone" };
  return map[kind] || "stone";
}

function drawSky(style, horizonY) {
  const ctx = G.ctx;
  const palette = {
    grass: ["#7ec0ff","#3a7ed0"], sand: ["#ffe0a0","#d49050"], water: ["#6ab0ff","#1e508a"],
    city: ["#5a6a8a","#2a3050"], pavement: ["#7080a0","#3a4258"], cave: ["#1a0e18","#080308"],
    shadow: ["#3a0a1a","#0a0005"], cloud: ["#ffffff","#c0d4ff"], stone: ["#5a6070","#2a3040"],
    wood: ["#7ec0ff","#3a7ed0"], marble: ["#ffffff","#c0d4ff"], arena: ["#ffe0a0","#a05828"],
    overworld: ["#7ec0ff","#4a8ed0"],
  };
  const [t, b] = palette[style] || palette.grass;
  const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
  grad.addColorStop(0, t); grad.addColorStop(1, b);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, horizonY);
  // Stars in dark biomes
  if (style === "cave" || style === "shadow") {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137) % W, sy = (i * 79) % horizonY;
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath(); ctx.arc(W * 0.78, horizonY * 0.3, 22, 0, Math.PI*2); ctx.fill();
  } else if (style !== "stone" && style !== "wood") {
    // Sun
    ctx.fillStyle = "rgba(255,240,160,0.9)";
    ctx.beginPath(); ctx.arc(W * 0.18, horizonY * 0.3, 26, 0, Math.PI*2); ctx.fill();
    // Sun glow
    const g2 = ctx.createRadialGradient(W * 0.18, horizonY * 0.3, 10, W * 0.18, horizonY * 0.3, 80);
    g2.addColorStop(0, "rgba(255,240,160,0.4)");
    g2.addColorStop(1, "rgba(255,240,160,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, horizonY);
  }
  // Mountains silhouette in outdoor scenes
  if (style === "grass" || style === "overworld" || style === "sand") {
    ctx.fillStyle = "rgba(40,60,80,0.5)";
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let i = 0; i <= 8; i++) {
      const sx = (i / 8) * W;
      const sy = horizonY - 30 - Math.sin(i * 1.3 + G.player.angle * 0.2) * 20 - (i % 3) * 10;
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(W, horizonY);
    ctx.closePath();
    ctx.fill();
  }
  // Clouds
  if (style === "grass" || style === "overworld" || style === "cloud" || style === "marble") {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 7; i++) {
      const cx = (i * 220 + (performance.now()/100)) % (W + 200) - 100;
      const cy = 30 + (i % 3) * 28;
      ctx.beginPath(); ctx.ellipse(cx, cy, 60, 14, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 20, cy - 8, 35, 10, 0, 0, Math.PI*2); ctx.fill();
    }
  }
}

// Floor palettes used by floor casting. Each entry is [r,g,b] tuples; the floor
// tile size in world units controls how chunky the texture looks.
const FLOOR_PALETTES = {
  grass:     { tile: 36, colors: [[58,96,32],[40,72,24],[80,108,40],[50,86,28],[36,68,20]], speckle:[[20,40,12,40]] },
  sand:      { tile: 30, colors: [[180,138,72],[160,122,60],[200,158,90],[170,130,68]], speckle:[[120,90,40,30]] },
  water:     { tile: 40, colors: [[42,88,120],[34,80,112],[58,108,140],[40,86,118]], speckle:[[200,230,255,20]] },
  city:      { tile: 28, colors: [[58,58,68],[44,44,52],[68,68,78],[50,50,60]], speckle:[[0,0,0,80]] },
  pavement:  { tile: 28, colors: [[80,80,90],[66,66,76],[92,92,102]], speckle:[[0,0,0,60]] },
  cave:      { tile: 34, colors: [[37,24,32],[28,18,24],[48,32,40],[34,22,30]], speckle:[[80,40,40,30]] },
  shadow:    { tile: 32, colors: [[26,8,16],[14,4,10],[34,12,20]], speckle:[[200,60,20,40]] },
  cloud:     { tile: 32, colors: [[188,196,221],[160,170,200],[210,220,240]], speckle:[[255,255,255,80]] },
  stone:     { tile: 38, colors: [[64,70,84],[48,54,68],[80,86,98],[58,62,76]], speckle:[[0,0,0,40]] },
  wood:      { tile: 18, colors: [[122,74,32],[100,60,24],[140,90,42],[110,68,28]], speckle:[[60,30,12,40]] },
  marble:    { tile: 36, colors: [[216,212,200],[196,192,180],[232,228,218]], speckle:[[120,120,110,30]] },
  arena:     { tile: 30, colors: [[168,120,58],[148,104,46],[188,140,72]], speckle:[[80,40,16,50]] },
  overworld: { tile: 36, colors: [[58,96,32],[40,72,24],[80,108,40],[50,86,28]], speckle:[[20,40,12,40]] },
};

let _floorImg = null;
function drawFloor(style, horizonY) {
  const ctx = G.ctx;
  const halfH = H - horizonY;
  if (halfH < 4) return;
  if (!_floorImg || _floorImg.width !== W || _floorImg.height !== halfH) {
    _floorImg = ctx.createImageData(W, halfH);
  }
  const data = _floorImg.data;
  const camHeight = 30;                                  // eye height (world units)
  const angL = G.player.angle - HALF_FOV;
  const angR = G.player.angle + HALF_FOV;
  const dxL = Math.cos(angL), dyL = Math.sin(angL);
  const dxR = Math.cos(angR), dyR = Math.sin(angR);
  const px = G.player.x, py = G.player.y;
  const pal = FLOOR_PALETTES[style] || FLOOR_PALETTES.grass;
  const tile = pal.tile;
  const inv_tile = 1 / tile;
  const colors = pal.colors;
  const ncolors = colors.length;
  const sp = pal.speckle && pal.speckle[0];
  // Pre-compute fog color from style sky bottom
  for (let y = 0; y < halfH; y++) {
    const screenY = y + horizonY;
    const dRow = screenY - horizonY + 0.5;
    if (dRow < 0.5) continue;
    const rowDist = (camHeight * PROJ) / dRow;
    if (rowDist > 1100) {
      // fill row with far-fog color
      for (let x = 0, ix = y * W * 4; x < W; x++, ix += 4) {
        data[ix] = colors[0][0] * 0.3 | 0;
        data[ix+1] = colors[0][1] * 0.3 | 0;
        data[ix+2] = colors[0][2] * 0.3 | 0;
        data[ix+3] = 255;
      }
      continue;
    }
    const wxL = px + dxL * rowDist;
    const wyL = py + dyL * rowDist;
    const wxR = px + dxR * rowDist;
    const wyR = py + dyR * rowDist;
    const stepX = (wxR - wxL) / W;
    const stepY = (wyR - wyL) / W;
    let wx = wxL, wy = wyL;
    const fog = Math.max(0.25, Math.min(1, 1 - rowDist / 1000));
    for (let x = 0, ix = y * W * 4; x < W; x++, ix += 4) {
      const cx = Math.floor(wx * inv_tile);
      const cy = Math.floor(wy * inv_tile);
      const h = ((cx * 73856093) ^ (cy * 19349663)) >>> 0;
      const c = colors[h % ncolors];
      let r = c[0], g = c[1], b = c[2];
      if (sp && (h % 41) === 0) {
        const alpha = sp[3] / 255;
        r = r * (1 - alpha) + sp[0] * alpha;
        g = g * (1 - alpha) + sp[1] * alpha;
        b = b * (1 - alpha) + sp[2] * alpha;
      }
      data[ix]   = r * fog | 0;
      data[ix+1] = g * fog | 0;
      data[ix+2] = b * fog | 0;
      data[ix+3] = 255;
      wx += stepX;
      wy += stepY;
    }
  }
  ctx.putImageData(_floorImg, 0, horizonY);
}

function renderWalls(walls, horizonY) {
  const ctx = G.ctx;
  const depth = new Array(NUM_RAYS).fill(Infinity);
  const p = G.player;
  for (let i = 0; i < NUM_RAYS; i++) {
    const sx = i * RAY_STEP;
    const screenT = sx / W;
    const rayAngle = p.angle - HALF_FOV + screenT * FOV;
    const hit = castRay(walls, p.x, p.y, rayAngle);
    if (!hit) continue;
    const perp = hit.dist * Math.cos(rayAngle - p.angle);
    if (perp < 0.5) continue;
    depth[i] = perp;
    const lineH = Math.min(H * 4, (WALL_TALL * PROJ) / perp);
    const top = horizonY - lineH / 2;
    let shade = Math.max(0.25, Math.min(1, 1 - perp / 900));
    if (hit.vertical) shade *= 0.85;
    const baseColor = shadeColor(hit.color, shade);
    ctx.fillStyle = baseColor;
    ctx.fillRect(sx, top, RAY_STEP, lineH);
    drawWallTexture(ctx, sx, top, lineH, hit, perp, shade);
    // top highlight (block edge)
    ctx.fillStyle = shadeColor(hit.color, Math.min(1, shade * 1.4));
    ctx.fillRect(sx, top, RAY_STEP, Math.max(2, lineH * 0.04));
    // bottom shade
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(sx, top + lineH - Math.max(2, lineH * 0.05), RAY_STEP, Math.max(2, lineH * 0.05));
  }
  return depth;
}

function drawWallTexture(ctx, sx, top, lineH, hit, perp, shade) {
  const pattern = hit.pattern;
  if (!pattern) return;
  const u = hit.u;
  if (pattern === "brick") {
    // 5 rows of bricks, each ~12 world-units tall
    const rows = 5, brickW = 28;
    const rowH = lineH / rows;
    // Horizontal mortar lines
    ctx.fillStyle = `rgba(0,0,0,${0.35 * shade + 0.15})`;
    for (let r = 1; r < rows; r++) ctx.fillRect(sx, top + r * rowH - 1, RAY_STEP, 2);
    // Vertical mortar — alternating brick offset per row
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : brickW / 2;
      const localU = ((u + offset) % brickW + brickW) % brickW;
      if (localU < 2 || localU > brickW - 2) {
        ctx.fillStyle = `rgba(0,0,0,${0.35 * shade + 0.15})`;
        ctx.fillRect(sx, top + r * rowH, RAY_STEP, rowH);
      }
    }
  } else if (pattern === "plank") {
    // Vertical planks — seams every ~14 world units
    const plankW = 14;
    const localU = ((u % plankW) + plankW) % plankW;
    if (localU < 1.2) {
      ctx.fillStyle = `rgba(0,0,0,${0.5 * shade + 0.2})`;
      ctx.fillRect(sx, top, RAY_STEP, lineH);
    }
    // Wood grain (subtle horizontal lines)
    const grainY = (Math.sin(u * 0.4) * 0.5 + 0.5);
    ctx.fillStyle = `rgba(0,0,0,${0.12 * shade})`;
    ctx.fillRect(sx, top + lineH * (0.25 + grainY * 0.05), RAY_STEP, 1);
    ctx.fillRect(sx, top + lineH * (0.6 + grainY * 0.05), RAY_STEP, 1);
  } else if (pattern === "stone") {
    // 3 rows of large stones
    const rows = 3, blockW = 40;
    const rowH = lineH / rows;
    ctx.fillStyle = `rgba(0,0,0,${0.4 * shade + 0.2})`;
    for (let r = 1; r < rows; r++) ctx.fillRect(sx, top + r * rowH - 1, RAY_STEP, 2);
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : blockW / 2;
      const localU = ((u + offset) % blockW + blockW) % blockW;
      if (localU < 2.5 || localU > blockW - 2.5) {
        ctx.fillStyle = `rgba(0,0,0,${0.4 * shade + 0.2})`;
        ctx.fillRect(sx, top + r * rowH, RAY_STEP, rowH);
      }
      // Speckle for stone texture
      const h = (Math.floor(u/3) * 73 + r * 131) & 31;
      if (h < 6) {
        ctx.fillStyle = `rgba(0,0,0,${0.18 * shade})`;
        ctx.fillRect(sx, top + r * rowH + (h * 2 % rowH), RAY_STEP, 1);
      }
    }
  } else if (pattern === "marble") {
    // Veined marble — wavy semi-transparent streaks
    ctx.fillStyle = `rgba(255,255,255,${0.15 * shade})`;
    const v1 = (Math.sin(u * 0.2) * 0.5 + 0.5);
    ctx.fillRect(sx, top + lineH * (0.2 + v1 * 0.1), RAY_STEP, 1);
    const v2 = (Math.sin(u * 0.13 + 1) * 0.5 + 0.5);
    ctx.fillRect(sx, top + lineH * (0.6 + v2 * 0.15), RAY_STEP, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.08})`;
    ctx.fillRect(sx, top + lineH * (0.45 + v1 * 0.1), RAY_STEP, 1);
  } else if (pattern === "metal") {
    // Vertical highlight + rivets
    ctx.fillStyle = `rgba(255,255,255,${0.18 * shade})`;
    const localU = ((u % 24) + 24) % 24;
    if (localU < 1) ctx.fillRect(sx, top, RAY_STEP, lineH);
    // Rivets every 30 units
    const rivetU = ((u % 30) + 30) % 30;
    if (rivetU < 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 * shade})`;
      ctx.fillRect(sx, top + lineH * 0.2, RAY_STEP, Math.max(2, lineH * 0.04));
      ctx.fillRect(sx, top + lineH * 0.8, RAY_STEP, Math.max(2, lineH * 0.04));
    }
  }
}

function renderSprites(depth, horizonY) {
  const ctx = G.ctx;
  const p = G.player;
  const arr = G.sprites.map(s => {
    const dx = s.x - p.x, dy = s.y - p.y;
    let ang = Math.atan2(dy, dx) - p.angle;
    while (ang > Math.PI) ang -= Math.PI*2;
    while (ang < -Math.PI) ang += Math.PI*2;
    return { s, dist: Math.hypot(dx, dy), ang };
  }).filter(o => Math.abs(o.ang) < HALF_FOV + 0.5 && o.dist > 4);
  arr.sort((a,b) => b.dist - a.dist);
  for (const o of arr) {
    const s = o.s;
    const perp = o.dist * Math.cos(o.ang);
    if (perp < 1) continue;
    const sizeW = (s.size || 24) * 2;
    const sizeH = (s.height || sizeW);
    const screenH = (sizeH * PROJ) / perp;
    const screenW = (sizeW * PROJ) / perp;
    const screenX = W/2 + (Math.tan(o.ang) * PROJ);
    const screenY = horizonY + screenH/8 - screenH;  // anchor near floor
    const left = screenX - screenW/2;
    // depth check by column
    const colStart = Math.max(0, Math.floor(left / RAY_STEP));
    const colEnd = Math.min(NUM_RAYS - 1, Math.ceil((left + screenW) / RAY_STEP));
    if (colEnd < 0 || colStart >= NUM_RAYS) continue;
    // skip if entirely behind a wall
    let visible = false;
    for (let c = colStart; c <= colEnd; c++) if (depth[c] > perp + 1) { visible = true; break; }
    if (!visible) continue;
    drawSprite(ctx, s, left, screenY, screenW, screenH, perp);
  }
}

function drawSprite(ctx, s, sx, sy, sw, sh, perp) {
  // Shadow on floor
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(sx + sw/2, sy + sh, sw * 0.45, sw * 0.12, 0, 0, Math.PI*2);
  ctx.fill();
  const k = s.kind;
  if (k === "enemy" || k === "enemyPreview") drawCreature(ctx, s, sx, sy, sw, sh);
  else if (k === "ally") drawAlly(ctx, s, sx, sy, sw, sh);
  else if (k === "npc") drawHumanoid(ctx, s.color || "#7a4a2a", sx, sy, sw, sh);
  else if (k === "pedestal") drawPedestal(ctx, s, sx, sy, sw, sh);
  else if (k === "portal") drawPortal(ctx, s, sx, sy, sw, sh);
  else if (k === "fountain") drawFountain(ctx, sx, sy, sw, sh);
  else if (k === "ring") drawArenaRing(ctx, sx, sy, sw, sh);
  else if (k === "scenery") drawScenery(ctx, s, sx, sy, sw, sh);
  else if (k === "landmark") drawLandmark(ctx, s, sx, sy, sw, sh);
  else if (k === "marker") drawMarker(ctx, s, sx, sy, sw, sh);
  else {
    ctx.fillStyle = s.color || "#888";
    ctx.fillRect(sx, sy + sh*0.3, sw, sh*0.7);
  }
  // Label + HP bar for living sprites
  if ((k === "enemy" || k === "enemyPreview" || k === "ally") && s.hp !== undefined && s.deadT === undefined) {
    const barY = sy - 6;
    ctx.fillStyle = "#400";
    ctx.fillRect(sx, barY, sw, 4);
    ctx.fillStyle = k === "ally" ? "#5cd97e" : "#e04848";
    ctx.fillRect(sx, barY, sw * (s.hp / s.maxHp), 4);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${s.name}${s.level ? ' L'+s.level : ''}`, sx + sw/2, barY - 4);
  } else if (s.label) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.label, sx + sw/2, sy - 4);
  }
}

function drawCreature(ctx, s, x, y, w, h) {
  const shape = s.shape || "humanoid";
  if (shape === "humanoid") drawHumanoid(ctx, s.color, x, y, w, h);
  else if (shape === "beast") drawBeast(ctx, s.color, x, y, w, h);
  else if (shape === "ghost") drawGhost(ctx, s.color, x, y, w, h);
  else if (shape === "bug") drawBug(ctx, s.color, x, y, w, h);
  else if (shape === "cyclops") drawCyclops(ctx, s.color, x, y, w, h);
  else if (shape === "snake") drawSnake(ctx, s.color, x, y, w, h);
  else drawHumanoid(ctx, s.color, x, y, w, h);
}
function drawHumanoid(ctx, color, x, y, w, h) {
  // Legs
  ctx.fillStyle = shadeColor(color, 0.6);
  ctx.fillRect(x + w*0.3, y + h*0.7, w*0.15, h*0.3);
  ctx.fillRect(x + w*0.55, y + h*0.7, w*0.15, h*0.3);
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x + w*0.25, y + h*0.3, w*0.5, h*0.45);
  // Arms
  ctx.fillStyle = shadeColor(color, 1.1);
  ctx.fillRect(x + w*0.1, y + h*0.35, w*0.15, h*0.3);
  ctx.fillRect(x + w*0.75, y + h*0.35, w*0.15, h*0.3);
  // Head
  ctx.fillStyle = "#f0c98e";
  ctx.beginPath(); ctx.arc(x + w/2, y + h*0.18, w*0.18, 0, Math.PI*2); ctx.fill();
  // Eyes
  ctx.fillStyle = "#000";
  ctx.fillRect(x + w*0.42, y + h*0.16, w*0.05, h*0.025);
  ctx.fillRect(x + w*0.53, y + h*0.16, w*0.05, h*0.025);
}
function drawBeast(ctx, color, x, y, w, h) {
  // Body (low and wide)
  ctx.fillStyle = color;
  ctx.fillRect(x + w*0.1, y + h*0.55, w*0.8, h*0.3);
  // Legs
  ctx.fillStyle = shadeColor(color, 0.7);
  for (let i = 0; i < 4; i++) ctx.fillRect(x + w*(0.15 + i*0.22), y + h*0.85, w*0.08, h*0.15);
  // Head
  ctx.fillStyle = color;
  ctx.fillRect(x + w*0.05, y + h*0.45, w*0.25, h*0.18);
  // Eyes
  ctx.fillStyle = "#ff4040";
  ctx.fillRect(x + w*0.09, y + h*0.49, w*0.04, h*0.03);
  ctx.fillRect(x + w*0.17, y + h*0.49, w*0.04, h*0.03);
  // Tail
  ctx.fillStyle = color;
  ctx.fillRect(x + w*0.85, y + h*0.5, w*0.12, h*0.05);
}
function drawGhost(ctx, color, x, y, w, h) {
  ctx.fillStyle = `rgba(${parseColor(color).r},${parseColor(color).g},${parseColor(color).b},0.7)`;
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h*0.5, w*0.4, h*0.4, 0, 0, Math.PI*2);
  ctx.fill();
  // Wisp tail
  ctx.beginPath();
  ctx.moveTo(x + w*0.2, y + h*0.7);
  ctx.quadraticCurveTo(x + w*0.5, y + h, x + w*0.8, y + h*0.7);
  ctx.lineTo(x + w*0.7, y + h*0.55);
  ctx.lineTo(x + w*0.3, y + h*0.55);
  ctx.closePath();
  ctx.fill();
  // Eyes
  ctx.fillStyle = "#000";
  ctx.fillRect(x + w*0.38, y + h*0.4, w*0.08, h*0.04);
  ctx.fillRect(x + w*0.54, y + h*0.4, w*0.08, h*0.04);
}
function drawBug(ctx, color, x, y, w, h) {
  // Body
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h*0.65, w*0.35, h*0.3, 0, 0, Math.PI*2); ctx.fill();
  // Head
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h*0.35, w*0.22, h*0.2, 0, 0, Math.PI*2); ctx.fill();
  // Legs
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(x + w*0.3, y + h*0.6); ctx.lineTo(x + w*0.05, y + h*(0.7 + i*0.1)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w*0.7, y + h*0.6); ctx.lineTo(x + w*0.95, y + h*(0.7 + i*0.1)); ctx.stroke();
  }
  // Eyes
  ctx.fillStyle = "#ff6";
  ctx.fillRect(x + w*0.44, y + h*0.32, w*0.05, h*0.04);
  ctx.fillRect(x + w*0.51, y + h*0.32, w*0.05, h*0.04);
}
function drawCyclops(ctx, color, x, y, w, h) {
  drawHumanoid(ctx, color, x, y, w, h);
  // Overdraw single big eye
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(x + w/2, y + h*0.17, w*0.12, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#a00";
  ctx.beginPath(); ctx.arc(x + w/2, y + h*0.17, w*0.05, 0, Math.PI*2); ctx.fill();
}
function drawSnake(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let t = 0; t <= 1; t += 0.05) {
    const yy = y + h * (0.3 + t * 0.6);
    const xx = x + w/2 + Math.sin(t * Math.PI * 3) * w * 0.25;
    if (t === 0) ctx.moveTo(xx - w*0.12, yy); else ctx.lineTo(xx - w*0.12, yy);
  }
  for (let t = 1; t >= 0; t -= 0.05) {
    const yy = y + h * (0.3 + t * 0.6);
    const xx = x + w/2 + Math.sin(t * Math.PI * 3) * w * 0.25;
    ctx.lineTo(xx + w*0.12, yy);
  }
  ctx.closePath(); ctx.fill();
  // Head
  ctx.beginPath(); ctx.arc(x + w/2 + Math.sin(0) * w*0.25, y + h*0.25, w*0.16, 0, Math.PI*2); ctx.fill();
  // Eyes
  ctx.fillStyle = "#ff4";
  ctx.fillRect(x + w*0.45, y + h*0.23, w*0.04, h*0.03);
  ctx.fillRect(x + w*0.52, y + h*0.23, w*0.04, h*0.03);
}
function drawAlly(ctx, s, x, y, w, h) {
  drawHumanoid(ctx, s.color || "#d4a040", x, y, w, h);
  // Green outline
  ctx.strokeStyle = "#5cd97e"; ctx.lineWidth = 2;
  ctx.strokeRect(x + w*0.2, y + h*0.25, w*0.6, h*0.7);
}
function drawPedestal(ctx, s, x, y, w, h) {
  // Glow
  const t = performance.now() / 300;
  ctx.fillStyle = `rgba(255,210,80,${0.18 + 0.18 * Math.sin(t)})`;
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h*0.45, w*0.7, h*0.3, 0, 0, Math.PI*2); ctx.fill();
  // Pillar
  ctx.fillStyle = "#7a5a30";
  ctx.fillRect(x + w*0.3, y + h*0.5, w*0.4, h*0.5);
  ctx.fillStyle = "#5a3a18";
  ctx.fillRect(x + w*0.25, y + h*0.45, w*0.5, h*0.07);
  // Item floating
  ctx.fillStyle = s.color || "#ffe040";
  ctx.fillRect(x + w*0.42, y + h*0.18, w*0.16, h*0.32);
  ctx.fillStyle = "rgba(255,255,180,0.7)";
  ctx.fillRect(x + w*0.45, y + h*0.18, w*0.10, h*0.04);
}
function drawPortal(ctx, s, x, y, w, h) {
  const t = performance.now() / 200;
  for (let i = 3; i >= 0; i--) {
    ctx.fillStyle = `rgba(120,160,255,${0.15 + 0.1*Math.sin(t + i)})`;
    ctx.beginPath(); ctx.ellipse(x + w/2, y + h/2, w*(0.35 + i*0.07), h*(0.45 + i*0.05), 0, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = s.color || "#5070d0";
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h/2, w*0.32, h*0.4, 0, 0, Math.PI*2); ctx.fill();
  // Swirl
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 4; a += 0.2) {
    const rad = a * 4;
    const px = x + w/2 + Math.cos(a + t) * rad * 0.05 * w/100;
    const py = y + h/2 + Math.sin(a + t) * rad * 0.05 * h/100;
    if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}
function drawFountain(ctx, x, y, w, h) {
  const t = performance.now() / 200;
  ctx.fillStyle = "#5080a0";
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h*0.7, w*0.45, h*0.18, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = `rgba(120,200,255,${0.5 + 0.2*Math.sin(t)})`;
  ctx.fillRect(x + w*0.45, y + h*0.2, w*0.1, h*0.5);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + t;
    ctx.beginPath();
    ctx.arc(x + w/2 + Math.cos(a) * w*0.2, y + h*0.4 + Math.sin(a) * h*0.1, 2, 0, Math.PI*2);
    ctx.fill();
  }
}
function drawArenaRing(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(255,180,80,0.2)";
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h*0.7, w*0.5, h*0.4, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#e8a050"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h*0.7, w*0.5, h*0.4, 0, 0, Math.PI*2); ctx.stroke();
}

function drawScenery(ctx, s, x, y, w, h) {
  const k = s.scenery;
  if (k === "tree" || k === "palm") {
    // Trunk
    ctx.fillStyle = "#5a3818";
    ctx.fillRect(x + w*0.42, y + h*0.55, w*0.16, h*0.45);
    // Foliage (multiple circles for puffy look)
    ctx.fillStyle = s.color;
    const cx = x + w/2;
    const top = y + h*0.1;
    ctx.beginPath(); ctx.arc(cx, top + h*0.18, w*0.45, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - w*0.25, top + h*0.3, w*0.32, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w*0.25, top + h*0.3, w*0.32, 0, Math.PI*2); ctx.fill();
    // Shading on right
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.arc(cx + w*0.25, top + h*0.3, w*0.20, -Math.PI/2, Math.PI/2); ctx.fill();
  } else if (k === "rock") {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(x + w*0.1, y + h);
    ctx.lineTo(x + w*0.2, y + h*0.3);
    ctx.lineTo(x + w*0.5, y + h*0.1);
    ctx.lineTo(x + w*0.85, y + h*0.4);
    ctx.lineTo(x + w*0.95, y + h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.moveTo(x + w*0.5, y + h*0.1);
    ctx.lineTo(x + w*0.85, y + h*0.4);
    ctx.lineTo(x + w*0.95, y + h);
    ctx.lineTo(x + w*0.5, y + h);
    ctx.closePath(); ctx.fill();
    // highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + w*0.3, y + h*0.25, w*0.2, 3);
  } else if (k === "cactus") {
    ctx.fillStyle = s.color;
    ctx.fillRect(x + w*0.4, y + h*0.2, w*0.2, h*0.8);
    ctx.fillRect(x + w*0.2, y + h*0.4, w*0.15, h*0.3);
    ctx.fillRect(x + w*0.65, y + h*0.3, w*0.15, h*0.3);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x + w*0.55, y + h*0.2, w*0.05, h*0.8);
  } else if (k === "lamp") {
    // Post
    ctx.fillStyle = "#2a2a30";
    ctx.fillRect(x + w*0.4, y + h*0.2, w*0.2, h*0.8);
    // Lamp head
    ctx.fillStyle = "#1a1a20";
    ctx.fillRect(x + w*0.2, y + h*0.1, w*0.6, h*0.18);
    // Glow
    ctx.fillStyle = "rgba(255,220,120,0.6)";
    ctx.beginPath(); ctx.arc(x + w/2, y + h*0.2, w*0.4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ffe080";
    ctx.fillRect(x + w*0.35, y + h*0.13, w*0.3, h*0.12);
  } else if (k === "mailbox") {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + w*0.45, y + h*0.5, w*0.1, h*0.5);
    ctx.fillStyle = s.color;
    ctx.fillRect(x + w*0.2, y + h*0.2, w*0.6, h*0.35);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(x + w*0.55, y + h*0.3, w*0.1, h*0.05);
  } else if (k === "trash") {
    ctx.fillStyle = s.color;
    ctx.fillRect(x + w*0.25, y + h*0.2, w*0.5, h*0.8);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + w*0.25, y + h*0.2, w*0.5, h*0.05);
    ctx.fillRect(x + w*0.25, y + h*0.5, w*0.5, 1);
  } else if (k === "tomb") {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(x + w*0.2, y + h);
    ctx.lineTo(x + w*0.2, y + h*0.3);
    ctx.arc(x + w/2, y + h*0.3, w*0.3, Math.PI, 0);
    ctx.lineTo(x + w*0.8, y + h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + w*0.4, y + h*0.45, w*0.2, h*0.04);
    ctx.fillRect(x + w*0.35, y + h*0.55, w*0.3, h*0.04);
  } else if (k === "bone") {
    ctx.fillStyle = s.color;
    ctx.fillRect(x + w*0.2, y + h*0.4, w*0.6, h*0.2);
    ctx.beginPath(); ctx.arc(x + w*0.2, y + h*0.5, w*0.15, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w*0.8, y + h*0.5, w*0.15, 0, Math.PI*2); ctx.fill();
  } else if (k === "pillar") {
    ctx.fillStyle = s.color;
    ctx.fillRect(x + w*0.3, y + h*0.1, w*0.4, h*0.9);
    // Capital
    ctx.fillRect(x + w*0.2, y + h*0.05, w*0.6, h*0.1);
    // Base
    ctx.fillRect(x + w*0.2, y + h*0.95, w*0.6, h*0.05);
    // Flutes
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let i = 0; i < 4; i++) ctx.fillRect(x + w*0.32 + i * w*0.1, y + h*0.15, 1, h*0.8);
  } else if (k === "stalag") {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(x + w*0.2, y + h);
    ctx.lineTo(x + w/2, y + h*0.1);
    ctx.lineTo(x + w*0.8, y + h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + h*0.1);
    ctx.lineTo(x + w*0.4, y + h*0.6);
    ctx.lineTo(x + w*0.6, y + h*0.6);
    ctx.closePath(); ctx.fill();
  } else if (k === "seaweed") {
    ctx.strokeStyle = s.color; ctx.lineWidth = w*0.2;
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + h);
    ctx.quadraticCurveTo(x + w*0.2, y + h*0.5, x + w/2, y + h*0.2);
    ctx.stroke();
  } else if (k === "sign") {
    // Post
    ctx.fillStyle = "#5a3818";
    ctx.fillRect(x + w*0.45, y + h*0.5, w*0.1, h*0.5);
    // Board
    ctx.fillStyle = s.color;
    ctx.fillRect(x + w*0.1, y + h*0.2, w*0.8, h*0.3);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x + w*0.15, y + h*0.32, w*0.4, h*0.04);
    ctx.fillRect(x + w*0.15, y + h*0.4, w*0.6, h*0.04);
  } else {
    ctx.fillStyle = s.color;
    ctx.fillRect(x + w*0.25, y + h*0.3, w*0.5, h*0.7);
  }
}

function drawLandmark(ctx, s, x, y, w, h) {
  // Tall colored pillar with banner — visible from afar
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(x + w*0.4, y + h*0.4, w*0.2, h*0.6);
  // Banner
  ctx.fillStyle = s.color;
  ctx.fillRect(x + w*0.1, y, w*0.8, h*0.4);
  ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2;
  ctx.strokeRect(x + w*0.1, y, w*0.8, h*0.4);
  // Glow above
  const t = performance.now() / 600;
  ctx.fillStyle = `rgba(255,220,120,${0.3 + 0.2 * Math.sin(t)})`;
  ctx.beginPath(); ctx.arc(x + w/2, y - h*0.05, w*0.5, 0, Math.PI*2); ctx.fill();
}
function drawMarker(ctx, s, x, y, w, h) {
  ctx.fillStyle = s.color;
  ctx.fillRect(x + w*0.3, y + h*0.4, w*0.4, h*0.6);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(x + w*0.3, y + h*0.4, w*0.4, 2);
}

// ===== WEAPON OVERLAY =====
function drawWeaponOverlay() {
  const ctx = G.ctx;
  const w = WEAPONS[G.player.weapon];
  const t = G.swing ? G.swing.t / w.cd : 0;
  const swingY = G.swing ? -Math.sin(t * Math.PI) * 60 : 0;
  const swingX = G.swing ? Math.cos(t * Math.PI - Math.PI/2) * 40 : 0;
  ctx.save();
  ctx.translate(W * 0.7 + swingX, H + swingY);
  ctx.rotate(-0.3 + (G.swing ? t * 0.8 : 0));
  // Hand
  ctx.fillStyle = "#f0c98e";
  ctx.fillRect(-15, -40, 30, 40);
  // Weapon
  if (w.ranged) {
    ctx.fillStyle = "#5a3a1a";
    ctx.fillRect(-4, -180, 8, 150);
    ctx.strokeStyle = "#aaa"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -180); ctx.lineTo(-4, -30); ctx.stroke();
  } else {
    // Blade
    ctx.fillStyle = w.dmg >= 20 ? "#ffd060" : w.dmg >= 14 ? "#c0c0e8" : "#a8a8b8";
    ctx.fillRect(-4, -170, 8, 140);
    // Hilt
    ctx.fillStyle = "#5a3a1a";
    ctx.fillRect(-12, -40, 24, 10);
    ctx.fillRect(-3, -30, 6, 6);
  }
  ctx.restore();
}

// ===== MINIMAP =====
function drawMinimap() {
  const ctx = G.ctx;
  const m = MAPS[G.mapId];
  const mapW = G.interior ? G.interior.w : mapBounds(m).w;
  const mapH = G.interior ? G.interior.h : mapBounds(m).h;
  const mmSize = 140;
  const margin = 14;
  const mmX = W - mmSize - margin, mmY = margin + 60;
  const scale = mmSize / Math.max(mapW, mapH);
  // Background
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(mmX, mmY, mmSize, mmSize);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.strokeRect(mmX, mmY, mmSize, mmSize);
  // Walls
  if (!G.interior) {
    for (const z of m.subzones) {
      ctx.fillStyle = z.outdoor ? "rgba(255,255,255,0.15)" : "rgba(255,200,140,0.5)";
      ctx.fillRect(mmX + z.x * scale, mmY + z.y * scale, z.w * scale, z.h * scale);
      if (!z.outdoor) {
        const d = buildingDoor(z);
        ctx.fillStyle = "#ffd060";
        ctx.fillRect(mmX + d.x * scale, mmY + d.y * scale, d.w * scale, d.h * scale + 1);
      }
    }
  } else {
    ctx.fillStyle = "rgba(255,200,140,0.5)";
    for (const wl of G.interior.walls) ctx.fillRect(mmX + wl.x * scale, mmY + wl.y * scale, Math.max(1,wl.w*scale), Math.max(1,wl.h*scale));
    const d = G.interior.door;
    ctx.fillStyle = "#ffd060";
    ctx.fillRect(mmX + d.x * scale, mmY + d.y * scale, d.w * scale, d.h * scale + 1);
  }
  // Sprites
  for (const s of G.sprites) {
    ctx.fillStyle = s.kind === "enemy" || s.kind === "enemyPreview" ? "#e04848"
                   : s.kind === "ally" ? "#5cd97e"
                   : "#80c0ff";
    const sx = mmX + s.x * scale, sy = mmY + s.y * scale;
    ctx.fillRect(sx - 2, sy - 2, 4, 4);
  }
  // Player
  const px = mmX + G.player.x * scale, py = mmY + G.player.y * scale;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2); ctx.fill();
  // Facing line
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(px, py);
  ctx.lineTo(px + Math.cos(G.player.angle) * 10, py + Math.sin(G.player.angle) * 10);
  ctx.stroke();
  // Label
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Map", mmX + 4, mmY + 12);
}

function drawCrosshair() {
  const ctx = G.ctx;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W/2 - 8, H/2); ctx.lineTo(W/2 + 8, H/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2, H/2 - 8); ctx.lineTo(W/2, H/2 + 8); ctx.stroke();
  // Interact prompt
  if (G._nearestInteract && !G._nearestInteract._triggered) {
    const s = G._nearestInteract;
    let verb = "Interact";
    if (s.kind === "pedestal") verb = "Grab " + (s.label || "item");
    else if (s.kind === "npc") verb = "Talk to " + (s.label || "them");
    else if (s.kind === "portal") verb = "Enter " + (s.label || "portal");
    else if (s.kind === "fountain") verb = s.label || "Rest";
    else if (s.kind === "ring") verb = "Step in";
    else if (s.kind === "enemyPreview") verb = "Fight!";
    // Background pill
    ctx.font = "bold 14px -apple-system, sans-serif";
    const text = `[F] ${verb}`;
    const tw = ctx.measureText(text).width + 24;
    const tx = W/2 - tw/2;
    const ty = H/2 + 30;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(tx, ty, tw, 28);
    ctx.strokeStyle = "rgba(255,210,80,0.85)"; ctx.lineWidth = 1.5;
    ctx.strokeRect(tx, ty, tw, 28);
    ctx.fillStyle = "#ffd060";
    ctx.textAlign = "center";
    ctx.fillText(text, W/2, ty + 19);
  }
}

function drawCompass() {
  const ctx = G.ctx;
  // small compass below minimap
  const cx = W - 80, cy = 224;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "center";
  // N is angle = -PI/2 (up in source coords), but player angle is direction of motion
  ctx.fillText("N", cx, cy - 8);
  ctx.fillText("S", cx, cy + 14);
  ctx.fillText("W", cx - 13, cy + 4);
  ctx.fillText("E", cx + 13, cy + 4);
  // needle
  ctx.strokeStyle = "#ff4040"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(G.player.angle) * 14, cy + Math.sin(G.player.angle) * 14);
  ctx.stroke();
}

// ===== LOOP =====
function loop(t) {
  const dt = Math.min(0.05, (t - G.lastT) / 1000) || 0;
  G.lastT = t;
  update(dt);
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
    toast("Welcome to The Arena. WASD/Arrows to move and turn.", "info");
  } else toast("Save loaded.", "info");
  if (!MAPS[G.mapId]) G.mapId = "camp-hb";
  if (typeof G.player.angle !== "number") G.player.angle = -Math.PI / 2;
  requestAnimationFrame(loop);
}
document.addEventListener("DOMContentLoaded", init);

})();
