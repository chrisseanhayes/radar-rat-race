import { rats, cats, stars, player, moveEntityGridLocked, spawnParticles } from './Entities';
import { map } from './MapManager';
import { TILE_SIZE, MAZE_WIDTH, MAZE_HEIGHT } from './Constants';
import { gameBus } from './EventBus';
import { gameData } from './GameAssets';

export function updateEnemies(dt: number): { playerDied: boolean } {
  let playerDied = false;

  for (const rat of rats) {
    if (rat.stunnedTimer > 0) {
      rat.stunnedTimer -= dt;
      continue;
    }

    for (const star of stars) {
      if (!star.triggered && rat.gridX === star.gridX && rat.gridY === star.gridY) {
        rat.stunnedTimer = 5.0;
        star.triggered = true;
        if(gameData.events.trap) gameBus.emit('play_track', { id: gameData.events.trap, loop: false });
        spawnParticles(rat.pixelX + TILE_SIZE/2, rat.pixelY + TILE_SIZE/2, '#FF007F', 15);
        break;
      }
    }

    let queuedX = rat.dirX;
    let queuedY = rat.dirY;
    
    const exactX = rat.pixelX / TILE_SIZE;
    const exactY = rat.pixelY / TILE_SIZE;
    const threshold = (rat.speed * dt) / TILE_SIZE;
    
    if (Math.abs(exactX - Math.round(exactX)) <= threshold && Math.abs(exactY - Math.round(exactY)) <= threshold) {
      let targetX = player.gridX;
      let targetY = player.gridY;
      
      const pDirX = player.dirX || player.queuedDirX || 0;
      const pDirY = player.dirY || player.queuedDirY || -1;
      
      if (rat.behavior === 'AMBUSH') {
        targetX = player.gridX + pDirX * 6;
        targetY = player.gridY + pDirY * 6;
      } else if (rat.behavior === 'FLANK') {
        const chaser = rats.find(r => r.behavior === 'CHASE');
        if (chaser) {
          const pivotX = player.gridX + pDirX * 2;
          const pivotY = player.gridY + pDirY * 2;
          targetX = pivotX + (pivotX - chaser.gridX);
          targetY = pivotY + (pivotY - chaser.gridY);
        } else {
          targetX = player.gridX - pDirX * 4;
          targetY = player.gridY - pDirY * 4;
        }
      } else if (rat.behavior === 'WANDER') {
        const distToPlayer = Math.hypot(rat.gridX - player.gridX, rat.gridY - player.gridY);
        if (distToPlayer > 10) {
          targetX = player.gridX;
          targetY = player.gridY;
        } else {
          targetX = (rat.gridX < MAZE_WIDTH / 2) ? MAZE_WIDTH - 2 : 1;
          targetY = (rat.gridY < MAZE_HEIGHT / 2) ? MAZE_HEIGHT - 2 : 1;
        }
      }

      const possibleDirs = [ {x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0} ];
      let bestDist = Infinity;
      let validDirs = [];
      
      for(const d of possibleDirs) {
        if(d.x === -rat.dirX && d.y === -rat.dirY && (rat.dirX !== 0 || rat.dirY !== 0)) continue;
        if (map[rat.gridY + d.y][rat.gridX + d.x] === 0) {
          validDirs.push(d);
          const distToTarget = Math.hypot((rat.gridX + d.x) - targetX, (rat.gridY + d.y) - targetY);
          if (distToTarget < bestDist) {
            bestDist = distToTarget;
            queuedX = d.x;
            queuedY = d.y;
          }
        }
      }
      
      if (rat.behavior === 'WANDER' && validDirs.length > 1 && Math.random() < 0.4) {
        const randomDir = validDirs[Math.floor(Math.random() * validDirs.length)];
        queuedX = randomDir.x;
        queuedY = randomDir.y;
      }
      
      if (validDirs.length === 0) {
        queuedX = -rat.dirX;
        queuedY = -rat.dirY;
      }
    }
    
    moveEntityGridLocked(rat, queuedX, queuedY, dt);

    const distToPlayer = Math.hypot(rat.pixelX - player.pixelX, rat.pixelY - player.pixelY);
    if (distToPlayer < player.radius * 2) {
      playerDied = true;
    }
  }

  for (const cat of cats) {
    const dist = Math.hypot((cat.x * TILE_SIZE) - player.pixelX, (cat.y * TILE_SIZE) - player.pixelY);
    if (!cat.triggered && dist < player.radius * 2) {
      cat.triggered = true;
      cat.attachedToPlayer = true;
      player.trapAttached = true;
      playerDied = true;
    }
  }

  return { playerDied };
}

export function updateRatSpeed(baseSpeed: number, isFrozen: boolean, uncollectedCount: number, isPlaying: boolean) {
  let actualSpeed = baseSpeed;
  if (isFrozen) {
    actualSpeed = 0;
  } else {
    actualSpeed = baseSpeed + ((15 - uncollectedCount) * 14);
  }
  
  if (isPlaying) {
    for (const rat of rats) {
      rat.speed = actualSpeed;
    }
  }
}
