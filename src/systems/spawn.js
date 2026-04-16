export function shouldSpawn(lastSpawnTime, spawnInterval) {
    return Date.now() - lastSpawnTime > spawnInterval;
}
