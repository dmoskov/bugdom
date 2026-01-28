import * as THREE from 'three';

export class CameraController {
  constructor(camera, containerSelector = 'game-container') {
    this.camera = camera;
    this.containerSelector = containerSelector;

    // Camera offsets
    this.cameraOffset = new THREE.Vector3(0, 4, -8);
    this.cameraLookOffset = new THREE.Vector3(0, 1, 0);

    // Bind methods
    this.handleResize = this.handleResize.bind(this);

    // Setup resize listener
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Get camera aspect ratio from container or window
   */
  getCameraAspect() {
    const container = document.getElementById(this.containerSelector);
    if (container) {
      return container.clientWidth / container.clientHeight;
    }
    return window.innerWidth / window.innerHeight;
  }

  /**
   * Update camera to follow player
   * @param {THREE.Vector3} playerPosition - Player's position
   * @param {Number} playerRotation - Player's rotation in radians
   */
  update(playerPosition, playerRotation) {
    // Calculate desired camera position based on player's position and rotation
    const offset = this.cameraOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation);

    const targetCameraPos = playerPosition.clone().add(offset);

    // Smooth camera follow
    this.camera.position.lerp(targetCameraPos, 0.1);

    // Look at player with slight offset
    const lookTarget = playerPosition.clone().add(this.cameraLookOffset);
    this.camera.lookAt(lookTarget);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const newAspect = this.getCameraAspect();
    this.camera.aspect = newAspect;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Get/Set camera offset
   */
  getCameraOffset() {
    return this.cameraOffset.clone();
  }

  setCameraOffset(offset) {
    this.cameraOffset.copy(offset);
  }

  getCameraLookOffset() {
    return this.cameraLookOffset.clone();
  }

  setCameraLookOffset(offset) {
    this.cameraLookOffset.copy(offset);
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    window.removeEventListener('resize', this.handleResize);
  }
}

/**
 * Factory function to create and setup camera
 */
export function createCamera(containerSelector = 'game-container') {
  const getCameraAspect = () => {
    const container = document.getElementById(containerSelector);
    if (container) {
      return container.clientWidth / container.clientHeight;
    }
    return window.innerWidth / window.innerHeight;
  };

  const camera = new THREE.PerspectiveCamera(
    75,
    getCameraAspect(),
    0.1,
    1000
  );

  camera.position.set(0, 4, -8);
  camera.lookAt(0, 1, 0);

  return camera;
}
