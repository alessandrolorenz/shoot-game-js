import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function spawnDestroyEffect(scene, position) {
    const count = 6;
    const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true });
    const particles = [];

    for (let i = 0; i < count; i++) {
        const p = new THREE.Mesh(geo, mat.clone());
        p.position.copy(position);
        p.userData.vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        p.userData.life = 1.0;
        scene.add(p);
        particles.push(p);
    }

    function tick() {
        let alive = false;
        for (const p of particles) {
            if (p.userData.life <= 0) continue;
            p.position.add(p.userData.vel);
            p.userData.life -= 0.06;
            p.material.opacity = Math.max(0, p.userData.life);
            if (p.userData.life > 0) alive = true;
            else scene.remove(p);
        }
        if (alive) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

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
                        spawnDestroyEffect(scene, obs.position.clone());
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
