import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

function loadModel(path) {
    return new Promise((resolve) => {
        gltfLoader.load(
            path,
            (gltf) => resolve(gltf.scene),
            undefined,
            (error) => {
                console.warn(`Failed to load ${path}:`, error);
                resolve(null);
            }
        );
    });
}


export async function loadAssets() {
    const models = { player: null, enemy: null, tank: null, enemyDub: null, enemyAtomicBomb: null, boss: null, envModels: [], warScenery: null };

    try {
        [models.player, models.enemy, models.tank, models.enemyDub, models.enemyAtomicBomb, models.boss] = await Promise.all([
            loadModel('/models/player-airplane.glb'),
            loadModel('/models/golden-coin.glb'),
            loadModel('/models/money-bag.glb'),
            loadModel('/models/silver-coin.glb'),
            loadModel('/models/enemy-atomic-bomb.glb'),
            loadModel('/models/boss.glb'),
        ]);

        const glbEnvPaths = [
            '/models/environment-models/futuristic-building-a.glb',
            '/models/environment-models/futuristic-building-b.glb',
            '/models/environment-models/futuristic-building-c.glb',
            '/models/environment-models/futuristic-tower.glb',
        ];
        const glbModels = await Promise.all(glbEnvPaths.map(loadModel)).then(r => r.filter(Boolean));
        models.warScenery = null;
        models.envModels = glbModels;
        console.log('Models loaded:', models);
    } catch (error) {
        console.warn('Error loading models:', error);
    }

    return models;
}
