import * as THREE from 'three';

// ============================================
// DAY/NIGHT CYCLE SYSTEM
// ============================================

// Default cycle configuration
const DEFAULT_CYCLE_DURATION = 300; // 5 minutes = 300 seconds
const PHASES = {
    DAY: 'day',
    SUNSET: 'sunset',
    NIGHT: 'night',
    SUNRISE: 'sunrise'
};

// Phase timing (as fraction of cycle)
const PHASE_TIMING = {
    DAY_START: 0.0,
    DAY_END: 0.35,
    SUNSET_START: 0.35,
    SUNSET_END: 0.45,
    NIGHT_START: 0.45,
    NIGHT_END: 0.85,
    SUNRISE_START: 0.85,
    SUNRISE_END: 1.0
};

// Color palettes for different phases
const SKY_COLORS = {
    day: new THREE.Color(0x87ceeb),       // Sky blue
    sunset: new THREE.Color(0xff7043),     // Orange-red sunset
    night: new THREE.Color(0x0a0a1a),      // Dark blue night
    sunrise: new THREE.Color(0xffa07a)     // Light salmon sunrise
};

const FOG_COLORS = {
    day: new THREE.Color(0x87ceeb),
    sunset: new THREE.Color(0xff8a65),
    night: new THREE.Color(0x0a0a1a),
    sunrise: new THREE.Color(0xffc4b0)
};

const AMBIENT_LIGHT_COLORS = {
    day: new THREE.Color(0xffffff),
    sunset: new THREE.Color(0xff9966),
    night: new THREE.Color(0x3344aa),
    sunrise: new THREE.Color(0xffaa77)
};

const DIRECTIONAL_LIGHT_COLORS = {
    day: new THREE.Color(0xffffff),
    sunset: new THREE.Color(0xff6633),
    night: new THREE.Color(0x4466bb),
    sunrise: new THREE.Color(0xffbb55)
};

// Light intensity settings
const LIGHT_INTENSITIES = {
    day: { ambient: 0.6, directional: 0.8 },
    sunset: { ambient: 0.4, directional: 0.5 },
    night: { ambient: 0.15, directional: 0.1 },
    sunrise: { ambient: 0.35, directional: 0.4 }
};

// Celestial body settings
const CELESTIAL_DISTANCE = 150;
const SUN_SIZE = 8;
const MOON_SIZE = 5;

// Firefly settings
const FIREFLY_COUNT = 100;
const FIREFLY_AREA = 80;

class DayNightCycle {
    constructor(scene, ambientLight, directionalLight, options = {}) {
        this.scene = scene;
        this.ambientLight = ambientLight;
        this.directionalLight = directionalLight;

        // Configuration options
        this.cycleDuration = options.cycleDuration || DEFAULT_CYCLE_DURATION;
        this.timeSpeed = options.timeSpeed || 1.0;

        // Event listeners with ID-based tracking for reliable removal
        this._nextListenerId = 1;
        this.eventListeners = {
            timeChange: new Map(),
            phaseChange: new Map(),
            cycleComplete: new Map()
        };

        // Cycle state
        this.cycleTime = 0;
        this.currentPhase = PHASES.DAY;
        this.cycleProgress = 0;

        // Store original scene settings
        this.originalSkyColor = scene.background.clone();
        this.originalFogColor = scene.fog ? scene.fog.color.clone() : new THREE.Color(0x87ceeb);

        // Point lights array for nighttime illumination
        this.pointLights = [];

        // Create celestial bodies
        this.createSun();
        this.createMoon();
        this.createStars();

        // Create firefly system
        this.createFireflies();

        // Create point lights (streetlamps/windows)
        this.createPointLights();

        // Create time display element
        this.createTimeDisplay();
    }

    createSun() {
        // Sun geometry - glowing sphere
        const sunGeometry = new THREE.SphereGeometry(SUN_SIZE, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1.0
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);

        // Sun glow effect
        const glowGeometry = new THREE.SphereGeometry(SUN_SIZE * 1.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(this.sunGlow);

        this.scene.add(this.sun);
    }

    createMoon() {
        // Moon geometry
        const moonGeometry = new THREE.SphereGeometry(MOON_SIZE, 32, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xeeeeee,
            transparent: true,
            opacity: 0.0 // Start invisible
        });
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);

        // Moon glow
        const moonGlowGeometry = new THREE.SphereGeometry(MOON_SIZE * 1.3, 32, 32);
        const moonGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x8888ff,
            transparent: true,
            opacity: 0.0,
            side: THREE.BackSide
        });
        this.moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial);
        this.moon.add(this.moonGlow);

        // Add moon craters for visual interest
        const craterGeometry = new THREE.CircleGeometry(MOON_SIZE * 0.15, 16);
        const craterMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            side: THREE.DoubleSide
        });

        const craterPositions = [
            { x: 0.3, y: 0.4, z: 0.85 },
            { x: -0.5, y: -0.2, z: 0.82 },
            { x: 0.1, y: -0.5, z: 0.86 }
        ];

        craterPositions.forEach(pos => {
            const crater = new THREE.Mesh(craterGeometry, craterMaterial);
            crater.position.set(
                pos.x * MOON_SIZE,
                pos.y * MOON_SIZE,
                pos.z * MOON_SIZE
            );
            crater.lookAt(0, 0, 0);
            this.moon.add(crater);
        });

        this.scene.add(this.moon);
    }

    createStars() {
        // Create star field
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 500;
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            // Distribute stars on a hemisphere above the scene
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.4 + 0.1; // Above horizon
            const radius = 180 + Math.random() * 20;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi); // Y is up
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            sizes[i] = 0.5 + Math.random() * 1.5;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true,
            opacity: 0.0, // Start invisible
            sizeAttenuation: false
        });

        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }

    createFireflies() {
        // Create firefly particle system using InstancedMesh for performance
        const fireflyGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const fireflyMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff66,
            transparent: true,
            opacity: 0.0 // Start invisible
        });

        this.fireflies = new THREE.InstancedMesh(
            fireflyGeometry,
            fireflyMaterial,
            FIREFLY_COUNT
        );

        // Initialize firefly positions and data
        this.fireflyData = [];
        const matrix = new THREE.Matrix4();

        for (let i = 0; i < FIREFLY_COUNT; i++) {
            const data = {
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * FIREFLY_AREA,
                    0.5 + Math.random() * 3, // Fly between 0.5 and 3.5 height
                    (Math.random() - 0.5) * FIREFLY_AREA
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.02
                ),
                phase: Math.random() * Math.PI * 2,
                blinkSpeed: 1 + Math.random() * 2,
                baseScale: 0.8 + Math.random() * 0.4
            };
            this.fireflyData.push(data);

            matrix.setPosition(data.position);
            matrix.scale(new THREE.Vector3(data.baseScale, data.baseScale, data.baseScale));
            this.fireflies.setMatrixAt(i, matrix);
        }

        this.fireflies.instanceMatrix.needsUpdate = true;
        this.scene.add(this.fireflies);
    }

    createPointLights() {
        const lampPositions = this._getLampPositions();
        lampPositions.forEach(pos => {
            const pointLight = this._createPointLight(pos);
            this.scene.add(pointLight);
            this.pointLights.push({
                light: pointLight,
                baseIntensity: 0.8,
                targetIntensity: 0
            });
            this.createLampPost(pos.x, pos.z, pointLight);
        });
    }

    /**
     * Get lamp positions for streetlamps
     * @private
     */
    _getLampPositions() {
        return [
            // Ring of streetlamps around the outer area
            { x: -35, z: -35 },
            { x: -35, z: 0 },
            { x: -35, z: 35 },
            { x: 0, z: -35 },
            { x: 0, z: 35 },
            { x: 35, z: -35 },
            { x: 35, z: 0 },
            { x: 35, z: 35 },
            // Inner ring
            { x: -20, z: -20 },
            { x: -20, z: 20 },
            { x: 20, z: -20 },
            { x: 20, z: 20 },
            // Center area
            { x: 0, z: 0 }
        ];
    }

    /**
     * Create a single point light with shadow settings
     * @private
     */
    _createPointLight(pos) {
        const pointLight = new THREE.PointLight(
            0xffaa44, // Warm orange-yellow color
            0, // Start with 0 intensity (will fade in at night)
            15, // Distance/range
            2 // Decay
        );
        pointLight.position.set(pos.x, 3, pos.z);
        pointLight.castShadow = true;

        // Optimize shadow map for point lights
        pointLight.shadow.mapSize.width = 512;
        pointLight.shadow.mapSize.height = 512;
        pointLight.shadow.camera.near = 0.5;
        pointLight.shadow.camera.far = 20;

        return pointLight;
    }

    createLampPost(x, z, pointLight) {
        // Lamp post
        const postGeometry = new THREE.CylinderGeometry(0.08, 0.1, 3, 8);
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.5
        });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(x, 1.5, z);
        post.castShadow = true;
        post.receiveShadow = true;
        this.scene.add(post);

        // Lamp head (glowing sphere)
        const lampGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const lampMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa44,
            emissive: 0xffaa44,
            emissiveIntensity: 0, // Start off
            roughness: 0.3,
            metalness: 0.1
        });
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.position.set(x, 3, z);
        this.scene.add(lamp);

        // Store lamp reference with point light for later updates
        pointLight.userData.lampMesh = lamp;
        pointLight.userData.lampMaterial = lampMaterial;
    }

    createTimeDisplay() {
        // Remove existing display element to prevent accumulation on restart
        const existing = document.getElementById('time-display');
        if (existing) {
            existing.remove();
        }

        // Create time/phase display element in HTML
        const timeDisplay = document.createElement('div');
        timeDisplay.id = 'time-display';
        timeDisplay.style.cssText = `
            position: absolute;
            top: 55px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 14px;
            font-weight: bold;
            z-index: 100;
            padding: 8px 16px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.5);
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: background 0.5s ease, color 0.5s ease;
        `;
        timeDisplay.innerHTML = '<span id="phase-icon">☀️</span> <span id="phase-text">Day</span>';
        document.body.appendChild(timeDisplay);

        this.timeDisplay = timeDisplay;
        this.phaseIcon = document.getElementById('phase-icon');
        this.phaseText = document.getElementById('phase-text');
    }

    update(deltaTime) {
        // Update cycle time (deltaTime is in milliseconds) with time speed multiplier
        const timeIncrement = (deltaTime / 1000) * this.timeSpeed;
        this.cycleTime += timeIncrement;

        // Loop the cycle
        const wasComplete = this.cycleTime >= this.cycleDuration;
        if (wasComplete) {
            this.cycleTime -= this.cycleDuration;
            this.emit('cycleComplete', { cycleTime: this.cycleTime });
        }

        // Calculate progress (0 to 1)
        const oldProgress = this.cycleProgress;
        this.cycleProgress = this.cycleTime / this.cycleDuration;

        // Emit time change event
        this.emit('timeChange', {
            cycleTime: this.cycleTime,
            cycleProgress: this.cycleProgress,
            phase: this.currentPhase
        });

        // Determine current phase
        this.updatePhase();

        // Update celestial bodies
        this.updateCelestialBodies();

        // Update lighting
        this.updateLighting();

        // Update environment colors
        this.updateEnvironment();

        // Update fireflies
        this.updateFireflies(deltaTime);

        // Update stars
        this.updateStars();

        // Update point lights (streetlamps)
        this.updatePointLights(deltaTime);

        // Update UI
        this.updateTimeDisplay();
    }

    updatePhase() {
        const progress = this.cycleProgress;
        let newPhase;

        if (progress >= PHASE_TIMING.DAY_START && progress < PHASE_TIMING.DAY_END) {
            newPhase = PHASES.DAY;
        } else if (progress >= PHASE_TIMING.SUNSET_START && progress < PHASE_TIMING.SUNSET_END) {
            newPhase = PHASES.SUNSET;
        } else if (progress >= PHASE_TIMING.NIGHT_START && progress < PHASE_TIMING.NIGHT_END) {
            newPhase = PHASES.NIGHT;
        } else {
            newPhase = PHASES.SUNRISE;
        }

        if (newPhase !== this.currentPhase) {
            this.currentPhase = newPhase;
            this.onPhaseChange(newPhase);
        }
    }

    onPhaseChange(phase) {
        // Emit phase change event
        this.emit('phaseChange', {
            phase: phase,
            cycleProgress: this.cycleProgress,
            cycleTime: this.cycleTime
        });
    }

    updateCelestialBodies() {
        const progress = this.cycleProgress;
        this._updateSunPosition(progress);
        this._updateMoonPosition(progress);
    }

    /**
     * Update sun position and opacity based on cycle progress
     * @private
     */
    _updateSunPosition(progress) {
        let sunAngle;
        let sunOpacity = 1.0;

        // Sun is visible from sunrise through day to sunset
        if (progress < PHASE_TIMING.SUNSET_END) {
            sunAngle = Math.PI * (progress / PHASE_TIMING.SUNSET_END);
            sunOpacity = 1.0;
        } else if (progress < PHASE_TIMING.NIGHT_END) {
            sunAngle = Math.PI;
            sunOpacity = 0.0;
        } else {
            const sunriseProgress = (progress - PHASE_TIMING.SUNRISE_START) / (1.0 - PHASE_TIMING.SUNRISE_START);
            sunAngle = Math.PI + Math.PI * sunriseProgress * 0.1;
            sunOpacity = sunriseProgress;
        }

        const sunY = Math.sin(sunAngle) * CELESTIAL_DISTANCE;
        const sunZ = Math.cos(sunAngle) * CELESTIAL_DISTANCE;
        this.sun.position.set(0, sunY, sunZ);
        this.sun.material.opacity = sunOpacity;
        this.sunGlow.material.opacity = sunOpacity * 0.3;

        if (sunOpacity > 0.1) {
            this.directionalLight.position.copy(this.sun.position);
        }
    }

    /**
     * Update moon position and opacity based on cycle progress
     * @private
     */
    _updateMoonPosition(progress) {
        let moonAngle;
        let moonOpacity = 0.0;

        if (progress >= PHASE_TIMING.SUNSET_START && progress < PHASE_TIMING.SUNRISE_END) {
            if (progress < PHASE_TIMING.NIGHT_START) {
                const riseProgress = (progress - PHASE_TIMING.SUNSET_START) / (PHASE_TIMING.NIGHT_START - PHASE_TIMING.SUNSET_START);
                moonAngle = Math.PI * riseProgress * 0.5;
                moonOpacity = riseProgress;
            } else if (progress < PHASE_TIMING.NIGHT_END) {
                const nightProgress = (progress - PHASE_TIMING.NIGHT_START) / (PHASE_TIMING.NIGHT_END - PHASE_TIMING.NIGHT_START);
                moonAngle = Math.PI * 0.5 + Math.PI * 0.5 * nightProgress;
                moonOpacity = 1.0;
            } else {
                const setProgress = (progress - PHASE_TIMING.SUNRISE_START) / (1.0 - PHASE_TIMING.SUNRISE_START);
                moonAngle = Math.PI * (1.0 - setProgress * 0.2);
                moonOpacity = 1.0 - setProgress;
            }
        }

        const moonY = Math.sin(moonAngle) * CELESTIAL_DISTANCE;
        const moonZ = -Math.cos(moonAngle) * CELESTIAL_DISTANCE;
        this.moon.position.set(0, moonY, moonZ);
        this.moon.material.opacity = moonOpacity;
        this.moonGlow.material.opacity = moonOpacity * 0.2;

        if (this.currentPhase === PHASES.NIGHT && moonOpacity > 0.5) {
            this.directionalLight.position.copy(this.moon.position);
        }
    }

    updateLighting() {
        const progress = this.cycleProgress;
        const { fromPhase, toPhase, transitionFactor } = this._calculatePhaseTransition(progress);
        this._lerpLightColors(fromPhase, toPhase, transitionFactor);
        this._lerpLightIntensities(fromPhase, toPhase, transitionFactor);
    }

    /**
     * Calculate phase transition information
     * @private
     */
    _calculatePhaseTransition(progress) {
        let transitionFactor = 0;
        let fromPhase = this.currentPhase;
        let toPhase = this.currentPhase;

        if (progress >= PHASE_TIMING.DAY_END - 0.05 && progress < PHASE_TIMING.SUNSET_END) {
            fromPhase = PHASES.DAY;
            toPhase = PHASES.SUNSET;
            transitionFactor = Math.min(1, (progress - (PHASE_TIMING.DAY_END - 0.05)) / 0.15);
        } else if (progress >= PHASE_TIMING.SUNSET_END - 0.05 && progress < PHASE_TIMING.NIGHT_START + 0.05) {
            fromPhase = PHASES.SUNSET;
            toPhase = PHASES.NIGHT;
            transitionFactor = Math.min(1, (progress - (PHASE_TIMING.SUNSET_END - 0.05)) / 0.1);
        } else if (progress >= PHASE_TIMING.NIGHT_END - 0.05 && progress < PHASE_TIMING.SUNRISE_END) {
            fromPhase = PHASES.NIGHT;
            toPhase = PHASES.SUNRISE;
            transitionFactor = Math.min(1, (progress - (PHASE_TIMING.NIGHT_END - 0.05)) / 0.2);
        } else if (progress >= 0.95 || progress < 0.05) {
            fromPhase = PHASES.SUNRISE;
            toPhase = PHASES.DAY;
            transitionFactor = progress >= 0.95 ? (progress - 0.95) / 0.05 : 0.5 + progress / 0.1;
            transitionFactor = Math.min(1, transitionFactor);
        }

        return { fromPhase, toPhase, transitionFactor };
    }

    /**
     * Interpolate light colors between phases
     * @private
     */
    _lerpLightColors(fromPhase, toPhase, transitionFactor) {
        const fromAmbient = AMBIENT_LIGHT_COLORS[fromPhase];
        const toAmbient = AMBIENT_LIGHT_COLORS[toPhase];
        const fromDirectional = DIRECTIONAL_LIGHT_COLORS[fromPhase];
        const toDirectional = DIRECTIONAL_LIGHT_COLORS[toPhase];

        this.ambientLight.color.lerpColors(fromAmbient, toAmbient, transitionFactor);
        this.directionalLight.color.lerpColors(fromDirectional, toDirectional, transitionFactor);
    }

    /**
     * Interpolate light intensities between phases
     * @private
     */
    _lerpLightIntensities(fromPhase, toPhase, transitionFactor) {
        const fromIntensity = LIGHT_INTENSITIES[fromPhase];
        const toIntensity = LIGHT_INTENSITIES[toPhase];

        this.ambientLight.intensity = THREE.MathUtils.lerp(
            fromIntensity.ambient,
            toIntensity.ambient,
            transitionFactor
        );
        this.directionalLight.intensity = THREE.MathUtils.lerp(
            fromIntensity.directional,
            toIntensity.directional,
            transitionFactor
        );
    }

    updateEnvironment() {
        const progress = this.cycleProgress;
        const { fromPhase, toPhase, transitionFactor } = this._calculatePhaseTransition(progress);

        // Update sky color
        const fromSky = SKY_COLORS[fromPhase];
        const toSky = SKY_COLORS[toPhase];
        this.scene.background.lerpColors(fromSky, toSky, transitionFactor);

        // Update fog color
        if (this.scene.fog) {
            const fromFog = FOG_COLORS[fromPhase];
            const toFog = FOG_COLORS[toPhase];
            this.scene.fog.color.lerpColors(fromFog, toFog, transitionFactor);
        }
    }

    updateFireflies(deltaTime) {
        const fireflyOpacity = this._calculateFireflyOpacity();
        this.fireflies.material.opacity = fireflyOpacity;

        if (fireflyOpacity <= 0) return;

        this._animateFireflyPositions();
        this.fireflies.instanceMatrix.needsUpdate = true;
    }

    /**
     * Calculate firefly opacity based on current phase
     * @private
     */
    _calculateFireflyOpacity() {
        if (this.currentPhase === PHASES.NIGHT) {
            return 0.9;
        } else if (this.currentPhase === PHASES.SUNSET) {
            const sunsetProgress = (this.cycleProgress - PHASE_TIMING.SUNSET_START) /
                                   (PHASE_TIMING.SUNSET_END - PHASE_TIMING.SUNSET_START);
            return Math.max(0, sunsetProgress - 0.5) * 1.8;
        } else if (this.currentPhase === PHASES.SUNRISE) {
            const sunriseProgress = (this.cycleProgress - PHASE_TIMING.SUNRISE_START) /
                                    (PHASE_TIMING.SUNRISE_END - PHASE_TIMING.SUNRISE_START);
            return Math.max(0, 0.9 - sunriseProgress * 1.5);
        }
        return 0;
    }

    /**
     * Animate firefly positions and blinking
     * @private
     */
    _animateFireflyPositions() {
        const matrix = new THREE.Matrix4();
        const time = this.cycleTime;

        for (let i = 0; i < FIREFLY_COUNT; i++) {
            const data = this.fireflyData[i];

            // Update position with gentle movement
            data.position.x += data.velocity.x;
            data.position.y += data.velocity.y;
            data.position.z += data.velocity.z;
            data.position.y += Math.sin(time * data.blinkSpeed + data.phase) * 0.01;

            // Keep within bounds - clamp position to prevent overshoot
            const halfArea = FIREFLY_AREA / 2;
            if (Math.abs(data.position.x) > halfArea) {
                data.velocity.x *= -1;
                data.position.x = Math.max(-halfArea, Math.min(halfArea, data.position.x));
            }
            if (data.position.y < 0.5 || data.position.y > 4) {
                data.velocity.y *= -1;
                data.position.y = Math.max(0.5, Math.min(4, data.position.y));
            }
            if (Math.abs(data.position.z) > halfArea) {
                data.velocity.z *= -1;
                data.position.z = Math.max(-halfArea, Math.min(halfArea, data.position.z));
            }

            // Blink effect (scale)
            const blink = 0.5 + 0.5 * Math.sin(time * data.blinkSpeed + data.phase);
            const scale = data.baseScale * (0.3 + 0.7 * blink);

            matrix.makeScale(scale, scale, scale);
            matrix.setPosition(data.position);
            this.fireflies.setMatrixAt(i, matrix);
        }
    }

    updateStars() {
        // Stars visible during night, fade in/out during transitions
        let starOpacity = 0;

        if (this.currentPhase === PHASES.NIGHT) {
            starOpacity = 0.8;
        } else if (this.currentPhase === PHASES.SUNSET) {
            const sunsetProgress = (this.cycleProgress - PHASE_TIMING.SUNSET_START) /
                                   (PHASE_TIMING.SUNSET_END - PHASE_TIMING.SUNSET_START);
            starOpacity = Math.max(0, sunsetProgress - 0.3) * 1.2;
        } else if (this.currentPhase === PHASES.SUNRISE) {
            const sunriseProgress = (this.cycleProgress - PHASE_TIMING.SUNRISE_START) /
                                    (PHASE_TIMING.SUNRISE_END - PHASE_TIMING.SUNRISE_START);
            starOpacity = Math.max(0, 0.8 - sunriseProgress * 1.3);
        }

        this.stars.material.opacity = starOpacity;
    }

    updatePointLights(deltaTime) {
        const targetIntensity = this._calculateLampTargetIntensity();

        this.pointLights.forEach((lampData, index) => {
            lampData.targetIntensity = targetIntensity;
            const newIntensity = this._calculateLampIntensity(lampData, index);
            lampData.light.intensity = newIntensity;
            this._updateLampEmissive(lampData, newIntensity);
        });
    }

    /**
     * Calculate target lamp intensity based on current phase
     * @private
     */
    _calculateLampTargetIntensity() {
        if (this.currentPhase === PHASES.NIGHT) {
            return 1.0;
        } else if (this.currentPhase === PHASES.SUNSET) {
            const sunsetProgress = (this.cycleProgress - PHASE_TIMING.SUNSET_START) /
                                   (PHASE_TIMING.SUNSET_END - PHASE_TIMING.SUNSET_START);
            return Math.min(1, Math.max(0, sunsetProgress - 0.2) * 1.25);
        } else if (this.currentPhase === PHASES.SUNRISE) {
            const sunriseProgress = (this.cycleProgress - PHASE_TIMING.SUNRISE_START) /
                                    (PHASE_TIMING.SUNRISE_END - PHASE_TIMING.SUNRISE_START);
            return Math.max(0, 1.0 - sunriseProgress * 1.2);
        }
        return 0;
    }

    /**
     * Calculate lamp intensity with lerp and flicker effects
     * @private
     */
    _calculateLampIntensity(lampData, index) {
        const lerpFactor = 0.05;
        const currentIntensity = lampData.light.intensity;
        let newIntensity = THREE.MathUtils.lerp(
            currentIntensity,
            lampData.baseIntensity * lampData.targetIntensity,
            lerpFactor
        );

        if (newIntensity > 0.1) {
            const time = this.cycleTime;
            const flickerPhase = index * 1.234 + time * 0.8;

            const flicker1 = Math.sin(flickerPhase * 3.7) * 0.015;
            const flicker2 = Math.sin(flickerPhase * 7.3) * 0.008;
            const flicker3 = Math.sin(flickerPhase * 13.1) * 0.004;

            newIntensity += flicker1 + flicker2 + flicker3;

            if (Math.sin(flickerPhase * 0.37) > 0.98) {
                newIntensity *= 0.85;
            }
        }

        return Math.max(0, Math.min(lampData.baseIntensity, newIntensity));
    }

    /**
     * Update lamp mesh emissive material to match light intensity
     * @private
     */
    _updateLampEmissive(lampData, newIntensity) {
        if (lampData.light.userData.lampMaterial) {
            const emissiveMaterial = lampData.light.userData.lampMaterial;
            const emissiveIntensity = newIntensity / lampData.baseIntensity;
            emissiveMaterial.emissiveIntensity = emissiveIntensity;
        }
    }

    updateTimeDisplay() {
        if (!this.timeDisplay) return;

        // Update phase icon and text
        let icon, text, bgColor;

        switch (this.currentPhase) {
            case PHASES.DAY:
                icon = '☀️';
                text = 'Day';
                bgColor = 'rgba(135, 206, 235, 0.6)';
                break;
            case PHASES.SUNSET:
                icon = '🌅';
                text = 'Sunset';
                bgColor = 'rgba(255, 112, 67, 0.6)';
                break;
            case PHASES.NIGHT:
                icon = '🌙';
                text = 'Night';
                bgColor = 'rgba(20, 20, 50, 0.8)';
                break;
            case PHASES.SUNRISE:
                icon = '🌄';
                text = 'Sunrise';
                bgColor = 'rgba(255, 160, 122, 0.6)';
                break;
        }

        if (this.phaseIcon) {
            this.phaseIcon.textContent = icon;
        }
        if (this.phaseText) {
            this.phaseText.textContent = text;
        }
        if (this.timeDisplay) {
            this.timeDisplay.style.background = bgColor;
        }
    }

    // Get current phase for external use
    getPhase() {
        return this.currentPhase;
    }

    // Get cycle progress (0 to 1) for external use
    getProgress() {
        return this.cycleProgress;
    }

    // Check if it's nighttime (for game mechanics)
    isNight() {
        return this.currentPhase === PHASES.NIGHT;
    }

    // Set specific time (for testing or gameplay purposes)
    setTime(progress) {
        this.cycleTime = progress * this.cycleDuration;
    }

    // ============================================
    // EVENT SYSTEM
    // ============================================

    // Add event listener - returns an ID for reliable removal
    on(eventName, callback) {
        if (this.eventListeners[eventName]) {
            const id = this._nextListenerId++;
            this.eventListeners[eventName].set(id, callback);
            return id;
        } else {
            console.warn(`Unknown event type: ${eventName}`);
            return -1;
        }
    }

    // Remove event listener by ID or callback reference
    off(eventName, idOrCallback) {
        const listeners = this.eventListeners[eventName];
        if (!listeners) return;

        if (typeof idOrCallback === 'number') {
            listeners.delete(idOrCallback);
        } else {
            // Fallback: remove by callback reference
            for (const [id, cb] of listeners) {
                if (cb === idOrCallback) {
                    listeners.delete(id);
                    break;
                }
            }
        }
    }

    // Remove all listeners for an event, or all events if no name given
    offAll(eventName) {
        if (eventName) {
            if (this.eventListeners[eventName]) {
                this.eventListeners[eventName].clear();
            }
        } else {
            for (const key of Object.keys(this.eventListeners)) {
                this.eventListeners[key].clear();
            }
        }
    }

    // Emit event
    emit(eventName, data) {
        const listeners = this.eventListeners[eventName];
        if (listeners) {
            for (const callback of listeners.values()) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${eventName} listener:`, error);
                }
            }
        }
    }

    // ============================================
    // CLEANUP
    // ============================================

    dispose() {
        // Remove DOM element
        if (this.timeDisplay && this.timeDisplay.parentNode) {
            this.timeDisplay.parentNode.removeChild(this.timeDisplay);
            this.timeDisplay = null;
        }

        // Clear all event listeners
        this.offAll();
    }

    // ============================================
    // CONFIGURATION METHODS
    // ============================================

    // Get cycle duration in seconds
    getCycleDuration() {
        return this.cycleDuration;
    }

    // Set cycle duration in seconds
    setCycleDuration(duration) {
        if (duration > 0) {
            this.cycleDuration = duration;
            // Recalculate progress based on new duration
            this.cycleProgress = this.cycleTime / this.cycleDuration;
        }
    }

    // Get time speed multiplier
    getTimeSpeed() {
        return this.timeSpeed;
    }

    // Set time speed multiplier
    setTimeSpeed(speed) {
        if (speed >= 0) {
            this.timeSpeed = speed;
        }
    }

    // Get current time in seconds
    getCurrentTime() {
        return this.cycleTime;
    }

    // Get current time in 24-hour format
    getTimeIn24HourFormat() {
        const hours = this.cycleProgress * 24;
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        return {
            hours: h,
            minutes: m,
            formatted: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        };
    }
}

// Export the class and constants
export { DayNightCycle, PHASES, DEFAULT_CYCLE_DURATION };
