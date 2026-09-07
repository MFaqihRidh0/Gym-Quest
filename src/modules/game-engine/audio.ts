/**
 * Audio Engine berbasis Web Audio API 100% browser-native:
 * Tidak memerlukan unduhan file mp3 eksternal, bebas lag, zero latency,
 * dan berjalan konsisten di semua browser modern.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private isMuted = false;
  private isBgmPlaying = false;
  private currentStep = 0;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  get muted() {
    return this.isMuted;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ctx) {
      this.stopBgm();
    } else if (!muted && this.isBgmPlaying) {
      this.startBgm();
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /** Efek suara saat tertabrak penghalang (hantaman crunchy + bass drop) */
  playHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);

    // Bass drop impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  /** Efek saat melewati rintangan / dapat poin */
  playPoint() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880, t + 0.06); // A5

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** Efek saat menyelesaikan 1 repetisi (bonus rep) - nada kemenangan */
  playRepBonus() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const noteTime = t + i * 0.07;
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    });
  }

  /** Efek lompat kangguru */
  playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.15);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Efek Game Over */
  playGameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 392, 349, 293]; // A G F D
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const noteTime = t + i * 0.14;
      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  }

  /**
   * Musik Latar Energik (Cyberpunk / Synthwave Beat):
   * Loop 16-step bassline + synth arpeggio + drum kick tempo 130 BPM
   */
  startBgm() {
    this.isBgmPlaying = true;
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.bgmInterval !== null) return;

    // Nada Bassline Cyberpunk (A minor / F / C / G)
    const bassline = [
      110, 0, 110, 110, 87.31, 0, 87.31, 87.31,
      130.81, 0, 130.81, 130.81, 98, 0, 98, 123.47
    ];

    // Nada Arpeggio Synth Lead
    const leadNotes = [
      440, 523.25, 659.25, 880, 659.25, 523.25, 440, 523.25,
      349.23, 440, 523.25, 698.46, 523.25, 440, 392, 493.88
    ];

    const stepDurationMs = (60 / 130 / 4) * 1000; // 16th note at 130 BPM (~115ms)
    this.currentStep = 0;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const step = this.currentStep % 16;
      this.currentStep++;

      // 1. Kick Drum pada beat 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.08);
        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(t);
        kickOsc.stop(t + 0.09);
      }

      // 2. Hi-hat pada tiap offbeat (2, 6, 10, 14)
      if (step % 2 === 1) {
        const hhOsc = this.ctx.createOscillator();
        const hhGain = this.ctx.createGain();
        hhOsc.type = 'highpass' as unknown as OscillatorType;
        hhOsc.frequency.setValueAtTime(4500, t);
        hhGain.gain.setValueAtTime(0.05, t);
        hhGain.gain.exponentialRampToValueAtTime(0.005, t + 0.04);
        hhOsc.connect(hhGain);
        hhGain.connect(this.ctx.destination);
        hhOsc.start(t);
        hhOsc.stop(t + 0.04);
      }

      // 3. Bass Synth
      const bassFreq = bassline[step];
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(650, t);
        bassFilter.frequency.exponentialRampToValueAtTime(200, t + 0.1);

        bassGain.gain.setValueAtTime(0.18, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(t);
        bassOsc.stop(t + 0.1);
      }

      // 4. Melodic Arp Lead
      const leadFreq = leadNotes[step];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();

        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        leadGain.gain.setValueAtTime(0.06, t);
        leadGain.gain.exponentialRampToValueAtTime(0.005, t + 0.1);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(t);
        leadOsc.stop(t + 0.1);
      }
    }, stepDurationMs);
  }

  /** Suara hitung mundur 3, 2, 1 atau GO! */
  playBeep(isFinal = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, t); // A5 untuk GO!, A4 untuk 3-2-1

    gain.gain.setValueAtTime(isFinal ? 0.25 : 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + (isFinal ? 0.4 : 0.18));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + (isFinal ? 0.4 : 0.18));
  }

  /** Suara pergantian gerakan / masuk fase istirahat */
  playRestTransition() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, t); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.15); // E5

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /** Suara kemenangan saat seluruh sesi latihan selesai */
  playWorkoutComplete() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [
      [523.25, 659.25, 783.99], // C Major
      [587.33, 739.99, 880.0],  // D Major
      [659.25, 830.61, 987.77], // E Major
      [1046.5, 1318.5, 1567.98], // High C Major fanfare
    ];

    chords.forEach((chord, stepIdx) => {
      const stepTime = t + stepIdx * 0.18;
      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.12, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.005, stepTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(stepTime);
        osc.stop(stepTime + 0.4);
      });
    });
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
