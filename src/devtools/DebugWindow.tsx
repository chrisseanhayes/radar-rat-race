import { useState, useEffect } from 'react';
import { gameBus } from '../game/EventBus';
import type { GameStateData } from '../types';
import './debugWindow.css';

interface Props {
  gameState: GameStateData;
}

export default function DebugWindow({ gameState }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [baseSpeed, setBaseSpeed] = useState(120);
  const [freeze, setFreezeState] = useState(false);
  const [showFPS, setShowFPS] = useState(true);

  useEffect(() => {
    if (collapsed) {
      gameBus.emit('debug_close');
    } else {
      gameBus.emit('debug_open');
    }
  }, [collapsed]);

  return (
    <div className={`debug-sidebar ${collapsed ? 'collapsed' : ''}`} id="debugSidebar">
      <button className="debug-toggle" onClick={() => setCollapsed(!collapsed)}>
        DEBUG <span style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>▶</span>
      </button>
      <div className="debug-content">
        <h3>DEBUG INFO</h3>
        <div className="debug-control">
          <label>Base Speed:</label>
          <input 
            type="number" 
            value={baseSpeed} 
            min="0" max="400" step="10" 
            onChange={e => {
              const val = parseInt(e.target.value);
              setBaseSpeed(val);
              gameBus.emit('set_base_speed', val);
            }} 
          />
        </div>
        <div className="debug-control">
          <label>
            <input 
              type="checkbox" 
              checked={freeze} 
              onChange={e => {
                setFreezeState(e.target.checked);
                gameBus.emit('toggle_freeze', e.target.checked);
              }} 
            /> Freeze Rats
          </label>
        </div>
        <div className="debug-control">
          <label>
            <input 
              type="checkbox" 
              checked={showFPS} 
              onChange={e => {
                setShowFPS(e.target.checked);
                gameBus.emit('toggle_fps', e.target.checked);
              }} 
            /> Show FPS/Perf
          </label>
        </div>
        <div className="debug-control" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="audio-btn" style={{ borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }} onClick={() => gameBus.emit('open_music_editor')}>
            Music Editor
          </button>
          <button className="audio-btn" style={{ borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }} onClick={() => gameBus.emit('open_map_editor')}>
            Map Editor
          </button>
          <button className="audio-btn" style={{ borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)' }} onClick={() => gameBus.emit('open_asset_manager')}>
            Asset Manager
          </button>
          <button className="audio-btn" style={{ borderColor: 'var(--neon-yellow)', color: 'var(--neon-yellow)' }} onClick={() => gameBus.emit('open_sprite_creator')}>
            🖌️ SPRITE CREATOR
          </button>
        </div>
        <hr />
        <div className="debug-stat">Rat Speed: <span>{Math.round(gameState.ratSpeed)}</span></div>
        <div className="debug-stat">Player Speed: <span>{gameState.playerSpeed}</span></div>
        <div className="debug-stat">Uncollected: <span>{gameState.uncollected}</span></div>
        <div className="debug-stat">State: <span>{gameState.state}</span></div>
      </div>
    </div>
  );
}
