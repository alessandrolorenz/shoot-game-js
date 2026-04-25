import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();

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

function loadOBJModel(mtlPath, objPath, texturePath, preScale = 1) {
    return new Promise((resolve) => {
        mtlLoader.setResourcePath(texturePath);
        mtlLoader.load(
            mtlPath,
            (materials) => {
                materials.preload();
                objLoader.setMaterials(materials);
                objLoader.load(
                    objPath,
                    (object) => {
                        const wrapper = new THREE.Group();
                        object.scale.setScalar(preScale);
                        wrapper.add(object);
                        resolve(wrapper);
                    },
                    undefined,
                    (error) => {
                        console.warn(`Failed to load ${objPath}:`, error);
                        resolve(null);
                    }
                );
            },
            undefined,
            (error) => {
                console.warn(`Failed to load ${mtlPath}:`, error);
                objLoader.load(
                    objPath,
                    (object) => {
                        const wrapper = new THREE.Group();
                        object.scale.setScalar(preScale);
                        wrapper.add(object);
                        resolve(wrapper);
                    },
                    undefined,
                    () => resolve(null)
                );
            }
        );
    });
}

export async function loadAssets() {
    const models = { player: null, enemy: null, tank: null, enemyDub: null, enemyAtomicBomb: null, boss: null, envModels: [] };

    try {
        [models.player, models.enemy, models.tank, models.enemyDub, models.enemyAtomicBomb, models.boss] = await Promise.all([
            loadModel('/models/player.glb'),
            loadModel('/models/enemy.glb'),
            loadModel('/models/tank.glb'),
            loadModel('/models/enemy-dub.glb'),
            loadModel('/models/enemy-atomic-bomb.glb'),
            loadModel('/models/boss.glb'),
        ]);

        const glbEnvPaths = [
            '/models/environment-models/pixellabs-mine-3769.glb',
            '/models/environment-models/pixellabs-watermill-3425.glb',
            '/models/environment-models/watchtouwer.glb',
        ];
        const glbModels = (await Promise.all(glbEnvPaths.map(loadModel))).filter(Boolean);

        const treeModel = await loadOBJModel(
            '/models/environment-models/tree/Tree.mtl',
            '/models/environment-models/tree/Tree.obj',
            '/models/environment-models/tree/',
            0.2
        );

        models.envModels = treeModel ? [treeModel, treeModel, treeModel, treeModel, ...glbModels] : glbModels;
        console.log('Models loaded:', models);
    } catch (error) {
        console.warn('Error loading models:', error);
    }

    return models;
}
