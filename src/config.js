export const CONFIG = {
    GRID: {
        X_POSITIONS: 3,
        Y_POSITIONS: 3,
        SPACING: 2.5,
        SPAWN_Z: -100,
        DESPAWN_Z: 5,
        COLLISION_THRESHOLD: 1.5
    },
    CAMERA: {
        FOV: 70,
        POSITION: { x: 0, y: 7, z: 8 },
        LOOKAT: { x: 0, y: -1, z: -8 }
    },
    GAME: {
        BASE_SPEED: 0.2,
        BASE_SPAWN_INTERVAL: 1000,
        SPEED_INCREASE: 1.08,
        SPAWN_DECREASE: 0.95,
        DIFFICULTY_INTERVAL: 10000,
        MAX_OBSTACLES: 20
    },
    PLAYER: {
        MOVE_SPEED: 0.2,
        SCALE: 2.0
    },
    BULLETS: {
        SPEED: 2.5,
        FIRE_RATE: 300,
        DESPAWN_Z: -120,
        HIT_RADIUS: 2.5,
        SIZE: 0.45
    },
    ENEMY_DODGE: {
        SWITCH_Z: -50,    // Z threshold to trigger mid-flight dodge (midpoint of -100→0)
        SWITCH_SPEED: 0.05, // lerp rate per frame (~20 frames ≈ 0.33s at 60fps)
        MIN_SPEED: 0.25,  // game speed required before any enemy dodges
        MAX_CHANCE: 0.65, // cap on dodge probability at high difficulty
    }
};
