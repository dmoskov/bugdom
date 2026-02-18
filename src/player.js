import * as THREE from 'three';

/**
 * PlayerCharacter class - Encapsulates all player character logic
 * Handles creation, movement, animation, damage, and difficulty modifiers
 */
export class PlayerCharacter {
  constructor(scene) {
    this.scene = scene;

    // Player state
    this.velocity = new THREE.Vector3();
    this.rotation = 0;
    this.baseMoveSpeed = 0.15;
    this.moveSpeed = 0.15;
    this.rotationSpeed = 0.08;
    this.isMoving = false;
    this.legAnimationTime = 0;

    // Flash effect state
    this.isFlashing = false;
    this.flashEndTime = 0;
    this.originalColors = [];

    // Boundary constant
    this.BOUNDARY = 45;

    // Speed boost multiplier constant
    this.SPEED_BOOST_MULTIPLIER = 1.5;

    // Create the player mesh
    this.playerBug = this.createBugCharacter();
    this.scene.add(this.playerBug);

    // Store references to legs for animation
    this.legs = this.playerBug.userData.legs;
  }

  /**
   * Creates the bug character mesh with body, head, eyes, antennae, and legs
   * @returns {THREE.Group} The complete bug group
   */
  createBugCharacter() {
    const bugGroup = new THREE.Group();

    this.addBugBody(bugGroup);
    this.addBugHead(bugGroup);
    this.addBugEyes(bugGroup);
    this.addBugAntennae(bugGroup);
    bugGroup.userData.legs = this.addBugLegs(bugGroup);

    return bugGroup;
  }

  addBugBody(bugGroup) {
    const bodyGeometry = new THREE.SphereGeometry(0.6, 16, 12);
    bodyGeometry.scale(1, 0.7, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown
        roughness: 0.6,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    bugGroup.add(body);
  }

  addBugHead(bugGroup) {
    const headGeometry = new THREE.SphereGeometry(0.35, 12, 10);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321, // Darker brown
        roughness: 0.5,
        metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.6, 0.7);
    head.castShadow = true;
    bugGroup.add(head);
  }

  addBugEyes(bugGroup) {
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilGeometry = new THREE.SphereGeometry(0.05, 6, 4);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    [-0.15, 0.15].forEach(xOffset => {
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set(xOffset, 0.7, 1.0);
        bugGroup.add(eye);

        const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupil.position.set(xOffset, 0.7, 1.08);
        bugGroup.add(pupil);
    });
  }

  addBugAntennae(bugGroup) {
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const antennaTipGeometry = new THREE.SphereGeometry(0.05, 6, 4);

    [-0.12, 0.12].forEach((xOffset) => {
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(xOffset, 1.0, 0.8);
        antenna.rotation.x = Math.PI / 6;
        antenna.rotation.z = xOffset > 0 ? -0.3 : 0.3;
        bugGroup.add(antenna);

        const tip = new THREE.Mesh(antennaTipGeometry, antennaMaterial);
        tip.position.set(xOffset * 1.5, 1.15, 0.95);
        bugGroup.add(tip);
    });
  }

  addBugLegs(bugGroup) {
    const legGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.5, 6);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

    const legPositions = [
        { x: -0.4, z: 0.3, rotZ: 0.8 },   // Front left
        { x: 0.4, z: 0.3, rotZ: -0.8 },   // Front right
        { x: -0.5, z: 0, rotZ: 1.0 },     // Middle left
        { x: 0.5, z: 0, rotZ: -1.0 },     // Middle right
        { x: -0.4, z: -0.3, rotZ: 0.8 },  // Back left
        { x: 0.4, z: -0.3, rotZ: -0.8 }   // Back right
    ];

    const legs = [];
    legPositions.forEach((pos, index) => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos.x, 0.3, pos.z);
        leg.rotation.z = pos.rotZ;
        leg.rotation.x = 0.2;
        leg.castShadow = true;
        leg.userData.legIndex = index;
        bugGroup.add(leg);
        legs.push(leg);
    });
    return legs;
  }

  /**
   * Gets the player mesh
   * @returns {THREE.Group} The player bug mesh
   */
  getMesh() {
    return this.playerBug;
  }

  /**
   * Gets the current position as a clone
   * @returns {THREE.Vector3} Clone of current position
   */
  getPosition() {
    return this.playerBug.position.clone();
  }

  /**
   * Sets the player position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  setPosition(x, y, z) {
    this.playerBug.position.set(x, y, z);
  }

  /**
   * Gets the current rotation
   * @returns {number} Current rotation in radians
   */
  getRotation() {
    return this.rotation;
  }

  /**
   * Sets the rotation
   * @param {number} rotation - Rotation in radians
   */
  setRotation(rotation) {
    this.rotation = rotation;
    this.playerBug.rotation.y = rotation;
  }

  /**
   * Updates player movement based on input
   * @param {Object} movementInput - Object containing movement flags
   * @param {boolean} movementInput.forward - Move forward
   * @param {boolean} movementInput.backward - Move backward
   * @param {boolean} movementInput.left - Turn left
   * @param {boolean} movementInput.right - Turn right
   * @param {boolean} speedBoostActive - Whether speed boost is active
   * @param {Function} createRippleCallback - Optional callback to create ripple effects
   */
  updateMovement(movementInput, speedBoostActive = false, createRippleCallback = null) {
    const { forward, backward, left, right } = movementInput;

    // Rotation
    if (left) {
      this.rotation += this.rotationSpeed;
    }
    if (right) {
      this.rotation -= this.rotationSpeed;
    }

    // Apply rotation to bug
    this.playerBug.rotation.y = this.rotation;

    // Movement
    this.isMoving = false;
    const direction = new THREE.Vector3();

    if (forward) {
      direction.z = 1;
      this.isMoving = true;
    }
    if (backward) {
      direction.z = -1;
      this.isMoving = true;
    }

    if (direction.length() > 0) {
      direction.normalize();
      // Rotate direction by bug's rotation
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);

      // Apply movement with speed boost if active
      const effectiveSpeed = speedBoostActive ?
        this.moveSpeed * this.SPEED_BOOST_MULTIPLIER :
        this.moveSpeed;

      this.playerBug.position.x += direction.x * effectiveSpeed;
      this.playerBug.position.z += direction.z * effectiveSpeed;

      // Keep bug within boundaries
      this.playerBug.position.x = Math.max(-this.BOUNDARY, Math.min(this.BOUNDARY, this.playerBug.position.x));
      this.playerBug.position.z = Math.max(-this.BOUNDARY, Math.min(this.BOUNDARY, this.playerBug.position.z));

      // Create ripple effect when moving
      if (createRippleCallback && Math.random() < 0.1) {
        createRippleCallback(this.playerBug.position.clone());
      }
    }
  }

  /**
   * Animates the bug legs with tripod gait
   * @param {number} deltaTime - Time since last frame
   */
  animateLegs(deltaTime) {
    if (!this.isMoving) return;

    this.legAnimationTime += deltaTime * 0.015;

    this.legs.forEach((leg, index) => {
      // Alternate leg movement pattern (tripod gait)
      const phase = index % 2 === 0 ? 0 : Math.PI;
      const swing = Math.sin(this.legAnimationTime * 10 + phase) * 0.3;
      leg.rotation.x = 0.2 + swing;
    });
  }

  /**
   * Applies damage to the player and handles flash effect
   * @param {number} damageAmount - Amount of damage to take
   * @param {number} currentTime - Current game time in milliseconds
   * @returns {boolean} True if damage was taken
   */
  takeDamage(damageAmount, currentTime) {
    // Flash the player red briefly
    this.flashRed(currentTime);

    return true; // Damage was applied
  }

  /**
   * Flashes the player red when hit
   * @param {number} currentTime - Current game time in milliseconds
   */
  flashRed(currentTime) {
    this.flashEndTime = currentTime + 200; // Flash for 200ms

    // If already flashing, just extend the timer — originalColors already holds the true colors
    if (this.isFlashing) return;

    this.isFlashing = true;
    this.originalColors = [];

    // Store original colors and set to red
    this.playerBug.traverse(child => {
      if (child.isMesh && child.material) {
        this.originalColors.push({
          mesh: child,
          color: child.material.color.getHex()
        });
        child.material.color.setHex(0xff0000);
      }
    });
  }

  /**
   * Updates the flash effect state
   * @param {number} currentTime - Current game time in milliseconds
   */
  updateFlash(currentTime) {
    if (this.isFlashing && currentTime >= this.flashEndTime) {
      // Restore original colors
      this.originalColors.forEach(item => {
        if (item.mesh.material) {
          item.mesh.material.color.setHex(item.color);
        }
      });
      this.isFlashing = false;
      this.originalColors = [];
    }
  }

  /**
   * Applies difficulty modifiers to player stats
   * @param {Object} difficultyPreset - Difficulty preset containing multipliers
   * @param {number} difficultyPreset.playerSpeedMultiplier - Speed multiplier
   */
  applyDifficultyModifiers(difficultyPreset) {
    // Apply difficulty speed multiplier
    this.moveSpeed = this.baseMoveSpeed * difficultyPreset.playerSpeedMultiplier;
  }

  /**
   * Gets the bounding box for collision detection
   * @returns {THREE.Box3} Bounding box of the player mesh
   */
  getBoundingBox() {
    return new THREE.Box3().setFromObject(this.playerBug);
  }
}
