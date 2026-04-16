import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 30, 60);
    return scene;
}
