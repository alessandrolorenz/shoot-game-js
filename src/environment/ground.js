import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function setupGround(scene) {
    const groundGeometry = new THREE.PlaneGeometry(50, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x5dc85d,
        roughness: 0.9,
        metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    ground.receiveShadow = true;
    scene.add(ground);

    createLaneMarkers(scene);
}

function createLaneMarkers(scene) {
    const markerGeometry = new THREE.BoxGeometry(0.1, 0.1, 100);
    const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.55
    });

    for (let x = 0; x < CONFIG.GRID.X_POSITIONS; x++) {
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const worldX = (x - 1) * CONFIG.GRID.SPACING;
        marker.position.set(worldX, -1.9, -25);
        scene.add(marker);
    }
}
