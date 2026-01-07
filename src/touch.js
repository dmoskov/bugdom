// Touch controls for mobile devices
// This module sets up virtual joystick and touch controls

let touchControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    joystickActive: false,
    joystickAngle: 0,
    joystickStrength: 0
};

// Initialize touch controls
export function initTouchControls() {
    const joystickOuter = document.querySelector('.joystick-base');
    const joystickInner = document.querySelector('.joystick-stick');

    if (!joystickOuter || !joystickInner) {
        console.warn('Touch control elements not found in DOM');
        return;
    }

    let touchId = null;
    let joystickCenter = { x: 0, y: 0 };
    const maxDistance = 40; // Maximum distance the stick can move from center

    function updateJoystickPosition(touch) {
        const rect = joystickOuter.getBoundingClientRect();
        joystickCenter.x = rect.left + rect.width / 2;
        joystickCenter.y = rect.top + rect.height / 2;

        let dx = touch.clientX - joystickCenter.x;
        let dy = touch.clientY - joystickCenter.y;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Clamp to max distance
        const clampedDistance = Math.min(distance, maxDistance);

        const x = Math.cos(angle) * clampedDistance;
        const y = Math.sin(angle) * clampedDistance;

        joystickInner.style.transform = `translate(${x}px, ${y}px)`;

        // Calculate controls
        touchControls.joystickAngle = angle;
        touchControls.joystickStrength = clampedDistance / maxDistance;

        // Convert to directional controls
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        const threshold = 0.3;

        touchControls.forward = normalizedDy < -threshold && touchControls.joystickStrength > 0.2;
        touchControls.backward = normalizedDy > threshold && touchControls.joystickStrength > 0.2;
        touchControls.left = normalizedDx < -threshold && touchControls.joystickStrength > 0.2;
        touchControls.right = normalizedDx > threshold && touchControls.joystickStrength > 0.2;
    }

    function resetJoystick() {
        joystickInner.style.transform = 'translate(0, 0)';
        touchControls.forward = false;
        touchControls.backward = false;
        touchControls.left = false;
        touchControls.right = false;
        touchControls.joystickActive = false;
        touchControls.joystickStrength = 0;
        touchId = null;
    }

    // Touch event handlers
    joystickOuter.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (touchId === null) {
            touchId = e.touches[0].identifier;
            touchControls.joystickActive = true;
            updateJoystickPosition(e.touches[0]);
        }
    });

    joystickOuter.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchId) {
                updateJoystickPosition(e.touches[i]);
                break;
            }
        }
    });

    joystickOuter.addEventListener('touchend', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                resetJoystick();
                break;
            }
        }
    });

    joystickOuter.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                resetJoystick();
                break;
            }
        }
    });

    // Show controls on mobile - improved detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                     ('ontouchstart' in window);
    const touchUI = document.getElementById('touch-controls');
    if (touchUI) {
        touchUI.classList.toggle('active', isMobile);
    }

    console.log('Touch controls initialized:', { isMobile, touchUI: !!touchUI });
}

// Export touch controls state
export function getTouchControls() {
    return touchControls;
}

// Prevent default touch behaviors on the document to avoid page scrolling/zooming
function preventDefaultTouchBehaviors() {
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Prevent pinch zoom
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });

    document.addEventListener('gesturechange', (e) => {
        e.preventDefault();
    });

    document.addEventListener('gestureend', (e) => {
        e.preventDefault();
    });

    // Prevent page scrolling when touching the game canvas
    document.addEventListener('touchmove', (e) => {
        // Allow scrolling in help overlay
        if (e.target.closest('#help-overlay, #help-content')) {
            return;
        }
        e.preventDefault();
    }, { passive: false });
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTouchControls();
        preventDefaultTouchBehaviors();
    });
} else {
    initTouchControls();
    preventDefaultTouchBehaviors();
}
