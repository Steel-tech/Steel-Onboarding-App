// Vercel serverless function for module progress tracking
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// JWT authentication middleware
function authenticateToken(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
        throw new Error('Access token required');
    }
    
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        return user;
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Authenticate user
        const user = authenticateToken(req);
        
        const { moduleName, progressData } = req.body;
        
        if (!moduleName) {
            return res.status(400).json({ error: 'Module name required' });
        }
        
        const client = await pool.connect();
        
        try {
            // Get employee data
            const employee = await client.query(
                'SELECT employee_id, name, position FROM employee_data WHERE user_id = $1',
                [user.id]
            );
            
            if (employee.rows.length === 0) {
                return res.status(404).json({ error: 'Employee data not found' });
            }
            
            const employeeData = employee.rows[0];
            
            // Record module completion
            await client.query(
                `INSERT INTO onboarding_progress 
                 (user_id, employee_id, module_name, progress_data) 
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, module_name) DO UPDATE SET
                    progress_data = EXCLUDED.progress_data,
                    completed_at = CURRENT_TIMESTAMP`,
                [user.id, employeeData.employee_id, moduleName, JSON.stringify(progressData || {})]
            );
            
            // Log activity
            await client.query(
                'INSERT INTO audit_logs (user_id, employee_id, action, details, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
                [user.id, employeeData.employee_id, 'MODULE_COMPLETED', JSON.stringify({ moduleName })]
            );
            
            res.status(200).json({ success: true });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Module progress error:', error);
        
        if (error.message === 'Access token required' || error.message === 'Invalid or expired token') {
            return res.status(401).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to save module progress' });
    }
}