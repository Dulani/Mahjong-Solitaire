/***********************************************
 * Global Variables and Game State
 ***********************************************/
let tiles = [];            // Array containing all tile objects.
let selectedTileId = null; // Id of the currently selected tile.
let currentLevel = 5;      // Start at Level 5.
const TILE_WIDTH = 80;
const TILE_HEIGHT = 100;

// Perspective and Debug state
let ROTATION_X = 45;
let ROTATION_Y = 0;
let SHOW_FREE_TILES = true;
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

  for (let z = 0; z < level; z++) {
    const diff = (level - 1 - z);
    // Last layer is 1x1, second-to-last is 2x2, then it grows by 2 each layer down.
    const width = (diff === 0) ? 1 : diff * 2;
    const height = (diff === 0) ? 1 : diff * 2;

    // Offset for centering the layer (Logical coordinates)
    const offsetX = 1000 - (width * TILE_WIDTH) / 2;
    const offsetY = 800 - (height * TILE_HEIGHT) / 2;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        pos.push({
          lx: offsetX + c * TILE_WIDTH, // Logical X
          ly: offsetY + r * TILE_HEIGHT, // Logical Y
          z: z
        });
      }
    }
  }

  // Ensure even number of tiles for matching.
  if (pos.length % 2 !== 0) {
    // To avoid "missing corner" bugs, we remove an internal tile from the bottom layer.
    // Bottom layer is the beginning of the 'pos' array.
    const bottomLayerDiff = level - 1;
    const bottomWidth = (bottomLayerDiff === 0) ? 1 : bottomLayerDiff * 2;
    const bottomHeight = (bottomLayerDiff === 0) ? 1 : bottomLayerDiff * 2;
    const bottomCount = bottomWidth * bottomHeight;

    if (bottomCount > 1) {
      // Remove a tile near the center of the bottom layer to keep it hidden
      const midR = Math.floor(bottomHeight / 2);
      const midC = Math.floor(bottomWidth / 2);
      const midIdx = midR * bottomWidth + midC;
      pos.splice(midIdx, 1);
    } else {
      // Fallback for very small levels
      pos.shift();
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
  if (!container || !mainContent) return;

  const availableWidth = mainContent.clientWidth - 40;
  const availableHeight = mainContent.clientHeight - 80;

  // Fixed bounding box for the virtual 2000x1600 space
  const boardWidth = 2000;
  const boardHeight = 1600;

  const scaleX = availableWidth / boardWidth;
  const scaleY = availableHeight / boardHeight;
  const scale = Math.min(scaleX, scaleY, 0.8); // 0.8 to leave some margin

  container.style.transform = `scale(${scale}) rotateX(${ROTATION_X}deg) rotateY(${ROTATION_Y}deg)`;
}

window.addEventListener("resize", scaleBoard);

/***********************************************
 * Perspective Handlers
 ***********************************************/
function updatePerspective() {
    ROTATION_X = parseFloat(document.getElementById("perspX").value);
    ROTATION_Y = parseFloat(document.getElementById("perspY").value);
    document.getElementById("valX").textContent = ROTATION_X + "°";
    document.getElementById("valY").textContent = ROTATION_Y + "°";
    scaleBoard();
}

/***********************************************
 * Event Handlers
 ***********************************************/
window.onload = () => {
    const newGameBtn = document.getElementById("newGameBtn");
    if (newGameBtn) newGameBtn.onclick = () => {
        currentLevel = parseInt(document.getElementById("levelInput").value) || 5;
        initGame();
    };

    const levelInput = document.getElementById("levelInput");
    if (levelInput) levelInput.onchange = (e) => {
        let val = parseInt(e.target.value);
        if (val >= 2) {
            currentLevel = val;
            initGame();
        } else {
            e.target.value = currentLevel;
        }
    };

    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) sidebarToggle.onclick = () => {
        document.getElementById("sidebar").classList.toggle("collapsed");
        setTimeout(scaleBoard, 310);
    };

    const perspX = document.getElementById("perspX");
    if (perspX) perspX.oninput = updatePerspective;

    const perspY = document.getElementById("perspY");
    if (perspY) perspY.oninput = updatePerspective;

    const debugToggle = document.getElementById("debugToggle");
    if (debugToggle) debugToggle.onchange = (e) => {
        SHOW_FREE_TILES = e.target.checked;
        renderTiles();
    };

    initGame();
};
