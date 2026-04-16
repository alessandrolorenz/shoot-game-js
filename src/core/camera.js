import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.FOV, aspect, 0.1, 1000);
    camera.position.set(
        CONFIG.CAMERA.POSITION.x,
        CONFIG.CAMERA.POSITION.y,
        CONFIG.CAMERA.POSITION.z
    );
    camera.lookAt(
        CONFIG.CAMERA.LOOKAT.x,
        CONFIG.CAMERA.LOOKAT.y,
        CONFIG.CAMERA.LOOKAT.z
    );
    return camera;
}
