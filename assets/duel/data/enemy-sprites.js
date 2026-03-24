/* ============================================
   Mythic Duel — Enemy Sprite Definitions
   50+ enemies: humanoids use templates, monsters use custom frames
   ============================================ */

var DuelEnemySprites = (function () {
  "use strict";

  var C = DuelPalettes.C;
  var pf = DuelPalettes.parseFrame;
  var hft = DuelPalettes.heroFromTemplate;
  var cache = {};

  /* ---- Palette builder for humanoid enemies ---- */
  function pal(hair, shirt, shirtD, pants, weapon, skinOverride) {
    return {
      ".": 0, "o": C.outline, "s": skinOverride || C.skin, "d": skinOverride ? C.skinDarkD : C.skinD, "W": C.white,
      "h": hair, "t": shirt, "T": shirtD, "p": pants, "w": weapon
    };
  }

  /* ---- Humanoid enemies (use shared templates) ---- */
  var humanoids = {
    luke:       hft(pal(C.gold, C.dark, C.darkD, "#2a2a3c", C.silver)),
    ares:       hft(pal(C.red, C.redD, "#801010", "#2a2a3c", C.gray)),
    atlas:      hft(pal(C.grayD, C.brown, C.brownD, "#3a3a3a", C.gray)),
    octavian:   hft(pal(C.gold, C.white, C.grayL, "#3a3a50", C.goldD)),
    nero:       hft(pal(C.copper, C.purple, C.purpleD, "#3a3a3c", C.gold)),
    commodus:   hft(pal(C.brown, C.gold, C.goldD, "#4a3a2a", C.gray)),
    caligula:   hft(pal(C.black, C.silver, C.silverD, "#2a2a3c", C.gold)),
    lityerses:  hft(pal(C.black, C.brown, C.brownD, "#3a3a3c", C.gray)),
    medea:      hft(pal(C.black, C.green, C.greenD, "#3a3a3c", C.greenL)),
    antaeus:    hft(pal(C.brown, C.brownD, "#4a3a1a", "#4a4a3c", C.gray)),
    orion:      hft(pal(C.black, C.dark, C.darkD, "#2a2a3c", C.silver)),
    sarah_jacobi: hft(pal(C.black, C.blue, C.blueD, "#3a3a50", C.gold)),
    setne:      hft(pal(C.white, C.dark, C.darkD, "#2a2a3c", C.gold)),
    desjardins: hft(pal(C.grayD, C.blue, C.blueD, "#3a3a50", C.gold)),
    menshikov:  hft(pal(C.white, C.dark, C.darkD, "#2a2a3c", C.red)),
    alderman:   hft(pal(C.gold, C.gray, C.grayD, "#3a3a50", C.grayD)),
    pasiphae:   hft(pal(C.black, C.purple, C.purpleD, "#3a3a50", C.purpleL)),
    loki:       hft(pal(C.greenL, C.green, C.greenD, "#2a2a3c", C.greenD)),
    midas:      hft(pal(C.gold, C.gold, C.goldD, "#8a7020", C.gold))
  };

  /* ---- Monster base palette ---- */
  var mp = {
    ".": 0, "o": C.outline,
    "r": C.red, "R": C.redD, "y": C.yellow, "Y": C.goldD,
    "b": C.brown, "B": C.brownD, "g": C.green, "G": C.greenD,
    "p": C.purple, "P": C.purpleD, "k": C.dark, "K": C.darkD,
    "d": C.red, "D": C.redD, "u": C.blue, "U": C.blueD,
    "w": C.gold, "W": C.white, "x": C.gray, "X": C.grayD,
    "s": C.skin, "S": C.skinD, "c": C.cyan, "C": C.cyanD,
    "f": C.orange, "F": C.orangeD, "i": C.pink, "I": C.pinkD
  };

  /* ---- Custom monster frames ---- */
  var monsters = {};

  /* Chimera */
  monsters.chimera = { idle: pf([
    "................","..oyyo..........","oyyyyyo.........","oyyyyyo.........","oyWyrWyo........","oyyyyyyyo.obb...",
    ".oyyyoo.oobBBo..",".ooo..obbBBBbo..","......obBBBBbo..",".....obBBBBBbo..",".....obBBBBBbo..","....oobBBBBBoo..",
    "...orrBBBBBBrr..","...ob.bBBBb.bo..","...ob.bBBBb.bo..","...ob..bBb..bo..","...oo..obo..oo..",".......ogrgo....",
    "........oggo....","........ogo.....","........oo......","................","................","................"
  ], mp) };

  /* Cerberus */
  monsters.cerberus = { idle: pf([
    ".okkko.okkko....","okkkkkokkkkkoo..","okWkkokokWkkko..","okkkkkkkkkkko...",".okkkkkkkkko....",
    "..okkkkkkko.....","..okkkkkkkko....","..okkkkkkkkko...",".okkkkkkkkkko...",".okkkkkkkkkkko..",
    ".okkkkkkkkkkko..","..okkkkkkkkko...","..ok.okkko.ko...","..ok.okkko.ko...","..ok..oko..ko...",
    "..oo..ooo..oo...","................","................","................","................",
    "................","................","................","................"
  ], mp) };

  /* Medusa */
  monsters.medusa = { idle: pf([
    "..ggoggoggoggo..","..goggoggoggog..",".ogggggggggggo..","..oggggggggo...","..osSssssSso...",
    "..ossssssss....","...osssssso....","....ossso......","...oGGGGGGo....","..oGGGGGGGo....",
    "..oGGgggGGo....","..oGGGGGGGoo...",".ssGGGGGGGss...","ss..GGGGG..ss..","....GGGGG......",
    "....ggggg......","...ogggggo.....","...ogggggo.....","...og...go.....","...og...go.....",
    "..oog...goo....","..ooo...ooo....","................","................"
  ], mp) };

  /* Minotaur */
  monsters.minotaur = { idle: pf([
    "ob...........bo.","obo.obbbo..obo..","obo.obbbbo.obo..",".obbbbbbbbbbo...",".obWbbbbWbbbo...",
    ".obbbbbbbbbo....","..obbbbbbbbo....",".obbbbbbbbo.....","..obBBBBBBo.....",".obBBBBBBBBo....",
    ".obBBBBBBBBo....","oobBBBBBBBBoo...","obBBBBBBBBBBo...","ob..BBBBBB..bo..","....BBBBBB......",
    "....BBBBBB......","...obBBBBbo.....","...obBBBBbo.....","...ob...bbo.....","...ob...bbo.....",
    "..oob...bboo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Manticore (Dr Thorn) */
  monsters.manticore = { idle: pf([
    "..orrrrro.......","..orrrrrrro.....","..orrrrrrro.....","..osWrrWrso.....",".ossrrrrrss.....",
    "..osrrrrso......","...orrro........","..odddddddo.....",".oddddddddo.....",".odddddddddorrr.",
    ".oddddddddorrr..","oodddddddoo.rr..","odddddddddd..r..","od..ddddd..do...","....ddddd.......",
    "....ddddd.......","...odddddo......","...odddddo......","...od...ddo.....","...od...ddo.....",
    "..ood...ddoo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Sobek */
  monsters.sobek = { idle: pf([
    "....ogggggo.....","...oGGGGGGGo....","..oGGGGGGGGGo...","..oGWGGGWGGGo...",
    "..oGGGGGGGGGo...","..oGGGyyGGGGo...","...oGGGGGGGo....","....oGGGGGo.....",
    "...ouuuuuuuo....","..ouuuuuuuuo....","..ouUuuuuUuo....",".oouuuuuuuuoo...",
    ".ssuuuuuuuuss...","ss..uuuuuu..ss..","....uuuuu.......","....ggggg.......",
    "...ogggggo......","...ogggggo......","...og...go......","...og...go......",
    "..oog...goo.....","..ooo...ooo.....","................","................"
  ], mp) };

  /* Set */
  monsters.set = { idle: pf([
    "....oddddo......","...oddddddo.....","..oddddddddoo...",
    "..odddddddddo...","..odWdddWdddo...","..odddddddddo...",
    "...oddddddddo...","....odddddo.....","...okkkkkkko....",
    "..okkkkkkkkko...","..okKkkkkKkko...",".ookkkkkkkkkooo.",
    ".sskkkkkkkkkss..",".ss.kkkkkkk.ss..","....kkkkk.......","....kkkkk.......",
    "...okkkkko......","...okkkkko......","...ok...ko......","...ok...ko......",
    "..ook...koo.....","..ooo...ooo.....","................","................"
  ], mp) };

  /* Nyx */
  monsters.nyx = { idle: pf([
    "....oppppo......","...opppppppo....",
    "...oppppppppo...","...oWpppppWpo...","...opppppppp....",
    "....oppppppo....",".....opppo......","....okkkkko.....",
    "...okkkkkkkko...","..okkkkkkkkko...","..okKkkkkkKko...",
    ".ookkkkkkkkkoo..","..kkkkkkkkkk....","....kkkkkkk.....","....kkkkkkk.....",
    "....ppppppp.....","...oppppppo.....","...oppppppo.....","...op...ppo.....",
    "...op....po.....","..oop....poo....","..ooo....ooo....","................","................"
  ], mp) };

  /* Apophis - serpent */
  monsters.apophis = { idle: pf([
    "................","....odddddo.....","...odddddddoo...","..odddddddddo...",
    "..odWddddWddo...","..odddddddddo...","..odddyydddddo..","...odddddddddo..",
    "....odddddddo...",".....odddddo....","......odddo......",".......oddo.....",
    "........oddo....","........oddo....","........oddo.....",".........oddo...",
    "..........oddo..","...........oddo.","............oddo","..............od",
    "................","................","................","................"
  ], mp) };

  /* Kronos - armored titan */
  monsters.kronos = { idle: pf([
    "...oxxxxxxo.....","..oxxxxxxxxxxo..","..oxxxxxxxxxxo..","..osssssssssso..",
    "..osWssssWssso..","..ossssssssss...","...osssssssso...","....osssso......",
    "..owwxxxxxxwo...",".owwxxxxxxxxwo..",".owXxxxxxxxXwo..","oowxxxxxxxxxxoo.",
    "osxxxxxxxxxx.so.","os..xxxxxxx..so.","....xxxxxxx.....","....xxxxxxx.....",
    "...oxxxxxxo.....","...oxxxxxxo.....","...ox...xxo.....","...ox...xxo.....",
    "..oox...xxoo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Typhon - massive */
  monsters.typhon = { idle: pf([
    "..oddddddddddo.",".odddddddddddo.",".oddddddddddddo",".odWddddddWdddo",
    ".odddddddddddo.",".oddddrrddddddo","..odddddddddo..","...oddddddo....",
    "..odddddddddo..",".odddddddddddo.",".odDdddddddDdo.","ooddddddddddoo.",
    "odddddddddddddo","od..ddddddd..do","....ddddddd....","....ddddddd....",
    "...odddddddo...","...odddddddo...","...od....ddo...","...od....ddo...",
    "..ood....ddoo..","..ooo....oooo..","................","................"
  ], mp) };

  /* Surt - fire giant */
  monsters.surt = { idle: pf([
    "...offffffo.....","..offffffffffo..","..offfffffFFfo..","..oFWffffWFffo..",
    "..offfffffffffo.","..offfrrffffo...","...offffffffo...","....offffffo....",
    "..offfffffffffo.",".offffffffffffffo",".ofFfffffffffFfo","ooffffffffffff oo",
    "offffffffffff fo","of..fffffffff..fo","....fffffffff...","....fffffffff...",
    "...offffffffo...","...offffffffo...","...of....ffo....","...of....ffo....",
    "..oof....ffoo...","..ooo....oooo...","................","................"
  ], mp) };

  /* Fenris Wolf */
  monsters.fenris = { idle: pf([
    "................","..oxxxxxxo......","oxxxxxxxxxo.....","oxxWxxxxxxo.....",
    "oxxxxxxxxxo.....","oxxxyyxxxo......",".oxxxxxxxxxxxxxxo","..oxxxxxxxxxxxxx",
    "..oxxxxxxxxxxxxx","..oxxxxxxxxxxxxx",".oxxxxxxxxxxxxxx",".oxxxxxxxxxxxxxx",
    "..oxxxxxxxxxxxxx","..ox.oxxxo.xxxo.","..ox.oxxxo..xxo.","..ox..oxo...xxo.",
    "..oo..ooo...ooo.","................","................","................",
    "................","................","................","................"
  ], mp) };

  /* Python - great serpent */
  monsters.python = { idle: pf([
    "................","...ogggggo......","..oGGGGGGGGo....","..oGWGGGWGGo....",
    "..oGGGGGGGGo....","..oGGGyyGGGo....","...oGGGGGGo.....","....oGGGGo......",
    ".....oGGGo......","......oGGo......","......oGGo......",".......oGGo.....",
    "........oGGo....","........oGGo....",".........oGGo...",".........oGGo...",
    "..........oGo...","..........oGo...","...........oo...","................",
    "................","................","................","................"
  ], mp) };

  /* Furies (Alecto) */
  monsters.alecto = { idle: pf([
    "....okkkkko.....","...okkkkkkko....","..okkkkkkkko....","..okWkkkWkko....",
    "..okkkkkkko.....","..okkkkkkko.....","...okkkko.......","....okkkko......",
    "..okkkkkkkko....","ookkkkkkkkkkoo..",".okkkkkkkkkkko..",".okKkkkkkKkkko..",
    "..okkkkkkkkko...","..ok.okkko.ko...","..ok..oko..ko...","..oo..ooo..oo...",
    "................","................","................","................",
    "................","................","................","................"
  ], mp) };

  /* Procrustes */
  monsters.procrustes = { idle: pf([
    "....obbbbbo.....","...obbbbbbbbo...","...obbbbbbbbo...","...osssssssso...",
    "...osWsssWsso...","...ossssssss....","....osssssso....","....ossso.......",
    "...obBBBBBBo....","..obBBBBBBBBo...","..obBBBBBBBBo...",".oobBBBBBBBBoo..",
    ".ssbBBBBBBBBss..","ss..BBBBBB..ss..","....BBBBBB......","....BBBBBB......",
    "...obBBBBbo.....","...obBBBBbo.....","...ob...bbo.....","...ob...bbo.....",
    "..oob...bboo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Kelli (Empousa) */
  monsters.kelli = { idle: pf([
    "....oddddo......","...odddddddo....","...odddddddo....","...osssssssso...",
    "...osWsssWsso...","...ossssssss....","....osssssso....",".....ossso......",
    "....odddddddo...","...odddddddddo..","...odddddddddoo.",".oossdddddddsoo.",
    ".ss..ddddddd..s.","ss...ddddddd..s.","....ddddddd.....","....ddddddd.....",
    "...odddddddo....","...odddddddo....","...od....ddo....","...od....ddo....",
    "..ood....ddoo...","..ooo....oooo...","................","................"
  ], mp) };

  /* Gaea */
  monsters.gaea = { idle: pf([
    "....obbbbbo.....","...obGGGGGGo....","...oGGGGGGGGo...","...oGWGGGWGGo...",
    "...oGGGGGGGGo...","...oGGGGGGGG....","....oGGGGGGo....",".....oGGGo......",
    "...oGGGGGGGGo...","..oGGGGGGGGGGo..","..oGGgGGGGgGGo..",".ooGGGGGGGGGGoo.",
    ".bbGGGGGGGGGbb..","bb..GGGGGGG..bb.","....GGGGGGG.....","....bbbbbbb.....",
    "...obbbbbbo.....","...obbbbbbo.....","...ob...bbo.....","...ob...bbo.....",
    "..oob...bboo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Porphyrion - giant king */
  monsters.porphyrion = { idle: pf([
    "..oxxxxxxxxo....","oxxxxxxxxxxxxxxo","oxxxxxxxxxxxxxxo","oxWxxxxxxxxxWxxo",
    "oxxxxxxxxxxxxxxo","oxxxxrrxxxxxo...","..oxxxxxxxxxxo..","....oxxxxxxo....",
    "...oxxxxxxxxxxo.",".oxxxxxxxxxxxxxxo","oxXxxxxxxxxxxXxo","oxxxxxxxxxxxxxxo",
    "oxxxxxxxxxxxxxxo","ox..xxxxxxx..xo.","....xxxxxxx.....","....xxxxxxx.....",
    "...oxxxxxxo.....","...oxxxxxxo.....","...ox...xxo.....","...ox...xxo.....",
    "..oox...xxoo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Polybotes */
  monsters.polybotes = { idle: pf([
    "...ouuuuuuo.....","..ouuuuuuuuuo...","..ouuuuuuuuuo...","..ouWuuuuWuuo...",
    "..ouuuuuuuuuo...","..ouuurrruuuo...","...ouuuuuuuo....","....ouuuuuo.....",
    "..ouuuuuuuuuo...",".ouuuuuuuuuuuo..",".ouUuuuuuuuUuo..","oouuuuuuuuuuuoo.",
    "ouuuuuuuuuuuuuo.","ou..uuuuuuu..uo.","....uuuuuuu.....","....uuuuuuu.....",
    "...ouuuuuuo.....","...ouuuuuuo.....","...ou...uuo.....","...ou...uuo.....",
    "..oou...uuoo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Khione - ice goddess */
  monsters.khione = { idle: pf([
    "....occccco.....","...occcccccco...","...occcccccco...","...osssssssso...",
    "...osWsssWsso...","...ossssssss....","....osssssso....",".....ossso......",
    "....occccccco...","...occcccccco...","...ocCcccccCco..","..ooccccccccoo..",
    "..ssccccccccss..","..ss.ccccccc.ss.","....ccccccc.....","....ccccccc.....",
    "...occccccco....","...occccccco....","...oc...cco.....","...oc...cco.....",
    "..ooc...ccoo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Tarquin */
  monsters.tarquin = { idle: pf([
    "....oxxxxxo.....","...oxxxxxxx.....","...oxxxxxxxxo...","...oXWxxxWXxo...",
    "...oxxxxxxxxo...","...oxxxxxyyxo...","....oxxxxxxo....",".....oxxxo......",
    "....okkkkkkko...","...okkkkkkkkko..","...okKkkkkkKko..",".ookkkkkkkkkoo..",
    ".xxkkkkkkkkkxx..","xx..kkkkkkk..xx.","....kkkkkkk.....","....xxxxxxx.....",
    "...oxxxxxxo.....","...oxxxxxxo.....","...ox...xxo.....","...ox...xxo.....",
    "..oox...xxoo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Epiales - nightmare god */
  monsters.epiales = { idle: pf([
    "...opppppo......","..opppppppppo...","..oppppppppppo..","..opWppppWpppo..",
    "..opppppppppo...","..opppprrpppo...","...oppppppppo...","....opppppo.....",
    "..oppppppppppo..",".opppppppppppo..","opPpppppppPpppo.","opppppppppppppo.",
    "oppppppppppppp..","op..ppppppp..po.","....ppppppp.....","....KKKKKKK.....",
    "...oKKKKKKo.....","...oKKKKKKo.....","...oK...KKo.....","...oK...KKo.....",
    "..ooK...KKoo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Hrungnir */
  monsters.hrungnir = { idle: pf([
    "...oxxxxxxo.....","..oxxxxxxxxxxxxo","..oxxxxxxxxxxxxo","..oxWxxxxxWxxxo.",
    "..oxxxxxxxxxxxxo","..oxxxrrxxxxxxo.","...oxxxxxxxxo...","....oxxxxxxo....",
    "..oxxxxxxxxxxo..",".oxxxxxxxxxxxxo.",".oxXxxxxxxxxXxo.","ooxxxxxxxxxxxxxxo",
    "oxxxxxxxxxxxxxxo","ox..xxxxxxx..xo.","....xxxxxxx.....","....xxxxxxx.....",
    "...oxxxxxxo.....","...oxxxxxxo.....","...ox...xxo.....","...ox...xxo.....",
    "..oox...xxoo....","..ooo...oooo....","................","................"
  ], mp) };

  /* Compile all sprites */
  var sprites = {};
  var hkeys = Object.keys(humanoids);
  for (var i = 0; i < hkeys.length; i++) {
    sprites[hkeys[i]] = humanoids[hkeys[i]];
  }
  var mkeys = Object.keys(monsters);
  for (var j = 0; j < mkeys.length; j++) {
    var m = monsters[mkeys[j]];
    sprites[mkeys[j]] = { idle: m.idle, attack: m.idle, hurt: m.idle, block: m.idle, walk: m.idle, duck: m.idle };
  }

  function getCached(key, frame, scale, flipX) {
    var cacheKey = key + (flipX ? "_flip" : "");
    if (!cache[cacheKey]) cache[cacheKey] = DuelHeroSprites.cacheFrame(frame, scale, flipX);
    return cache[cacheKey];
  }

  return { sprites: sprites, getCached: getCached };
})();
