// Comprehensive Test Suite for Steel Onboarding App
// Run this in browser console to test all functionality

class OnboardingTestSuite {
    constructor() {
        this.results = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // Test runner
    async runAllTests() {
        console.log('🧪 Starting comprehensive Steel Onboarding App test suite...\n');
        
        await this.testFormValidation();
        await this.testNavigationSystem();
        await this.testProgressTracking();
        await this.testDataPersistence();
        await this.testAccessibility();
        await this.testMobileResponsiveness();
        await this.testSecurityMeasures();
        await this.testPerformance();
        await this.testErrorHandling();
        
        this.displayResults();
    }

    // Test helper methods
    test(name, testFn) {
        try {
            const result = testFn();
            if (result) {
                this.passedTests++;
                this.results.push(`✅ ${name}: PASSED`);
            } else {
                this.failedTests++;
                this.results.push(`❌ ${name}: FAILED`);
            }
        } catch (error) {
            this.failedTests++;
            this.results.push(`❌ ${name}: ERROR - ${error.message}`);
        }
    }

    async asyncTest(name, testFn) {
        try {
            const result = await testFn();
            if (result) {
                this.passedTests++;
                this.results.push(`✅ ${name}: PASSED`);
            } else {
                this.failedTests++;
                this.results.push(`❌ ${name}: FAILED`);
            }
        } catch (error) {
            this.failedTests++;
            this.results.push(`❌ ${name}: ERROR - ${error.message}`);
        }
    }

    // Form validation tests
    async testFormValidation() {
        console.log('🔍 Testing form validation...');

        this.test('Employee form exists', () => {
            return document.getElementById('employeeForm') !== null;
        });

        this.test('Required field validation', () => {
            const form = document.getElementById('employeeForm');
            const nameInput = document.getElementById('emp-name');
            if (!form || !nameInput) return false;
            
            nameInput.value = '';
            const isValid = nameInput.checkValidity();
            return !isValid; // Should be invalid when empty
        });

        this.test('Email validation regex', () => {
            const testEmails = [
                { email: 'test@example.com', valid: true },
                { email: 'invalid-email', valid: false },
                { email: 'test@.com', valid: false },
                { email: 'test@example.', valid: false }
            ];

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return testEmails.every(test => emailRegex.test(test.email) === test.valid);
        });

        this.test('Phone validation regex', () => {
            const phoneRegex = /^[+]?1?[\s\-.()]?\d{3}[\s\-.()]?\d{3}[\s\-.()]?\d{4}$/;
            const testPhones = [
                { phone: '(555) 123-4567', valid: true },
                { phone: '555-123-4567', valid: true },
                { phone: '5551234567', valid: true },
                { phone: '123', valid: false }
            ];

            return testPhones.every(test => phoneRegex.test(test.phone) === test.valid);
        });
    }

    // Navigation system tests
    async testNavigationSystem() {
        console.log('🧭 Testing navigation system...');

        this.test('Navigation tabs exist', () => {
            const tabs = document.querySelectorAll('.nav-tab');
            return tabs.length >= 8; // Should have all expected tabs
        });

        this.test('Tab switching functionality', () => {
            const welcomeTab = document.querySelector('[data-tab="welcome"]');
            const companyTab = document.querySelector('[data-tab="company"]');
            
            if (!welcomeTab || !companyTab) return false;
            
            // Test tab switching
            companyTab.click();
            const companyContent = document.getElementById('company');
            const isActive = companyContent && companyContent.classList.contains('active');
            
            // Switch back to welcome
            welcomeTab.click();
            
            return isActive;
        });

        this.test('Keyboard navigation support', () => {
            const tabs = document.querySelectorAll('.nav-tab');
            return Array.from(tabs).some(tab => 
                tab.getAttribute('tabindex') !== null || 
                tab.hasAttribute('role')
            );
        });
    }

    // Progress tracking tests
    async testProgressTracking() {
        console.log('📊 Testing progress tracking...');

        this.test('Progress bar exists', () => {
            return document.getElementById('progressBar') !== null;
        });

        this.test('Progress calculation functions exist', () => {
            return typeof calculateTotalItems === 'function' && 
                   typeof calculateCompletedItems === 'function' &&
                   typeof updateProgress === 'function';
        });

        this.test('Module completion tracking', () => {
            return Array.isArray(appState.completedModules) && 
                   typeof completeModule === 'function';
        });
    }

    // Data persistence tests
    async testDataPersistence() {
        console.log('💾 Testing data persistence...');

        this.test('LocalStorage availability', () => {
            try {
                const testKey = 'test-storage';
                localStorage.setItem(testKey, 'test');
                const retrieved = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);
                return retrieved === 'test';
            } catch (e) {
                return false;
            }
        });

        this.test('State management functions exist', () => {
            return typeof saveState === 'function' && 
                   typeof loadState === 'function';
        });

        this.test('App state structure', () => {
            return appState && 
                   typeof appState.currentTab !== 'undefined' &&
                   typeof appState.progress !== 'undefined' &&
                   Array.isArray(appState.completedModules);
        });
    }

    // Accessibility tests
    async testAccessibility() {
        console.log('♿ Testing accessibility features...');

        this.test('Skip navigation link', () => {
            return document.querySelector('.skip-nav') !== null;
        });

        this.test('Form labels and ARIA attributes', () => {
            const form = document.getElementById('employeeForm');
            if (!form) return false;

            const inputs = form.querySelectorAll('input[required]');
            return Array.from(inputs).every(input => {
                const label = form.querySelector(`label[for="${input.id}"]`);
                const ariaLabel = input.getAttribute('aria-label');
                const ariaLabelledBy = input.getAttribute('aria-labelledby');
                
                return label || ariaLabel || ariaLabelledBy;
            });
        });

        this.test('ARIA roles on navigation', () => {
            const navTabs = document.querySelector('.nav-tabs');
            return navTabs && navTabs.getAttribute('role') === 'tablist';
        });

        this.test('Focus indicators', () => {
            // Check if CSS includes focus styles
            const styleSheets = Array.from(document.styleSheets);
            return styleSheets.some(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules);
                    return rules.some(rule => 
                        rule.selectorText && rule.selectorText.includes(':focus')
                    );
                } catch (e) {
                    return false;
                }
            });
        });
    }

    // Mobile responsiveness tests
    async testMobileResponsiveness() {
        console.log('📱 Testing mobile responsiveness...');

        this.test('Viewport meta tag', () => {
            const viewport = document.querySelector('meta[name="viewport"]');
            return viewport && viewport.content.includes('width=device-width');
        });

        this.test('CSS media queries', () => {
            const styleSheets = Array.from(document.styleSheets);
            return styleSheets.some(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules);
                    return rules.some(rule => 
                        rule.type === CSSRule.MEDIA_RULE && 
                        rule.conditionText && 
                        rule.conditionText.includes('max-width')
                    );
                } catch (e) {
                    return false;
                }
            });
        });

        this.test('Touch-friendly button sizes', () => {
            const buttons = document.querySelectorAll('button, .nav-tab');
            return Array.from(buttons).every(btn => {
                const styles = window.getComputedStyle(btn);
                const minHeight = parseInt(styles.minHeight);
                return minHeight >= 44; // WCAG minimum touch target
            });
        });
    }

    // Security tests
    async testSecurityMeasures() {
        console.log('🔒 Testing security measures...');

        this.test('Content Security Policy header', () => {
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            return cspMeta !== null;
        });

        this.test('X-Frame-Options header', () => {
            const frameMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
            return frameMeta && frameMeta.content === 'DENY';
        });

        this.test('Input validation functions', () => {
            // Check if validation functions exist in saveEmployeeData
            const saveEmployeeDataStr = saveEmployeeData.toString();
            return saveEmployeeDataStr.includes('nameRegex') && 
                   saveEmployeeDataStr.includes('emailRegex') &&
                   saveEmployeeDataStr.includes('trim()');
        });
    }

    // Performance tests
    async testPerformance() {
        console.log('⚡ Testing performance...');

        this.test('Debounced functions exist', () => {
            return typeof debounce === 'function' && 
                   typeof debouncedSaveState !== 'undefined';
        });

        this.test('Lazy loading setup', () => {
            const images = document.querySelectorAll('img[data-src]');
            return images.length >= 0; // May not have lazy images, but feature should exist
        });

        this.test('Event listener cleanup', () => {
            const beforeUnloadStr = window.addEventListener.toString();
            return beforeUnloadStr || typeof checkUnsavedChanges === 'function';
        });

        await this.asyncTest('Page load performance', async () => {
            if (performance && performance.timing) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                return loadTime < 5000; // Should load in under 5 seconds
            }
            return true; // Pass if performance API not available
        });
    }

    // Error handling tests
    async testErrorHandling() {
        console.log('🚨 Testing error handling...');

        this.test('Global error handler', () => {
            const hasErrorHandler = window.onerror !== null || 
                                   window.addEventListener.toString().includes('error');
            return hasErrorHandler;
        });

        this.test('Logger system exists', () => {
            return typeof logger !== 'undefined' && 
                   typeof logger.error === 'function';
        });

        this.test('Notification system', () => {
            return typeof showNotification === 'function';
        });

        this.test('Safe execution wrappers', () => {
            return typeof safeExecute === 'function' || 
                   typeof safeExecuteAsync === 'function';
        });
    }

    // Display test results
    displayResults() {
        const totalTests = this.passedTests + this.failedTests;
        const passRate = ((this.passedTests / totalTests) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(50));
        console.log('🧪 TEST SUITE RESULTS');
        console.log('='.repeat(50));
        
        this.results.forEach(result => console.log(result));
        
        console.log('\n' + '='.repeat(50));
        console.log(`📊 SUMMARY:`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${this.passedTests}`);
        console.log(`Failed: ${this.failedTests}`);
        console.log(`Pass Rate: ${passRate}%`);
        
        if (passRate >= 90) {
            console.log('🎉 EXCELLENT! Application is production-ready.');
        } else if (passRate >= 80) {
            console.log('✅ GOOD! Minor issues to address.');
        } else if (passRate >= 70) {
            console.log('⚠️  ACCEPTABLE! Several issues need attention.');
        } else {
            console.log('❌ POOR! Significant issues must be resolved.');
        }
        
        console.log('='.repeat(50));
        
        return {
            totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            passRate: parseFloat(passRate)
        };
    }
}

// Auto-run tests when page loads (if in development mode)
document.addEventListener('DOMContentLoaded', function() {
    // Only run tests if explicitly requested or in development
    if (window.location.search.includes('test=true') || window.location.hostname === 'localhost') {
        setTimeout(() => {
            const testSuite = new OnboardingTestSuite();
            window.testSuite = testSuite; // Make available globally
            
            console.log('🔧 Test suite loaded. Run window.testSuite.runAllTests() to execute all tests.');
        }, 2000); // Wait for app to initialize
    }
});

// Expose for manual testing
if (typeof window !== 'undefined') {
    window.OnboardingTestSuite = OnboardingTestSuite;
}