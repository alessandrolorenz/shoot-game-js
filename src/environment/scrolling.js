import * as THREE from 'three';

export function setupScrollingEnvironment(scene) {
    const groundTiles = [];
    const roadStripes = [];

    const tileMat = new THREE.MeshStandardMaterial({ color: 0x0d0d1f, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
        const tile = new THREE.Mesh(new THREE.PlaneGeometry(18, 40), tileMat);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(0, -3.5, 10 - i * 40);
        tile.receiveShadow = true;
        scene.add(tile);
        groundTiles.push(tile);
    }

    const stripeMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.18
    });
    for (let i = 0; i < 10; i++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 5), stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, -3.48, -i * 12);
        scene.add(stripe);
        roadStripes.push(stripe);
    }

    return { groundTiles, roadStripes };
}

export function setupSideBuildings(scene, models) {
    const sideBuildings = [];
    const count = 40;
    const hasModels = models.envModels.length > 0;

    for (let i = 0; i < count; i++) {
        for (const side of [-1, 1]) {
            let obj;

            // Wider slot spacing with large random jitter for irregular gaps
            const zPos = -i * 14 - Math.random() * 10;
            // Closer to the play field and with more X variance
            const xOffset = side * (5.5 + Math.random() * 2.0);

            if (hasModels) {
                const template = models.envModels[
                    Math.floor(Math.random() * models.envModels.length)
                ];
                obj = template.clone();
                const s = 4.0 + Math.random() * 2.5;
                obj.scale.setScalar(s);
                // Random Y rotation for variety
                obj.rotation.y = side === 1 ? Math.PI + (Math.random() - 0.5) * 0.6
                                            : (Math.random() - 0.5) * 0.6;
                obj.position.set(xOffset, -3, zPos);
            } else {
                const h = 2 + Math.random() * 7;
                const w = 1.0 + Math.random() * 1.8;
                const d = 1.0 + Math.random() * 1.5;
                const hasGlow = Math.random() > 0.5;
                const glowColor = Math.random() > 0.5 ? 0x003311 : 0x000a22;
                const mat = new THREE.MeshStandardMaterial({
                    color: 0x080812,
                    emissive: hasGlow ? glowColor : 0x000000,
                    emissiveIntensity: 1.0
                });
                obj = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
                obj.position.set(xOffset, -3 + h / 2, zPos);

                if (hasGlow) {
                    const roofMat = new THREE.MeshBasicMaterial({
                        color: Math.random() > 0.5 ? 0x00ff88 : 0x0055ff,
                        transparent: true,
                        opacity: 0.85
                    });
                    const roof = new THREE.Mesh(
                        new THREE.BoxGeometry(w + 0.1, 0.08, d + 0.1),
                        roofMat
                    );
                    roof.position.copy(obj.position);
                    roof.position.y += h / 2;
                    scene.add(roof);
                    sideBuildings.push(roof);
                }
            }

            obj.castShadow = true;
            scene.add(obj);
            sideBuildings.push(obj);
        }
    }

    return sideBuildings;
}

export function setupGroundRocks(scene) {
    const count = 40;
    const geo = new THREE.IcosahedronGeometry(0.55, 0); // flat-shaded low-poly = rock look
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a4f5a, roughness: 1.0, flatShading: true });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
        dummy.position.set(
            (Math.random() - 0.5) * 16,
            -3.45 + Math.random() * 0.15,
            -Math.random() * 120
        );
        dummy.scale.setScalar(0.4 + Math.random() * 0.7);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    return mesh;
}

export function updateScrollingEnvironment(groundTiles, roadStripes, sideBuildings, speed, groundRocks) {
    for (const tile of groundTiles) {
        tile.position.z += speed;
        if (tile.position.z > 30) tile.position.z -= 120;
    }

    for (const stripe of roadStripes) {
        stripe.position.z += speed;
        if (stripe.position.z > 6) stripe.position.z -= 120;
    }

    for (const building of sideBuildings) {
        building.position.z += speed;
        if (building.position.z > 15) building.position.z -= 295;
    }

    if (groundRocks) {
        const m = new THREE.Matrix4();
        for (let i = 0; i < groundRocks.count; i++) {
            groundRocks.getMatrixAt(i, m);
            m.elements[14] += speed;          // poke Z translation directly
            if (m.elements[14] > 15) m.elements[14] -= 120;
            groundRocks.setMatrixAt(i, m);
        }
        groundRocks.instanceMatrix.needsUpdate = true;
    }
}
