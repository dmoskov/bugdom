/**
 * Test script for level balance and difficulty progression
 * Analyzes difficulty curve and identifies potential balance issues
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

const DIFFICULTY_PRESETS = {
    easy: {
        playerSpeedMultiplier: 1.1,
        enemySpeedMultiplier: 0.7,
        enemyCountMultiplier: 0.7,
        spawnRateMultiplier: 1.5
    },
    medium: {
        playerSpeedMultiplier: 1.0,
        enemySpeedMultiplier: 1.0,
        enemyCountMultiplier: 1.0,
        spawnRateMultiplier: 1.0
    },
    hard: {
        playerSpeedMultiplier: 0.9,
        enemySpeedMultiplier: 1.3,
        enemyCountMultiplier: 1.3,
        spawnRateMultiplier: 0.7
    }
};

// Calculate difficulty score for a level
function calculateDifficultyScore(level, preset) {
    const baseSettings = BASE_DIFFICULTY_SETTINGS[level];
    const presetSettings = DIFFICULTY_PRESETS[preset];

    const enemySpeed = baseSettings.enemySpeed * presetSettings.enemySpeedMultiplier;
    const maxEnemies = Math.ceil(baseSettings.maxEnemies * presetSettings.enemyCountMultiplier);
    const spawnRate = baseSettings.spawnRate > 0 ? baseSettings.spawnRate * presetSettings.spawnRateMultiplier : 0;
    const playerSpeed = 0.15 * presetSettings.playerSpeedMultiplier;

    // Difficulty score combines multiple factors
    const speedRatio = enemySpeed / playerSpeed;
    const spawnFrequency = spawnRate > 0 ? (1000000 / spawnRate) : 0; // Higher = more frequent
    const beeCount = level >= 3 ? (level - 1) : 0; // Bees start at level 3

    // Weighted difficulty score
    const score = (speedRatio * 30) + (maxEnemies * 5) + (spawnFrequency * 2) + (beeCount * 3);

    return {
        level,
        score,
        speedRatio,
        maxEnemies,
        spawnRate,
        beeCount,
        details: {
            enemySpeed: enemySpeed.toFixed(3),
            playerSpeed: playerSpeed.toFixed(3),
            spawnFrequency: spawnFrequency.toFixed(2)
        }
    };
}

console.log('=== Level Balance Analysis ===\n');

// Test each difficulty preset
['easy', 'medium', 'hard'].forEach(preset => {
    console.log(`\n${preset.toUpperCase()} DIFFICULTY:`);
    console.log('─'.repeat(80));

    const scores = [];
    for (let level = 1; level <= MAX_LEVEL; level++) {
        scores.push(calculateDifficultyScore(level, preset));
    }

    // Display level progression
    console.log('Level | Score  | Speed Ratio | Max Enemies | Spawn Rate | Bees');
    console.log('─'.repeat(80));
    scores.forEach(s => {
        const spawnRateDisplay = s.spawnRate > 0 ? `${s.spawnRate}ms` : 'OFF';
        console.log(
            `  ${s.level.toString().padStart(2)} ` +
            `| ${s.score.toFixed(1).padStart(6)} ` +
            `| ${s.speedRatio.toFixed(2).padStart(11)} ` +
            `| ${s.maxEnemies.toString().padStart(11)} ` +
            `| ${spawnRateDisplay.padStart(10)} ` +
            `| ${s.beeCount.toString().padStart(4)}`
        );
    });

    // Analyze difficulty curve
    console.log('\nDifficulty Curve Analysis:');
    for (let i = 1; i < scores.length; i++) {
        const increase = scores[i].score - scores[i - 1].score;
        const percentIncrease = ((increase / scores[i - 1].score) * 100).toFixed(1);

        if (increase < 0) {
            console.log(`  ⚠️  Level ${i} → ${i + 1}: DECREASE in difficulty (${increase.toFixed(1)} points)`);
        } else if (percentIncrease > 50) {
            console.log(`  ⚠️  Level ${i} → ${i + 1}: Large spike (${percentIncrease}% increase)`);
        } else if (percentIncrease < 5 && i < MAX_LEVEL - 1) {
            console.log(`  ⚠️  Level ${i} → ${i + 1}: Very small increase (${percentIncrease}%)`);
        }
    }

    // Calculate average increase
    const totalIncrease = scores[scores.length - 1].score - scores[0].score;
    const avgIncrease = totalIncrease / (scores.length - 1);
    console.log(`\n  Average difficulty increase per level: ${avgIncrease.toFixed(2)} points`);
    console.log(`  Total difficulty range: ${scores[0].score.toFixed(1)} → ${scores[scores.length - 1].score.toFixed(1)}`);

    // Check for balance issues
    const issues = [];

    // Check if early levels are too hard
    if (scores[0].score > 30 && preset === 'medium') {
        issues.push('Level 1 may be too hard for new players (medium difficulty)');
    }

    // Check if late levels are too easy
    if (scores[scores.length - 1].score < 100 && preset === 'hard') {
        issues.push('Level 10 may not be challenging enough (hard difficulty)');
    }

    // Check for difficulty spikes
    for (let i = 1; i < scores.length; i++) {
        const increase = scores[i].score - scores[i - 1].score;
        const percentIncrease = (increase / scores[i - 1].score) * 100;
        if (percentIncrease > 60) {
            issues.push(`Large difficulty spike at level ${i + 1} (${percentIncrease.toFixed(1)}% increase)`);
        }
    }

    if (issues.length > 0) {
        console.log('\n  Potential Balance Issues:');
        issues.forEach(issue => console.log(`    • ${issue}`));
    } else {
        console.log('\n  ✓ Difficulty curve appears well-balanced');
    }
});

// Test special mechanics
console.log('\n\n=== Special Mechanics Testing ===\n');

console.log('Bee Spawning Logic:');
console.log('  Levels 1-2: No bees');
console.log('  Level 3+: Up to (currentLevel - 1) bees');
for (let level = 1; level <= MAX_LEVEL; level++) {
    const maxBees = level >= 3 ? level - 1 : 0;
    console.log(`    Level ${level}: Max ${maxBees} bee${maxBees !== 1 ? 's' : ''}`);
}

console.log('\nClovers Required per Level:');
for (let level = 1; level <= MAX_LEVEL; level++) {
    const cloversNeeded = (level - 1) * CLOVERS_PER_LEVEL;
    const nextLevelAt = level * CLOVERS_PER_LEVEL;
    if (level < MAX_LEVEL) {
        console.log(`  Level ${level}: Need ${cloversNeeded} clovers to reach, advances to Level ${level + 1} at ${nextLevelAt} clovers`);
    } else {
        console.log(`  Level ${level}: Need ${cloversNeeded} clovers to reach (MAX LEVEL)`);
    }
}

console.log('\n=== Balance Test Complete ===\n');
