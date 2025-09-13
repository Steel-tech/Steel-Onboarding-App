// Production-Ready Backend Server for Steel Onboarding Application
// Handles data persistence, authentication, and HR notifications

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
// PostgreSQL database module
const Database = require('./database');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Import validators
const {
    SecurityValidator,
    employeeDataValidation,
    moduleProgressValidation,
    formSubmissionValidation,
    loginValidation,
    handleValidationErrors,
    strictRateLimit,
    moderateRateLimit,
    sanitizeInputs,
    securityHeaders,
    auditLog
} = require('./validators');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment configuration
const config = {
    JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    DATABASE_URL: process.env.DATABASE_URL,
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: process.env.EMAIL_PORT || 587,
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    HR_EMAIL: process.env.HR_EMAIL || 'tasha@fsw-denver.com',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@fsw-denver.com',
    SESSION_TIMEOUT: process.env.SESSION_TIMEOUT || 30 * 60 * 1000, // 30 minutes
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12
};

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:"],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"]
        }
    }
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/auth', strictRateLimit);
app.use('/api', moderateRateLimit);

// Apply security middleware
app.use(securityHeaders);
app.use(sanitizeInputs);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Database setup - PostgreSQL initialization

// Initialize database (lazy initialization)
let database = null;
let databaseInitPromise = null;

const getDatabaseConnection = async () => {
    if (database) {
        return database;
    }
    
    if (!databaseInitPromise) {
        databaseInitPromise = (async () => {
            console.log('🔄 Initializing database connection...');
            const db = new Database();
            await db.init();
            database = db;
            return db;
        })();
    }
    
    return databaseInitPromise;
};

// Email service
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }
    
    initializeTransporter() {
        if (!config.EMAIL_USER || !config.EMAIL_PASS) {
            console.log('⚠️  Email service not configured - notifications will be logged only');
            return;
        }
        
        this.transporter = nodemailer.createTransporter({
            host: config.EMAIL_HOST,
            port: config.EMAIL_PORT,
            secure: false,
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS
            }
        });
    }
    
    async sendHRNotification(employeeData, notificationType, details = {}) {
        const subject = `Onboarding Update: ${employeeData.name} - ${notificationType}`;
        const message = this.generateHREmailContent(employeeData, notificationType, details);
        
        if (this.transporter) {
            try {
                await this.transporter?.sendMail({
                    from: config.EMAIL_USER,
                    to: config.HR_EMAIL,
                    subject: subject,
                    html: message
                });
                console.log(`✅ HR notification sent: ${notificationType} for ${employeeData.name}`);
                return true;
            } catch (error) {
                console.error('❌ Failed to send HR notification:', error);
                return false;
            }
        } else {
            console.log(`📧 HR Notification (Email not configured): ${subject}`);
            console.log(message);
            return false;
        }
    }
    
    generateHREmailContent(employeeData, type, details) {
        const baseContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2c3e50;">Flawless Steel Welding - Onboarding Update</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3>Employee Information</h3>
                    <p><strong>Name:</strong> ${employeeData.name}</p>
                    <p><strong>Position:</strong> ${employeeData.position}</p>
                    <p><strong>Start Date:</strong> ${employeeData.start_date}</p>
                    <p><strong>Email:</strong> ${employeeData.email}</p>
                </div>
        `;
        
        let typeSpecificContent = '';
        
        switch (type) {
            case 'ONBOARDING_STARTED':
                typeSpecificContent = `
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px;">
                        <h4>✅ Onboarding Started</h4>
                        <p>The employee has begun the onboarding process.</p>
                    </div>
                `;
                break;
            case 'MODULE_COMPLETED':
                typeSpecificContent = `
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 5px;">
                        <h4>📚 Training Module Completed</h4>
                        <p><strong>Module:</strong> ${details.moduleName}</p>
                        <p><strong>Completed At:</strong> ${new Date(details.completedAt).toLocaleString()}</p>
                    </div>
                `;
                break;
            case 'FORM_SUBMITTED':
                typeSpecificContent = `
                    <div style="background: #fff3e0; padding: 15px; border-radius: 5px;">
                        <h4>📋 Form Submitted</h4>
                        <p><strong>Form Type:</strong> ${details.formType}</p>
                        <p><strong>Submitted At:</strong> ${new Date(details.submittedAt).toLocaleString()}</p>
                        <p><strong>Digital Signature:</strong> ${details.hasSignature ? 'Yes' : 'No'}</p>
                    </div>
                `;
                break;
            case 'ONBOARDING_COMPLETED':
                typeSpecificContent = `
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 5px;">
                        <h4>🎉 Onboarding Completed</h4>
                        <p>The employee has successfully completed all onboarding requirements!</p>
                        <p><strong>Completion Rate:</strong> 100%</p>
                        <p><strong>Time Spent:</strong> ${details.totalTime}</p>
                        <p><strong>Ready for Work Assignment:</strong> Yes</p>
                    </div>
                `;
                break;
        }
        
        return baseContent + typeSpecificContent + `
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p><small>This is an automated notification from the Flawless Steel Welding Onboarding System.</small></p>
                    <p><small>Contact IT Support at (720) 638-7289 if you have questions.</small></p>
                </div>
            </div>
        `;
    }
}

const emailService = new EmailService();

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Audit logging
const logActivity = async (userId, employeeId, action, details, req) => {
    try {
        const db = await getDatabaseConnection();
        await db.run(
            'INSERT INTO audit_logs (user_id, employee_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, employeeId, action, JSON.stringify(details), req.ip, req.headers['user-agent']]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

// API Routes

// Authentication endpoints
app.post('/api/auth/login', 
    loginValidation, 
    handleValidationErrors,
    auditLog('LOGIN_ATTEMPT'),
    async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        // Get user from database
        const user = await database.get(
            'SELECT * FROM users WHERE username = $1 AND is_active = TRUE',
            [username.toLowerCase()]
        );
        
        if (!user) {
            await logActivity(null, null, 'LOGIN_FAILED', { username, reason: 'User not found' }, req);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            await logActivity(user.id, null, 'LOGIN_FAILED', { username, reason: 'Invalid password' }, req);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await database.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            config.JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        await logActivity(user.id, null, 'LOGIN_SUCCESS', { username }, req);
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Auto-registration endpoint for new employees (simplified auth)
app.post('/api/auth/register-employee', 
    employeeDataValidation,
    handleValidationErrors,
    auditLog('EMPLOYEE_AUTO_REGISTER'),
    async (req, res) => {
    try {
        const { name, email, phone, position, start_date, supervisor } = req.body;
        
        // Validate required fields
        if (!name || !email || !position || !start_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Generate unique username and temporary password
        const username = email.toLowerCase();
        const tempPassword = 'Welcome2024!'; // Simple temp password for onboarding
        const hashedPassword = await bcrypt.hash(tempPassword, parseInt(config.BCRYPT_ROUNDS));
        
        // Generate employee ID
        const employeeId = `FSW${Date.now().toString().slice(-6)}`;
        
        try {
            // Get database connection
            const db = await getDatabaseConnection();
            
            // Create user account
            const userResult = await db.insert(
                `INSERT INTO users (username, password_hash, role, name, email, created_at) 
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [username, hashedPassword, 'employee', name, email]
            );
            
            const userId = userResult.id;
            
            // Create employee data
            await db.run(
                `INSERT INTO employee_data 
                 (user_id, employee_id, name, email, phone, position, start_date, supervisor, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
                [userId, employeeId, name, email, phone, position, start_date, supervisor]
            );
            
            // Generate JWT token for immediate use
            const token = jwt.sign(
                { 
                    id: userId, 
                    username: username, 
                    role: 'employee',
                    name: name
                },
                config.JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            await logActivity(userId, employeeId, 'EMPLOYEE_REGISTERED', { name, position }, req);
            
            // Send HR notification
            await emailService.sendHRNotification(
                { name, email, position, start_date },
                'ONBOARDING_STARTED'
            );
            
            res.json({ 
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
            if (dbError.message?.includes('unique constraint') || dbError.code === '23505') {
                // User already exists, try to login instead
                const existingUser = await database.get(
                    'SELECT * FROM users WHERE username = $1',
                    [username]
                );
                
                if (existingUser) {
                    const token = jwt.sign(
                        { 
                            id: existingUser.id, 
                            username: existingUser.username, 
                            role: existingUser.role,
                            name: existingUser.name
                        },
                        config.JWT_SECRET,
                        { expiresIn: '8h' }
                    );
                    
                    const existingEmployee = await database.get(
                        'SELECT employee_id FROM employee_data WHERE user_id = $1',
                        [existingUser.id]
                    );
                    
                    res.json({
                        success: true,
                        employeeId: existingEmployee?.employee_id || employeeId,
                        token,
                        user: {
                            id: existingUser.id,
                            username: existingUser.username,
                            role: existingUser.role,
                            name: existingUser.name
                        },
                        message: 'Existing user logged in'
                    });
                } else {
                    throw dbError;
                }
            } else {
                throw dbError;
            }
        }
        
    } catch (error) {
        console.error('Employee registration error:', error);
        res.status(500).json({ error: 'Failed to register employee' });
    }
});

// Employee data endpoints
app.post('/api/employee/data', 
    authenticateToken,
    employeeDataValidation,
    handleValidationErrors,
    auditLog('EMPLOYEE_DATA_SAVE'),
    async (req, res) => {
    try {
        const { name, email, phone, position, start_date, supervisor } = req.body;
        
        // Validate required fields
        if (!name || !email || !position || !start_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Generate employee ID
        const employeeId = `FSW${Date.now().toString().slice(-6)}`;
        
        // Insert or update employee data
        await database.run(
            `INSERT INTO employee_data 
             (user_id, employee_id, name, email, phone, position, start_date, supervisor, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (employee_id) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                position = EXCLUDED.position,
                start_date = EXCLUDED.start_date,
                supervisor = EXCLUDED.supervisor,
                updated_at = CURRENT_TIMESTAMP`,
            [req.user.id, employeeId, name, email, phone, position, start_date, supervisor]
        );
        
        await logActivity(req.user.id, employeeId, 'EMPLOYEE_DATA_SAVED', { name, position }, req);
        
        // Send HR notification
        await emailService.sendHRNotification(
            { name, email, position, start_date },
            'ONBOARDING_STARTED'
        );
        
        res.json({ success: true, employeeId });
        
    } catch (error) {
        console.error('Save employee data error:', error);
        res.status(500).json({ error: 'Failed to save employee data' });
    }
});

// Progress tracking endpoints
app.post('/api/progress/module', 
    authenticateToken,
    moduleProgressValidation,
    handleValidationErrors,
    auditLog('MODULE_PROGRESS_SAVE'),
    async (req, res) => {
    try {
        const { moduleName, progressData } = req.body;
        
        if (!moduleName) {
            return res.status(400).json({ error: 'Module name required' });
        }
        
        // Get employee data
        const employee = await database.get(
            'SELECT employee_id, name, position FROM employee_data WHERE user_id = $1',
            [req.user.id]
        );
        
        if (!employee) {
            return res.status(404).json({ error: 'Employee data not found' });
        }
        
        // Record module completion
        await database.run(
            `INSERT INTO onboarding_progress 
             (user_id, employee_id, module_name, progress_data) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, module_name) DO UPDATE SET
                progress_data = EXCLUDED.progress_data,
                completed_at = CURRENT_TIMESTAMP`,
            [req.user.id, employee.employee_id, moduleName, JSON.stringify(progressData || {})]
        );
        
        await logActivity(req.user.id, employee.employee_id, 'MODULE_COMPLETED', { moduleName }, req);
        
        // Send HR notification
        await emailService.sendHRNotification(
            employee,
            'MODULE_COMPLETED',
            { moduleName, completedAt: new Date().toISOString() }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Module progress error:', error);
        res.status(500).json({ error: 'Failed to save module progress' });
    }
});

// Form submission endpoints
app.post('/api/forms/submit', 
    authenticateToken,
    formSubmissionValidation,
    handleValidationErrors,
    auditLog('FORM_SUBMISSION'),
    async (req, res) => {
    try {
        const { formType, formData, digitalSignature } = req.body;
        
        if (!formType || !formData) {
            return res.status(400).json({ error: 'Form type and data required' });
        }
        
        // Get employee data
        const employee = await database.get(
            'SELECT employee_id, name, position FROM employee_data WHERE user_id = $1',
            [req.user.id]
        );
        
        if (!employee) {
            return res.status(404).json({ error: 'Employee data not found' });
        }
        
        // Save form submission
        await database.run(
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
                req.user.id, 
                employee.employee_id, 
                formType, 
                JSON.stringify(formData),
                digitalSignature,
                req.ip,
                req.headers['user-agent']
            ]
        );
        
        await logActivity(req.user.id, employee.employee_id, 'FORM_SUBMITTED', { formType }, req);
        
        // Send HR notification
        await emailService.sendHRNotification(
            employee,
            'FORM_SUBMITTED',
            { 
                formType, 
                submittedAt: new Date().toISOString(),
                hasSignature: !!digitalSignature
            }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Form submission error:', error);
        res.status(500).json({ error: 'Failed to save form submission' });
    }
});

// HR Dashboard endpoints (HR role required)
app.get('/api/hr/dashboard', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'hr') {
            return res.status(403).json({ error: 'HR access required' });
        }
        
        // Get all employees and their progress
        const employees = await database.all(`
            SELECT 
                e.employee_id,
                e.name,
                e.email,
                e.position,
                e.start_date,
                e.created_at,
                COUNT(DISTINCT p.module_name) as completed_modules,
                COUNT(DISTINCT f.form_type) as submitted_forms,
                u.last_login
            FROM employee_data e
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN onboarding_progress p ON e.user_id = p.user_id
            LEFT JOIN form_submissions f ON e.user_id = f.user_id
            GROUP BY e.employee_id
            ORDER BY e.created_at DESC
        `);
        
        // Get completion statistics
        const stats = await database.get(`
            SELECT 
                COUNT(DISTINCT ed.employee_id) as total_employees,
                COUNT(DISTINCT CASE WHEN op.module_count >= 4 AND fs.form_count >= 5 THEN ed.employee_id END) as completed_onboarding
            FROM employee_data ed
            LEFT JOIN (
                SELECT user_id, COUNT(*) as module_count 
                FROM onboarding_progress 
                GROUP BY user_id
            ) op ON ed.user_id = op.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as form_count 
                FROM form_submissions 
                GROUP BY user_id
            ) fs ON ed.user_id = fs.user_id
        `);
        
        res.json({
            employees,
            stats: {
                totalEmployees: stats.total_employees,
                completedOnboarding: stats.completed_onboarding,
                completionRate: stats.total_employees > 0 
                    ? Math.round((stats.completed_onboarding / stats.total_employees) * 100) 
                    : 0
            }
        });
        
    } catch (error) {
        console.error('HR dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Data backup endpoint
app.get('/api/backup/export', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'hr' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin or HR access required' });
        }
        
        // Export all data
        const exportData = {
            timestamp: new Date().toISOString(),
            exported_by: req.user.username,
            employees: await database.all('SELECT * FROM employee_data'),
            progress: await database.all('SELECT * FROM onboarding_progress'),
            forms: await database.all('SELECT * FROM form_submissions'),
            audit_logs: await database.all('SELECT * FROM audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL \'30 days\'')
        };
        
        await logActivity(req.user.id, null, 'DATA_EXPORTED', { recordCount: exportData.employees.length }, req);
        
        res.setHeader('Content-Disposition', 'attachment; filename="fsw-onboarding-backup.json"');
        res.setHeader('Content-Type', 'application/json');
        res.json(exportData);
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Try to get database connection (but don't fail if it's not available)
        let dbStatus = 'unknown';
        try {
            const db = await getDatabaseConnection();
            dbStatus = 'connected';
        } catch (error) {
            dbStatus = 'disconnected';
        }
        
        res.json({ 
            status: 'healthy', 
            database: dbStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Initialize default admin user
const initializeDefaultUsers = async () => {
    try {
        const existingUser = await database.get('SELECT id FROM users WHERE username = $1', ['admin']);
        
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash('admin2025!', config.BCRYPT_ROUNDS);
            
            await database.run(
                'INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, $3, $4)',
                ['admin', hashedPassword, 'hr', 'HR Administrator']
            );
            
            console.log('✅ Default admin user created: admin / admin2025!');
        }
    } catch (error) {
        console.error('❌ Failed to create default users:', error);
    }
};

// Start server
app.listen(PORT, async () => {
    console.log(`\n🚀 Steel Onboarding Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: PostgreSQL (${config.DATABASE_URL ? 'Connected' : 'Not configured'})`);
    console.log(`📧 Email service: ${config.EMAIL_USER ? 'Configured' : 'Not configured'}`);
    
    // Initialize default users
    await initializeDefaultUsers();
    
    console.log(`\n✅ Server ready for connections`);
    console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
    console.log(`🔧 API Base: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    if (database) {
        await database.close();
    }
    process.exit(0);
});

module.exports = app;