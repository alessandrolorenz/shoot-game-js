import * as THREE from 'three';

export function setupParticles(scene) {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 26;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 14 - 1;
        positions[i * 3 + 2] = -(Math.random() * 100);

        const t = Math.random();
        colors[i * 3]     = 0.85 + t * 0.15;
        colors[i * 3 + 1] = 0.40 + t * 0.50;
        colors[i * 3 + 2] = 0.30 + (1 - t) * 0.40;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.10,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        depthWrite: false
    });

    const particleSystem = new THREE.Points(geo, mat);
    scene.add(particleSystem);

    return { particleSystem, particlePositions: positions };
}

export function updateParticles(particlePositions, particleSystem, speed) {
    if (!particleSystem) return;
    const pos = particlePositions;
    const spd = speed * 3;

    for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 2] += spd;
        if (pos[i * 3 + 2] > 7) {
            pos[i * 3]     = (Math.random() - 0.5) * 26;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 14 - 1;
            pos[i * 3 + 2] = -100;
        }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
}
