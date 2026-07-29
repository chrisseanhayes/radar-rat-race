import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import { gameBus } from '../game/EventBus';
import { startGame, stopGame } from '../game/GameLoop';
import { initGameAssets } from '../game/GameAssets';
import { initAudioSystem } from '../game/AudioSystem';
import type { GameStateData } from '../types';

export function useGameEngine(
  gameCanvasRef: RefObject<HTMLCanvasElement | null>,
  radarCanvasRef: RefObject<HTMLCanvasElement | null>
) {
  const [gameState, setGameState] = useState<GameStateData>({
    score: 0,
    time: 99,
    stars: 3,
    state: 'START',
    ratSpeed: 0,
    playerSpeed: 400,
    uncollected: 15
  });

  useEffect(() => {
    initAudioSystem();
    
    const unsubScore = gameBus.on('score_update', s => setGameState(prev => ({...prev, score: s})));
    const unsubTime = gameBus.on('time_update', t => setGameState(prev => ({...prev, time: t})));
    const unsubLife = gameBus.on('life_update', l => setGameState(prev => ({...prev, stars: l})));
    const unsubState = gameBus.on('state_update', s => setGameState(prev => ({...prev, state: s})));
    const unsubRatSpeed = gameBus.on('rat_speed_update', s => setGameState(prev => ({...prev, ratSpeed: s})));
    const unsubPlayerSpeed = gameBus.on('player_speed_update', s => setGameState(prev => ({...prev, playerSpeed: s})));
    const unsubUncollected = gameBus.on('uncollected_update', u => setGameState(prev => ({...prev, uncollected: u})));

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Input block checks are now handled in GameController.ts via events
      gameBus.emit('keyboard_input', e.key);
    };
    window.addEventListener('keydown', handleKeyDown);

    let mounted = true;
    Promise.all([initAudioSystem(), initGameAssets()]).then(() => {
      if (!mounted) return;
      if (gameCanvasRef.current && radarCanvasRef.current) {
        startGame(gameCanvasRef.current, radarCanvasRef.current);
      }
    });

    return () => {
      mounted = false;
      stopGame();
      unsubScore();
      unsubTime();
      unsubLife();
      unsubState();
      unsubRatSpeed();
      unsubPlayerSpeed();
      unsubUncollected();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameCanvasRef, radarCanvasRef]);

  return gameState;
}
