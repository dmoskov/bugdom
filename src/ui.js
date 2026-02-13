// ============================================
// UI MANAGER
// ============================================
// Handles all DOM manipulation, displays, overlays, and popups
// Pure UI/presentation logic with no game state management

export class UIManager {
  constructor(audioManager, gameState) {
    this.audioManager = audioManager;
    this.gameState = gameState;
    this.minimapCanvas = null;
    this.minimapCtx = null;
    this.welcomeMessageShown = false;

    // Minimap constants
    this.MINIMAP_SIZE = 150;
    this.WORLD_SIZE = 100; // -50 to 50 in game units
    this.MINIMAP_SCALE = this.MINIMAP_SIZE / this.WORLD_SIZE;

    // Track event listeners for cleanup
    this.eventListeners = [];

    this.initMinimap();
  }

  // ============================================
  // MINIMAP SYSTEM
  // ============================================

  initMinimap() {
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
  }

  worldToMinimap(worldX, worldZ) {
    const minimapX = (worldX + this.WORLD_SIZE / 2) * this.MINIMAP_SCALE;
    const minimapY = (worldZ + this.WORLD_SIZE / 2) * this.MINIMAP_SCALE;
    return { x: minimapX, y: minimapY };
  }

  drawMinimap(playerPos, playerRotation, clovers, enemies, bees) {
    if (!this.minimapCtx) return;

    // Clear the canvas with semi-transparent background
    this.minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.minimapCtx.fillRect(0, 0, this.MINIMAP_SIZE, this.MINIMAP_SIZE);

    // Draw boundary outline
    this.minimapCtx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
    this.minimapCtx.lineWidth = 2;
    const boundaryPadding = 5 * this.MINIMAP_SCALE;
    this.minimapCtx.strokeRect(
      boundaryPadding,
      boundaryPadding,
      this.MINIMAP_SIZE - boundaryPadding * 2,
      this.MINIMAP_SIZE - boundaryPadding * 2
    );

    // Draw uncollected clovers as yellow dots
    this.minimapCtx.fillStyle = '#ffcc00';
    clovers.forEach(clover => {
      if (!clover.userData.collected) {
        const pos = this.worldToMinimap(clover.position.x, clover.position.z);
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        this.minimapCtx.fill();
      }
    });

    // Draw enemies (ants) as red dots
    this.minimapCtx.fillStyle = '#ff3333';
    enemies.forEach(enemy => {
      const pos = this.worldToMinimap(enemy.position.x, enemy.position.z);
      this.minimapCtx.beginPath();
      this.minimapCtx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      this.minimapCtx.fill();
    });

    // Draw bees as orange dots
    this.minimapCtx.fillStyle = '#ff9900';
    bees.forEach(bee => {
      const pos = this.worldToMinimap(bee.position.x, bee.position.z);
      this.minimapCtx.beginPath();
      this.minimapCtx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      this.minimapCtx.fill();
    });

    // Draw player as green dot with direction indicator
    const playerMapPos = this.worldToMinimap(playerPos.x, playerPos.z);

    // Player direction indicator (triangle)
    this.minimapCtx.fillStyle = '#00ff00';
    this.minimapCtx.save();
    this.minimapCtx.translate(playerMapPos.x, playerMapPos.y);
    this.minimapCtx.rotate(-playerRotation);
    this.minimapCtx.beginPath();
    this.minimapCtx.moveTo(0, -6);  // Point forward
    this.minimapCtx.lineTo(-4, 4);
    this.minimapCtx.lineTo(4, 4);
    this.minimapCtx.closePath();
    this.minimapCtx.fill();
    this.minimapCtx.restore();

    // Player glow effect
    this.minimapCtx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    this.minimapCtx.beginPath();
    this.minimapCtx.arc(playerMapPos.x, playerMapPos.y, 8, 0, Math.PI * 2);
    this.minimapCtx.fill();
  }

  // ============================================
  // HUD UPDATES
  // ============================================

  updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      const score = this.gameState.getScore();
      const highScore = this.gameState.getHighScore();
      if (highScore > 0) {
        scoreElement.innerHTML = `Score: ${score}<br><span style="font-size: 14px; color: #ffcc00;">Best: ${highScore}</span>`;
      } else {
        scoreElement.textContent = `Score: ${score}`;
      }
    }
  }

  updateHealthDisplay() {
    const healthSegments = document.querySelectorAll('.health-segment');
    const healthText = document.getElementById('health-text');
    const playerHealth = this.gameState.getPlayerHealth();
    const maxHealth = this.gameState.getMaxHealth();

    if (healthSegments.length > 0) {
      // Each segment represents 10 HP (100 HP / 10 segments = 10 HP per segment)
      const segmentsToShow = Math.ceil(playerHealth / 10);

      healthSegments.forEach((segment, index) => {
        segment.classList.remove('empty', 'warning', 'critical');

        if (index < segmentsToShow) {
          // Segment is filled
          if (playerHealth <= 25) {
            segment.classList.add('critical');
          } else if (playerHealth <= 50) {
            segment.classList.add('warning');
          }
        } else {
          // Segment is empty
          segment.classList.add('empty');
        }
      });
    }

    if (healthText) {
      healthText.textContent = `${playerHealth} / ${maxHealth}`;
    }
  }

  updateCloverCountDisplay() {
    const cloverCountElement = document.getElementById('clover-count');
    if (cloverCountElement) {
      const collected = this.gameState.getCloversCollected();
      const total = this.gameState.getTotalClovers();
      cloverCountElement.textContent = `🍀 ${collected}/${total}`;
    }
  }

  updateLevelDisplay() {
    const levelElement = document.getElementById('level-display');
    if (levelElement) {
      const currentLevel = this.gameState.getCurrentLevel();
      const difficulty = this.gameState.getSelectedDifficulty();
      const difficultyEmoji = { easy: '🟢', medium: '🟡', hard: '🔴' }[difficulty];
      levelElement.textContent = `${difficultyEmoji} Level ${currentLevel}`;
      // Flash animation on level up
      levelElement.classList.remove('level-up');
      void levelElement.offsetWidth; // Force reflow
      levelElement.classList.add('level-up');
    }
  }

  updateComboDisplay() {
    const comboElement = document.getElementById('combo-display');
    if (comboElement) {
      const comboMultiplier = this.gameState.getComboMultiplier();
      if (comboMultiplier > 1) {
        comboElement.textContent = `x${comboMultiplier} Combo`;
        comboElement.classList.add('active');
      } else {
        comboElement.textContent = '';
        comboElement.classList.remove('active');
      }
    }
  }

  updateLivesDisplay() {
    const livesDisplay = document.getElementById('lives-display');
    if (livesDisplay) {
      const extraLives = this.gameState.getExtraLives();
      if (extraLives > 0) {
        livesDisplay.textContent = `Lives: ${extraLives}`;
        livesDisplay.style.display = 'block';
      } else {
        livesDisplay.style.display = 'none';
      }
    }
  }

  // ============================================
  // POPUP MESSAGES
  // ============================================

  showComboPopup(multiplier, points) {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.innerHTML = `
      <div class="combo-multiplier">x${multiplier} COMBO!</div>
      <div class="combo-points">+${points}</div>
    `;
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 500;
      text-align: center;
      pointer-events: none;
      animation: comboFade 1s ease-out forwards;
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 1000);
  }

  showLevelUpPopup(level) {
    const popup = document.createElement('div');
    popup.className = 'levelup-popup';

    // Level-specific messages
    let levelMessage = 'Enemies are getting stronger!';
    if (level === 3) {
      levelMessage = 'Spiders emerge from the mist!';
    } else if (level === 4) {
      levelMessage = 'Slugs join the battle!';
    } else if (level === 5) {
      levelMessage = 'The swarm intensifies!';
    } else if (level >= 7) {
      levelMessage = 'Maximum difficulty reached!';
    }

    popup.innerHTML = `
      <div class="levelup-text">LEVEL ${level}!</div>
      <div class="levelup-warning">${levelMessage}</div>
    `;
    popup.style.cssText = `
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 500;
      text-align: center;
      pointer-events: none;
      animation: levelUpFade 2s ease-out forwards;
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 2000);
  }

  showPowerUpMessage(message) {
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '35%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.color = '#ffcc00';
    popup.style.fontSize = '32px';
    popup.style.fontWeight = 'bold';
    popup.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)';
    popup.style.zIndex = '500';
    popup.style.pointerEvents = 'none';
    popup.textContent = message;
    document.body.appendChild(popup);

    setTimeout(() => {
      popup.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      popup.style.opacity = '0';
      popup.style.transform = 'translate(-50%, -70%)';
      setTimeout(() => popup.remove(), 500);
    }, 1500);
  }

  // ============================================
  // OVERLAY SCREENS
  // ============================================

  showVictoryScreen(timeString, stats = {}) {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes sparkle {
        0%, 100% { text-shadow: 0 0 10px gold, 0 0 20px gold, 0 0 30px gold; }
        50% { text-shadow: 0 0 20px gold, 0 0 40px gold, 0 0 60px gold; }
      }
      @keyframes tapHintPulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      #victory-screen h1 {
        animation: bounce 1s ease-in-out infinite, sparkle 1.5s ease-in-out infinite;
      }
      #victory-screen .stat {
        background: rgba(255, 255, 255, 0.1);
        padding: 15px 30px;
        border-radius: 10px;
        margin: 10px;
        min-width: 200px;
        text-align: center;
      }
      #victory-screen .stat-label {
        font-size: 14px;
        color: #aaa;
        margin-bottom: 5px;
      }
      #victory-screen .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #4a9d2e;
      }
      #victory-screen button {
        padding: 15px 40px;
        font-size: 20px;
        background: linear-gradient(135deg, #4a9d2e, #228b22);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        margin: 10px;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        min-height: 48px;
      }
      #victory-screen button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      }
      #victory-screen .tap-hint {
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
        margin-top: 20px;
        animation: tapHintPulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    // Create victory overlay
    const overlay = document.createElement('div');
    overlay.id = 'victory-screen';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      color: white;
      font-family: Arial, sans-serif;
      animation: fadeIn 0.5s ease-in;
      cursor: pointer;
    `;

    const score = this.gameState.getScore();
    const highScore = this.gameState.getHighScore();
    const cloversCollected = this.gameState.getCloversCollected();
    const totalClovers = this.gameState.getTotalClovers();
    const currentLevel = this.gameState.getCurrentLevel();
    const difficulty = this.gameState.getSelectedDifficulty();
    const difficultyPreset = this.gameState.getDifficultyPreset();
    const isNewHighScore = this.gameState.getIsNewHighScore();

    const highScoreMessage = isNewHighScore
      ? '<p style="font-size: 28px; color: #ffcc00; margin: 10px 0; animation: sparkle 1.5s ease-in-out infinite;">🎉 NEW HIGH SCORE! 🎉</p>'
      : '';

    overlay.innerHTML = `
      <h1 style="font-size: 64px; color: gold; margin-bottom: 20px;">LEVEL COMPLETE!</h1>
      ${highScoreMessage}
      <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-bottom: 30px;">
        <div class="stat">
          <div class="stat-label">TIME</div>
          <div class="stat-value">${timeString}</div>
        </div>
        <div class="stat">
          <div class="stat-label">SCORE</div>
          <div class="stat-value">${score}</div>
        </div>
        <div class="stat">
          <div class="stat-label">HIGH SCORE</div>
          <div class="stat-value" style="color: #ffcc00;">${highScore}</div>
        </div>
        <div class="stat">
          <div class="stat-label">CLOVERS</div>
          <div class="stat-value">${cloversCollected}/${totalClovers}</div>
        </div>
        <div class="stat">
          <div class="stat-label">DIFFICULTY</div>
          <div class="stat-value" style="color: #9933ff;">${difficultyPreset.name} - Level ${currentLevel}</div>
        </div>
      </div>
      <div>
        <button onclick="location.reload()">Play Again</button>
      </div>
      <p class="tap-hint">(Tap anywhere to restart)</p>
    `;

    // Make entire overlay clickable
    const overlayClickHandler = () => {
      location.reload();
    };
    overlay.addEventListener('click', overlayClickHandler);
    this.eventListeners.push({ element: overlay, event: 'click', handler: overlayClickHandler });

    document.body.appendChild(overlay);
  }

  showGameOverScreen(timeString, stats = {}) {
    // Add game over specific styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInGameOver {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes shakeTitle {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      #game-over {
        animation: fadeInGameOver 0.5s ease-out;
      }
      #game-over h1 {
        animation: shakeTitle 0.8s ease-in-out;
        text-shadow: 0 0 20px rgba(200, 0, 0, 0.5), 0 0 40px rgba(200, 0, 0, 0.3);
      }
      #game-over .stat-box {
        background: rgba(255, 255, 255, 0.1);
        padding: 15px 30px;
        border-radius: 10px;
        margin: 10px;
        min-width: 150px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      #game-over .stat-label {
        font-size: 14px;
        color: #aaa;
        margin-bottom: 5px;
      }
      #game-over .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #ff6666;
      }
      @keyframes tapHintPulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      #game-over button {
        padding: 18px 50px;
        font-size: 22px;
        background: linear-gradient(135deg, #cc3333, #aa2222);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        margin-top: 20px;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        min-height: 48px;
      }
      #game-over button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(200, 0, 0, 0.4);
        background: linear-gradient(135deg, #dd4444, #bb3333);
      }
      #game-over .tap-hint {
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
        margin-top: 20px;
        animation: tapHintPulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    // Create game over overlay
    const overlay = document.createElement('div');
    overlay.id = 'game-over';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(20, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      color: white;
      font-family: Arial, sans-serif;
      cursor: pointer;
    `;

    const score = this.gameState.getScore();
    const highScore = this.gameState.getHighScore();
    const cloversCollected = this.gameState.getCloversCollected();
    const totalClovers = this.gameState.getTotalClovers();
    const currentLevel = this.gameState.getCurrentLevel();
    const isNewHighScore = this.gameState.getIsNewHighScore();

    const enemyMsg = stats.hasBees ? 'The bugs got you!' : 'The ants got you!';
    const highScoreMessage = isNewHighScore
      ? '<p style="font-size: 24px; color: #ffcc00; margin: 10px 0;">🎉 NEW HIGH SCORE! 🎉</p>'
      : '';

    overlay.innerHTML = `
      <h1 style="font-size: 72px; color: #cc2222; margin-bottom: 10px;">GAME OVER</h1>
      <p style="font-size: 18px; color: #888; margin-bottom: 10px;">${enemyMsg}</p>
      ${highScoreMessage}
      <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-bottom: 20px;">
        <div class="stat-box">
          <div class="stat-label">FINAL SCORE</div>
          <div class="stat-value">${score}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">HIGH SCORE</div>
          <div class="stat-value" style="color: #ffcc00;">${highScore}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">TIME</div>
          <div class="stat-value">${timeString}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">CLOVERS</div>
          <div class="stat-value">${cloversCollected}/${totalClovers}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">LEVEL</div>
          <div class="stat-value" style="color: #9933ff;">${currentLevel}</div>
        </div>
      </div>
      <button onclick="location.reload()">Try Again</button>
      <p class="tap-hint">(Tap anywhere to try again)</p>
    `;

    // Make entire overlay clickable
    const overlayClickHandler = () => {
      location.reload();
    };
    overlay.addEventListener('click', overlayClickHandler);
    this.eventListeners.push({ element: overlay, event: 'click', handler: overlayClickHandler });

    document.body.appendChild(overlay);
  }

  showPauseOverlay() {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
      pauseOverlay.classList.remove('hidden');
    }
  }

  hidePauseOverlay() {
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
      pauseOverlay.classList.add('hidden');
    }
  }

  showStartOverlay() {
    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) {
      startOverlay.classList.remove('hidden');
    }
  }

  hideStartOverlay() {
    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) {
      startOverlay.classList.add('hidden');
    }
  }

  showWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage && !this.welcomeMessageShown) {
      this.welcomeMessageShown = true;
      welcomeMessage.classList.remove('hidden');

      // Auto-hide after 5 seconds
      setTimeout(() => {
        welcomeMessage.classList.add('hiding');
        setTimeout(() => {
          welcomeMessage.classList.add('hidden');
          welcomeMessage.classList.remove('hiding');
        }, 500); // Match animation duration
      }, 5000);
    }
  }

  // ============================================
  // HELP SYSTEM
  // ============================================

  toggleHelp() {
    const helpOverlay = document.getElementById('help-overlay');
    if (helpOverlay) {
      helpOverlay.classList.toggle('show');
    }
  }

  closeHelp() {
    const helpOverlay = document.getElementById('help-overlay');
    if (helpOverlay) {
      helpOverlay.classList.remove('show');
    }
  }

  // ============================================
  // DIFFICULTY SELECTION
  // ============================================

  setupDifficultySelection(onSelect) {
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const difficultyDesc = document.getElementById('difficulty-desc');

    if (difficultyButtons && difficultyDesc) {
      difficultyButtons.forEach(btn => {
        const difficultyHandler = () => {
          // Remove selected class from all buttons
          difficultyButtons.forEach(b => b.classList.remove('selected'));

          // Add selected class to clicked button
          btn.classList.add('selected');

          // Get selected difficulty
          const selectedDifficulty = btn.dataset.difficulty;

          // Update description
          const preset = this.gameState.getDifficultyPreset(selectedDifficulty);
          difficultyDesc.textContent = preset.description;

          // Call the callback with selected difficulty
          if (onSelect) {
            onSelect(selectedDifficulty);
          }
        };
        btn.addEventListener('click', difficultyHandler);
        this.eventListeners.push({ element: btn, event: 'click', handler: difficultyHandler });
      });
    }
  }

  // ============================================
  // EVENT HANDLERS SETUP
  // ============================================

  setupUIEventHandlers(callbacks = {}) {
    // Start button
    const startButton = document.getElementById('start-button');
    if (startButton && callbacks.onStart) {
      startButton.addEventListener('click', callbacks.onStart);
      this.eventListeners.push({ element: startButton, event: 'click', handler: callbacks.onStart });
    }

    // Pause/Resume buttons
    const pauseButton = document.getElementById('pause-button');
    if (pauseButton && callbacks.onPause) {
      pauseButton.addEventListener('click', callbacks.onPause);
      this.eventListeners.push({ element: pauseButton, event: 'click', handler: callbacks.onPause });
    }

    const resumeButton = document.getElementById('resume-button');
    if (resumeButton && callbacks.onResume) {
      resumeButton.addEventListener('click', callbacks.onResume);
      this.eventListeners.push({ element: resumeButton, event: 'click', handler: callbacks.onResume });
    }

    const restartButton = document.getElementById('restart-button');
    if (restartButton && callbacks.onRestart) {
      restartButton.addEventListener('click', callbacks.onRestart);
      this.eventListeners.push({ element: restartButton, event: 'click', handler: callbacks.onRestart });
    }

    // Help buttons
    const helpButton = document.getElementById('help-button');
    if (helpButton && callbacks.onHelp) {
      helpButton.addEventListener('click', callbacks.onHelp);
      this.eventListeners.push({ element: helpButton, event: 'click', handler: callbacks.onHelp });
    }

    const helpClose = document.getElementById('help-close');
    if (helpClose && callbacks.onHelpClose) {
      helpClose.addEventListener('click', callbacks.onHelpClose);
      this.eventListeners.push({ element: helpClose, event: 'click', handler: callbacks.onHelpClose });
    }

    // Audio controls
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn && callbacks.onMuteToggle) {
      const muteBtnHandler = () => {
        // Play UI click sound before toggling (so it can be heard)
        if (!this.audioManager.getMuteState()) {
          this.audioManager.playUIClick();
        }
        const isMuted = this.audioManager.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.classList.toggle('muted', isMuted);

        if (callbacks.onMuteToggle) {
          callbacks.onMuteToggle(isMuted);
        }
      };
      muteBtn.addEventListener('click', muteBtnHandler);
      this.eventListeners.push({ element: muteBtn, event: 'click', handler: muteBtnHandler });
    }

    const musicVolume = document.getElementById('music-volume');
    if (musicVolume && callbacks.onMusicVolumeChange) {
      const musicVolumeHandler = (e) => {
        this.audioManager.setMusicVolume(e.target.value / 100);
        callbacks.onMusicVolumeChange(e.target.value / 100);
      };
      musicVolume.addEventListener('input', musicVolumeHandler);
      this.eventListeners.push({ element: musicVolume, event: 'input', handler: musicVolumeHandler });
    }

    const sfxVolume = document.getElementById('sfx-volume');
    if (sfxVolume && callbacks.onSfxVolumeChange) {
      const sfxVolumeHandler = (e) => {
        this.audioManager.setSfxVolume(e.target.value / 100);
        callbacks.onSfxVolumeChange(e.target.value / 100);
      };
      sfxVolume.addEventListener('input', sfxVolumeHandler);
      this.eventListeners.push({ element: sfxVolume, event: 'input', handler: sfxVolumeHandler });
    }

    // Keyboard shortcuts
    if (callbacks.onKeyDown) {
      document.addEventListener('keydown', callbacks.onKeyDown);
      this.eventListeners.push({ element: document, event: 'keydown', handler: callbacks.onKeyDown });
    }
  }

  // ============================================
  // CLEANUP
  // ============================================

  cleanup() {
    // Remove all tracked event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // Remove any dynamically created overlays
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
      victoryScreen.remove();
    }

    const gameOverScreen = document.getElementById('game-over');
    if (gameOverScreen) {
      gameOverScreen.remove();
    }
  }
}
