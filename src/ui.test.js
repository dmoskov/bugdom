/**
 * UI Manager Unit Tests
 *
 * Tests for the UIManager class which handles all UI updates and displays.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from './ui.js';

describe('UIManager', () => {
  let uiManager;
  let mockElements;

  beforeEach(() => {
    // Mock DOM elements
    mockElements = {
      score: { textContent: '' },
      health: { style: { width: '' }, textContent: '' },
      cloverCount: { textContent: '' },
      combo: { textContent: '', style: { display: '' } },
      lives: { textContent: '' },
      level: { textContent: '' }
    };

    document.getElementById = vi.fn((id) => {
      return mockElements[id] || null;
    });

    document.querySelector = vi.fn((selector) => {
      if (selector.includes('score')) return mockElements.score;
      if (selector.includes('health')) return mockElements.health;
      return null;
    });

    uiManager = new UIManager();
  });

  describe('Constructor', () => {
    it('should initialize without errors', () => {
      expect(uiManager).toBeDefined();
    });
  });

  describe('Score Display', () => {
    it('should update score display', () => {
      expect(() => {
        uiManager.updateScoreDisplay(1000);
      }).not.toThrow();
    });

    it('should update high score display', () => {
      expect(() => {
        uiManager.updateHighScoreDisplay(5000);
      }).not.toThrow();
    });
  });

  describe('Health Display', () => {
    it('should update health display', () => {
      expect(() => {
        uiManager.updateHealthDisplay(75, 100);
      }).not.toThrow();
    });

    it('should update health bar width', () => {
      expect(() => {
        uiManager.updateHealthDisplay(50, 100);
      }).not.toThrow();
    });
  });

  describe('Clover Count Display', () => {
    it('should update clover count', () => {
      expect(() => {
        uiManager.updateCloverCountDisplay(10, 30);
      }).not.toThrow();
    });
  });

  describe('Combo Display', () => {
    it('should update combo display', () => {
      expect(() => {
        uiManager.updateComboDisplay(3, 2);
      }).not.toThrow();
    });

    it('should show combo popup', () => {
      expect(() => {
        uiManager.showComboPopup(3, 15);
      }).not.toThrow();
    });
  });

  describe('Lives Display', () => {
    it('should update lives display', () => {
      expect(() => {
        uiManager.updateLivesDisplay(3);
      }).not.toThrow();
    });
  });

  describe('Level Display', () => {
    it('should update level display', () => {
      expect(() => {
        uiManager.updateLevelDisplay(5);
      }).not.toThrow();
    });

    it('should show level up popup', () => {
      expect(() => {
        uiManager.showLevelUpPopup(2);
      }).not.toThrow();
    });
  });

  describe('Power-up Messages', () => {
    it('should show power-up message', () => {
      expect(() => {
        uiManager.showPowerUpMessage('Speed Boost!');
      }).not.toThrow();
    });
  });

  describe('Game State Displays', () => {
    it('should show game over screen', () => {
      expect(() => {
        uiManager.showGameOverScreen('5:30', {});
      }).not.toThrow();
    });

    it('should show victory screen', () => {
      expect(() => {
        uiManager.showVictoryScreen('6:45', {});
      }).not.toThrow();
    });
  });

  describe('Pause Display', () => {
    it('should show pause overlay', () => {
      expect(() => {
        uiManager.showPauseOverlay();
      }).not.toThrow();
    });

    it('should hide pause overlay', () => {
      expect(() => {
        uiManager.hidePauseOverlay();
      }).not.toThrow();
    });
  });
});
