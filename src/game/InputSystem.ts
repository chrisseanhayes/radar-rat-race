import { gameBus } from './EventBus';
import { state } from './GameState';
import { gameData } from './GameAssets';
import { TILE_SIZE } from './Constants';
import { player, stars, spawnParticles } from './Entities';

let inputBlockers = 0;

gameBus.on('debug_open', () => inputBlockers++);
gameBus.on('debug_close', () => inputBlockers = Math.max(0, inputBlockers - 1));
gameBus.on('dialog_open', () => inputBlockers++);
gameBus.on('dialog_close', () => inputBlockers = Math.max(0, inputBlockers - 1));

gameBus.on('keyboard_input', (key: string) => {
  if (inputBlockers > 0) return;
  if (state.status === 'START') { state.resetGame(); return; }
  if (state.status === 'GAMEOVER' || state.status === 'VICTORY') {
    if (key === 'r' || key === 'R' || key === 'Enter') state.resetGame();
    return;
  }
  
  if (key === 'ArrowUp' || key === 'w') { player.queuedDirX = 0; player.queuedDirY = -1; if(gameData.events.turn) gameBus.emit('play_track', { id: gameData.events.turn, loop: false }); }
  if (key === 'ArrowDown' || key === 's') { player.queuedDirX = 0; player.queuedDirY = 1; if(gameData.events.turn) gameBus.emit('play_track', { id: gameData.events.turn, loop: false }); }
  if (key === 'ArrowLeft' || key === 'a') { player.queuedDirX = -1; player.queuedDirY = 0; if(gameData.events.turn) gameBus.emit('play_track', { id: gameData.events.turn, loop: false }); }
  if (key === 'ArrowRight' || key === 'd') { player.queuedDirX = 1; player.queuedDirY = 0; if(gameData.events.turn) gameBus.emit('play_track', { id: gameData.events.turn, loop: false }); }
  
  if (key === ' ' && player.starsLeft > 0) {
    stars.push({ gridX: player.gridX, gridY: player.gridY, timer: 5.0, triggered: false });
    player.starsLeft--;
    state.updateUI();
    if(gameData.events.star) gameBus.emit('play_track', { id: gameData.events.star, loop: false });
    spawnParticles(player.pixelX + TILE_SIZE/2, player.pixelY + TILE_SIZE/2, '#FFF', 20);
  }
});
