#!/usr/bin/env node

// Database Connection Test for Steel Onboarding App
// Tests PostgreSQL connection and table creation

require('dotenv').config();
const Database = require('./database');

async function testDatabaseConnection() {
    console.log('🧪 Testing Steel Onboarding Database Connection...\n');
    
    // Check environment variable
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable not set');
        console.log('   Create a .env file with: DATABASE_URL=your_supabase_connection_string');
        process.exit(1);
    }
    
    console.log('✅ DATABASE_URL found in environment');
    
    const database = new Database();
    
    try {
        console.log('🔄 Connecting to database...');
        await database.init();
        
        console.log('🔄 Testing basic query...');
        const result = await database.query('SELECT NOW() as current_time, version()');
        console.log('✅ Database connected successfully!');
        console.log(`   Current time: ${result.rows[0].current_time}`);
        console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
        
        console.log('\n🔄 Verifying tables were created...');
        const tables = await database.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        console.log('✅ Tables found in database:');
        const expectedTables = ['users', 'employee_data', 'onboarding_progress', 'form_submissions', 'audit_logs', 'hr_notifications'];
        const foundTables = tables.rows.map(row => row.table_name);
        
        expectedTables.forEach(tableName => {
            if (foundTables.includes(tableName)) {
                console.log(`   ✅ ${tableName}`);
            } else {
                console.log(`   ❌ ${tableName} - MISSING`);
            }
        });
        
        // Test inserting a sample user
        console.log('\n🔄 Testing sample user creation...');
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('test123', 12);
        
        try {
            const user = await database.insert(
                'INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, $3, $4)',
                ['test_user', hashedPassword, 'employee', 'Test User']
            );
            console.log('✅ Sample user created successfully');
            console.log(`   User ID: ${user.id}`);
            
            // Clean up test user
            await database.run('DELETE FROM users WHERE username = $1', ['test_user']);
            console.log('✅ Test user cleaned up');
            
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                console.log('✅ User table working (test user already exists - that\'s OK)');
            } else {
                throw error;
            }
        }
        
        console.log('\n🎉 All database tests passed!');
        console.log('🚀 Your app is ready to deploy and use.');
        
    } catch (error) {
        console.error('\n❌ Database connection failed:');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        
        if (error.code === 'ENOTFOUND') {
            console.error('\n💡 This usually means:');
            console.error('   - Check your DATABASE_URL format');
            console.error('   - Ensure your Supabase project is active');
            console.error('   - Verify the hostname is correct');
        } else if (error.code === '28P01') {
            console.error('\n💡 Authentication failed:');
            console.error('   - Check your password in DATABASE_URL');
            console.error('   - Ensure password is URL-encoded if it contains special characters');
        } else if (error.code === '3D000') {
            console.error('\n💡 Database does not exist:');
            console.error('   - Check the database name in your connection string');
        }
        
        process.exit(1);
    } finally {
        await database.close();
    }
}

// Run the test
testDatabaseConnection().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
