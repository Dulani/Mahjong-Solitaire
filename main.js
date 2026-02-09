/***********************************************
 * Global Variables and Game State
 ***********************************************/
let tiles = [];            // Array containing all tile objects.
let selectedTileId = null; // Id of the currently selected tile.
let currentLevel = 7;      // Start at Level 7 (Turtle).
const TILE_WIDTH = 80;
const TILE_HEIGHT = 100;

// Perspective and Debug state
let ROTATION_X = 10;
let ROTATION_Y = 0;
let ROTATION_Z = 0;
let ZOOM_FACTOR = 2.0;
let PAN_X = 100;
let PAN_Y = 100;
let SHOW_FREE_TILES = false;
let SHOW_CLICKABLE_AREAS = false;
const TILE_THICKNESS = 20;

// Define a comprehensive set of Mahjong tile emojis (used as keys for SVG generation).
const tileEmojis = ["🀇","🀈","🀉","🀊","🀋","🀌","🀍","🀎","🀏",
                    "🀐","🀑","🀒","🀓","🀔","🀕","🀖","🀗","🀘",
                    "🀙","🀚","🀛","🀜","🀝","🀞","🀟","🀠","🀡"];

/***********************************************
 * Generate Dynamic Positions for the Level
 * Creates a tapering pyramid where tiles are stacked directly on top of each other.
 ***********************************************/
function generatePositions(level) {
  const pos = [];
  const CX = 1000;
  const CY = 800;

  if (level === 7) {
    // Standard Turtle Layout (144 tiles)
    // Layer 0: Turtle Base (87 tiles)
    const turtleBase = [
      { y: 0, x: [1, 12] },
      { y: 1, x: [3, 10] },
      { y: 2, x: [2, 11] },
      { y: 3, x: [0, 12] },
      { y: 4, x: [1, 14] },
      { y: 5, x: [2, 11] },
      { y: 6, x: [3, 10] },
      { y: 7, x: [1, 12] }
    ];
    turtleBase.forEach(row => {
      for (let x = row.x[0]; x <= row.x[1]; x++) {
        pos.push({
          lx: CX + (x - 7) * TILE_WIDTH,
          ly: CY + (row.y - 3.5) * TILE_HEIGHT,
          z: 0
        });
      }
    });

    // Layer 1: 6x6 (36 tiles)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        pos.push({
          lx: CX + (c + 4.5 - 7) * TILE_WIDTH,
          ly: CY + (r + 1 - 3.5) * TILE_HEIGHT,
          z: 1
        });
      }
    }

    // Layer 2: 4x4 (16 tiles)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        pos.push({
          lx: CX + (c + 5.5 - 7) * TILE_WIDTH,
          ly: CY + (r + 2 - 3.5) * TILE_HEIGHT,
          z: 2
        });
      }
    }

    // Layer 3: 2x2 (4 tiles)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        pos.push({
          lx: CX + (c + 6.5 - 7) * TILE_WIDTH,
          ly: CY + (r + 3 - 3.5) * TILE_HEIGHT,
          z: 3
        });
      }
    }

    // Layer 4: 1x1 (1 tile)
    pos.push({
      lx: CX + (7 - 7) * TILE_WIDTH,
      ly: CY + (3.5 - 3.5) * TILE_HEIGHT,
      z: 4
    });

  } else {
    // Tapering Pyramid Layout
    // New formula: (level - z) * 2 ensures even width/height, thus even total tiles.
    // Level 2: 4x4 (16) + 2x2 (4) = 20 tiles.
    // Level 3: 6x6 (36) + 4x4 (16) + 2x2 (4) = 56 tiles.
    for (let z = 0; z < level; z++) {
      const width = (level - z) * 2;
      const height = (level - z) * 2;

      const offsetX = CX - (width * TILE_WIDTH) / 2;
      const offsetY = CY - (height * TILE_HEIGHT) / 2;

      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          pos.push({
            lx: offsetX + c * TILE_WIDTH,
            ly: offsetY + r * TILE_HEIGHT,
            z: z
          });
        }
      }
    }
  }

  // Ensure even number of tiles for matching (Safety net).
  if (pos.length % 2 !== 0) {
    const bottomTiles = pos.filter(p => p.z === 0);
    if (bottomTiles.length > 0) {
      bottomTiles.sort((a, b) => {
        const distA = Math.pow(a.lx - CX, 2) + Math.pow(a.ly - CY, 2);
        const distB = Math.pow(b.lx - CX, 2) + Math.pow(b.ly - CY, 2);
        return distA - distB;
      });
      const tileToRemove = bottomTiles[0];
      const idx = pos.indexOf(tileToRemove);
      pos.splice(idx, 1);
    }
  }

  return pos;
}

/***********************************************
 * Initialize the Game
 ***********************************************/
function initGame() {
  tiles = [];
  selectedTileId = null;
  document.getElementById("message").textContent = "";

  const positions = generatePositions(currentLevel);
  const totalTiles = positions.length;
  const uniqueCount = totalTiles / 2;

  let uniqueEmojis = [];
  for (let i = 0; i < uniqueCount; i++) {
    uniqueEmojis.push(tileEmojis[i % tileEmojis.length]);
  }

  let tileTypes = [];
  uniqueEmojis.forEach(emoji => {
    tileTypes.push(emoji);
    tileTypes.push(emoji);
  });
  shuffle(tileTypes);

  for (let i = 0; i < positions.length; i++) {
    let p = positions[i];
    let tile = {
      id: i,
      type: tileTypes[i],
      lx: p.lx,
      ly: p.ly,
      z: p.z,
      width: TILE_WIDTH,
      height: TILE_HEIGHT,
      removed: false
    };
    tiles.push(tile);
  }
  renderTiles();
  scaleBoard();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/***********************************************
 * Rendering Functions
 ***********************************************/
function renderTiles() {
  let board = document.getElementById("board-container");
  board.innerHTML = "";

  let sortedTiles = tiles.slice().sort((a, b) => a.z - b.z);

  sortedTiles.forEach(tile => {
    if (!tile.removed) {
      let tileDiv = document.createElement("div");
      tileDiv.className = "tile";

      const isFree = isTileFree(tile);
      if (SHOW_FREE_TILES && isFree) {
        tileDiv.classList.add("free-debug");
      }

      if (tile.id === selectedTileId) {
        tileDiv.classList.add("selected");
      }

      // Add faces for 3D thickness
      tileDiv.innerHTML = `
        <div class="tile-face tile-top">${getTileSVG(tile.type)}</div>
        <div class="tile-face tile-bottom"></div>
        <div class="tile-face tile-front"></div>
        <div class="tile-face tile-back"></div>
        <div class="tile-face tile-left"></div>
        <div class="tile-face tile-right"></div>
      `;

      if (SHOW_CLICKABLE_AREAS) {
        tileDiv.querySelector('.tile-top').classList.add("clickable-debug");
      }

      // Position in 3D space
      const tz = tile.z * TILE_THICKNESS;
      tileDiv.style.transform = `translate3d(${tile.lx}px, ${tile.ly}px, ${tz}px)`;

      tileDiv.onclick = () => handleTileClick(tile.id);
      board.appendChild(tileDiv);
    }
  });
}

/***********************************************
 * SVG Tile Generator
 ***********************************************/
function getTileSVG(emoji) {
  const index = tileEmojis.indexOf(emoji);
  if (index === -1) return emoji;

  let content = '';
  const viewBox = "0 0 100 120";

  if (index < 9) { // Characters
    const characters = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
    content = `
      <text x="50" y="45" font-size="40" text-anchor="middle" fill="#d32f2f" font-family="serif" font-weight="bold">${characters[index]}</text>
      <text x="50" y="95" font-size="45" text-anchor="middle" fill="#d32f2f" font-family="serif" font-weight="bold">萬</text>
    `;
  } else if (index < 18) { // Bamboos
    const count = index - 9 + 1;
    const colors = ["#2e7d32", "#1976d2", "#d32f2f"];
    const bamboo = (x, y, color) => `<rect x="${x-4}" y="${y-12}" width="8" height="24" rx="2" fill="${color}" stroke="#1b5e20" stroke-width="1"/>`;
    if (count === 1) {
      content = `<circle cx="50" cy="60" r="30" fill="none" stroke="#2e7d32" stroke-width="5"/>
                 <path d="M50 30 L50 90 M30 60 L70 60" stroke="#2e7d32" stroke-width="5"/>`;
    } else {
      const layouts = [
        [], [],
        [[50, 40, 0], [50, 80, 0]],
        [[50, 30, 0], [35, 75, 1], [65, 75, 1]],
        [[35, 40, 0], [65, 40, 1], [35, 80, 1], [65, 80, 0]],
        [[30, 35, 0], [70, 35, 1], [50, 60, 2], [30, 85, 1], [70, 85, 0]],
        [[30, 35, 0], [50, 35, 0], [70, 35, 0], [30, 85, 1], [50, 85, 1], [70, 85, 1]],
        [[50, 25, 0], [30, 55, 1], [50, 55, 1], [70, 55, 1], [30, 85, 2], [50, 85, 2], [70, 85, 2]],
        [[30, 30, 0], [50, 30, 0], [70, 30, 0], [30, 60, 1], [50, 60, 1], [70, 60, 1], [40, 90, 2], [60, 90, 2]],
        [[30, 30, 0], [50, 30, 1], [70, 30, 2], [30, 60, 0], [50, 60, 1], [70, 60, 2], [30, 90, 0], [50, 90, 1], [70, 90, 2]]
      ];
      layouts[count].forEach(p => content += bamboo(p[0], p[1], colors[p[2]]));
    }
  } else { // Circles
    const count = index - 18 + 1;
    const colors = ["#1976d2", "#d32f2f", "#2e7d32"];
    const circle = (x, y, r, color) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#0d47a1" stroke-width="1"/>`;
    if (count === 1) {
      content = circle(50, 60, 35, "#1976d2") + circle(50, 60, 15, "#ffeb3b") + circle(50, 60, 5, "#d32f2f");
    } else {
      const layouts = [
        [], [],
        [[35, 40, 15, 0], [65, 80, 15, 2]],
        [[30, 30, 12, 0], [50, 60, 12, 1], [70, 90, 12, 2]],
        [[35, 40, 15, 0], [65, 40, 15, 2], [35, 80, 15, 2], [65, 80, 15, 0]],
        [[30, 30, 12, 0], [70, 30, 12, 2], [50, 60, 12, 1], [30, 90, 12, 2], [70, 90, 12, 0]],
        [[35, 30, 12, 0], [65, 30, 12, 0], [35, 60, 12, 1], [65, 60, 12, 1], [35, 90, 12, 2], [65, 90, 12, 2]],
        [[50, 30, 10, 1], [30, 60, 10, 0], [50, 60, 10, 0], [70, 60, 10, 0], [30, 90, 10, 2], [50, 90, 10, 2], [70, 90, 10, 2]],
        [[35, 25, 10, 0], [65, 25, 10, 0], [35, 50, 10, 0], [65, 50, 10, 0], [35, 75, 10, 0], [65, 75, 10, 0], [35, 100, 10, 0], [65, 100, 10, 0]],
        [[30, 30, 10, 0], [50, 30, 10, 0], [70, 30, 10, 0], [30, 60, 10, 1], [50, 60, 10, 1], [70, 60, 10, 1], [30, 90, 10, 2], [50, 90, 10, 2], [70, 90, 10, 2]]
      ];
      layouts[count].forEach(p => content += circle(p[0], p[1], p[2], colors[p[3]]));
    }
  }
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

/***********************************************
 * Free Tile Detection
 ***********************************************/
function isTileFree(tile) {
  if (tile.removed) return false;

  // 1. Check if any tile is on top (using logical coordinates)
  for (let other of tiles) {
    if (!other.removed && other.z > tile.z) {
      if (isOverlap(tile, other)) return false;
    }
  }

  // 2. Check if left or right side is open (at the same level)
  let leftBlocked = false;
  let rightBlocked = false;
  for (let other of tiles) {
    if (!other.removed && other.z === tile.z && other.id !== tile.id) {
      if (isTouchingLeft(tile, other)) leftBlocked = true;
      if (isTouchingRight(tile, other)) rightBlocked = true;
    }
  }
  return (!leftBlocked || !rightBlocked);
}

function isOverlap(tile1, tile2) {
  // Use logical coordinates for logical overlap
  return (tile1.lx < tile2.lx + tile2.width && tile1.lx + tile1.width > tile2.lx &&
          tile1.ly < tile2.ly + tile2.height && tile1.ly + tile1.height > tile2.ly);
}

function isTouchingLeft(tile, other) {
  return (other.lx + other.width >= tile.lx - 5 && other.lx + other.width <= tile.lx + 5 && verticalOverlap(tile, other));
}

function isTouchingRight(tile, other) {
  return (other.lx <= tile.lx + tile.width + 5 && other.lx >= tile.lx + tile.width - 5 && verticalOverlap(tile, other));
}

function verticalOverlap(tile, other) {
  return (tile.ly < other.ly + other.height && tile.ly + tile.height > other.ly);
}

/***********************************************
 * Tile Selection & Matching
 ***********************************************/
function handleTileClick(tileId) {
  let tile = tiles.find(t => t.id === tileId);
  if (!tile || tile.removed) return;

  const isFree = isTileFree(tile);
  console.log(`Tile Clicked: ID=${tile.id}, Type=${tile.type}, LX=${tile.lx}, LY=${tile.ly}, Z=${tile.z}, Free=${isFree}`);

  if (!isFree) {
    document.getElementById("message").textContent = "Tile is not free.";
    return;
  }

  if (selectedTileId === null) {
    selectedTileId = tileId;
    document.getElementById("message").textContent = "Selected a tile. Click on its match.";
  } else {
    let firstTile = tiles.find(t => t.id === selectedTileId);
    if (firstTile.id === tile.id) {
      selectedTileId = null;
      document.getElementById("message").textContent = "";
    } else if (firstTile.type === tile.type) {
      firstTile.removed = true;
      tile.removed = true;
      document.getElementById("message").textContent = "Matched!";
      selectedTileId = null;
      renderTiles();
      checkWinCondition();
    } else {
      document.getElementById("message").textContent = "Tiles do not match.";
      selectedTileId = null;
    }
  }
  renderTiles();
}

function checkWinCondition() {
  if (tiles.filter(t => !t.removed).length === 0) {
    document.getElementById("message").textContent = "Congratulations! Level " + currentLevel + " cleared!";
    setTimeout(() => {
      currentLevel++;
      const input = document.getElementById("levelInput");
      if (input) input.value = currentLevel;
      initGame();
    }, 2000);
  }
}

/***********************************************
 * Scaling Logic
 ***********************************************/
function scaleBoard() {
  const container = document.getElementById("board-container");
  const mainContent = document.getElementById("main-content");
  const wrapper = document.getElementById("game-wrapper");
  if (!container || !mainContent || !wrapper) return;

  wrapper.style.perspectiveOrigin = `${PAN_X}% ${PAN_Y}%`;

  const availableWidth = mainContent.clientWidth - 40;
  const availableHeight = mainContent.clientHeight - 80;

  // Fixed bounding box for the virtual 2000x1600 space
  const boardWidth = 2000;
  const boardHeight = 1600;

  const scaleX = availableWidth / boardWidth;
  const scaleY = availableHeight / boardHeight;
  const baseScale = Math.min(scaleX, scaleY, 0.8); // 0.8 to leave some margin
  const scale = baseScale * ZOOM_FACTOR;

  container.style.transform = `scale(${scale}) rotateX(${ROTATION_X}deg) rotateY(${ROTATION_Y}deg) rotateZ(${ROTATION_Z}deg)`;
}

window.addEventListener("resize", scaleBoard);

/***********************************************
 * Perspective Handlers
 ***********************************************/
function updatePerspective() {
    ROTATION_X = parseFloat(document.getElementById("perspX").value);
    ROTATION_Y = parseFloat(document.getElementById("perspY").value);
    ROTATION_Z = parseFloat(document.getElementById("perspZ").value);
    ZOOM_FACTOR = parseFloat(document.getElementById("zoomRange").value);
    PAN_X = parseFloat(document.getElementById("panX").value);
    PAN_Y = parseFloat(document.getElementById("panY").value);

    document.getElementById("valX").textContent = ROTATION_X + "°";
    document.getElementById("valY").textContent = ROTATION_Y + "°";
    document.getElementById("valZ").textContent = ROTATION_Z + "°";
    document.getElementById("valZoom").textContent = ZOOM_FACTOR.toFixed(1) + "x";
    document.getElementById("valPanX").textContent = PAN_X + "%";
    document.getElementById("valPanY").textContent = PAN_Y + "%";

    scaleBoard();
}

/***********************************************
 * Event Handlers
 ***********************************************/
window.onload = () => {
    const newGameBtn = document.getElementById("newGameBtn");
    if (newGameBtn) newGameBtn.onclick = () => {
        currentLevel = parseInt(document.getElementById("levelInput").value) || 7;
        initGame();
    };

    const levelInput = document.getElementById("levelInput");
    if (levelInput) {
        levelInput.value = currentLevel;
        levelInput.onchange = (e) => {
        let val = parseInt(e.target.value);
        if (val >= 2) {
            currentLevel = val;
            initGame();
        } else {
            e.target.value = currentLevel;
        }
    };
    }

    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) sidebarToggle.onclick = () => {
        document.getElementById("sidebar").classList.toggle("collapsed");
        setTimeout(scaleBoard, 310);
    };

    const perspX = document.getElementById("perspX");
    if (perspX) perspX.oninput = updatePerspective;

    const perspY = document.getElementById("perspY");
    if (perspY) perspY.oninput = updatePerspective;

    const perspZ = document.getElementById("perspZ");
    if (perspZ) perspZ.oninput = updatePerspective;

    const zoomRange = document.getElementById("zoomRange");
    if (zoomRange) zoomRange.oninput = updatePerspective;

    const panX = document.getElementById("panX");
    if (panX) panX.oninput = updatePerspective;

    const panY = document.getElementById("panY");
    if (panY) panY.oninput = updatePerspective;

    const showDebug = document.getElementById("showDebug");
    const debugControls = document.querySelector(".debug-controls");
    if (showDebug && debugControls) {
        showDebug.onchange = (e) => {
            if (e.target.checked) {
                debugControls.classList.remove("hidden");
            } else {
                debugControls.classList.add("hidden");
            }
            setTimeout(scaleBoard, 310);
        };
        // Initial state: hide if not checked
        if (!showDebug.checked) {
            debugControls.classList.add("hidden");
        }
    }

    const debugToggle = document.getElementById("debugToggle");
    if (debugToggle) debugToggle.onchange = (e) => {
        SHOW_FREE_TILES = e.target.checked;
        renderTiles();
    };

    const clickableToggle = document.getElementById("clickableToggle");
    if (clickableToggle) clickableToggle.onchange = (e) => {
        SHOW_CLICKABLE_AREAS = e.target.checked;
        renderTiles();
    };

    initGame();
    console.log("Mahjong Solitaire v0.25 initialized.");
};
