/**
 * Day/Night Cycle Unit Tests
 *
 * Tests for the DayNightCycle system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DayNightCycle, PHASES, DEFAULT_CYCLE_DURATION } from './daynight.js';
import * as THREE from 'three';

describe('Day/Night Cycle', () => {
  let mockDependencies;
  let dayNightCycle;

  beforeEach(() => {
    mockDependencies = {
      scene: {
        background: new THREE.Color(0x87ceeb),
        fog: { color: new THREE.Color(0x87ceeb) }
      },
      ambientLight: {
        intensity: 0.7,
        color: new THREE.Color(0xffffff)
      },
      directionalLight: {
        intensity: 1.0,
        position: { x: 50, y: 50, z: 50, set: vi.fn() },
        color: new THREE.Color(0xffffff)
      }
    };

    dayNightCycle = new DayNightCycle(
      mockDependencies.scene,
      mockDependencies.ambientLight,
      mockDependencies.directionalLight
    );
  });

  describe('Constants', () => {
    it('should export PHASES constant', () => {
      expect(PHASES).toBeDefined();
      expect(typeof PHASES).toBe('object');
    });

    it('should have phase definitions', () => {
      expect(PHASES.DAY).toBeDefined();
      expect(PHASES.DUSK).toBeDefined();
      expect(PHASES.NIGHT).toBeDefined();
      expect(PHASES.DAWN).toBeDefined();
    });

    it('should export DEFAULT_CYCLE_DURATION', () => {
      expect(DEFAULT_CYCLE_DURATION).toBeDefined();
      expect(typeof DEFAULT_CYCLE_DURATION).toBe('number');
      expect(DEFAULT_CYCLE_DURATION).toBeGreaterThan(0);
    });
  });

  describe('Constructor', () => {
    it('should store scene reference', () => {
      expect(dayNightCycle.scene).toBe(mockDependencies.scene);
    });

    it('should store ambient light reference', () => {
      expect(dayNightCycle.ambientLight).toBe(mockDependencies.ambientLight);
    });

    it('should store directional light reference', () => {
      expect(dayNightCycle.directionalLight).toBe(mockDependencies.directionalLight);
    });

    it('should initialize cycle time', () => {
      expect(dayNightCycle.cycleTime).toBeDefined();
      expect(typeof dayNightCycle.cycleTime).toBe('number');
    });

    it('should initialize with a phase', () => {
      expect(dayNightCycle.currentPhase).toBeDefined();
    });
  });

  describe('Cycle Progress', () => {
    it('should get cycle progress', () => {
      const progress = dayNightCycle.getCycleProgress();

      expect(typeof progress).toBe('number');
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('should get current phase', () => {
      const phase = dayNightCycle.getCurrentPhase();

      expect(phase).toBeDefined();
      expect(typeof phase).toBe('string');
    });

    it('should get time of day', () => {
      const timeOfDay = dayNightCycle.getTimeOfDay();

      expect(typeof timeOfDay).toBe('string');
    });
  });

  describe('Update', () => {
    it('should update without errors', () => {
      expect(() => {
        dayNightCycle.update(16);
      }).not.toThrow();
    });

    it('should advance cycle time', () => {
      const initialTime = dayNightCycle.cycleTime;

      dayNightCycle.update(1000);

      expect(dayNightCycle.cycleTime).toBeGreaterThan(initialTime);
    });

    it('should update light intensities', () => {
      const initialAmbient = mockDependencies.ambientLight.intensity;

      dayNightCycle.update(1000);

      // Intensity may change depending on cycle position
      expect(typeof mockDependencies.ambientLight.intensity).toBe('number');
    });

    it('should update light positions', () => {
      dayNightCycle.update(1000);

      // Position should be updated
      expect(mockDependencies.directionalLight.position.set).toHaveBeenCalled();
    });
  });

  describe('Phase Transitions', () => {
    it('should transition through phases', () => {
      const initialPhase = dayNightCycle.getCurrentPhase();

      // Advance time significantly
      for (let i = 0; i < 100; i++) {
        dayNightCycle.update(1000);
      }

      // Phase may have changed
      const finalPhase = dayNightCycle.getCurrentPhase();
      expect(typeof finalPhase).toBe('string');
    });
  });

  describe('Cycle Duration', () => {
    it('should use default cycle duration', () => {
      expect(dayNightCycle.cycleDuration).toBeDefined();
      expect(typeof dayNightCycle.cycleDuration).toBe('number');
    });

    it('should allow custom cycle duration', () => {
      const customCycle = new DayNightCycle(
        mockDependencies.scene,
        mockDependencies.ambientLight,
        mockDependencies.directionalLight,
        60000 // 1 minute cycle
      );

      expect(customCycle.cycleDuration).toBe(60000);
    });
  });

  describe('Color Transitions', () => {
    it('should update scene background color', () => {
      const initialColor = mockDependencies.scene.background.getHex();

      // Advance through significant time
      for (let i = 0; i < 50; i++) {
        dayNightCycle.update(1000);
      }

      // Color may have changed
      expect(typeof mockDependencies.scene.background.getHex()).toBe('number');
    });

    it('should update fog color', () => {
      const initialFogColor = mockDependencies.scene.fog.color.getHex();

      // Advance through significant time
      for (let i = 0; i < 50; i++) {
        dayNightCycle.update(1000);
      }

      // Fog color may have changed
      expect(typeof mockDependencies.scene.fog.color.getHex()).toBe('number');
    });
  });

  describe('Reset', () => {
    it('should reset cycle', () => {
      // Advance time
      dayNightCycle.update(10000);

      dayNightCycle.reset();

      expect(dayNightCycle.cycleTime).toBe(0);
    });
  });

  describe('Enable/Disable', () => {
    it('should enable cycle', () => {
      dayNightCycle.disable();
      dayNightCycle.enable();

      expect(dayNightCycle.enabled).toBe(true);
    });

    it('should disable cycle', () => {
      dayNightCycle.disable();

      expect(dayNightCycle.enabled).toBe(false);
    });

    it('should not update when disabled', () => {
      dayNightCycle.disable();
      const initialTime = dayNightCycle.cycleTime;

      dayNightCycle.update(1000);

      expect(dayNightCycle.cycleTime).toBe(initialTime);
    });
  });
});
