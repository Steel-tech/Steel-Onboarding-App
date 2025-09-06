#!/usr/bin/env node

/**
 * Configuration Validation Script for Steel Onboarding Application
 * 
 * This script validates that all critical configuration files are properly
 * set up and working for production deployment.
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🔍 Steel Onboarding Configuration Validation');
console.log('=' .repeat(50));

async function validateConfigurations() {
    const results = [];
    
    // 1. Check .env.example exists and has required variables
    try {
        const envExample = await fs.readFile('.env.example', 'utf8');
        const requiredVars = [
            'PORT', 'NODE_ENV', 'JWT_SECRET', 'DB_PATH', 'EMAIL_HOST', 
            'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'HR_EMAIL', 
            'ADMIN_EMAIL', 'FRONTEND_URL', 'SESSION_TIMEOUT', 'BCRYPT_ROUNDS'
        ];
        
        const missingVars = requiredVars.filter(varName => 
            !envExample.includes(`${varName}=`)
        );
        
        if (missingVars.length === 0) {
            results.push({ check: '.env.example', status: '✅', message: 'All required variables present' });
        } else {
            results.push({ check: '.env.example', status: '❌', message: `Missing: ${missingVars.join(', ')}` });
        }
    } catch (error) {
        results.push({ check: '.env.example', status: '❌', message: 'File not found' });
    }
    
    // 2. Check backup-database.js exists and is executable
    try {
        const backupScript = await fs.readFile('backup-database.js', 'utf8');
        if (backupScript.includes('DatabaseBackup') && backupScript.includes('backup.step')) {
            results.push({ check: 'backup-database.js', status: '✅', message: 'Backup script properly implemented' });
        } else {
            results.push({ check: 'backup-database.js', status: '⚠️', message: 'Script exists but may be incomplete' });
        }
    } catch (error) {
        results.push({ check: 'backup-database.js', status: '❌', message: 'File not found' });
    }
    
    // 3. Check health-check.js exists and is executable
    try {
        const healthScript = await fs.readFile('health-check.js', 'utf8');
        if (healthScript.includes('HealthChecker') && healthScript.includes('runAllChecks')) {
            results.push({ check: 'health-check.js', status: '✅', message: 'Health check script properly implemented' });
        } else {
            results.push({ check: 'health-check.js', status: '⚠️', message: 'Script exists but may be incomplete' });
        }
    } catch (error) {
        results.push({ check: 'health-check.js', status: '❌', message: 'File not found' });
    }
    
    // 4. Check package.json has backup script
    try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        if (packageJson.scripts && packageJson.scripts.backup) {
            results.push({ check: 'package.json backup', status: '✅', message: 'Backup script registered' });
        } else {
            results.push({ check: 'package.json backup', status: '❌', message: 'Backup script not found in package.json' });
        }
    } catch (error) {
        results.push({ check: 'package.json backup', status: '❌', message: 'Cannot read package.json' });
    }
    
    // 5. Check if PRODUCTION-DEPLOYMENT.md references the files
    try {
        const deploymentDoc = await fs.readFile('PRODUCTION-DEPLOYMENT.md', 'utf8');
        const hasEnvExample = deploymentDoc.includes('.env.example');
        const hasBackupRef = deploymentDoc.includes('backup');
        
        if (hasEnvExample && hasBackupRef) {
            results.push({ check: 'PRODUCTION-DEPLOYMENT.md', status: '✅', message: 'References configuration files' });
        } else {
            results.push({ check: 'PRODUCTION-DEPLOYMENT.md', status: '⚠️', message: 'May need updates for new files' });
        }
    } catch (error) {
        results.push({ check: 'PRODUCTION-DEPLOYMENT.md', status: '⚠️', message: 'Cannot verify references' });
    }
    
    // Display results
    console.log('\n📋 Configuration Validation Results:');
    console.log('-'.repeat(40));
    
    let passed = 0;
    let warnings = 0;
    let failed = 0;
    
    results.forEach(result => {
        console.log(`${result.status} ${result.check}: ${result.message}`);
        if (result.status === '✅') passed++;
        else if (result.status === '⚠️') warnings++;
        else failed++;
    });
    
    console.log('\n📊 Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    
    // Final assessment
    console.log('\n🎯 Production Readiness Assessment:');
    if (failed === 0 && warnings === 0) {
        console.log('🟢 READY: All configuration files are properly set up!');
        console.log('\n📝 Next Steps:');
        console.log('1. Copy .env.example to .env and configure for your environment');
        console.log('2. Test backup with: npm run backup');
        console.log('3. Test health check with: node health-check.js --quick');
        console.log('4. Deploy according to PRODUCTION-DEPLOYMENT.md');
        return 0;
    } else if (failed === 0) {
        console.log('🟡 MOSTLY READY: Minor issues found, but deployable');
        console.log('⚠️  Please review warnings above');
        return 1;
    } else {
        console.log('🔴 NOT READY: Critical configuration files missing or broken');
        console.log('❌ Please fix failed checks above');
        return 2;
    }
}

// Execute validation
validateConfigurations().then(exitCode => {
    process.exit(exitCode);
}).catch(error => {
    console.error('❌ Validation script error:', error.message);
    process.exit(3);
});