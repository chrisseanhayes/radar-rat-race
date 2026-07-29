import { playInstrument, NOTE_FREQS } from './audio';
import { gameBus } from './EventBus';

export interface AudioTrack {
  musicData: (string | null)[];
  tempoBPM: number;
  instrument: string;
}

export const defaultTracks: Record<string, AudioTrack> = {
  bgm: {
    tempoBPM: 166,
    instrument: 'piano',
    musicData: Array(96).fill(null)
  },
  sfx_die: {
    tempoBPM: 140,
    instrument: 'retro',
    musicData: Array(24).fill(null)
  },
  sfx_turn: {
    tempoBPM: 400,
    instrument: 'retro',
    musicData: Array(12).fill(null)
  },
  sfx_walk: {
    tempoBPM: 400,
    instrument: 'kick',
    musicData: Array(12).fill(null)
  },
  sfx_gameover: {
    tempoBPM: 120,
    instrument: 'piano',
    musicData: Array(48).fill(null)
  },
  sfx_eat: {
    tempoBPM: 300,
    instrument: 'retro',
    musicData: Array(12).fill(null)
  },
  sfx_star: {
    tempoBPM: 150,
    instrument: 'piano',
    musicData: Array(24).fill(null)
  },
  sfx_victory: {
    tempoBPM: 160,
    instrument: 'trombone',
    musicData: Array(48).fill(null)
  },
  sfx_trap: {
    tempoBPM: 200,
    instrument: 'snare',
    musicData: Array(12).fill(null)
  }
};

function fill(track: AudioTrack, start: number, len: number, note: string) {
  track.musicData[start] = note;
  for (let i = 1; i < len - 1; i++) track.musicData[start + i] = "~" + note;
}

// Populate defaults
fill(defaultTracks.bgm, 0, 6, 'E4'); fill(defaultTracks.bgm, 6, 6, 'D4'); fill(defaultTracks.bgm, 12, 12, 'C4');
fill(defaultTracks.bgm, 24, 6, 'E4'); fill(defaultTracks.bgm, 30, 6, 'D4'); fill(defaultTracks.bgm, 36, 12, 'C4');
fill(defaultTracks.bgm, 48, 4, 'G4'); fill(defaultTracks.bgm, 52, 2, 'F4'); fill(defaultTracks.bgm, 54, 2, 'F4'); fill(defaultTracks.bgm, 56, 4, 'E4');
fill(defaultTracks.bgm, 60, 4, 'G4'); fill(defaultTracks.bgm, 64, 2, 'F4'); fill(defaultTracks.bgm, 66, 2, 'F4'); fill(defaultTracks.bgm, 68, 4, 'E4');
fill(defaultTracks.bgm, 72, 2, 'G4'); fill(defaultTracks.bgm, 74, 2, 'C5'); fill(defaultTracks.bgm, 76, 2, 'C5'); 
fill(defaultTracks.bgm, 78, 2, 'C5'); fill(defaultTracks.bgm, 80, 2, 'B4'); fill(defaultTracks.bgm, 82, 2, 'C5');
fill(defaultTracks.bgm, 84, 4, 'D5'); fill(defaultTracks.bgm, 88, 2, 'B4'); fill(defaultTracks.bgm, 90, 6, 'G4');

fill(defaultTracks.sfx_die, 0, 4, 'D4'); fill(defaultTracks.sfx_die, 4, 4, 'C#4'); fill(defaultTracks.sfx_die, 8, 4, 'C4'); fill(defaultTracks.sfx_die, 12, 12, 'B3');
fill(defaultTracks.sfx_turn, 0, 1, 'C6'); fill(defaultTracks.sfx_turn, 1, 1, 'B5'); fill(defaultTracks.sfx_turn, 2, 1, 'A#5'); fill(defaultTracks.sfx_turn, 3, 1, 'A5');
fill(defaultTracks.sfx_walk, 0, 2, 'C2');
fill(defaultTracks.sfx_gameover, 0, 4, 'C4'); fill(defaultTracks.sfx_gameover, 4, 4, 'G3'); fill(defaultTracks.sfx_gameover, 8, 16, 'C3');
fill(defaultTracks.sfx_eat, 0, 1, 'C3'); fill(defaultTracks.sfx_eat, 1, 1, 'G3'); fill(defaultTracks.sfx_eat, 2, 1, 'C3'); fill(defaultTracks.sfx_eat, 3, 1, 'G3');
fill(defaultTracks.sfx_star, 0, 2, 'G4'); fill(defaultTracks.sfx_star, 4, 2, 'C5'); fill(defaultTracks.sfx_star, 8, 4, 'E5');
fill(defaultTracks.sfx_victory, 0, 4, 'C4'); fill(defaultTracks.sfx_victory, 4, 4, 'E4'); fill(defaultTracks.sfx_victory, 8, 8, 'G4'); fill(defaultTracks.sfx_victory, 16, 4, 'E4'); fill(defaultTracks.sfx_victory, 20, 12, 'C5');
fill(defaultTracks.sfx_trap, 0, 1, 'C4');

let liveTracks: Record<string, AudioTrack> = {};

export function getLiveTracks() {
  return liveTracks;
}

export async function initAudioSystem() {
  // Merge missing defaults first
  for (const [k, v] of Object.entries(defaultTracks)) {
    liveTracks[k] = JSON.parse(JSON.stringify(v));
  }

  // Load from serialized files
  try {
    const listRes = await fetch('/api/list-tracks');
    if (listRes.ok) {
      const trackIds = await listRes.json();
      if (trackIds.length === 0) {
        for (const [id, track] of Object.entries(defaultTracks)) {
          liveTracks[id] = JSON.parse(JSON.stringify(track));
          fetch('/api/save-track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, track: liveTracks[id] })
          });
        }
      } else {
        for (const id of trackIds) {
          const tRes = await fetch(`/assets/tracks/${id}.json`);
          if (tRes.ok) {
            liveTracks[id] = await tRes.json();
          }
        }
      }
    }
  } catch(e) {}
}

export function getTrack(id: string) {
  return liveTracks[id];
}

export function saveTrack(id: string, track: AudioTrack) {
  liveTracks[id] = JSON.parse(JSON.stringify(track));
  return fetch('/api/save-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, track })
  });
}

class TrackPlayer {
  id: string;
  currentStep = 0;
  timeoutId: number = 0;
  isPlaying = false;
  
  constructor(id: string) { this.id = id; }
  
  play(loop = false) {
    this.stop();
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNext(loop);
  }
  
  scheduleNext(loop: boolean) {
    if (!this.isPlaying) return;
    const track = liveTracks[this.id];
    if (!track) return;
    
    if (this.currentStep >= track.musicData.length) {
      if (loop) {
        this.currentStep = 0;
      } else {
        this.isPlaying = false;
        return;
      }
    }
    
    const val = track.musicData[this.currentStep];
    const sixteenthNoteTime = Math.floor(60000 / (4 * track.tempoBPM));
    
    if (val && !val.startsWith('~')) {
      const pitch = val;
      let holdSteps = 1;
      for (let i = this.currentStep + 1; i < track.musicData.length; i++) {
        if (track.musicData[i] === "~" + pitch) holdSteps++;
        else break;
      }
      
      const freq = NOTE_FREQS[pitch];
      if (freq) {
        const durationMs = holdSteps * sixteenthNoteTime;
        playInstrument(track.instrument, freq, (durationMs / 1000) * 0.9, 0.05, loop);
      }
    }
    
    this.currentStep++;
    this.timeoutId = window.setTimeout(() => this.scheduleNext(loop), sixteenthNoteTime);
  }
  
  stop() {
    this.isPlaying = false;
    window.clearTimeout(this.timeoutId);
  }
}

const players: Record<string, TrackPlayer> = {};

export function playTrack(id: string, loop = false) {
  if (!players[id]) players[id] = new TrackPlayer(id);
  players[id].play(loop);
}

export function stopTrack(id: string) {
  if (players[id]) players[id].stop();
}

export function stopAllTracks() {
  for (const p of Object.values(players)) {
    p.stop();
  }
}

// Bind to event bus for decoupled audio triggering
gameBus.on('play_track', (payload: { id: string, loop?: boolean }) => {
  playTrack(payload.id, payload.loop || false);
});

gameBus.on('stop_all_tracks', () => {
  stopAllTracks();
});
