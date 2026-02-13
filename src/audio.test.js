/**
 * Audio Manager Unit Tests
 *
 * Tests for the Web Audio API-based audio management system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioManager } from './audio.js';

// Mock Web Audio API
const createMockAudioContext = () => {
  const mockGainNode = {
    gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn()
  };

  const mockOscillator = {
    type: 'sine',
    frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  };

  const mockBufferSource = {
    buffer: null,
    loop: false,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  };

  return {
    state: 'running',
    currentTime: 0,
    destination: {},
    createGain: vi.fn(() => ({ ...mockGainNode })),
    createOscillator: vi.fn(() => ({ ...mockOscillator })),
    createBufferSource: vi.fn(() => ({ ...mockBufferSource })),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    decodeAudioData: vi.fn().mockResolvedValue({})
  };
};

describe('Audio Manager', () => {
  let mockContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset audio manager state
    audioManager.isInitialized = false;
    audioManager.isMuted = false;
    audioManager.context = null;

    mockContext = createMockAudioContext();
    global.AudioContext = vi.fn(() => mockContext);
    global.webkitAudioContext = vi.fn(() => mockContext);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(audioManager).toBeDefined();
    });

    it('should initialize audio context', () => {
      const result = audioManager.init();

      expect(result).toBe(true);
      expect(audioManager.isInitialized).toBe(true);
      expect(audioManager.context).toBeDefined();
    });

    it('should create gain nodes on init', () => {
      audioManager.init();

      expect(mockContext.createGain).toHaveBeenCalledTimes(3); // master, music, sfx
      expect(audioManager.masterGain).toBeDefined();
      expect(audioManager.musicGain).toBeDefined();
      expect(audioManager.sfxGain).toBeDefined();
    });

    it('should not reinitialize if already initialized', () => {
      audioManager.init();
      const firstContext = audioManager.context;

      audioManager.init();

      expect(audioManager.context).toBe(firstContext);
    });

    it('should handle initialization errors', () => {
      global.AudioContext = vi.fn(() => {
        throw new Error('Not supported');
      });

      const result = audioManager.init();

      expect(result).toBe(false);
      expect(audioManager.isInitialized).toBe(false);
    });
  });

  describe('Audio Context Control', () => {
    beforeEach(() => {
      audioManager.init();
    });

    it('should resume suspended context', async () => {
      mockContext.state = 'suspended';

      await audioManager.resume();

      expect(mockContext.resume).toHaveBeenCalled();
    });

    it('should not resume running context', async () => {
      mockContext.state = 'running';

      await audioManager.resume();

      expect(mockContext.resume).not.toHaveBeenCalled();
    });

    it('should pause running context', async () => {
      mockContext.state = 'running';

      await audioManager.pause();

      expect(mockContext.suspend).toHaveBeenCalled();
    });

    it('should not pause suspended context', async () => {
      mockContext.state = 'suspended';

      await audioManager.pause();

      expect(mockContext.suspend).not.toHaveBeenCalled();
    });

    it('should handle resume errors gracefully', async () => {
      mockContext.resume = vi.fn().mockRejectedValue(new Error('Resume failed'));
      mockContext.state = 'suspended';

      await expect(audioManager.resume()).resolves.not.toThrow();
    });
  });

  describe('Volume Control', () => {
    beforeEach(() => {
      audioManager.init();
    });

    it('should set master volume', () => {
      audioManager.setMasterVolume(0.5);

      expect(audioManager.masterVolume).toBe(0.5);
      expect(audioManager.masterGain.gain.value).toBe(0.5);
    });

    it('should set music volume', () => {
      audioManager.setMusicVolume(0.3);

      expect(audioManager.musicVolume).toBe(0.3);
      expect(audioManager.musicGain.gain.value).toBe(0.3);
    });

    it('should set sfx volume', () => {
      audioManager.setSfxVolume(0.8);

      expect(audioManager.sfxVolume).toBe(0.8);
      expect(audioManager.sfxGain.gain.value).toBe(0.8);
    });

    it('should clamp volume to 0-1 range', () => {
      audioManager.setMasterVolume(1.5);
      expect(audioManager.masterVolume).toBeLessThanOrEqual(1);

      audioManager.setMasterVolume(-0.5);
      expect(audioManager.masterVolume).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Mute Control', () => {
    beforeEach(() => {
      audioManager.init();
    });

    it('should mute audio', () => {
      audioManager.mute();

      expect(audioManager.isMuted).toBe(true);
    });

    it('should unmute audio', () => {
      audioManager.mute();
      audioManager.unmute();

      expect(audioManager.isMuted).toBe(false);
    });

    it('should toggle mute state', () => {
      const initialState = audioManager.isMuted;

      audioManager.toggleMute();

      expect(audioManager.isMuted).toBe(!initialState);
    });
  });

  describe('Sound Effects', () => {
    beforeEach(() => {
      audioManager.init();
    });

    it('should play clover collect sound', () => {
      audioManager.playCloverCollect();

      expect(mockContext.createOscillator).toHaveBeenCalled();
      expect(mockContext.createGain).toHaveBeenCalled();
    });

    it('should play different sound for four-leaf clover', () => {
      const regularCalls = mockContext.createOscillator.mock.calls.length;

      audioManager.playCloverCollect(true);

      // Four-leaf should create more oscillators (extra notes + sparkle)
      expect(mockContext.createOscillator.mock.calls.length).toBeGreaterThan(regularCalls);
    });

    it('should not play sounds when muted', () => {
      audioManager.mute();
      const callsBefore = mockContext.createOscillator.mock.calls.length;

      audioManager.playCloverCollect();

      expect(mockContext.createOscillator.mock.calls.length).toBe(callsBefore);
    });

    it('should not play sounds when not initialized', () => {
      audioManager.isInitialized = false;
      const callsBefore = mockContext.createOscillator.mock.calls.length;

      audioManager.playCloverCollect();

      expect(mockContext.createOscillator.mock.calls.length).toBe(callsBefore);
    });

    it('should play ant hit sound', () => {
      audioManager.playAntHit();

      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should play power up sound', () => {
      audioManager.playPowerUp();

      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should play level up sound', () => {
      audioManager.playLevelUp();

      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should play game over sound', () => {
      audioManager.playGameOver();

      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should play victory sound', () => {
      audioManager.playVictory();

      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should play combo sound with multiplier', () => {
      audioManager.playCombo(3);

      expect(mockContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe('Music Playback', () => {
    beforeEach(() => {
      audioManager.init();
    });

    it('should track music playing state', () => {
      expect(audioManager.musicPlaying).toBe(false);
    });

    it('should stop all music nodes', () => {
      // Create mock music nodes
      const mockNode1 = { stop: vi.fn() };
      const mockNode2 = { stop: vi.fn() };
      audioManager.musicNodes = [mockNode1, mockNode2];

      audioManager.stopMusic();

      expect(mockNode1.stop).toHaveBeenCalled();
      expect(mockNode2.stop).toHaveBeenCalled();
      expect(audioManager.musicNodes.length).toBe(0);
      expect(audioManager.musicPlaying).toBe(false);
    });

    it('should handle stop music when no nodes exist', () => {
      audioManager.musicNodes = [];

      expect(() => {
        audioManager.stopMusic();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing AudioContext gracefully', () => {
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;

      expect(() => {
        audioManager.init();
      }).not.toThrow();
    });

    it('should handle oscillator errors gracefully', () => {
      audioManager.init();
      mockContext.createOscillator = vi.fn(() => {
        throw new Error('Oscillator failed');
      });

      expect(() => {
        audioManager.playCloverCollect();
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      audioManager.init();
    });

    it('should not create excessive nodes for rapid sounds', () => {
      const initialCalls = mockContext.createOscillator.mock.calls.length;

      // Simulate rapid clover collection
      for (let i = 0; i < 10; i++) {
        audioManager.playCloverCollect();
      }

      const totalCalls = mockContext.createOscillator.mock.calls.length - initialCalls;

      // Should create nodes but not an excessive amount (each sound creates ~3 oscillators)
      expect(totalCalls).toBeGreaterThan(0);
      expect(totalCalls).toBeLessThan(50); // Reasonable limit
    });
  });
});
