// Touch controls for mobile devices
// This module sets up lower-half touch controls with visual joystick feedback
// Following mobile game best practices: restrict touch to lower half to avoid
// accidental touches on UI and maximize comfortable thumb reach zones

let touchControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    joystickActive: false,
    joystickAngle: 0,
    joystickStrength: 0
};

// Store event listeners for cleanup
let eventListeners = [];

// Touch zone configuration - restrict to lower portion of screen
const TOUCH_ZONE_TOP_PERCENT = 0.4; // Touch zone starts at 40% down the screen (60% of screen is active)

// Initialize touch controls
export function initTouchControls() {
    const joystickOuter = document.querySelector('.joystick-base');
    const joystickInner = document.querySelector('.joystick-stick');

    if (!joystickOuter || !joystickInner) {
        console.warn('Touch control elements not found in DOM');
        return;
    }

    let activeTouchId = null;
    let touchStartPos = { x: 0, y: 0 };
    const maxDistance = 40; // Maximum distance the visual stick can move from center

    // Helper function to check if touch is in valid zone (lower 60% of screen)
    function isInTouchZone(y) {
        const touchZoneTop = window.innerHeight * TOUCH_ZONE_TOP_PERCENT;
        return y >= touchZoneTop;
    }

    // Calculate controls based on touch position relative to screen center
    function updateControlsFromTouch(touch) {
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;

        // Calculate offset from screen center
        let dx = touch.clientX - screenCenterX;
        let dy = touch.clientY - screenCenterY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Calculate strength based on distance from center (normalized to screen size)
        const maxScreenDistance = Math.min(window.innerWidth, window.innerHeight) / 2;
        touchControls.joystickAngle = angle;
        touchControls.joystickStrength = Math.min(distance / maxScreenDistance, 1.0);

        // Update visual joystick to show touch direction
        const visualDx = touch.clientX - touchStartPos.x;
        const visualDy = touch.clientY - touchStartPos.y;
        const visualDistance = Math.sqrt(visualDx * visualDx + visualDy * visualDy);
        const visualAngle = Math.atan2(visualDy, visualDx);
        const clampedDistance = Math.min(visualDistance, maxDistance);
        const visualX = Math.cos(visualAngle) * clampedDistance;
        const visualY = Math.sin(visualAngle) * clampedDistance;
        joystickInner.style.transform = `translate(${visualX}px, ${visualY}px)`;

        // Convert to directional controls using screen center as reference
        const normalizedDx = dx / (distance || 1);
        const normalizedDy = dy / (distance || 1);
        const threshold = 0.2; // Lower threshold for easier control

        touchControls.forward = normalizedDy < -threshold && touchControls.joystickStrength > 0.1;
        touchControls.backward = normalizedDy > threshold && touchControls.joystickStrength > 0.1;
        touchControls.left = normalizedDx < -threshold && touchControls.joystickStrength > 0.1;
        touchControls.right = normalizedDx > threshold && touchControls.joystickStrength > 0.1;
    }

    function resetControls() {
        joystickInner.style.transform = 'translate(0, 0)';
        touchControls.forward = false;
        touchControls.backward = false;
        touchControls.left = false;
        touchControls.right = false;
        touchControls.joystickActive = false;
        touchControls.joystickStrength = 0;
        activeTouchId = null;
    }

    // Lower-half touch event handlers on document
    // Following mobile game best practices: restrict touch to lower 60% of screen
    // This prevents accidental touches on UI elements and keeps controls in thumb reach zone
    const handleTouchStart = (e) => {
        // Ignore touches on UI elements
        if (e.target.closest('#start-overlay, #pause-overlay, #help-overlay, button')) {
            return;
        }

        // Only accept touches in the lower portion of the screen
        if (!isInTouchZone(e.touches[0].clientY)) {
            return;
        }

        e.preventDefault();
        if (activeTouchId === null && e.touches.length > 0) {
            activeTouchId = e.touches[0].identifier;
            touchControls.joystickActive = true;

            // Store where the touch started for visual feedback
            touchStartPos.x = e.touches[0].clientX;
            touchStartPos.y = e.touches[0].clientY;

            updateControlsFromTouch(e.touches[0]);
        }
    };

    const handleTouchMove = (e) => {
        // Ignore touches on UI elements
        if (e.target.closest('#start-overlay, #pause-overlay, #help-overlay, button')) {
            return;
        }

        e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === activeTouchId) {
                // Allow touchmove to continue even if it drifts outside the zone
                // This prevents jarring control loss during gameplay
                updateControlsFromTouch(e.touches[i]);
                break;
            }
        }
    };

    const handleTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
                resetControls();
                break;
            }
        }
    };

    const handleTouchCancel = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
                resetControls();
                break;
            }
        }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    // Store listeners for cleanup
    eventListeners.push(
        { element: document, event: 'touchstart', handler: handleTouchStart, options: { passive: false } },
        { element: document, event: 'touchmove', handler: handleTouchMove, options: { passive: false } },
        { element: document, event: 'touchend', handler: handleTouchEnd, options: { passive: false } },
        { element: document, event: 'touchcancel', handler: handleTouchCancel, options: { passive: false } }
    );

    // Show controls on mobile - improved detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                     ('ontouchstart' in window);
    const touchUI = document.getElementById('touch-controls');
    if (touchUI) {
        touchUI.classList.toggle('active', isMobile);
    }
}

// Export touch controls state
export function getTouchControls() {
    return touchControls;
}

// Prevent default touch behaviors on the document to avoid page scrolling/zooming
function preventDefaultTouchBehaviors() {
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const handleDoubleTapPrevention = (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    };

    const handleGestureStart = (e) => {
        e.preventDefault();
    };

    const handleGestureChange = (e) => {
        e.preventDefault();
    };

    const handleGestureEnd = (e) => {
        e.preventDefault();
    };

    const handleScrollPrevention = (e) => {
        // Allow scrolling in help overlay
        if (e.target.closest('#help-overlay, #help-content')) {
            return;
        }
        e.preventDefault();
    };

    document.addEventListener('touchend', handleDoubleTapPrevention, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart);
    document.addEventListener('gesturechange', handleGestureChange);
    document.addEventListener('gestureend', handleGestureEnd);
    document.addEventListener('touchmove', handleScrollPrevention, { passive: false });

    // Store listeners for cleanup
    eventListeners.push(
        { element: document, event: 'touchend', handler: handleDoubleTapPrevention, options: { passive: false } },
        { element: document, event: 'gesturestart', handler: handleGestureStart, options: undefined },
        { element: document, event: 'gesturechange', handler: handleGestureChange, options: undefined },
        { element: document, event: 'gestureend', handler: handleGestureEnd, options: undefined },
        { element: document, event: 'touchmove', handler: handleScrollPrevention, options: { passive: false } }
    );
}

// Cleanup function to remove all event listeners
export function cleanupTouchControls() {
    eventListeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
    });
    eventListeners = [];

    // Reset touch controls state
    touchControls.forward = false;
    touchControls.backward = false;
    touchControls.left = false;
    touchControls.right = false;
    touchControls.joystickActive = false;
    touchControls.joystickStrength = 0;
}

// Initialize on load
const handleDOMContentLoaded = () => {
    initTouchControls();
    preventDefaultTouchBehaviors();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
    // Store for cleanup
    eventListeners.push(
        { element: document, event: 'DOMContentLoaded', handler: handleDOMContentLoaded, options: undefined }
    );
} else {
    initTouchControls();
    preventDefaultTouchBehaviors();
}
