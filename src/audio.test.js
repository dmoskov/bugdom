/**
 * Audio Manager Unit Tests
 *
 * Tests for the audio management system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioManager } from './audio.js';

// Mock Audio API
global.Audio = vi.fn(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  volume: 1,
  loop: false,
  currentTime: 0
}));

describe('Audio Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(audioManager).toBeDefined();
    });

    it('should have audio methods', () => {
      expect(typeof audioManager.playLevelUp).toBe('function');
      expect(typeof audioManager.playPowerUp).toBe('function');
      expect(typeof audioManager.stopMusic).toBe('function');
    });
  });

  describe('Sound Playback', () => {
    it('should play clover collect sound', () => {
      expect(() => {
        audioManager.playCloverCollect();
      }).not.toThrow();
    });

    it('should play power up sound', () => {
      expect(() => {
        audioManager.playPowerUp();
      }).not.toThrow();
    });

    it('should play ant hit sound', () => {
      expect(() => {
        audioManager.playAntHit();
      }).not.toThrow();
    });

    it('should play level up sound', () => {
      expect(() => {
        audioManager.playLevelUp();
      }).not.toThrow();
    });

    it('should play game over sound', () => {
      expect(() => {
        audioManager.playGameOver();
      }).not.toThrow();
    });

    it('should play victory sound', () => {
      expect(() => {
        audioManager.playVictory();
      }).not.toThrow();
    });

    it('should play combo sound', () => {
      expect(() => {
        audioManager.playCombo(2);
      }).not.toThrow();
    });
  });

  describe('Music Playback', () => {
    it('should play music loop', () => {
      expect(() => {
        audioManager.playMusicLoop();
      }).not.toThrow();
    });

    it('should stop music without throwing', () => {
      expect(() => {
        audioManager.stopMusic();
      }).not.toThrow();
    });
  });

  describe('Volume Control', () => {
    it('should set master volume without throwing', () => {
      expect(() => {
        audioManager.setMasterVolume(0.5);
      }).not.toThrow();
    });

    it('should set music volume without throwing', () => {
      expect(() => {
        audioManager.setMusicVolume(0.5);
      }).not.toThrow();
    });

    it('should set sfx volume without throwing', () => {
      expect(() => {
        audioManager.setSfxVolume(0.5);
      }).not.toThrow();
    });
  });
});
