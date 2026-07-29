import { state } from './GameState';
import { spriteCanvases } from './GameAssets';
import { currentFPS } from './GameLoop';
import { profile, perfStats } from './Profiler';
import { TILE_SIZE, MAZE_WIDTH, MAZE_HEIGHT } from './Constants';
import { map } from './MapManager';
import { cheeseList, cats, rats, stars, particles, player } from './Entities';
import { gameBus } from './EventBus';

let showFPS = true;
gameBus.on('toggle_fps', (show: boolean) => {
  showFPS = show;
});

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let radarCanvas: HTMLCanvasElement;
let radarCtx: CanvasRenderingContext2D;
const camera = { x: 0, y: 0, width: 800, height: 600 };

let cachedMazeCanvas: HTMLCanvasElement | null = null;
let cachedRadarMazeCanvas: HTMLCanvasElement | null = null;

export function invalidateMapCache() {
  cachedMazeCanvas = null;
  cachedRadarMazeCanvas = null;
}
gameBus.on('map_invalidated', invalidateMapCache);

export function initRenderer(c: HTMLCanvasElement, rc: HTMLCanvasElement) {
  canvas = c;
  ctx = canvas.getContext('2d')!;
  radarCanvas = rc;
  radarCtx = radarCanvas.getContext('2d')!;
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

export function cleanupRenderer() {
  window.removeEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (parent) {
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }
}

const _draw = () => {
  if (!ctx) return;

  camera.width = canvas.width;
  camera.height = canvas.height;
  camera.x = Math.round(Math.max(0, Math.min(player.pixelX + TILE_SIZE / 2 - camera.width / 2, MAZE_WIDTH * TILE_SIZE - camera.width)));
  camera.y = Math.round(Math.max(0, Math.min(player.pixelY + TILE_SIZE / 2 - camera.height / 2, MAZE_HEIGHT * TILE_SIZE - camera.height)));

  ctx.fillStyle = '#999999';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.status === 'START') {
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 36px "Departure Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ANY KEY TO START', canvas.width / 2, canvas.height / 2);
    return;
  }

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  if (!cachedMazeCanvas) {
    cachedMazeCanvas = document.createElement('canvas');
    cachedMazeCanvas.width = MAZE_WIDTH * TILE_SIZE;
    cachedMazeCanvas.height = MAZE_HEIGHT * TILE_SIZE;
    const mctx = cachedMazeCanvas.getContext('2d')!;
    mctx.fillStyle = '#a3b19b';
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (map[y][x] === 1) {
          const tx = x * TILE_SIZE; const ty = y * TILE_SIZE;
          mctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          
          let isEdge = false;
          if (x>0 && map[y][x-1]===0) isEdge=true;
          if (x<MAZE_WIDTH-1 && map[y][x+1]===0) isEdge=true;
          if (y>0 && map[y-1][x]===0) isEdge=true;
          if (y<MAZE_HEIGHT-1 && map[y+1][x]===0) isEdge=true;
          
          if (isEdge) {
            mctx.strokeStyle = '#8a9981';
            mctx.lineWidth = 1;
            mctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }
  
  ctx.drawImage(cachedMazeCanvas, 0, 0);

  for (const cheese of cheeseList) {
    if (!cheese.collected) {
      const sprite = spriteCanvases['cheese'];
      if (sprite) {
        ctx.drawImage(
          sprite,
          Math.round(cheese.x * TILE_SIZE + (TILE_SIZE - sprite.width * 1.5) / 2),
          Math.round(cheese.y * TILE_SIZE + (TILE_SIZE - sprite.height * 1.5) / 2),
          sprite.width * 1.5,
          sprite.height * 1.5
        );
      } else {
        ctx.fillStyle = '#FFE600';
        ctx.beginPath();
        ctx.arc(cheese.x * TILE_SIZE + TILE_SIZE / 2, cheese.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  for (const star of stars) {
    ctx.globalAlpha = Math.max(0, star.timer / 5.0);
    const spriteName = star.triggered ? 'trap_closed' : 'trap_open';
    const sprite = spriteCanvases[spriteName];
    if (sprite) {
      ctx.drawImage(
        sprite,
        Math.round(star.gridX * TILE_SIZE + (TILE_SIZE - sprite.width * 1.5) / 2),
        Math.round(star.gridY * TILE_SIZE + (TILE_SIZE - sprite.height * 1.5) / 2),
        sprite.width * 1.5,
        sprite.height * 1.5
      );
    } else {
      ctx.fillStyle = star.triggered ? 'gray' : 'white';
      ctx.beginPath();
      ctx.arc(star.gridX * TILE_SIZE + TILE_SIZE / 2, star.gridY * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();
    }
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
    if (cat.attachedToPlayer) continue;
    const spriteName = cat.triggered ? 'trap_closed' : 'trap_open';
    const sprite = spriteCanvases[spriteName];
    if (sprite) {
      ctx.drawImage(
        sprite,
        Math.round(cat.x * TILE_SIZE + (TILE_SIZE - sprite.width * 1.5) / 2),
        Math.round(cat.y * TILE_SIZE + (TILE_SIZE - sprite.height * 1.5) / 2),
        sprite.width * 1.5,
        sprite.height * 1.5
      );
    } else {
      ctx.fillStyle = cat.triggered ? 'gray' : '#000';
      ctx.beginPath();
      ctx.arc(cat.x * TILE_SIZE + TILE_SIZE / 2, cat.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF007F';
      ctx.fillRect(cat.x * TILE_SIZE + TILE_SIZE / 2 - 8, cat.y * TILE_SIZE + TILE_SIZE / 2 - 4, 4, 4);
      ctx.fillRect(cat.x * TILE_SIZE + TILE_SIZE / 2 + 4, cat.y * TILE_SIZE + TILE_SIZE / 2 - 4, 4, 4);
    }
  }

  for (const rat of rats) {
    if (rat.stunnedTimer > 0) {
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(rat.pixelX + TILE_SIZE / 2, rat.pixelY + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      let spriteName = 'enemy_d';
      if (rat.dirX === -1) spriteName = 'enemy_l';
      else if (rat.dirX === 1) spriteName = 'enemy_r';
      else if (rat.dirY === -1) spriteName = 'enemy_u';
      else if (rat.dirY === 1) spriteName = 'enemy_d';
      
      const sprite = spriteCanvases[spriteName];
      if (sprite) {
        ctx.drawImage(
          sprite,
          Math.round(rat.pixelX + (TILE_SIZE - sprite.width * 2.25) / 2),
          Math.round(rat.pixelY + (TILE_SIZE - sprite.height * 2.25) / 2),
          sprite.width * 2.25,
          sprite.height * 2.25
        );
      } else {
        ctx.fillStyle = rat.color || '#FF007F';
        ctx.beginPath();
        ctx.arc(rat.pixelX + TILE_SIZE / 2, rat.pixelY + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  let pSpriteName = 'player_u';
  let spinAngle = 0;
  if (state.status === 'GAMEOVER' || state.status === 'CRASH') {
    if (player.dirX === -1) pSpriteName = 'player_dead_l';
    else if (player.dirX === 1) pSpriteName = 'player_dead_r';
    else if (player.dirY === -1) pSpriteName = 'player_dead_u';
    else if (player.dirY === 1) pSpriteName = 'player_dead_d';
    else pSpriteName = 'player_dead_u';
    
    spinAngle = (performance.now() % 1000) / 1000 * Math.PI * 2;
  } else {
    if (player.dirX === -1) pSpriteName = 'player_l';
    else if (player.dirX === 1) pSpriteName = 'player_r';
    else if (player.dirY === -1) pSpriteName = 'player_u';
    else if (player.dirY === 1) pSpriteName = 'player_d';
    else pSpriteName = 'player_u';
  }

  const pSprite = spriteCanvases[pSpriteName];
  if (pSprite) {
    if (spinAngle !== 0) {
      ctx.save();
      const cx = Math.round(player.pixelX + TILE_SIZE / 2);
      const cy = Math.round(player.pixelY + TILE_SIZE / 2);
      ctx.translate(cx, cy);
      ctx.rotate(spinAngle);
      if (player.trapAttached) {
        const trapSprite = spriteCanvases['trap_closed'];
        if (trapSprite) {
          ctx.drawImage(
            trapSprite,
            -trapSprite.width * 1.5 / 2,
            -trapSprite.height * 1.5 / 2 - 12,
            trapSprite.width * 1.5,
            trapSprite.height * 1.5
          );
        }
      }
      ctx.drawImage(
        pSprite,
        -pSprite.width * 2.25 / 2,
        -pSprite.height * 2.25 / 2,
        pSprite.width * 2.25,
        pSprite.height * 2.25
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        pSprite,
        Math.round(player.pixelX + (TILE_SIZE - pSprite.width * 2.25) / 2),
        Math.round(player.pixelY + (TILE_SIZE - pSprite.height * 2.25) / 2),
        pSprite.width * 2.25,
        pSprite.height * 2.25
      );
    }
  } else {
    ctx.beginPath();
    ctx.arc(player.pixelX + TILE_SIZE / 2, player.pixelY + TILE_SIZE / 2, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
  }

  ctx.restore();

  if (state.status === 'GAMEOVER') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF007F';
    ctx.font = 'bold 48px "Departure Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px "Departure Mono"';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 30);
  } else if (state.status === 'VICTORY') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00FF66';
    ctx.font = 'bold 48px "Departure Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px "Departure Mono"';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Press R to Play Again', canvas.width / 2, canvas.height / 2 + 30);
  }

  if (showFPS) {
    ctx.fillStyle = '#00FF00';
    ctx.font = '16px "Departure Mono"';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${currentFPS}`, 10, 30);
    ctx.font = '12px "Departure Mono"';
    ctx.fillText(`Update: ${(perfStats.update || 0).toFixed(2)}ms`, 10, 50);
    ctx.fillText(`Draw  : ${(perfStats.draw || 0).toFixed(2)}ms`, 10, 65);
    ctx.fillText(`Radar : ${(perfStats.drawRadar || 0).toFixed(2)}ms`, 10, 80);
  }
}

const _drawRadar = () => {
  if (!radarCtx) return;
  radarCtx.fillStyle = '#999999';
  radarCtx.fillRect(0, 0, radarCanvas.width, radarCanvas.height);
  if (state.status === 'START') return;
  
  const rw = radarCanvas.width / MAZE_WIDTH;
  const rh = radarCanvas.height / MAZE_HEIGHT;

  if (!cachedRadarMazeCanvas) {
    cachedRadarMazeCanvas = document.createElement('canvas');
    cachedRadarMazeCanvas.width = radarCanvas.width;
    cachedRadarMazeCanvas.height = radarCanvas.height;
    const rctx = cachedRadarMazeCanvas.getContext('2d')!;
    rctx.fillStyle = '#a3b19b';
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (map[y][x] === 1) rctx.fillRect(x * rw, y * rh, rw, rh);
      }
    }
  }
  radarCtx.drawImage(cachedRadarMazeCanvas, 0, 0);

  radarCtx.fillStyle = '#FFE600';
  for (const cheese of cheeseList) {
    if (!cheese.collected) radarCtx.fillRect(cheese.x * rw, cheese.y * rh, rw, rh);
  }

  radarCtx.fillStyle = '#888';
  for (const cat of cats) radarCtx.fillRect(cat.x * rw, cat.y * rh, rw, rh);

  for (const rat of rats) {
    radarCtx.fillStyle = rat.color || '#FF007F';
    radarCtx.fillRect((rat.pixelX / TILE_SIZE) * rw, (rat.pixelY / TILE_SIZE) * rh, rw, rh);
  }

  radarCtx.fillStyle = '#FFF';
  for (const star of stars) radarCtx.fillRect(star.gridX * rw, star.gridY * rh, rw, rh);

  radarCtx.fillStyle = player.color;
  radarCtx.fillRect((player.pixelX / TILE_SIZE) * rw, (player.pixelY / TILE_SIZE) * rh, rw * 1.5, rh * 1.5);
}

export const draw = profile('draw', _draw);
export const drawRadar = profile('drawRadar', _drawRadar);
