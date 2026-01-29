// ============================================
// SCENE SETUP AND INITIALIZATION
// ============================================
// Handles Three.js scene, renderer, and lighting setup

import * as THREE from 'three';
import { errorHandler } from './errorHandler.js';

/**
 * Initialize the Three.js scene, renderer, and basic environment
 * @param {HTMLElement} gameContainer - The container element for the game
 * @returns {Object} Scene setup objects
 */
export function initializeScene(gameContainer) {
    let scene, renderer, ambientLight, directionalLight;

    try {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // Sky blue
        scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

        // Setup renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        const canvasWidth = gameContainer ? gameContainer.clientWidth : window.innerWidth;
        const canvasHeight = gameContainer ? gameContainer.clientHeight : window.innerHeight;
        renderer.setSize(canvasWidth, canvasHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        if (gameContainer) {
            gameContainer.appendChild(renderer.domElement);
        } else {
            document.body.appendChild(renderer.domElement);
        }

        // Setup lighting
        ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        return {
            scene,
            renderer,
            ambientLight,
            directionalLight
        };
    } catch (error) {
        errorHandler.handleError(error, 'WebGL Initialization');
        errorHandler.showUserError('Failed to initialize 3D graphics. Your browser may not support WebGL.');
        throw new Error('WebGL initialization failed: ' + error.message);
    }
}

/**
 * Setup window resize handler
 * @param {THREE.WebGLRenderer} renderer - The Three.js renderer
 * @param {CameraController} cameraController - The camera controller
 */
export function setupWindowResize(renderer, cameraController) {
    window.addEventListener('resize', () => {
        cameraController.handleResize();
        const container = document.getElementById('game-container');
        const width = container ? container.clientWidth : window.innerWidth;
        const height = container ? container.clientHeight : window.innerHeight;
        renderer.setSize(width, height);
    });
}
