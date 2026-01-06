import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground plane with grass texture
const groundGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a9d2e,
    roughness: 0.8,
    metalness: 0.2
});

// Add some vertex displacement for a more natural look
const positionAttribute = groundGeometry.getAttribute('position');
for (let i = 0; i < positionAttribute.count; i++) {
    const z = positionAttribute.getZ(i);
    positionAttribute.setZ(i, z + Math.random() * 0.3);
}
positionAttribute.needsUpdate = true;
groundGeometry.computeVertexNormals();

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Add grass patches (darker green spots)
for (let i = 0; i < 20; i++) {
    const patchGeometry = new THREE.CircleGeometry(Math.random() * 2 + 1, 16);
    const patchMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d8026,
        roughness: 0.9
    });
    const patch = new THREE.Mesh(patchGeometry, patchMaterial);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(
        Math.random() * 80 - 40,
        0.01,
        Math.random() * 80 - 40
    );
    scene.add(patch);
}

// Add rocks (obstacles)
const rockPositions = [
    { x: -15, z: -10, size: 2 },
    { x: 10, z: -15, size: 1.5 },
    { x: -5, z: 8, size: 1.8 },
    { x: 20, z: 5, size: 2.2 },
    { x: -20, z: 15, size: 1.6 },
    { x: 15, z: -5, size: 1.4 },
    { x: -8, z: -18, size: 1.9 }
];

rockPositions.forEach(pos => {
    const rockGeometry = new THREE.DodecahedronGeometry(pos.size, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.9,
        metalness: 0.1
    });

    // Randomize the rock shape slightly
    const posAttr = rockGeometry.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        const scale = 1 + (Math.random() - 0.5) * 0.3;
        posAttr.setXYZ(i, x * scale, y * scale, z * scale);
    }
    posAttr.needsUpdate = true;
    rockGeometry.computeVertexNormals();

    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(pos.x, pos.size, pos.z);
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.userData.obstacle = true;
    scene.add(rock);
});

// Add flowers (colorful obstacles)
const flowerPositions = [
    { x: -12, z: 5, color: 0xff69b4 },
    { x: 5, z: 12, color: 0xffff00 },
    { x: -18, z: -5, color: 0xff1493 },
    { x: 8, z: -8, color: 0xff69b4 },
    { x: -2, z: 15, color: 0xffa500 },
    { x: 18, z: -12, color: 0xffff00 },
    { x: -10, z: -15, color: 0xff1493 },
    { x: 12, z: 8, color: 0xffa500 }
];

flowerPositions.forEach(pos => {
    // Flower stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(pos.x, 0.5, pos.z);
    stem.castShadow = true;
    scene.add(stem);

    // Flower petals
    const petalGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
        const petalGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const petalMaterial = new THREE.MeshStandardMaterial({ color: pos.color });
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        const angle = (i / 6) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4);
        petal.scale.set(1, 0.3, 1);
        petal.castShadow = true;
        petalGroup.add(petal);
    }

    // Flower center
    const centerGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.castShadow = true;
    petalGroup.add(center);

    petalGroup.position.set(pos.x, 1, pos.z);
    petalGroup.userData.obstacle = true;
    scene.add(petalGroup);
});

// Boundaries (invisible walls)
const boundarySize = 50;
const boundaries = [
    { x: 0, z: boundarySize, rotation: 0 },      // North
    { x: 0, z: -boundarySize, rotation: 0 },     // South
    { x: boundarySize, z: 0, rotation: Math.PI / 2 },  // East
    { x: -boundarySize, z: 0, rotation: Math.PI / 2 }  // West
];

boundaries.forEach(boundary => {
    const wallGeometry = new THREE.PlaneGeometry(100, 10);
    const wallMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(boundary.x, 5, boundary.z);
    wall.rotation.y = boundary.rotation;
    wall.userData.boundary = true;
    scene.add(wall);
});

// Visual boundary markers (fence posts)
const fencePosts = [];
for (let i = -40; i <= 40; i += 10) {
    // North and South
    [boundarySize - 2, -boundarySize + 2].forEach(z => {
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(i, 1, z);
        post.castShadow = true;
        scene.add(post);
    });

    // East and West
    [boundarySize - 2, -boundarySize + 2].forEach(x => {
        const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(x, 1, i);
        post.castShadow = true;
        scene.add(post);
    });
}

// ============================================
// COLLECTIBLE CLOVERS
// ============================================

// Score state
let score = 0;
const clovers = [];

// Create a single clover leaf (heart shape)
function createCloverLeaf() {
    const shape = new THREE.Shape();

    // Heart-shaped leaf
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.1, 0.1, 0.2, 0.2, 0.15, 0.35);
    shape.bezierCurveTo(0.1, 0.5, 0, 0.45, 0, 0.35);
    shape.bezierCurveTo(0, 0.45, -0.1, 0.5, -0.15, 0.35);
    shape.bezierCurveTo(-0.2, 0.2, -0.1, 0.1, 0, 0);

    const extrudeSettings = {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

// Create a full clover (3 or 4 leaves)
function createClover(x, z, isFourLeaf = false) {
    const cloverGroup = new THREE.Group();

    // Clover leaves
    const leafCount = isFourLeaf ? 4 : 3;
    const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x114411,
        emissiveIntensity: 0.2
    });

    for (let i = 0; i < leafCount; i++) {
        const leafGeometry = createCloverLeaf();
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / leafCount) * Math.PI * 2;
        leaf.position.set(0, 0.5, 0);
        leaf.rotation.x = -Math.PI / 2;
        leaf.rotation.z = angle;
        leaf.scale.set(0.8, 0.8, 0.8);
        leaf.castShadow = true;
        cloverGroup.add(leaf);
    }

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 6);
    const stemMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a6b1a,
        roughness: 0.7
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.25;
    stem.castShadow = true;
    cloverGroup.add(stem);

    // Position the clover
    cloverGroup.position.set(x, 0.1, z);

    // Add floating animation properties
    cloverGroup.userData = {
        collectible: true,
        collected: false,
        baseY: 0.1,
        rotationSpeed: 0.02 + Math.random() * 0.01,
        floatSpeed: 2 + Math.random(),
        floatOffset: Math.random() * Math.PI * 2,
        isFourLeaf: isFourLeaf
    };

    return cloverGroup;
}

// Generate clover positions (avoiding rocks and flowers)
const cloverPositions = [
    { x: 5, z: 3 },
    { x: -8, z: 12 },
    { x: 12, z: -8 },
    { x: -15, z: -12 },
    { x: 20, z: 10 },
    { x: -22, z: 8 },
    { x: 8, z: -20 },
    { x: -5, z: -5 },
    { x: 15, z: 15 },
    { x: -18, z: -18 },
    { x: 25, z: -5 },
    { x: -10, z: 20 },
    { x: 0, z: -15 }
];

// Add clovers to scene
cloverPositions.forEach((pos, index) => {
    // Make every 4th clover a four-leaf clover (worth more points)
    const isFourLeaf = index % 4 === 0;
    const clover = createClover(pos.x, pos.z, isFourLeaf);
    scene.add(clover);
    clovers.push(clover);
});

// Collision detection radius
const COLLECTION_RADIUS = 2.5;

// Check for clover collection
function checkCloverCollision() {
    clovers.forEach(clover => {
        if (clover.userData.collected) return;

        const distance = camera.position.distanceTo(clover.position);

        if (distance < COLLECTION_RADIUS) {
            collectClover(clover);
        }
    });
}

// Collect a clover
function collectClover(clover) {
    if (clover.userData.collected) return;

    clover.userData.collected = true;

    // Four-leaf clovers worth more
    const points = clover.userData.isFourLeaf ? 25 : 10;
    score += points;

    // Update score display
    updateScoreDisplay();

    // Animate collection (scale down and fade)
    animateCollection(clover);
}

// Collection animation
function animateCollection(clover) {
    const startScale = clover.scale.x;
    const startY = clover.position.y;
    let progress = 0;

    function animateStep() {
        progress += 0.08;

        if (progress >= 1) {
            scene.remove(clover);
            return;
        }

        // Scale down
        const scale = startScale * (1 - progress);
        clover.scale.set(scale, scale, scale);

        // Float up
        clover.position.y = startY + progress * 2;

        // Spin
        clover.rotation.y += 0.2;

        requestAnimationFrame(animateStep);
    }

    animateStep();
}

// Update score display in UI
function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `Score: ${score}`;
    }
}

// Animate clovers (floating and rotating)
function animateClovers(time) {
    clovers.forEach(clover => {
        if (clover.userData.collected) return;

        // Floating animation
        const floatY = Math.sin(time * 0.001 * clover.userData.floatSpeed + clover.userData.floatOffset) * 0.15;
        clover.position.y = clover.userData.baseY + floatY + 0.3;

        // Rotation
        clover.rotation.y += clover.userData.rotationSpeed;
    });
}

// ============================================
// CAMERA CONTROLS
// ============================================

const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

let mouseX = 0;
let mouseY = 0;
let targetRotationY = 0;
let targetRotationX = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotationY = -mouseX * Math.PI;
    targetRotationX = -mouseY * 0.5;
});

// ============================================
// ANIMATION LOOP
// ============================================

let animationTime = 0;

function animate() {
    requestAnimationFrame(animate);
    animationTime += 16; // ~60fps

    // Camera movement
    const speed = 0.2;
    const direction = new THREE.Vector3();

    if (keys.w || keys.ArrowUp) direction.z -= 1;
    if (keys.s || keys.ArrowDown) direction.z += 1;
    if (keys.a || keys.ArrowLeft) direction.x -= 1;
    if (keys.d || keys.ArrowRight) direction.x += 1;

    if (direction.length() > 0) {
        direction.normalize();
        direction.applyQuaternion(camera.quaternion);
        camera.position.x += direction.x * speed;
        camera.position.z += direction.z * speed;

        // Keep camera within boundaries
        camera.position.x = Math.max(-45, Math.min(45, camera.position.x));
        camera.position.z = Math.max(-45, Math.min(45, camera.position.z));
    }

    // Smooth camera rotation
    camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05;
    camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.05;
    camera.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, camera.rotation.x));

    // Update clovers animation
    animateClovers(animationTime);

    // Check for clover collection
    checkCloverCollision();

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();

// Export scene for testing
export { scene, camera, renderer, score, clovers };
