/* ============================================
   Mythic Duel — Arena Layouts
   Themed arenas for each location
   ============================================ */

var DuelArenas = (function () {
  "use strict";

  var arenas = {
    camp_halfblood: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a3a1a", bgBot: "#2a5a2a", groundColor: "#3a5a2a",
      platforms: [{ x: 180, y: 260, w: 100, h: 10 }, { x: 440, y: 280, w: 100, h: 10 }],
      obstacles: [{ x: 340, y: 310, w: 40, h: 40 }],
      pools: [{ x: 550, y: 340, w: 100, h: 10 }],
      spawnPlayer: { x: 80, y: 250 }, spawnEnemy: { x: 580, y: 250 }
    },
    manhattan: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#0a0a20", bgBot: "#1a1a3a", groundColor: "#3a3a4a",
      platforms: [{ x: 100, y: 250, w: 90, h: 10 }, { x: 520, y: 260, w: 90, h: 10 }],
      obstacles: [{ x: 300, y: 300, w: 50, h: 50 }, { x: 450, y: 310, w: 40, h: 40 }],
      pools: [],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 600, y: 250 }
    },
    manhattan_wide: {
      width: 1200, height: 400, groundY: 350,
      bgTop: "#0a0a20", bgBot: "#1a1a3a", groundColor: "#3a3a4a",
      platforms: [{ x: 200, y: 250, w: 100, h: 10 }, { x: 500, y: 230, w: 100, h: 10 }, { x: 800, y: 260, w: 100, h: 10 }],
      obstacles: [{ x: 350, y: 310, w: 50, h: 40 }, { x: 650, y: 300, w: 50, h: 50 }],
      pools: [],
      spawnPlayer: { x: 80, y: 250 }, spawnEnemy: { x: 1050, y: 250 }
    },
    olympus: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#e8d8b0", bgBot: "#c0a870", groundColor: "#d4c090",
      platforms: [{ x: 160, y: 240, w: 110, h: 10 }, { x: 450, y: 220, w: 110, h: 10 }],
      obstacles: [{ x: 330, y: 290, w: 60, h: 60 }],
      pools: [{ x: 80, y: 340, w: 80, h: 10 }],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 600, y: 250 }
    },
    underworld: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#0a0510", bgBot: "#1a0a20", groundColor: "#2a1a30",
      platforms: [{ x: 120, y: 260, w: 80, h: 10 }, { x: 500, y: 240, w: 80, h: 10 }],
      obstacles: [{ x: 320, y: 310, w: 50, h: 40 }],
      pools: [{ x: 200, y: 340, w: 100, h: 10 }],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 580, y: 250 }
    },
    tartarus: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#050005", bgBot: "#100510", groundColor: "#1a0a1a",
      platforms: [{ x: 150, y: 250, w: 80, h: 10 }, { x: 480, y: 260, w: 80, h: 10 }],
      obstacles: [{ x: 310, y: 300, w: 50, h: 50 }],
      pools: [],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 580, y: 250 }
    },
    camp_jupiter: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#2a1a0a", bgBot: "#4a3a1a", groundColor: "#5a4a2a",
      platforms: [{ x: 200, y: 260, w: 100, h: 10 }, { x: 420, y: 280, w: 100, h: 10 }],
      obstacles: [{ x: 340, y: 310, w: 40, h: 40 }],
      pools: [],
      spawnPlayer: { x: 80, y: 250 }, spawnEnemy: { x: 580, y: 250 }
    },
    san_francisco: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a2a3a", bgBot: "#3a4a5a", groundColor: "#4a5a5a",
      platforms: [{ x: 120, y: 250, w: 90, h: 10 }, { x: 500, y: 270, w: 90, h: 10 }],
      obstacles: [{ x: 300, y: 300, w: 50, h: 50 }],
      pools: [{ x: 400, y: 340, w: 100, h: 10 }],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 600, y: 250 }
    },
    alaska: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#c0d0e0", bgBot: "#90a0b0", groundColor: "#e0e8f0",
      platforms: [{ x: 200, y: 260, w: 100, h: 10 }],
      obstacles: [{ x: 400, y: 310, w: 50, h: 40 }, { x: 150, y: 310, w: 40, h: 40 }],
      pools: [{ x: 500, y: 340, w: 120, h: 10 }],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 580, y: 250 }
    },
    house_of_life: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#2a1a00", bgBot: "#4a3a10", groundColor: "#5a4a20",
      platforms: [{ x: 180, y: 250, w: 100, h: 10 }, { x: 440, y: 270, w: 100, h: 10 }],
      obstacles: [{ x: 330, y: 300, w: 60, h: 50 }],
      pools: [],
      spawnPlayer: { x: 80, y: 250 }, spawnEnemy: { x: 580, y: 250 }
    },
    egypt: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#3a2a00", bgBot: "#5a4a10", groundColor: "#6a5a20",
      platforms: [{ x: 160, y: 260, w: 90, h: 10 }, { x: 470, y: 240, w: 90, h: 10 }],
      obstacles: [{ x: 320, y: 290, w: 60, h: 60 }],
      pools: [{ x: 80, y: 340, w: 80, h: 10 }],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 600, y: 250 }
    },
    valhalla: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a1a2a", bgBot: "#2a2a4a", groundColor: "#3a3a4a",
      platforms: [{ x: 150, y: 250, w: 100, h: 10 }, { x: 460, y: 260, w: 100, h: 10 }],
      obstacles: [{ x: 330, y: 310, w: 50, h: 40 }],
      pools: [],
      spawnPlayer: { x: 80, y: 250 }, spawnEnemy: { x: 580, y: 250 }
    },
    asgard: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#d0c0a0", bgBot: "#a09070", groundColor: "#c0b080",
      platforms: [{ x: 180, y: 240, w: 110, h: 10 }, { x: 430, y: 220, w: 110, h: 10 }],
      obstacles: [{ x: 320, y: 280, w: 60, h: 70 }],
      pools: [],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 600, y: 250 }
    },
    jotunheim: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#0a1020", bgBot: "#1a2030", groundColor: "#2a3040",
      platforms: [{ x: 100, y: 250, w: 80, h: 10 }, { x: 520, y: 260, w: 80, h: 10 }],
      obstacles: [{ x: 300, y: 290, w: 60, h: 60 }, { x: 450, y: 310, w: 40, h: 40 }],
      pools: [{ x: 180, y: 340, w: 100, h: 10 }],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 600, y: 250 }
    },
    waystation: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a1a0a", bgBot: "#3a3a1a", groundColor: "#4a4a2a",
      platforms: [{ x: 200, y: 260, w: 100, h: 10 }, { x: 420, y: 280, w: 100, h: 10 }],
      obstacles: [{ x: 340, y: 310, w: 40, h: 40 }],
      pools: [],
      spawnPlayer: { x: 80, y: 250 }, spawnEnemy: { x: 580, y: 250 }
    },
    new_rome: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#2a1a1a", bgBot: "#4a2a2a", groundColor: "#5a3a3a",
      platforms: [{ x: 160, y: 250, w: 100, h: 10 }, { x: 460, y: 270, w: 100, h: 10 }],
      obstacles: [{ x: 320, y: 290, w: 60, h: 60 }],
      pools: [],
      spawnPlayer: { x: 60, y: 250 }, spawnEnemy: { x: 600, y: 250 }
    }
  };

  function get(id) { return arenas[id] || arenas.camp_halfblood; }

  return { arenas: arenas, get: get };
})();
