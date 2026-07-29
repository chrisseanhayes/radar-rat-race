import type { RefObject } from 'react';
import type { GameStateData } from '../types';
import Radar from './Radar';
import Stats from './Stats';
import Controls from './Controls';

interface SidebarProps {
  radarCanvasRef: RefObject<HTMLCanvasElement | null>;
  gameState: GameStateData;
  isAudioOn: boolean;
  handleAudioToggle: () => void;
  bgmVol: number;
  handleBgmChange: (val: number) => void;
  sfxVol: number;
  handleSfxChange: (val: number) => void;
}

export default function Sidebar({
  radarCanvasRef,
  gameState,
  isAudioOn,
  handleAudioToggle,
  bgmVol,
  handleBgmChange,
  sfxVol,
  handleSfxChange
}: SidebarProps) {
  return (
    <div className="sidebar">
      <h1 className="game-title">RADAR RAT RACE</h1>
      <Radar radarCanvasRef={radarCanvasRef} />
      <Stats gameState={gameState} />
      <Controls 
        isAudioOn={isAudioOn}
        handleAudioToggle={handleAudioToggle}
        bgmVol={bgmVol}
        handleBgmChange={handleBgmChange}
        sfxVol={sfxVol}
        handleSfxChange={handleSfxChange}
      />
    </div>
  );
}
