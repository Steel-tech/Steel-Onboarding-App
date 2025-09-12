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

### JWT Token Lifecycle
1. **Login**: POST `/api/auth/login` - Obtain JWT token (8-hour expiry)
2. **Authorization**: Include token in `Authorization: Bearer <token>` header
3. **Token Validation**: Server validates on each protected endpoint
4. **Session Management**: Automatic logout after inactivity timeout

### Role-Based Access Control
- **employee**: Basic onboarding access
- **hr**: Employee management and dashboard access
- **admin**: Full system access including data export

## Rate Limiting

### Authentication Endpoints (`/api/auth/*`)
- **Window**: 15 minutes
- **Limit**: 5 attempts per IP
- **Headers**: `RateLimit-*` headers included

### General API Endpoints (`/api/*`)
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Enforcement**: 429 status with retry headers

## Security Features

### Input Validation
- **Sanitization**: All string inputs cleaned of XSS/injection patterns
- **Schema Validation**: Express-validator middleware on all endpoints
- **Data Length Limits**: Configurable field length restrictions

### Security Headers
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
- **Style Source**: 'self' + CDN fonts
- **Media/Object**: Restricted

## API Endpoints

<functions>

<function name="POST /api/auth/login">
  <signature>POST /api/auth/login</signature>
  <purpose>Authenticate user and obtain JWT access token</purpose>
  <authentication>None required (public endpoint)</authentication>
  <rate-limit>5 attempts per 15 minutes per IP</rate-limit>
  
  <parameters>
    <param name="username" type="string" required="true">Username (3-50 chars, alphanumeric + underscore/hyphen)</param>
    <param name="password" type="string" required="true">Password (6-100 chars)</param>
  </parameters>
  
  <request-example>
    <input>
    {
      "username": "employee",
      "password": "fsw2025!"
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
        "username": "employee",
        "role": "employee",
        "name": "New Employee"
      }
    }
    </success>
  </response-example>
  
  <errors>
    <error type="400">Missing username or password</error>
    <error type="401">Invalid credentials</error>
    <error type="429">Too many login attempts</error>
    <error type="500">Internal server error</error>
  </errors>
  
  <curl-example>
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"employee","password":"fsw2025!"}'
  </curl-example>
</function>

<function name="POST /api/employee/data">
  <signature>POST /api/employee/data</signature>
  <purpose>Save or update employee information and generate employee ID</purpose>
  <authentication>Bearer JWT token required</authentication>
  <rate-limit>100 requests per 15 minutes per IP</rate-limit>
  
  <parameters>
    <param name="name" type="string" required="true">Full name (2-50 chars, letters/spaces/hyphens/apostrophes)</param>
    <param name="email" type="string" required="true">Email address (valid format, max 254 chars)</param>
    <param name="phone" type="string" required="false">Phone number (10-15 digits, formatted)</param>
    <param name="position" type="string" required="true">Job position (2-100 chars)</param>
    <param name="start_date" type="string" required="true">Start date (ISO 8601 format)</param>
    <param name="supervisor" type="string" required="false">Supervisor name (max 100 chars)</param>
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
  
  <side-effects>
    <effect>Generates unique employee ID (FSW + timestamp suffix)</effect>
    <effect>Sends HR notification email about onboarding start</effect>
    <effect>Creates audit log entry</effect>
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
  <rate-limit>100 requests per 15 minutes per IP</rate-limit>
  
  <parameters>
    <param name="moduleName" type="string" required="true">Module identifier (2-50 chars, alphanumeric/hyphens/underscores)</param>
    <param name="progressData" type="object" required="false">Additional progress data (JSON object)</param>
  </parameters>
  
  <request-example>
    <input>
    {
      "moduleName": "safety-basics",
      "progressData": {
        "completionTime": 1800,
        "score": 95,
        "attempts": 1
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
  
  <side-effects>
    <effect>Updates or inserts module completion record</effect>
    <effect>Sends HR notification about module completion</effect>
    <effect>Creates audit log entry</effect>
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
  <rate-limit>100 requests per 15 minutes per IP</rate-limit>
  
  <parameters>
    <param name="formType" type="string" required="true">Form type (handbook|health-safety|new-hire-orientation|steel-erection|welding-procedures|equipment-training)</param>
    <param name="formData" type="object" required="true">Form data object (validated for XSS/injection)</param>
    <param name="digitalSignature" type="string" required="false">Base64 image data URL for canvas signature</param>
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
  
  <validation-rules>
    <rule>Form data checked for XSS patterns (script tags, javascript:, eval(), etc.)</rule>
    <rule>Digital signature must be valid data URL with reasonable size (1KB-500KB)</rule>
    <rule>Names and emails in form data re-validated with same rules as employee data</rule>
  </validation-rules>
  
  <side-effects>
    <effect>Stores form data and signature with metadata (IP, User-Agent)</effect>
    <effect>Sends HR notification about form submission</effect>
    <effect>Creates audit log entry</effect>
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
  <rate-limit>100 requests per 15 minutes per IP</rate-limit>
  
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
  
  <business-logic>
    <rule>Completion defined as 4+ modules AND 5+ forms</rule>
    <rule>Results ordered by employee creation date (newest first)</rule>
    <rule>Statistics calculated in real-time from database</rule>
  </business-logic>
  
  <curl-example>
  curl -X GET http://localhost:3001/api/hr/dashboard \
    -H "Authorization: Bearer YOUR_HR_JWT_TOKEN"
  </curl-example>
</function>

<function name="GET /api/backup/export">
  <signature>GET /api/backup/export</signature>
  <purpose>Export all onboarding data for backup or reporting purposes</purpose>
  <authentication>Bearer JWT token with 'hr' or 'admin' role required</authentication>
  <rate-limit>100 requests per 15 minutes per IP</rate-limit>
  
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
  
  <data-scope>
    <scope>All employee data (personal information, contact details)</scope>
    <scope>All progress records (module completions, timestamps)</scope>
    <scope>All form submissions (including digital signatures)</scope>
    <scope>Audit logs (last 30 days only for security)</scope>
  </data-scope>
  
  <side-effects>
    <effect>Creates audit log entry for data export</effect>
    <effect>Sets download headers for file save</effect>
  </side-effects>
  
  <curl-example>
  curl -X GET http://localhost:3001/api/backup/export \
    -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
    -o fsw-backup.json
  </curl-example>
</function>

<function name="GET /api/health">
  <signature>GET /api/health</signature>
  <purpose>System health check and uptime monitoring</purpose>
  <authentication>None required (public endpoint)</authentication>
  <rate-limit>100 requests per 15 minutes per IP</rate-limit>
  
  <parameters>
    <param name="none" type="none" required="false">No parameters required</param>
  </parameters>
  
  <returns>Server status and runtime information</returns>
  <response-example>
    <success status="200">
    {
      "status": "healthy",
      "timestamp": "2025-01-10T16:00:00Z",
      "uptime": 86400.5
    }
    </success>
  </response-example>
  
  <errors>
    <error type="500">Server unavailable</error>
  </errors>
  
  <monitoring-use>
    <use>Load balancer health checks</use>
    <use>Uptime monitoring services</use>
    <use>DevOps status dashboards</use>
  </monitoring-use>
  
  <curl-example>
  curl -X GET http://localhost:3001/api/health
  </curl-example>
</function>

</functions>

## Database Schema

### Core Tables

#### users
```sql
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
```

#### employee_data
```sql
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
```

#### onboarding_progress
```sql
CREATE TABLE onboarding_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    employee_id TEXT NOT NULL,
    module_name TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress_data TEXT, -- JSON blob
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(user_id, module_name)
);
```

#### form_submissions
```sql
CREATE TABLE form_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    employee_id TEXT NOT NULL,
    form_type TEXT NOT NULL,
    form_data TEXT NOT NULL, -- JSON blob
    digital_signature TEXT, -- Base64 data
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(user_id, form_type)
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    employee_id TEXT,
    action TEXT NOT NULL,
    details TEXT, -- JSON blob
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
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
# JWT Configuration
JWT_SECRET=your-256-bit-secret-key

# Database
DB_PATH=/path/to/onboarding.db

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=notifications@company.com
EMAIL_PASS=app-specific-password
HR_EMAIL=tasha@fsw-denver.com
ADMIN_EMAIL=admin@fsw-denver.com

# Security
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=1800000
FRONTEND_URL=http://localhost:3000
```

### Optional Configuration
```bash
# Server
PORT=3001
NODE_ENV=production

# Advanced Security
RATE_LIMIT_WINDOW=900000
AUTH_RATE_LIMIT=5
GENERAL_RATE_LIMIT=100
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