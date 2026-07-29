import './musicEditor.css';
import musicEditorHtml from './musicEditor.html?raw';
import { audioCtx, initAudio, playInstrument } from '../../game/audio';
import { NOTE_FREQS, NOTE_NAMES } from '../../game/audio';
import { initAudioSystem, getTrack, saveTrack, defaultTracks } from '../../game/AudioSystem';
import { gameBus } from '../../game/EventBus';

export class MusicEditorComponent {
  musicData: (string | null)[] = Array(96).fill(null);
  tempoBPM = 166;
  sixteenthNoteTime = 90;
  musicTimeout: number = 0;
  currentStep = 0;
  editorPlaying = false;
  barClipboard: (string | null)[] | null = null;
  instrument = 'piano';
  currentTrackId = 'bgm';
  containerNode: HTMLElement;

  constructor(containerNode: HTMLElement) {
    this.containerNode = containerNode;
    
    // Inject HTML
    const container = document.createElement('div');
    container.innerHTML = musicEditorHtml;
    this.containerNode.appendChild(container);
    
    // We can await the init, or just wait for event loop since React mounts synchronously
    initAudioSystem().then(() => {
      this.loadTrack('bgm');
      this.bindEvents();
      this.updateBarSelects();
      this.buildPianoRoll();
      this.renderMusicData();
      this.playMusicLoop();
    });
  }

  loadTrack(id: string) {
    this.currentTrackId = id;
    const t = getTrack(id);
    if (t) {
      this.musicData = [...t.musicData];
      this.tempoBPM = t.tempoBPM;
      this.instrument = t.instrument;
      this.sixteenthNoteTime = Math.floor(60000 / (4 * this.tempoBPM));
    }
  }

  openEditor() {
    document.getElementById('musicModal')!.classList.remove('hidden');
    this.updateBarSelects();
    this.buildPianoRoll();
    this.renderMusicData();
  }

  bindEvents() {
    const musicModal = document.getElementById('musicModal')!;
    const closeMusicEditor = document.getElementById('closeMusicEditor')!;
    const playEditorBtn = document.getElementById('playEditorBtn')!;
    const navLeftBtn = document.getElementById('navLeftBtn')!;
    const navRightBtn = document.getElementById('navRightBtn')!;
    const saveMusicBtn = document.getElementById('saveMusicBtn')!;
    const resetMusicBtn = document.getElementById('resetMusicBtn')!;
    const tempoSlider = document.getElementById('tempoSlider') as HTMLInputElement;
    const tempoDisplay = document.getElementById('tempoDisplay')!;
    const copyBarBtn = document.getElementById('copyBarBtn')!;
    const pasteBarBtn = document.getElementById('pasteBarBtn')!;
    const addBarBtn = document.getElementById('addBarBtn')!;

    closeMusicEditor.addEventListener('click', () => {
      musicModal.classList.add('hidden');
      this.editorPlaying = false;
      playEditorBtn.innerText = '▶ PLAY';
      gameBus.emit('dialog_close');
    });

    playEditorBtn.addEventListener('click', () => {
      initAudio();
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume();
      }
      this.editorPlaying = !this.editorPlaying;
      playEditorBtn.innerText = this.editorPlaying ? '⏸ PAUSE' : '▶ PLAY';
    });

    if (tempoSlider) {
      tempoSlider.value = this.tempoBPM.toString();
      tempoDisplay.innerText = `${this.tempoBPM} BPM`;
      tempoSlider.addEventListener('input', () => {
        this.tempoBPM = parseInt(tempoSlider.value);
        this.sixteenthNoteTime = Math.floor(60000 / (4 * this.tempoBPM));
        tempoDisplay.innerText = `${this.tempoBPM} BPM`;
      });
    }

    const instrumentSelect = document.getElementById('instrumentSelect') as HTMLSelectElement;
    if (instrumentSelect) {
      instrumentSelect.value = this.instrument;
      instrumentSelect.addEventListener('change', () => {
        this.instrument = instrumentSelect.value;
      });
    }

    const trackSelect = document.getElementById('trackSelect') as HTMLSelectElement;
    if (trackSelect) {
      trackSelect.value = this.currentTrackId;
      trackSelect.addEventListener('change', () => {
        this.loadTrack(trackSelect.value);
        if (instrumentSelect) instrumentSelect.value = this.instrument;
        if (tempoSlider) tempoSlider.value = this.tempoBPM.toString();
        if (tempoDisplay) tempoDisplay.innerText = `${this.tempoBPM} BPM`;
        this.buildPianoRoll();
        this.renderMusicData();
        this.updateBarSelects();
      });
    }

    navLeftBtn.addEventListener('click', () => {
      document.querySelector('.piano-roll-container')?.scrollBy({ left: -324, behavior: 'smooth' });
    });

    navRightBtn.addEventListener('click', () => {
      document.querySelector('.piano-roll-container')?.scrollBy({ left: 324, behavior: 'smooth' });
    });

    saveMusicBtn.addEventListener('click', async () => {
      const oldText = saveMusicBtn.innerText;
      saveMusicBtn.innerText = 'SAVING...';
      
      try {
        const res = await saveTrack(this.currentTrackId, {
          musicData: this.musicData,
          tempoBPM: this.tempoBPM,
          instrument: this.instrument
        });
        
        if (res.ok) {
          saveMusicBtn.innerText = 'SAVED TO ASSETS!';
        } else {
          saveMusicBtn.innerText = 'ERROR!';
        }
      } catch (err) {
        console.error(err);
        saveMusicBtn.innerText = 'ERROR!';
      }

      setTimeout(() => saveMusicBtn.innerText = oldText, 2000);
    });

    addBarBtn.addEventListener('click', () => {
      for (let i = 0; i < 12; i++) this.musicData.push(null);
      this.updateBarSelects();
      this.buildPianoRoll();
      this.renderMusicData();
    });

    copyBarBtn.addEventListener('click', () => {
      const copyBarSelect = document.getElementById('copyBarSelect') as HTMLSelectElement;
      const barIdx = parseInt(copyBarSelect.value);
      const startStep = barIdx * 12;
      this.barClipboard = this.musicData.slice(startStep, startStep + 12);
      const old = copyBarBtn.innerText;
      copyBarBtn.innerText = 'COPIED!';
      setTimeout(() => copyBarBtn.innerText = old, 1000);
    });

    pasteBarBtn.addEventListener('click', () => {
      if (!this.barClipboard) {
        alert("Copy a bar first!");
        return;
      }
      const pasteBarSelect = document.getElementById('pasteBarSelect') as HTMLSelectElement;
      const barIdx = parseInt(pasteBarSelect.value);
      const startStep = barIdx * 12;
      for (let i = 0; i < 12; i++) {
        this.musicData[startStep + i] = this.barClipboard[i];
      }
      this.renderMusicData();
      const old = pasteBarBtn.innerText;
      pasteBarBtn.innerText = 'PASTED!';
      setTimeout(() => pasteBarBtn.innerText = old, 1000);
    });

    resetMusicBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to erase your work and reset to default?')) {
        const def = defaultTracks[this.currentTrackId];
        if (def) {
          this.musicData = [...def.musicData];
          this.tempoBPM = def.tempoBPM;
          this.instrument = def.instrument;
          saveTrack(this.currentTrackId, def);
          
          if (instrumentSelect) instrumentSelect.value = this.instrument;
          if (tempoSlider) tempoSlider.value = this.tempoBPM.toString();
          if (tempoDisplay) tempoDisplay.innerText = `${this.tempoBPM} BPM`;
          
          this.renderMusicData();
          this.updateBarSelects();
        }
      }
    });
  }

  updateBarSelects() {
    const copyBarSelect = document.getElementById('copyBarSelect') as HTMLSelectElement;
    const pasteBarSelect = document.getElementById('pasteBarSelect') as HTMLSelectElement;
    
    if (!copyBarSelect || !pasteBarSelect) return;
    
    const bars = this.musicData.length / 12;
    const cVal = copyBarSelect.value;
    const pVal = pasteBarSelect.value;
    
    copyBarSelect.innerHTML = '';
    pasteBarSelect.innerHTML = '';
    
    for(let i=0; i<bars; i++) {
      const opt = document.createElement('option');
      opt.value = i.toString();
      opt.innerText = (i+1).toString();
      copyBarSelect.appendChild(opt);
      pasteBarSelect.appendChild(opt.cloneNode(true));
    }
    
    if (cVal && parseInt(cVal) < bars) copyBarSelect.value = cVal;
    if (pVal && parseInt(pVal) < bars) pasteBarSelect.value = pVal;
  }

  buildPianoRoll() {
    const pianoRoll = document.getElementById('pianoRoll')!;
    if (!pianoRoll) return;
    
    pianoRoll.innerHTML = '';
    pianoRoll.style.gridTemplateColumns = `50px repeat(${this.musicData.length}, 25px)`;
    const spacer = document.createElement('div');
    spacer.className = 'pr-empty-corner';
    spacer.style.position = 'sticky';
    spacer.style.left = '0';
    spacer.style.zIndex = '10';
    spacer.style.background = 'var(--panel-bg)';
    pianoRoll.appendChild(spacer);
    
    for (let step=0; step<this.musicData.length; step++) {
      const head = document.createElement('div');
      head.className = 'pr-col-header';
      head.id = `pr-head-${step}`;
      
      if (step % 12 === 0) {
        head.innerText = ((step/12)+1).toString();
      } else if (step % 6 === 0) {
        head.innerText = '-';
      } else {
        head.innerText = '.';
      }
      
      head.addEventListener('click', () => {
        this.currentStep = step;
        this.updatePlayheadUI(this.currentStep);
      });
      
      pianoRoll.appendChild(head);
    }
    
    for (const note of NOTE_NAMES) {
      const label = document.createElement('div');
      label.className = 'pr-label';
      label.innerText = note;
      pianoRoll.appendChild(label);
      
      for (let step=0; step<this.musicData.length; step++) {
        const cell = document.createElement('div');
        cell.className = 'pr-cell';
        cell.id = `pr-cell-${note}-${step}`;
        
        if (step % 12 === 0 && step > 0) {
          cell.style.borderLeft = '2px solid rgba(255, 0, 127, 0.5)';
        } else if (step % 6 === 0 && step > 0) {
          cell.style.borderLeft = '1px solid rgba(255,255,255,0.1)';
        }
        
        cell.addEventListener('click', () => {
          const current = this.musicData[step];
          if (current === note) {
            this.musicData[step] = "~" + note; // Change to Hold
          } else if (current === "~" + note) {
            this.musicData[step] = null; // Change to Silent
          } else {
            this.musicData[step] = note; // Change to Trigger
          }
          this.renderMusicData();
        });
        pianoRoll.appendChild(cell);
      }
    }
  }

  renderMusicData() {
    document.querySelectorAll('.pr-cell').forEach(el => {
      el.classList.remove('active-trigger', 'active-hold');
    });
    for (let step=0; step<this.musicData.length; step++) {
      const val = this.musicData[step];
      if (val) {
        const isHold = val.startsWith('~');
        const pitch = isHold ? val.substring(1) : val;
        const cell = document.getElementById(`pr-cell-${pitch}-${step}`);
        if (cell) {
          if (isHold) cell.classList.add('active-hold');
          else cell.classList.add('active-trigger');
        }
      }
    }
  }

  updatePlayheadUI(step: number) {
    document.querySelectorAll('.pr-col-header.active-head').forEach(el => el.classList.remove('active-head'));
    const currentHead = document.getElementById(`pr-head-${step}`);
    if (currentHead) {
      currentHead.classList.add('active-head');
      
      if (this.editorPlaying) {
        const container = document.querySelector('.piano-roll-container') as HTMLElement;
        if (container) {
          const cRect = container.getBoundingClientRect();
          const hRect = currentHead.getBoundingClientRect();
          const visibleLeft = cRect.left + 50;
          
          if (hRect.right > cRect.right || hRect.left < visibleLeft) {
            container.scrollBy({ left: hRect.left - visibleLeft, behavior: 'auto' });
          }
        }
      }
    }
  }

  playMusicLoop = () => {
    if (this.editorPlaying) {
      const val = this.musicData[this.currentStep];
      if (val && !val.startsWith('~')) {
        const pitch = val;
        let holdSteps = 1;
        for (let i = this.currentStep + 1; i < this.musicData.length; i++) {
          if (this.musicData[i] === "~" + pitch) holdSteps++;
          else break;
        }
        
        const freq = NOTE_FREQS[pitch];
        const durationMs = holdSteps * this.sixteenthNoteTime;
        playInstrument(this.instrument, freq, (durationMs / 1000) * 0.9, 0.05); 
      }
      
      if (this.editorPlaying) {
        this.updatePlayheadUI(this.currentStep);
      }

      this.currentStep = (this.currentStep + 1) % this.musicData.length;
    }
    this.musicTimeout = window.setTimeout(this.playMusicLoop, this.sixteenthNoteTime);
  }

  cleanup() {
    if (this.musicTimeout) {
      window.clearTimeout(this.musicTimeout);
    }
  }
}
