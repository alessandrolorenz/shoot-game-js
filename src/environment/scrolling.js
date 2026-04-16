import * as THREE from 'three';

export function setupScrollingEnvironment(scene) {
    const groundTiles = [];
    const roadStripes = [];

    const tileMat = new THREE.MeshStandardMaterial({ color: 0x0d0d1f, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
        const tile = new THREE.Mesh(new THREE.PlaneGeometry(18, 40), tileMat);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(0, -3, 10 - i * 40);
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
        stripe.position.set(0, -2.98, -i * 12);
        scene.add(stripe);
        roadStripes.push(stripe);
    }

    return { groundTiles, roadStripes };
}

export function setupSideBuildings(scene, models) {
    const sideBuildings = [];
    const count = 16;
    const hasModels = models.envModels.length > 0;

    for (let i = 0; i < count; i++) {
        for (const side of [-1, 1]) {
            let obj;

            if (hasModels) {
                const template = models.envModels[
                    Math.floor(Math.random() * models.envModels.length)
                ];
                obj = template.clone();
                const s = 5.5 + Math.random();
                obj.scale.setScalar(s);
                if (side === 1) obj.rotation.y = Math.PI;
                obj.position.set(
                    side * (8.5 + Math.random() * 2.5),
                    -3,
                    -i * 9 - Math.random() * 7
                );
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
                obj.position.set(
                    side * (8.5 + Math.random() * 2.5),
                    -3 + h / 2,
                    -i * 9 - Math.random() * 7
                );

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

export function updateScrollingEnvironment(groundTiles, roadStripes, sideBuildings, speed) {
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
        if (building.position.z > 15) building.position.z -= 150;
    }
}
