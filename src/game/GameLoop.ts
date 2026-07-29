import { state } from './GameState';
import { draw, drawRadar, initRenderer, cleanupRenderer } from './Renderer';
import { generateMaze, map } from './MapManager';

export let currentFPS = 0;
let fpsFrames = 0;
let lastFpsTime = 0;

const FIXED_DT = 1 / 60;
let timeAccumulator = 0;
let lastTime = 0;
let rafId: number = 0;
let isRunning = false;

function calculateFrameTime(timestamp: number): number {
  if (lastTime === 0) lastTime = timestamp;
  let frameTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (frameTime > 0.1) frameTime = 0.1; // Cap to prevent "spiral of death"
  return frameTime;
}

function updateFPS(timestamp: number) {
  fpsFrames++;
  if (timestamp - lastFpsTime >= 1000) {
    currentFPS = fpsFrames;
    fpsFrames = 0;
    lastFpsTime = timestamp;
  }
}

function processUpdates(frameTime: number) {
  if (state.pauseBlockers === 0) {
    timeAccumulator += frameTime;
    while (timeAccumulator >= FIXED_DT) {
      state.update(FIXED_DT);
      timeAccumulator -= FIXED_DT;
    }
  }
}

function render() {
  draw();
  drawRadar();
}

function loop(timestamp: number) {
  if (!isRunning) return;
  
  const frameTime = calculateFrameTime(timestamp);
  
  updateFPS(timestamp);
  processUpdates(frameTime);
  render();

  rafId = requestAnimationFrame(loop);
}

export function startGame(c: HTMLCanvasElement, rc: HTMLCanvasElement) {
  initRenderer(c, rc);
  
  if (map.length === 0) {
    generateMaze();
  }
  
  state.updateUI();
  draw();
  drawRadar();
  
  isRunning = true;
  lastTime = 0;
  timeAccumulator = 0;
  lastFpsTime = performance.now();
  fpsFrames = 0;
  rafId = requestAnimationFrame(loop);
}

export function stopGame() {
  isRunning = false;
  cancelAnimationFrame(rafId);
  cleanupRenderer();
}
