import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

function loadModel(path) {
    return new Promise((resolve) => {
        loader.load(
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
    const models = { player: null, enemy: null, tank: null, envModels: [] };

    try {
        [models.player, models.enemy, models.tank] = await Promise.all([
            loadModel('/models/player.glb'),
            loadModel('/models/enemy.glb'),
            loadModel('/models/tank.glb')
        ]);

        const envPaths = [
            '/models/environment-models/pixellabs-fantasy-signpost-3561.glb',
            '/models/environment-models/pixellabs-mine-3769.glb',
            '/models/environment-models/pixellabs-watermill-3425.glb',
            '/models/environment-models/watchtouwer.glb',
        ];
        models.envModels = (await Promise.all(envPaths.map(loadModel))).filter(Boolean);
        console.log('Models loaded:', models);
    } catch (error) {
        console.warn('Error loading models:', error);
    }

    return models;
}
