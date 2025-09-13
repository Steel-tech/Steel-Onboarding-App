// Vercel serverless function for form submissions
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
        
        const { formType, formData, digitalSignature } = req.body;
        
        if (!formType || !formData) {
            return res.status(400).json({ error: 'Form type and data required' });
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
            
            // Get client IP and user agent
            const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            
            // Save form submission
            await client.query(
                `INSERT INTO form_submissions 
                 (user_id, employee_id, form_type, form_data, digital_signature, ip_address, user_agent) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (user_id, form_type) DO UPDATE SET
                    form_data = EXCLUDED.form_data,
                    digital_signature = EXCLUDED.digital_signature,
                    submitted_at = CURRENT_TIMESTAMP,
                    ip_address = EXCLUDED.ip_address,
                    user_agent = EXCLUDED.user_agent`,
                [
                    user.id, 
                    employeeData.employee_id, 
                    formType, 
                    JSON.stringify(formData),
                    digitalSignature,
                    ip,
                    userAgent
                ]
            );
            
            // Log activity
            await client.query(
                'INSERT INTO audit_logs (user_id, employee_id, action, details, ip_address, user_agent, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
                [user.id, employeeData.employee_id, 'FORM_SUBMITTED', JSON.stringify({ formType }), ip, userAgent]
            );
            
            res.status(200).json({ success: true });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        
        if (error.message === 'Access token required' || error.message === 'Invalid or expired token') {
            return res.status(401).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to submit form' });
    }
}