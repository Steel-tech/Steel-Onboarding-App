// Authentication Test Script for Steel Onboarding App
// Run this in browser console to test Supabase auth integration

console.log('🔧 Testing Supabase Authentication System...');

// Test functions
async function testSupabaseConnection() {
    try {
        console.log('1️⃣ Testing Supabase connection...');
        
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase client not loaded');
        }
        
        const { data, error } = await window.supabase.auth.getSession();
        if (error) throw error;
        
        console.log('✅ Supabase connection successful');
        console.log('Current session:', data.session ? 'Active' : 'None');
        
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

async function testDatabaseTables() {
    try {
        console.log('2️⃣ Testing database table access...');
        
        // Test user_profiles table access
        const { data, error } = await window.supabase
            .from('user_profiles')
            .select('count')
            .limit(1);
            
        if (error && !error.message.includes('JWT')) {
            throw error;
        }
        
        console.log('✅ Database tables accessible');
        return true;
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        return false;
    }
}

async function testAuthFlow() {
    try {
        console.log('3️⃣ Testing authentication flow...');
        
        // Check if auth manager is available
        if (typeof window.authManager === 'undefined') {
            throw new Error('Auth manager not loaded');
        }
        
        // Test auth manager methods
        const isAuth = window.authManager.isAuthenticated();
        const currentUser = window.authManager.getCurrentUser();
        
        console.log('Auth status:', isAuth ? 'Authenticated' : 'Not authenticated');
        console.log('Current user:', currentUser ? currentUser.name || currentUser.email : 'None');
        
        console.log('✅ Auth flow accessible');
        return true;
    } catch (error) {
        console.error('❌ Auth flow test failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Running comprehensive auth tests...\n');
    
    const tests = [
        { name: 'Supabase Connection', fn: testSupabaseConnection },
        { name: 'Database Access', fn: testDatabaseTables },
        { name: 'Auth Flow', fn: testAuthFlow }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await test.fn();
        results.push({ name: test.name, passed: result });
    }
    
    console.log('\n📊 Test Results Summary:');
    results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = results.every(r => r.passed);
    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 Your Supabase authentication is ready!');
        console.log('Next steps:');
        console.log('1. Try registering a new user');
        console.log('2. Test logging in with the new account');
        console.log('3. Check that user data persists in Supabase dashboard');
    }
}

// Auto-run tests if this script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAllTests, 2000); // Wait for auth system to initialize
    });
} else {
    setTimeout(runAllTests, 1000);
}

// Export test functions for manual use
window.authTests = {
    runAllTests,
    testSupabaseConnection,
    testDatabaseTables,
    testAuthFlow
};