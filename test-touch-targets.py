#!/usr/bin/env python3

"""
Touch Target Verification Test
Tests touch target sizes across mobile viewports (320px-768px)
WCAG 2.5.5 Level AAA: Minimum 44x44px
Google Material Design: Minimum 48x48px recommended for mobile
"""

import re
import json
from datetime import datetime
from pathlib import Path

# WCAG 2.5.5 Level AAA minimum
WCAG_MIN_SIZE = 44
# Google Material Design recommendation
GOOGLE_MIN_SIZE = 48
# Recommended spacing between touch targets
MIN_SPACING = 8

# Test viewports
VIEWPORTS = [
    {'name': 'iPhone SE', 'width': 320, 'minSize': GOOGLE_MIN_SIZE},
    {'name': 'Mobile Portrait', 'width': 480, 'minSize': GOOGLE_MIN_SIZE},
    {'name': 'Tablet Portrait', 'width': 768, 'minSize': WCAG_MIN_SIZE}
]

# Interactive elements that should have proper touch targets
TOUCH_TARGETS = [
    {'selector': '#audio-controls button', 'name': 'Audio Control Buttons', 'context': 'all'},
    {'selector': '.volume-slider input[type="range"]', 'name': 'Volume Sliders', 'context': 'all'},
    {'selector': '.difficulty-btn', 'name': 'Difficulty Buttons', 'context': 'all'},
    {'selector': '#start-button', 'name': 'Start Button', 'context': 'all'},
    {'selector': '#help-button', 'name': 'Help Button', 'context': 'all'},
    {'selector': '#pause-button', 'name': 'Pause Button', 'context': 'all'},
    {'selector': '#help-close', 'name': 'Help Close Button', 'context': 'all'},
    {'selector': '#pause-overlay button', 'name': 'Pause Overlay Buttons', 'context': 'all'},
    {'selector': '#resume-button', 'name': 'Resume Button', 'context': 'all'},
    {'selector': '#restart-button', 'name': 'Restart Button', 'context': 'all'}
]

class TouchTargetAnalyzer:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'viewports': {},
            'summary': {
                'totalTests': 0,
                'passed': 0,
                'failed': 0,
                'warnings': 0
            }
        }
        self.css_rules = {}

    def parse_css(self, html_content):
        """Extract and parse CSS rules from HTML"""
        style_match = re.search(r'<style>(.*?)</style>', html_content, re.DOTALL)
        if not style_match:
            return {}

        css_content = style_match.group(1)

        # Parse media queries separately
        media_queries = {}
        media_pattern = r'@media\s*\([^)]+\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'

        for match in re.finditer(media_pattern, css_content, re.DOTALL):
            media_query = match.group(0)
            media_content = match.group(1)

            # Extract max-width from media query
            max_width_match = re.search(r'max-width:\s*(\d+)px', media_query)
            if max_width_match:
                max_width = int(max_width_match.group(1))
                media_queries[max_width] = self.parse_rules(media_content)

        # Parse base rules (outside media queries)
        base_css = re.sub(media_pattern, '', css_content, flags=re.DOTALL)
        base_rules = self.parse_rules(base_css)

        return {'base': base_rules, 'media': media_queries}

    def parse_rules(self, css_content):
        """Parse CSS rules"""
        rules = {}
        rule_pattern = r'([^{]+)\{([^}]+)\}'

        for match in re.finditer(rule_pattern, css_content):
            selector = match.group(1).strip()
            declarations = match.group(2).strip()

            properties = {}
            for decl in declarations.split(';'):
                if ':' in decl:
                    prop, value = decl.split(':', 1)
                    properties[prop.strip()] = value.strip()

            rules[selector] = properties

        return rules

    def get_effective_style(self, selector, viewport):
        """Get effective style for a selector at a given viewport"""
        style = {
            'min-width': None,
            'min-height': None,
            'width': None,
            'height': None,
            'padding': [0, 0, 0, 0]  # top, right, bottom, left
        }

        # Apply base styles
        base_rules = self.css_rules.get('base', {})
        if selector in base_rules:
            self.apply_styles(style, base_rules[selector])

        # Apply media query styles (in order of specificity)
        media_queries = self.css_rules.get('media', {})
        for max_width in sorted(media_queries.keys(), reverse=True):
            if viewport['width'] <= max_width:
                media_rules = media_queries[max_width]
                if selector in media_rules:
                    self.apply_styles(style, media_rules[selector])

        return style

    def apply_styles(self, style, properties):
        """Apply CSS properties to style dict"""
        if 'min-width' in properties:
            style['min-width'] = self.parse_size(properties['min-width'])
        if 'min-height' in properties:
            style['min-height'] = self.parse_size(properties['min-height'])
        if 'width' in properties:
            style['width'] = self.parse_size(properties['width'])
        if 'height' in properties:
            style['height'] = self.parse_size(properties['height'])
        if 'padding' in properties:
            padding = self.parse_padding(properties['padding'])
            if padding:
                style['padding'] = padding

    def parse_size(self, value):
        """Parse a CSS size value (px only)"""
        if not value:
            return None
        match = re.search(r'(\d+)px', value)
        return int(match.group(1)) if match else None

    def parse_padding(self, value):
        """Parse CSS padding value"""
        if not value:
            return None

        parts = []
        for part in value.split():
            size = self.parse_size(part)
            if size is not None:
                parts.append(size)

        if len(parts) == 1:
            return [parts[0], parts[0], parts[0], parts[0]]
        elif len(parts) == 2:
            return [parts[0], parts[1], parts[0], parts[1]]
        elif len(parts) == 4:
            return parts

        return [0, 0, 0, 0]

    def calculate_touch_target(self, style):
        """Calculate effective touch target size including padding"""
        width = style['min-width'] or style['width'] or 0
        height = style['min-height'] or style['height'] or 0

        # Add padding to dimensions
        padding = style['padding']
        width += padding[1] + padding[3]  # right + left
        height += padding[0] + padding[2]  # top + bottom

        return {'width': width, 'height': height}

    def analyze_target(self, target, viewport):
        """Analyze a single touch target"""
        test = {
            'selector': target['selector'],
            'name': target['name'],
            'viewport': viewport['name'],
            'expected': viewport['minSize'],
            'actual': {'width': 0, 'height': 0},
            'status': 'unknown',
            'issues': []
        }

        # Get computed styles for this selector
        style = self.get_effective_style(target['selector'], viewport)
        touch_target = self.calculate_touch_target(style)

        test['actual'] = touch_target

        # Check if meets minimum requirements
        meets_width = touch_target['width'] >= viewport['minSize']
        meets_height = touch_target['height'] >= viewport['minSize']

        if meets_width and meets_height:
            test['status'] = 'pass'
            self.results['summary']['passed'] += 1
        else:
            test['status'] = 'fail'
            self.results['summary']['failed'] += 1

            if not meets_width:
                test['issues'].append(
                    f"Width {touch_target['width']}px is less than minimum {viewport['minSize']}px"
                )
            if not meets_height:
                test['issues'].append(
                    f"Height {touch_target['height']}px is less than minimum {viewport['minSize']}px"
                )

        # Additional warnings
        if touch_target['width'] < GOOGLE_MIN_SIZE or touch_target['height'] < GOOGLE_MIN_SIZE:
            if touch_target['width'] >= WCAG_MIN_SIZE and touch_target['height'] >= WCAG_MIN_SIZE:
                test['issues'].append(
                    "Below Google's recommended 48x48px for mobile (but meets WCAG 44x44px)"
                )
                self.results['summary']['warnings'] += 1

        self.results['summary']['totalTests'] += 1
        return test

    def analyze(self, html_path):
        """Analyze touch targets in HTML file"""
        print('🔍 Touch Target Verification Test')
        print('=================================\n')

        with open(html_path, 'r') as f:
            html_content = f.read()

        self.css_rules = self.parse_css(html_content)

        # Test each viewport
        for viewport in VIEWPORTS:
            print(f"📱 Testing {viewport['name']} ({viewport['width']}px)")
            print(f"   Minimum requirement: {viewport['minSize']}x{viewport['minSize']}px\n")

            self.results['viewports'][viewport['name']] = {
                'width': viewport['width'],
                'minSize': viewport['minSize'],
                'tests': []
            }

            for target in TOUCH_TARGETS:
                result = self.analyze_target(target, viewport)
                self.results['viewports'][viewport['name']]['tests'].append(result)

                icon = '✅' if result['status'] == 'pass' else '❌'
                print(f"   {icon} {result['name']} ({result['selector']})")
                print(f"      Size: {result['actual']['width']}x{result['actual']['height']}px")

                if result['issues']:
                    for issue in result['issues']:
                        print(f"      ⚠️  {issue}")
                print()

        return self.results

    def generate_report(self):
        """Generate summary report"""
        summary = self.results['summary']
        total_tests = summary['totalTests']
        passed = summary['passed']
        failed = summary['failed']
        warnings = summary['warnings']
        pass_rate = (passed / total_tests * 100) if total_tests > 0 else 0

        print('\n📊 Test Summary')
        print('================')
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"Pass Rate: {pass_rate:.1f}%\n")

        if failed == 0:
            print('🎉 All touch targets meet accessibility requirements!')
        else:
            print('⚠️  Some touch targets need adjustment to meet requirements.')

        return self.results

    def save_report(self, output_path):
        """Save detailed report to JSON file"""
        with open(output_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Detailed report saved to: {output_path}")


def main():
    analyzer = TouchTargetAnalyzer()
    html_path = Path(__file__).parent / 'index.html'
    output_path = Path(__file__).parent / 'touch-target-test-results.json'

    try:
        analyzer.analyze(html_path)
        analyzer.generate_report()
        analyzer.save_report(output_path)

        # Exit with appropriate code
        exit(0 if analyzer.results['summary']['failed'] == 0 else 1)
    except Exception as error:
        print(f'❌ Test failed with error: {error}')
        import traceback
        traceback.print_exc()
        exit(1)


if __name__ == '__main__':
    main()
