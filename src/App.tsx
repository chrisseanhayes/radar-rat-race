import { useRef, useState } from 'react';
import './game/GameController';
import { gameBus } from './game/EventBus';
import { bgmVolume, sfxVolume, setBgmVolume, setSfxVolume } from './game/audio';
import Sidebar from './components/Sidebar';
import GameArea from './components/GameArea';
import DevTools from './components/DevTools';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const gameState = useGameEngine(gameCanvasRef, radarCanvasRef);

  const [isAudioOn, setIsAudioOn] = useState(true);
  const [bgmVol, setBgmVol] = useState(bgmVolume);
  const [sfxVol, setSfxVol] = useState(sfxVolume);

  const handleAudioToggle = () => {
    const newState = !isAudioOn;
    setIsAudioOn(newState);
    gameBus.emit('toggle_audio', newState);
  };

  const handleBgmChange = (val: number) => {
    setBgmVol(val);
    setBgmVolume(val);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    setSfxVolume(val);
  };

  return (
    <div id="app">
      <main className="game-container">
        <GameArea gameCanvasRef={gameCanvasRef} />
        
        <Sidebar 
          radarCanvasRef={radarCanvasRef}
          gameState={gameState}
          isAudioOn={isAudioOn}
          handleAudioToggle={handleAudioToggle}
          bgmVol={bgmVol}
          handleBgmChange={handleBgmChange}
          sfxVol={sfxVol}
          handleSfxChange={handleSfxChange}
        />
      </main>

      <DevTools gameState={gameState} />
    </div>
  );
}
