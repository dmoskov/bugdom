/**
 * Enemy System Unit Tests
 *
 * Tests for Spider, Slug, and EnemyManager classes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Spider, Slug, EnemyManager } from './enemies.js';
import * as THREE from 'three';

describe('Spider', () => {
  let mockScene;
  let spider;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    spider = new Spider(mockScene);
  });

  describe('Constructor', () => {
    it('should create spider mesh', () => {
      expect(spider.mesh).toBeDefined();
      expect(spider.mesh).toBeInstanceOf(THREE.Group);
    });

    it('should initialize with speed', () => {
      expect(spider.speed).toBeDefined();
      expect(spider.speed).toBeGreaterThan(0);
    });

    it('should add spider to scene', () => {
      expect(mockScene.add).toHaveBeenCalledWith(spider.mesh);
    });
  });

  describe('Position and Movement', () => {
    it('should get position', () => {
      const position = spider.getPosition();
      expect(position).toBeInstanceOf(THREE.Vector3);
    });

    it('should set position', () => {
      spider.setPosition(10, 0, 10);
      const position = spider.getPosition();
      expect(position.x).toBe(10);
      expect(position.z).toBe(10);
    });
  });
});

describe('Slug', () => {
  let mockScene;
  let slug;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    slug = new Slug(mockScene);
  });

  describe('Constructor', () => {
    it('should create slug mesh', () => {
      expect(slug.mesh).toBeDefined();
      expect(slug.mesh).toBeInstanceOf(THREE.Group);
    });

    it('should initialize with speed', () => {
      expect(slug.speed).toBeDefined();
      expect(slug.speed).toBeGreaterThan(0);
    });

    it('should add slug to scene', () => {
      expect(mockScene.add).toHaveBeenCalledWith(slug.mesh);
    });
  });

  describe('Position and Movement', () => {
    it('should get position', () => {
      const position = slug.getPosition();
      expect(position).toBeInstanceOf(THREE.Vector3);
    });

    it('should set position', () => {
      slug.setPosition(5, 0, 5);
      const position = slug.getPosition();
      expect(position.x).toBe(5);
      expect(position.z).toBe(5);
    });
  });
});

describe('EnemyManager', () => {
  let mockScene;
  let enemyManager;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    enemyManager = new EnemyManager(mockScene);
  });

  describe('Constructor', () => {
    it('should initialize spider array', () => {
      expect(enemyManager.spiders).toBeDefined();
      expect(Array.isArray(enemyManager.spiders)).toBe(true);
    });

    it('should initialize slug array', () => {
      expect(enemyManager.slugs).toBeDefined();
      expect(Array.isArray(enemyManager.slugs)).toBe(true);
    });

    it('should store scene reference', () => {
      expect(enemyManager.scene).toBe(mockScene);
    });
  });

  describe('Spider Management', () => {
    it('should spawn spider', () => {
      enemyManager.spawnSpider();

      expect(enemyManager.spiders.length).toBeGreaterThan(0);
    });

    it('should check spider collisions', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const result = enemyManager.checkSpiderCollisions(playerPos, 2.0);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('Slug Management', () => {
    it('should spawn slug', () => {
      enemyManager.spawnSlug();

      expect(enemyManager.slugs.length).toBeGreaterThan(0);
    });

    it('should check slug collisions', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      const result = enemyManager.checkSlugCollisions(playerPos, 2.0);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('Update', () => {
    it('should update without errors', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);

      expect(() => {
        enemyManager.update(playerPos, 16);
      }).not.toThrow();
    });
  });
});
