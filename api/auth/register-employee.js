// Vercel serverless function for employee registration
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 1, // Serverless - use minimal connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, phone, position, start_date, supervisor } = req.body;
        
        // Validate required fields
        if (!name || !email || !position || !start_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate unique username and temporary password
        const username = email.toLowerCase();
        const tempPassword = 'Welcome2024!';
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        // Generate employee ID
        const employeeId = `FSW${Date.now().toString().slice(-6)}`;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Check if user already exists
            const existingUser = await client.query(
                'SELECT id FROM users WHERE username = $1',
                [username]
            );
            
            let userId;
            
            if (existingUser.rows.length > 0) {
                // User exists, use existing ID
                userId = existingUser.rows[0].id;
            } else {
                // Create new user
                const userResult = await client.query(
                    `INSERT INTO users (username, password_hash, role, name, email, created_at) 
                     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id`,
                    [username, hashedPassword, 'employee', name, email]
                );
                userId = userResult.rows[0].id;
            }
            
            // Create or update employee data
            await client.query(
                `INSERT INTO employee_data 
                 (user_id, employee_id, name, email, phone, position, start_date, supervisor, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id) DO UPDATE SET
                    employee_id = EXCLUDED.employee_id,
                    name = EXCLUDED.name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    position = EXCLUDED.position,
                    start_date = EXCLUDED.start_date,
                    supervisor = EXCLUDED.supervisor,
                    updated_at = CURRENT_TIMESTAMP`,
                [userId, employeeId, name, email, phone, position, start_date, supervisor]
            );
            
            await client.query('COMMIT');
            
            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: userId, 
                    username: username, 
                    role: 'employee',
                    name: name
                },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '8h' }
            );
            
            res.status(200).json({ 
                success: true, 
                employeeId,
                token,
                user: {
                    id: userId,
                    username: username,
                    role: 'employee',
                    name: name
                }
            });
            
        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Employee registration error:', error);
        res.status(500).json({ error: 'Failed to register employee' });
    }
}