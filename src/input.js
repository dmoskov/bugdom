// Input handling module that unifies keyboard and touch input
// This module extracts input state management from main.js

import { getTouchControls } from './touch.js';

export class InputManager {
  constructor() {
    // Keyboard state
    this.keys = {};

    // Touch controls reference
    this.touchControls = null;

    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // Setup input listeners
    this.setupInputListeners();
  }

  setupInputListeners() {
    // Add keyboard listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Get touch controls
    this.touchControls = getTouchControls();
  }

  handleKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
  }

  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  // Getters
  getKeys() {
    return this.keys;
  }

  isKeyPressed(key) {
    return this.keys[key.toLowerCase()] === true;
  }

  // Get unified movement input (keyboard + touch)
  getMovementInput() {
    return {
      forward: this.keys['w'] || this.keys['arrowup'] || this.touchControls?.forward || false,
      backward: this.keys['s'] || this.keys['arrowdown'] || this.touchControls?.backward || false,
      left: this.keys['a'] || this.keys['arrowleft'] || this.touchControls?.left || false,
      right: this.keys['d'] || this.keys['arrowright'] || this.touchControls?.right || false
    };
  }

  // Enable/disable input (for pause states)
  enableInput() {
    // Remove first to prevent duplicate handlers from repeated pause/unpause cycles
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  disableInput() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keys = {}; // Clear all pressed keys
  }

  // Cleanup
  cleanup() {
    this.disableInput();
  }
}
