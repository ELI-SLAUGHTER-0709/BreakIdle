(function () {
  'use strict';

  const CONFIG = {
    canvas: { width: 800, height: 520 },
    game: { brickGridCols: 10, brickGridRows: 6, brickSpawnChance: 0.6 },
    shooter: { halfWidth: 18 },
    physics: { shooterAccel: 2.2, shooterFriction: 0.75 },
    rapid: { unlockedAtLevel: 10, cooldownMs: 60000, baseShots: 60, shotsPerLevel: 10, intervalMs: 25 },
  };

  const NEON_COLORS = ['#ff0055', '#00f2ff', '#7000ff', '#00ff44', '#ffaa00', '#ff00ff', '#00fbff'];
  const STORAGE_KEY = 'breakIdleSave_v2';

  let uiManager = null;
  let renderer = null;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const finiteNumber = (value, fallback) => Number.isFinite(value) ? value : fallback;

  let gameState = {
    coins: 0, score: 0, ballsPerShot: 1, ballSpeed: 4,
    damageLevel: 0, damage: 1, critLevel: 0, critMult: 3,
    autoLevel: 0, autoEnabled: false, speedLevel: 0, rapidLevel: 0,
    balls: [], bricks: [], particles: [], shooterX: 400, shooterVx: 0,
    keys: { left: false, right: false }, levelIndex: 0, levelInitialBricks: 0,
    rapidLastUsed: -999999, rapidActive: false, rapidShotsRemaining: 0,
    rapidNextShotAt: 0, canvasWidth: 800, canvasHeight: 520,
  };

  class UIManager {
    constructor() {
      this.elements = {
        coins: null, score: null, level: null, activeBalls: null, progressBar: null,
        autoToggle: null, ballDmgText: null, ballSpdEl: null, ballsPerShotEl: null,
        rapidContainer: document.getElementById('rapidCooldownContainer'), useRapidBtn: null,
        rapidCooldownBar: document.getElementById('rapidCooldownBar'),
        rapidCooldownWrap: document.querySelector('.rapid-bar-wrap'),
        rapidCDText: document.getElementById('rapidCooldownText'),
        rapidBallsStat: null, headerStats: document.getElementById('headerStats'), shootBtn: null,
      };
      this.initializeStats();
    }

    initializeStats() {
      if (!this.elements.headerStats) return;
      this.elements.headerStats.innerHTML = `
        <div>Coins: <span id="coins">0</span></div>
        <div>Score: <span id="score">0</span></div>
        <div>Level: <span id="level">1</span></div>
        <div>Ball Damage: <span id="ballDamage">1.0</span></div>
        <div>Ball Speed: <span id="ballSpeed">4.0</span></div>
        <div>Auto Speed: <span id="autoSpeed">0.00 /s</span></div>
        <div>Balls / Shot: <span id="ballsPerShotDisplay">1</span></div>
        <div>Active Balls: <span id="activeBalls">0</span></div>
        <div>Rapid Balls / Volley: <span id="rapidBalls">60</span></div>
        <div class="level-progress"><div class="progress-label">Level Progress</div><div class="progress-wrap"><div id="progressBar"></div></div></div>`;
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

    initializeButtons() {
      const center = document.querySelector('.bottom-center');
      if (!center) return;
      center.innerHTML = `
        <button id="autoToggle" class="green-btn" type="button" aria-pressed="false" style="display:none">AUTO</button>
        <button id="shootBtn" class="big-red" type="button">SHOOT</button>
        <button id="useRapidBottom" class="blue-btn" type="button" style="display:none">RAPID</button>`;
      this.elements.shootBtn = document.getElementById('shootBtn');
      this.elements.autoToggle = document.getElementById('autoToggle');
      this.elements.useRapidBtn = document.getElementById('useRapidBottom');
    }

    update(state) {
      if (this.elements.coins) this.elements.coins.textContent = Math.floor(state.coins);
      if (this.elements.score) this.elements.score.textContent = Math.floor(state.score);
      if (this.elements.level) this.elements.level.textContent = state.levelIndex + 1;
      if (this.elements.activeBalls) this.elements.activeBalls.textContent = state.balls.length;
      if (this.elements.ballDmgText) this.elements.ballDmgText.textContent = state.damage.toFixed(1);
      if (this.elements.ballSpdEl) this.elements.ballSpdEl.textContent = state.ballSpeed.toFixed(1);
      if (this.elements.ballsPerShotEl) this.elements.ballsPerShotEl.textContent = state.ballsPerShot;
      if (this.elements.rapidBallsStat) this.elements.rapidBallsStat.textContent = CONFIG.rapid.baseShots + state.rapidLevel * CONFIG.rapid.shotsPerLevel;

      const unlocked = state.levelIndex + 1 >= CONFIG.rapid.unlockedAtLevel;
      if (this.elements.rapidContainer) {
        this.elements.rapidContainer.hidden = !unlocked;
        this.elements.rapidContainer.setAttribute('aria-hidden', String(!unlocked));
      }
      if (this.elements.useRapidBtn) this.elements.useRapidBtn.style.display = unlocked ? 'block' : 'none';

      if (unlocked) {
        const elapsed = performance.now() - state.rapidLastUsed;
        const remaining = state.rapidActive ? CONFIG.rapid.cooldownMs / 1000 : Math.max(0, (CONFIG.rapid.cooldownMs - elapsed) / 1000);
        const progress = state.rapidActive ? 0 : clamp(elapsed / CONFIG.rapid.cooldownMs * 100, 0, 100);
        if (this.elements.rapidCooldownBar) this.elements.rapidCooldownBar.style.width = `${progress}%`;
        if (this.elements.rapidCooldownWrap) this.elements.rapidCooldownWrap.setAttribute('aria-valuenow', String(Math.round(progress)));
        if (this.elements.rapidCDText) this.elements.rapidCDText.textContent = remaining > 0 ? `${remaining.toFixed(1)}s` : 'READY';
        if (this.elements.useRapidBtn) {
          const ready = remaining <= 0 && !state.rapidActive;
          this.elements.useRapidBtn.disabled = !ready;
        }
      }

      if (this.elements.autoToggle) {
        this.elements.autoToggle.style.display = state.autoLevel > 0 ? 'block' : 'none';
        this.elements.autoToggle.textContent = state.autoEnabled ? 'AUTO: ON' : 'AUTO: OFF';
        this.elements.autoToggle.setAttribute('aria-pressed', String(state.autoEnabled));
      }
      const progress = state.levelInitialBricks > 0 ? clamp((state.levelInitialBricks - state.bricks.length) / state.levelInitialBricks * 100, 0, 100) : 0;
      if (this.elements.progressBar) this.elements.progressBar.style.width = `${progress}%`;
    }
  }

  class Particle { constructor(x,y,color){this.x=x;this.y=y;this.vx=(Math.random()-0.5)*6;this.vy=(Math.random()-0.5)*6;this.life=1;this.color=color;this.size=Math.random()*2+2;} update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.life-=0.025*dt;} draw(ctx){ctx.globalAlpha=this.life;ctx.fillStyle=this.color;ctx.shadowBlur=8;ctx.shadowColor=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;} }
  class Ball { constructor(x,y,angle,speed,damage,isRapid=false){this.x=x;this.y=y;this.vx=Math.cos(angle)*speed;this.vy=Math.sin(angle)*speed;this.isCrit=!isRapid&&Math.random()<0.12;this.damage=isRapid?damage*1.5:(this.isCrit?damage*gameState.critMult:damage);this.r=3.2;this.isRapid=isRapid;} update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.x-this.r<0){this.x=this.r;this.vx=Math.abs(this.vx);}else if(this.x+this.r>gameState.canvasWidth){this.x=gameState.canvasWidth-this.r;this.vx=-Math.abs(this.vx);}if(this.y-this.r<0){this.y=this.r;this.vy=Math.abs(this.vy);}} draw(ctx){ctx.fillStyle=this.isCrit?'#ffcc00':(this.isRapid?'#00f2ff':'#ffffff');ctx.shadowBlur=this.isCrit||this.isRapid?10:0;ctx.shadowColor=this.isCrit?'#ffaa00':'#00f2ff';ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;} }
  class Brick { constructor(x,y,w,h,hp,value){this.x=x;this.y=y;this.w=w;this.h=h;this.hp=hp;this.maxHp=hp;this.value=value;this.color=NEON_COLORS[Math.floor(Math.random()*NEON_COLORS.length)];this.hitAnim=0;} draw(ctx){const scale=1+Math.sin(this.hitAnim)*0.1;ctx.save();ctx.translate(this.x+this.w/2,this.y+this.h/2);ctx.scale(scale,scale);ctx.shadowBlur=12;ctx.shadowColor=this.color;ctx.fillStyle=this.color;ctx.beginPath();ctx.roundRect(-this.w/2+2,-this.h/2+2,this.w-4,this.h-4,6);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#000';ctx.font='bold 15px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.ceil(this.hp),0,0);ctx.restore();if(this.hitAnim>0)this.hitAnim-=0.2;} takeDamage(damage){this.hp-=damage;this.hitAnim=Math.PI/2;} isDestroyed(){return this.hp<=0;} }

  class ShopManager {
    constructor(shopCanvas){this.canvas=shopCanvas;this.ctx=shopCanvas?.getContext('2d')||null;this.items=[];this.defineItems();}
    defineItems(){this.itemDefinitions=[{key:'auto',label:'Unlock Auto',labelAlt:'Auto Spd',getCost:s=>Math.floor(50*Math.pow(1.6,s.autoLevel))},{key:'dmg',label:'Power',getCost:s=>Math.floor(30*Math.pow(1.45,s.damageLevel))},{key:'crit',label:'Crit Dmg',getCost:s=>Math.floor(150*Math.pow(1.8,s.critLevel))},{key:'multi',label:'Balls',getCost:s=>Math.floor(200*Math.pow(1.5,s.ballsPerShot-1))},{key:'spd',label:'Speed',getCost:s=>Math.floor(40*Math.pow(1.4,s.speedLevel))}];}
    getUpgradeLevel(key,state){if(key==='dmg')return state.damageLevel;if(key==='multi')return Math.max(0,state.ballsPerShot-1);return state[`${key}Level`]||0;}
    render(state){if(!this.ctx||!this.canvas)return;const dpr=window.devicePixelRatio||1;const width=this.canvas.width/dpr;const height=this.canvas.height/dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.clearRect(0,0,width,height);this.ctx.fillStyle='rgba(255,204,77,.2)';this.ctx.fillRect(0,0,width,45);this.ctx.fillStyle='#ffcc4d';this.ctx.font='bold 18px Inter';this.ctx.textAlign='left';this.ctx.textBaseline='middle';this.ctx.fillText('UPGRADES',15,22);const items=[...this.itemDefinitions];if(state.levelIndex+1>=CONFIG.rapid.unlockedAtLevel)items.push({key:'rapid',label:'Rapid (+10)',getCost:s=>Math.floor(500*Math.pow(1.4,s.rapidLevel))});const padding=17.5,buttonWidth=width-padding*2,buttonHeight=48,spacing=6,availableHeight=height-45-padding*2,neededHeight=items.length*(buttonHeight+spacing),scale=clamp(availableHeight/neededHeight,.75,1),scaledHeight=buttonHeight*scale,scaledSpacing=spacing*scale;this.items=items.map((def,i)=>{const cost=def.getCost(state),afford=state.coins>=cost,yPos=45+padding+i*(scaledHeight+scaledSpacing),rect={x:padding,y:yPos,w:buttonWidth,h:scaledHeight};const gradient=this.ctx.createLinearGradient(rect.x,rect.y,rect.x,rect.y+rect.h);gradient.addColorStop(0,afford?'rgba(0,242,255,.15)':'rgba(255,255,255,.05)');gradient.addColorStop(1,afford?'rgba(0,242,255,.05)':'rgba(255,255,255,.01)');this.ctx.fillStyle=gradient;this.ctx.beginPath();this.ctx.roundRect(rect.x,rect.y,rect.w,rect.h,6);this.ctx.fill();this.ctx.strokeStyle=afford?'rgba(0,242,255,.5)':'rgba(255,255,255,.15)';this.ctx.lineWidth=afford?1.5:.8;this.ctx.stroke();const level=this.getUpgradeLevel(def.key,state);this.ctx.fillStyle=afford?'#fff':'#999';this.ctx.font=`bold ${13*scale}px Inter`;this.ctx.textAlign='left';this.ctx.textBaseline='top';this.ctx.fillText(level>0&&def.labelAlt?def.labelAlt:def.label,rect.x+10,rect.y+4);this.ctx.fillStyle=afford?'rgba(0,242,255,.7)':'rgba(255,255,255,.4)';this.ctx.font=`bold ${10*scale}px Inter`;this.ctx.textBaseline='middle';this.ctx.fillText(`LV.${level}`,rect.x+10,rect.y+rect.h-10);this.ctx.fillStyle=afford?'#00f2ff':'#ff8888';this.ctx.font=`bold ${14*scale}px Inter`;this.ctx.textAlign='right';this.ctx.fillText(`${cost}⛀`,rect.x+rect.w-8,rect.y+rect.h/2);return{key:def.key,rect,cost};});}
    handleClick(x,y){return this.items.find(item=>x>=item.rect.x&&x<=item.rect.x+item.rect.w&&y>=item.rect.y&&y<=item.rect.y+item.rect.h)||null;}
  }

  class Renderer { constructor(gameCanvas,shopCanvas){this.gameCanvas=gameCanvas;this.gameCtx=gameCanvas?.getContext('2d')||null;this.shopManager=shopCanvas?new ShopManager(shopCanvas):null;} renderGame(state){if(!this.gameCtx||!this.gameCanvas)return;const dpr=window.devicePixelRatio||1,width=this.gameCanvas.width/dpr,height=this.gameCanvas.height/dpr;this.gameCtx.setTransform(dpr,0,0,dpr,0,0);this.gameCtx.fillStyle='#0a0a0c';this.gameCtx.fillRect(0,0,width,height);state.bricks.forEach(brick=>brick.draw(this.gameCtx));state.particles.forEach(particle=>particle.draw(this.gameCtx));state.balls.forEach(ball=>ball.draw(this.gameCtx));this.gameCtx.shadowBlur=15;this.gameCtx.shadowColor='#00f2ff';this.gameCtx.fillStyle='#00f2ff';this.gameCtx.beginPath();this.gameCtx.roundRect(state.shooterX-18,height-40,36,12,4);this.gameCtx.fill();this.gameCtx.shadowBlur=0;} renderShop(state){this.shopManager?.render(state);} handleShopClick(x,y){return this.shopManager?.handleClick(x,y)||null;} }
  class LevelManager { static spawn(index,canvasWidth){const bricks=[];const brickWidth=(canvasWidth-20)/10;const rng=mulberry32(index+777);for(let r=0;r<6;r++)for(let c=0;c<10;c++)if(rng()<0.6){const hp=Math.max(1,3+r+Math.floor(Math.log2(index+1)*8));bricks.push(new Brick(10+c*brickWidth,45+r*35,brickWidth,30,hp,Math.ceil(hp*.5)));}return bricks;} }

  class SaveManager {
    static save(state){const data={coins:finiteNumber(state.coins,0),score:finiteNumber(state.score,0),levelIndex:Math.max(0,Math.floor(finiteNumber(state.levelIndex,0))),ballsPerShot:Math.max(1,Math.floor(finiteNumber(state.ballsPerShot,1))),ballSpeed:Math.max(.5,finiteNumber(state.ballSpeed,4)),damageLevel:Math.max(0,Math.floor(finiteNumber(state.damageLevel,0))),damage:Math.max(.1,finiteNumber(state.damage,1)),critLevel:Math.max(0,Math.floor(finiteNumber(state.critLevel,0))),critMult:Math.max(1,finiteNumber(state.critMult,3)),autoLevel:Math.max(0,Math.floor(finiteNumber(state.autoLevel,0))),autoEnabled:Boolean(state.autoEnabled),speedLevel:Math.max(0,Math.floor(finiteNumber(state.speedLevel,0))),rapidLevel:Math.max(0,Math.floor(finiteNumber(state.rapidLevel,0)))};try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(error){console.warn('Could not save progress',error);}}
    static load(state){try{const saved=localStorage.getItem(STORAGE_KEY);if(!saved)return;const data=JSON.parse(saved);Object.assign(state,{coins:Math.max(0,finiteNumber(data.coins,0)),score:Math.max(0,finiteNumber(data.score,0)),levelIndex:Math.max(0,Math.floor(finiteNumber(data.levelIndex,0))),ballsPerShot:Math.max(1,Math.floor(finiteNumber(data.ballsPerShot,1))),ballSpeed:Math.max(.5,finiteNumber(data.ballSpeed,4)),damageLevel:Math.max(0,Math.floor(finiteNumber(data.damageLevel,0))),damage:Math.max(.1,finiteNumber(data.damage,1)),critLevel:Math.max(0,Math.floor(finiteNumber(data.critLevel,0))),critMult:Math.max(1,finiteNumber(data.critMult,3)),autoLevel:Math.max(0,Math.floor(finiteNumber(data.autoLevel,0))),autoEnabled:Boolean(data.autoEnabled),speedLevel:Math.max(0,Math.floor(finiteNumber(data.speedLevel,0))),rapidLevel:Math.max(0,Math.floor(finiteNumber(data.rapidLevel,0)))});state.rapidLastUsed=-999999;}catch(error){console.warn('Save corrupted; starting a fresh game',error);localStorage.removeItem(STORAGE_KEY);}}
  }

  class InputHandler {
    constructor(){this.setup();}
    setup(){window.addEventListener('keydown',event=>this.onKeyDown(event));window.addEventListener('keyup',event=>this.onKeyUp(event));uiManager.elements.shootBtn?.addEventListener('pointerdown',event=>{event.preventDefault();GameEngine.queueShots(1);});uiManager.elements.autoToggle?.addEventListener('click',()=>{gameState.autoEnabled=!gameState.autoEnabled;SaveManager.save(gameState);});uiManager.elements.useRapidBtn?.addEventListener('click',()=>GameEngine.triggerRapid());const shopToggle=document.getElementById('shopToggle'),shop=document.getElementById('shop');shopToggle?.addEventListener('click',()=>{const open=!shop?.classList.contains('open');shop?.classList.toggle('open',open);shopToggle.setAttribute('aria-expanded',String(open));});}
    onKeyDown(event){if(['ArrowLeft','ArrowRight','ArrowUp','Control','Shift',' '].includes(event.key)&&event.target===document.body)event.preventDefault();if(event.key==='ArrowLeft')gameState.keys.left=true;if(event.key==='ArrowRight')gameState.keys.right=true;if(event.key==='ArrowUp'&&!event.repeat)GameEngine.queueShots(1);if(event.key==='Control'&&!event.repeat){gameState.autoEnabled=!gameState.autoEnabled;SaveManager.save(gameState);}if((event.key==='Shift'||event.code==='Space')&&!event.repeat)GameEngine.triggerRapid();}
    onKeyUp(event){if(event.key==='ArrowLeft')gameState.keys.left=false;if(event.key==='ArrowRight')gameState.keys.right=false;}
  }

  class GameEngine {
    static{this.spawnQueue=0;this.lastAutoTime=0;this.lastTime=performance.now();}
    static queueShots(count){this.spawnQueue+=count;}
    static triggerRapid(){const now=performance.now();if(gameState.levelIndex+1>=CONFIG.rapid.unlockedAtLevel&&!gameState.rapidActive&&now-gameState.rapidLastUsed>=CONFIG.rapid.cooldownMs){gameState.rapidActive=true;gameState.rapidLastUsed=now;gameState.rapidShotsRemaining=CONFIG.rapid.baseShots+gameState.rapidLevel*CONFIG.rapid.shotsPerLevel;gameState.rapidNextShotAt=now;}}
    static updatePhysics(now,dt){if(gameState.keys.left)gameState.shooterVx-=CONFIG.physics.shooterAccel*dt;else if(gameState.keys.right)gameState.shooterVx+=CONFIG.physics.shooterAccel*dt;else gameState.shooterVx*=Math.pow(CONFIG.physics.shooterFriction,dt);gameState.shooterX=clamp(gameState.shooterX+gameState.shooterVx,18,gameState.canvasWidth-18);if(gameState.rapidActive&&now>=gameState.rapidNextShotAt){gameState.balls.push(new Ball(gameState.shooterX,gameState.canvasHeight-40,-Math.PI/2+(Math.random()-0.5)*0.3,gameState.ballSpeed*1.5,gameState.damage,true));gameState.rapidShotsRemaining--;gameState.rapidNextShotAt=now+CONFIG.rapid.intervalMs;if(gameState.rapidShotsRemaining<=0)gameState.rapidActive=false;}const autoInterval=Math.max(150,800/(1+gameState.autoLevel*.25));if(gameState.autoEnabled&&now-GameEngine.lastAutoTime>=autoInterval){GameEngine.queueShots(1);GameEngine.lastAutoTime=now;}let processed=0;while(GameEngine.spawnQueue>0&&processed<8){for(let k=0;k<gameState.ballsPerShot;k++)gameState.balls.push(new Ball(gameState.shooterX,gameState.canvasHeight-40,-Math.PI/2+(Math.random()-0.5)*.6,gameState.ballSpeed,gameState.damage));GameEngine.spawnQueue--;processed++;}}
    static updateParticles(dt){for(let i=gameState.particles.length-1;i>=0;i--){gameState.particles[i].update(dt);if(gameState.particles[i].life<=0)gameState.particles.splice(i,1);}}
    static updateBalls(dt){for(let i=gameState.balls.length-1;i>=0;i--){const ball=gameState.balls[i];ball.update(dt);if(ball.y>gameState.canvasHeight+50){gameState.balls.splice(i,1);continue;}for(let j=gameState.bricks.length-1;j>=0;j--){const brick=gameState.bricks[j];const overlaps=ball.x+ball.r>=brick.x&&ball.x-ball.r<=brick.x+brick.w&&ball.y+ball.r>=brick.y&&ball.y-ball.r<=brick.y+brick.h;if(!overlaps)continue;brick.takeDamage(ball.damage);for(let p=0;p<4;p++)gameState.particles.push(new Particle(ball.x,ball.y,brick.color));if(brick.isDestroyed()){gameState.score+=brick.value;gameState.coins+=brick.value/2;for(let p=0;p<12;p++)gameState.particles.push(new Particle(brick.x+brick.w/2,brick.y+brick.h/2,brick.color));gameState.bricks.splice(j,1);}else{const left=ball.x+ball.r-brick.x,right=brick.x+brick.w-(ball.x-ball.r),top=ball.y+ball.r-brick.y,bottom=brick.y+brick.h-(ball.y-ball.r),smallest=Math.min(left,right,top,bottom);if(smallest===left||smallest===right)ball.vx*=-1;else ball.vy*=-1;}break;}}}
    static updateLevel(){if(gameState.bricks.length===0){gameState.levelIndex++;gameState.bricks=LevelManager.spawn(gameState.levelIndex,gameState.canvasWidth);gameState.levelInitialBricks=gameState.bricks.length;SaveManager.save(gameState);}}
  }

  function setupCanvas(){
    const dpr=window.devicePixelRatio||1;
    const gameCanvas=document.getElementById('game');
    const shopCanvas=document.getElementById('shopCanvas');
    if(gameCanvas){const rect=gameCanvas.getBoundingClientRect();const cssWidth=Math.max(100,Math.round(rect.width));const cssHeight=Math.max(65,Math.round(rect.height));gameCanvas.width=Math.round(cssWidth*dpr);gameCanvas.height=Math.round(cssHeight*dpr);gameCanvas.style.width='100%';gameCanvas.style.height='100%';gameState.canvasWidth=cssWidth;gameState.canvasHeight=cssHeight;gameState.shooterX=clamp(gameState.shooterX,18,cssWidth-18);}
    if(shopCanvas){const rect=shopCanvas.getBoundingClientRect();const cssWidth=Math.max(200,Math.round(rect.width||340));const cssHeight=Math.max(200,Math.round(rect.height||520));shopCanvas.width=Math.round(cssWidth*dpr);shopCanvas.height=Math.round(cssHeight*dpr);shopCanvas.style.width='100%';shopCanvas.style.height='100%';}
  }

  function gameLoop(now){const dt=clamp((now-GameEngine.lastTime)/16.66,0,6);GameEngine.lastTime=now;GameEngine.updatePhysics(now,dt);GameEngine.updateParticles(dt);GameEngine.updateBalls(dt);GameEngine.updateLevel();renderer?.renderGame(gameState);renderer?.renderShop(gameState);uiManager?.update(gameState);requestAnimationFrame(gameLoop);}

  function setupShopClickHandler(){const shopCanvas=document.getElementById('shopCanvas');if(!shopCanvas)return;shopCanvas.addEventListener('click',event=>{const rect=shopCanvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,x=(event.clientX-rect.left)*(shopCanvas.width/rect.width)/dpr,y=(event.clientY-rect.top)*(shopCanvas.height/rect.height)/dpr,item=renderer?.handleShopClick(x,y);if(!item||gameState.coins<item.cost)return;gameState.coins-=item.cost;const upgrades={auto:()=>{gameState.autoLevel++;gameState.autoEnabled=true;},dmg:()=>{gameState.damageLevel++;gameState.damage=1+gameState.damageLevel*.5;},crit:()=>{gameState.critLevel++;gameState.critMult=3+gameState.critLevel;},multi:()=>{gameState.ballsPerShot++;},spd:()=>{gameState.speedLevel++;gameState.ballSpeed+=.5;},rapid:()=>{gameState.rapidLevel++;}};upgrades[item.key]?.();SaveManager.save(gameState);});}

  function mulberry32(seed){let value=seed>>>0;return function(){value=(value+0x6D2B79F5)|0;let result=Math.imul(value^((value>>>15)),value|1);result^=Math.imul(result^((result>>>7)),result|61);return(((result^((result>>>14)))>>>0)/4294967296);};}

  let resizeTimer=null;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(setupCanvas,100);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

  function init(){uiManager=new UIManager();const gameCanvas=document.getElementById('game'),shopCanvas=document.getElementById('shopCanvas');setupCanvas();renderer=new Renderer(gameCanvas,shopCanvas);uiManager.initializeButtons();SaveManager.load(gameState);gameState.bricks=LevelManager.spawn(gameState.levelIndex,gameState.canvasWidth);gameState.levelInitialBricks=gameState.bricks.length;new InputHandler();setupShopClickHandler();setInterval(()=>SaveManager.save(gameState),5000);requestAnimationFrame(gameLoop);}
})();
