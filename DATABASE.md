# Steel Onboarding Application - Database Documentation

Complete database architecture documentation for the Steel Onboarding Application SQLite database system.

## Overview

SQLite database system supporting user authentication, employee onboarding tracking, form submissions, audit logging, and HR notifications. Designed for production use with security, performance, and compliance requirements.

## Database Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| DB_PATH | string | ./onboarding.db | SQLite database file location |
| BCRYPT_ROUNDS | integer | 12 | Password hashing rounds for security |
| JWT_SECRET | string | (required) | Secret key for JWT token signing |

## Database Schema

### Users Table

**Purpose**: User authentication and role management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| username | TEXT | UNIQUE NOT NULL | Login username (stored in lowercase) |
| password_hash | TEXT | NOT NULL | bcrypt hashed password (12 rounds minimum) |
| role | TEXT | NOT NULL DEFAULT 'employee' | User role: admin, hr, employee |
| name | TEXT | NOT NULL | Full display name |
| email | TEXT | | Email address for notifications |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| last_login | DATETIME | | Last successful login timestamp |
| is_active | BOOLEAN | DEFAULT 1 | Account status flag |

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
  "email": "admin@flawlesssteelwelding.com",
  "is_active": 1
}
```

### Employee Data Table

**Purpose**: Employee profile information and onboarding details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique record identifier |
| user_id | INTEGER | NOT NULL, FK to users.id | Foreign key reference to users table |
| employee_id | TEXT | UNIQUE | Company-generated employee ID (FSW######) |
| name | TEXT | NOT NULL | Employee full name |
| email | TEXT | NOT NULL | Employee work email address |
| phone | TEXT | | Employee phone number |
| position | TEXT | NOT NULL | Job title/position |
| start_date | DATE | NOT NULL | Employment start date |
| supervisor | TEXT | | Assigned supervisor name |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- idx_employee_data_user_id on user_id
- UNIQUE index on employee_id

**Sample Data:**
```json
{
  "employee_id": "FSW123456",
  "name": "John Smith",
  "email": "john.smith@flawlesssteelwelding.com",
  "position": "Welder I",
  "start_date": "2025-01-15",
  "supervisor": "Mike Johnson"
}
```

### Onboarding Progress Table

**Purpose**: Training module completion tracking and progress monitoring

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique progress record |
| user_id | INTEGER | NOT NULL, FK to users.id | Foreign key reference to users table |
| employee_id | TEXT | NOT NULL | Employee identifier for reporting |
| module_name | TEXT | NOT NULL | Training module identifier |
| completed_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Module completion timestamp |
| progress_data | TEXT | | JSON blob containing module-specific progress data |

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
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique submission identifier |
| user_id | INTEGER | NOT NULL, FK to users.id | Foreign key reference to users table |
| employee_id | TEXT | NOT NULL | Employee identifier for audit trails |
| form_type | TEXT | NOT NULL | Type/category of form submitted |
| form_data | TEXT | NOT NULL | JSON blob containing complete form data |
| digital_signature | TEXT | | Base64 encoded digital signature image |
| submitted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Form submission timestamp |
| ip_address | TEXT | | Client IP address for audit purposes |
| user_agent | TEXT | | Browser user agent for audit purposes |

**Indexes:**
- idx_form_submissions_user_id on user_id
- UNIQUE composite index on (user_id, form_type)

**Sample Data:**
```json
{
  "user_id": 3,
  "employee_id": "FSW123456",
  "form_type": "emergency-contact",
  "form_data": "{\"contactName\": \"Jane Smith\", \"phone\": \"(555) 123-4567\", \"relationship\": \"spouse\"}",
  "digital_signature": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "ip_address": "192.168.1.100"
}
```

### Audit Logs Table

**Purpose**: Security audit trail and compliance logging for all system activities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log entry identifier |
| user_id | INTEGER | FK to users.id | Foreign key reference (null for system events) |
| employee_id | TEXT | | Employee identifier when applicable |
| action | TEXT | NOT NULL | Action type/category performed |
| details | TEXT | | JSON blob containing action-specific details |
| ip_address | TEXT | | Client IP address for security tracking |
| user_agent | TEXT | | Browser user agent information |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Log entry timestamp |

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

**Purpose**: HR notification tracking and email delivery status monitoring

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique notification identifier |
| user_id | INTEGER | NOT NULL, FK to users.id | Foreign key reference to users table |
| employee_id | TEXT | NOT NULL | Employee identifier for notification context |
| notification_type | TEXT | NOT NULL | Notification category/trigger |
| message | TEXT | NOT NULL | Notification message content |
| sent_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Notification generation timestamp |
| email_sent | BOOLEAN | DEFAULT 0 | Email delivery success flag |

**Sample Data:**
```json
{
  "user_id": 3,
  "employee_id": "FSW123456",
  "notification_type": "ONBOARDING_STARTED",
  "message": "New employee John Smith has started onboarding process",
  "email_sent": 1
}
```

## Database Relationships

| From Table | From Column | To Table | To Column | Type | Description |
|------------|-------------|----------|-----------|------|-------------|
| employee_data | user_id | users | id | many-to-one | Each employee record belongs to one user account |
| onboarding_progress | user_id | users | id | many-to-one | Progress records are linked to user accounts |
| form_submissions | user_id | users | id | many-to-one | Form submissions are associated with user accounts |
| audit_logs | user_id | users | id | many-to-one | Audit logs track user activities |
| hr_notifications | user_id | users | id | many-to-one | Notifications are generated for user activities |

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

## Database Setup Procedures

### Initial Database Setup

```bash
node setup-database.js
```

**What this does:**
- Creates database file and all tables with proper schema
- Creates indexes for performance optimization
- Creates default users: admin/admin2025!, hr/hr2025!, employee/fsw2025!
- Generates environment file template (.env.example)

### Environment Configuration

1. Copy `.env.example` to `.env`
2. Update `JWT_SECRET` with secure random key
3. Configure SMTP settings for email notifications
4. Set production database path if needed
5. Update HR and admin email addresses

### Production Deployment Steps

1. Run `setup-database.js` to initialize production database
2. Configure `.env` with production settings
3. Set `NODE_ENV=production`
4. Configure proper file permissions on database file
5. Set up database backup procedures
6. Configure monitoring and health checks

## Backup and Recovery

### Backup Strategy

**Automated Backups:**
- Daily SQLite database file backup using file system tools
- Weekly export of all data via `/api/backup/export` endpoint
- Real-time audit log export for compliance requirements

**Backup Locations:**
- Primary: Local file system backup rotation (7 daily, 4 weekly)
- Secondary: Cloud storage backup for disaster recovery
- Compliance: Separate audit log archive for regulatory requirements

### Recovery Procedures

**Database Corruption:**
1. Stop application server immediately
2. Restore latest backup file to production location
3. Verify database integrity: `sqlite3 onboarding.db "PRAGMA integrity_check;"`
4. Restart application and verify functionality
5. Review audit logs for data loss assessment

**Data Recovery:**
1. Identify scope of data loss from audit logs
2. Use backup export JSON files to restore specific records
3. Manually reconstruct lost data using form submissions backups
4. Verify user authentication and access controls
5. Notify affected employees of recovery status

## Performance Optimization

### Query Optimization

**Optimized Query Patterns:**
- SELECT with indexed columns for user lookups
- JOIN operations minimized using denormalized employee_id fields
- Batch INSERT operations for bulk data imports
- LIMIT clauses on large result sets for pagination

**Index Strategy:**
- Primary indexes on all foreign key relationships
- Composite indexes on frequently queried column combinations
- Time-based indexes on created_at/submitted_at for reporting
- Unique constraints enforced at database level for data integrity

### Performance Monitoring

**Key Metrics:**
- Query execution time monitoring via application logs
- Database file size growth tracking
- Connection pool utilization (if using connection pooling)
- Index usage statistics from SQLite EXPLAIN QUERY PLAN

**Optimization Triggers:**
- Response time > 1 second: Review query execution plans
- Database size > 100MB: Implement archive/purge procedures
- High CPU usage: Analyze slow queries and add indexes
- Memory usage growth: Check for connection leaks

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

### Access Control

**Role-Based Permissions:**
- **admin**: Full database access, user management, system configuration
- **hr**: Employee data access, reporting, notification management
- **employee**: Personal data only, progress tracking, form submission

**Authentication Security:**
- bcrypt password hashing with 12+ rounds minimum
- JWT tokens with 8-hour expiration for session management
- Account lockout after 5 failed login attempts in 15 minutes
- IP address logging for all authentication events

### Data Protection

**Encryption at Rest:**
- Database file encryption using SQLite PRAGMA cipher (if available)
- Digital signature data encrypted in storage
- Sensitive form data encrypted with application-level encryption

**Data Sanitization:**
- Input validation on all form fields before database storage
- SQL injection prevention using parameterized queries exclusively
- XSS protection through output encoding of stored data
- File upload restrictions and content type validation

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

### Common Issues and Solutions

#### Database Locked Error

**Symptom:** Error: database is locked
**Cause:** Long-running transaction or connection not properly closed

**Solution:**
1. Check for hung processes: `ps aux | grep node`
2. Kill hung processes if found
3. Restart application server
4. Verify database integrity after restart

#### Authentication Failures

**Symptom:** Users cannot log in with correct credentials
**Cause:** Password hash corruption or JWT secret mismatch

**Solution:**
1. Check users table for password_hash field integrity
2. Verify JWT_SECRET environment variable consistency
3. Reset user password using setup-database.js if needed
4. Clear browser cache and cookies

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
  [userId, employeeId, action, JSON.stringify(details), req.ip, req.headers['user-agent']]
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