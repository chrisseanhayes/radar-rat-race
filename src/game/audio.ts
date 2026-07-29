export const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
export let audioCtx: AudioContext | null = null;
export let audioEnabled = true;
export let bgmVolume = 0.5;
export let sfxVolume = 0.5;

export function setBgmVolume(v: number) { bgmVolume = v; }
export function setSfxVolume(v: number) { sfxVolume = v; }

export const NOTE_FREQS: Record<string, number> = {
  'C6': 1046.50, 'B5': 987.77, 'A#5': 932.33, 'A5': 880.00, 'G#5': 830.61, 'G5': 783.99, 'F#5': 739.99, 'F5': 698.46, 'E5': 659.25, 'D#5': 622.25,
  'D5': 587.33, 'C#5': 554.37, 'C5': 523.25, 'B4': 493.88, 'A#4': 466.16, 'A4': 440.00, 'G#4': 415.30, 
  'G4': 392.00, 'F#4': 369.99, 'F4': 349.23, 'E4': 329.63, 'D#4': 311.13, 
  'D4': 293.66, 'C#4': 277.18, 'C4': 261.63,
  'B3': 246.94, 'A#3': 233.08, 'A3': 220.00, 'G#3': 207.65, 'G3': 196.00,
  'F#3': 185.00, 'F3': 174.61, 'E3': 164.81, 'D#3': 155.56, 'D3': 146.83,
  'C#3': 138.59, 'C3': 130.81, 'C2': 65.41
};
export const NOTE_NAMES = Object.keys(NOTE_FREQS);

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
}

export function setAudioEnabled(val: boolean) {
  audioEnabled = val;
}

export function playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
  if (!audioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playInstrument(instrument: string, freq: number, duration: number, baseVol = 0.1, isBgm = false) {
  if (!audioEnabled || !audioCtx) return;
  const vol = baseVol * (isBgm ? bgmVolume : sfxVolume);
  const ctx = audioCtx;
  const t = ctx.currentTime;
  
  if (instrument === 'snare') {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 1.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration * 0.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
    return;
  }
  
  if (instrument === 'kick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    gain.gain.setValueAtTime(vol * 1.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
    return;
  }
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  if (instrument === 'piano') {
    osc.type = 'triangle';
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  } else if (instrument === 'retro') {
    osc.type = 'square';
    gain.gain.setValueAtTime(vol * 0.5, t);
    gain.gain.setValueAtTime(vol * 0.5, t + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  } else if (instrument === 'trombone') {
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(vol * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(2000, t + 0.1);
    filter.frequency.linearRampToValueAtTime(400, t + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(freq, t);
    osc.start(t);
    osc.stop(t + duration);
    return;
  } else {
    osc.type = 'square';
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  }
  
  osc.frequency.setValueAtTime(freq, t);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}
