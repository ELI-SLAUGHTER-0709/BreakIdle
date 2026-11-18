(function() {
  'use strict';

  const CONFIG = {
    canvas: { width: 800, height: 520 },
    game: {
      brickGridCols: 10,
      brickGridRows: 6,
      brickSpawnChance: 0.6,
    },
    shooter: { halfWidth: 18, yPos: 500 },
    physics: {
      shooterAccel: 2.2,
      shooterFriction: 0.75,
    },
    upgrades: {
      auto: { baseCost: 50, costMult: 1.6 },
      dmg: { baseCost: 30, costMult: 1.45 },
      crit: { baseCost: 150, costMult: 1.8 },
      multi: { baseCost: 200, costMult: 1.5 },
      spd: { baseCost: 40, costMult: 1.4 },
      rapid: { baseCost: 500, costMult: 1.4 },
    },
    rapid: {
      unlockedAtLevel: 10,
      cooldownMs: 60000,
      baseShots: 60,
      shotsPerLevel: 10,
      intervalMs: 25,
    },
  };

  const NEON_COLORS = ['#ff0055', '#00f2ff', '#7000ff', '#00ff44', '#ffaa00', '#ff00ff', '#00fbff'];
  const STORAGE_KEY = 'breakIdleSave_v2';

  let uiManager = null;
  let renderer = null;

  class UIManager {
    constructor() {
      this.elements = {
        coins: null,
        score: null,
        level: null,
        activeBalls: null,
        progressBar: null,
        autoToggle: null,
        ballDmgText: null,
        ballSpdEl: null,
        ballsPerShotEl: null,
        rapidContainer: document.getElementById('rapidCooldownContainer'),
        useRapidBtn: null,
        rapidCooldownBar: document.getElementById('rapidCooldownBar'),
        rapidCDText: document.getElementById('rapidCooldownText'),
        rapidBallsStat: null,
        headerStats: document.getElementById('headerStats'),
        shootBtn: null,
        clearBtn: document.getElementById('clearBtn'),
      };
      this.initializeStats();
      this.injectStyles();
    }

    initializeStats() {
      const statsHTML = `
        <div>Coins: <span id="coins">0</span></div>
        <div>Score: <span id="score">0</span></div>
        <div>Level: <span id="level">1</span></div>
        <div>Ball Damage: <span id="ballDamage">1.0</span></div>
        <div>Ball Speed: <span id="ballSpeed">4.0</span></div>
        <div>Auto Speed: <span id="autoSpeed">0.00 /s</span></div>
        <div>Balls / Shot: <span id="ballsPerShotDisplay">1</span></div>
        <div>Active Balls: <span id="activeBalls">0</span></div>
        <div>Rapid Balls / Volley: <span id="rapidBalls">1</span></div>
        <div class="level-progress">
          <div class="progress-label">Level Progress</div>
          <div class="progress-wrap">
            <div class="progress">
              <div id="progressBar" style="width:0%"></div>
            </div>
          </div>
        </div>
      `;
      if (this.elements.headerStats) {
        this.elements.headerStats.innerHTML = statsHTML;
        
        this.elements.coins = document.getElementById('coins');
        this.elements.score = document.getElementById('score');
        this.elements.level = document.getElementById('level');
        this.elements.activeBalls = document.getElementById('activeBalls');
        this.elements.progressBar = document.getElementById('progressBar');
        this.elements.ballDmgText = document.getElementById('ballDamage');
        this.elements.ballSpdEl = document.getElementById('ballSpeed');
        this.elements.ballsPerShotEl = document.getElementById('ballsPerShotDisplay');
        this.elements.rapidBallsStat = document.getElementById('rapidBalls');
      }
    }

    initializeButtons() {
      const html = `
        <button id="autoToggle" class="green-btn" aria-pressed="false" style="display:none;">AUTO</button>
        <button id="shootBtn" class="big-red">SHOOT</button>
        <button id="useRapidBottom" class="blue-btn" style="display:none;">RAPID</button>
      `;
      const centerDiv = document.querySelector('.bottom-center');
      if (centerDiv) {
        centerDiv.innerHTML = html;
        
        this.elements.shootBtn = document.getElementById('shootBtn');
        this.elements.autoToggle = document.getElementById('autoToggle');
        this.elements.useRapidBtn = document.getElementById('useRapidBottom');
      }
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .header-left h1 {
          margin: 0;
          color: #ffcc4d;
          font-size: 1.8rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 10px rgba(255, 204, 77, 0.5), 0 0 20px rgba(255, 204, 77, 0.3);
          font-style: italic;
          background: linear-gradient(to bottom, #fff 20%, #ffcc4d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .big-red { 
          box-shadow: 0 0 20px rgba(255, 77, 79, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2); 
          border: 1px solid rgba(255,255,255,0.3) !important;
        }
        .green-btn { 
          box-shadow: 0 0 20px rgba(52, 211, 153, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2); 
          border: 1px solid rgba(255,255,255,0.3) !important;
        }
        .blue-btn { 
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2); 
          border: 1px solid rgba(255,255,255,0.3) !important;
        }
        .bottom-bar button:hover {
          filter: brightness(1.2);
          transform: translateY(-18px) scale(1.03) !important;
        }
        @keyframes rapidPulse {
          0% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 35px rgba(59, 130, 246, 0.9), 0 0 50px rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
        }
        .rapid-ready-pulse {
          animation: rapidPulse 1.5s infinite ease-in-out;
          border: 1px solid #fff !important;
        }
      `;
      document.head.appendChild(style);
    }

    update(state) {
      if(this.elements.coins) this.elements.coins.textContent = Math.floor(state.coins);
      if(this.elements.score) this.elements.score.textContent = Math.floor(state.score);
      if(this.elements.level) this.elements.level.textContent = state.levelIndex + 1;
      if(this.elements.activeBalls) this.elements.activeBalls.textContent = state.balls.length;
      if(this.elements.ballDmgText) this.elements.ballDmgText.textContent = state.damage.toFixed(1);
      if(this.elements.ballSpdEl) this.elements.ballSpdEl.textContent = state.ballSpeed.toFixed(1);
      if(this.elements.ballsPerShotEl) this.elements.ballsPerShotEl.textContent = state.ballsPerShot;
      if(this.elements.rapidBallsStat) this.elements.rapidBallsStat.textContent = CONFIG.rapid.baseShots + (state.rapidLevel * CONFIG.rapid.shotsPerLevel);

      const isLevel10 = (state.levelIndex + 1) >= CONFIG.rapid.unlockedAtLevel;
      if(this.elements.rapidContainer) this.elements.rapidContainer.style.display = isLevel10 ? 'flex' : 'none';
      if(this.elements.useRapidBtn) this.elements.useRapidBtn.style.display = isLevel10 ? 'block' : 'none';

      if(isLevel10) {
        const timeSince = performance.now() - state.rapidLastUsed;
        const cdPercent = Math.min(100, (timeSince / CONFIG.rapid.cooldownMs) * 100);
        if(this.elements.rapidCooldownBar) this.elements.rapidCooldownBar.style.width = cdPercent + "%";
        const remaining = Math.max(0, (CONFIG.rapid.cooldownMs - timeSince) / 1000);
        if(this.elements.rapidCDText) this.elements.rapidCDText.textContent = remaining > 0 ? `${remaining.toFixed(1)}s` : "READY";

        if (remaining <= 0 && !state.rapidActive) {
          if(this.elements.useRapidBtn) this.elements.useRapidBtn.classList.add('rapid-ready-pulse');
        } else {
          if(this.elements.useRapidBtn) this.elements.useRapidBtn.classList.remove('rapid-ready-pulse');
        }
      }

      if(this.elements.autoToggle) {
        this.elements.autoToggle.style.display = state.autoLevel > 0 ? 'block' : 'none';
        this.elements.autoToggle.textContent = state.autoEnabled ? 'AUTO: ON' : 'AUTO: OFF';
      }

      let progress = 0;
      if (state.levelInitialBricks > 0) {
        progress = ((state.levelInitialBricks - state.bricks.length) / state.levelInitialBricks) * 100;
        progress = Math.max(0, Math.min(100, progress));
      }
      if(this.elements.progressBar) this.elements.progressBar.style.width = progress + "%";
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 6;
      this.vy = (Math.random() - 0.5) * 6;
      this.life = 1.0;
      this.color = color;
      this.size = Math.random() * 2 + 2;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= 0.025 * dt;
    }

    draw(ctx) {
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    }
  }

  class Ball {
    constructor(x, y, angle, speed, damage, isRapid = false) {
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.isCrit = !isRapid && Math.random() < 0.12;
      this.damage = isRapid ? damage * 1.5 : (this.isCrit ? damage * gameState.critMult : damage);
      this.r = 3.2;
      this.isRapid = isRapid;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (this.x - this.r < 0 || this.x + this.r > gameState.canvasWidth) {
        this.vx *= -1;
        this.x = (this.x < gameState.canvasWidth / 2) ? this.r : gameState.canvasWidth - this.r;
      }
      if (this.y - this.r < 0) {
        this.vy *= -1;
        this.y = this.r;
      }
    }

    draw(ctx) {
      if (this.isCrit) {
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffaa00';
      } else {
        ctx.fillStyle = this.isRapid ? '#00f2ff' : '#ffffff';
        ctx.shadowBlur = this.isRapid ? 8 : 0;
        ctx.shadowColor = '#00f2ff';
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  class Brick {
    constructor(x, y, w, h, hp, value) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.hp = hp;
      this.maxHp = hp;
      this.value = value;
      this.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
      this.hitAnim = 0;
    }

    draw(ctx) {
      const scale = 1 + Math.sin(this.hitAnim) * 0.1;
      ctx.save();
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      ctx.scale(scale, scale);
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-this.w / 2 + 2, -this.h / 2 + 2, this.w - 4, this.h - 4, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 15px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.ceil(this.hp), 0, 0);
      ctx.restore();
      if (this.hitAnim > 0) this.hitAnim -= 0.2;
    }

    takeDamage(damage) {
      this.hp -= damage;
      this.hitAnim = Math.PI / 2;
      this.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    }

    isDestroyed() {
      return this.hp <= 0;
    }
  }

  class ShopManager {
    constructor(shopCanvas) {
      this.canvas = shopCanvas;
      this.ctx = shopCanvas ? shopCanvas.getContext('2d') : null;
      this.items = [];
      this.defineItems();
    }

    defineItems() {
      this.itemDefinitions = [
        { key: 'auto', label: 'Unlock Auto', labelAlt: 'Auto Spd', getCost: (state) => Math.floor(CONFIG.upgrades.auto.baseCost * Math.pow(CONFIG.upgrades.auto.costMult, state.autoLevel)) },
        { key: 'dmg', label: 'Power', getCost: (state) => Math.floor(CONFIG.upgrades.dmg.baseCost * Math.pow(CONFIG.upgrades.dmg.costMult, state.damageLevel)) },
        { key: 'crit', label: 'Crit Dmg', getCost: (state) => Math.floor(CONFIG.upgrades.crit.baseCost * Math.pow(CONFIG.upgrades.crit.costMult, state.critLevel)) },
        { key: 'multi', label: 'Balls', getCost: (state) => Math.floor(CONFIG.upgrades.multi.baseCost * Math.pow(CONFIG.upgrades.multi.costMult, state.ballsPerShot - 1)) },
        { key: 'spd', label: 'Speed', getCost: (state) => Math.floor(CONFIG.upgrades.spd.baseCost * Math.pow(CONFIG.upgrades.spd.costMult, state.speedLevel)) },
      ];
    }

    render(state) {
      if (!this.ctx || !this.canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const width = this.canvas.width / dpr;
      const height = this.canvas.height / dpr;
      
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.clearRect(0, 0, width, height);
      
      // Draw header
      this.ctx.fillStyle = 'rgba(255, 204, 77, 0.2)';
      this.ctx.fillRect(0, 0, width, 45);
      this.ctx.fillStyle = '#ffcc4d';
      this.ctx.font = 'bold 18px Inter';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('UPGRADES', 15, 22);

      const items = [...this.itemDefinitions];
      if ((state.levelIndex + 1) >= CONFIG.rapid.unlockedAtLevel) {
        items.push({
          key: 'rapid',
          label: 'Rapid (+10)',
          getCost: (state) => Math.floor(CONFIG.upgrades.rapid.baseCost * Math.pow(CONFIG.upgrades.rapid.costMult, state.rapidLevel))
        });
      }

      // Calculate dimensions - 15px less wide
      const padding = 17.5;
      const buttonWidth = width - (padding * 2);
      const buttonHeight = 48;
      const spacing = 6;
      const headerHeight = 45;
      const availableHeight = height - headerHeight - (padding * 2);
      
      let scale = 1;
      const neededHeight = items.length * (buttonHeight + spacing);
      if (neededHeight > availableHeight) {
        scale = availableHeight / neededHeight;
        scale = Math.max(0.75, Math.min(1, scale));
      }
      
      const scaledHeight = buttonHeight * scale;
      const scaledSpacing = spacing * scale;
      const fontSize = 13 * scale;
      const levelFontSize = 10 * scale;
      const costFontSize = 14 * scale;

      this.items = items.map((def, i) => {
        const cost = def.getCost(state);
        const afford = state.coins >= cost;
        const yPos = headerHeight + padding + i * (scaledHeight + scaledSpacing);
        
        const rect = { 
          x: padding, 
          y: yPos, 
          w: buttonWidth, 
          h: scaledHeight 
        };

        // Draw gradient background
        const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        if (afford) {
          gradient.addColorStop(0, 'rgba(0, 242, 255, 0.15)');
          gradient.addColorStop(1, 'rgba(0, 242, 255, 0.05)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 6);
        this.ctx.fill();

        // Draw border
        if (afford) {
          this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.5)';
          this.ctx.lineWidth = 1.5;
        } else {
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          this.ctx.lineWidth = 0.8;
        }
        this.ctx.stroke();

        // Draw label text
        this.ctx.fillStyle = afford ? '#fff' : '#999';
        this.ctx.font = `bold ${fontSize}px Inter`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        const label = state[def.key + 'Level'] > 0 && def.labelAlt ? def.labelAlt : def.label;
        this.ctx.fillText(label, rect.x + 10, rect.y + 4);

        // Draw level indicator
        const level = state[def.key + 'Level'] || 0;
        this.ctx.fillStyle = afford ? 'rgba(0, 242, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)';
        this.ctx.font = `bold ${levelFontSize}px Inter`;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`LV.${level}`, rect.x + 10, rect.y + rect.h - 10);

        // Draw cost on right
        this.ctx.fillStyle = afford ? '#00f2ff' : '#ff8888';
        this.ctx.font = `bold ${costFontSize}px Inter`;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${cost}⛀`, rect.x + rect.w - 8, rect.y + rect.h / 2);

        return { key: def.key, rect, cost };
      });
    }

    handleClick(x, y, state) {
      for (const item of this.items) {
        if (x > item.rect.x && x < item.rect.x + item.rect.w && y > item.rect.y && y < item.rect.y + item.rect.h) {
          return { key: item.key, cost: item.cost };
        }
      }
      return null;
    }
  }

  class Renderer {
    constructor(gameCanvas, shopCanvas) {
      this.gameCanvas = gameCanvas;
      this.gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null;
      this.shopManager = shopCanvas ? new ShopManager(shopCanvas) : null;
    }

    renderGame(state) {
      if (!this.gameCtx || !this.gameCanvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const canvasW = this.gameCanvas.width / dpr;
      const canvasH = this.gameCanvas.height / dpr;
      
      this.gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.gameCtx.fillStyle = '#0a0a0c';
      this.gameCtx.fillRect(0, 0, canvasW, canvasH);

      state.bricks.forEach(br => br.draw(this.gameCtx));
      state.particles.forEach(p => p.draw(this.gameCtx));
      state.balls.forEach(ba => ba.draw(this.gameCtx));

      // Draw shooter
      this.gameCtx.shadowBlur = 15;
      this.gameCtx.shadowColor = '#00f2ff';
      this.gameCtx.fillStyle = '#00f2ff';
      this.gameCtx.beginPath();
      this.gameCtx.roundRect(state.shooterX - CONFIG.shooter.halfWidth, canvasH - 40, CONFIG.shooter.halfWidth * 2, 12, 4);
      this.gameCtx.fill();
      this.gameCtx.shadowBlur = 0;
    }

    renderShop(state) {
      if (this.shopManager) {
        this.shopManager.render(state);
      }
    }

    handleShopClick(x, y, state) {
      if (this.shopManager) {
        return this.shopManager.handleClick(x, y, state);
      }
      return null;
    }
  }

  class LevelManager {
    static spawn(index, canvasWidth) {
      const bricks = [];
      const brickWidth = (canvasWidth - 20) / CONFIG.game.brickGridCols;
      const rng = mulberry32(index + 777);

      for (let r = 0; r < CONFIG.game.brickGridRows; r++) {
        for (let c = 0; c < CONFIG.game.brickGridCols; c++) {
          if (rng() < CONFIG.game.brickSpawnChance) {
            const hp = Math.max(1, (3 + r) + Math.floor(Math.log2(index + 1) * 8));
            bricks.push(new Brick(10 + c * brickWidth, 45 + r * 35, brickWidth, 30, hp, Math.ceil(hp * 0.5)));
          }
        }
      }

      return bricks;
    }
  }

  class SaveManager {
    static save(state) {
      const data = {
        coins: state.coins,
        score: state.score,
        levelIndex: state.levelIndex,
        ballsPerShot: state.ballsPerShot,
        ballSpeed: state.ballSpeed,
        damageLevel: state.damageLevel,
        damage: state.damage,
        critLevel: state.critLevel,
        critMult: state.critMult,
        autoLevel: state.autoLevel,
        autoEnabled: state.autoEnabled,
        speedLevel: state.speedLevel,
        rapidLevel: state.rapidLevel,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    static load(state) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          Object.assign(state, JSON.parse(saved));
          state.rapidLastUsed = -999999;
        } catch (e) {
          console.error("Save corrupted", e);
        }
      }
    }
  }

  let gameState = {
    coins: 0,
    score: 0,
    ballsPerShot: 1,
    ballSpeed: 4,
    damageLevel: 0,
    damage: 1,
    critLevel: 0,
    critMult: 3,
    autoLevel: 0,
    autoEnabled: false,
    speedLevel: 0,
    rapidLevel: 0,
    balls: [],
    bricks: [],
    particles: [],
    shooterX: 400,
    shooterVx: 0,
    keys: { left: false, right: false },
    levelIndex: 0,
    levelInitialBricks: 0,
    rapidLastUsed: -999999,
    rapidActive: false,
    rapidShotsRemaining: 0,
    rapidNextShotAt: 0,
    canvasWidth: 800,
    canvasHeight: 520,
  };

  class InputHandler {
    constructor() {
      this.setup();
    }

    setup() {
      window.addEventListener('keydown', (e) => this.onKeyDown(e));
      window.addEventListener('keyup', (e) => this.onKeyUp(e));

      setTimeout(() => {
        if (uiManager.elements.shootBtn) {
          uiManager.elements.shootBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            GameEngine.queueShots(1);
          });
        }

        if (uiManager.elements.autoToggle) {
          uiManager.elements.autoToggle.addEventListener('click', () => {
            gameState.autoEnabled = !gameState.autoEnabled;
            SaveManager.save(gameState);
          });
        }

        if (uiManager.elements.useRapidBtn) {
          uiManager.elements.useRapidBtn.addEventListener('click', () => GameEngine.triggerRapid());
        }

        if (uiManager.elements.clearBtn) {
          uiManager.elements.clearBtn.addEventListener('click', () => {
            if (confirm("Reset?")) {
              localStorage.removeItem(STORAGE_KEY);
              location.reload();
            }
          });
        }
      }, 100);
    }

    onKeyDown(e) {
      if (e.key === 'ArrowLeft') gameState.keys.left = true;
      if (e.key === 'ArrowRight') gameState.keys.right = true;
      if (e.key === 'ArrowUp' && !e.repeat) {
        e.preventDefault();
        GameEngine.queueShots(1);
      }
      if (e.key === 'Control') {
        e.preventDefault();
        gameState.autoEnabled = !gameState.autoEnabled;
        SaveManager.save(gameState);
      }
      if (e.key === 'Shift') {
        e.preventDefault();
        GameEngine.triggerRapid();
      }
    }

    onKeyUp(e) {
      if (e.key === 'ArrowLeft') gameState.keys.left = false;
      if (e.key === 'ArrowRight') gameState.keys.right = false;
    }
  }

  class GameEngine {
    static {
      this.spawnQueue = 0;
      this.lastAutoTime = 0;
      this.lastTime = performance.now();
    }

    static queueShots(n) {
      this.spawnQueue += n;
    }

    static triggerRapid() {
      const now = performance.now();
      if ((gameState.levelIndex + 1) >= CONFIG.rapid.unlockedAtLevel && !gameState.rapidActive && (now - gameState.rapidLastUsed >= CONFIG.rapid.cooldownMs)) {
        gameState.rapidActive = true;
        gameState.rapidLastUsed = now;
        gameState.rapidShotsRemaining = CONFIG.rapid.baseShots + (gameState.rapidLevel * CONFIG.rapid.shotsPerLevel);
        gameState.rapidNextShotAt = now;
      }
    }

    static updatePhysics(now, dt) {
      if (gameState.keys.left) gameState.shooterVx -= CONFIG.physics.shooterAccel * dt;
      else if (gameState.keys.right) gameState.shooterVx += CONFIG.physics.shooterAccel * dt;
      else gameState.shooterVx *= Math.pow(CONFIG.physics.shooterFriction, dt);

      gameState.shooterX = Math.max(CONFIG.shooter.halfWidth, Math.min(gameState.canvasWidth - CONFIG.shooter.halfWidth, gameState.shooterX + gameState.shooterVx));

      if (gameState.rapidActive && now > gameState.rapidNextShotAt) {
        gameState.balls.push(new Ball(gameState.shooterX, gameState.canvasHeight - 40, -Math.PI / 2 + (Math.random() - 0.5) * 0.3, gameState.ballSpeed * 1.5, gameState.damage, true));
        gameState.rapidShotsRemaining--;
        gameState.rapidNextShotAt = now + CONFIG.rapid.intervalMs;
        if (gameState.rapidShotsRemaining <= 0) gameState.rapidActive = false;
      }

      const autoInt = Math.max(150, 800 / (1 + gameState.autoLevel * 0.25));
      if (gameState.autoEnabled && now - GameEngine.lastAutoTime > autoInt) {
        GameEngine.queueShots(1);
        GameEngine.lastAutoTime = now;
      }

      let processed = 0;
      while (GameEngine.spawnQueue > 0 && processed < 8) {
        for (let k = 0; k < gameState.ballsPerShot; k++) {
          gameState.balls.push(new Ball(gameState.shooterX, gameState.canvasHeight - 40, -Math.PI / 2 + (Math.random() - 0.5) * 0.6, gameState.ballSpeed, gameState.damage));
        }
        GameEngine.spawnQueue--;
        processed++;
      }
    }

    static updateParticles(dt) {
      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update(dt);
        if (gameState.particles[i].life <= 0) gameState.particles.splice(i, 1);
      }
    }

    static updateBalls(dt) {
      for (let i = gameState.balls.length - 1; i >= 0; i--) {
        const b = gameState.balls[i];
        b.update(dt);

        if (b.y > gameState.canvasHeight + 50) {
          gameState.balls.splice(i, 1);
          continue;
        }

        for (let j = gameState.bricks.length - 1; j >= 0; j--) {
          const br = gameState.bricks[j];
          if (b.x > br.x && b.x < br.x + br.w && b.y > br.y && b.y < br.y + br.h) {
            br.takeDamage(b.damage);
            for (let p = 0; p < 4; p++) gameState.particles.push(new Particle(b.x, b.y, br.color));

            if (br.isDestroyed()) {
              gameState.score += br.value;
              gameState.coins += (br.value / 2);
              for (let p = 0; p < 12; p++) gameState.particles.push(new Particle(br.x + br.w / 2, br.y + br.h / 2, br.color));
              gameState.bricks.splice(j, 1);
            } else {
              b.vy *= -1;
            }
            break;
          }
        }
      }
    }

    static updateLevel() {
      if (gameState.bricks.length === 0) {
        gameState.levelIndex++;
        gameState.bricks = LevelManager.spawn(gameState.levelIndex, gameState.canvasWidth);
        gameState.levelInitialBricks = gameState.bricks.length;
        SaveManager.save(gameState);
      }
    }
  }

  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const gameCanvas = document.getElementById('game');
    const shopCanvas = document.getElementById('shopCanvas');

    if (gameCanvas && gameCanvas.parentElement) {
      const parent = gameCanvas.parentElement;
      const width = parent.clientWidth - 24;
      const height = parent.clientHeight - 24;
      
      gameState.canvasWidth = Math.max(width, 100);
      gameState.canvasHeight = Math.max(height, 100);
      gameState.shooterX = gameState.canvasWidth / 2;
      
      gameCanvas.width = gameState.canvasWidth * dpr;
      gameCanvas.height = gameState.canvasHeight * dpr;
      gameCanvas.style.width = gameState.canvasWidth + 'px';
      gameCanvas.style.height = gameState.canvasHeight + 'px';
    }

    if (shopCanvas) {
      shopCanvas.width = 320 * dpr;
      shopCanvas.height = gameState.canvasHeight * dpr;
      shopCanvas.style.width = '320px';
      shopCanvas.style.height = gameState.canvasHeight + 'px';
    }
  }

  function gameLoop(now) {
    const dt = Math.min((now - GameEngine.lastTime) / 16.66, 6);
    GameEngine.lastTime = now;

    GameEngine.updatePhysics(now, dt);
    GameEngine.updateParticles(dt);
    GameEngine.updateBalls(dt);
    GameEngine.updateLevel();

    if (renderer) {
      renderer.renderGame(gameState);
      renderer.renderShop(gameState);
    }
    
    if (uiManager) {
      uiManager.update(gameState);
    }

    requestAnimationFrame(gameLoop);
  }

  function setupShopClickHandler() {
    const shopCanvas = document.getElementById('shopCanvas');
    if (!shopCanvas) return;

    shopCanvas.addEventListener('click', (e) => {
      const r = shopCanvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (window.devicePixelRatio || 1);
      const y = (e.clientY - r.top) * (window.devicePixelRatio || 1);

      if (!renderer) return;
      const item = renderer.handleShopClick(x, y, gameState);
      if (!item) return;

      if (gameState.coins >= item.cost) {
        gameState.coins -= item.cost;

        const upgrades = {
          auto: () => { gameState.autoLevel++; gameState.autoEnabled = true; },
          dmg: () => { gameState.damageLevel++; gameState.damage = 1 + gameState.damageLevel * 0.5; },
          crit: () => { gameState.critLevel++; gameState.critMult = 3 + gameState.critLevel; },
          multi: () => { gameState.ballsPerShot++; },
          spd: () => { gameState.speedLevel++; gameState.ballSpeed += 0.5; },
          rapid: () => { gameState.rapidLevel++; },
        };

        if (upgrades[item.key]) upgrades[item.key]();
        SaveManager.save(gameState);
      }
    });
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) | 0;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r = r ^ (r + Math.imul(r ^ (r >>> 7), r | 61)) | 0;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  window.addEventListener('resize', setupCanvas);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    uiManager = new UIManager();
    const gameCanvas = document.getElementById('game');
    const shopCanvas = document.getElementById('shopCanvas');

    setupCanvas();
    renderer = new Renderer(gameCanvas, shopCanvas);

    uiManager.initializeButtons();
    SaveManager.load(gameState);
    gameState.bricks = LevelManager.spawn(gameState.levelIndex, gameState.canvasWidth);
    gameState.levelInitialBricks = gameState.bricks.length;

    const inputHandler = new InputHandler();
    setupShopClickHandler();

    setInterval(() => SaveManager.save(gameState), 5000);
    requestAnimationFrame(gameLoop);

    console.log('BreakIdle initialized!', gameState.canvasWidth, 'x', gameState.canvasHeight);
  }
})();