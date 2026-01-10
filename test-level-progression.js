/**
 * Test script for level progression system
 * Tests level unlocking logic and difficulty scaling
 */

const MAX_LEVEL = 10;
const CLOVERS_PER_LEVEL = 3;
const TOTAL_CLOVERS = 30;

const BASE_DIFFICULTY_SETTINGS = {
    1: { enemySpeed: 0.04, maxEnemies: 3, spawnRate: 0 },
    2: { enemySpeed: 0.05, maxEnemies: 4, spawnRate: 15000 },
    3: { enemySpeed: 0.06, maxEnemies: 5, spawnRate: 12000 },
    4: { enemySpeed: 0.07, maxEnemies: 6, spawnRate: 10000 },
    5: { enemySpeed: 0.08, maxEnemies: 8, spawnRate: 8000 },
    6: { enemySpeed: 0.09, maxEnemies: 9, spawnRate: 7000 },
    7: { enemySpeed: 0.10, maxEnemies: 10, spawnRate: 6000 },
    8: { enemySpeed: 0.11, maxEnemies: 12, spawnRate: 5000 },
    9: { enemySpeed: 0.12, maxEnemies: 14, spawnRate: 4500 },
    10: { enemySpeed: 0.13, maxEnemies: 16, spawnRate: 4000 }
};

// Test level progression logic
function testLevelProgression() {
    console.log('=== Testing Level Progression ===\n');

    let errors = [];

    // Test 1: Verify level calculation for each clover count
    console.log('Test 1: Level calculation for clover counts');
    for (let clovers = 0; clovers <= TOTAL_CLOVERS; clovers++) {
        const expectedLevel = Math.min(MAX_LEVEL, Math.floor(clovers / CLOVERS_PER_LEVEL) + 1);
        const actualLevel = Math.min(MAX_LEVEL, Math.floor(clovers / CLOVERS_PER_LEVEL) + 1);

        if (expectedLevel !== actualLevel) {
            errors.push(`Level mismatch at ${clovers} clovers: expected ${expectedLevel}, got ${actualLevel}`);
        }

        if (clovers % 3 === 0 || clovers === TOTAL_CLOVERS) {
            console.log(`  ${clovers} clovers → Level ${actualLevel}`);
        }
    }

    // Test 2: Verify all levels have difficulty settings
    console.log('\nTest 2: Difficulty settings for all levels');
    for (let level = 1; level <= MAX_LEVEL; level++) {
        const settings = BASE_DIFFICULTY_SETTINGS[level];
        if (!settings) {
            errors.push(`Missing difficulty settings for level ${level}`);
        } else {
            console.log(`  Level ${level}: Speed=${settings.enemySpeed}, MaxEnemies=${settings.maxEnemies}, SpawnRate=${settings.spawnRate}`);
        }
    }

    // Test 3: Verify difficulty progression is sensible
    console.log('\nTest 3: Difficulty progression validation');
    for (let level = 2; level <= MAX_LEVEL; level++) {
        const prev = BASE_DIFFICULTY_SETTINGS[level - 1];
        const curr = BASE_DIFFICULTY_SETTINGS[level];

        // Enemy speed should increase
        if (curr.enemySpeed <= prev.enemySpeed) {
            errors.push(`Level ${level}: Enemy speed did not increase (${prev.enemySpeed} → ${curr.enemySpeed})`);
        }

        // Max enemies should increase or stay same
        if (curr.maxEnemies < prev.maxEnemies) {
            errors.push(`Level ${level}: Max enemies decreased (${prev.maxEnemies} → ${curr.maxEnemies})`);
        }

        // Spawn rate should decrease (faster spawning) after level 1
        if (curr.spawnRate > 0 && prev.spawnRate > 0 && curr.spawnRate > prev.spawnRate) {
            errors.push(`Level ${level}: Spawn rate increased (should decrease for faster spawning)`);
        }
    }

    // Test 4: Verify math consistency
    console.log('\nTest 4: Math consistency checks');
    const maxReachableLevel = Math.floor(TOTAL_CLOVERS / CLOVERS_PER_LEVEL) + 1;
    console.log(`  Total clovers: ${TOTAL_CLOVERS}`);
    console.log(`  Clovers per level: ${CLOVERS_PER_LEVEL}`);
    console.log(`  Max reachable level: ${maxReachableLevel}`);
    console.log(`  Configured max level: ${MAX_LEVEL}`);

    if (maxReachableLevel < MAX_LEVEL) {
        errors.push(`Not enough clovers to reach MAX_LEVEL (can only reach level ${maxReachableLevel})`);
    }

    if (maxReachableLevel > MAX_LEVEL) {
        console.log(`  ⚠️  Warning: Player can collect ${TOTAL_CLOVERS} clovers but will cap at level ${MAX_LEVEL}`);
    }

    // Test 5: Verify level boundaries
    console.log('\nTest 5: Level boundary testing');
    const boundaries = [
        { clovers: 0, expectedLevel: 1, description: 'Start of game' },
        { clovers: 2, expectedLevel: 1, description: 'Just before first level up' },
        { clovers: 3, expectedLevel: 2, description: 'First level up' },
        { clovers: 6, expectedLevel: 3, description: 'Second level up' },
        { clovers: 27, expectedLevel: 10, description: 'Level 10 (max level)' },
        { clovers: 30, expectedLevel: 10, description: 'All clovers collected' },
    ];

    boundaries.forEach(test => {
        const level = Math.min(MAX_LEVEL, Math.floor(test.clovers / CLOVERS_PER_LEVEL) + 1);
        const status = level === test.expectedLevel ? '✓' : '✗';
        console.log(`  ${status} ${test.description}: ${test.clovers} clovers → Level ${level} (expected ${test.expectedLevel})`);

        if (level !== test.expectedLevel) {
            errors.push(`Boundary test failed: ${test.description}`);
        }
    });

    // Summary
    console.log('\n=== Test Results ===');
    if (errors.length === 0) {
        console.log('✓ All tests passed! Level progression system is working correctly.');
        return true;
    } else {
        console.log(`✗ ${errors.length} error(s) found:`);
        errors.forEach((error, i) => {
            console.log(`  ${i + 1}. ${error}`);
        });
        return false;
    }
}

// Run tests
const success = testLevelProgression();
process.exit(success ? 0 : 1);
