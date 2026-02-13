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
  let mockAudioManager;
  let mockGameState;

  beforeEach(() => {
    // Mock audio manager
    mockAudioManager = {
      playLevelUp: vi.fn(),
      playPowerUp: vi.fn(),
      playGameOver: vi.fn(),
      playVictory: vi.fn()
    };

    // Mock game state
    mockGameState = {
      getScore: vi.fn(() => 1000),
      getHighScore: vi.fn(() => 5000),
      getPlayerHealth: vi.fn(() => 75),
      getMaxHealth: vi.fn(() => 100),
      getCloverCount: vi.fn(() => 10),
      getCloversCollected: vi.fn(() => 10),
      getTotalClovers: vi.fn(() => 30),
      getCombo: vi.fn(() => 3),
      getComboTime: vi.fn(() => 2),
      getLives: vi.fn(() => 3),
      getCurrentLevel: vi.fn(() => 1),
      getEnemiesDefeated: vi.fn(() => 5),
      getTimePlayed: vi.fn(() => 180)
    };

    // Mock DOM elements
    mockElements = {
      score: { textContent: '' },
      'high-score': { textContent: '' },
      health: { style: { width: '' }, textContent: '' },
      'health-text': { textContent: '' },
      cloverCount: { textContent: '' },
      combo: { textContent: '', style: { display: 'none' } },
      lives: { textContent: '' },
      level: { textContent: '' },
      minimap: {
        getContext: vi.fn(() => ({
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 0,
          fillRect: vi.fn(),
          strokeRect: vi.fn(),
          beginPath: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          rotate: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          closePath: vi.fn()
        }))
      },
      'pause-overlay': { style: { display: 'none' }, classList: { add: vi.fn(), remove: vi.fn() } },
      'game-over': { style: { display: 'none' }, querySelector: vi.fn(() => ({ textContent: '' })), remove: vi.fn(), addEventListener: vi.fn() },
      'victory-screen': { style: { display: 'none' }, querySelector: vi.fn(() => ({ textContent: '' })), remove: vi.fn(), addEventListener: vi.fn() },
      'power-up-message': { textContent: '', style: { display: 'none' } },
      'level-up-popup': { textContent: '', style: { display: 'none' } },
      'combo-popup': { textContent: '', style: { display: 'none' } }
    };

    document.getElementById = vi.fn((id) => {
      return mockElements[id] || null;
    });

    document.querySelector = vi.fn((selector) => {
      if (selector.includes('score')) return mockElements.score;
      if (selector.includes('health')) return mockElements.health;
      return null;
    });

    uiManager = new UIManager(mockAudioManager, mockGameState);
  });

  describe('Constructor', () => {
    it('should initialize without errors', () => {
      expect(uiManager).toBeDefined();
    });
  });

  describe('Score Display', () => {
    it('should update score display using gameState', () => {
      mockElements.score = { textContent: '' };
      document.getElementById = vi.fn(() => mockElements.score);

      uiManager.updateScoreDisplay();

      expect(mockGameState.getScore).toHaveBeenCalled();
      expect(mockElements.score.textContent).toContain('1000');
    });

    it('should handle missing score element gracefully', () => {
      document.getElementById = vi.fn(() => null);

      expect(() => {
        uiManager.updateScoreDisplay();
      }).not.toThrow();
    });
  });

  describe('Health Display', () => {
    it('should update health display segments', () => {
      const mockSegments = [
        { classList: { remove: vi.fn(), add: vi.fn() } },
        { classList: { remove: vi.fn(), add: vi.fn() } },
        { classList: { remove: vi.fn(), add: vi.fn() } }
      ];

      document.querySelectorAll = vi.fn((selector) => {
        if (selector === '.health-segment') return mockSegments;
        return [];
      });

      document.getElementById = vi.fn(() => ({ textContent: '' }));

      uiManager.updateHealthDisplay();

      expect(mockGameState.getPlayerHealth).toHaveBeenCalled();
      expect(mockGameState.getMaxHealth).toHaveBeenCalled();
      mockSegments.forEach(segment => {
        expect(segment.classList.remove).toHaveBeenCalled();
      });
    });

    it('should handle zero health', () => {
      mockGameState.getPlayerHealth = vi.fn(() => 0);
      const mockSegments = [{ classList: { remove: vi.fn(), add: vi.fn() } }];

      document.querySelectorAll = vi.fn(() => mockSegments);
      document.getElementById = vi.fn(() => ({ textContent: '' }));

      uiManager.updateHealthDisplay();

      expect(mockGameState.getPlayerHealth).toHaveBeenCalled();
    });

    it('should handle missing health segments gracefully', () => {
      document.querySelectorAll = vi.fn(() => []);
      document.getElementById = vi.fn(() => null);

      expect(() => {
        uiManager.updateHealthDisplay();
      }).not.toThrow();
    });
  });

  describe('Clover Count Display', () => {
    it('should update clover count from gameState', () => {
      const cloverElement = { textContent: '' };
      document.getElementById = vi.fn((id) => {
        if (id === 'clover-count') return cloverElement;
        return null;
      });

      uiManager.updateCloverCountDisplay();

      expect(mockGameState.getCloversCollected).toHaveBeenCalled();
      expect(mockGameState.getTotalClovers).toHaveBeenCalled();
      expect(cloverElement.textContent).toContain('10');
      expect(cloverElement.textContent).toContain('30');
    });

    it('should handle missing clover element gracefully', () => {
      document.getElementById = vi.fn(() => null);

      expect(() => {
        uiManager.updateCloverCountDisplay();
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
    it('should show game over screen with score', () => {
      const gameOverScreen = {
        style: { display: 'none' },
        querySelector: vi.fn(() => ({ textContent: '' }))
      };
      document.getElementById = vi.fn((id) => {
        if (id === 'game-over') return gameOverScreen;
        return mockElements[id] || null;
      });

      uiManager.showGameOverScreen();

      expect(gameOverScreen.style.display).toBe('flex');
      expect(mockGameState.getScore).toHaveBeenCalled();
    });

    it('should show victory screen with score', () => {
      const victoryScreen = {
        style: { display: 'none' },
        querySelector: vi.fn(() => ({ textContent: '' }))
      };
      document.getElementById = vi.fn((id) => {
        if (id === 'victory-screen') return victoryScreen;
        return mockElements[id] || null;
      });

      uiManager.showVictoryScreen();

      expect(victoryScreen.style.display).toBe('flex');
      expect(mockGameState.getScore).toHaveBeenCalled();
    });

    it('should handle missing game over element', () => {
      document.getElementById = vi.fn(() => null);

      expect(() => {
        uiManager.showGameOverScreen();
      }).not.toThrow();
    });
  });

  describe('Pause Display', () => {
    it('should show pause overlay', () => {
      const pauseOverlay = { style: { display: 'none' }, classList: { remove: vi.fn(), add: vi.fn() } };
      document.getElementById = vi.fn((id) => {
        if (id === 'pause-overlay') return pauseOverlay;
        return null;
      });

      uiManager.showPauseOverlay();

      expect(pauseOverlay.classList.remove).toHaveBeenCalledWith('hidden');
    });

    it('should hide pause overlay', () => {
      const pauseOverlay = { style: { display: 'flex' }, classList: { add: vi.fn(), remove: vi.fn() } };
      document.getElementById = vi.fn((id) => {
        if (id === 'pause-overlay') return pauseOverlay;
        return null;
      });

      uiManager.hidePauseOverlay();

      expect(pauseOverlay.classList.add).toHaveBeenCalledWith('hidden');
    });

    it('should handle missing pause overlay', () => {
      document.getElementById = vi.fn(() => null);

      expect(() => {
        uiManager.showPauseOverlay();
        uiManager.hidePauseOverlay();
      }).not.toThrow();
    });
  });

  describe('Minimap', () => {
    it('should initialize minimap canvas', () => {
      expect(uiManager.minimapCanvas).toBeDefined();
    });

    it('should convert world coordinates to minimap coordinates', () => {
      const result = uiManager.worldToMinimap(0, 0);

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });

    it('should handle drawMinimap without errors', () => {
      const playerPos = { x: 0, y: 0, z: 0 };
      const clovers = [];
      const enemies = [];
      const bees = [];

      expect(() => {
        uiManager.drawMinimap(playerPos, 0, clovers, enemies, bees);
      }).not.toThrow();
    });

    it('should handle missing minimap context', () => {
      uiManager.minimapCtx = null;
      const playerPos = { x: 0, y: 0, z: 0 };

      expect(() => {
        uiManager.drawMinimap(playerPos, 0, [], [], []);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should have cleanup method', () => {
      expect(typeof uiManager.cleanup).toBe('function');
    });

    it('should cleanup without errors', () => {
      expect(() => {
        uiManager.cleanup();
      }).not.toThrow();
    });
  });
});
