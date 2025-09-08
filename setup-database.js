// Database Setup and Initialization Script
// Run this after npm install to set up the production database

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'onboarding.db');
const BCRYPT_ROUNDS = 12;

async function setupDatabase() {
    console.log('🔧 Setting up Steel Onboarding Database...');
    
    // Remove existing database if it exists
    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
        console.log('🗑️  Removed existing database');
    }
    
    const db = new sqlite3.Database(DB_PATH);
    
    const tables = `
        -- Users table for authentication
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'employee',
            name TEXT NOT NULL,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1
        );
        
        -- Employee data table
        CREATE TABLE employee_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_id TEXT UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            position TEXT NOT NULL,
            start_date DATE NOT NULL,
            supervisor TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        
        -- Onboarding progress tracking
        CREATE TABLE onboarding_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_id TEXT NOT NULL,
            module_name TEXT NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            progress_data TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, module_name)
        );
        
        -- Form submissions with digital signatures
        CREATE TABLE form_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_id TEXT NOT NULL,
            form_type TEXT NOT NULL,
            form_data TEXT NOT NULL,
            digital_signature TEXT,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, form_type)
        );
        
        -- Audit logging for security and compliance
        CREATE TABLE audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            employee_id TEXT,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        
        -- HR notifications tracking
        CREATE TABLE hr_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_id TEXT NOT NULL,
            notification_type TEXT NOT NULL,
            message TEXT NOT NULL,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            email_sent BOOLEAN DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        
        -- Indexes for performance
        CREATE INDEX idx_employee_data_user_id ON employee_data(user_id);
        CREATE INDEX idx_onboarding_progress_user_id ON onboarding_progress(user_id);
        CREATE INDEX idx_form_submissions_user_id ON form_submissions(user_id);
        CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
    `;
    
    return new Promise(async (resolve, reject) => {
        db.exec(tables, async (err) => {
            if (err) {
                console.error('❌ Database creation failed:', err);
                reject(err);
                return;
            }
            
            console.log('✅ Database tables created successfully');
            
            try {
                // Create default users
                const adminPassword = await bcrypt.hash('admin2025!', BCRYPT_ROUNDS);
                const employeePassword = await bcrypt.hash('fsw2025!', BCRYPT_ROUNDS);
                const hrPassword = await bcrypt.hash('hr2025!', BCRYPT_ROUNDS);
                
                const insertUsers = `
                    INSERT INTO users (username, password_hash, role, name, email) VALUES
                    ('admin', ?, 'admin', 'System Administrator', 'admin@fsw-denver.com'),
                    ('hr', ?, 'hr', 'HR Administrator', 'hr@fsw-denver.com'),
                    ('employee', ?, 'employee', 'New Employee', 'employee@fsw-denver.com');
                `;
                
                db.run(insertUsers, [adminPassword, hrPassword, employeePassword], function(err) {
                    if (err) {
                        console.error('❌ Failed to create default users:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log('✅ Default users created:');
                    console.log('   👤 admin / admin2025! (Administrator)');
                    console.log('   👤 hr / hr2025! (HR Administrator)'); 
                    console.log('   👤 employee / fsw2025! (Employee)');
                    
                    // Insert sample audit log
                    db.run(
                        'INSERT INTO audit_logs (action, details, created_at) VALUES (?, ?, ?)',
                        ['DATABASE_INITIALIZED', JSON.stringify({setupBy: 'system'}), new Date().toISOString()],
                        function(err) {
                            if (err) {
                                console.warn('⚠️  Failed to create initial audit log:', err);
                            }
                            
                            db.close((err) => {
                                if (err) {
                                    console.error('❌ Error closing database:', err);
                                    reject(err);
                                } else {
                                    console.log('✅ Database setup completed successfully!');
                                    console.log(`📁 Database location: ${DB_PATH}`);
                                    resolve();
                                }
                            });
                        }
                    );
                });
                
            } catch (error) {
                console.error('❌ Error creating default users:', error);
                reject(error);
            }
        });
    });
}

// Environment setup
function createEnvironmentFile() {
    const envContent = `# Steel Onboarding Application Environment Configuration
# Copy this to .env and update with your production values

# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_PATH=./onboarding.db

# Security Configuration
JWT_SECRET=${require('crypto').randomBytes(64).toString('hex')}
BCRYPT_ROUNDS=12

# Email Configuration (Update with your SMTP settings)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@fsw-denver.com
EMAIL_PASS=your-app-password

# Notification Recipients
HR_EMAIL=hr@fsw-denver.com
ADMIN_EMAIL=admin@fsw-denver.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3001

# Session Configuration
SESSION_TIMEOUT=1800000
`;

    if (!fs.existsSync('.env')) {
        fs.writeFileSync('.env.example', envContent);
        console.log('✅ Environment example file created: .env.example');
        console.log('📝 Copy .env.example to .env and update with your settings');
    } else {
        console.log('✅ Environment file already exists');
    }
}

async function main() {
    try {
        console.log('🚀 Steel Onboarding Database Setup\n');
        
        await setupDatabase();
        createEnvironmentFile();
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Copy .env.example to .env and configure your settings');
        console.log('2. Run: npm start');
        console.log('3. Open: http://localhost:3001');
        console.log('\n🔐 Default login credentials:');
        console.log('   HR Admin: hr / hr2025!');
        console.log('   Employee: employee / fsw2025!');
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run setup if called directly
if (require.main === module) {
    main();
}

module.exports = { setupDatabase, createEnvironmentFile };