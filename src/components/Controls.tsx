interface ControlsProps {
  isAudioOn: boolean;
  handleAudioToggle: () => void;
  bgmVol: number;
  handleBgmChange: (val: number) => void;
  sfxVol: number;
  handleSfxChange: (val: number) => void;
}

export default function Controls({
  isAudioOn,
  handleAudioToggle,
  bgmVol,
  handleBgmChange,
  sfxVol,
  handleSfxChange
}: ControlsProps) {
  return (
    <div className="controls-hint">
      <p><strong>ARROWS / WASD:</strong> Move</p>
      <p><strong>SPACE:</strong> Drop Trap</p>
      <p><strong>R:</strong> Restart Game</p>
      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
      <button className={`audio-btn ${!isAudioOn ? 'off' : ''}`} onClick={handleAudioToggle}>
        {isAudioOn ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
      </button>
      <div style={{ marginTop: '10px' }}>
        <label style={{ color: '#555', fontSize: '0.7rem', display: 'block' }}>MUSIC VOL: {Math.round(bgmVol * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={bgmVol} onChange={e => handleBgmChange(parseFloat(e.target.value))} style={{ width: '100%' }} />
        <label style={{ color: '#555', fontSize: '0.7rem', display: 'block', marginTop: '5px' }}>SFX VOL: {Math.round(sfxVol * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={sfxVol} onChange={e => handleSfxChange(parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
