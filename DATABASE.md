# Steel Onboarding Application - Database Documentation

Complete database architecture documentation for the Steel Onboarding
Application PostgreSQL database system via Supabase cloud platform.

## Overview

Cloud-native PostgreSQL database system deployed on Supabase, supporting user authentication, employee onboarding tracking, form submissions, audit logging, and HR notifications. Features built-in Row Level Security (RLS), real-time subscriptions, and automatic backups for enterprise-grade reliability.

## Database Configuration

### Environment Variables

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| DATABASE_URL | string | (required) | PostgreSQL connection string from Supabase |
| SUPABASE_URL | string | (required) | Supabase project URL for client connections |
| SUPABASE_ANON_KEY | string | (required) | Supabase anonymous key for client authentication |
| SUPABASE_SERVICE_ROLE_KEY | string | (required) | Service role key for server-side operations |
| BCRYPT_ROUNDS | integer | 12 | Password hashing rounds for security |
| JWT_SECRET | string | (required) | Secret key for JWT token signing |

### Connection Pool Settings

| Setting | Value | Purpose |
|---------|-------|----------|
| max | 5 | Maximum connections for serverless optimization |
| min | 0 | Allow scaling to zero connections |
| idleTimeoutMillis | 10000 | Shorter timeout for serverless environments |
| connectionTimeoutMillis | 10000 | Connection establishment timeout |
| ssl | true (production) | SSL enforcement for secure connections |

## Database Schema

### Users Table

**Purpose**: User authentication and role management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing unique user identifier |
| username | VARCHAR(255) | UNIQUE NOT NULL | Login username (lowercase) |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hashed password (12+ rounds) |
| role | VARCHAR(50) | NOT NULL DEFAULT 'employee' | User role: admin, hr, employee |
| name | VARCHAR(255) | NOT NULL | Full display name |
| email | VARCHAR(255) | | Email address for notifications |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| last_login | TIMESTAMP | | Last successful login timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Account status flag |

**Indexes:**
- UNIQUE index on username
- Performance index on role for authorization queries

**Sample Data:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "name": "System Administrator",
  "email": "admin@fsw-denver.com",
  "is_active": 1
}
```

### Employee Data Table

**Purpose**: Employee profile information and onboarding details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing unique record identifier |
| user_id | INTEGER | NOT NULL REFERENCES users(id) | Foreign key to users table |
| employee_id | VARCHAR(50) | UNIQUE | Company employee ID (FSW######) |
| name | VARCHAR(255) | NOT NULL | Employee full name |
| email | VARCHAR(255) | NOT NULL | Employee work email address |
| phone | VARCHAR(20) | | Employee phone number |
| position | VARCHAR(255) | NOT NULL | Job title/position |
| start_date | DATE | NOT NULL | Employment start date |
| supervisor | VARCHAR(255) | | Assigned supervisor name |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- idx_employee_data_user_id on user_id
- UNIQUE index on employee_id

**Sample Data:**
```json
{
  "employee_id": "FSW123456",
  "name": "John Smith",
  "email": "john.smith@fsw-denver.com",
  "position": "Welder I",
  "start_date": "2025-01-15",
  "supervisor": "Mike Johnson"
}
```

### Onboarding Progress Table

**Purpose**: Training module completion tracking and progress monitoring

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing unique progress record |
| user_id | INTEGER | NOT NULL REFERENCES users(id) | Foreign key to users table |
| employee_id | VARCHAR(50) | NOT NULL | Employee identifier for reporting |
| module_name | VARCHAR(255) | NOT NULL | Training module identifier |
| completed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Module completion time |
| progress_data | TEXT | | JSON blob with module progress data |

**Constraints:**
- UNIQUE(user_id, module_name) - Prevents duplicate module completions

**Indexes:**
- idx_onboarding_progress_user_id on user_id
- UNIQUE composite index on (user_id, module_name)

**Sample Data:**
```json
{
  "user_id": 3,
  "employee_id": "FSW123456",
  "module_name": "safety-basics",
  "progress_data": "{\"score\": 95, \"timeSpent\": 1800, \"attempts\": 1}",
  "completed_at": "2025-01-08T14:30:00Z"
}
```

### Form Submissions Table

**Purpose**: Digital form submissions with signature validation for compliance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing unique submission identifier |
| user_id | INTEGER | NOT NULL REFERENCES users(id) | Foreign key to users table |
| employee_id | VARCHAR(50) | NOT NULL | Employee identifier for audit trails |
| form_type | VARCHAR(255) | NOT NULL | Type/category of form submitted |
| form_data | TEXT | NOT NULL | JSON blob with complete form data |
| digital_signature | TEXT | | Base64 encoded signature image |
| submitted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Form submission time |
| ip_address | VARCHAR(45) | | Client IP address for audit purposes |
| user_agent | TEXT | | Browser user agent for audit purposes |

**Constraints:**
- UNIQUE(user_id, form_type) - One submission per form type per user

**Indexes:**
- idx_form_submissions_user_id on user_id
- UNIQUE composite index on (user_id, form_type)

**Sample Data:**
```json
{
  "user_id": 3,
  "employee_id": "FSW123456",
  "form_type": "emergency-contact",
  "form_data": "{\"contactName\": \"Jane Smith\", \"phone\": \"(555) 123-4567\"}",
  "digital_signature": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "ip_address": "192.168.1.100"
}
```

### Audit Logs Table

**Purpose**: Security audit trail and compliance logging for system activities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing unique log entry identifier |
| user_id | INTEGER | REFERENCES users(id) | Foreign key (null for system events) |
| employee_id | VARCHAR(50) | | Employee identifier when applicable |
| action | VARCHAR(255) | NOT NULL | Action type/category performed |
| details | TEXT | | JSON blob with action-specific details |
| ip_address | VARCHAR(45) | | Client IP address for security tracking |
| user_agent | TEXT | | Browser user agent information |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Log entry timestamp |

**Indexes:**
- idx_audit_logs_user_id on user_id
- idx_audit_logs_created_at on created_at

**Sample Data:**
```json
{
  "user_id": 3,
  "employee_id": "FSW123456",
  "action": "MODULE_COMPLETED",
  "details": "{\"moduleName\": \"safety-basics\", \"completionTime\": 1800}",
  "ip_address": "192.168.1.100",
  "created_at": "2025-01-08T14:30:00Z"
}
```

### HR Notifications Table

**Purpose**: HR notification tracking and email delivery status

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing unique notification identifier |
| user_id | INTEGER | NOT NULL REFERENCES users(id) | Foreign key to users table |
| employee_id | VARCHAR(50) | NOT NULL | Employee ID for notification context |
| notification_type | VARCHAR(255) | NOT NULL | Notification category/trigger |
| message | TEXT | NOT NULL | Notification message content |
| sent_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Notification timestamp |
| email_sent | BOOLEAN | DEFAULT FALSE | Email delivery success flag |

**Sample Data:**
```json
{
  "user_id": 3,
  "employee_id": "FSW123456",
  "notification_type": "ONBOARDING_STARTED",
  "message": "New employee John Smith started onboarding process",
  "email_sent": 1
}
```

## Database Relationships

| From Table | From Column | To Table | To Column | Type | Description |
|------------|-------------|----------|-----------|------|-------------|
| employee_data | user_id | users | id | many-to-one | Employee belongs to user account |
| onboarding_progress | user_id | users | id | many-to-one | Progress linked to user accounts |
| form_submissions | user_id | users | id | many-to-one | Forms associated with user accounts |
| audit_logs | user_id | users | id | many-to-one | Audit logs track user activities |
| hr_notifications | user_id | users | id | many-to-one | Notifications for user activities |

## Data Flow Documentation

### User Registration Flow

1. User account created in users table with hashed password
2. Employee data saved to employee_data table with generated employee_id
3. ONBOARDING_STARTED notification created in hr_notifications
4. Registration audit logged in audit_logs

### Training Progress Flow

1. Module completion recorded in onboarding_progress table
2. Progress data stored as JSON blob with scores and timing
3. MODULE_COMPLETED notification sent to HR
4. Activity logged in audit_logs for compliance

### Form Submission Flow

1. Form data validated and stored in form_submissions table
2. Digital signature saved as base64 encoded image
3. IP address and user agent captured for audit trail
4. FORM_SUBMITTED notification triggered for HR
5. Submission logged in audit_logs with form type

### HR Notification Flow

1. System event triggers notification creation
2. Notification record saved to hr_notifications table
3. Email sent to HR team if SMTP configured
4. Email delivery status updated in email_sent field
5. Failed notifications logged for retry processing

## Supabase Project Setup

### Initial Supabase Configuration

1. **Create Supabase Project**
   - Visit [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project with PostgreSQL 15+
   - Note project URL and API keys

2. **Database Initialization**
   ```bash
   node setup-database.js
   ```

   **What this does:**
   - Connects to PostgreSQL via DATABASE_URL
   - Creates all tables with proper foreign key constraints
   - Sets up PostgreSQL-specific indexes and sequences
   - Creates default admin user: admin/admin2025!
   - Initializes connection pooling for serverless deployment

3. **Supabase Auth Integration**
   ```javascript
   // Client-side authentication via supabase-client.js
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'secure-password',
     options: { data: { name: 'John Doe', position: 'Welder' } }
   })
   ```

### Environment Configuration

1. **Copy `.env.example` to `.env`**
2. **Configure Supabase Credentials:**
   ```bash
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   SUPABASE_URL=https://[project-ref].supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Update Security Settings:**
   ```bash
   JWT_SECRET=your-secure-random-key-here
   BCRYPT_ROUNDS=12
   ```
4. **Configure Email Service:**
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=notifications@fsw-denver.com
   EMAIL_PASS=your-app-password
   HR_EMAIL=tasha@fsw-denver.com
   ```

### Production Deployment Steps

1. **Supabase Production Setup:**
   - Upgrade to Supabase Pro plan for production features
   - Configure custom domain and SSL certificates
   - Enable database backups and point-in-time recovery
   - Set up monitoring and alerting

2. **Application Deployment:**
   ```bash
   # Initialize production database
   NODE_ENV=production node setup-database.js
   
   # Configure environment
   NODE_ENV=production
   DATABASE_URL=[production-postgres-url]
   
   # Deploy with connection pooling
   npm start
   ```

3. **Security Hardening:**
   - Enable Row Level Security (RLS) policies
   - Configure IP restrictions in Supabase dashboard
   - Set up database connection limits
   - Enable audit logging and monitoring

## Backup and Recovery

### Supabase Backup Strategy

**Automatic Backups (Supabase Pro):**
- Daily automated PostgreSQL backups with 7-day retention
- Point-in-time recovery (PITR) for granular data restoration
- Real-time WAL-E continuous archiving to AWS S3
- Cross-region backup replication for disaster recovery

**Manual Backup Options:**
- Application-level data export via `/api/backup/export` endpoint
- Direct PostgreSQL dumps using `pg_dump`
- Supabase CLI backup commands

**Backup Locations:**
- Primary: Supabase managed backups (AWS infrastructure)
- Secondary: Manual exports to secure cloud storage
- Compliance: Audit log archives with immutable storage

### Recovery Procedures

**Point-in-Time Recovery:**
```bash
# Restore database to specific timestamp
supabase db reset --db-url "$DATABASE_URL" --time "2025-01-08T14:30:00Z"
```

**Full Database Recovery:**
1. Access Supabase Dashboard → Database → Backups
2. Select backup point and initiate restoration
3. Update DATABASE_URL in application environment
4. Restart application services
5. Verify data integrity and user access

**Partial Data Recovery:**
```sql
-- Restore specific table from backup export
COPY employee_data FROM '/path/to/backup.csv' 
WITH (FORMAT csv, HEADER true);

-- Verify foreign key relationships
SELECT * FROM employee_data e 
LEFT JOIN users u ON e.user_id = u.id 
WHERE u.id IS NULL;
```

**Connection Recovery:**
- Automatic reconnection via connection pooling
- Health checks validate database connectivity
- Graceful degradation for temporary outages

## Performance Optimization

### PostgreSQL Query Optimization

**Optimized Query Patterns:**
```sql
-- Use parameterized queries with proper indexing
SELECT e.*, COUNT(p.module_name) as completed_modules
FROM employee_data e
LEFT JOIN onboarding_progress p ON e.user_id = p.user_id
WHERE e.user_id = $1
GROUP BY e.id;

-- Efficient pagination with OFFSET/LIMIT
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
OFFSET $1 LIMIT $2;
```

**PostgreSQL Index Strategy:**
```sql
-- Performance indexes for common queries
CREATE INDEX idx_employee_data_user_id ON employee_data(user_id);
CREATE INDEX idx_onboarding_progress_user_module ON onboarding_progress(user_id, module_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_form_submissions_user_type ON form_submissions(user_id, form_type);

-- Composite indexes for complex queries
CREATE INDEX idx_progress_employee_completed ON onboarding_progress(employee_id, completed_at);
```

### Performance Monitoring

**Supabase Monitoring:**
- Built-in query performance dashboard
- Real-time connection pool monitoring
- Database CPU and memory usage tracking
- Automated slow query identification

**Key Metrics:**
```sql
-- Monitor query performance
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_tup_read = 0;
```

**Connection Pool Optimization:**
- Monitor active vs idle connections
- Optimize pool size based on usage patterns
- Configure connection timeouts for serverless deployment
- Track connection acquisition times

## Migration from SQLite to Supabase/PostgreSQL

### Pre-Migration Assessment

1. **Data Inventory:**
   ```bash
   # Export SQLite schema
   sqlite3 onboarding.db ".schema" > sqlite_schema.sql
   
   # Count records in each table
   sqlite3 onboarding.db "SELECT 'users', COUNT(*) FROM users
   UNION SELECT 'employee_data', COUNT(*) FROM employee_data
   UNION SELECT 'onboarding_progress', COUNT(*) FROM onboarding_progress;"
   ```

2. **Schema Mapping:**
   | SQLite Type | PostgreSQL Type | Notes |
   |-------------|-----------------|-------|
   | INTEGER PRIMARY KEY AUTOINCREMENT | SERIAL PRIMARY KEY | Auto-incrementing |
   | TEXT | VARCHAR(255) or TEXT | Size-specific or unlimited |
   | DATETIME | TIMESTAMP | Timezone support available |
   | BOOLEAN | BOOLEAN | Native boolean type |

### Migration Steps

1. **Setup Supabase Project:**
   ```bash
   # Install Supabase CLI
   npm install -g @supabase/cli
   
   # Login and create project
   supabase login
   supabase projects create steel-onboarding
   ```

2. **Schema Migration:**
   ```sql
   -- Create PostgreSQL schema (run via Supabase SQL editor)
   -- Tables created automatically by database.js initialization
   
   -- Add indexes for performance
   CREATE INDEX idx_employee_data_user_id ON employee_data(user_id);
   CREATE INDEX idx_onboarding_progress_composite ON onboarding_progress(user_id, module_name);
   CREATE INDEX idx_form_submissions_composite ON form_submissions(user_id, form_type);
   CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
   ```

3. **Data Export from SQLite:**
   ```bash
   # Export data to CSV files
   sqlite3 -header -csv onboarding.db "SELECT * FROM users;" > users.csv
   sqlite3 -header -csv onboarding.db "SELECT * FROM employee_data;" > employee_data.csv
   sqlite3 -header -csv onboarding.db "SELECT * FROM onboarding_progress;" > progress.csv
   sqlite3 -header -csv onboarding.db "SELECT * FROM form_submissions;" > forms.csv
   sqlite3 -header -csv onboarding.db "SELECT * FROM audit_logs;" > audit.csv
   ```

4. **Data Import to PostgreSQL:**
   ```sql
   -- Import via Supabase SQL editor or psql
   \COPY users(username, password_hash, role, name, email, created_at, last_login, is_active) 
   FROM 'users.csv' WITH (FORMAT csv, HEADER true);
   
   \COPY employee_data(user_id, employee_id, name, email, phone, position, start_date, supervisor, created_at, updated_at) 
   FROM 'employee_data.csv' WITH (FORMAT csv, HEADER true);
   
   -- Continue for other tables...
   ```

### Post-Migration Verification

```sql
-- Verify record counts match
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'employee_data', COUNT(*) FROM employee_data
UNION ALL
SELECT 'onboarding_progress', COUNT(*) FROM onboarding_progress;

-- Check foreign key relationships
SELECT e.employee_id, e.name 
FROM employee_data e 
LEFT JOIN users u ON e.user_id = u.id 
WHERE u.id IS NULL;

-- Verify data integrity
SELECT p.user_id, COUNT(*) 
FROM onboarding_progress p 
LEFT JOIN users u ON p.user_id = u.id 
WHERE u.id IS NULL 
GROUP BY p.user_id;
```

## Data Retention Policies

### User Data Retention

| Data Type | Retention Period | Compliance Requirement |
|-----------|------------------|----------------------|
| Employee records | 7 years after termination | Employment law compliance |
| Form submissions | Permanent | Regulatory compliance |
| Digital signatures | Employment + 3 years | Legal document retention |

### Audit Data Retention

| Data Type | Retention Period | Purpose |
|-----------|------------------|---------|
| Audit logs | 2 years minimum | Security compliance |
| Login records | 90 days | Security monitoring |
| Progress tracking | Permanent | Training records |

### Notification Data Retention

| Data Type | Retention Period | Purpose |
|-----------|------------------|---------|
| HR notifications | 1 year | Operational review |
| Email delivery logs | 90 days | Troubleshooting |
| System events | 6 months | Operational analysis |

### Cleanup Procedures

**Manual Cleanup Queries:**
```sql
-- Remove old audit logs
DELETE FROM audit_logs WHERE created_at < date('now', '-2 years');

-- Remove old notifications
DELETE FROM hr_notifications WHERE sent_at < date('now', '-1 year');

-- Deactivate inactive users
UPDATE users SET is_active = 0 WHERE last_login < date('now', '-90 days');
```

**Automated Cleanup Schedule:**
- Monthly: Expired audit logs cleanup
- Quarterly: Inactive user account review
- Annually: Terminated employee data archive
- Weekly: Temporary/test data cleanup

## Security Configuration

### Row Level Security (RLS)

**Supabase RLS Policies:**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Employee can only access their own data
CREATE POLICY "Users can view own data" ON employee_data
  FOR SELECT USING (user_id = auth.uid());

-- HR role can access all employee data
CREATE POLICY "HR can view all data" ON employee_data
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');
```

**Role-Based Access Control:**
- **admin**: Full database access via service role
- **hr**: Employee data access via RLS policies
- **employee**: Personal data only via RLS user_id filtering

**Authentication Security:**
- Supabase Auth with email/password and social providers
- Server-side bcrypt hashing with 12+ rounds
- JWT tokens with configurable expiration
- Built-in rate limiting and brute force protection

### Data Protection

**Encryption:**
- **At Rest**: Supabase provides AES-256 encryption for all data
- **In Transit**: TLS 1.3 for all client-database connections
- **Application Level**: Sensitive form fields encrypted before storage

```javascript
// Application-level encryption for sensitive data
const crypto = require('crypto');
const encryptSensitiveData = (data) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};
```

**Data Sanitization:**
```javascript
// Parameterized queries prevent SQL injection
const result = await db.query(
  'SELECT * FROM users WHERE username = $1 AND is_active = $2',
  [username.toLowerCase(), true]
);

// Input validation using express-validator
const { body, validationResult } = require('express-validator');
const employeeValidation = [
  body('email').isEmail().normalizeEmail(),
  body('name').trim().escape().isLength({ min: 2, max: 100 }),
  body('position').trim().escape().isIn(['Welder I', 'Welder II', 'Supervisor'])
];
```

### Compliance Features

**Audit Trail:**
- Complete activity logging for all data modifications
- Immutable audit log entries with timestamp verification
- User agent and IP address capture for forensic analysis
- Digital signature verification for form submission integrity

**Data Privacy:**
- Personal data identification and classification
- Right-to-be-forgotten implementation for GDPR compliance
- Data minimization practices in form design
- Consent tracking for data processing activities

## Monitoring and Health Checks

### Database Health Monitoring

**Health Check Items:**
- Connection pool availability check
- Database file integrity verification
- Query response time monitoring
- Storage space utilization tracking

**Application Health:**
- Authentication system availability
- Email notification service status
- Form submission processing capacity
- Audit logging functionality verification

### Alerting Thresholds

**Performance Alerts:**
- Database query time > 2 seconds: Warning alert
- Database file size > 500MB: Capacity planning alert
- Failed authentication rate > 10%: Security alert
- Email delivery failure rate > 5%: System alert

**Security Alerts:**
- Multiple failed login attempts from single IP: Immediate alert
- Unusual data access patterns: Investigation alert
- Database connection errors: System health alert
- Audit log gaps or failures: Compliance alert

## Troubleshooting Guide

### Common Supabase/PostgreSQL Issues

#### Connection Pool Exhaustion

**Symptom:** `Error: remaining connection slots are reserved`
**Cause:** Too many concurrent connections or connection leaks

**Solution:**
```javascript
// Optimize connection pool settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3, // Reduce for serverless
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});

// Always release connections
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM users');
  return result;
} finally {
  client.release(); // Critical!
}
```

#### RLS Policy Violations

**Symptom:** `Error: new row violates row-level security policy`
**Cause:** Insufficient permissions or incorrect RLS policy

**Solution:**
```sql
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'employee_data';

-- Update policy for broader access
ALTER POLICY "employee_access_policy" ON employee_data
USING (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('hr', 'admin'));
```

#### Supabase Auth Issues

**Symptom:** `Error: Invalid login credentials`
**Cause:** Auth configuration mismatch or user not confirmed

**Solution:**
```javascript
// Check user confirmation status
const { data: { user }, error } = await supabase.auth.getUser();
if (user && !user.email_confirmed_at) {
  // Resend confirmation email
  await supabase.auth.resend({
    type: 'signup',
    email: user.email
  });
}

// Debug auth session
const { data: { session }, error } = await supabase.auth.getSession();
console.log('Current session:', session);
```

**Environment Check:**
```bash
# Verify Supabase configuration
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

#### Form Submission Errors

**Symptom:** Forms fail to save or submit
**Cause:** Database constraint violations or validation errors

**Solution:**
1. Check application logs for specific error messages
2. Verify unique constraints on form_type per user
3. Validate JSON data format in form_data field
4. Check for digital signature encoding issues

#### Email Notification Failures

**Symptom:** HR notifications not being sent
**Cause:** SMTP configuration errors or email service issues

**Solution:**
1. Verify SMTP settings in .env file
2. Test email service connectivity
3. Check hr_notifications table for queued messages
4. Review email service logs for delivery errors

### Diagnostic Queries

#### Check User Accounts
```sql
SELECT username, role, last_login, is_active 
FROM users 
ORDER BY created_at;
```

#### Progress Summary Report
```sql
SELECT 
    e.name, 
    e.position, 
    COUNT(p.module_name) as completed_modules,
    COUNT(f.form_type) as submitted_forms
FROM employee_data e
LEFT JOIN onboarding_progress p ON e.user_id = p.user_id
LEFT JOIN form_submissions f ON e.user_id = f.user_id
GROUP BY e.user_id;
```

#### Recent Activity Review
```sql
SELECT action, details, created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

#### Notification Delivery Status
```sql
SELECT 
    notification_type, 
    COUNT(*) as total,
    SUM(email_sent) as sent_successfully
FROM hr_notifications 
GROUP BY notification_type;
```

## Best Practices and Code Patterns

### Secure Data Access Pattern

```javascript
// Always use parameterized queries to prevent SQL injection
const result = await database.get(
  'SELECT * FROM users WHERE username = ? AND is_active = 1',
  [username.toLowerCase()]
);

// Verify user permissions before data access
if (req.user.role !== 'hr' && req.user.id !== targetUserId) {
  return res.status(403).json({ error: 'Insufficient permissions' });
}
```

### Audit Logging Pattern

```javascript
// Log all significant activities with context
await database.run(
  'INSERT INTO audit_logs (user_id, employee_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
  [userId, employeeId, action, JSON.stringify(details), req.ip, 
   req.headers['user-agent']]
);

// Include relevant details for audit trail
const auditDetails = {
  previousValue: oldData,
  newValue: newData,
  changedFields: Object.keys(changes)
};
```

### Transaction Management Pattern

```javascript
// Use transactions for multi-table operations
database.db.serialize(() => {
  database.db.run("BEGIN TRANSACTION");
  
  try {
    // Multiple related database operations
    database.db.run("INSERT INTO employee_data ...", params1);
    database.db.run("INSERT INTO audit_logs ...", params2);
    database.db.run("COMMIT");
  } catch (error) {
    database.db.run("ROLLBACK");
    throw error;
  }
});
```

### Data Validation Pattern

```javascript
// Validate data before database insertion
const validator = new SecurityValidator();

if (!validator.isValidEmail(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}

if (!validator.isValidEmployeeId(employeeId)) {
  return res.status(400).json({ error: 'Invalid employee ID format' });
}

// Sanitize inputs to prevent XSS
const sanitizedData = {
  name: validator.sanitizeString(name),
  position: validator.sanitizeString(position)
};
```

## Database Maintenance Schedule

### Daily Tasks
- Monitor application logs for database errors
- Check disk space utilization
- Review failed authentication attempts
- Verify backup completion status

### Weekly Tasks
- Run database integrity check
- Review slow query logs
- Clean up temporary data
- Monitor database file size growth

### Monthly Tasks
- Archive old audit logs
- Review user account activity
- Performance optimization review
- Security audit of access patterns

### Quarterly Tasks
- Database backup restore testing
- Security vulnerability assessment
- Capacity planning review
- Data retention policy compliance check

---

**Last Updated:** 2025-01-08  
**Database Version:** 1.0  
**Supported SQLite Version:** 3.35+