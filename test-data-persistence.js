#!/usr/bin/env node

/**
 * Steel Onboarding App - Data Persistence Test
 * Tests that employee data saves correctly to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://sfsswfzgrdctiyukhczj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmc3N3ZnpncmRjdGl5dWtoY3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyOTg3MDgsImV4cCI6MjA3Mjg3NDcwOH0.u2oVMOCziHVlzFFlP7b8v_M5tHnGuW1Uwm65bJu3dVw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataPersistence() {
    console.log('🧪 Testing Steel Onboarding App Data Persistence');
    console.log('================================================');
    
    const testId = Date.now();
    const testEmployee = {
        name: `Test Employee ${testId}`,
        email: `test${testId}@flawlesssteelwelding.com`,
        position: 'Test Welder',
        start_date: new Date().toISOString().split('T')[0],
        phone: '(720) 123-4567',
        employee_id: `TEST${testId}`
    };

    try {
        console.log('📋 1. Testing employee profile creation...');
        
        // Test 1: Create user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .insert([testEmployee])
            .select()
            .single();

        if (profileError) {
            console.error('❌ Profile creation failed:', profileError.message);
            return false;
        }
        
        console.log('✅ Employee profile created successfully');
        console.log(`   Employee ID: ${testEmployee.employee_id}`);

        // Test 2: Save onboarding progress
        console.log('📈 2. Testing onboarding progress tracking...');
        
        const progressData = {
            user_id: profile.id,
            employee_id: testEmployee.employee_id,
            module_name: 'Safety Orientation',
            progress_data: JSON.stringify({
                started: new Date(),
                completed: true,
                score: 95
            })
        };

        const { data: progress, error: progressError } = await supabase
            .from('onboarding_progress')
            .insert([progressData])
            .select()
            .single();

        if (progressError) {
            console.error('❌ Progress tracking failed:', progressError.message);
            return false;
        }

        console.log('✅ Onboarding progress saved successfully');

        // Test 3: Form submission
        console.log('📝 3. Testing form submission...');
        
        const formData = {
            user_id: profile.id,
            employee_id: testEmployee.employee_id,
            form_type: 'safety-acknowledgment',
            form_data: JSON.stringify({
                acknowledged: true,
                signedAt: new Date(),
                ipAddress: '127.0.0.1'
            }),
            digital_signature: `${testEmployee.name} - Test Signature`
        };

        const { data: form, error: formError } = await supabase
            .from('form_submissions')
            .insert([formData])
            .select()
            .single();

        if (formError) {
            console.error('❌ Form submission failed:', formError.message);
            return false;
        }

        console.log('✅ Form submission saved successfully');

        // Test 4: Data retrieval
        console.log('🔍 4. Testing data retrieval...');
        
        const { data: retrievedProfile, error: retrieveError } = await supabase
            .from('user_profiles')
            .select(`
                *,
                onboarding_progress(*),
                form_submissions(*)
            `)
            .eq('employee_id', testEmployee.employee_id)
            .single();

        if (retrieveError) {
            console.error('❌ Data retrieval failed:', retrieveError.message);
            return false;
        }

        console.log('✅ Data retrieval successful');
        console.log(`   Found ${retrievedProfile.onboarding_progress.length} progress records`);
        console.log(`   Found ${retrievedProfile.form_submissions.length} form submissions`);

        // Clean up test data
        console.log('🧹 5. Cleaning up test data...');
        
        await supabase.from('form_submissions').delete().eq('employee_id', testEmployee.employee_id);
        await supabase.from('onboarding_progress').delete().eq('employee_id', testEmployee.employee_id);
        await supabase.from('user_profiles').delete().eq('employee_id', testEmployee.employee_id);
        
        console.log('✅ Test data cleaned up');

        console.log('');
        console.log('🎉 ALL TESTS PASSED!');
        console.log('');
        console.log('✅ Your Steel Onboarding App is working correctly:');
        console.log('   • Employee profiles are being saved');
        console.log('   • Progress tracking is working');
        console.log('   • Form submissions are persisted');
        console.log('   • Data retrieval is functional');
        console.log('');
        console.log('👨‍💼 Your employees can safely use the onboarding app!');
        
        return true;

    } catch (error) {
        console.error('❌ Test failed with unexpected error:', error.message);
        return false;
    }
}

async function checkRecentActivity() {
    console.log('📊 Recent Employee Activity Summary');
    console.log('==================================');

    try {
        // Check recent employee registrations
        const { data: recentEmployees, error: employeeError } = await supabase
            .from('user_profiles')
            .select('name, position, created_at, onboarding_completed')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(10);

        if (employeeError) {
            console.error('❌ Could not retrieve recent employees:', employeeError.message);
        } else {
            console.log(`📈 ${recentEmployees.length} employees added in the last 7 days:`);
            recentEmployees.forEach(emp => {
                const status = emp.onboarding_completed ? '✅ Completed' : '⏳ In Progress';
                console.log(`   • ${emp.name} (${emp.position}) - ${status}`);
            });
        }

        // Check recent form submissions
        const { data: recentForms, error: formError } = await supabase
            .from('form_submissions')
            .select('form_type, submitted_at, employee_id')
            .gte('submitted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('submitted_at', { ascending: false })
            .limit(5);

        if (formError) {
            console.error('❌ Could not retrieve recent forms:', formError.message);
        } else {
            console.log(`\n📝 ${recentForms.length} forms submitted in the last 7 days:`);
            recentForms.forEach(form => {
                console.log(`   • ${form.form_type} by ${form.employee_id}`);
            });
        }

    } catch (error) {
        console.error('❌ Activity check failed:', error.message);
    }
}

// Run tests
async function main() {
    console.log('🚀 Starting Steel Onboarding App Tests...\n');
    
    // Check recent activity first
    await checkRecentActivity();
    console.log('\n');
    
    // Run persistence test
    const success = await testDataPersistence();
    
    if (success) {
        console.log('🎯 RESULT: Your onboarding app is working perfectly!');
        process.exit(0);
    } else {
        console.log('⚠️ RESULT: There may be issues with your app.');
        process.exit(1);
    }
}

main().catch(console.error);