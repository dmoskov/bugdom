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

    // Track injected style elements for cleanup
    this._injectedStyles = [];

    // Inject overlay styles once
    this._injectOverlayStyles();

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

    this._clearMinimap();
    this._drawMinimapBoundary();
    this._drawMinimapClovers(clovers);
    this._drawMinimapEnemies(enemies);
    this._drawMinimapBees(bees);
    this._drawMinimapPlayer(playerPos, playerRotation);
  }

  /**
   * Clear minimap canvas
   * @private
   */
  _clearMinimap() {
    this.minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.minimapCtx.fillRect(0, 0, this.MINIMAP_SIZE, this.MINIMAP_SIZE);
  }

  /**
   * Draw minimap boundary outline
   * @private
   */
  _drawMinimapBoundary() {
    this.minimapCtx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
    this.minimapCtx.lineWidth = 2;
    const boundaryPadding = 5 * this.MINIMAP_SCALE;
    this.minimapCtx.strokeRect(
      boundaryPadding,
      boundaryPadding,
      this.MINIMAP_SIZE - boundaryPadding * 2,
      this.MINIMAP_SIZE - boundaryPadding * 2
    );
  }

  /**
   * Draw clovers on minimap
   * @private
   */
  _drawMinimapClovers(clovers) {
    this.minimapCtx.fillStyle = '#ffcc00';
    clovers.forEach(clover => {
      if (!clover.userData.collected) {
        const pos = this.worldToMinimap(clover.position.x, clover.position.z);
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        this.minimapCtx.fill();
      }
    });
  }

  /**
   * Draw enemies on minimap
   * @private
   */
  _drawMinimapEnemies(enemies) {
    this.minimapCtx.fillStyle = '#ff3333';
    enemies.forEach(enemy => {
      const pos = this.worldToMinimap(enemy.position.x, enemy.position.z);
      this.minimapCtx.beginPath();
      this.minimapCtx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      this.minimapCtx.fill();
    });
  }

  /**
   * Draw bees on minimap
   * @private
   */
  _drawMinimapBees(bees) {
    this.minimapCtx.fillStyle = '#ff9900';
    bees.forEach(bee => {
      const pos = this.worldToMinimap(bee.position.x, bee.position.z);
      this.minimapCtx.beginPath();
      this.minimapCtx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      this.minimapCtx.fill();
    });
  }

  /**
   * Draw player on minimap with direction indicator
   * @private
   */
  _drawMinimapPlayer(playerPos, playerRotation) {
    const playerMapPos = this.worldToMinimap(playerPos.x, playerPos.z);

    // Player direction indicator (triangle)
    this.minimapCtx.fillStyle = '#00ff00';
    this.minimapCtx.save();
    this.minimapCtx.translate(playerMapPos.x, playerMapPos.y);
    this.minimapCtx.rotate(-playerRotation);
    this.minimapCtx.beginPath();
    this.minimapCtx.moveTo(0, -6);
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
        scoreElement.textContent = '';
        const scoreText = document.createTextNode(`Score: ${score}`);
        scoreElement.appendChild(scoreText);
        scoreElement.appendChild(document.createElement('br'));
        const bestSpan = document.createElement('span');
        bestSpan.style.cssText = 'font-size: 14px; color: #ffcc00;';
        bestSpan.textContent = `Best: ${highScore}`;
        scoreElement.appendChild(bestSpan);
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

    const multiplierDiv = document.createElement('div');
    multiplierDiv.className = 'combo-multiplier';
    multiplierDiv.textContent = `x${multiplier} COMBO!`;
    popup.appendChild(multiplierDiv);

    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'combo-points';
    pointsDiv.textContent = `+${points}`;
    popup.appendChild(pointsDiv);

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

    const levelText = document.createElement('div');
    levelText.className = 'levelup-text';
    levelText.textContent = `LEVEL ${level}!`;
    popup.appendChild(levelText);

    const warningText = document.createElement('div');
    warningText.className = 'levelup-warning';
    warningText.textContent = levelMessage;
    popup.appendChild(warningText);
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
    this._removeExistingOverlay('victory-screen');
    const overlay = this.createVictoryOverlay(timeString);
    document.body.appendChild(overlay);
  }

  createVictoryOverlay(timeString) {
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

    this._buildVictoryContent(overlay, timeString);

    // Make entire overlay clickable
    const overlayClickHandler = () => {
      location.reload();
    };
    overlay.addEventListener('click', overlayClickHandler);
    this.eventListeners.push({ element: overlay, event: 'click', handler: overlayClickHandler });

    return overlay;
  }

  _buildVictoryContent(overlay, timeString) {
    const score = this.gameState.getScore();
    const highScore = this.gameState.getHighScore();
    const cloversCollected = this.gameState.getCloversCollected();
    const totalClovers = this.gameState.getTotalClovers();
    const currentLevel = this.gameState.getCurrentLevel();
    const difficultyPreset = this.gameState.getDifficultyPreset();
    const isNewHighScore = this.gameState.getIsNewHighScore();

    const h1 = document.createElement('h1');
    h1.style.cssText = 'font-size: 64px; color: gold; margin-bottom: 20px;';
    h1.textContent = 'LEVEL COMPLETE!';
    overlay.appendChild(h1);

    if (isNewHighScore) {
      const highScoreMsg = document.createElement('p');
      highScoreMsg.style.cssText = 'font-size: 28px; color: #ffcc00; margin: 10px 0; animation: sparkle 1.5s ease-in-out infinite;';
      highScoreMsg.textContent = '\u{1F389} NEW HIGH SCORE! \u{1F389}';
      overlay.appendChild(highScoreMsg);
    }

    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: center; margin-bottom: 30px;';

    const stats = [
      { label: 'TIME', value: timeString },
      { label: 'SCORE', value: String(score) },
      { label: 'HIGH SCORE', value: String(highScore), color: '#ffcc00' },
      { label: 'CLOVERS', value: `${cloversCollected}/${totalClovers}` },
      { label: 'DIFFICULTY', value: `${difficultyPreset.name} - Level ${currentLevel}`, color: '#9933ff' },
    ];

    stats.forEach(({ label, value, color }) => {
      const stat = document.createElement('div');
      stat.className = 'stat';
      const labelDiv = document.createElement('div');
      labelDiv.className = 'stat-label';
      labelDiv.textContent = label;
      const valueDiv = document.createElement('div');
      valueDiv.className = 'stat-value';
      valueDiv.textContent = value;
      if (color) valueDiv.style.color = color;
      stat.appendChild(labelDiv);
      stat.appendChild(valueDiv);
      statsContainer.appendChild(stat);
    });
    overlay.appendChild(statsContainer);

    const btnContainer = document.createElement('div');
    const btn = document.createElement('button');
    btn.textContent = 'Play Again';
    btn.addEventListener('click', () => location.reload());
    btnContainer.appendChild(btn);
    overlay.appendChild(btnContainer);

    const hint = document.createElement('p');
    hint.className = 'tap-hint';
    hint.textContent = '(Tap anywhere to restart)';
    overlay.appendChild(hint);
  }

  showGameOverScreen(timeString, stats = {}) {
    this._removeExistingOverlay('game-over');
    const overlay = this.createGameOverOverlay(timeString, stats);
    document.body.appendChild(overlay);
  }

  createGameOverOverlay(timeString, stats) {
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

    this._buildGameOverContent(overlay, timeString, stats);

    // Make entire overlay clickable
    const overlayClickHandler = () => {
      location.reload();
    };
    overlay.addEventListener('click', overlayClickHandler);
    this.eventListeners.push({ element: overlay, event: 'click', handler: overlayClickHandler });

    return overlay;
  }

  _buildGameOverContent(overlay, timeString, stats) {
    const score = this.gameState.getScore();
    const highScore = this.gameState.getHighScore();
    const cloversCollected = this.gameState.getCloversCollected();
    const totalClovers = this.gameState.getTotalClovers();
    const currentLevel = this.gameState.getCurrentLevel();
    const isNewHighScore = this.gameState.getIsNewHighScore();

    const enemyMsg = stats.hasBees ? 'The bugs got you!' : 'The ants got you!';

    const h1 = document.createElement('h1');
    h1.style.cssText = 'font-size: 72px; color: #cc2222; margin-bottom: 10px;';
    h1.textContent = 'GAME OVER';
    overlay.appendChild(h1);

    const enemyP = document.createElement('p');
    enemyP.style.cssText = 'font-size: 18px; color: #888; margin-bottom: 10px;';
    enemyP.textContent = enemyMsg;
    overlay.appendChild(enemyP);

    if (isNewHighScore) {
      const highScoreMsg = document.createElement('p');
      highScoreMsg.style.cssText = 'font-size: 24px; color: #ffcc00; margin: 10px 0;';
      highScoreMsg.textContent = '\u{1F389} NEW HIGH SCORE! \u{1F389}';
      overlay.appendChild(highScoreMsg);
    }

    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: center; margin-bottom: 20px;';

    const statItems = [
      { label: 'FINAL SCORE', value: String(score) },
      { label: 'HIGH SCORE', value: String(highScore), color: '#ffcc00' },
      { label: 'TIME', value: timeString },
      { label: 'CLOVERS', value: `${cloversCollected}/${totalClovers}` },
      { label: 'LEVEL', value: String(currentLevel), color: '#9933ff' },
    ];

    statItems.forEach(({ label, value, color }) => {
      const statBox = document.createElement('div');
      statBox.className = 'stat-box';
      const labelDiv = document.createElement('div');
      labelDiv.className = 'stat-label';
      labelDiv.textContent = label;
      const valueDiv = document.createElement('div');
      valueDiv.className = 'stat-value';
      valueDiv.textContent = value;
      if (color) valueDiv.style.color = color;
      statBox.appendChild(labelDiv);
      statBox.appendChild(valueDiv);
      statsContainer.appendChild(statBox);
    });
    overlay.appendChild(statsContainer);

    const btn = document.createElement('button');
    btn.textContent = 'Try Again';
    btn.addEventListener('click', () => location.reload());
    overlay.appendChild(btn);

    const hint = document.createElement('p');
    hint.className = 'tap-hint';
    hint.textContent = '(Tap anywhere to try again)';
    overlay.appendChild(hint);
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

  /**
   * Helper to register event listener and track it
   * @private
   */
  _registerEventListener(elementId, eventType, handler) {
    const element = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (element && handler) {
      element.addEventListener(eventType, handler);
      this.eventListeners.push({ element, event: eventType, handler });
    }
  }

  setupUIEventHandlers(callbacks = {}) {
    // Game control buttons
    this._registerEventListener('start-button', 'click', callbacks.onStart);
    this._registerEventListener('pause-button', 'click', callbacks.onPause);
    this._registerEventListener('resume-button', 'click', callbacks.onResume);
    this._registerEventListener('restart-button', 'click', callbacks.onRestart);

    // Help buttons
    this._registerEventListener('help-button', 'click', callbacks.onHelp);
    this._registerEventListener('help-close', 'click', callbacks.onHelpClose);

    // Audio controls
    this._setupMuteButton(callbacks);
    this._setupVolumeControls(callbacks);

    // Keyboard shortcuts
    this._registerEventListener(document, 'keydown', callbacks.onKeyDown);
  }

  /**
   * Setup mute button handler
   * @private
   */
  _setupMuteButton(callbacks) {
    const muteBtn = document.getElementById('mute-btn');
    if (!muteBtn || !callbacks.onMuteToggle) return;

    const muteBtnHandler = () => {
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
    this._registerEventListener(muteBtn, 'click', muteBtnHandler);
  }

  /**
   * Setup volume control sliders
   * @private
   */
  _setupVolumeControls(callbacks) {
    const musicVolumeHandler = (e) => {
      this.audioManager.setMusicVolume(e.target.value / 100);
      callbacks.onMusicVolumeChange(e.target.value / 100);
    };
    this._registerEventListener('music-volume', 'input', callbacks.onMusicVolumeChange && musicVolumeHandler);

    const sfxVolumeHandler = (e) => {
      this.audioManager.setSfxVolume(e.target.value / 100);
      callbacks.onSfxVolumeChange(e.target.value / 100);
    };
    this._registerEventListener('sfx-volume', 'input', callbacks.onSfxVolumeChange && sfxVolumeHandler);
  }

  // ============================================
  // STYLE INJECTION (once, in constructor)
  // ============================================

  _injectOverlayStyles() {
    const style = document.createElement('style');
    style.setAttribute('data-ui-manager', 'overlay-styles');
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
      @keyframes fadeInGameOver {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes shakeTitle {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
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
    this._injectedStyles.push(style);
  }

  /**
   * Remove an existing overlay by ID before creating a new one
   * @private
   */
  _removeExistingOverlay(id) {
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
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

    // Remove injected style elements
    this._injectedStyles.forEach(style => style.remove());
    this._injectedStyles = [];

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
