// ============================================
// AUDIO MANAGER - Web Audio API Sound System
// ============================================

class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.isInitialized = false;
        this.isMuted = false;
        this.musicPlaying = false;
        this.musicNodes = [];

        // Volume levels (0-1)
        this.masterVolume = 0.7;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.6;
    }

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.isInitialized) return true;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes for volume control
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = this.masterVolume;

            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicVolume;

            this.sfxGain = this.context.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.sfxVolume;

            this.isInitialized = true;
            return true;
        } catch (e) {
            console.error('Failed to initialize Web Audio API:', e);
            return false;
        }
    }

    // Resume context if suspended (browser autoplay policy)
    async resume() {
        try {
            if (this.context && this.context.state === 'suspended') {
                await this.context.resume();
            }
        } catch (e) {
            console.error('Failed to resume audio context:', e);
        }
    }

    // Pause audio context
    async pause() {
        try {
            if (this.context && this.context.state === 'running') {
                await this.context.suspend();
            }
        } catch (e) {
            console.error('Failed to pause audio context:', e);
        }
    }

    // ============================================
    // SOUND EFFECTS
    // ============================================

    // Clover collection - positive chime (ascending arpeggio)
    playCloverCollect(isFourLeaf = false) {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;
        const duration = isFourLeaf ? 0.6 : 0.4;

        // Base frequencies for a pleasant major chord
        const baseFreq = isFourLeaf ? 523.25 : 440; // C5 or A4
        const frequencies = isFourLeaf
            ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2] // C-E-G-C (major chord + octave)
            : [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // A-C#-E (major chord)

        frequencies.forEach((freq, index) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            osc.connect(gain);
            gain.connect(this.sfxGain);

            const startTime = now + index * 0.08;
            const noteLength = 0.15;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength);

            osc.start(startTime);
            osc.stop(startTime + noteLength + 0.1);
        });

        // Add a sparkle effect for four-leaf clover
        if (isFourLeaf) {
            this.playSparkle(now + 0.3);
        }
    }

    // Sparkle effect for special items
    playSparkle(startTime) {
        for (let i = 0; i < 3; i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = 1500 + i * 500 + Math.random() * 200;

            osc.connect(gain);
            gain.connect(this.sfxGain);

            const noteStart = startTime + i * 0.05;
            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.1);

            osc.start(noteStart);
            osc.stop(noteStart + 0.15);
        }
    }

    // Ant hit - damage sound (low thud + dissonance)
    playAntHit() {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;

        // Low thud
        const thudOsc = this.context.createOscillator();
        const thudGain = this.context.createGain();

        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(150, now);
        thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

        thudOsc.connect(thudGain);
        thudGain.connect(this.sfxGain);

        thudGain.gain.setValueAtTime(0.5, now);
        thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        thudOsc.start(now);
        thudOsc.stop(now + 0.35);

        // Dissonant overtone
        const disOsc = this.context.createOscillator();
        const disGain = this.context.createGain();

        disOsc.type = 'sawtooth';
        disOsc.frequency.setValueAtTime(200, now);
        disOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

        disOsc.connect(disGain);
        disGain.connect(this.sfxGain);

        disGain.gain.setValueAtTime(0.2, now);
        disGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        disOsc.start(now);
        disOsc.stop(now + 0.25);

        // Noise burst for impact
        this.playNoiseBurst(now, 0.1, 0.15);
    }

    // Noise burst helper
    playNoiseBurst(startTime, duration, volume) {
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.context.createBufferSource();
        const noiseGain = this.context.createGain();

        noise.buffer = buffer;
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noiseGain.gain.setValueAtTime(volume, startTime);

        noise.start(startTime);
    }

    // Combo multiplier - escalating excitement (higher pitch for higher combos)
    playCombo(multiplier) {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;
        const intensity = Math.min(multiplier / 5, 1.5); // Cap intensity at 1.5x

        // Rising arpeggio that gets faster with higher combos
        const baseFreq = 440 * (1 + (multiplier - 2) * 0.2); // Increase pitch with combo
        const noteCount = Math.min(3 + multiplier, 6); // More notes for higher combos

        for (let i = 0; i < noteCount; i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = baseFreq * Math.pow(1.5, i / 2); // Musical intervals

            osc.connect(gain);
            gain.connect(this.sfxGain);

            const startTime = now + i * 0.05;
            const noteLength = 0.12;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25 * intensity, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength);

            osc.start(startTime);
            osc.stop(startTime + noteLength + 0.1);
        }

        // Add excitement with a quick sweep
        const sweepOsc = this.context.createOscillator();
        const sweepGain = this.context.createGain();

        sweepOsc.type = 'sawtooth';
        sweepOsc.frequency.setValueAtTime(baseFreq * 2, now);
        sweepOsc.frequency.exponentialRampToValueAtTime(baseFreq * 4, now + 0.15);

        sweepOsc.connect(sweepGain);
        sweepGain.connect(this.sfxGain);

        sweepGain.gain.setValueAtTime(0, now);
        sweepGain.gain.linearRampToValueAtTime(0.15 * intensity, now + 0.02);
        sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        sweepOsc.start(now);
        sweepOsc.stop(now + 0.2);
    }

    // Level up - triumphant ascending phrase
    playLevelUp() {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;

        // Ascending major scale phrase
        const notes = [
            { freq: 523.25, time: 0, dur: 0.15 },      // C5
            { freq: 587.33, time: 0.12, dur: 0.15 },   // D5
            { freq: 659.25, time: 0.24, dur: 0.15 },   // E5
            { freq: 783.99, time: 0.36, dur: 0.25 }    // G5 (hold longer)
        ];

        notes.forEach(note => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'triangle';
            osc.frequency.value = note.freq;

            osc.connect(gain);
            gain.connect(this.sfxGain);

            const startTime = now + note.time;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gain.gain.setValueAtTime(0.3, startTime + note.dur - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.1);
        });

        // Add celebratory chime
        this.playSparkle(now + 0.3);
        this.playSparkle(now + 0.4);
    }

    // UI click - short pleasant beep
    playUIClick() {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.value = 800;

        osc.connect(gain);
        gain.connect(this.sfxGain);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Pause sound - descending tone
    playPause() {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Resume sound - ascending tone
    playResume() {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Game over - sad descending tone
    playGameOver() {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;

        // Stop background music
        this.stopMusic();

        // Descending minor chord progression
        const notes = [
            { freq: 392, time: 0 },      // G4
            { freq: 349.23, time: 0.3 }, // F4
            { freq: 329.63, time: 0.6 }, // E4
            { freq: 293.66, time: 0.9 }, // D4
            { freq: 261.63, time: 1.2 }  // C4
        ];

        notes.forEach(note => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'triangle';
            osc.frequency.value = note.freq;

            // Add vibrato for emotional effect
            const vibrato = this.context.createOscillator();
            const vibratoGain = this.context.createGain();
            vibrato.type = 'sine';
            vibrato.frequency.value = 5;
            vibratoGain.gain.value = 3;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            const startTime = now + note.time;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            vibrato.start(startTime);
            vibrato.stop(startTime + 0.5);
            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });

        // Final low note
        const finalOsc = this.context.createOscillator();
        const finalGain = this.context.createGain();

        finalOsc.type = 'sine';
        finalOsc.frequency.value = 130.81; // C3

        finalOsc.connect(finalGain);
        finalGain.connect(this.sfxGain);

        const finalStart = now + 1.5;
        finalGain.gain.setValueAtTime(0, finalStart);
        finalGain.gain.linearRampToValueAtTime(0.4, finalStart + 0.1);
        finalGain.gain.exponentialRampToValueAtTime(0.01, finalStart + 1.5);

        finalOsc.start(finalStart);
        finalOsc.stop(finalStart + 1.6);
    }

    // Power-up collection - uplifting tone
    playPowerUp() {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;

        // Ascending major arpeggio with sparkle
        const notes = [
            { freq: 523.25, time: 0, dur: 0.12 },      // C5
            { freq: 659.25, time: 0.08, dur: 0.12 },   // E5
            { freq: 783.99, time: 0.16, dur: 0.2 }     // G5
        ];

        notes.forEach(note => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = note.freq;

            osc.connect(gain);
            gain.connect(this.sfxGain);

            const startTime = now + note.time;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.1);
        });

        // Add sparkle effect
        this.playSparkle(now + 0.15);
    }

    // Victory - triumphant ascending fanfare
    playVictory() {
        if (!this.isInitialized || this.isMuted) return;

        const now = this.context.currentTime;

        // Stop background music
        this.stopMusic();

        // Triumphant ascending fanfare (major scale to triumphant chord)
        const fanfare = [
            { freq: 523.25, time: 0, dur: 0.2 },      // C5
            { freq: 587.33, time: 0.15, dur: 0.2 },   // D5
            { freq: 659.25, time: 0.3, dur: 0.2 },    // E5
            { freq: 698.46, time: 0.45, dur: 0.2 },   // F5
            { freq: 783.99, time: 0.6, dur: 0.4 },    // G5
            { freq: 880, time: 0.9, dur: 0.6 }        // A5
        ];

        fanfare.forEach(note => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'square';
            osc.frequency.value = note.freq;

            osc.connect(gain);
            gain.connect(this.sfxGain);

            const startTime = now + note.time;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.setValueAtTime(0.2, startTime + note.dur - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.1);
        });

        // Final triumphant chord (C major with octave)
        const chordNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        const chordStart = now + 1.2;

        chordNotes.forEach((freq, index) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            osc.connect(gain);
            gain.connect(this.sfxGain);

            // Stagger slightly for richness
            const noteStart = chordStart + index * 0.03;
            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.05);
            gain.gain.setValueAtTime(0.25, noteStart + 1.0);
            gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 1.8);

            osc.start(noteStart);
            osc.stop(noteStart + 2);
        });

        // Add sparkle effects
        for (let i = 0; i < 5; i++) {
            this.playSparkle(now + 1.3 + i * 0.2);
        }
    }

    // ============================================
    // BACKGROUND MUSIC
    // ============================================

    // Start looping background music (procedural/synthesized)
    startMusic() {
        if (!this.isInitialized || this.musicPlaying) return;

        this.musicPlaying = true;
        this.playMusicLoop();
    }

    // Procedural music loop using oscillators
    playMusicLoop() {
        if (!this.musicPlaying || !this.isInitialized) return;

        const now = this.context.currentTime;
        const loopDuration = 8; // 8 second loop

        // Play all music layers
        this.playMusicChords(now);
        this.playMusicMelody(now);
        this.playMusicBass(now);

        // Schedule next loop
        setTimeout(() => {
            if (this.musicPlaying) {
                this.playMusicLoop();
            }
        }, (loopDuration - 0.1) * 1000);
    }

    // Play chord progression layer
    playMusicChords(now) {
        // Chord progression: C - Am - F - G (classic happy progression)
        const chords = [
            { notes: [261.63, 329.63, 392], start: 0 },      // C major
            { notes: [220, 261.63, 329.63], start: 2 },      // A minor
            { notes: [174.61, 220, 261.63], start: 4 },      // F major
            { notes: [196, 246.94, 293.66], start: 6 }       // G major
        ];

        chords.forEach(chord => {
            chord.notes.forEach(freq => {
                this.playChordNote(freq, now + chord.start, 1.8);
            });
        });
    }

    // Play a single chord note with detuning
    playChordNote(freq, startTime, duration) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        // Add subtle detuning for warmth
        const detune = this.context.createOscillator();
        const detuneGain = this.context.createGain();
        detune.type = 'sine';
        detune.frequency.value = freq * 1.005; // Slightly sharp
        detune.connect(detuneGain);
        detuneGain.connect(this.musicGain);
        detuneGain.gain.value = 0.15;

        osc.connect(gain);
        gain.connect(this.musicGain);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
        gain.gain.setValueAtTime(0.2, startTime + duration - 0.3);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        detuneGain.gain.setValueAtTime(0, startTime);
        detuneGain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
        detuneGain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
        detune.start(startTime);
        detune.stop(startTime + duration + 0.1);
    }

    // Play melodic line layer
    playMusicMelody(now) {
        const melody = [
            { freq: 523.25, start: 0, dur: 0.5 },    // C5
            { freq: 587.33, start: 0.5, dur: 0.5 },  // D5
            { freq: 659.25, start: 1, dur: 1 },      // E5
            { freq: 523.25, start: 2, dur: 0.5 },    // C5
            { freq: 493.88, start: 2.5, dur: 0.5 },  // B4
            { freq: 440, start: 3, dur: 1 },         // A4
            { freq: 392, start: 4, dur: 0.5 },       // G4
            { freq: 440, start: 4.5, dur: 0.5 },     // A4
            { freq: 523.25, start: 5, dur: 1 },      // C5
            { freq: 493.88, start: 6, dur: 0.5 },    // B4
            { freq: 523.25, start: 6.5, dur: 0.5 },  // C5
            { freq: 587.33, start: 7, dur: 0.8 }     // D5
        ];

        melody.forEach(note => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'triangle';
            osc.frequency.value = note.freq;

            osc.connect(gain);
            gain.connect(this.musicGain);

            const startTime = now + note.start;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gain.gain.setValueAtTime(0.15, startTime + note.dur - 0.1);
            gain.gain.linearRampToValueAtTime(0, startTime + note.dur);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.1);
        });
    }

    // Play bass line layer
    playMusicBass(now) {
        const bass = [
            { freq: 65.41, start: 0, dur: 1.8 },     // C2
            { freq: 55, start: 2, dur: 1.8 },        // A1
            { freq: 43.65, start: 4, dur: 1.8 },     // F1
            { freq: 49, start: 6, dur: 1.8 }         // G1
        ];

        bass.forEach(note => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = note.freq;

            osc.connect(gain);
            gain.connect(this.musicGain);

            const startTime = now + note.start;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
            gain.gain.setValueAtTime(0.25, startTime + note.dur - 0.2);
            gain.gain.linearRampToValueAtTime(0, startTime + note.dur);

            osc.start(startTime);
            osc.stop(startTime + note.dur + 0.1);
        });
    }

    // Stop background music
    stopMusic() {
        this.musicPlaying = false;
    }

    // ============================================
    // VOLUME CONTROLS
    // ============================================

    setMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    setMusicVolume(value) {
        this.musicVolume = Math.max(0, Math.min(1, value));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    setSfxVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, value));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
        }
        return this.isMuted;
    }

    getMuteState() {
        return this.isMuted;
    }
}

// Create singleton instance
const audioManager = new AudioManager();

export { audioManager };
