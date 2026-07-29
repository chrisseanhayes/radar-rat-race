import { initAudio } from './audio';
import { gameBus } from './EventBus';
import { generateMaze } from './MapManager';
import { player, rats, clearEntities, resetPlayer, moveEntityGridLocked, spawnItemsAndCats, spawnRats, updateParticles, updateStars, updateCheese } from './Entities';
import { profile } from './Profiler';
import { updateEnemies, updateRatSpeed } from './EnemyBehavior';
import { gameData } from './GameAssets';

export type GameStatus = 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY' | 'CRASH';

export class GameState {
  status: GameStatus = 'START';
  pauseBlockers = 0;
  isRatsFrozen = false;
  time = 99;
  timerAccumulator = 0;
  ratSpeed = 120; // Lower starting speed
  uncollectedCount = 15;

  constructor() {
    this.update = profile('update', this._updateRaw.bind(this));
  }

  resetGame() {
    const { pX, pY, ratSpawns } = generateMaze();
    clearEntities();
    this.time = 99;
    this.uncollectedCount = 15;
    this.recalculateRatSpeed(); // Initialize speed based on debug controls
    
    resetPlayer(pX, pY);
    spawnItemsAndCats();
    spawnRats(ratSpawns, this.ratSpeed);

    this.updateUI();
    this.status = 'PLAYING';
    initAudio();
    gameBus.emit('stop_all_tracks');
    if (gameData.events.bgm) gameBus.emit('play_track', { id: gameData.events.bgm, loop: true });
  }

  recalculateRatSpeed() {
    updateRatSpeed(this.ratSpeed, this.isRatsFrozen, this.uncollectedCount, this.status === 'PLAYING');
    this.updateUI();
  }

  updateUI() {
    gameBus.emit('score_update', player.score);
    gameBus.emit('time_update', this.time);
    gameBus.emit('life_update', player.starsLeft);
    gameBus.emit('state_update', this.status);
    gameBus.emit('rat_speed_update', rats.length > 0 ? rats[0].speed : this.ratSpeed);
    gameBus.emit('player_speed_update', player.speed);
    gameBus.emit('uncollected_update', this.uncollectedCount);
  }

  tickTimer(dt: number) {
    this.timerAccumulator += dt;
    if (this.timerAccumulator >= 1.0) {
      this.time--;
      this.timerAccumulator = 0;
      this.updateUI();
      if (this.time <= 0) {
        this.triggerGameOver();
      }
    }
  }

  handleCheeseCollection(newUncollectedCount: number) {
    if (newUncollectedCount !== this.uncollectedCount) {
      this.uncollectedCount = newUncollectedCount;
      this.recalculateRatSpeed();
    }
    
    if (this.uncollectedCount === 0) {
      this.triggerVictory();
    }
  }

  triggerGameOver() {
    this.status = 'GAMEOVER';
    gameBus.emit('stop_all_tracks');
    if(gameData.events.gameover) gameBus.emit('play_track', { id: gameData.events.gameover, loop: false });
    this.updateUI();
  }

  triggerVictory() {
    this.status = 'VICTORY';
    gameBus.emit('stop_all_tracks');
    if(gameData.events.victory) gameBus.emit('play_track', { id: gameData.events.victory, loop: false });
    this.updateUI();
  }

  die() {
    gameBus.emit('stop_all_tracks');
    if (gameData.events.die) gameBus.emit('play_track', { id: gameData.events.die, loop: false });
    player.starsLeft--;
    if (player.starsLeft <= 0) {
      this.triggerGameOver();
    } else {
      this.status = 'CRASH';
      this.triggerGameOver(); // simpler for now
    }
  }

  _updateRaw(dt: number) {
    if (this.status !== 'PLAYING') return;

    this.tickTimer(dt);

    updateParticles(dt);
    updateStars(dt);

    moveEntityGridLocked(player, player.queuedDirX, player.queuedDirY, dt, true);

    this.handleCheeseCollection(updateCheese());

    const { playerDied } = updateEnemies(dt);
    if (playerDied) {
      this.die();
    }
  }

  update: (dt: number) => void;
}

export const state = new GameState();
