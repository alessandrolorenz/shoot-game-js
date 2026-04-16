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
import { setupKeyboard, setupMobileControls } from './systems/input.js';
import { checkDifficulty } from './systems/difficulty.js';
import { shouldSpawn } from './systems/spawn.js';
import {
    hideLoading,
    hideStartScreen,
    hideGameOverScreen,
    showShootButton,
    resetBombUI
} from './ui/menus.js';

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
            activateBomb: () => activateBombFn(
                this.obstacles, this.scene, this.gameState, this.bombReady
            ),
            startGame: () => this.startGame(),
            restartGame: () => this.restartGame()
        });

        setupMobileControls({
            movePlayer: (dir) => movePlayer(dir, this.playerTargetPos, this.gameState)
        });
    }

    setupUI() {
        document.getElementById('btn-auto-shoot').addEventListener('click', () => {
            this.shootMode = 'auto';
            this.startGame();
        });
        document.getElementById('btn-manual-shoot').addEventListener('click', () => {
            this.shootMode = 'manual';
            this.startGame();
        });
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());

        document.getElementById('btn-shoot').addEventListener('click', () => {
            this.lastShootTime = manualShootFn(
                this.scene, this.bullets, this.player,
                this.gameState, this.shootMode, this.lastShootTime
            );
        });
        document.getElementById('btn-shoot').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.lastShootTime = manualShootFn(
                this.scene, this.bullets, this.player,
                this.gameState, this.shootMode, this.lastShootTime
            );
        });

        document.getElementById('btn-bomb').addEventListener('click', () =>
            activateBombFn(this.obstacles, this.scene, this.gameState, this.bombReady)
        );
        document.getElementById('btn-bomb').addEventListener('touchstart', (e) => {
            e.preventDefault();
            activateBombFn(this.obstacles, this.scene, this.gameState, this.bombReady);
        });
    }

    startGame() {
        hideStartScreen();
        this.gameState.reset();
        this.gameState.setState('PLAYING');
        this.lastSpawnTime = Date.now();

        this.obstacles.forEach(obs => this.scene.remove(obs));
        this.obstacles = [];

        this.bullets.forEach(b => { this.scene.remove(b); b.geometry.dispose(); });
        this.bullets = [];
        this.lastShootTime = 0;

        this.destroyedCount.value = 0;
        this.bombReady.value = false;
        resetBombUI();
        document.getElementById('kills-display').textContent = 'Kills: 0';

        showShootButton(this.shootMode === 'manual');

        this.playerTargetPos = { x: 1, y: 0 };
        this.playerGridPos = { x: 1, y: 0 };
    }

    restartGame() {
        hideGameOverScreen();
        this.startGame();
    }

    update() {
        const deltaTime = this.clock.getDelta();
        const currentTime = Date.now();

        if (this.gameState.state === 'PLAYING') {
            this.gameState.updateScore(deltaTime);

            updatePlayerPosition(this.player, this.playerGridPos, this.playerTargetPos);
            updateObstacles(this.obstacles, this.scene, this.gameState, this.playerGridPos);

            this.lastShootTime = checkAutoShoot(
                this.scene, this.bullets, this.player,
                this.shootMode, this.lastShootTime
            );
            updateBullets(
                this.bullets, this.obstacles, this.scene,
                () => onEnemyDestroyed(this.gameState, this.destroyedCount, this.bombReady)
            );

            updateScrollingEnvironment(
                this.groundTiles, this.roadStripes,
                this.sideBuildings, this.gameState.speed
            );
            updateParticles(this.particlePositions, this.particleSystem, this.gameState.speed);

            if (shouldSpawn(this.lastSpawnTime, this.gameState.spawnInterval)) {
                createObstacle(this.scene, this.obstacles, this.models);
                this.lastSpawnTime = currentTime;
            }

            checkDifficulty(this.gameState, currentTime);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}
