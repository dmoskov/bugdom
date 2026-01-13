/**
 * Test edge cases in level progression
 */

const MAX_LEVEL = 10;
const CLOVERS_PER_LEVEL = 3;

console.log('=== Testing Edge Cases ===\n');

// Test 1: Level calculation at boundaries
console.log('Test 1: Boundary clover counts');
const testCases = [
    -1,  // Invalid negative
    0,   // Start
    1,   // First clover
    2,   // About to level up
    3,   // First level up
    4,   // Just after level up
    26,  // Before level 10
    27,  // Reach level 10
    28,  // After level 10
    29,  // Near end
    30,  // Max clovers
    31,  // Beyond max
    100  // Way beyond
];

testCases.forEach(clovers => {
    const level = Math.min(MAX_LEVEL, Math.floor(clovers / CLOVERS_PER_LEVEL) + 1);
    const levelWithoutCap = Math.floor(clovers / CLOVERS_PER_LEVEL) + 1;
    const capped = levelWithoutCap > MAX_LEVEL ? ' (capped)' : '';
    console.log(`  ${clovers.toString().padStart(3)} clovers → Level ${level}${capped}`);
});

// Test 2: Check if there's integer overflow or precision issues
console.log('\nTest 2: Numeric precision');
const largeCloverCount = 999999;
const largeLevel = Math.min(MAX_LEVEL, Math.floor(largeCloverCount / CLOVERS_PER_LEVEL) + 1);
console.log(`  ${largeCloverCount} clovers → Level ${largeLevel} (should cap at ${MAX_LEVEL})`);

// Test 3: Verify difficulty settings exist for all reachable levels
console.log('\nTest 3: Difficulty settings coverage');
const BASE_DIFFICULTY_SETTINGS = {
    1: { enemySpeed: 0.04, maxEnemies: 3, spawnRate: 0 },
    2: { enemySpeed: 0.05, maxEnemies: 4, spawnRate: 15000 },
    3: { enemySpeed: 0.06, maxEnemies: 5, spawnRate: 12000 },
    4: { enemySpeed: 0.07, maxEnemies: 6, spawnRate: 10000 },
    5: { enemySpeed: 0.08, maxEnemies: 7, spawnRate: 9000 },  // Smoothed: was 8 enemies, 8000ms
    6: { enemySpeed: 0.09, maxEnemies: 9, spawnRate: 7000 },
    7: { enemySpeed: 0.10, maxEnemies: 10, spawnRate: 6000 },
    8: { enemySpeed: 0.11, maxEnemies: 11, spawnRate: 5000 }, // Reduced: was 12 enemies
    9: { enemySpeed: 0.12, maxEnemies: 13, spawnRate: 4500 }, // Reduced: was 14 enemies
    10: { enemySpeed: 0.13, maxEnemies: 15, spawnRate: 4500 } // Reduced: was 16 enemies, 4000ms
};

let allLevelsHaveSettings = true;
for (let level = 1; level <= MAX_LEVEL; level++) {
    const hasSettings = BASE_DIFFICULTY_SETTINGS[level] !== undefined;
    console.log(`  Level ${level}: ${hasSettings ? '✓ Has settings' : '✗ MISSING SETTINGS'}`);
    if (!hasSettings) allLevelsHaveSettings = false;
}

console.log(`\n  Result: ${allLevelsHaveSettings ? '✓ All levels covered' : '✗ Missing settings for some levels'}`);

// Test 4: Victory condition
console.log('\nTest 4: Victory condition');
const TOTAL_CLOVERS = 30;
const finalLevel = Math.min(MAX_LEVEL, Math.floor(TOTAL_CLOVERS / CLOVERS_PER_LEVEL) + 1);
console.log(`  Total clovers: ${TOTAL_CLOVERS}`);
console.log(`  Level when collecting last clover: ${finalLevel}`);
console.log(`  Victory triggers when cloversCollected >= ${TOTAL_CLOVERS}`);

// Test 5: Bee spawn logic
console.log('\nTest 5: Bee spawn conditions');
for (let level = 1; level <= MAX_LEVEL; level++) {
    const beesEnabled = level >= 3;
    const maxBees = beesEnabled ? Math.min(8, level - 1) : 0;
    const status = beesEnabled ? `Max ${maxBees} bees` : 'No bees';
    console.log(`  Level ${level}: ${status}`);
}

console.log('\n=== All Edge Cases Tested ===\n');
