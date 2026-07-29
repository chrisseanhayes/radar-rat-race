import { gameBus } from './EventBus';
import { gameData } from './GameAssets';
import { map, START_X, START_Y } from './MapManager';
import { TILE_SIZE, MAZE_WIDTH, MAZE_HEIGHT } from './Constants';

export interface Entity { gridX: number; gridY: number; pixelX: number; pixelY: number; dirX: number; dirY: number; speed: number; }
export interface Cheese { x: number; y: number; collected: boolean; }
export interface Cat { x: number; y: number; triggered: boolean; attachedToPlayer?: boolean; }
export type RatBehavior = 'CHASE' | 'AMBUSH' | 'FLANK' | 'WANDER';
export interface Rat extends Entity { stunnedTimer: number; behavior: RatBehavior; color: string; }
export interface Star { gridX: number; gridY: number; timer: number; triggered: boolean; }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; }

export const cheeseList: Cheese[] = [];
export const cats: Cat[] = [];
export const rats: Rat[] = [];
export const stars: Star[] = [];
export const particles: Particle[] = [];

export const player = {
  gridX: START_X, gridY: START_Y,
  pixelX: START_X * TILE_SIZE, pixelY: START_Y * TILE_SIZE,
  radius: TILE_SIZE / 3,
  speed: 400, 
  dirX: 0, dirY: -1, 
  queuedDirX: 0, queuedDirY: -1,
  color: '#00F0FF', score: 0, starsLeft: 3,
  trapAttached: false
};

export function clearEntities() {
  cheeseList.length = 0;
  cats.length = 0;
  rats.length = 0;
  stars.length = 0;
  particles.length = 0;
}

export function resetPlayer(pX: number, pY: number) {
  player.gridX = pX;
  player.gridY = pY;
  player.pixelX = pX * TILE_SIZE;
  player.pixelY = pY * TILE_SIZE;
  player.dirX = 0;
  player.dirY = -1;
  player.queuedDirX = 0;
  player.queuedDirY = -1;
  player.score = 0;
  player.starsLeft = 3;
  player.trapAttached = false;
}

export function spawnParticles(x: number, y: number, color: string, count: number) {
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

export function spawnItemsAndCats() {
  const availableTiles: {x: number, y: number}[] = [];
  for(let y = 2; y < MAZE_HEIGHT - 2; y++) {
    for(let x = 2; x < MAZE_WIDTH - 2; x++) {
      if(map[y][x] === 0) availableTiles.push({x, y});
    }
  }
  
  const farTiles = availableTiles.filter(t => Math.hypot(t.x - START_X, t.y - START_Y) > 8);
  farTiles.sort(() => Math.random() - 0.5);

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
        const idx = farTiles.findIndex(ft => ft.x === t.x && ft.y === t.y);
        if (idx !== -1) farTiles.splice(idx, 1);
      }
    }
  }

  while (cheeseList.length < 15 && farTiles.length > 0) {
    const t = farTiles.pop()!;
    cheeseList.push({x: t.x, y: t.y, collected: false});
  }
  
  for (let i = 0; i < 3; i++) {
    if(farTiles.length > 0) {
      const t = farTiles.pop()!;
      cats.push({x: t.x, y: t.y, triggered: false});
    }
  }
}

export function spawnRats(ratSpawns: {x:number, y:number}[], currentRatSpeed: number) {
  const behaviors: RatBehavior[] = ['CHASE', 'AMBUSH', 'FLANK', 'WANDER'];
  const colors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

  if (ratSpawns.length > 0) {
    rats.push(...ratSpawns.map((pos, i) => ({
      gridX: pos.x, gridY: pos.y, 
      pixelX: pos.x * TILE_SIZE, pixelY: pos.y * TILE_SIZE, 
      dirX: 0, dirY: -1,
      speed: currentRatSpeed,
      stunnedTimer: 0,
      behavior: behaviors[i % behaviors.length],
      color: colors[i % colors.length]
    })));
  } else {
    for (let i = 1; i <= 3; i++) {
      const ry = START_Y + (i * 2);
      const rx = START_X + (i % 2); 
      if (ry < MAZE_HEIGHT - 2) {
        rats.push({ 
          gridX: rx, gridY: ry, 
          pixelX: rx * TILE_SIZE, pixelY: ry * TILE_SIZE, 
          dirX: 0, dirY: -1,
          speed: currentRatSpeed,
          stunnedTimer: 0,
          behavior: behaviors[(i - 1) % behaviors.length],
          color: colors[(i - 1) % colors.length]
        });
      }
    }
  }
}

export function updateParticles(dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function updateStars(dt: number) {
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].timer -= dt;
    if (stars[i].timer <= 0) stars.splice(i, 1);
  }
}

export function updateCheese(): number {
  let newUncollectedCount = 0;
  for (const cheese of cheeseList) {
    if (!cheese.collected) {
      const cx = cheese.x * TILE_SIZE + TILE_SIZE/2;
      const cy = cheese.y * TILE_SIZE + TILE_SIZE/2;
      const dist = Math.hypot(cx - (player.pixelX + TILE_SIZE/2), cy - (player.pixelY + TILE_SIZE/2));
      if (dist < player.radius + TILE_SIZE * 0.6) {
        cheese.collected = true;
        player.score += 100;
        if(gameData.events.eat) gameBus.emit('play_track', { id: gameData.events.eat, loop: false });
        spawnParticles(cx, cy, '#FFE600', 10);
      } else {
        newUncollectedCount++;
      }
    }
  }
  return newUncollectedCount;
}

export function moveEntityGridLocked(ent: Entity, queuedDirX: number, queuedDirY: number, dt: number, isPlayer: boolean = false): boolean {
  ent.pixelX += ent.dirX * ent.speed * dt;
  ent.pixelY += ent.dirY * ent.speed * dt;

  const exactGridX = ent.pixelX / TILE_SIZE;
  const exactGridY = ent.pixelY / TILE_SIZE;
  const threshold = (ent.speed * dt) / TILE_SIZE;
  
  let reachedIntersection = false;

  if (Math.abs(exactGridX - Math.round(exactGridX)) < threshold * 0.99 && 
      Math.abs(exactGridY - Math.round(exactGridY)) < threshold * 0.99) {
    
    ent.gridX = Math.round(exactGridX);
    ent.gridY = Math.round(exactGridY);
    ent.pixelX = ent.gridX * TILE_SIZE;
    ent.pixelY = ent.gridY * TILE_SIZE;
    reachedIntersection = true;

    if (isPlayer && gameData.events.walk) gameBus.emit('play_track', { id: gameData.events.walk, loop: false });

    if (queuedDirX !== ent.dirX || queuedDirY !== ent.dirY) {
      if (map[ent.gridY + queuedDirY] && map[ent.gridY + queuedDirY][ent.gridX + queuedDirX] === 0) {
        ent.dirX = queuedDirX;
        ent.dirY = queuedDirY;
      }
    }

    if (map[ent.gridY + ent.dirY] && map[ent.gridY + ent.dirY][ent.gridX + ent.dirX] === 1) {
      ent.dirX = 0;
      ent.dirY = 0;
    }
  }
  return reachedIntersection;
}
