#!/usr/bin/env node

// Steel Onboarding App - Feature Testing Script
// Tests the deployed application APIs and features

const https = require('https');
const crypto = require('crypto');

const BASE_URL = 'https://steel-onboarding-app.vercel.app';

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = BASE_URL + path;
        const parsedUrl = new URL(url);
        
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Steel-Onboarding-Test/1.0',
                ...options.headers
            }
        };

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (err) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data,
                        raw: true
                    });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Test functions
async function testHealthCheck() {
    console.log('🔍 Testing Health Check...');
    try {
        const response = await makeRequest('/api/health');
        
        if (response.status === 200) {
            console.log('✅ Health check passed');
            console.log(`   Status: ${response.data.status}`);
            console.log(`   Uptime: ${Math.round(response.data.uptime)}s`);
            return true;
        } else {
            console.log(`❌ Health check failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Health check error: ${error.message}`);
        return false;
    }
}

async function testAdminLogin() {
    console.log('🔐 Testing Admin Login...');
    try {
        const response = await makeRequest('/api/auth/login', {
            method: 'POST',
            body: {
                username: 'admin',
                password: 'admin2025!'
            }
        });

        if (response.status === 200 && response.data.success) {
            console.log('✅ Admin login successful');
            console.log(`   Token: ${response.data.token ? 'Generated' : 'Missing'}`);
            console.log(`   User: ${response.data.user.name} (${response.data.user.role})`);
            return response.data.token;
        } else {
            console.log(`❌ Admin login failed: ${response.status}`);
            console.log(`   Error: ${response.data.error || 'Unknown'}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Admin login error: ${error.message}`);
        return null;
    }
}

async function testEmployeeDataSave(token) {
    console.log('👤 Testing Employee Data Save...');
    try {
        const testEmployee = {
            name: 'John Test Worker',
            email: 'john.test@flawlesssteelwelding.com',
            phone: '555-0123',
            position: 'Welder I',
            start_date: '2025-09-08',
            supervisor: 'Mike Johnson'
        };

        const response = await makeRequest('/api/employee/data', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: testEmployee
        });

        if (response.status === 200 && response.data.success) {
            console.log('✅ Employee data saved successfully');
            console.log(`   Employee ID: ${response.data.employeeId}`);
            return response.data.employeeId;
        } else {
            console.log(`❌ Employee data save failed: ${response.status}`);
            console.log(`   Error: ${response.data.error || 'Unknown'}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Employee data save error: ${error.message}`);
        return null;
    }
}

async function testModuleProgress(token) {
    console.log('📚 Testing Module Progress...');
    try {
        const progressData = {
            moduleName: 'Safety Training',
            progressData: {
                completedSections: ['introduction', 'ppe-requirements', 'hazards'],
                score: 95,
                timeSpent: 1800
            }
        };

        const response = await makeRequest('/api/progress/module', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: progressData
        });

        if (response.status === 200 && response.data.success) {
            console.log('✅ Module progress saved successfully');
            return true;
        } else {
            console.log(`❌ Module progress failed: ${response.status}`);
            console.log(`   Error: ${response.data.error || 'Unknown'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Module progress error: ${error.message}`);
        return false;
    }
}

async function testFormSubmission(token) {
    console.log('📋 Testing Form Submission...');
    try {
        const formData = {
            formType: 'emergency-contact',
            formData: {
                emergencyContactName: 'Jane Test',
                emergencyContactPhone: '555-0456',
                relationship: 'Spouse',
                address: '123 Test St, Test City, TS 12345'
            },
            digitalSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        };

        const response = await makeRequest('/api/forms/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.status === 200 && response.data.success) {
            console.log('✅ Form submission successful');
            return true;
        } else {
            console.log(`❌ Form submission failed: ${response.status}`);
            console.log(`   Error: ${response.data.error || 'Unknown'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Form submission error: ${error.message}`);
        return false;
    }
}

async function testHRDashboard(token) {
    console.log('📊 Testing HR Dashboard...');
    try {
        const response = await makeRequest('/api/hr/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            console.log('✅ HR Dashboard accessible');
            console.log(`   Total Employees: ${response.data.stats.totalEmployees}`);
            console.log(`   Completed Onboarding: ${response.data.stats.completedOnboarding}`);
            console.log(`   Completion Rate: ${response.data.stats.completionRate}%`);
            return true;
        } else {
            console.log(`❌ HR Dashboard failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ HR Dashboard error: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🧪 Steel Onboarding App - Feature Test Suite');
    console.log(`🌐 Testing: ${BASE_URL}`);
    console.log('=' .repeat(60) + '\n');

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Test 1: Health Check
    results.total++;
    if (await testHealthCheck()) results.passed++;
    else results.failed++;
    console.log('');

    // Test 2: Admin Login
    results.total++;
    const token = await testAdminLogin();
    if (token) results.passed++;
    else results.failed++;
    console.log('');

    if (!token) {
        console.log('❌ Cannot continue without authentication token');
        console.log('\n📊 Test Results:');
        console.log(`   Total: ${results.total}`);
        console.log(`   ✅ Passed: ${results.passed}`);
        console.log(`   ❌ Failed: ${results.failed}`);
        return;
    }

    // Test 3: Employee Data
    results.total++;
    const employeeId = await testEmployeeDataSave(token);
    if (employeeId) results.passed++;
    else results.failed++;
    console.log('');

    // Test 4: Module Progress
    results.total++;
    if (await testModuleProgress(token)) results.passed++;
    else results.failed++;
    console.log('');

    // Test 5: Form Submission
    results.total++;
    if (await testFormSubmission(token)) results.passed++;
    else results.failed++;
    console.log('');

    // Test 6: HR Dashboard
    results.total++;
    if (await testHRDashboard(token)) results.passed++;
    else results.failed++;
    console.log('');

    // Summary
    console.log('=' .repeat(60));
    console.log('📊 Test Results:');
    console.log(`   Total Tests: ${results.total}`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
    
    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! Your Steel Onboarding App is fully functional!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});
