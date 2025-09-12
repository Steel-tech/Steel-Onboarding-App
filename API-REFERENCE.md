# Steel Onboarding App - API Reference

<metadata>
purpose: Comprehensive API documentation for Steel Onboarding App backend server
type: API
language: Node.js/Express
dependencies: express, cors, helmet, express-rate-limit, bcrypt, jsonwebtoken, pg, nodemailer, express-validator
last-updated: 2025-09-12
</metadata>

<overview>
The Steel Onboarding App backend provides a secure, production-ready API for managing employee onboarding workflows. Built with Express.js, it features JWT authentication, comprehensive input validation, rate limiting, audit logging, and automated HR notifications. The system integrates with Supabase for authentication and uses PostgreSQL for data persistence.

**Base URL**: `http://localhost:3001/api`  
**Authentication**: Bearer JWT tokens (8-hour expiry)  
**Content-Type**: `application/json`  
**Rate Limiting**: 3 attempts/15min for auth, 10 attempts/15min for general endpoints  
**Database**: PostgreSQL via Supabase with comprehensive audit trail  
**Frontend Auth**: Dual system - Supabase client-side auth + Express.js JWT fallback  
</overview>

## Authentication Flow

### Dual Authentication System
The application supports both Supabase client-side authentication and Express.js JWT backend authentication:

#### Primary: Supabase Authentication
1. **Registration**: Client-side Supabase auth with email confirmation (optional)
2. **Login**: Supabase handles authentication and session management
3. **Profile Creation**: User profile stored in PostgreSQL `profiles` table
4. **Session Token**: Supabase provides JWT tokens for API access

#### Fallback: Express.js JWT Authentication
1. **Login**: POST `/api/auth/login` - Obtain JWT token (8-hour expiry)
2. **Authorization**: Include token in `Authorization: Bearer <token>` header
3. **Token Validation**: Server validates on each protected endpoint
4. **Session Management**: Tokens expire after 8 hours

### Role-Based Access Control
- **employee**: Basic onboarding access (default role)
- **hr**: Employee management and dashboard access
- **admin**: Full system access including data export

### Environment Configuration
```bash
# Supabase Configuration
DATABASE_URL=postgresql://user:pass@host:port/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# JWT Fallback
JWT_SECRET=your-256-bit-secret-key
BCRYPT_ROUNDS=12
```

## Rate Limiting

### Authentication Endpoints (`/api/auth/*`)
- **Window**: 15 minutes
- **Limit**: 3 attempts per IP (strictRateLimit)
- **Headers**: `RateLimit-*` headers included
- **Handler**: Custom error logging with IP tracking

### General API Endpoints (`/api/*`)
- **Window**: 15 minutes
- **Limit**: 10 requests per IP (moderateRateLimit)
- **Enforcement**: 429 status with retry headers

## Security Features

### Input Validation & Sanitization
- **Express-Validator**: Comprehensive validation chains for all endpoints
- **SecurityValidator Class**: Custom validation for names, emails, phones, dates
- **String Sanitization**: Removes HTML tags, JS protocols, data URIs, length limits (1000 chars)
- **XSS Protection**: Pattern detection for dangerous content (script tags, eval, etc.)
- **Form Data Validation**: Deep inspection of JSON objects for malicious patterns
- **Digital Signature Validation**: Base64 data URL validation with size limits (1KB-500KB)

### Security Headers (via Helmet)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Content Security Policy
- **Default Source**: 'self' only
- **Script Source**: 'self' only  
- **Style Source**: 'self' + 'https://cdnjs.cloudflare.com'
- **Font Source**: 'self' + 'https://cdnjs.cloudflare.com'
- **Image Source**: 'self' + 'data:' (for signatures)
- **Media/Object**: Restricted to 'self' and 'none' respectively

### Database Security
- **PostgreSQL Connection Pool**: Configurable connection limits for serverless deployment
- **Parameterized Queries**: All database operations use prepared statements ($1, $2, etc.)
- **Connection Pooling**: pg.Pool with SSL support for production
- **Transaction Support**: ACID compliance with BEGIN/COMMIT/ROLLBACK

## API Endpoints

<functions>

<function name="POST /api/auth/login">
  <signature>POST /api/auth/login</signature>
  <purpose>Authenticate user and obtain JWT access token (Express.js fallback auth)</purpose>
  <authentication>None required (public endpoint)</authentication>
  <rate-limit>3 attempts per 15 minutes per IP (strictRateLimit)</rate-limit>
  <middleware>loginValidation, handleValidationErrors, auditLog('LOGIN_ATTEMPT')</middleware>
  
  <parameters>
    <param name="username" type="string" required="true">Username (3-50 chars, alphanumeric + underscore/hyphen)</param>
    <param name="password" type="string" required="true">Password (6-100 chars)</param>
  </parameters>
  
  <request-example>
    <input>
    {
      "username": "admin",
      "password": "admin2025!"
    }
    </input>
  </request-example>
  
  <returns>JWT token with user information and 8-hour expiry</returns>
  <response-example>
    <success status="200">
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "admin",
        "role": "hr",
        "name": "HR Administrator"
      }
    }
    </success>
  </response-example>
  
  <errors>
    <error type="400">Missing username or password, or validation failed</error>
    <error type="401">Invalid credentials</error>
    <error type="429">Too many login attempts</error>
    <error type="500">Internal server error</error>
  </errors>
  
  <validation>
    <rule field="username">3-50 chars, alphanumeric + underscore/hyphen, sanitized</rule>
    <rule field="password">6-100 chars, required for authentication</rule>
  </validation>
  
  <side-effects>
    <effect>Updates last_login timestamp in users table</effect>
    <effect>Creates audit log entry (LOGIN_SUCCESS or LOGIN_FAILED)</effect>
    <effect>Checks user is_active status before authentication</effect>
  </side-effects>
  
  <curl-example>
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin2025!"}'
  </curl-example>
</function>

<function name="POST /api/employee/data">
  <signature>POST /api/employee/data</signature>
  <purpose>Save or update employee information and generate employee ID</purpose>
  <authentication>Bearer JWT token required</authentication>
  <rate-limit>10 requests per 15 minutes per IP (moderateRateLimit)</rate-limit>
  <middleware>authenticateToken, employeeDataValidation, handleValidationErrors, auditLog('EMPLOYEE_DATA_SAVE')</middleware>
  
  <parameters>
    <param name="name" type="string" required="true">Full name (2-50 chars, letters/spaces/hyphens/apostrophes)</param>
    <param name="email" type="string" required="true">Email address (valid format, max 254 chars, normalized to lowercase)</param>
    <param name="phone" type="string" required="false">Phone number (US format, auto-formatted to (xxx) xxx-xxxx)</param>
    <param name="position" type="string" required="true">Job position (2-100 chars, alphanumeric + common punctuation)</param>
    <param name="start_date" type="string" required="true">Start date (ISO 8601 format, within one year of today)</param>
    <param name="supervisor" type="string" required="false">Supervisor name (max 100 chars, sanitized)</param>
  </parameters>
  
  <request-example>
    <input>
    {
      "name": "John Smith",
      "email": "john.smith@example.com",
      "phone": "(555) 123-4567",
      "position": "Steel Welder",
      "start_date": "2025-01-15",
      "supervisor": "Mike Johnson"
    }
    </input>
  </request-example>
  
  <returns>Success confirmation with generated employee ID</returns>
  <response-example>
    <success status="200">
    {
      "success": true,
      "employeeId": "FSW825463"
    }
    </success>
  </response-example>
  
  <errors>
    <error type="400">Missing required fields or validation errors</error>
    <error type="401">Invalid or expired JWT token</error>
    <error type="500">Database error or email service failure</error>
  </errors>
  
  <validation>
    <rule field="name">2-50 chars, regex: /^[a-zA-Z\s\-'.]+$/, sanitized</rule>
    <rule field="email">Valid email format, max 254 chars, normalized to lowercase</rule>
    <rule field="phone">Optional, US format validation, auto-formatted</rule>
    <rule field="position">2-100 chars, regex: /^[a-zA-Z0-9\s\-/&.,()]+$/, sanitized</rule>
    <rule field="start_date">ISO 8601 format, within one year range</rule>
    <rule field="supervisor">Optional, max 100 chars, sanitized</rule>
  </validation>
  
  <database-operation>
    <query>INSERT INTO employee_data ... ON CONFLICT (employee_id) DO UPDATE SET ...</query>
    <description>Uses PostgreSQL UPSERT pattern for idempotent operations</description>
  </database-operation>
  
  <side-effects>
    <effect>Generates unique employee ID (FSW + last 6 digits of timestamp)</effect>
    <effect>Sends HR notification email about onboarding start</effect>
    <effect>Creates audit log entry with user_id and employee_id</effect>
    <effect>Updates updated_at timestamp on conflict</effect>
  </side-effects>
  
  <curl-example>
  curl -X POST http://localhost:3001/api/employee/data \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"John Smith","email":"john@example.com","position":"Welder","start_date":"2025-01-15"}'
  </curl-example>
</function>

<function name="POST /api/progress/module">
  <signature>POST /api/progress/module</signature>
  <purpose>Record completion of training module and update progress tracking</purpose>
  <authentication>Bearer JWT token required</authentication>
  <rate-limit>10 requests per 15 minutes per IP (moderateRateLimit)</rate-limit>
  <middleware>authenticateToken, moduleProgressValidation, handleValidationErrors, auditLog('MODULE_PROGRESS_SAVE')</middleware>
  
  <parameters>
    <param name="moduleName" type="string" required="true">Module identifier (2-50 chars, alphanumeric/hyphens/underscores only)</param>
    <param name="progressData" type="object" required="false">Additional progress data (JSON object, validated for XSS)</param>
  </parameters>
  
  <request-example>
    <input>
    {
      "moduleName": "safety-basics",
      "progressData": {
        "completionTime": 1800,
        "score": 95,
        "attempts": 1,
        "userAgent": "Mozilla/5.0..."
      }
    }
    </input>
  </request-example>
  
  <returns>Success confirmation of module completion</returns>
  <response-example>
    <success status="200">
    {
      "success": true
    }
    </success>
  </response-example>
  
  <errors>
    <error type="400">Missing module name or invalid progress data</error>
    <error type="401">Invalid or expired JWT token</error>
    <error type="404">Employee data not found</error>
    <error type="500">Database error or email service failure</error>
  </errors>
  
  <validation>
    <rule field="moduleName">2-50 chars, regex: /^[a-zA-Z0-9\-_]+$/, sanitized</rule>
    <rule field="progressData">Optional object, validated for dangerous patterns</rule>
  </validation>
  
  <database-operation>
    <query>INSERT INTO onboarding_progress ... ON CONFLICT (user_id, module_name) DO UPDATE SET ...</query>
    <description>Uses PostgreSQL UPSERT to handle repeated module completions</description>
    <lookup>Requires employee_data record to exist for user_id</lookup>
  </database-operation>
  
  <side-effects>
    <effect>Updates or inserts module completion record with timestamp</effect>
    <effect>Sends HR notification email about module completion</effect>
    <effect>Creates audit log entry with MODULE_COMPLETED action</effect>
    <effect>Stores progress_data as JSON string in PostgreSQL</effect>
  </side-effects>
  
  <curl-example>
  curl -X POST http://localhost:3001/api/progress/module \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"moduleName":"safety-basics","progressData":{"score":95}}'
  </curl-example>
</function>

<function name="POST /api/forms/submit">
  <signature>POST /api/forms/submit</signature>
  <purpose>Submit completed onboarding forms with optional digital signature</purpose>
  <authentication>Bearer JWT token required</authentication>
  <rate-limit>10 requests per 15 minutes per IP (moderateRateLimit)</rate-limit>
  <middleware>authenticateToken, formSubmissionValidation, handleValidationErrors, auditLog('FORM_SUBMISSION')</middleware>
  
  <parameters>
    <param name="formType" type="string" required="true">Form type (handbook|health-safety|new-hire-orientation|steel-erection|welding-procedures|equipment-training)</param>
    <param name="formData" type="object" required="true">Form data object (validated for XSS/injection patterns)</param>
    <param name="digitalSignature" type="string" required="false">Base64 image data URL for canvas signature (1KB-500KB)</param>
  </parameters>
  
  <request-example>
    <input>
    {
      "formType": "handbook",
      "formData": {
        "fullName": "John Smith",
        "email": "john@example.com",
        "acknowledgment": true,
        "questions": {
          "q1": "Understood",
          "q2": "Yes"
        }
      },
      "digitalSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
    </input>
  </request-example>
  
  <returns>Success confirmation of form submission</returns>
  <response-example>
    <success status="200">
    {
      "success": true
    }
    </success>
  </response-example>
  
  <errors>
    <error type="400">Missing required fields, invalid form type, or malicious content detected</error>
    <error type="401">Invalid or expired JWT token</error>
    <error type="404">Employee data not found</error>
    <error type="500">Database error or email service failure</error>
  </errors>
  
  <validation>
    <rule field="formType">Must be one of 6 predefined form types</rule>
    <rule field="formData">Object validated for XSS patterns (script tags, eval, etc.)</rule>
    <rule field="formData.fullName">If present, validated with SecurityValidator.validateName()</rule>
    <rule field="formData.email">If present, validated with SecurityValidator.validateEmail()</rule>
    <rule field="digitalSignature">Optional, must be valid data:image/(png|jpeg|jpg);base64, URL</rule>
  </validation>
  
  <database-operation>
    <query>INSERT INTO form_submissions ... ON CONFLICT (user_id, form_type) DO UPDATE SET ...</query>
    <description>Uses PostgreSQL UPSERT to allow form resubmission</description>
    <lookup>Requires employee_data record to exist for user_id</lookup>
    <metadata>Stores IP address and User-Agent for audit trail</metadata>
  </database-operation>
  
  <side-effects>
    <effect>Stores form data as JSON string and signature with metadata (IP, User-Agent)</effect>
    <effect>Sends HR notification email about form submission with form type</effect>
    <effect>Creates audit log entry with FORM_SUBMITTED action</effect>
    <effect>Updates submitted_at timestamp on resubmission</effect>
  </side-effects>
  
  <curl-example>
  curl -X POST http://localhost:3001/api/forms/submit \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"formType":"handbook","formData":{"fullName":"John Smith","acknowledgment":true}}'
  </curl-example>
</function>

<function name="GET /api/hr/dashboard">
  <signature>GET /api/hr/dashboard</signature>
  <purpose>Retrieve HR dashboard data with employee progress and statistics</purpose>
  <authentication>Bearer JWT token with 'hr' role required</authentication>
  <rate-limit>10 requests per 15 minutes per IP (moderateRateLimit)</rate-limit>
  <middleware>authenticateToken (with role check)</middleware>
  
  <parameters>
    <param name="none" type="none" required="false">No parameters required</param>
  </parameters>
  
  <returns>Comprehensive dashboard data with employee list and statistics</returns>
  <response-example>
    <success status="200">
    {
      "employees": [
        {
          "employee_id": "FSW825463",
          "name": "John Smith",
          "email": "john@example.com",
          "position": "Steel Welder",
          "start_date": "2025-01-15",
          "created_at": "2025-01-10T10:30:00Z",
          "completed_modules": 3,
          "submitted_forms": 2,
          "last_login": "2025-01-10T15:45:00Z"
        }
      ],
      "stats": {
        "totalEmployees": 15,
        "completedOnboarding": 12,
        "completionRate": 80
      }
    }
    </success>
  </response-example>
  
  <errors>
    <error type="401">Invalid or expired JWT token</error>
    <error type="403">Insufficient permissions (HR role required)</error>
    <error type="500">Database error</error>
  </errors>
  
  <database-operation>
    <query>Complex JOIN query across employee_data, users, onboarding_progress, form_submissions</query>
    <aggregation>COUNT(DISTINCT p.module_name) as completed_modules</aggregation>
    <aggregation>COUNT(DISTINCT f.form_type) as submitted_forms</aggregation>
    <grouping>GROUP BY e.employee_id to aggregate per employee</grouping>
    <ordering>ORDER BY e.created_at DESC (newest employees first)</ordering>
  </database-operation>
  
  <business-logic>
    <rule>Completion defined as 4+ modules AND 5+ forms</rule>
    <rule>Results ordered by employee creation date (newest first)</rule>
    <rule>Statistics calculated in real-time from database aggregations</rule>
    <rule>Role validation: req.user.role !== 'hr' returns 403</rule>
    <rule>Completion rate calculated as percentage with Math.round()</rule>
  </business-logic>
  
  <authorization>
    <check>JWT token must be valid and not expired</check>
    <check>User role must be exactly 'hr' (not 'admin' or 'employee')</check>
    <check>Returns 403 Forbidden if role check fails</check>
  </authorization>
  
  <curl-example>
  curl -X GET http://localhost:3001/api/hr/dashboard \
    -H "Authorization: Bearer YOUR_HR_JWT_TOKEN"
  </curl-example>
</function>

<function name="GET /api/backup/export">
  <signature>GET /api/backup/export</signature>
  <purpose>Export all onboarding data for backup or reporting purposes</purpose>
  <authentication>Bearer JWT token with 'hr' or 'admin' role required</authentication>
  <rate-limit>10 requests per 15 minutes per IP (moderateRateLimit)</rate-limit>
  <middleware>authenticateToken (with role check for hr OR admin)</middleware>
  
  <parameters>
    <param name="none" type="none" required="false">No parameters required</param>
  </parameters>
  
  <returns>Complete database export as downloadable JSON file</returns>
  <response-example>
    <success status="200" content-type="application/json" content-disposition="attachment; filename=fsw-onboarding-backup.json">
    {
      "timestamp": "2025-01-10T16:00:00Z",
      "exported_by": "hr_admin",
      "employees": [...],
      "progress": [...],
      "forms": [...],
      "audit_logs": [...]
    }
    </success>
  </response-example>
  
  <errors>
    <error type="401">Invalid or expired JWT token</error>
    <error type="403">Insufficient permissions (HR/Admin role required)</error>
    <error type="500">Database error</error>
  </errors>
  
  <authorization>
    <check>JWT token must be valid and not expired</check>
    <check>User role must be 'hr' OR 'admin' (req.user.role !== 'hr' && req.user.role !== 'admin')</check>
    <check>Returns 403 Forbidden if role check fails</check>
  </authorization>
  
  <database-operation>
    <query>SELECT * FROM employee_data</query>
    <query>SELECT * FROM onboarding_progress</query>
    <query>SELECT * FROM form_submissions</query>
    <query>SELECT * FROM audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'</query>
  </database-operation>
  
  <data-scope>
    <scope>All employee data (personal information, contact details)</scope>
    <scope>All progress records (module completions, timestamps, JSON progress_data)</scope>
    <scope>All form submissions (including digital signatures as base64)</scope>
    <scope>Audit logs (last 30 days only for security and performance)</scope>
  </data-scope>
  
  <side-effects>
    <effect>Creates audit log entry for DATA_EXPORTED action with record count</effect>
    <effect>Sets Content-Disposition header for file download</effect>
    <effect>Sets Content-Type header to application/json</effect>
    <effect>Filename includes timestamp for uniqueness</effect>
  </side-effects>
  
  <curl-example>
  curl -X GET http://localhost:3001/api/backup/export \
    -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
    -o fsw-backup.json
  </curl-example>
</function>

<function name="GET /api/health">
  <signature>GET /api/health</signature>
  <purpose>System health check and uptime monitoring with database status</purpose>
  <authentication>None required (public endpoint)</authentication>
  <rate-limit>10 requests per 15 minutes per IP (moderateRateLimit)</rate-limit>
  
  <parameters>
    <param name="none" type="none" required="false">No parameters required</param>
  </parameters>
  
  <returns>Server status, database connectivity, and runtime information</returns>
  <response-example>
    <success status="200">
    {
      "status": "healthy",
      "database": "connected",
      "timestamp": "2025-01-10T16:00:00Z",
      "uptime": 86400.5
    }
    </success>
    <partial-failure status="200">
    {
      "status": "healthy",
      "database": "disconnected",
      "timestamp": "2025-01-10T16:00:00Z",
      "uptime": 86400.5
    }
    </partial-failure>
  </response-example>
  
  <errors>
    <error type="500">Server unhealthy with error details</error>
  </errors>
  
  <database-check>
    <operation>Attempts to get database connection via getDatabaseConnection()</operation>
    <fallback>Returns "disconnected" status if database unavailable</fallback>
    <states>connected | disconnected | unknown</states>
    <timeout>Uses database connection timeout settings</timeout>
  </database-check>
  
  <response-fields>
    <field name="status">Always "healthy" for 200 responses, "unhealthy" for 500</field>
    <field name="database">Connection status: connected|disconnected|unknown</field>
    <field name="timestamp">Current server time in ISO 8601 format</field>
    <field name="uptime">Process uptime in seconds (process.uptime())</field>
    <field name="error">Only present in 500 responses with error.message</field>
  </response-fields>
  
  <monitoring-use>
    <use>Load balancer health checks</use>
    <use>Uptime monitoring services</use>
    <use>DevOps status dashboards</use>
    <use>Database connectivity monitoring</use>
  </monitoring-use>
  
  <curl-example>
  curl -X GET http://localhost:3001/api/health
  </curl-example>
</function>

</functions>

## Database Schema

### PostgreSQL Implementation via Supabase
The application uses PostgreSQL as the primary database, accessed through Supabase with connection pooling optimized for serverless deployment.

### Connection Configuration
```javascript
// PostgreSQL Pool Settings (database.js)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,  // Reduced for serverless
    min: 0,  // Allow scaling to zero
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 8000
});
```

### Core Tables

#### users
```sql
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
);
```

#### employee_data
```sql
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
);
```

#### onboarding_progress
```sql
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    employee_id VARCHAR(50) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_data TEXT, -- JSON blob
    UNIQUE(user_id, module_name)
);
```

#### form_submissions
```sql
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    employee_id VARCHAR(50) NOT NULL,
    form_type VARCHAR(255) NOT NULL,
    form_data TEXT NOT NULL, -- JSON blob
    digital_signature TEXT, -- Base64 data
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    UNIQUE(user_id, form_type)
);
```

#### audit_logs
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    employee_id VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    details TEXT, -- JSON blob
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### hr_notifications
```sql
CREATE TABLE IF NOT EXISTS hr_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    employee_id VARCHAR(50) NOT NULL,
    notification_type VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_sent BOOLEAN DEFAULT FALSE
);
```

### Key PostgreSQL Features Used

#### UPSERT Operations
```sql
-- Employee data with conflict resolution
INSERT INTO employee_data (user_id, employee_id, name, email, ...) 
VALUES ($1, $2, $3, $4, ...)
ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = CURRENT_TIMESTAMP;
```

#### Parameterized Queries
All database operations use PostgreSQL parameter syntax ($1, $2, etc.) for security:
```javascript
await db.query('SELECT * FROM users WHERE username = $1 AND is_active = TRUE', [username]);
```

#### Transactions
```sql
BEGIN;
-- Multiple operations
COMMIT; -- or ROLLBACK on error
```

#### Advanced Aggregations
```sql
-- HR Dashboard query with complex JOINs and aggregations
SELECT 
    e.employee_id,
    e.name,
    e.email,
    COUNT(DISTINCT p.module_name) as completed_modules,
    COUNT(DISTINCT f.form_type) as submitted_forms
FROM employee_data e
LEFT JOIN onboarding_progress p ON e.user_id = p.user_id
LEFT JOIN form_submissions f ON e.user_id = f.user_id
GROUP BY e.employee_id
ORDER BY e.created_at DESC;
```

## Error Response Format

### Standard Error Structure
```json
{
  "error": "Human-readable error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Field-specific validation error",
      "value": "invalid_value"
    }
  ]
}
```

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (validation errors, missing data)
- **401**: Unauthorized (invalid/missing JWT token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource not found)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

## Email Notification System

### Notification Types
- **ONBOARDING_STARTED**: New employee data saved
- **MODULE_COMPLETED**: Training module finished
- **FORM_SUBMITTED**: Onboarding form submitted
- **ONBOARDING_COMPLETED**: All requirements met

### Email Configuration
```javascript
// Environment variables required
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@company.com
EMAIL_PASS=your-app-password
HR_EMAIL=tasha@fsw-denver.com
```

## Environment Configuration

### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
# For Supabase: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# JWT Configuration (Express.js fallback auth)
JWT_SECRET=your-256-bit-secret-key-minimum-32-chars

# Email Service (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=notifications@company.com
EMAIL_PASS=app-specific-password
HR_EMAIL=tasha@fsw-denver.com
ADMIN_EMAIL=admin@fsw-denver.com

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=1800000
FRONTEND_URL=http://localhost:3000

# Supabase Configuration (for client-side auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
```

### Optional Configuration
```bash
# Server Settings
PORT=3001
NODE_ENV=production

# Rate Limiting (uses express-rate-limit)
RATE_LIMIT_WINDOW=900000
AUTH_RATE_LIMIT=3
GENERAL_RATE_LIMIT=10

# Database Connection Pool Settings
DB_MAX_CONNECTIONS=5
DB_MIN_CONNECTIONS=0
DB_IDLE_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=10000
```

### Default User Creation
The server automatically creates a default admin user on startup:
```bash
# Default credentials (change in production!)
Username: admin
Password: admin2025!
Role: hr
```

### Production Security Checklist
```bash
# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Use strong database password
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@...

# Configure SSL for production
NODE_ENV=production

# Set appropriate CORS origin
FRONTEND_URL=https://your-production-domain.com

# Use app-specific email passwords
EMAIL_PASS=your-gmail-app-password
```

## Audit Logging

### Tracked Actions
- `LOGIN_ATTEMPT` / `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `EMPLOYEE_DATA_SAVED`
- `MODULE_COMPLETED`
- `FORM_SUBMITTED`
- `DATA_EXPORTED`

### Audit Log Structure
```json
{
  "user_id": 123,
  "employee_id": "FSW825463",
  "action": "MODULE_COMPLETED",
  "details": {
    "moduleName": "safety-basics",
    "timestamp": "2025-01-10T16:00:00Z"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-01-10T16:00:00Z"
}
```

## Input Validation Rules

### String Sanitization
- Remove HTML tags: `< >` characters stripped
- Remove protocol handlers: `javascript:`, `data:`, `vbscript:`
- Length limit: 1000 characters maximum
- XSS pattern detection for dangerous content

### Field-Specific Validation

#### Names
- Pattern: `/^[a-zA-Z\s\-'.]{2,50}$/`
- Length: 2-50 characters
- Allowed: Letters, spaces, hyphens, apostrophes

#### Email Addresses
- Pattern: Standard RFC-compliant email validation
- Length: Maximum 254 characters
- Normalization: Converted to lowercase

#### Phone Numbers
- Pattern: `/^[1-9]\d{9}$/` (US format)
- Format: Automatically formatted as (xxx) xxx-xxxx
- Validation: 10 digits, not starting with 0

#### Dates
- Format: ISO 8601 string
- Range: Within one year of current date
- Validation: Valid date object creation

### Digital Signatures
- Format: Must be valid `data:image/(png|jpeg|jpg);base64,` URL
- Size: Between 1KB and 500KB
- Validation: Base64 data integrity check

## Security Considerations

### Password Security
- **Hashing**: bcrypt with configurable rounds (default: 12)
- **Storage**: Never stored in plaintext
- **Transmission**: Only via HTTPS in production

### JWT Token Security
- **Algorithm**: HS256 with 256-bit secret
- **Expiry**: 8 hours maximum
- **Claims**: Minimal user information only
- **Secret**: Must be cryptographically secure in production

### Database Security
- **Prepared Statements**: All queries use parameterized statements
- **Audit Trail**: Comprehensive logging of all data modifications
- **Data Retention**: Audit logs limited to 30 days for exports

### Network Security
- **CORS**: Configured for specific frontend origin only
- **Helmet**: Comprehensive security headers
- **Rate Limiting**: Prevents brute force and DoS attacks
- **Input Validation**: Multiple layers of sanitization and validation

## Deployment Checklist

### Production Security
- [ ] Generate cryptographically secure JWT_SECRET
- [ ] Configure proper CORS origin
- [ ] Set up HTTPS with valid SSL certificates
- [ ] Configure email service with app-specific passwords
- [ ] Set appropriate BCRYPT_ROUNDS (12+ recommended)
- [ ] Enable database backups
- [ ] Configure log rotation and monitoring
- [ ] Set up health check monitoring
- [ ] Review and test rate limiting settings
- [ ] Validate all environment variables

### Performance Optimization
- [ ] Configure database connection pooling
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable response compression
- [ ] Configure static asset caching
- [ ] Monitor memory usage and optimize queries
- [ ] Set up database indexing for frequently queried fields

### Monitoring and Maintenance
- [ ] Set up application logging
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Monitor API response times
- [ ] Set up automated backups
- [ ] Create runbooks for common issues
- [ ] Establish update and patch procedures