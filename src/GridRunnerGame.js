import * as THREE from 'three';

import { GameState } from './game/GameState.js';
import { createScene } from './core/scene.js';
import { createCamera } from './core/camera.js';
import { createRenderer, onWindowResize } from './core/renderer.js';
import { setupLights } from './core/lights.js';
import { loadAssets } from './assets/loader.js';
import { setupGround } from './environment/ground.js';
import {
    setupScrollingEnvironment,
    setupSideBuildings,
    setupGroundRocks,
    updateScrollingEnvironment
} from './environment/scrolling.js';
import { setupParticles, updateParticles } from './environment/particles.js';
import { createPlayer, updatePlayerPosition, movePlayer } from './game/player.js';
import { createObstacle, updateObstacles } from './game/obstacles.js';
import {
    checkAutoShoot,
    manualShoot as manualShootFn,
    updateBullets
} from './game/bullets.js';
import { onEnemyDestroyed, activateBomb as activateBombFn } from './game/bomb.js';
import { createBoss, updateBoss, updateBossBullets } from './game/boss.js';
import { setupKeyboard, setupSwipeControls } from './systems/input.js';
import { shouldSpawn } from './systems/spawn.js';
import { LevelManager } from './systems/levelManager.js';
import {
    hideLoading,
    hideStartScreen,
    hideGameOverScreen,
    showStartScreen,
    showBackMenuButton,
    hideBackMenuButton,
    resetBombUI
} from './ui/menus.js';
import { showLevelBanner, showVictoryBanner, updateLevelHUD } from './ui/levelUI.js';

export class GridRunnerGame {
    constructor() {
        this.gameState = new GameState();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.obstacles = [];
        this.playerGridPos = { x: 1, y: 0 };
        this.playerTargetPos = { x: 1, y: 0 };
        this.lastSpawnTime = 0;
        this.models = { player: null, enemy: null, tank: null, envModels: [] };
        this.groundRocks = [];
        this.clock = new THREE.Clock();
        this.groundTiles = [];
        this.roadStripes = [];
        this.sideBuildings = [];
        this.particleSystem = null;
        this.particlePositions = null;
        this.bullets = [];
        this.lastShootTime = 0;
        this.shootMode = 'auto';
        this.destroyedCount = { value: 0 };
        this.bombReady = { value: false };

        // ── Level system ───────────────────────────────────────────────────
        this.levelManager = new LevelManager();
        this.bossBullets  = [];   // projectiles fired BY the boss
        this.bossRef      = null; // reference to the active boss mesh

        this.init();
    }

    async init() {
        this.scene = createScene();
        this.camera = createCamera();
        this.renderer = createRenderer();

        setupLights(this.scene);
        setupGround(this.scene);

        const { groundTiles, roadStripes } = setupScrollingEnvironment(this.scene);
        this.groundTiles = groundTiles;
        this.roadStripes = roadStripes;

        const { particleSystem, particlePositions } = setupParticles(this.scene);
        this.particleSystem = particleSystem;
        this.particlePositions = particlePositions;

        this.models = await loadAssets();

        this.sideBuildings = setupSideBuildings(this.scene, this.models);
        this.groundRocks = setupGroundRocks(this.scene);
        this.player = createPlayer(this.scene, this.models);
        updatePlayerPosition(this.player, this.playerGridPos, this.playerTargetPos);

        this.setupControls();
        this.setupUI();

        window.addEventListener('resize', () => onWindowResize(this.camera, this.renderer));

        this.gameState.setState('MENU');
        hideLoading();
        this.animate();
    }

    setupControls() {
        setupKeyboard({
            getState: () => this.gameState.state,
            movePlayer: (dir) => movePlayer(dir, this.playerTargetPos, this.gameState),
            manualShoot: () => {
                this.lastShootTime = manualShootFn(
                    this.scene, this.bullets, this.player,
                    this.gameState, this.shootMode, this.lastShootTime
                );
            },
            activateBomb: () => this._activateBomb(),
            startGame: () => this.startGame(),
            restartGame: () => this.restartGame()
        });

        setupSwipeControls({
            movePlayer: (dir) => movePlayer(dir, this.playerTargetPos, this.gameState),
            getState: () => this.gameState.state,
        });
    }

    setupUI() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-back-menu').addEventListener('click', () => this.goToMenu());

        document.getElementById('btn-bomb').addEventListener('click', () => this._activateBomb());
        document.getElementById('btn-bomb').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._activateBomb();
        });
    }

    // ── Bomb helper (passes kill callback so level manager counts bomb kills) ─

    _activateBomb() {
        activateBombFn(
            this.obstacles, this.scene, this.gameState,
            this.bombReady, this.playerTargetPos,
            () => this._onEnemyKilled()
        );
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    goToMenu() {
        this._clearScene();
        hideGameOverScreen();
        hideBackMenuButton();
        showStartScreen();
        this.gameState.setState('MENU');
        this.playerTargetPos = { x: 1, y: 0 };
        this.playerGridPos   = { x: 1, y: 0 };
    }

    startGame() {
        hideStartScreen();
        showBackMenuButton();
        this.gameState.reset();
        this.gameState.setState('PLAYING');

        this._clearScene();
        this.lastShootTime = 0;
        this.destroyedCount.value = 0;
        this.bombReady.value = false;
        resetBombUI();

        this.playerTargetPos = { x: 1, y: 0 };
        this.playerGridPos   = { x: 1, y: 0 };

        // Initialise level system and hold spawning until the banner clears
        this.levelManager.reset();
        this.levelManager.beginTransition();

        showLevelBanner(1, false, () => {
            if (this.gameState.state === 'PLAYING') this._applyLevelConfig();
        });
    }

    restartGame() {
        hideGameOverScreen();
        hideBackMenuButton();
        this.startGame();
    }

    // ── Level lifecycle ───────────────────────────────────────────────────────

    /**
     * Apply the current level's speed + interval to gameState, reset level
     * counters, and allow spawning to resume.
     */
    _applyLevelConfig() {
        const cfg = this.levelManager.config;

        // Boss level: environment keeps scrolling at a medium speed
        this.gameState.speed = cfg.isBoss ? 0.35 : cfg.enemySpeed;
        this.gameState.spawnInterval = cfg.spawnInterval;

        this.levelManager.startLevel();         // resets counts + clears isTransitioning
        this.lastSpawnTime = 0;                  // first enemy spawns immediately

        updateLevelHUD(this.levelManager.currentLevel, 0, cfg.totalEnemies);
    }

    /**
     * Called once the last enemy of a level is either killed or flies past.
     * Clears the scene, shows the transition banner, and starts the next level
     * (or shows the victory screen if all levels are done).
     */
    _handleLevelComplete() {
        this.levelManager.beginTransition();
        this._clearScene();

        if (!this.levelManager.hasNextLevel()) {
            // All 9 levels cleared — victory!
            showVictoryBanner(() => {
                if (this.gameState.state === 'PLAYING') this.goToMenu();
            });
            return;
        }

        this.levelManager.advanceLevel();
        const cfg = this.levelManager.config;

        showLevelBanner(this.levelManager.currentLevel, cfg.isBoss, () => {
            if (this.gameState.state === 'PLAYING') this._applyLevelConfig();
        });
    }

    // ── Kill / despawn callbacks ──────────────────────────────────────────────

    /** Bullet or bomb just killed an enemy. */
    _onEnemyKilled() {
        onEnemyDestroyed(this.gameState, this.destroyedCount, this.bombReady);
        this.levelManager.recordKill();
        updateLevelHUD(
            this.levelManager.currentLevel,
            this.levelManager.killedCount,
            this.levelManager.config.totalEnemies
        );
    }

    /** An enemy flew past the player without collision. */
    _onObstacleDespawned() {
        this.levelManager.recordMiss();
    }

    // ── Scene cleanup ─────────────────────────────────────────────────────────

    _clearScene() {
        this.obstacles.forEach(obs => this.scene.remove(obs));
        this.obstacles = [];

        this.bullets.forEach(b => { this.scene.remove(b); b.geometry.dispose(); });
        this.bullets = [];

        this.bossBullets.forEach(b => this.scene.remove(b));
        this.bossBullets = [];
        this.bossRef = null;
    }

    // ── Main update loop ──────────────────────────────────────────────────────

    update() {
        const deltaTime   = this.clock.getDelta();
        const currentTime = Date.now();

        if (this.gameState.state === 'PLAYING') {
            this.gameState.updateScore(deltaTime);

            updatePlayerPosition(this.player, this.playerGridPos, this.playerTargetPos);

            updateObstacles(
                this.obstacles, this.scene, this.gameState, this.playerTargetPos,
                () => this._onObstacleDespawned()
            );

            this.lastShootTime = checkAutoShoot(
                this.scene, this.bullets, this.player,
                this.shootMode, this.lastShootTime
            );
            updateBullets(
                this.bullets, this.obstacles, this.scene,
                () => this._onEnemyKilled()
            );

            updateScrollingEnvironment(
                this.groundTiles, this.roadStripes,
                this.sideBuildings, this.gameState.speed,
                this.groundRocks
            );
            updateParticles(this.particlePositions, this.particleSystem, this.gameState.speed);

            // ── Level-based spawning ───────────────────────────────────────
            const levelCfg = this.levelManager.config;

            if (levelCfg.isBoss) {
                // Spawn the boss once, then update it every frame
                if (this.levelManager.canSpawn() && !this.bossRef) {
                    this.bossRef = createBoss(
                        this.scene, this.obstacles, this.models, levelCfg.bossHealth
                    );
                    this.levelManager.recordSpawn();
                }
                if (this.bossRef && this.bossRef.parent) {
                    updateBoss(
                        this.bossRef, this.scene, this.bossBullets,
                        this.playerGridPos, this.gameState, deltaTime
                    );
                    updateBossBullets(
                        this.bossBullets, this.scene, this.playerGridPos, this.gameState
                    );
                }
            } else if (
                this.levelManager.canSpawn() &&
                shouldSpawn(this.lastSpawnTime, levelCfg.spawnInterval)
            ) {
                createObstacle(this.scene, this.obstacles, this.models, this.gameState, levelCfg);
                this.levelManager.recordSpawn();
                this.lastSpawnTime = currentTime;
            }

            // ── Level completion check ─────────────────────────────────────
            if (!this.levelManager.isTransitioning && this.levelManager.isLevelComplete()) {
                this._handleLevelComplete();
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}
