import { useState, useEffect } from 'react';
import { gameBus } from '../../game/EventBus';
import './mapEditor.css';

export default function MapEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [mapData, setMapData] = useState<number[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'add' | 'remove' | 'player' | 'enemy'>('add');
  const [brushSize, setBrushSize] = useState(1);
  
  useEffect(() => {
    const unsubOpen = gameBus.on('open_map_editor', () => {
      setIsOpen(true);
      gameBus.emit('request_map_data');
    });
    
    const unsubMap = gameBus.on('map_data', (data: number[][]) => {
      setMapData(data.map(row => [...row]));
    });

    return () => {
      unsubOpen();
      unsubMap();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      gameBus.emit('dialog_open');
    } else {
      gameBus.emit('dialog_close');
    }
  }, [isOpen]);

  // Fallback to request map if opened and data is empty
  useEffect(() => {
    if (isOpen && mapData.length === 0) {
      gameBus.emit('request_map_data');
    }
  }, [isOpen, mapData.length]);

  // Global mouse up to end drawing
  useEffect(() => {
    const handleMouseUp = () => setIsDrawing(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  if (!isOpen) return null;

  const applyTool = (centerX: number, centerY: number) => {
    const newValue = currentTool === 'add' ? 1 : currentTool === 'remove' ? 0 : currentTool === 'player' ? 2 : 3;
    const effectiveBrushSize = (currentTool === 'player' || currentTool === 'enemy') ? 1 : brushSize;
    const offset = Math.floor(effectiveBrushSize / 2);
    
    let hasChanges = false;
    let newMap = mapData;

    if (newValue === 2) {
      for (let y = 0; y < newMap.length; y++) {
        for (let x = 0; x < newMap[y].length; x++) {
          if (newMap[y][x] === 2) {
            if (!hasChanges) {
              newMap = mapData.map(row => [...row]);
              hasChanges = true;
            }
            newMap[y][x] = 0;
            gameBus.emit('update_map_tile', {x, y, value: 0});
          }
        }
      }
    }
    
    for (let y = centerY - offset; y <= centerY + offset; y++) {
      for (let x = centerX - offset; x <= centerX + offset; x++) {
        // bounds check, don't allow modifying borders
        if (x <= 1 || x >= 35 || y <= 1 || y >= 25) continue;
        
        if (newMap[y][x] !== newValue) {
          if (!hasChanges) {
            newMap = mapData.map(row => [...row]);
            hasChanges = true;
          }
          newMap[y][x] = newValue;
          gameBus.emit('update_map_tile', {x, y, value: newValue});
        }
      }
    }
    
    if (hasChanges) {
      setMapData(newMap);
    }
  };

  const handlePointerDown = (x: number, y: number) => {
    setIsDrawing(true);
    applyTool(x, y);
  };

  const handlePointerEnter = (x: number, y: number) => {
    if (isDrawing && currentTool !== 'player') {
      applyTool(x, y);
    }
  };

  const handleExport = async () => {
    const btn = document.getElementById('saveMapBtn');
    const oldText = btn?.innerText || 'Save to Asset';
    if (btn) btn.innerText = 'Saving...';
    try {
      await fetch('/api/save-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapData)
      });
      if (btn) btn.innerText = 'Saved!';
    } catch (err) {
      if (btn) btn.innerText = 'Error!';
    }
    setTimeout(() => {
      if (btn) btn.innerText = oldText;
    }, 2000);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-content map-editor-modal">
        <div className="modal-header">
          <h2>MAP CREATOR</h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>
        
        <div className="toolbar" style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '10px 0', alignItems: 'center' }}>
          <button 
            className="audio-btn"
            onClick={() => setCurrentTool('add')}
            style={{ 
              borderColor: currentTool === 'add' ? '#00FF66' : '#555', 
              color: currentTool === 'add' ? '#00FF66' : '#555',
              borderWidth: currentTool === 'add' ? '2px' : '1px'
            }}
          >🧱 Wall Brick</button>
          <button 
            className="audio-btn"
            onClick={() => setCurrentTool('remove')}
            style={{ 
              borderColor: currentTool === 'remove' ? '#FF007F' : '#555', 
              color: currentTool === 'remove' ? '#FF007F' : '#555',
              borderWidth: currentTool === 'remove' ? '2px' : '1px'
            }}
          >🧹 Eraser</button>

          <button 
            className="audio-btn"
            onClick={() => setCurrentTool('player')}
            style={{ 
              borderColor: currentTool === 'player' ? '#00F0FF' : '#555', 
              color: currentTool === 'player' ? '#00F0FF' : '#555',
              borderWidth: currentTool === 'player' ? '2px' : '1px'
            }}
          >🤠 Player</button>
          <button 
            className="audio-btn"
            onClick={() => setCurrentTool('enemy')}
            style={{ 
              borderColor: currentTool === 'enemy' ? '#FF007F' : '#555', 
              color: currentTool === 'enemy' ? '#FF007F' : '#555',
              borderWidth: currentTool === 'enemy' ? '2px' : '1px'
            }}
          >🐀 Enemy</button>

          <span style={{ marginLeft: '20px', color: '#333' }}>Brush Size:</span>
          {[1, 3, 5].map(size => (
            <button
              key={size}
              className="audio-btn"
              onClick={() => setBrushSize(size)}
              style={{ 
                padding: '4px 8px',
                borderColor: brushSize === size ? '#00F0FF' : '#555', 
                color: brushSize === size ? '#00F0FF' : '#555',
                borderWidth: brushSize === size ? '2px' : '1px'
              }}
            >{size}x{size}</button>
          ))}
          
          <button id="saveMapBtn" className="audio-btn" onClick={handleExport} style={{ marginLeft: 'auto', borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)' }}>Save to Asset</button>
        </div>
        
        <div className="map-grid-container" onMouseLeave={() => setIsDrawing(false)}>
          <div className="map-grid">
            {mapData.map((row, y) => (
              <div key={y} className="map-row">
                {row.map((cell, x) => (
                  <div 
                    key={`${x}-${y}`} 
                    className={`map-cell ${cell === 1 ? 'wall' : cell === 2 ? 'player' : cell === 3 ? 'enemy' : 'empty'} ${x <= 1 || x >= 35 || y <= 1 || y >= 25 ? 'locked' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); handlePointerDown(x, y); }}
                    onMouseEnter={() => handlePointerEnter(x, y)}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-footer">
          <p>Click and drag to draw or erase walls. The game map updates in real-time!</p>
        </div>
      </div>
    </div>
  );
}
