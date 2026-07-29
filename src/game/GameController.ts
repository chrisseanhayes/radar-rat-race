import { initAudio, setAudioEnabled } from './audio';
import { gameBus } from './EventBus';
import './InputSystem';

// --- GAME ASSETS ---
export * from './GameAssets';

// We import state to hook up the events below
import { state } from './GameState';
export { state, type GameStatus, GameState } from './GameState';

// --- EVENT BUS LISTENERS ---
gameBus.on('toggle_freeze', (f: boolean) => {
  state.isRatsFrozen = f;
  state.recalculateRatSpeed();
});

gameBus.on('set_base_speed', (s: number) => {
  state.ratSpeed = s;
  state.recalculateRatSpeed();
});

gameBus.on('toggle_audio', (enabled: boolean) => {
  setAudioEnabled(enabled);
  initAudio();
});

gameBus.on('open_music_editor', () => {
  const modal = document.getElementById('musicModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = ''; // Clear inline style if it was set
    gameBus.emit('dialog_open');
  }
});

gameBus.on('map_imported', () => state.resetGame());

gameBus.on('debug_open', () => state.pauseBlockers++);
gameBus.on('debug_close', () => state.pauseBlockers = Math.max(0, state.pauseBlockers - 1));
gameBus.on('dialog_open', () => state.pauseBlockers++);
gameBus.on('dialog_close', () => state.pauseBlockers = Math.max(0, state.pauseBlockers - 1));

// --- END ---
