// Server-side Validation and Sanitization for Steel Onboarding Application
// Production-ready input validation with security focus

const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Security utilities
class SecurityValidator {
    
    // Sanitize string input
    static sanitizeString(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML
            .replace(/javascript:/gi, '') // Remove JS protocols
            .replace(/data:/gi, '') // Remove data URIs
            .replace(/vbscript:/gi, '') // Remove VBScript
            .substring(0, 1000); // Limit length
    }
    
    // Validate and sanitize name
    static validateName(name) {
        if (!name || typeof name !== 'string') return null;
        
        const sanitized = this.sanitizeString(name);
        const nameRegex = /^[a-zA-Z\s\-'.]{2,50}$/;
        
        return nameRegex.test(sanitized) ? sanitized : null;
    }
    
    // Validate and sanitize email
    static validateEmail(email) {
        if (!email || typeof email !== 'string') return null;
        
        const sanitized = this.sanitizeString(email).toLowerCase();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        return emailRegex.test(sanitized) && sanitized.length <= 254 ? sanitized : null;
    }
    
    // Validate and sanitize phone
    static validatePhone(phone) {
        if (!phone || typeof phone !== 'string') return null;
        
        const sanitized = phone.replace(/\D/g, ''); // Keep only digits
        const phoneRegex = /^[1-9]\d{9}$/; // US format: 10 digits, not starting with 0
        
        if (phoneRegex.test(sanitized)) {
            // Format as (xxx) xxx-xxxx
            return `(${sanitized.slice(0,3)}) ${sanitized.slice(3,6)}-${sanitized.slice(6)}`;
        }
        
        return null;
    }
    
    // Validate position/job title
    static validatePosition(position) {
        if (!position || typeof position !== 'string') return null;
        
        const sanitized = this.sanitizeString(position);
        const positionRegex = /^[a-zA-Z0-9\s\-/&.,()]{2,100}$/;
        
        return positionRegex.test(sanitized) ? sanitized : null;
    }
    
    // Validate date
    static validateDate(dateString) {
        if (!dateString || typeof dateString !== 'string') return null;
        
        const date = new Date(dateString);
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        
        return date instanceof Date && 
               !isNaN(date) && 
               date >= oneYearAgo && 
               date <= oneYearFromNow ? dateString : null;
    }
    
    // Validate form data structure
    static validateFormData(formData) {
        if (!formData || typeof formData !== 'object') return false;
        
        // Check for potential XSS or injection attempts
        const stringified = JSON.stringify(formData);
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /vbscript:/i,
            /onload=/i,
            /onerror=/i,
            /onclick=/i,
            /eval\(/i,
            /document\./i,
            /window\./i
        ];
        
        return !dangerousPatterns.some(pattern => pattern.test(stringified));
    }
    
    // Validate digital signature
    static validateDigitalSignature(signature) {
        if (!signature || typeof signature !== 'string') return false;
        
        // Check if it's a valid data URL for canvas signature
        const dataUrlRegex = /^data:image\/(png|jpeg|jpg);base64,/i;
        
        if (!dataUrlRegex.test(signature)) return false;
        
        // Check base64 data length (reasonable signature size)
        const base64Data = signature.split(',')[1];
        return base64Data && base64Data.length >= 1000 && base64Data.length <= 500000;
    }
}

// Express validator middleware chains
const employeeDataValidation = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-'.]+$/)
        .withMessage('Name contains invalid characters')
        .customSanitizer(SecurityValidator.sanitizeString),
    
    body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .isLength({ max: 254 })
        .withMessage('Email too long')
        .normalizeEmail()
        .customSanitizer(SecurityValidator.sanitizeString),
    
    body('phone')
        .optional()
        .matches(/^[\d\s\-\(\)+]{10,15}$/)
        .withMessage('Invalid phone number format')
        .customSanitizer(value => {
            if (!value) return value;
            const validated = SecurityValidator.validatePhone(value);
            return validated || value;
        }),
    
    body('position')
        .notEmpty()
        .withMessage('Position is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Position must be between 2 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-/&.,()]+$/)
        .withMessage('Position contains invalid characters')
        .customSanitizer(SecurityValidator.sanitizeString),
    
    body('start_date')
        .isISO8601()
        .withMessage('Invalid date format')
        .custom(value => {
            const validated = SecurityValidator.validateDate(value);
            if (!validated) {
                throw new Error('Start date must be within one year of today');
            }
            return true;
        }),
    
    body('supervisor')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Supervisor name too long')
        .customSanitizer(SecurityValidator.sanitizeString)
];

const moduleProgressValidation = [
    body('moduleName')
        .notEmpty()
        .withMessage('Module name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Invalid module name length')
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage('Module name contains invalid characters')
        .customSanitizer(SecurityValidator.sanitizeString),
    
    body('progressData')
        .optional()
        .isObject()
        .withMessage('Progress data must be an object')
        .custom(value => {
            if (value && !SecurityValidator.validateFormData(value)) {
                throw new Error('Progress data contains invalid content');
            }
            return true;
        })
];

const formSubmissionValidation = [
    body('formType')
        .notEmpty()
        .withMessage('Form type is required')
        .isIn(['handbook', 'health-safety', 'new-hire-orientation', 'steel-erection', 'welding-procedures', 'equipment-training'])
        .withMessage('Invalid form type'),
    
    body('formData')
        .isObject()
        .withMessage('Form data must be an object')
        .custom(value => {
            if (!SecurityValidator.validateFormData(value)) {
                throw new Error('Form data contains invalid content');
            }
            
            // Additional validation based on form type
            if (value.fullName && !SecurityValidator.validateName(value.fullName)) {
                throw new Error('Invalid name in form data');
            }
            
            if (value.email && !SecurityValidator.validateEmail(value.email)) {
                throw new Error('Invalid email in form data');
            }
            
            return true;
        }),
    
    body('digitalSignature')
        .optional()
        .custom(value => {
            if (value && !SecurityValidator.validateDigitalSignature(value)) {
                throw new Error('Invalid digital signature format');
            }
            return true;
        })
];

const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username contains invalid characters')
        .customSanitizer(SecurityValidator.sanitizeString),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6, max: 100 })
        .withMessage('Password must be between 6 and 100 characters')
];

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));
        
        // Log validation failure
        console.log('Validation failed:', {
            endpoint: req.path,
            method: req.method,
            errors: errorMessages,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        return res.status(400).json({
            error: 'Validation failed',
            details: errorMessages
        });
    }
    
    next();
};

// Rate limiting for sensitive endpoints
const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per window
    message: { error: 'Too many attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log('Rate limit exceeded:', {
            ip: req.ip,
            endpoint: req.path,
            userAgent: req.headers['user-agent']
        });
        
        res.status(429).json({
            error: 'Too many attempts, please try again later.'
        });
    }
});

const moderateRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: { error: 'Rate limit exceeded.' }
});

// Input sanitization middleware
const sanitizeInputs = (req, res, next) => {
    // Sanitize all string inputs in body
    if (req.body && typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
                req.body[key] = SecurityValidator.sanitizeString(value);
            }
        }
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string') {
                req.query[key] = SecurityValidator.sanitizeString(value);
            }
        }
    }
    
    next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

// Audit logging middleware for sensitive operations
const auditLog = (action) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log successful operations
            if (res.statusCode < 400) {
                console.log('Audit Log:', {
                    action: action,
                    user: req.user?.username || 'anonymous',
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    timestamp: new Date().toISOString(),
                    endpoint: req.path,
                    method: req.method
                });
            }
            
            return originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = {
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
};