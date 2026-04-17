import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createBullet(scene, bullets, player) {
    const geometry = new THREE.SphereGeometry(CONFIG.BULLETS.SIZE, 6, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(geometry, material);

    bullet.position.set(
        player.position.x,
        player.position.y,
        player.position.z - 1.5
    );

    scene.add(bullet);
    bullets.push(bullet);
}

export function checkAutoShoot(scene, bullets, player, shootMode, lastShootTime) {
    if (shootMode !== 'auto') return lastShootTime;
    const now = Date.now();
    if (now - lastShootTime >= CONFIG.BULLETS.FIRE_RATE) {
        createBullet(scene, bullets, player);
        return now;
    }
    return lastShootTime;
}

export function manualShoot(scene, bullets, player, gameState, shootMode, lastShootTime) {
    if (gameState.state !== 'PLAYING' || shootMode !== 'manual') return lastShootTime;
    const now = Date.now();
    if (now - lastShootTime >= CONFIG.BULLETS.FIRE_RATE) {
        createBullet(scene, bullets, player);
        return now;
    }
    return lastShootTime;
}

export function updateBullets(bullets, obstacles, scene, onEnemyDestroyed) {
    const speed = CONFIG.BULLETS.SPEED;
    const hitRadius = CONFIG.BULLETS.HIT_RADIUS;

    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const bullet = bullets[bi];
        bullet.position.z -= speed;

        if (bullet.position.z < CONFIG.BULLETS.DESPAWN_Z) {
            scene.remove(bullet);
            bullet.geometry.dispose();
            bullets.splice(bi, 1);
            continue;
        }

        let hit = false;
        for (let oi = obstacles.length - 1; oi >= 0; oi--) {
            const obs = obstacles[oi];
            const dx = bullet.position.x - obs.position.x;
            const dy = bullet.position.y - obs.position.y;
            const dz = bullet.position.z - obs.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < hitRadius) {
                hit = true;

                if (!obs.userData.bulletProof) {
                    obs.userData.health--;
                    if (obs.userData.health <= 0) {
                        scene.remove(obs);
                        obstacles.splice(oi, 1);
                        onEnemyDestroyed();
                    }
                }
                break;
            }
        }

        if (hit) {
            scene.remove(bullet);
            bullet.geometry.dispose();
            bullets.splice(bi, 1);
        }
    }
}
