// Comprehensive test suite for Flawless Steel Welding Onboarding App
// Run this in the browser console to test all functionality

const TestSuite = {
    results: [],
    passed: 0,
    failed: 0,

    // Test runner
    async runAllTests() {
        console.log('🧪 Starting Flawless Steel Welding Onboarding App Tests...\n');
        
        // Clear previous state for clean testing
        localStorage.clear();
        
        // Run all test categories
        await this.testInitialState();
        await this.testTabNavigation();
        await this.testProgressTracking();
        await this.testFormSubmission();
        await this.testSafetyModules();
        await this.testDocumentDownloads();
        await this.testChecklist();
        await this.testStateManagement();
        await this.testCompanyStory();
        await this.testResponsiveDesign();
        
        // Print results
        this.printResults();
    },

    // Helper method to log test results
    test(name, condition) {
        if (condition) {
            this.passed++;
            this.results.push(`✅ ${name}`);
            console.log(`✅ ${name}`);
        } else {
            this.failed++;
            this.results.push(`❌ ${name}`);
            console.error(`❌ ${name}`);
        }
    },

    // Test initial application state
    async testInitialState() {
        console.log('\n📋 Testing Initial State...');
        
        this.test('App state object exists', typeof appState !== 'undefined');
        this.test('Initial tab is welcome', appState.currentTab === 'welcome');
        this.test('Initial progress is 0', appState.progress === 0);
        this.test('Completed modules array exists', Array.isArray(appState.completedModules));
        this.test('Employee data object exists', typeof appState.employeeData === 'object');
    },

    // Test tab navigation
    async testTabNavigation() {
        console.log('\n🗂️ Testing Tab Navigation...');
        
        const tabs = ['welcome', 'founder-story', 'safety', 'documents', 'orientation', 'forms', 'checklist', 'completion'];
        
        for (const tab of tabs) {
            const tabButton = document.querySelector(`[data-tab="${tab}"]`);
            const tabContent = document.getElementById(`${tab}-tab`);
            
            this.test(`Tab button exists: ${tab}`, tabButton !== null);
            this.test(`Tab content exists: ${tab}`, tabContent !== null);
            
            if (tabButton) {
                tabButton.click();
                await this.wait(100);
                this.test(`Tab switches to: ${tab}`, appState.currentTab === tab);
            }
        }
    },

    // Test progress tracking
    async testProgressTracking() {
        console.log('\n📊 Testing Progress Tracking...');
        
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        this.test('Progress bar element exists', progressBar !== null);
        this.test('Progress text element exists', progressText !== null);
        
        // Test progress calculation
        updateProgress();
        this.test('Progress updates correctly', typeof appState.progress === 'number');
    },

    // Test form submission
    async testFormSubmission() {
        console.log('\n📝 Testing Form Submission...');
        
        const form = document.getElementById('employeeForm');
        this.test('Employee form exists', form !== null);
        
        if (form) {
            // Fill out form fields
            const fields = {
                'name': 'Test Employee',
                'email': 'test@flawlesssteel.com',
                'phone': '720-555-0123',
                'position': 'Welder',
                'department': 'Fabrication',
                'supervisor': 'John Smith',
                'startDate': '2025-01-15'
            };
            
            for (const [name, value] of Object.entries(fields)) {
                const input = form.querySelector(`[name="${name}"]`);
                if (input) {
                    input.value = value;
                    this.test(`Form field ${name} accepts input`, input.value === value);
                }
            }
            
            // Test form validation
            this.test('Form has submit handler', form.onsubmit !== null);
        }
    },

    // Test safety modules
    async testSafetyModules() {
        console.log('\n⚠️ Testing Safety Modules...');
        
        const modules = document.querySelectorAll('.safety-module');
        this.test('Safety modules exist', modules.length > 0);
        
        const completeButtons = document.querySelectorAll('.safety-module .btn-success');
        this.test('Module complete buttons exist', completeButtons.length > 0);
        
        if (completeButtons.length > 0) {
            const firstButton = completeButtons[0];
            const moduleName = firstButton.getAttribute('data-module');
            
            firstButton.click();
            await this.wait(100);
            
            this.test('Module marked as complete', appState.completedModules.includes(moduleName));
            this.test('Complete button disabled after completion', firstButton.disabled === true);
        }
    },

    // Test document downloads
    async testDocumentDownloads() {
        console.log('\n📄 Testing Document Downloads...');
        
        const downloadLinks = document.querySelectorAll('.document-card .btn-primary');
        this.test('Document download links exist', downloadLinks.length > 0);
        
        for (const link of downloadLinks) {
            const href = link.getAttribute('href');
            this.test(`Download link has href: ${href}`, href !== null && href !== '');
            this.test('Download link opens in new tab', link.getAttribute('target') === '_blank');
        }
    },

    // Test checklist
    async testChecklist() {
        console.log('\n✅ Testing Checklist...');
        
        const checklistItems = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        this.test('Checklist items exist', checklistItems.length > 0);
        
        if (checklistItems.length > 0) {
            const firstItem = checklistItems[0];
            const itemId = firstItem.id;
            
            firstItem.checked = true;
            firstItem.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            this.test('Checklist item state saved', appState.checklistItems[itemId] === true);
        }
    },

    // Test state management
    async testStateManagement() {
        console.log('\n💾 Testing State Management...');
        
        // Save current state
        saveState();
        
        // Check localStorage
        const savedState = localStorage.getItem('onboardingAppState');
        this.test('State saved to localStorage', savedState !== null);
        
        if (savedState) {
            const parsed = JSON.parse(savedState);
            this.test('Saved state is valid JSON', parsed !== null);
            this.test('Saved state contains currentTab', parsed.currentTab !== undefined);
            this.test('Saved state contains progress', parsed.progress !== undefined);
        }
        
        // Test state restoration
        loadState();
        this.test('State loads without errors', true);
    },

    // Test company story components
    async testCompanyStory() {
        console.log('\n🏢 Testing Company Story Components...');
        
        // Switch to founder story tab
        const founderTab = document.querySelector('[data-tab="founder-story"]');
        if (founderTab) {
            founderTab.click();
            await this.wait(100);
        }
        
        // Test timeline section
        const timeline = document.querySelector('.timeline-section');
        this.test('Timeline section exists', timeline !== null);
        
        const timelineItems = document.querySelectorAll('.timeline-item');
        this.test('Timeline has items', timelineItems.length > 0);
        
        // Test differentiators section
        const differentiators = document.querySelector('.differentiators-section');
        this.test('Differentiators section exists', differentiators !== null);
        
        const diffCards = document.querySelectorAll('.differentiator-card');
        this.test('Differentiator cards exist', diffCards.length > 0);
        
        // Test brand philosophy section
        const brandPhilosophy = document.querySelector('.brand-philosophy');
        this.test('Brand philosophy section exists', brandPhilosophy !== null);
        
        const founderQuote = document.querySelector('.founder-quote');
        this.test('Founder quote exists', founderQuote !== null);
    },

    // Test responsive design
    async testResponsiveDesign() {
        console.log('\n📱 Testing Responsive Design...');
        
        // Check for viewport meta tag
        const viewport = document.querySelector('meta[name="viewport"]');
        this.test('Viewport meta tag exists', viewport !== null);
        
        // Check for responsive classes
        const responsiveElements = document.querySelectorAll('[class*="col-"], [class*="mobile"], [class*="desktop"]');
        this.test('Responsive CSS classes in use', responsiveElements.length > 0);
        
        // Check media queries in styles
        const styles = document.styleSheets;
        let hasMediaQueries = false;
        for (const sheet of styles) {
            try {
                if (sheet.cssRules) {
                    for (const rule of sheet.cssRules) {
                        if (rule.type === CSSRule.MEDIA_RULE) {
                            hasMediaQueries = true;
                            break;
                        }
                    }
                }
            } catch (e) {
                // Cross-origin stylesheets will throw
            }
        }
        this.test('CSS contains media queries', hasMediaQueries);
    },

    // Helper method to wait
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Print final results
    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(50));
        
        if (this.failed > 0) {
            console.log('\n⚠️ Failed Tests:');
            this.results.filter(r => r.startsWith('❌')).forEach(r => console.log(r));
        }
        
        console.log('\n🎯 Test suite complete!');
        
        // Return summary object
        return {
            passed: this.passed,
            failed: this.failed,
            total: this.passed + this.failed,
            successRate: ((this.passed / (this.passed + this.failed)) * 100).toFixed(1) + '%'
        };
    }
};

// Run tests automatically
console.log('🚀 Flawless Steel Welding Onboarding App Test Suite Loaded');
console.log('Run TestSuite.runAllTests() to execute all tests');
console.log('Or open http://localhost:8000 and paste this script in the console');

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestSuite;
}