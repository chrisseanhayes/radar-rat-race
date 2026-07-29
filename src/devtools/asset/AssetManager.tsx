import { useState, useEffect } from 'react';
import { gameBus } from '../../game/EventBus';
import { gameData } from '../../game/GameAssets';
import type { GameData } from '../../game/GameAssets';
import { getLiveTracks } from '../../game/AudioSystem';
import { initAudio } from '../../game/audio';

export default function AssetManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<GameData | null>(null);
  const [tracks, setTracks] = useState<string[]>([]);
  const [mapPreview, setMapPreview] = useState<number[][] | null>(null);

  useEffect(() => {
    const unsub = gameBus.on('open_asset_manager', () => {
      setData(JSON.parse(JSON.stringify(gameData)));
      setTracks(Object.keys(getLiveTracks()));
      setMapPreview(null);
      setIsOpen(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      gameBus.emit('dialog_open');
    } else {
      gameBus.emit('dialog_close');
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const handleSave = async () => {
    try {
      const btn = document.getElementById('saveAssetsBtn');
      if (btn) btn.innerText = 'Saving...';
      
      const res = await fetch('/api/save-gamedata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        gameData.events = data.events;
        gameData.levels = data.levels;
        if (btn) btn.innerText = 'Saved!';
      } else {
        if (btn) btn.innerText = 'Error';
      }
      setTimeout(() => { if (btn) btn.innerText = 'SAVE ASSETS'; }, 2000);
    } catch(e) {}
  };

  const handleEventChange = (evtKey: string, trackId: string) => {
    setData(prev => {
      if(!prev) return prev;
      return { ...prev, events: { ...prev.events, [evtKey]: trackId } };
    });
  };

  const handleLevelChange = (idx: number, val: string) => {
    setData(prev => {
      if(!prev) return prev;
      const newLevels = [...prev.levels];
      newLevels[idx] = val;
      return { ...prev, levels: newLevels };
    });
  };

  const handlePlaySound = (trackId: string) => {
    initAudio();
    gameBus.emit('stop_all_tracks');
    if (trackId) gameBus.emit('play_track', { id: trackId, loop: false });
  };

  const handlePreviewMap = async (lvl: string) => {
    if (mapPreview) {
      setMapPreview(null);
      return;
    }
    try {
      const res = await fetch('/assets/' + lvl);
      if (res.ok) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          setMapPreview(parsed);
        } catch(e) {
          alert('Failed to preview: Map file not found or invalid.');
        }
      }
    } catch(e) {}
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ width: '650px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--panel-bg)', padding: '20px', borderRadius: '0', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
        <div className="modal-header">
          <h2 style={{color: 'var(--neon-pink)'}}>ASSET MANAGER</h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>
        
        <div style={{ margin: '20px 0' }}>
          <h3 style={{ color: 'var(--neon-yellow)', marginBottom: '10px', fontSize: '1rem' }}>Sound Events</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {Object.keys(data.events).map(evt => (
              <div key={evt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#333', fontSize: '0.8rem', width: '90px' }}>{evt.toUpperCase()}</span>
                <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <select 
                    className="audio-btn" 
                    style={{ flexGrow: 1, width: '100%', padding: '4px' }}
                    value={data.events[evt]}
                    onChange={e => handleEventChange(evt, e.target.value)}
                  >
                    <option value="">(None)</option>
                    {tracks.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button 
                    className="audio-btn" 
                    style={{ width: '30px', padding: '2px', marginLeft: '5px', borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)', flexShrink: 0 }}
                    onClick={() => handlePlaySound(data.events[evt])}
                  >▶</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ margin: '20px 0' }}>
          <h3 style={{ color: 'var(--neon-yellow)', marginBottom: '10px', fontSize: '1rem' }}>Levels</h3>
          {data.levels.map((lvl, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
              <span style={{ color: '#333', fontSize: '0.8rem', lineHeight: '30px' }}>Level {i+1}</span>
              <input 
                className="audio-btn" 
                style={{ flexGrow: 1, padding: '4px' }} 
                value={lvl} 
                onChange={e => handleLevelChange(i, e.target.value)}
              />
              <button 
                className="audio-btn" 
                style={{ width: '40px', padding: '2px', borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}
                onClick={() => handlePreviewMap(lvl)}
              >👁️</button>
            </div>
          ))}
          {mapPreview && (
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mapPreview[0].length}, 4px)`, gap: '1px', backgroundColor: '#f0f0f5', padding: '5px', border: '1px solid #ccc' }}>
                {mapPreview.flatMap((row, y) => row.map((cell, x) => (
                  <div key={`${x}-${y}`} style={{ 
                    width: '4px', height: '4px', 
                    backgroundColor: cell === 1 ? '#a3b19b' : cell === 2 ? 'var(--neon-blue)' : cell === 3 ? 'var(--neon-pink)' : '#999999' 
                  }} />
                )))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button id="saveAssetsBtn" className="audio-btn" style={{ borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }} onClick={handleSave}>
            SAVE ASSETS
          </button>
        </div>
      </div>
    </div>
  );
}
