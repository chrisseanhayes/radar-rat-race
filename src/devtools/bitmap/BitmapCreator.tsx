import React, { useState, useEffect } from 'react';
import { gameBus } from '../../game/EventBus';
import './bitmapCreator.css';

export default function BitmapCreator() {
  const [isOpen, setIsOpen] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [isEraser, setIsEraser] = useState(false);
  const width = 32;
  const height = 32;
  const [pixels, setPixels] = useState<string[]>(Array(width * height).fill(''));
  const [isDrawing, setIsDrawing] = useState(false);
  const [spriteName, setSpriteName] = useState('sprite1');
  const [saveStatus, setSaveStatus] = useState('Save Sprite');
  const [availableSprites, setAvailableSprites] = useState<string[]>([]);

  useEffect(() => {
    const unsub = gameBus.on('open_sprite_creator', () => setIsOpen(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      gameBus.emit('dialog_open');
      fetch('/api/list-sprites')
        .then(res => res.json())
        .then(data => setAvailableSprites(data))
        .catch(err => console.error(err));
    } else {
      gameBus.emit('dialog_close');
    }
  }, [isOpen]);
  
  const handleMouseDown = (i: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent drag artifacts
    setIsDrawing(true);
    updatePixel(i);
  };

  const handleMouseEnter = (i: number, e: React.MouseEvent) => {
    if (isDrawing) {
      if (e.buttons === 1) { // Left click
        updatePixel(i);
      } else {
        setIsDrawing(false); // In case they let go outside the window
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const updatePixel = (i: number) => {
    setPixels(prev => {
      const next = [...prev];
      next[i] = isEraser ? '' : color;
      return next;
    });
  };

  const clearCanvas = () => {
    if (window.confirm('Clear the entire canvas?')) {
      setPixels(Array(width * height).fill(''));
    }
  };

  const rotateCanvas = () => {
    setPixels(prev => {
      const next = Array(width * height).fill('');
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const oldIndex = y * width + x;
          const newX = height - 1 - y;
          const newY = x;
          const newIndex = newY * width + newX;
          next[newIndex] = prev[oldIndex];
        }
      }
      return next;
    });
  };

  const saveSprite = async () => {
    if (!spriteName.trim()) {
      alert("Please provide a name for your sprite.");
      return;
    }
    setSaveStatus('Saving...');
    try {
      const res = await fetch('/api/save-sprite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: spriteName, width, height, pixels })
      });
      if (res.ok) {
        setSaveStatus('Saved!');
      } else {
        setSaveStatus('Error!');
      }
    } catch (e) {
      setSaveStatus('Error!');
    }
    setTimeout(() => setSaveStatus('Save Sprite'), 2000);
  };

  const loadSprite = async (name: string) => {
    if (!name) return;
    try {
      const res = await fetch(`/assets/sprites/${name}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data.pixels) {
          setPixels(data.pixels);
          setSpriteName(name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const colors = [
    '#000000', '#ffffff', '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6b81', '#3742fa',
    '#57606f', '#a4b0be', '#c23616', '#e1b12c', '#009432', '#8c7ae6', '#0984e3', '#2f3542'
  ];

  return (
    <>
      <div className={`bitmap-creator-overlay ${isOpen ? 'visible' : ''}`} onClick={() => setIsOpen(false)}>
        <div className="bitmap-creator-window" onClick={e => e.stopPropagation()} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <div className="bc-header">
            <h3>🖌️ Sprite Creator (32x32)</h3>
            <button className="bc-close" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="bc-body">
            <div className="bc-sidebar">
              <div>
                <h4>Palette</h4>
                <div className="bc-colors">
                  {colors.map(c => (
                    <div 
                      key={c} 
                      className={`bc-color-swatch ${(color === c && !isEraser) ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => { setColor(c); setIsEraser(false); }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4>Custom Color</h4>
                <div className="bc-custom-color">
                  <input 
                    type="color" 
                    value={color} 
                    onChange={e => { setColor(e.target.value); setIsEraser(false); }} 
                  />
                </div>
              </div>

              <div>
                <h4>Tools</h4>
                <div className="bc-tools">
                  <button 
                    className={`bc-btn ${!isEraser ? 'active' : ''}`} 
                    onClick={() => setIsEraser(false)}
                  >
                    Draw
                  </button>
                  <button 
                    className={`bc-btn ${isEraser ? 'active' : ''}`} 
                    onClick={() => setIsEraser(true)}
                  >
                    Erase
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button className="bc-btn" style={{ width: '100%' }} onClick={rotateCanvas}>
                    Rotate 90°
                  </button>
                  <button className="bc-btn" style={{ width: '100%' }} onClick={clearCanvas}>
                    Clear
                  </button>
                </div>
              </div>
              
              <div style={{ flex: 1 }}></div>

              <div className="bc-save-section">
                <h4>Load / Export</h4>
                {availableSprites.length > 0 && (
                  <select 
                    className="bc-input" 
                    onChange={e => loadSprite(e.target.value)}
                    value={availableSprites.includes(spriteName) ? spriteName : ''}
                  >
                    <option value="" disabled>-- Load Sprite --</option>
                    {availableSprites.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
                <input 
                  type="text" 
                  value={spriteName} 
                  onChange={e => setSpriteName(e.target.value)} 
                  placeholder="Sprite Name" 
                  className="bc-input"
                />
                <button className="bc-btn save" style={{width: '100%'}} onClick={saveSprite}>
                  {saveStatus}
                </button>
              </div>
            </div>

            <div className="bc-canvas-container">
              <div className="bc-grid-wrapper">
                <div 
                  className="bc-grid" 
                  style={{ 
                    gridTemplateColumns: `repeat(${width}, 1fr)`,
                    gridTemplateRows: `repeat(${height}, 1fr)`
                  }}
                  onMouseLeave={handleMouseUp}
                >
                  {pixels.map((p, i) => (
                    <div 
                      key={i} 
                      className="bc-pixel" 
                      style={{ backgroundColor: p || 'transparent' }}
                      onMouseDown={(e) => handleMouseDown(i, e)}
                      onMouseEnter={(e) => handleMouseEnter(i, e)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
