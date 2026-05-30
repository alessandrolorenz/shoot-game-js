import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ab8d0);
    scene.fog = new THREE.Fog(0x9ab8d0, 50, 90);
    return scene;
}
