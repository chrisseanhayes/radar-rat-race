import './style.css';

// --- AUDIO SYSTEM ---
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    playMusicLoop();
  }
}

let audioEnabled = true;

function playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
  if (!audioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const NOTE_FREQS: Record<string, number> = {
  'D5': 587.33, 'C#5': 554.37, 'C5': 523.25, 'B4': 493.88, 'A#4': 466.16, 'A4': 440.00, 'G#4': 415.30, 
  'G4': 392.00, 'F#4': 369.99, 'F4': 349.23, 'E4': 329.63, 'D#4': 311.13, 
  'D4': 293.66, 'C#4': 277.18, 'C4': 261.63
};
const NOTE_NAMES = Object.keys(NOTE_FREQS);
let musicData: (string | null)[] = Array(96).fill(null);
function fillNote(start: number, len: number, note: string) {
  musicData[start] = note;
  for (let i = 1; i < len - 1; i++) musicData[start + i] = "~" + note;
}

const savedMusic = localStorage.getItem('radarRatRaceMusic');
if (savedMusic) {
  try {
    musicData = JSON.parse(savedMusic);
  } catch(e) {
    console.error("Failed to parse saved music", e);
  }
}

if (!savedMusic) {
  // Bar 1 & 2
  fillNote(0, 6, 'E4'); fillNote(6, 6, 'D4'); 
  fillNote(12, 12, 'C4');
  // Bar 3 & 4
  fillNote(24, 6, 'E4'); fillNote(30, 6, 'D4'); 
  fillNote(36, 12, 'C4');
  // Bar 5 & 6 (See how they run)
  fillNote(48, 4, 'G4'); fillNote(52, 2, 'F4'); fillNote(54, 2, 'F4'); fillNote(56, 4, 'E4');
  fillNote(60, 4, 'G4'); fillNote(64, 2, 'F4'); fillNote(66, 2, 'F4'); fillNote(68, 4, 'E4');
  // Bar 7 (They all ran af-ter the)
  fillNote(72, 2, 'G4'); fillNote(74, 2, 'C5'); fillNote(76, 2, 'C5'); 
  fillNote(78, 2, 'C5'); fillNote(80, 2, 'B4'); fillNote(82, 2, 'C5');
  // Bar 8 (far-mer's wife)
  fillNote(84, 4, 'D5'); fillNote(88, 2, 'B4'); fillNote(90, 6, 'G4');
}

let tempoBPM = 166;
const savedTempo = localStorage.getItem('radarRatRaceTempo');
if (savedTempo) {
  tempoBPM = parseInt(savedTempo);
}
let sixteenthNoteTime = Math.floor(60000 / (4 * tempoBPM));

let musicTimeout: number;
let currentStep = 0;
let editorPlaying = false;

function playMusicLoop() {
  if (!audioEnabled || (gameState !== 'PLAYING' && !editorPlaying)) {
    musicTimeout = window.setTimeout(playMusicLoop, sixteenthNoteTime);
    return;
  }
  
  const val = musicData[currentStep];
  if (val && !val.startsWith('~')) {
    const pitch = val;
    let holdSteps = 1;
    for (let i = currentStep + 1; i < musicData.length; i++) {
      if (musicData[i] === "~" + pitch) holdSteps++;
      else break;
    }
    
    const freq = NOTE_FREQS[pitch];
    const durationMs = holdSteps * sixteenthNoteTime;
    playTone(freq, 'square', (durationMs / 1000) * 0.9, 0.05); 
  }
  
  if (editorPlaying) {
    updatePlayheadUI(currentStep);
  }

  currentStep = (currentStep + 1) % musicData.length;
  musicTimeout = window.setTimeout(playMusicLoop, sixteenthNoteTime);
}

function playEatSound() { playTone(880, 'sine', 0.1, 0.1); }
function playStarSound() { playTone(150, 'sawtooth', 0.5, 0.2); }
function playGameOverSound() { playTone(100, 'sawtooth', 1.0, 0.3); }
function playVictorySound() { 
  playTone(440, 'square', 0.2); 
  setTimeout(() => playTone(554, 'square', 0.2), 200);
  setTimeout(() => playTone(659, 'square', 0.4), 400);
}

// --- CONFIG & CONSTANTS ---
const TILE_SIZE = 50; 
const MAZE_WIDTH = 37; 
const MAZE_HEIGHT = 27;
let gameState: 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY' = 'START';
let gameTime = 99;
let gameTimerAccumulator = 0;

// 17 is a 2-lane path, 11 is a 1-lane path
const START_X = 17; 
const START_Y = 11; 
let currentRatSpeed = 120; // Lower starting speed
let uncollectedCount = 15;

let map: number[][] = [];
function generateMaze() {
  map = [];
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (x === 0 || x === MAZE_WIDTH - 1 || y === 0 || y === MAZE_HEIGHT - 1) {
        row.push(1); // 1-thick Outer bounds
      } else {
        row.push(0); // initialize all to paths
      }
    }
    map.push(row);
  }

  const xIntervals = [
    {start: 2, end: 5},
    {start: 8, end: 10},
    {start: 12, end: 16},
    {start: 19, end: 22},
    {start: 24, end: 26},
    {start: 29, end: 34}
  ];
  
  const yIntervals = [
    {start: 2, end: 4},
    {start: 7, end: 10},
    {start: 12, end: 14},
    {start: 17, end: 20},
    {start: 22, end: 24}
  ];

  interface Block { x: number, y: number, w: number, h: number, merged: boolean }
  const gridBlocks: Block[][] = [];
  
  for (let r = 0; r < yIntervals.length; r++) {
    const row: Block[] = [];
    for (let c = 0; c < xIntervals.length; c++) {
      row.push({
        x: xIntervals[c].start,
        y: yIntervals[r].start,
        w: xIntervals[c].end - xIntervals[c].start + 1,
        h: yIntervals[r].end - yIntervals[r].start + 1,
        merged: false
      });
    }
    gridBlocks.push(row);
  }

  // Randomly merge blocks (domino style) to create varied rectangles
  for (let r = 0; r < yIntervals.length; r++) {
    for (let c = 0; c < xIntervals.length; c++) {
      const b1 = gridBlocks[r][c];
      if (b1.merged) continue;

      const canMergeRight = c < xIntervals.length - 1 && !gridBlocks[r][c+1].merged;
      const canMergeDown = r < yIntervals.length - 1 && !gridBlocks[r+1][c].merged;

      if (canMergeRight && canMergeDown) {
        if (Math.random() < 0.5) {
          // Merge right
          const b2 = gridBlocks[r][c+1];
          b1.w = (b2.x + b2.w) - b1.x;
          b1.merged = true;
          b2.merged = true;
          b2.w = 0; 
        } else {
          // Merge down
          const b2 = gridBlocks[r+1][c];
          b1.h = (b2.y + b2.h) - b1.y;
          b1.merged = true;
          b2.merged = true;
          b2.h = 0; 
        }
      } else if (canMergeRight && Math.random() < 0.4) {
        const b2 = gridBlocks[r][c+1];
        b1.w = (b2.x + b2.w) - b1.x;
        b1.merged = true;
        b2.merged = true;
        b2.w = 0;
      } else if (canMergeDown && Math.random() < 0.4) {
        const b2 = gridBlocks[r+1][c];
        b1.h = (b2.y + b2.h) - b1.y;
        b1.merged = true;
        b2.merged = true;
        b2.h = 0;
      }
    }
  }

  // Draw blocks to map
  for (let r = 0; r < yIntervals.length; r++) {
    for (let c = 0; c < xIntervals.length; c++) {
      const b = gridBlocks[r][c];
      if (b.w > 0 && b.h > 0) {
        for (let by = b.y; by < b.y + b.h; by++) {
          for (let bx = b.x; bx < b.x + b.w; bx++) {
            map[by][bx] = 1;
          }
        }
      }
    }
  }

  // Ensure starting corridor is perfectly clear for player and rats
  for (let y = START_Y - 2; y <= START_Y + 8; y++) {
    if (y > 0 && y < MAZE_HEIGHT - 1) {
      map[y][START_X] = 0;
      map[y][START_X + 1] = 0;
    }
  }
}

// --- ENTITIES & PARTICLES ---
interface Entity { gridX: number; gridY: number; pixelX: number; pixelY: number; dirX: number; dirY: number; speed: number; }
interface Cheese { x: number; y: number; collected: boolean; }
interface Cat { x: number; y: number; }
interface Rat extends Entity { stunnedTimer: number; }
interface Star { gridX: number; gridY: number; timer: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; }

let cheeseList: Cheese[] = [];
let cats: Cat[] = [];
let rats: Rat[] = [];
let stars: Star[] = [];
let particles: Particle[] = [];

let player = {
  gridX: START_X, gridY: START_Y,
  pixelX: START_X * TILE_SIZE, pixelY: START_Y * TILE_SIZE,
  radius: TILE_SIZE / 3,
  speed: 400, 
  dirX: 0, dirY: -1, 
  queuedDirX: 0, queuedDirY: -1,
  color: '#00F0FF', score: 0, starsLeft: 3
};

function spawnParticles(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 150 + 50;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1.0,
      color
    });
  }
}

function resetGame() {
  generateMaze();
  cheeseList = []; cats = []; rats = []; stars = []; particles = [];
  gameTime = 99;
  uncollectedCount = 15;
  recalculateRatSpeed(); // Initialize speed based on debug controls
  
  player = {
    gridX: START_X, gridY: START_Y, 
    pixelX: START_X * TILE_SIZE, pixelY: START_Y * TILE_SIZE,
    radius: TILE_SIZE / 3, speed: 400, 
    dirX: 0, dirY: -1, 
    queuedDirX: 0, queuedDirY: -1,
    color: '#00F0FF', score: 0, starsLeft: 3
  };
  
  const availableTiles: {x: number, y: number}[] = [];
  for(let y = 2; y < MAZE_HEIGHT - 2; y++) {
    for(let x = 2; x < MAZE_WIDTH - 2; x++) {
      if(map[y][x] === 0) availableTiles.push({x, y});
    }
  }
  
  const farTiles = availableTiles.filter(t => Math.hypot(t.x - START_X, t.y - START_Y) > 8);
  farTiles.sort(() => Math.random() - 0.5);

  // Distribute 15 cheese evenly across a 5x3 grid of sectors
  const sectorW = Math.floor(MAZE_WIDTH / 5);
  const sectorH = Math.floor(MAZE_HEIGHT / 3);
  
  for (let sy = 0; sy < 3; sy++) {
    for (let sx = 0; sx < 5; sx++) {
      const sectorTiles = farTiles.filter(t => 
        t.x >= sx * sectorW && t.x < (sx + 1) * sectorW &&
        t.y >= sy * sectorH && t.y < (sy + 1) * sectorH
      );
      
      if (sectorTiles.length > 0) {
        const t = sectorTiles[Math.floor(Math.random() * sectorTiles.length)];
        cheeseList.push({x: t.x, y: t.y, collected: false});
        // Remove from farTiles so we don't double pick it later
        const idx = farTiles.findIndex(ft => ft.x === t.x && ft.y === t.y);
        if (idx !== -1) farTiles.splice(idx, 1);
      }
    }
  }

  // If any sector was empty (due to start radius), fill the rest randomly
  while (cheeseList.length < 15 && farTiles.length > 0) {
    const t = farTiles.pop()!;
    cheeseList.push({x: t.x, y: t.y, collected: false});
  }
  
  for (let i = 0; i < 3; i++) {
    if(farTiles.length > 0) {
      const t = farTiles.pop()!;
      cats.push({x: t.x, y: t.y});
    }
  }

  for (let i = 1; i <= 3; i++) {
    const ry = START_Y + (i * 2);
    const rx = START_X + (i % 2); 
    if (ry < MAZE_HEIGHT - 2) {
      rats.push({ 
        gridX: rx, gridY: ry, 
        pixelX: rx * TILE_SIZE, pixelY: ry * TILE_SIZE, 
        dirX: 0, dirY: -1,
        speed: currentRatSpeed,
        stunnedTimer: 0 
      });
    }
  }

  updateUI();
  gameState = 'PLAYING';
  initAudio();
}

// Canvas Setup
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const radarCanvas = document.getElementById('radarCanvas') as HTMLCanvasElement;
const radarCtx = radarCanvas.getContext('2d')!;

// UI Elements
const scoreEl = document.getElementById('score')!;
const timeEl = document.getElementById('time')!;
const starsEl = document.getElementById('stars')!;

// Debug UI Elements
const debugSidebar = document.getElementById('debugSidebar')!;
const debugToggle = document.getElementById('debugToggle')!;
const dbgBaseSpeed = document.getElementById('dbg-base-speed') as HTMLInputElement;
const dbgFreeze = document.getElementById('dbg-freeze') as HTMLInputElement;
const dbgRatSpeed = document.getElementById('dbg-rat-speed')!;
const dbgPlayerSpeed = document.getElementById('dbg-player-speed')!;
const dbgUncollected = document.getElementById('dbg-uncollected')!;
const dbgState = document.getElementById('dbg-state')!;

const musicModal = document.getElementById('musicModal')!;
const openMusicEditor = document.getElementById('openMusicEditor')!;
const closeMusicEditor = document.getElementById('closeMusicEditor')!;
const playEditorBtn = document.getElementById('playEditorBtn')!;
const navLeftBtn = document.getElementById('navLeftBtn')!;
const navRightBtn = document.getElementById('navRightBtn')!;

openMusicEditor.addEventListener('click', () => {
  musicModal.classList.remove('hidden');
  updateBarSelects();
  buildPianoRoll();
  renderMusicData();
});

closeMusicEditor.addEventListener('click', () => {
  musicModal.classList.add('hidden');
  editorPlaying = false;
  playEditorBtn.innerText = '▶ PLAY';
});

playEditorBtn.addEventListener('click', () => {
  initAudio();
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
  editorPlaying = !editorPlaying;
  playEditorBtn.innerText = editorPlaying ? '⏸ PAUSE' : '▶ PLAY';
});

const saveMusicBtn = document.getElementById('saveMusicBtn')!;
const resetMusicBtn = document.getElementById('resetMusicBtn')!;
const tempoSlider = document.getElementById('tempoSlider') as HTMLInputElement;
const tempoDisplay = document.getElementById('tempoDisplay')!;

if (tempoSlider) {
  tempoSlider.value = tempoBPM.toString();
  tempoDisplay.innerText = `${tempoBPM} BPM`;
  tempoSlider.addEventListener('input', () => {
    tempoBPM = parseInt(tempoSlider.value);
    sixteenthNoteTime = Math.floor(60000 / (4 * tempoBPM));
    tempoDisplay.innerText = `${tempoBPM} BPM`;
    localStorage.setItem('radarRatRaceTempo', tempoBPM.toString());
  });
}

navLeftBtn.addEventListener('click', () => {
  document.querySelector('.piano-roll-container')?.scrollBy({ left: -324, behavior: 'smooth' });
});

navRightBtn.addEventListener('click', () => {
  document.querySelector('.piano-roll-container')?.scrollBy({ left: 324, behavior: 'smooth' });
});

saveMusicBtn.addEventListener('click', () => {
  localStorage.setItem('radarRatRaceMusic', JSON.stringify(musicData));
  const oldText = saveMusicBtn.innerText;
  saveMusicBtn.innerText = 'SAVED!';
  setTimeout(() => saveMusicBtn.innerText = oldText, 2000);
});

let barClipboard: (string | null)[] | null = null;
const copyBarBtn = document.getElementById('copyBarBtn')!;
const pasteBarBtn = document.getElementById('pasteBarBtn')!;
const copyBarSelect = document.getElementById('copyBarSelect') as HTMLSelectElement;
const pasteBarSelect = document.getElementById('pasteBarSelect') as HTMLSelectElement;
const addBarBtn = document.getElementById('addBarBtn')!;

function updateBarSelects() {
  const bars = musicData.length / 12;
  const cVal = copyBarSelect.value;
  const pVal = pasteBarSelect.value;
  
  copyBarSelect.innerHTML = '';
  pasteBarSelect.innerHTML = '';
  
  for(let i=0; i<bars; i++) {
    const opt = document.createElement('option');
    opt.value = i.toString();
    opt.innerText = (i+1).toString();
    copyBarSelect.appendChild(opt);
    pasteBarSelect.appendChild(opt.cloneNode(true));
  }
  
  if (cVal && parseInt(cVal) < bars) copyBarSelect.value = cVal;
  if (pVal && parseInt(pVal) < bars) pasteBarSelect.value = pVal;
}

addBarBtn.addEventListener('click', () => {
  for (let i = 0; i < 12; i++) musicData.push(null);
  updateBarSelects();
  buildPianoRoll();
  renderMusicData();
});

copyBarBtn.addEventListener('click', () => {
  const barIdx = parseInt(copyBarSelect.value);
  const startStep = barIdx * 12;
  barClipboard = musicData.slice(startStep, startStep + 12);
  const old = copyBarBtn.innerText;
  copyBarBtn.innerText = 'COPIED!';
  setTimeout(() => copyBarBtn.innerText = old, 1000);
});

pasteBarBtn.addEventListener('click', () => {
  if (!barClipboard) {
    alert("Copy a bar first!");
    return;
  }
  const barIdx = parseInt(pasteBarSelect.value);
  const startStep = barIdx * 12;
  for (let i = 0; i < 12; i++) {
    musicData[startStep + i] = barClipboard[i];
  }
  renderMusicData();
  const old = pasteBarBtn.innerText;
  pasteBarBtn.innerText = 'PASTED!';
  setTimeout(() => pasteBarBtn.innerText = old, 1000);
});

resetMusicBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to erase your work and reset to Three Blind Mice?')) {
    localStorage.removeItem('radarRatRaceMusic');
    musicData = Array(96).fill(null);
    fillNote(0, 6, 'E4'); fillNote(6, 6, 'D4'); 
    fillNote(12, 12, 'C4');
    fillNote(24, 6, 'E4'); fillNote(30, 6, 'D4'); 
    fillNote(36, 12, 'C4');
    fillNote(48, 4, 'G4'); fillNote(52, 2, 'F4'); fillNote(54, 2, 'F4'); fillNote(56, 4, 'E4');
    fillNote(60, 4, 'G4'); fillNote(64, 2, 'F4'); fillNote(66, 2, 'F4'); fillNote(68, 4, 'E4');
    fillNote(72, 2, 'G4'); fillNote(74, 2, 'C5'); fillNote(76, 2, 'C5'); 
    fillNote(78, 2, 'C5'); fillNote(80, 2, 'B4'); fillNote(82, 2, 'C5');
    fillNote(84, 4, 'D5'); fillNote(88, 2, 'B4'); fillNote(90, 6, 'G4');
    renderMusicData();
    updateBarSelects();
  }
});

// Build Piano Roll UI
const pianoRoll = document.getElementById('pianoRoll')!;

function buildPianoRoll() {
  pianoRoll.innerHTML = '';
  pianoRoll.style.gridTemplateColumns = `50px repeat(${musicData.length}, 25px)`;
  const spacer = document.createElement('div');
  spacer.className = 'pr-empty-corner';
  spacer.style.position = 'sticky';
  spacer.style.left = '0';
  spacer.style.zIndex = '10';
  spacer.style.background = 'var(--panel-bg)';
  pianoRoll.appendChild(spacer);
  
  for (let step=0; step<musicData.length; step++) {
    const head = document.createElement('div');
    head.className = 'pr-col-header';
    head.id = `pr-head-${step}`;
    
    if (step % 12 === 0) {
      head.innerText = ((step/12)+1).toString();
    } else if (step % 6 === 0) {
      head.innerText = '-';
    } else {
      head.innerText = '.';
    }
    
    head.addEventListener('click', () => {
      currentStep = step;
      updatePlayheadUI(currentStep);
    });
    
    pianoRoll.appendChild(head);
  }
  
  for (const note of NOTE_NAMES) {
    const label = document.createElement('div');
    label.className = 'pr-label';
    label.innerText = note;
    pianoRoll.appendChild(label);
    
    for (let step=0; step<musicData.length; step++) {
      const cell = document.createElement('div');
      cell.className = 'pr-cell';
      cell.id = `pr-cell-${note}-${step}`;
      
      if (step % 12 === 0 && step > 0) {
        cell.style.borderLeft = '2px solid rgba(255, 0, 127, 0.5)';
      } else if (step % 6 === 0 && step > 0) {
        cell.style.borderLeft = '1px solid rgba(255,255,255,0.1)';
      }
      
      cell.addEventListener('click', () => {
        const current = musicData[step];
        if (current === note) {
          musicData[step] = "~" + note; // Change to Hold
        } else if (current === "~" + note) {
          musicData[step] = null; // Change to Silent
        } else {
          musicData[step] = note; // Change to Trigger
        }
        renderMusicData();
      });
      pianoRoll.appendChild(cell);
    }
  }
}

function renderMusicData() {
  document.querySelectorAll('.pr-cell').forEach(el => {
    el.classList.remove('active-trigger', 'active-hold');
  });
  for (let step=0; step<musicData.length; step++) {
    const val = musicData[step];
    if (val) {
      const isHold = val.startsWith('~');
      const pitch = isHold ? val.substring(1) : val;
      const cell = document.getElementById(`pr-cell-${pitch}-${step}`);
      if (cell) {
        if (isHold) cell.classList.add('active-hold');
        else cell.classList.add('active-trigger');
      }
    }
  }
}

function updatePlayheadUI(step: number) {
  // Clear all visible playheads
  document.querySelectorAll('.pr-col-header.active-head').forEach(el => el.classList.remove('active-head'));
  // Only add if currently visible
  const currentHead = document.getElementById(`pr-head-${step}`);
  if (currentHead) {
    currentHead.classList.add('active-head');
    // Optional: auto-scroll to keep playhead in view during playback
    // currentHead.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

const audioToggle = document.getElementById('audioToggle')!;
audioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  if (audioEnabled) {
    audioToggle.innerText = '🔊 SOUND ON';
    audioToggle.classList.remove('off');
  } else {
    audioToggle.innerText = '🔇 SOUND OFF';
    audioToggle.classList.add('off');
  }
});

debugToggle.addEventListener('click', () => {
  debugSidebar.classList.toggle('collapsed');
});

function recalculateRatSpeed() {
  const base = parseInt(dbgBaseSpeed.value) || 0;
  if (dbgFreeze.checked) {
    currentRatSpeed = 0;
  } else {
    currentRatSpeed = base + ((15 - uncollectedCount) * 14);
  }
  
  // If game is playing, update live rats
  if (gameState === 'PLAYING') {
    for (const rat of rats) {
      rat.speed = currentRatSpeed;
    }
  }
  updateUI();
}

dbgBaseSpeed.addEventListener('input', recalculateRatSpeed);
dbgFreeze.addEventListener('change', recalculateRatSpeed);

function resizeCanvas() {
  const parent = canvas.parentElement!;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const camera = { x: 0, y: 0, width: canvas.width, height: canvas.height };

function updateUI() {
  scoreEl.innerText = player.score.toString();
  timeEl.innerText = gameTime.toString();
  starsEl.innerText = player.starsLeft.toString();

  // Update Debug Info
  dbgRatSpeed.innerText = Math.round(currentRatSpeed).toString();
  dbgPlayerSpeed.innerText = player.speed.toString();
  dbgUncollected.innerText = uncollectedCount.toString();
  dbgState.innerText = gameState;
}

// --- INPUT ---
window.addEventListener('keydown', e => {
  if (gameState === 'START') { resetGame(); return; }
  if (gameState === 'GAMEOVER' || gameState === 'VICTORY') {
    if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') resetGame();
    return;
  }
  
  if (e.key === 'ArrowUp' || e.key === 'w') { player.queuedDirX = 0; player.queuedDirY = -1; }
  if (e.key === 'ArrowDown' || e.key === 's') { player.queuedDirX = 0; player.queuedDirY = 1; }
  if (e.key === 'ArrowLeft' || e.key === 'a') { player.queuedDirX = -1; player.queuedDirY = 0; }
  if (e.key === 'ArrowRight' || e.key === 'd') { player.queuedDirX = 1; player.queuedDirY = 0; }
  
  if (e.key === ' ' && player.starsLeft > 0) {
    stars.push({ gridX: player.gridX, gridY: player.gridY, timer: 5.0 });
    player.starsLeft--;
    updateUI();
    playStarSound();
    spawnParticles(player.pixelX + TILE_SIZE/2, player.pixelY + TILE_SIZE/2, '#FFF', 20);
  }
});

function moveEntityGridLocked(ent: Entity, queuedDirX: number, queuedDirY: number, dt: number): boolean {
  ent.pixelX += ent.dirX * ent.speed * dt;
  ent.pixelY += ent.dirY * ent.speed * dt;

  const exactGridX = ent.pixelX / TILE_SIZE;
  const exactGridY = ent.pixelY / TILE_SIZE;
  const threshold = (ent.speed * dt) / TILE_SIZE;
  
  let reachedIntersection = false;

  if (Math.abs(exactGridX - Math.round(exactGridX)) <= threshold && 
      Math.abs(exactGridY - Math.round(exactGridY)) <= threshold) {
    
    ent.gridX = Math.round(exactGridX);
    ent.gridY = Math.round(exactGridY);
    ent.pixelX = ent.gridX * TILE_SIZE;
    ent.pixelY = ent.gridY * TILE_SIZE;
    reachedIntersection = true;

    if (queuedDirX !== ent.dirX || queuedDirY !== ent.dirY) {
      if (map[ent.gridY + queuedDirY][ent.gridX + queuedDirX] === 0) {
        ent.dirX = queuedDirX;
        ent.dirY = queuedDirY;
      }
    }

    if (map[ent.gridY + ent.dirY][ent.gridX + ent.dirX] === 1) {
      ent.dirX = 0;
      ent.dirY = 0;
    }
  }
  return reachedIntersection;
}

// --- UPDATE LOGIC ---
function update(dt: number) {
  if (gameState !== 'PLAYING') return;

  gameTimerAccumulator += dt;
  if (gameTimerAccumulator >= 1.0) {
    gameTime--;
    gameTimerAccumulator = 0;
    updateUI();
    if (gameTime <= 0) {
      gameState = 'GAMEOVER';
      playGameOverSound();
      updateUI();
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].timer -= dt;
    if (stars[i].timer <= 0) stars.splice(i, 1);
  }

  moveEntityGridLocked(player, player.queuedDirX, player.queuedDirY, dt);

  let newUncollectedCount = 0;
  for (const cheese of cheeseList) {
    if (!cheese.collected) {
      const cx = cheese.x * TILE_SIZE + TILE_SIZE/2;
      const cy = cheese.y * TILE_SIZE + TILE_SIZE/2;
      const dist = Math.hypot(cx - (player.pixelX + TILE_SIZE/2), cy - (player.pixelY + TILE_SIZE/2));
      if (dist < player.radius + TILE_SIZE * 0.6) {
        cheese.collected = true;
        player.score += 100;
        playEatSound();
        spawnParticles(cx, cy, '#FFE600', 10);
      } else {
        newUncollectedCount++;
      }
    }
  }
  
  // If we collected a cheese, update speed and UI
  if (newUncollectedCount !== uncollectedCount) {
    uncollectedCount = newUncollectedCount;
    recalculateRatSpeed();
  }
  
  if (uncollectedCount === 0) {
    gameState = 'VICTORY';
    playVictorySound();
    updateUI();
  }

  for (const rat of rats) {
    // Note: rat.speed is updated by recalculateRatSpeed, we just use it here
    
    if (rat.stunnedTimer > 0) {
      rat.stunnedTimer -= dt;
      continue;
    }

    for (const star of stars) {
      if (rat.gridX === star.gridX && rat.gridY === star.gridY) {
        rat.stunnedTimer = 5.0;
        break;
      }
    }

    let queuedX = rat.dirX;
    let queuedY = rat.dirY;
    
    const exactX = rat.pixelX / TILE_SIZE;
    const exactY = rat.pixelY / TILE_SIZE;
    const threshold = (rat.speed * dt) / TILE_SIZE;
    
    if (Math.abs(exactX - Math.round(exactX)) <= threshold && Math.abs(exactY - Math.round(exactY)) <= threshold) {
      const possibleDirs = [ {x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0} ];
      let bestDist = Infinity;
      let validDirs = [];
      
      for(const d of possibleDirs) {
        if(d.x === -rat.dirX && d.y === -rat.dirY && (rat.dirX !== 0 || rat.dirY !== 0)) continue;
        if (map[rat.gridY + d.y][rat.gridX + d.x] === 0) {
          validDirs.push(d);
          const distToPlayer = Math.hypot((rat.gridX + d.x) - player.gridX, (rat.gridY + d.y) - player.gridY);
          if (distToPlayer < bestDist) {
            bestDist = distToPlayer;
            queuedX = d.x;
            queuedY = d.y;
          }
        }
      }
      if (validDirs.length === 0) {
        queuedX = -rat.dirX;
        queuedY = -rat.dirY;
      }
    }
    
    moveEntityGridLocked(rat, queuedX, queuedY, dt);

    const distToPlayer = Math.hypot(rat.pixelX - player.pixelX, rat.pixelY - player.pixelY);
    if (distToPlayer < player.radius * 2) {
      gameState = 'GAMEOVER';
      playGameOverSound();
      updateUI();
    }
  }

  for (const cat of cats) {
    const dist = Math.hypot((cat.x * TILE_SIZE) - player.pixelX, (cat.y * TILE_SIZE) - player.pixelY);
    if (dist < player.radius * 2) {
      gameState = 'GAMEOVER';
      playGameOverSound();
      updateUI();
    }
  }

  camera.width = canvas.width;
  camera.height = canvas.height;
  camera.x = Math.max(0, Math.min(player.pixelX + TILE_SIZE / 2 - camera.width / 2, MAZE_WIDTH * TILE_SIZE - camera.width));
  camera.y = Math.max(0, Math.min(player.pixelY + TILE_SIZE / 2 - camera.height / 2, MAZE_HEIGHT * TILE_SIZE - camera.height));
}

// --- RENDER ---
function draw() {
  ctx.fillStyle = '#05050A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'START') {
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 36px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ANY KEY TO START', canvas.width / 2, canvas.height / 2);
    return;
  }

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = '#1A1A2E';
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (map[y][x] === 1) {
        const tx = x * TILE_SIZE; const ty = y * TILE_SIZE;
        if (tx + TILE_SIZE > camera.x && tx < camera.x + camera.width && ty + TILE_SIZE > camera.y && ty < camera.y + camera.height) {
          ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          
          let isEdge = false;
          if (x>0 && map[y][x-1]===0) isEdge=true;
          if (x<MAZE_WIDTH-1 && map[y][x+1]===0) isEdge=true;
          if (y>0 && map[y-1][x]===0) isEdge=true;
          if (y<MAZE_HEIGHT-1 && map[y+1][x]===0) isEdge=true;
          
          if (isEdge) {
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }

  ctx.fillStyle = '#FFE600';
  ctx.shadowColor = '#FFE600';
  ctx.shadowBlur = 15;
  for (const cheese of cheeseList) {
    if (!cheese.collected) {
      ctx.beginPath();
      ctx.arc(cheese.x * TILE_SIZE + TILE_SIZE / 2, cheese.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'white';
  for (const star of stars) {
    ctx.globalAlpha = Math.max(0, star.timer / 5.0);
    ctx.beginPath();
    ctx.arc(star.gridX * TILE_SIZE + TILE_SIZE / 2, star.gridY * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  for (const cat of cats) {
    ctx.fillStyle = '#000';
    ctx.shadowColor = '#FF007F';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cat.x * TILE_SIZE + TILE_SIZE / 2, cat.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF007F';
    ctx.fillRect(cat.x * TILE_SIZE + TILE_SIZE / 2 - 8, cat.y * TILE_SIZE + TILE_SIZE / 2 - 4, 4, 4);
    ctx.fillRect(cat.x * TILE_SIZE + TILE_SIZE / 2 + 4, cat.y * TILE_SIZE + TILE_SIZE / 2 - 4, 4, 4);
  }
  ctx.shadowBlur = 0;

  for (const rat of rats) {
    ctx.fillStyle = rat.stunnedTimer > 0 ? '#555' : '#FF007F';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(rat.pixelX + TILE_SIZE / 2, rat.pixelY + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(player.pixelX + TILE_SIZE / 2, player.pixelY + TILE_SIZE / 2, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;

  ctx.restore();

  if (gameState === 'GAMEOVER') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF007F';
    ctx.font = 'bold 48px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px Outfit';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 30);
  } else if (gameState === 'VICTORY') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00FF66';
    ctx.font = 'bold 48px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px Outfit';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Press R to Play Again', canvas.width / 2, canvas.height / 2 + 30);
  }
}

function drawRadar() {
  radarCtx.fillStyle = '#05050A';
  radarCtx.fillRect(0, 0, radarCanvas.width, radarCanvas.height);
  if (gameState === 'START') return;
  
  const rw = radarCanvas.width / MAZE_WIDTH;
  const rh = radarCanvas.height / MAZE_HEIGHT;

  radarCtx.fillStyle = '#1A1A2E';
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (map[y][x] === 1) radarCtx.fillRect(x * rw, y * rh, rw, rh);
    }
  }

  radarCtx.fillStyle = '#FFE600';
  for (const cheese of cheeseList) {
    if (!cheese.collected) radarCtx.fillRect(cheese.x * rw, cheese.y * rh, rw, rh);
  }

  radarCtx.fillStyle = '#888';
  for (const cat of cats) radarCtx.fillRect(cat.x * rw, cat.y * rh, rw, rh);

  radarCtx.fillStyle = '#FF007F';
  for (const rat of rats) radarCtx.fillRect((rat.pixelX / TILE_SIZE) * rw, (rat.pixelY / TILE_SIZE) * rh, rw, rh);

  radarCtx.fillStyle = '#FFF';
  for (const star of stars) radarCtx.fillRect(star.gridX * rw, star.gridY * rh, rw, rh);

  radarCtx.fillStyle = player.color;
  radarCtx.fillRect((player.pixelX / TILE_SIZE) * rw, (player.pixelY / TILE_SIZE) * rh, rw * 1.5, rh * 1.5);
}

let lastTime = 0;
function loop(timestamp: number) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (dt < 0.1) {
    update(dt);
    draw();
    drawRadar();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
