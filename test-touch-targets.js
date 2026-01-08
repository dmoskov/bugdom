#!/usr/bin/env node

/**
 * Touch Target Verification Test
 * Tests touch target sizes across mobile viewports (320px-768px)
 * WCAG 2.5.5 Level AAA: Minimum 44x44px
 * Google Material Design: Minimum 48x48px recommended for mobile
 */

const fs = require('fs');
const path = require('path');

// WCAG 2.5.5 Level AAA minimum
const WCAG_MIN_SIZE = 44;
// Google Material Design recommendation
const GOOGLE_MIN_SIZE = 48;
// Recommended spacing between touch targets
const MIN_SPACING = 8;

// Test viewports
const VIEWPORTS = [
    { name: 'iPhone SE', width: 320, minSize: GOOGLE_MIN_SIZE },
    { name: 'Mobile Portrait', width: 480, minSize: GOOGLE_MIN_SIZE },
    { name: 'Tablet Portrait', width: 768, minSize: WCAG_MIN_SIZE }
];

// Interactive elements that should have proper touch targets
const TOUCH_TARGETS = [
    { selector: '#audio-controls button', name: 'Audio Control Buttons', context: 'all' },
    { selector: '.volume-slider input[type="range"]', name: 'Volume Sliders', context: 'all' },
    { selector: '.difficulty-btn', name: 'Difficulty Buttons', context: 'all' },
    { selector: '#start-button', name: 'Start Button', context: 'all' },
    { selector: '#help-button', name: 'Help Button', context: 'all' },
    { selector: '#pause-button', name: 'Pause Button', context: 'all' },
    { selector: '#help-close', name: 'Help Close Button', context: 'all' },
    { selector: '#pause-overlay button', name: 'Pause Overlay Buttons', context: 'all' },
    { selector: '#resume-button', name: 'Resume Button', context: 'all' },
    { selector: '#restart-button', name: 'Restart Button', context: 'all' }
];

class TouchTargetAnalyzer {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            viewports: {},
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
    }

    parseCSS(htmlContent) {
        // Extract CSS rules from HTML
        const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
        if (!styleMatch) return {};

        const cssContent = styleMatch[1];
        const rules = {};

        // Parse basic CSS rules (simplified parser)
        const ruleRegex = /([^{]+)\{([^}]+)\}/g;
        let match;

        while ((match = ruleRegex.exec(cssContent)) !== null) {
            const selector = match[1].trim();
            const declarations = match[2].trim();

            const properties = {};
            declarations.split(';').forEach(decl => {
                const [prop, value] = decl.split(':').map(s => s.trim());
                if (prop && value) {
                    properties[prop] = value;
                }
            });

            rules[selector] = properties;
        }

        return rules;
    }

    getEffectiveStyle(selector, cssRules, viewport) {
        const style = {
            minWidth: null,
            minHeight: null,
            width: null,
            height: null,
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
        };

        // Check base styles
        if (cssRules[selector]) {
            this.applyStyles(style, cssRules[selector]);
        }

        // Check media queries for mobile
        if (viewport.width <= 768) {
            const mediaQuery768 = `@media (max-width: 768px)`;
            Object.keys(cssRules).forEach(rule => {
                if (rule.includes(mediaQuery768)) {
                    const innerRules = this.parseMediaQuery(rule, cssRules);
                    if (innerRules[selector]) {
                        this.applyStyles(style, innerRules[selector]);
                    }
                }
            });
        }

        if (viewport.width <= 480) {
            const mediaQuery480 = `@media (max-width: 480px)`;
            Object.keys(cssRules).forEach(rule => {
                if (rule.includes(mediaQuery480)) {
                    const innerRules = this.parseMediaQuery(rule, cssRules);
                    if (innerRules[selector]) {
                        this.applyStyles(style, innerRules[selector]);
                    }
                }
            });
        }

        return style;
    }

    applyStyles(style, properties) {
        if (properties['min-width']) {
            style.minWidth = this.parseSize(properties['min-width']);
        }
        if (properties['min-height']) {
            style.minHeight = this.parseSize(properties['min-height']);
        }
        if (properties['width']) {
            style.width = this.parseSize(properties['width']);
        }
        if (properties['height']) {
            style.height = this.parseSize(properties['height']);
        }
        if (properties['padding']) {
            const padding = this.parsePadding(properties['padding']);
            if (padding) {
                style.padding = padding;
            }
        }
    }

    parseSize(value) {
        if (!value) return null;
        const match = value.match(/(\d+)px/);
        return match ? parseInt(match[1]) : null;
    }

    parsePadding(value) {
        if (!value) return null;
        const parts = value.split(' ').map(v => this.parseSize(v)).filter(v => v !== null);
        if (parts.length === 1) {
            return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
        } else if (parts.length === 2) {
            return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
        } else if (parts.length === 4) {
            return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
        }
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    calculateTouchTarget(style) {
        // Calculate effective touch target size including padding
        let width = style.minWidth || style.width || 0;
        let height = style.minHeight || style.height || 0;

        // Add padding to dimensions
        width += style.padding.left + style.padding.right;
        height += style.padding.top + style.padding.bottom;

        return { width, height };
    }

    analyzeTarget(target, cssRules, viewport) {
        const test = {
            selector: target.selector,
            name: target.name,
            viewport: viewport.name,
            expected: viewport.minSize,
            actual: { width: 0, height: 0 },
            status: 'unknown',
            issues: []
        };

        // Get computed styles for this selector
        const style = this.getEffectiveStyle(target.selector, cssRules, viewport);
        const touchTarget = this.calculateTouchTarget(style);

        test.actual = touchTarget;

        // Check if meets minimum requirements
        const meetsWidth = touchTarget.width >= viewport.minSize;
        const meetsHeight = touchTarget.height >= viewport.minSize;

        if (meetsWidth && meetsHeight) {
            test.status = 'pass';
            this.results.summary.passed++;
        } else {
            test.status = 'fail';
            this.results.summary.failed++;

            if (!meetsWidth) {
                test.issues.push(`Width ${touchTarget.width}px is less than minimum ${viewport.minSize}px`);
            }
            if (!meetsHeight) {
                test.issues.push(`Height ${touchTarget.height}px is less than minimum ${viewport.minSize}px`);
            }
        }

        // Additional warnings
        if (touchTarget.width < GOOGLE_MIN_SIZE || touchTarget.height < GOOGLE_MIN_SIZE) {
            test.issues.push(`Below Google's recommended 48x48px for mobile`);
            this.results.summary.warnings++;
        }

        this.results.summary.totalTests++;
        return test;
    }

    async analyze(htmlPath) {
        console.log('🔍 Touch Target Verification Test');
        console.log('=================================\n');

        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        const cssRules = this.parseCSS(htmlContent);

        // Test each viewport
        for (const viewport of VIEWPORTS) {
            console.log(`📱 Testing ${viewport.name} (${viewport.width}px)`);
            console.log(`   Minimum requirement: ${viewport.minSize}x${viewport.minSize}px\n`);

            this.results.viewports[viewport.name] = {
                width: viewport.width,
                minSize: viewport.minSize,
                tests: []
            };

            for (const target of TOUCH_TARGETS) {
                const result = this.analyzeTarget(target, cssRules, viewport);
                this.results.viewports[viewport.name].tests.push(result);

                const icon = result.status === 'pass' ? '✅' : '❌';
                console.log(`   ${icon} ${result.name} (${result.selector})`);
                console.log(`      Size: ${result.actual.width}x${result.actual.height}px`);

                if (result.issues.length > 0) {
                    result.issues.forEach(issue => {
                        console.log(`      ⚠️  ${issue}`);
                    });
                }
                console.log('');
            }
        }

        return this.results;
    }

    generateReport() {
        const { totalTests, passed, failed, warnings } = this.results.summary;
        const passRate = ((passed / totalTests) * 100).toFixed(1);

        console.log('\n📊 Test Summary');
        console.log('================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log(`Pass Rate: ${passRate}%\n`);

        if (failed === 0) {
            console.log('🎉 All touch targets meet accessibility requirements!');
        } else {
            console.log('⚠️  Some touch targets need adjustment to meet requirements.');
        }

        return this.results;
    }

    saveReport(outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Detailed report saved to: ${outputPath}`);
    }
}

// Run the analyzer
async function main() {
    const analyzer = new TouchTargetAnalyzer();
    const htmlPath = path.join(__dirname, 'index.html');
    const outputPath = path.join(__dirname, 'touch-target-test-results.json');

    try {
        await analyzer.analyze(htmlPath);
        analyzer.generateReport();
        analyzer.saveReport(outputPath);

        // Exit with appropriate code
        process.exit(analyzer.results.summary.failed === 0 ? 0 : 1);
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { TouchTargetAnalyzer, VIEWPORTS, TOUCH_TARGETS };
