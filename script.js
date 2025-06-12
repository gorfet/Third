// Game state
const state = {
  levelTransitioning: false,
  gameStarted: false,
  paused: false,
  currentFloor: 1,
  score: 0,
  mazeSize: 15,
  cellSize: 0,
  playerPosition: { x: 1, y: 1 },
  monsterPosition: { x: 0, y: 0 },
  monsterActive: false,
  traps: [],
  powerups: [],
  maze: [],
  fogOfWar: [],
  visibilityRadius: 2,
  playerElement: null,
  monsterElement: null,
  exitPosition: { x: 0, y: 0 },
  gameOver: false,
  keysPressed: {},
  lastUpdate: 0,
  monsterSpeed: 0.5, // Relative to player speed
  monsterUpdateCounter: 0,
  isMobile: false,
  miniMapVisible: false,
  activePowerup: null,
  powerupTimer: 0,
  powerupDuration: 10000, // 10 seconds
  particles: [],
  howToPlayScreen: false,
};

// DOM Elements
const homeScreen = document.getElementById("homeScreen");
const howToPlayScreen = document.getElementById("howToPlayScreen");
const gameContainer = document.getElementById("gameContainer");
const mazeElement = document.getElementById("maze");
const floorLevelElement = document.getElementById("floorLevel");
const scoreValueElement = document.getElementById("scoreValue");
const gameOverScreen = document.getElementById("gameOver");
const levelCompleteScreen = document.getElementById("levelComplete");
const pauseScreen = document.getElementById("pauseScreen");
const finalFloorElement = document.getElementById("finalFloor");
const finalScoreElement = document.getElementById("finalScore");
const nextFloorElement = document.getElementById("nextFloor");
const currentScoreElement = document.getElementById("currentScore");
const homeCharacter = document.getElementById("homeCharacter");
const homeMonster = document.getElementById("homeMonster");
const miniMap = document.getElementById("miniMap");
const miniMapContent = document.getElementById("miniMapContent");
const powerupIndicator = document.getElementById("powerupIndicator");
const powerupName = document.getElementById("powerupName");
const powerupProgress = document.getElementById("powerupProgress");
const notification = document.getElementById("notification");
const particleContainer = document.getElementById("particleContainer");

// Character SVG
const characterSVG = `
  <svg viewBox="0 0 50 50" width="100%" height="100%">
    <defs>
      <radialGradient id="playerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="#4a86e8" />
        <stop offset="100%" stop-color="#1c4587" />
      </radialGradient>
      <radialGradient id="flameGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="#ffcc00" />
        <stop offset="100%" stop-color="#ff6600" />
      </radialGradient>
    </defs>
    <!-- Body -->
    <circle cx="25" cy="30" r="10" fill="url(#playerGradient)" />
    <!-- Head -->
    <circle cx="25" cy="15" r="7" fill="url(#playerGradient)" />
    <!-- Lantern -->
    <rect x="35" y="25" width="4" height="10" fill="#8B4513" />
    <circle cx="37" cy="22" r="5" fill="url(#flameGradient)" opacity="0.8">
      <animate attributeName="r" values="5;6;5" dur="1s" repeatCount="indefinite" />
    </circle>
    <!-- Glowing effect -->
    <circle cx="37" cy="22" r="10" fill="url(#flameGradient)" opacity="0.2" />
  </svg>
`;

// Monster SVG
const monsterSVG = `
  <svg viewBox="0 0 50 50" width="100%" height="100%">
    <defs>
      <radialGradient id="monsterGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="#4d4d4d" />
        <stop offset="100%" stop-color="#1a1a1a" />
      </radialGradient>
    </defs>
    <!-- Shadow form -->
    <path d="M15,20 Q25,35 35,20 Q40,30 35,40 Q25,45 15,40 Q10,30 15,20" 
          fill="url(#monsterGradient)" opacity="0.9">
      <animate attributeName="opacity" values="0.9;0.7;0.9" dur="2s" repeatCount="indefinite" />
    </path>
    <!-- Glowing eyes -->
    <circle cx="20" cy="25" r="3" fill="#ff5555">
      <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="30" cy="25" r="3" fill="#ff5555">
      <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite" />
    </circle>
  </svg>
`;

// Power-up types
const powerupTypes = [
  {
    name: "Speed Boost",
    color: "#ffd700",
    effect: () => {
      state.playerSpeed = 2;
      showNotification("Speed Boost activated!");
    },
    end: () => {
      state.playerSpeed = 1;
    },
  },
  {
    name: "Invisibility",
    color: "#00ffff",
    effect: () => {
      state.playerInvisible = true;
      state.playerElement.style.opacity = "0.5";
      showNotification("Invisibility activated!");
    },
    end: () => {
      state.playerInvisible = false;
      state.playerElement.style.opacity = "1";
    },
  },
  {
    name: "Expanded Vision",
    color: "#9966ff",
    effect: () => {
      state.originalVisibilityRadius = state.visibilityRadius;
      state.visibilityRadius += 2;
      showNotification("Expanded Vision activated!");
      updateFogOfWar();
    },
    end: () => {
      state.visibilityRadius = state.originalVisibilityRadius;
      updateFogOfWar();
    },
  },
  {
    name: "Monster Slow",
    color: "#ff9900",
    effect: () => {
      state.originalMonsterSpeed = state.monsterSpeed;
      state.monsterSpeed *= 0.5;
      showNotification("Monster Slowed!");
    },
    end: () => {
      state.monsterSpeed = state.originalMonsterSpeed;
    },
  },
];

// Create particles for home screen
function createParticles() {
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = Math.random() * 3 + 1 + "px";
    particle.style.height = particle.style.width;
    particle.style.backgroundColor = `rgba(${Math.random() * 100 + 100}, ${
      Math.random() * 100 + 100
    }, ${Math.random() * 255}, ${Math.random() * 0.5 + 0.3})`;
    particle.style.borderRadius = "50%";

    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    particle.style.left = x + "px";
    particle.style.top = y + "px";

    const speed = Math.random() * 1 + 0.5;
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    state.particles.push({
      element: particle,
      x,
      y,
      vx,
      vy,
    });

    particleContainer.appendChild(particle);
  }
}

// Animate particles
function animateParticles() {
  for (const particle of state.particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Wrap around screen
    if (particle.x < 0) particle.x = window.innerWidth;
    if (particle.x > window.innerWidth) particle.x = 0;
    if (particle.y < 0) particle.y = window.innerHeight;
    if (particle.y > window.innerHeight) particle.y = 0;

    particle.element.style.left = particle.x + "px";
    particle.element.style.top = particle.y + "px";
  }

  if (!state.gameStarted) {
    requestAnimationFrame(animateParticles);
  }

}

// Animate home screen characters
function animateHomeScreen() {
  const time = Date.now() * 0.001;

  // Move character along a path
  const characterX = 15 + Math.sin(time) * 10;
  const characterY = 15 + Math.cos(time * 0.7) * 10;
  homeCharacter.setAttribute("cx", characterX);
  homeCharacter.setAttribute("cy", characterY);

  // Move monster to chase character with delay
  const monsterX = 85 - Math.sin(time - 1) * 10;
  const monsterY = 85 - Math.cos(time * 0.7 - 1) * 10;
  homeMonster.setAttribute("cx", monsterX);
  homeMonster.setAttribute("cy", monsterY);

  if (!state.gameStarted) {
    requestAnimationFrame(animateHomeScreen);
  }
}

// Create particles and start animations
createParticles();
animateParticles();
animateHomeScreen();

// Show notification
function showNotification(message, duration = 3000) {
  notification.textContent = message;
  notification.style.opacity = 1;

  setTimeout(() => {
    notification.style.opacity = 0;
  }, duration);
}

// Initialize the game
function initGame() {
  state.isMobile = window.innerWidth < 768;
  state.cellSize = calculateCellSize();
  state.playerSpeed = 1;
  resetGame();

  // Event listeners
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("resize", handleResize);

  // Mobile controls - pointer events for both touch and mouse
  const addPointerEvents = (element, key) => {
    // Press event
    const handlePress = () => {
      state.keysPressed[key] = true;
      element.classList.add("active");
    };

    // Release event
    const handleRelease = () => {
      state.keysPressed[key] = false;
      element.classList.remove("active");
    };

    // Add events
    element.addEventListener("pointerdown", handlePress);
    element.addEventListener("pointerup", handleRelease);
    element.addEventListener("pointerleave", handleRelease);
    element.addEventListener("pointercancel", handleRelease);
  };

  // Apply to all direction buttons
  addPointerEvents(document.getElementById("upBtn"), "ArrowUp");
  addPointerEvents(document.getElementById("leftBtn"), "ArrowLeft");
  addPointerEvents(document.getElementById("rightBtn"), "ArrowRight");
  addPointerEvents(document.getElementById("downBtn"), "ArrowDown");

  // Mobile controls
  document
    .getElementById("upBtn")
    .addEventListener("touchstart", () => (state.keysPressed.ArrowUp = true));
  document
    .getElementById("leftBtn")
    .addEventListener("touchstart", () => (state.keysPressed.ArrowLeft = true));
  document
    .getElementById("rightBtn")
    .addEventListener(
      "touchstart",
      () => (state.keysPressed.ArrowRight = true)
    );
  document
    .getElementById("downBtn")
    .addEventListener("touchstart", () => (state.keysPressed.ArrowDown = true));

  document
    .getElementById("upBtn")
    .addEventListener("touchend", () => (state.keysPressed.ArrowUp = false));
  document
    .getElementById("leftBtn")
    .addEventListener("touchend", () => (state.keysPressed.ArrowLeft = false));
  document
    .getElementById("rightBtn")
    .addEventListener("touchend", () => (state.keysPressed.ArrowRight = false));
  document
    .getElementById("downBtn")
    .addEventListener("touchend", () => (state.keysPressed.ArrowDown = false));

  // Map button
  document.getElementById("mapBtn").addEventListener("click", toggleMiniMap);

  // Start game loop
  requestAnimationFrame(gameLoop);
}

// Toggle mini-map
function toggleMiniMap() {
  state.miniMapVisible = !state.miniMapVisible;
  miniMap.style.display = state.miniMapVisible ? "block" : "none";
  updateMiniMap();
}

// Update mini-map
function updateMiniMap() {
  if (!state.miniMapVisible) return;

  miniMapContent.innerHTML = "";
  const cellSize =
    Math.min(miniMap.offsetWidth, miniMap.offsetHeight) / state.mazeSize;

  // Draw maze
  for (let y = 0; y < state.mazeSize; y++) {
    for (let x = 0; x < state.mazeSize; x++) {
      // Only show cells that have been revealed
      if (!state.fogOfWar[y][x]) {
        const cell = document.createElement("div");
        cell.className = `mini-map-cell ${
          state.maze[y][x] === 1 ? "mini-map-wall" : "mini-map-path"
        }`;
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        cell.style.left = `${x * cellSize}px`;
        cell.style.top = `${y * cellSize}px`;
        miniMapContent.appendChild(cell);
      }
    }
  }

  // Draw exit if visible
  if (!state.fogOfWar[state.exitPosition.y][state.exitPosition.x]) {
    const exit = document.createElement("div");
    exit.className = "mini-map-cell mini-map-exit";
    exit.style.width = `${cellSize}px`;
    exit.style.height = `${cellSize}px`;
    exit.style.left = `${state.exitPosition.x * cellSize}px`;
    exit.style.top = `${state.exitPosition.y * cellSize}px`;
    miniMapContent.appendChild(exit);
  }

  // Draw player
  const player = document.createElement("div");
  player.className = "mini-map-cell mini-map-player";
  player.style.width = `${cellSize}px`;
  player.style.height = `${cellSize}px`;
  player.style.left = `${state.playerPosition.x * cellSize}px`;
  player.style.top = `${state.playerPosition.y * cellSize}px`;
  miniMapContent.appendChild(player);

  // Draw monster if visible
  if (!state.fogOfWar[state.monsterPosition.y][state.monsterPosition.x]) {
    const monster = document.createElement("div");
    monster.className = "mini-map-cell mini-map-monster";
    monster.style.width = `${cellSize}px`;
    monster.style.height = `${cellSize}px`;
    monster.style.left = `${state.monsterPosition.x * cellSize}px`;
    monster.style.top = `${state.monsterPosition.y * cellSize}px`;
    miniMapContent.appendChild(monster);
  }
}

// Calculate cell size based on screen dimensions
function calculateCellSize() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const minDimension = Math.min(screenWidth, screenHeight);
  return Math.floor(minDimension / (state.mazeSize + 2));
}

// Handle window resize
function handleResize() {
  state.cellSize = calculateCellSize();
  state.isMobile = window.innerWidth < 768;
  renderMaze();
  if (state.miniMapVisible) {
    updateMiniMap();
  }
}

// Reset game state for a new game or level
function resetGame(nextFloor = false) {
  if (!nextFloor) {
    state.currentFloor = 1;
    state.monsterSpeed = 0.2;
    state.score = 0;
  } else {
    state.currentFloor++;
    state.monsterSpeed = Math.min(0.5 + state.currentFloor * 0.03, 0.95);
    state.score += state.currentFloor * 100;
  }

  state.gameOver = false;
  state.paused = false;
  state.lastMoveTime = 0;
  state.levelTransitioning = false;

  // Update UI
  floorLevelElement.textContent = state.currentFloor;
  scoreValueElement.textContent = state.score;

  // Clear active powerup
  if (state.activePowerup) {
    state.activePowerup.end();
    state.activePowerup = null;
    powerupIndicator.classList.add("hidden");
  }

  // Generate new maze with size based on floor
  state.mazeSize = Math.min(15 + Math.floor(state.currentFloor / 3), 25);
  state.cellSize = calculateCellSize();
  generateMaze();

  // Place player at start
  // Make sure player is not on the exit
  let playerPlaced = false;
  while (!playerPlaced) {
    const px = 1;
    const py = 1;
    if (state.exitPosition.x !== px || state.exitPosition.y !== py) {
      state.playerPosition = { x: px, y: py };
      playerPlaced = true;
    } else {
      // Regenerate exit if it landed on player spot
      placeExit();
    }
  }


  // Place monster far from player
  placeMonster();

  // Place exit
  placeExit();

  // Place traps
  placeTraps();

  // Place powerups
  placePowerups();

  // Initialize fog of war
  initFogOfWar();

  // Render maze
  renderMaze();

  // Update mini-map if visible
  if (state.miniMapVisible) {
    updateMiniMap();
  }

  // Start monster after delay
  state.monsterActive = false;
  setTimeout(() => {
    state.monsterActive = true;
    showNotification("The monster is now active!", 2000);
  }, 3000);
}

// Generate maze using recursive backtracking
function generateMaze() {
  const size = state.mazeSize;
  state.maze = Array(size)
    .fill()
    .map(() => Array(size).fill(1));

  // Start with all walls
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      state.maze[y][x] = 1;
    }
  }

  // Carve paths
  carvePassagesFrom(1, 1);

  // Ensure start and end are open
  state.maze[1][1] = 0;
  state.maze[size - 2][size - 2] = 0;

  // Add some random paths to make maze less linear
  const extraPaths = Math.floor(size * size * 0.05); // 5% of cells
  for (let i = 0; i < extraPaths; i++) {
    const x = Math.floor(Math.random() * (size - 2)) + 1;
    const y = Math.floor(Math.random() * (size - 2)) + 1;
    if (state.maze[y][x] === 1) {
      // Check if it would create a 2x2 open area (avoid this)
      let adjacentOpenCount = 0;
      if (x > 0 && state.maze[y][x - 1] === 0) adjacentOpenCount++;
      if (x < size - 1 && state.maze[y][x + 1] === 0) adjacentOpenCount++;
      if (y > 0 && state.maze[y - 1][x] === 0) adjacentOpenCount++;
      if (y < size - 1 && state.maze[y + 1][x] === 0) adjacentOpenCount++;

      if (adjacentOpenCount <= 2) {
        state.maze[y][x] = 0;
      }
    }
  }
}

// Recursive backtracking algorithm to generate maze
function carvePassagesFrom(x, y) {
  const directions = [
    [0, -2], // North
    [2, 0], // East
    [0, 2], // South
    [-2, 0], // West
  ];

  // Shuffle directions
  directions.sort(() => Math.random() - 0.5);

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (
      nx > 0 &&
      nx < state.mazeSize - 1 &&
      ny > 0 &&
      ny < state.mazeSize - 1 &&
      state.maze[ny][nx] === 1
    ) {
      // Carve passage
      state.maze[y + dy / 2][x + dx / 2] = 0;
      state.maze[ny][nx] = 0;
      carvePassagesFrom(nx, ny);
    }
  }
}

// Place monster far from player
function placeMonster() {
  const size = state.mazeSize;
  let placed = false;

  while (!placed) {
    const x = Math.floor(Math.random() * (size - 2)) + 1;
    const y = Math.floor(Math.random() * (size - 2)) + 1;

    // Check if it's a valid path and far from player
    if (state.maze[y][x] === 0) {
      const distance =
        Math.abs(x - state.playerPosition.x) +
        Math.abs(y - state.playerPosition.y);
      if (distance > size / 2) {
        state.monsterPosition = { x, y };
        placed = true;
      }
    }
  }
}

// Place exit
function placeExit() {
  const size = state.mazeSize;
  // Try to place exit far from start
  let bestDistance = 0;
  let bestPosition = { x: size - 2, y: size - 2 };

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (state.maze[y][x] === 0) {
        const distance = Math.abs(x - 1) + Math.abs(y - 1); // Distance from start
        if (distance > bestDistance) {
          bestDistance = distance;
          bestPosition = { x, y };
        }
      }
    }
  }

  state.exitPosition = bestPosition;
}

// Place traps
function placeTraps() {
  const size = state.mazeSize;
  const numTraps =
    Math.floor(size * size * 0.05) + Math.floor(state.currentFloor / 2); // More traps on higher floors
  state.traps = [];

  for (let i = 0; i < numTraps; i++) {
    let placed = false;

    while (!placed) {
      const x = Math.floor(Math.random() * (size - 2)) + 1;
      const y = Math.floor(Math.random() * (size - 2)) + 1;

      // Check if it's a valid path and not player, monster, or exit
      if (
        state.maze[y][x] === 0 &&
        !(x === state.playerPosition.x && y === state.playerPosition.y) &&
        !(x === state.monsterPosition.x && y === state.monsterPosition.y) &&
        !(x === state.exitPosition.x && y === state.exitPosition.y) &&
        !state.traps.some((trap) => trap.x === x && trap.y === y)
      ) {
        state.traps.push({ x, y });
        placed = true;
      }
    }
  }
}

// Place powerups
function placePowerups() {
  const size = state.mazeSize;
  const numPowerups = Math.min(2 + Math.floor(state.currentFloor / 3), 5); // More powerups on higher floors, max 5
  state.powerups = [];

  for (let i = 0; i < numPowerups; i++) {
    let placed = false;

    while (!placed) {
      const x = Math.floor(Math.random() * (size - 2)) + 1;
      const y = Math.floor(Math.random() * (size - 2)) + 1;

      // Check if it's a valid path and not player, monster, exit, trap, or another powerup
      if (
        state.maze[y][x] === 0 &&
        !(x === state.playerPosition.x && y === state.playerPosition.y) &&
        !(x === state.monsterPosition.x && y === state.monsterPosition.y) &&
        !(x === state.exitPosition.x && y === state.exitPosition.y) &&
        !state.traps.some((trap) => trap.x === x && trap.y === y) &&
        !state.powerups.some((powerup) => powerup.x === x && powerup.y === y)
      ) {
        // Random powerup type
        const type =
          powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        state.powerups.push({ x, y, type });
        placed = true;
      }
    }
  }
}

// Initialize fog of war
function initFogOfWar() {
  const size = state.mazeSize;
  state.fogOfWar = Array(size)
    .fill()
    .map(() => Array(size).fill(true));
  updateFogOfWar();
}

// Update fog of war based on player position
function updateFogOfWar() {
  const { x, y } = state.playerPosition;
  const radius = state.visibilityRadius;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < state.mazeSize && ny >= 0 && ny < state.mazeSize) {
        // Check if cell is within visibility radius (using Manhattan distance)
        if (Math.abs(dx) + Math.abs(dy) <= radius) {
          state.fogOfWar[ny][nx] = false;
        }
      }
    }
  }
}

// Render the maze
function renderMaze() {
  mazeElement.innerHTML = "";
  mazeElement.style.width = `${state.mazeSize * state.cellSize}px`;
  mazeElement.style.height = `${state.mazeSize * state.cellSize}px`;

  // Center the maze
  const offsetX = (window.innerWidth - state.mazeSize * state.cellSize) / 2;
  const offsetY = (window.innerHeight - state.mazeSize * state.cellSize) / 2;
  //mazeElement.style.left = `${offsetX}px`;
  mazeElement.style.top = `${offsetY}px`;

  // Render cells
  for (let y = 0; y < state.mazeSize; y++) {
    for (let x = 0; x < state.mazeSize; x++) {
      const cell = document.createElement("div");
      cell.className = state.maze[y][x] === 1 ? "cell wall" : "cell path";
      cell.style.width = `${state.cellSize}px`;
      cell.style.height = `${state.cellSize}px`;
      cell.style.left = `${x * state.cellSize}px`;
      cell.style.top = `${y * state.cellSize}px`;
      mazeElement.appendChild(cell);

      // Add fog of war
      if (state.fogOfWar[y][x]) {
        const fog = document.createElement("div");
        fog.className = "fog";
        fog.style.width = `${state.cellSize}px`;
        fog.style.height = `${state.cellSize}px`;
        fog.style.left = `${x * state.cellSize}px`;
        fog.style.top = `${y * state.cellSize}px`;
        mazeElement.appendChild(fog);
      }
    }
  }

  // Render exit
  const exit = document.createElement("div");
  exit.className = "exit";
  exit.style.width = `${state.cellSize}px`;
  exit.style.height = `${state.cellSize}px`;
  exit.style.left = `${state.exitPosition.x * state.cellSize}px`;
  exit.style.top = `${state.exitPosition.y * state.cellSize}px`;
  mazeElement.appendChild(exit);

  // Render traps
  state.traps.forEach((trap) => {
    const trapElement = document.createElement("div");
    trapElement.className = "trap";
    trapElement.style.width = `${state.cellSize}px`;
    trapElement.style.height = `${state.cellSize}px`;
    trapElement.style.left = `${trap.x * state.cellSize}px`;
    trapElement.style.top = `${trap.y * state.cellSize}px`;
    mazeElement.appendChild(trapElement);
  });

  // Render powerups
  state.powerups.forEach((powerup) => {
    const powerupElement = document.createElement("div");
    powerupElement.className = "powerup";
    powerupElement.style.width = `${state.cellSize}px`;
    powerupElement.style.height = `${state.cellSize}px`;
    powerupElement.style.left = `${powerup.x * state.cellSize}px`;
    powerupElement.style.top = `${powerup.y * state.cellSize}px`;
    powerupElement.style.background = `radial-gradient(circle, ${powerup.type.color} 0%, rgba(0,0,0,0) 70%)`;
    mazeElement.appendChild(powerupElement);
  });

  // Render player
  const player = document.createElement("div");
  player.className = "player";
  player.style.width = `${state.cellSize}px`;
  player.style.height = `${state.cellSize}px`;
  player.style.left = `${state.playerPosition.x * state.cellSize}px`;
  player.style.top = `${state.playerPosition.y * state.cellSize}px`;
  player.innerHTML = characterSVG;
  mazeElement.appendChild(player);
  state.playerElement = player;

  // Render monster
  const monster = document.createElement("div");
  monster.className = "monster";
  monster.style.width = `${state.cellSize}px`;
  monster.style.height = `${state.cellSize}px`;
  monster.style.left = `${state.monsterPosition.x * state.cellSize}px`;
  monster.style.top = `${state.monsterPosition.y * state.cellSize}px`;
  monster.innerHTML = monsterSVG;
  mazeElement.appendChild(monster);
  state.monsterElement = monster;
}

// Update player position
function updatePlayerPosition(dx, dy) {
  if (state.gameOver || state.paused) return;

  const newX = state.playerPosition.x + dx;
  const newY = state.playerPosition.y + dy;

  // Check if new position is valid
  if (
    newX >= 0 &&
    newX < state.mazeSize &&
    newY >= 0 &&
    newY < state.mazeSize &&
    state.maze[newY][newX] === 0
  ) {
    state.playerPosition.x = newX;
    state.playerPosition.y = newY;

    // Update player element position
    state.playerElement.style.left = `${newX * state.cellSize}px`;
    state.playerElement.style.top = `${newY * state.cellSize}px`;

    // Update fog of war
    updateFogOfWar();

    // Check for collisions
    checkCollisions();

    // Update mini-map if visible
    if (state.miniMapVisible) {
      updateMiniMap();
    }
  }
}

// Update monster position
function updateMonsterPosition() {
  if (!state.monsterActive || state.gameOver || state.paused) return;

  // If player is invisible, monster moves randomly
  if (state.playerInvisible) {
    moveMonsterRandomly();
    return;
  }

  // Simple A* pathfinding towards player
  const path = findPathToPlayer();
  if (path && path.length > 1) {
    const nextStep = path[1]; // path[0] is current position

    state.monsterPosition.x = nextStep.x;
    state.monsterPosition.y = nextStep.y;

    // Update monster element position
    state.monsterElement.style.left = `${nextStep.x * state.cellSize}px`;
    state.monsterElement.style.top = `${nextStep.y * state.cellSize}px`;

    // Check for collisions
    checkCollisions();

    // Update mini-map if visible
    if (state.miniMapVisible) {
      updateMiniMap();
    }
  }
}

// Move monster randomly
function moveMonsterRandomly() {
  const { x: startX, y: startY } = state.monsterPosition;

  const directions = [
    [0, -1], // North
    [1, 0], // East
    [0, 1], // South
    [-1, 0], // West
  ].filter(([dx, dy]) => {
    const nx = startX + dx;
    const ny = startY + dy;
    return (
      nx >= 0 &&
      nx < state.mazeSize &&
      ny >= 0 &&
      ny < state.mazeSize &&
      state.maze[ny][nx] === 0
    );
  });

  if (directions.length > 0) {
    const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
    state.monsterPosition.x = startX + dx;
    state.monsterPosition.y = startY + dy;

    // Update monster element position
    state.monsterElement.style.left = `${
      state.monsterPosition.x * state.cellSize
    }px`;
    state.monsterElement.style.top = `${
      state.monsterPosition.y * state.cellSize
    }px`;

    // Check for collisions
    checkCollisions();
  }
}

// Simple A* pathfinding
function findPathToPlayer() {
  const { x: targetX, y: targetY } = state.playerPosition;
  const { x: startX, y: startY } = state.monsterPosition;

  // If player is in fog, monster can't see them
  if (state.fogOfWar[targetY][targetX]) {
    // Random movement
    const directions = [
      [0, -1], // North
      [1, 0], // East
      [0, 1], // South
      [-1, 0], // West
    ].filter(([dx, dy]) => {
      const nx = startX + dx;
      const ny = startY + dy;
      return (
        nx >= 0 &&
        nx < state.mazeSize &&
        ny >= 0 &&
        ny < state.mazeSize &&
        state.maze[ny][nx] === 0
      );
    });

    if (directions.length > 0) {
      const [dx, dy] =
        directions[Math.floor(Math.random() * directions.length)];
      return [
        { x: startX, y: startY },
        { x: startX + dx, y: startY + dy },
      ];
    }
    return null;
  }

  // If player is visible, use A* to find path
  const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
  const closedSet = new Set();

  while (openSet.length > 0) {
    // Find node with lowest f score
    let current = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[current].f) {
        current = i;
      }
    }

    const currentNode = openSet[current];

    // Check if we reached the target
    if (currentNode.x === targetX && currentNode.y === targetY) {
      // Reconstruct path
      const path = [];
      let node = currentNode;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    // Move current node from open to closed set
    openSet.splice(current, 1);
    closedSet.add(`${currentNode.x},${currentNode.y}`);

    // Check neighbors
    const directions = [
      [0, -1], // North
      [1, 0], // East
      [0, 1], // South
      [-1, 0], // West
    ];

    for (const [dx, dy] of directions) {
      const nx = currentNode.x + dx;
      const ny = currentNode.y + dy;

      // Skip if out of bounds or wall
      if (
        nx < 0 ||
        nx >= state.mazeSize ||
        ny < 0 ||
        ny >= state.mazeSize ||
        state.maze[ny][nx] === 1
      ) {
        continue;
      }

      // Skip if in closed set
      if (closedSet.has(`${nx},${ny}`)) {
        continue;
      }

      // Calculate g, h, and f scores
      const g = currentNode.g + 1;
      const h = Math.abs(nx - targetX) + Math.abs(ny - targetY);
      const f = g + h;

      // Check if already in open set with better score
      const existingIndex = openSet.findIndex(
        (node) => node.x === nx && node.y === ny
      );
      if (existingIndex !== -1 && openSet[existingIndex].g <= g) {
        continue;
      }

      // Add to open set
      if (existingIndex === -1) {
        openSet.push({ x: nx, y: ny, g, h, f, parent: currentNode });
      } else {
        openSet[existingIndex].g = g;
        openSet[existingIndex].f = f;
        openSet[existingIndex].parent = currentNode;
      }
    }
  }

  return null; // No path found
}

// Check for collisions
function checkCollisions() {
  const { x, y } = state.playerPosition;

  // Check for monster collision
  if (x === state.monsterPosition.x && y === state.monsterPosition.y) {
    gameOver();
    return;
  }
  
  if (
  x === state.exitPosition.x &&
  y === state.exitPosition.y &&
  !state.levelTransitioning
) {
  state.levelTransitioning = true;
  levelComplete();
  return;
}

  // Check for trap collision
  const trapIndex = state.traps.findIndex(
    (trap) => trap.x === x && trap.y === y
  );
  if (trapIndex !== -1) {
    // Shake the screen
    gameContainer.classList.add("shake");
    setTimeout(() => {
      gameContainer.classList.remove("shake");
    }, 500);

    // Monster gets closer
    state.monsterActive = true;
    showNotification("Trap triggered! The monster knows your location!", 2000);

    // Remove the trap
    state.traps.splice(trapIndex, 1);
    renderMaze();

    // Add score
    state.score += 10;
    scoreValueElement.textContent = state.score;
  }

  // Check for powerup collision
  const powerupIndex = state.powerups.findIndex(
    (powerup) => powerup.x === x && powerup.y === y
  );
  if (powerupIndex !== -1) {
    const powerup = state.powerups[powerupIndex];

    // Apply powerup effect
    if (state.activePowerup) {
      state.activePowerup.end();
    }

    state.activePowerup = powerup.type;
    state.activePowerup.effect();
    state.powerupTimer = state.powerupDuration;

    // Update UI
    powerupName.textContent = powerup.type.name;
    powerupIndicator.classList.remove("hidden");
    document.getElementById("powerupIcon").style.backgroundColor =
      powerup.type.color;

    // Remove the powerup
    state.powerups.splice(powerupIndex, 1);
    renderMaze();

    // Add score
    state.score += 25;
    scoreValueElement.textContent = state.score;
  }
}

// Game over
function gameOver() {
  state.gameOver = true;
  finalFloorElement.textContent = state.currentFloor;
  finalScoreElement.textContent = state.score;
  gameOverScreen.style.display = "flex";

  // Flash the screen red
  gameContainer.classList.add("flash");
  setTimeout(() => {
    gameContainer.classList.remove("flash");
  }, 500);
}

// Level complete
function levelComplete() {
  nextFloorElement.textContent = state.currentFloor + 1;
  currentScoreElement.textContent = state.score;
  levelCompleteScreen.style.display = "flex";

  setTimeout(() => {
    levelCompleteScreen.style.display = "none";
    resetGame(true);
  }, 2000);
}

// Handle key down
function handleKeyDown(e) {
  if (state.paused) return;

  // Arrow keys for movement
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    state.keysPressed.ArrowUp = true;
  } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
    state.keysPressed.ArrowDown = true;
  } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    state.keysPressed.ArrowLeft = true;
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    state.keysPressed.ArrowRight = true;
  }

  // Toggle mini-map with 'M' key
  if (e.key === "m" || e.key === "M") {
    toggleMiniMap();
  }

  // Pause with 'P' key or Escape
  if (e.key === "p" || e.key === "P" || e.key === "Escape") {
    togglePause();
  }
}

// Handle key up for desktop controls
function handleKeyUp(e) {
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    state.keysPressed.ArrowUp = false;
  } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
    state.keysPressed.ArrowDown = false;
  } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    state.keysPressed.ArrowLeft = false;
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    state.keysPressed.ArrowRight = false;
  }
}

// Toggle pause
function togglePause() {
  state.paused = !state.paused;
  pauseScreen.style.display = state.paused ? "flex" : "none";
}

// Update powerup timer
function updatePowerupTimer(deltaTime) {
  if (state.activePowerup) {
    state.powerupTimer -= deltaTime;

    // Update progress bar
    const progress = Math.max(
      0,
      (state.powerupTimer / state.powerupDuration) * 100
    );
    powerupProgress.style.width = `${progress}%`;

    // End powerup if timer expired
    if (state.powerupTimer <= 0) {
      state.activePowerup.end();
      state.activePowerup = null;
      powerupIndicator.classList.add("hidden");
    }
  }
}

// Game loop
function gameLoop(timestamp) {
  // Calculate delta time
  const deltaTime = timestamp - state.lastUpdate;
  state.lastUpdate = timestamp;

  if (!state.paused && !state.gameOver) {
    // Update powerup timer
    updatePowerupTimer(deltaTime);

    // Update player position based on keys pressed
    if (deltaTime > 0) {
      const moveInterval = 150 / (state.playerSpeed || 1); // ms between moves

      if (timestamp - state.lastMoveTime > moveInterval) {
        if (state.keysPressed.ArrowUp) {
          updatePlayerPosition(0, -1);
          state.lastMoveTime = timestamp;
        } else if (state.keysPressed.ArrowDown) {
          updatePlayerPosition(0, 1);
          state.lastMoveTime = timestamp;
        } else if (state.keysPressed.ArrowLeft) {
          updatePlayerPosition(-1, 0);
          state.lastMoveTime = timestamp;
        } else if (state.keysPressed.ArrowRight) {
          updatePlayerPosition(1, 0);
          state.lastMoveTime = timestamp;
        }
      }

      // Update monster position less frequently
      state.monsterUpdateCounter += deltaTime;
      if (state.monsterUpdateCounter > moveInterval / state.monsterSpeed) {
        updateMonsterPosition();
        state.monsterUpdateCounter = 0;
      }

      // Update fog of war rendering
      for (let y = 0; y < state.mazeSize; y++) {
        for (let x = 0; x < state.mazeSize; x++) {
          const fogElements = document.querySelectorAll(".fog");
          const index = y * state.mazeSize + x;

          if (index < fogElements.length) {
            if (state.fogOfWar[y][x]) {
              fogElements[index].style.display = "block";
            } else {
              fogElements[index].style.display = "none";
            }
          }
        }
      }
    }
  }

  requestAnimationFrame(gameLoop);
}

// Event listeners
document.getElementById("startBtn").addEventListener("click", () => {
  homeScreen.style.opacity = 0;
  setTimeout(() => {
    homeScreen.style.display = "none";
    gameContainer.classList.remove("hidden");
    state.gameStarted = true;
    state.lastMoveTime = 0;
    initGame();
  }, 1000);
});

document.getElementById("howToPlayBtn").addEventListener("click", () => {
  homeScreen.style.display = "none";
  howToPlayScreen.style.display = "flex";
});

document.getElementById("backBtn").addEventListener("click", () => {
  howToPlayScreen.style.display = "none";
  homeScreen.style.display = "flex";
});

document.getElementById("restartBtn").addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  resetGame();
});

document.getElementById("menuBtn").addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  gameContainer.classList.add("hidden");
  homeScreen.style.display = "flex";
  homeScreen.style.opacity = 1;
  state.gameStarted = false;
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  togglePause();
});

document.getElementById("resumeBtn").addEventListener("click", () => {
  togglePause();
});

document.getElementById("restartFromPauseBtn").addEventListener("click", () => {
  pauseScreen.style.display = "none";
  state.paused = false;
  resetGame();
});

document.getElementById("quitBtn").addEventListener("click", () => {
  pauseScreen.style.display = "none";
  gameContainer.classList.add("hidden");
  homeScreen.style.display = "flex";
  homeScreen.style.opacity = 1;
  state.gameStarted = false;
  state.paused = false;
});

(function () {
  function c() {
    var b = a.contentDocument || a.contentWindow.document;
    if (b) {
      var d = b.createElement("script");
      d.innerHTML =
        "window.__CF$cv$params={r:'94d5712ed0a2fec0',t:'MTc0OTUyMjU3OC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
      b.getElementsByTagName("head")[0].appendChild(d);
    }
  }
  if (document.body) {
    var a = document.createElement("iframe");
    a.height = 1;
    a.width = 1;
    a.style.position = "absolute";
    a.style.top = 0;
    a.style.left = 0;
    a.style.border = "none";
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    if ("loading" !== document.readyState) c();
    else if (window.addEventListener)
      document.addEventListener("DOMContentLoaded", c);
    else {
      var e = document.onreadystatechange || function () {};
      document.onreadystatechange = function (b) {
        e(b);
        "loading" !== document.readyState &&
          ((document.onreadystatechange = e), c());
      };
    }
  }
})();
