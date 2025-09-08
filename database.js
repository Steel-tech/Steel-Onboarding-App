// PostgreSQL Database Module for Steel Onboarding Application
// Replaces SQLite with cloud-ready PostgreSQL via Supabase

const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = null;
    }
    
    async init() {
        try {
            // Check if DATABASE_URL is provided
            if (!process.env.DATABASE_URL) {
                throw new Error('DATABASE_URL environment variable is required');
            }

            console.log('🔄 Initializing PostgreSQL connection...');
            
            // Initialize PostgreSQL connection pool
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 5,  // Reduced for serverless
                min: 0,  // Allow scaling to zero
                idleTimeoutMillis: 10000,  // Shorter idle timeout for serverless
                connectionTimeoutMillis: 10000,  // Longer connection timeout
                acquireTimeoutMillis: 8000,  // Timeout for acquiring connection
                createTimeoutMillis: 8000,   // Timeout for creating connection
                reapIntervalMillis: 1000,    // How often to check for idle connections
            });

            console.log('🔄 Testing database connection...');
            // Test the connection with timeout
            const testResult = await Promise.race([
                this.pool.query('SELECT NOW() as current_time'),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Database connection timeout')), 5000)
                )
            ]);
            
            console.log('🔄 Creating database tables...');
            // Create tables
            await this.createTables();
            console.log('✅ PostgreSQL database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            console.error('❌ Stack trace:', error.stack);
            throw error;
        }
    }
    
    async createTables() {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            // Users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'employee',
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                )
            `);
            
            // Employee data table
            await client.query(`
                CREATE TABLE IF NOT EXISTS employee_data (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    employee_id VARCHAR(50) UNIQUE,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    position VARCHAR(255) NOT NULL,
                    start_date DATE NOT NULL,
                    supervisor VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Onboarding progress table
            await client.query(`
                CREATE TABLE IF NOT EXISTS onboarding_progress (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    employee_id VARCHAR(50) NOT NULL,
                    module_name VARCHAR(255) NOT NULL,
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    progress_data TEXT,
                    UNIQUE(user_id, module_name)
                )
            `);
            
            // Form submissions table
            await client.query(`
                CREATE TABLE IF NOT EXISTS form_submissions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    employee_id VARCHAR(50) NOT NULL,
                    form_type VARCHAR(255) NOT NULL,
                    form_data TEXT NOT NULL,
                    digital_signature TEXT,
                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    UNIQUE(user_id, form_type)
                )
            `);
            
            // Audit logs table
            await client.query(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    employee_id VARCHAR(50),
                    action VARCHAR(255) NOT NULL,
                    details TEXT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // HR notifications table
            await client.query(`
                CREATE TABLE IF NOT EXISTS hr_notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    employee_id VARCHAR(50) NOT NULL,
                    notification_type VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    email_sent BOOLEAN DEFAULT FALSE
                )
            `);
            
            await client.query('COMMIT');
            console.log('✅ Database tables created successfully');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    async query(text, params = []) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }
    
    async run(query, params = []) {
        const result = await this.query(query, params);
        return {
            id: result.rows[0]?.id || null,
            changes: result.rowCount
        };
    }
    
    async get(query, params = []) {
        const result = await this.query(query, params);
        return result.rows[0] || null;
    }
    
    async all(query, params = []) {
        const result = await this.query(query, params);
        return result.rows;
    }

    // Helper method for INSERT operations that return the inserted row
    async insert(query, params = []) {
        const result = await this.query(query + ' RETURNING *', params);
        return result.rows[0];
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = Database;
