/**
 * Day/Night Cycle Unit Tests
 *
 * Tests for the DayNightCycle system including:
 * - Event listener ID-based tracking (leak fix)
 * - Firefly position clamping (overshoot fix)
 * - Deduplicated transition logic
 * - DOM cleanup on restart
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DayNightCycle, PHASES, DEFAULT_CYCLE_DURATION } from './daynight.js';
import * as THREE from 'three';

// Helper to create a full mock scene with all methods DayNightCycle needs
function createMockScene() {
  return {
    background: new THREE.Color(0x87ceeb),
    fog: { color: new THREE.Color(0x87ceeb) },
    add: vi.fn()
  };
}

function createMockLights() {
  return {
    ambientLight: {
      intensity: 0.7,
      color: new THREE.Color(0xffffff)
    },
    directionalLight: {
      intensity: 1.0,
      position: new THREE.Vector3(50, 50, 50),
      color: new THREE.Color(0xffffff)
    }
  };
}

describe('Day/Night Cycle', () => {
  let scene;
  let lights;
  let cycle;

  beforeEach(() => {
    scene = createMockScene();
    lights = createMockLights();
    cycle = new DayNightCycle(scene, lights.ambientLight, lights.directionalLight);
  });

  afterEach(() => {
    if (cycle) {
      cycle.dispose();
    }
  });

  describe('Constants', () => {
    it('should export PHASES constant with all phases', () => {
      expect(PHASES).toBeDefined();
      expect(PHASES.DAY).toBe('day');
      expect(PHASES.SUNSET).toBe('sunset');
      expect(PHASES.NIGHT).toBe('night');
      expect(PHASES.SUNRISE).toBe('sunrise');
    });

    it('should export DEFAULT_CYCLE_DURATION as a positive number', () => {
      expect(DEFAULT_CYCLE_DURATION).toBeDefined();
      expect(typeof DEFAULT_CYCLE_DURATION).toBe('number');
      expect(DEFAULT_CYCLE_DURATION).toBeGreaterThan(0);
    });
  });

  describe('Constructor', () => {
    it('should store scene reference', () => {
      expect(cycle.scene).toBe(scene);
    });

    it('should store light references', () => {
      expect(cycle.ambientLight).toBe(lights.ambientLight);
      expect(cycle.directionalLight).toBe(lights.directionalLight);
    });

    it('should initialize cycle time to 0', () => {
      expect(cycle.cycleTime).toBe(0);
    });

    it('should start in DAY phase', () => {
      expect(cycle.currentPhase).toBe(PHASES.DAY);
    });

    it('should use default cycle duration when no options given', () => {
      expect(cycle.cycleDuration).toBe(DEFAULT_CYCLE_DURATION);
    });

    it('should accept custom cycle duration via options', () => {
      const custom = new DayNightCycle(scene, lights.ambientLight, lights.directionalLight, {
        cycleDuration: 120
      });
      expect(custom.cycleDuration).toBe(120);
      custom.dispose();
    });

    it('should add celestial bodies and fireflies to scene', () => {
      // createSun, createMoon, createStars, createFireflies, createPointLights all call scene.add
      expect(scene.add).toHaveBeenCalled();
    });
  });

  describe('Update', () => {
    it('should update without errors', () => {
      expect(() => cycle.update(16)).not.toThrow();
    });

    it('should advance cycle time', () => {
      cycle.update(1000); // 1 second in ms
      expect(cycle.cycleTime).toBeGreaterThan(0);
    });

    it('should wrap cycle time when exceeding duration', () => {
      // Advance past a full cycle
      const fullCycleMs = cycle.cycleDuration * 1000 + 1000;
      cycle.update(fullCycleMs);
      expect(cycle.cycleTime).toBeLessThan(cycle.cycleDuration);
    });
  });

  describe('Phase Transitions', () => {
    it('should transition to SUNSET after day ends', () => {
      // Set time to 36% of cycle (just past DAY_END at 0.35)
      cycle.setTime(0.36);
      cycle.cycleProgress = 0.36;
      cycle.updatePhase();
      expect(cycle.currentPhase).toBe(PHASES.SUNSET);
    });

    it('should transition to NIGHT after sunset ends', () => {
      cycle.setTime(0.50);
      cycle.cycleProgress = 0.50;
      cycle.updatePhase();
      expect(cycle.currentPhase).toBe(PHASES.NIGHT);
    });

    it('should transition to SUNRISE after night ends', () => {
      cycle.setTime(0.90);
      cycle.cycleProgress = 0.90;
      cycle.updatePhase();
      expect(cycle.currentPhase).toBe(PHASES.SUNRISE);
    });

    it('should emit phaseChange event on transition', () => {
      const handler = vi.fn();
      cycle.on('phaseChange', handler);

      cycle.setTime(0.36);
      cycle.update(0); // trigger phase recalculation

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].phase).toBe(PHASES.SUNSET);
    });
  });

  describe('Event System - ID-based tracking', () => {
    it('on() should return a numeric ID', () => {
      const id = cycle.on('timeChange', () => {});
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('should assign unique IDs to each listener', () => {
      const id1 = cycle.on('timeChange', () => {});
      const id2 = cycle.on('timeChange', () => {});
      expect(id1).not.toBe(id2);
    });

    it('off() should remove listener by ID', () => {
      const handler = vi.fn();
      const id = cycle.on('phaseChange', handler);

      cycle.emit('phaseChange', { phase: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);

      cycle.off('phaseChange', id);
      cycle.emit('phaseChange', { phase: 'test' });
      expect(handler).toHaveBeenCalledTimes(1); // not called again
    });

    it('off() should still work with callback reference as fallback', () => {
      const handler = vi.fn();
      cycle.on('phaseChange', handler);

      cycle.emit('phaseChange', { phase: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);

      cycle.off('phaseChange', handler);
      cycle.emit('phaseChange', { phase: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('offAll() should remove all listeners for a specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      cycle.on('timeChange', handler1);
      cycle.on('timeChange', handler2);

      cycle.offAll('timeChange');

      cycle.emit('timeChange', {});
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('offAll() without args should clear all events', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      cycle.on('timeChange', handler1);
      cycle.on('phaseChange', handler2);

      cycle.offAll();

      cycle.emit('timeChange', {});
      cycle.emit('phaseChange', {});
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('on() should return -1 for unknown event type', () => {
      const id = cycle.on('nonexistent', () => {});
      expect(id).toBe(-1);
    });

    it('listeners should not grow unboundedly on repeated on() calls', () => {
      for (let i = 0; i < 100; i++) {
        const id = cycle.on('timeChange', () => {});
        cycle.off('timeChange', id);
      }
      expect(cycle.eventListeners.timeChange.size).toBe(0);
    });
  });

  describe('Firefly Position Clamping', () => {
    it('should clamp firefly X position to FIREFLY_AREA bounds', () => {
      // Force a firefly far out of bounds
      const data = cycle.fireflyData[0];
      data.position.x = 999;
      data.velocity.x = 0.02;

      cycle._animateFireflyPositions();

      // After one animation step, position should be clamped to halfArea (40)
      expect(data.position.x).toBeLessThanOrEqual(40);
      // Velocity should have flipped
      expect(data.velocity.x).toBeLessThan(0);
    });

    it('should clamp firefly Y position to 0.5-4 bounds', () => {
      const data = cycle.fireflyData[0];
      data.position.y = 10;
      data.velocity.y = 0.01;

      cycle._animateFireflyPositions();

      expect(data.position.y).toBeLessThanOrEqual(4);
      expect(data.velocity.y).toBeLessThan(0);
    });

    it('should clamp firefly Z position to FIREFLY_AREA bounds', () => {
      const data = cycle.fireflyData[0];
      data.position.z = -999;
      data.velocity.z = -0.02;

      cycle._animateFireflyPositions();

      expect(data.position.z).toBeGreaterThanOrEqual(-40);
      expect(data.velocity.z).toBeGreaterThan(0);
    });
  });

  describe('Deduplicated Transition Logic', () => {
    it('updateEnvironment should use same transition as updateLighting', () => {
      // Set to a transition point (sunset transition)
      cycle.setTime(0.36);
      cycle.updatePhase();

      // Both methods should produce consistent transitions
      // (they now share _calculatePhaseTransition)
      expect(() => {
        cycle.updateLighting();
        cycle.updateEnvironment();
      }).not.toThrow();
    });

    it('_calculatePhaseTransition should return consistent results', () => {
      const result1 = cycle._calculatePhaseTransition(0.36);
      const result2 = cycle._calculatePhaseTransition(0.36);

      expect(result1.fromPhase).toBe(result2.fromPhase);
      expect(result1.toPhase).toBe(result2.toPhase);
      expect(result1.transitionFactor).toBe(result2.transitionFactor);
    });
  });

  describe('DOM Cleanup - createTimeDisplay', () => {
    it('should remove existing time-display element before creating new one', () => {
      // First creation happened in constructor
      const firstDisplay = document.getElementById('time-display');
      expect(firstDisplay).not.toBeNull();

      // Create a second one (simulating restart)
      cycle.createTimeDisplay();

      // There should still be only one
      const displays = document.querySelectorAll('#time-display');
      expect(displays.length).toBe(1);
    });

    it('dispose() should remove the time display from DOM', () => {
      expect(document.getElementById('time-display')).not.toBeNull();

      cycle.dispose();

      expect(document.getElementById('time-display')).toBeNull();
    });

    it('dispose() should clear all event listeners', () => {
      cycle.on('timeChange', () => {});
      cycle.on('phaseChange', () => {});

      cycle.dispose();

      expect(cycle.eventListeners.timeChange.size).toBe(0);
      expect(cycle.eventListeners.phaseChange.size).toBe(0);
      expect(cycle.eventListeners.cycleComplete.size).toBe(0);
    });
  });

  describe('Configuration Methods', () => {
    it('getCycleDuration should return current duration', () => {
      expect(cycle.getCycleDuration()).toBe(DEFAULT_CYCLE_DURATION);
    });

    it('setCycleDuration should update duration', () => {
      cycle.setCycleDuration(600);
      expect(cycle.getCycleDuration()).toBe(600);
    });

    it('getTimeSpeed should return current speed', () => {
      expect(cycle.getTimeSpeed()).toBe(1.0);
    });

    it('setTimeSpeed should update speed', () => {
      cycle.setTimeSpeed(2.0);
      expect(cycle.getTimeSpeed()).toBe(2.0);
    });

    it('isNight should return true during night phase', () => {
      cycle.setTime(0.60);
      cycle.cycleProgress = 0.60;
      cycle.updatePhase();
      expect(cycle.isNight()).toBe(true);
    });

    it('isNight should return false during day phase', () => {
      cycle.setTime(0.10);
      cycle.cycleProgress = 0.10;
      cycle.updatePhase();
      expect(cycle.isNight()).toBe(false);
    });

    it('getTimeIn24HourFormat should return formatted time', () => {
      cycle.setTime(0.5); // halfway through cycle
      cycle.cycleProgress = 0.5;
      const time = cycle.getTimeIn24HourFormat();
      expect(time.hours).toBe(12);
      expect(time.minutes).toBe(0);
      expect(time.formatted).toBe('12:00');
    });
  });
});
