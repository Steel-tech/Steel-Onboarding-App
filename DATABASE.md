<metadata>
purpose: Complete database architecture documentation for Steel Onboarding Application
type: database
language: SQL
dependencies: sqlite3, bcrypt, jsonwebtoken
last-updated: 2025-01-08
</metadata>

<overview>
SQLite database system for the Steel Onboarding Application supporting user authentication, employee onboarding tracking, form submissions, audit logging, and HR notifications. Designed for production use with security, performance, and compliance requirements.
</overview>

<database-configuration>
<setting name="DB_PATH" type="string" default="./onboarding.db">
  SQLite database file location - can be overridden via environment variable
</setting>
<setting name="BCRYPT_ROUNDS" type="integer" default="12">
  Password hashing rounds for security - minimum 12 for production
</setting>
<setting name="JWT_SECRET" type="string" required="true">
  Secret key for JWT token signing - generated automatically if not provided
</setting>
</database-configuration>

<schema>
<table name="users">
  <purpose>User authentication and role management</purpose>
  <columns>
    <column name="id" type="INTEGER" constraints="PRIMARY KEY AUTOINCREMENT">Unique user identifier</column>
    <column name="username" type="TEXT" constraints="UNIQUE NOT NULL">Login username - stored in lowercase</column>
    <column name="password_hash" type="TEXT" constraints="NOT NULL">bcrypt hashed password (12 rounds minimum)</column>
    <column name="role" type="TEXT" constraints="NOT NULL DEFAULT 'employee'">User role: admin, hr, employee</column>
    <column name="name" type="TEXT" constraints="NOT NULL">Full display name</column>
    <column name="email" type="TEXT" constraints="">Email address for notifications</column>
    <column name="created_at" type="DATETIME" constraints="DEFAULT CURRENT_TIMESTAMP">Account creation timestamp</column>
    <column name="last_login" type="DATETIME" constraints="">Last successful login timestamp</column>
    <column name="is_active" type="BOOLEAN" constraints="DEFAULT 1">Account status flag</column>
  </columns>
  <indexes>
    <index name="UNIQUE username" columns="username">Ensures unique usernames</index>
  </indexes>
  <sample-data>
    <record>
      <id>1</id>
      <username>admin</username>
      <role>admin</role>
      <name>System Administrator</name>
      <email>admin@flawlesssteelwelding.com</email>
      <is_active>1</is_active>
    </record>
  </sample-data>
</table>

<table name="employee_data">
  <purpose>Employee profile information and onboarding details</purpose>
  <columns>
    <column name="id" type="INTEGER" constraints="PRIMARY KEY AUTOINCREMENT">Unique record identifier</column>
    <column name="user_id" type="INTEGER" constraints="NOT NULL">Foreign key reference to users table</column>
    <column name="employee_id" type="TEXT" constraints="UNIQUE">Company-generated employee ID (FSW######)</column>
    <column name="name" type="TEXT" constraints="NOT NULL">Employee full name</column>
    <column name="email" type="TEXT" constraints="NOT NULL">Employee work email address</column>
    <column name="phone" type="TEXT" constraints="">Employee phone number</column>
    <column name="position" type="TEXT" constraints="NOT NULL">Job title/position</column>
    <column name="start_date" type="DATE" constraints="NOT NULL">Employment start date</column>
    <column name="supervisor" type="TEXT" constraints="">Assigned supervisor name</column>
    <column name="created_at" type="DATETIME" constraints="DEFAULT CURRENT_TIMESTAMP">Record creation timestamp</column>
    <column name="updated_at" type="DATETIME" constraints="DEFAULT CURRENT_TIMESTAMP">Last update timestamp</column>
  </columns>
  <foreign-keys>
    <foreign-key column="user_id" references="users(id)">Links employee to user account</foreign-key>
  </foreign-keys>
  <indexes>
    <index name="idx_employee_data_user_id" columns="user_id">Performance optimization for user lookups</index>
    <index name="UNIQUE employee_id" columns="employee_id">Ensures unique employee IDs</index>
  </indexes>
  <sample-data>
    <record>
      <employee_id>FSW123456</employee_id>
      <name>John Smith</name>
      <email>john.smith@flawlesssteelwelding.com</email>
      <position>Welder I</position>
      <start_date>2025-01-15</start_date>
      <supervisor>Mike Johnson</supervisor>
    </record>
  </sample-data>
</table>

<table name="onboarding_progress">
  <purpose>Training module completion tracking and progress monitoring</purpose>
  <columns>
    <column name="id" type="INTEGER" constraints="PRIMARY KEY AUTOINCREMENT">Unique progress record</column>
    <column name="user_id" type="INTEGER" constraints="NOT NULL">Foreign key reference to users table</column>
    <column name="employee_id" type="TEXT" constraints="NOT NULL">Employee identifier for reporting</column>
    <column name="module_name" type="TEXT" constraints="NOT NULL">Training module identifier</column>
    <column name="completed_at" type="DATETIME" constraints="DEFAULT CURRENT_TIMESTAMP">Module completion timestamp</column>
    <column name="progress_data" type="TEXT" constraints="">JSON blob containing module-specific progress data</column>
  </columns>
  <foreign-keys>
    <foreign-key column="user_id" references="users(id)">Links progress to user account</foreign-key>
  </foreign-keys>
  <indexes>
    <index name="idx_onboarding_progress_user_id" columns="user_id">Performance optimization for progress queries</index>
    <index name="UNIQUE user_module" columns="user_id, module_name">Prevents duplicate module completions</index>
  </indexes>
  <sample-data>
    <record>
      <user_id>3</user_id>
      <employee_id>FSW123456</employee_id>
      <module_name>safety-basics</module_name>
      <progress_data>{"score": 95, "timeSpent": 1800, "attempts": 1}</progress_data>
      <completed_at>2025-01-08T14:30:00Z</completed_at>
    </record>
  </sample-data>
</table>

<table name="form_submissions">
  <purpose>Digital form submissions with signature validation for compliance</purpose>
  <columns>
    <column name="id" type="INTEGER" constraints="PRIMARY KEY AUTOINCREMENT">Unique submission identifier</column>
    <column name="user_id" type="INTEGER" constraints="NOT NULL">Foreign key reference to users table</column>
    <column name="employee_id" type="TEXT" constraints="NOT NULL">Employee identifier for audit trails</column>
    <column name="form_type" type="TEXT" constraints="NOT NULL">Type/category of form submitted</column>
    <column name="form_data" type="TEXT" constraints="NOT NULL">JSON blob containing complete form data</column>
    <column name="digital_signature" type="TEXT" constraints="">Base64 encoded digital signature image</column>
    <column name="submitted_at" type="DATETIME" constraints="DEFAULT CURRENT_TIMESTAMP">Form submission timestamp</column>
    <column name="ip_address" type="TEXT" constraints="">Client IP address for audit purposes</column>
    <column name="user_agent" type="TEXT" constraints="">Browser user agent for audit purposes</column>
  </columns>
  <foreign-keys>
    <foreign-key column="user_id" references="users(id)">Links form to user account</foreign-key>
  </foreign-keys>
  <indexes>
    <index name="idx_form_submissions_user_id" columns="user_id">Performance optimization for form queries</index>
    <index name="UNIQUE user_form_type" columns="user_id, form_type">Prevents duplicate form submissions</index>
  </indexes>
  <sample-data>
    <record>
      <user_id>3</user_id>
      <employee_id>FSW123456</employee_id>
      <form_type>emergency-contact</form_type>
      <form_data>{"contactName": "Jane Smith", "phone": "(555) 123-4567", "relationship": "spouse"}</form_data>
      <digital_signature>data:image/png;base64,iVBORw0KGgoAAAANSU...</digital_signature>
      <ip_address>192.168.1.100</ip_address>
    </record>
  </sample-data>
</table>

<table name="audit_logs">
  <purpose>Security audit trail and compliance logging for all system activities</purpose>
  <columns>
    <column name="id" type="INTEGER" constraints="PRIMARY KEY AUTOINCREMENT">Unique log entry identifier</column>
    <column name="user_id" type="INTEGER" constraints="">Foreign key reference to users table (null for system events)</column>
    <column name="employee_id" type="TEXT" constraints="">Employee identifier when applicable</column>
    <column name="action" type="TEXT" constraints="NOT NULL">Action type/category performed</column>
    <column name="details" type="TEXT" constraints="">JSON blob containing action-specific details</column>
    <column name="ip_address" type="TEXT" constraints="">Client IP address for security tracking</column>
    <column name="user_agent" type="TEXT" constraints="">Browser user agent information</column>
    <column name="created_at" type="DATETIME" constraints="DEFAULT CURRENT_TIMESTAMP">Log entry timestamp</column>
  </columns>
  <foreign-keys>
    <foreign-key column="user_id" references="users(id)">Links log entry to user when applicable</foreign-key>
  </foreign-keys>
  <indexes>
    <index name="idx_audit_logs_user_id" columns="user_id">Performance optimization for user activity reports</index>
    <index name="idx_audit_logs_created_at" columns="created_at">Performance optimization for time-based queries</index>
  </indexes>
  <sample-data>
    <record>
      <user_id>3</user_id>
      <employee_id>FSW123456</employee_id>
      <action>MODULE_COMPLETED</action>
      <details>{"moduleName": "safety-basics", "completionTime": 1800}</details>
      <ip_address>192.168.1.100</ip_address>
      <created_at>2025-01-08T14:30:00Z</created_at>
    </record>
  </sample-data>
</table>

<table name="hr_notifications">
  <purpose>HR notification tracking and email delivery status monitoring</purpose>
  <columns>
    <column name="id" type="INTEGER" constraints="PRIMARY KEY AUTOINCREMENT">Unique notification identifier</column>
    <column name="user_id" type="INTEGER" constraints="NOT NULL">Foreign key reference to users table</column>
    <column name="employee_id" type="TEXT" constraints="NOT NULL">Employee identifier for notification context</column>
    <column name="notification_type" type="TEXT" constraints="NOT NULL">Notification category/trigger</column>
    <column name="message" type="TEXT" constraints="NOT NULL">Notification message content</column>
    <column name="sent_at" type="DATETIME" constraints="DEFAULT CURRENT_TIMESTAMP">Notification generation timestamp</column>
    <column name="email_sent" type="BOOLEAN" constraints="DEFAULT 0">Email delivery success flag</column>
  </columns>
  <foreign-keys>
    <foreign-key column="user_id" references="users(id)">Links notification to user account</foreign-key>
  </foreign-keys>
  <sample-data>
    <record>
      <user_id>3</user_id>
      <employee_id>FSW123456</employee_id>
      <notification_type>ONBOARDING_STARTED</notification_type>
      <message>New employee John Smith has started onboarding process</message>
      <email_sent>1</email_sent>
    </record>
  </sample-data>
</table>
</schema>

<relationships>
<relationship from="employee_data.user_id" to="users.id" type="many-to-one">
  Each employee record belongs to one user account
</relationship>
<relationship from="onboarding_progress.user_id" to="users.id" type="many-to-one">
  Progress records are linked to user accounts for tracking
</relationship>
<relationship from="form_submissions.user_id" to="users.id" type="many-to-one">
  Form submissions are associated with specific user accounts
</relationship>
<relationship from="audit_logs.user_id" to="users.id" type="many-to-one">
  Audit logs track user activities (null for system events)
</relationship>
<relationship from="hr_notifications.user_id" to="users.id" type="many-to-one">
  Notifications are generated for specific user activities
</relationship>
</relationships>

<data-flows>
<flow name="user-registration">
  <step>User account created in users table with hashed password</step>
  <step>Employee data saved to employee_data table with generated employee_id</step>
  <step>ONBOARDING_STARTED notification created in hr_notifications</step>
  <step>Registration audit logged in audit_logs</step>
</flow>

<flow name="training-progress">
  <step>Module completion recorded in onboarding_progress table</step>
  <step>Progress data stored as JSON blob with scores and timing</step>
  <step>MODULE_COMPLETED notification sent to HR</step>
  <step>Activity logged in audit_logs for compliance</step>
</flow>

<flow name="form-submission">
  <step>Form data validated and stored in form_submissions table</step>
  <step>Digital signature saved as base64 encoded image</step>
  <step>IP address and user agent captured for audit trail</step>
  <step>FORM_SUBMITTED notification triggered for HR</step>
  <step>Submission logged in audit_logs with form type</step>
</flow>

<flow name="hr-notifications">
  <step>System event triggers notification creation</step>
  <step>Notification record saved to hr_notifications table</step>
  <step>Email sent to HR team if SMTP configured</step>
  <step>Email delivery status updated in email_sent field</step>
  <step>Failed notifications logged for retry processing</step>
</flow>
</data-flows>

<setup-procedures>
<procedure name="database-initialization">
  <command>node setup-database.js</command>
  <description>Creates database file, tables, indexes, and default users</description>
  <output>
    - Database tables created successfully
    - Default users: admin/admin2025!, hr/hr2025!, employee/fsw2025!
    - Environment file template created (.env.example)
  </output>
</procedure>

<procedure name="environment-configuration">
  <step>Copy .env.example to .env</step>
  <step>Update JWT_SECRET with secure random key</step>
  <step>Configure SMTP settings for email notifications</step>
  <step>Set production database path if needed</step>
  <step>Update HR and admin email addresses</step>
</procedure>

<procedure name="production-deployment">
  <step>Run setup-database.js to initialize production database</step>
  <step>Configure .env with production settings</step>
  <step>Set NODE_ENV=production</step>
  <step>Configure proper file permissions on database file</step>
  <step>Set up database backup procedures</step>
  <step>Configure monitoring and health checks</step>
</procedure>
</setup-procedures>

<backup-recovery>
<backup-strategy>
  <automated-backups>
    Daily SQLite database file backup using file system tools
    Weekly export of all data via /api/backup/export endpoint
    Real-time audit log export for compliance requirements
  </automated-backups>
  
  <backup-locations>
    Primary: Local file system backup rotation (7 daily, 4 weekly)
    Secondary: Cloud storage backup for disaster recovery
    Compliance: Separate audit log archive for regulatory requirements
  </backup-locations>
</backup-strategy>

<recovery-procedures>
  <database-corruption>
    1. Stop application server immediately
    2. Restore latest backup file to production location
    3. Verify database integrity: sqlite3 onboarding.db "PRAGMA integrity_check;"
    4. Restart application and verify functionality
    5. Review audit logs for data loss assessment
  </database-corruption>
  
  <data-recovery>
    1. Identify scope of data loss from audit logs
    2. Use backup export JSON files to restore specific records
    3. Manually reconstruct lost data using form submissions backups
    4. Verify user authentication and access controls
    5. Notify affected employees of recovery status
  </data-recovery>
</recovery-procedures>
</backup-recovery>

<performance-optimization>
<query-optimization>
  <optimized-queries>
    SELECT with indexed columns for user lookups
    JOIN operations minimized using denormalized employee_id fields
    Batch INSERT operations for bulk data imports
    LIMIT clauses on large result sets for pagination
  </optimized-queries>
  
  <index-strategy>
    Primary indexes on all foreign key relationships
    Composite indexes on frequently queried column combinations
    Time-based indexes on created_at/submitted_at for reporting
    Unique constraints enforced at database level for data integrity
  </index-strategy>
</query-optimization>

<performance-monitoring>
  <metrics>
    Query execution time monitoring via application logs
    Database file size growth tracking
    Connection pool utilization (if using connection pooling)
    Index usage statistics from SQLite EXPLAIN QUERY PLAN
  </metrics>
  
  <optimization-triggers>
    Response time > 1 second: Review query execution plans
    Database size > 100MB: Implement archive/purge procedures
    High CPU usage: Analyze slow queries and add indexes
    Memory usage growth: Check for connection leaks
  </optimization-triggers>
</performance-monitoring>
</performance-optimization>

<data-retention>
<retention-policies>
  <user-data>
    Employee records: Retained for 7 years after employment termination
    Form submissions: Permanent retention for compliance requirements
    Digital signatures: Retained for duration of employment + 3 years
  </user-data>
  
  <audit-data>
    Audit logs: 2 year retention minimum for security compliance
    Login records: 90 day retention for security monitoring
    Progress tracking: Permanent retention for training records
  </audit-data>
  
  <notification-data>
    HR notifications: 1 year retention for operational review
    Email delivery logs: 90 day retention for troubleshooting
    System events: 6 month retention for operational analysis
  </notification-data>
</retention-policies>

<cleanup-procedures>
  <manual-cleanup>
    DELETE FROM audit_logs WHERE created_at < date('now', '-2 years')
    DELETE FROM hr_notifications WHERE sent_at < date('now', '-1 year')
    UPDATE users SET is_active = 0 WHERE last_login < date('now', '-90 days')
  </manual-cleanup>
  
  <automated-cleanup>
    Monthly cleanup job for expired audit logs
    Quarterly review of inactive user accounts
    Annual archive of terminated employee data
    Weekly cleanup of temporary/test data
  </automated-cleanup>
</cleanup-procedures>
</data-retention>

<security>
<access-control>
  <role-based-permissions>
    admin: Full database access, user management, system configuration
    hr: Employee data access, reporting, notification management
    employee: Personal data only, progress tracking, form submission
  </role-based-permissions>
  
  <authentication-security>
    bcrypt password hashing with 12+ rounds minimum
    JWT tokens with 8-hour expiration for session management
    Account lockout after 5 failed login attempts in 15 minutes
    IP address logging for all authentication events
  </authentication-security>
</access-control>

<data-protection>
  <encryption-at-rest>
    Database file encryption using SQLite PRAGMA cipher (if available)
    Digital signature data encrypted in storage
    Sensitive form data encrypted with application-level encryption
  </encryption-at-rest>
  
  <data-sanitization>
    Input validation on all form fields before database storage
    SQL injection prevention using parameterized queries exclusively
    XSS protection through output encoding of stored data
    File upload restrictions and content type validation
  </data-sanitization>
</data-protection>

<compliance-features>
  <audit-trail>
    Complete activity logging for all data modifications
    Immutable audit log entries with timestamp verification
    User agent and IP address capture for forensic analysis
    Digital signature verification for form submission integrity
  </audit-trail>
  
  <data-privacy>
    Personal data identification and classification
    Right-to-be-forgotten implementation for GDPR compliance
    Data minimization practices in form design
    Consent tracking for data processing activities
  </data-privacy>
</compliance-features>
</security>

<monitoring-health>
<health-checks>
  <database-health>
    Connection pool availability check
    Database file integrity verification
    Query response time monitoring
    Storage space utilization tracking
  </database-health>
  
  <application-health>
    Authentication system availability
    Email notification service status
    Form submission processing capacity
    Audit logging functionality verification
  </application-health>
</health-checks>

<alerting-thresholds>
  <performance-alerts>
    Database query time > 2 seconds: Warning alert
    Database file size > 500MB: Capacity planning alert
    Failed authentication rate > 10%: Security alert
    Email delivery failure rate > 5%: System alert
  </performance-alerts>
  
  <security-alerts>
    Multiple failed login attempts from single IP: Immediate alert
    Unusual data access patterns: Investigation alert
    Database connection errors: System health alert
    Audit log gaps or failures: Compliance alert
  </security-alerts>
</alerting-thresholds>
</monitoring-health>

<troubleshooting>
<common-issues>
  <issue name="database-locked">
    <symptom>Error: database is locked</symptom>
    <cause>Long-running transaction or connection not properly closed</cause>
    <solution>
      1. Check for hung processes: ps aux | grep node
      2. Kill hung processes if found
      3. Restart application server
      4. Verify database integrity after restart
    </solution>
  </issue>
  
  <issue name="authentication-failures">
    <symptom>Users cannot log in with correct credentials</symptom>
    <cause>Password hash corruption or JWT secret mismatch</cause>
    <solution>
      1. Check users table for password_hash field integrity
      2. Verify JWT_SECRET environment variable consistency
      3. Reset user password using setup-database.js if needed
      4. Clear browser cache and cookies
    </solution>
  </issue>
  
  <issue name="form-submission-errors">
    <symptom>Forms fail to save or submit</symptom>
    <cause>Database constraint violations or validation errors</cause>
    <solution>
      1. Check application logs for specific error messages
      2. Verify unique constraints on form_type per user
      3. Validate JSON data format in form_data field
      4. Check for digital signature encoding issues
    </solution>
  </issue>
  
  <issue name="email-notification-failures">
    <symptom>HR notifications not being sent</symptom>
    <cause>SMTP configuration errors or email service issues</cause>
    <solution>
      1. Verify SMTP settings in .env file
      2. Test email service connectivity
      3. Check hr_notifications table for queued messages
      4. Review email service logs for delivery errors
    </solution>
  </issue>
</common-issues>

<diagnostic-queries>
  <query name="check-user-accounts">
    <sql>SELECT username, role, last_login, is_active FROM users ORDER BY created_at;</sql>
    <purpose>Verify user account status and recent activity</purpose>
  </query>
  
  <query name="progress-summary">
    <sql>
      SELECT 
        e.name, 
        e.position, 
        COUNT(p.module_name) as completed_modules,
        COUNT(f.form_type) as submitted_forms
      FROM employee_data e
      LEFT JOIN onboarding_progress p ON e.user_id = p.user_id
      LEFT JOIN form_submissions f ON e.user_id = f.user_id
      GROUP BY e.user_id;
    </sql>
    <purpose>Review overall onboarding progress by employee</purpose>
  </query>
  
  <query name="recent-activity">
    <sql>SELECT action, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20;</sql>
    <purpose>Review recent system activity for troubleshooting</purpose>
  </query>
  
  <query name="notification-status">
    <sql>
      SELECT 
        notification_type, 
        COUNT(*) as total,
        SUM(email_sent) as sent_successfully
      FROM hr_notifications 
      GROUP BY notification_type;
    </sql>
    <purpose>Check email notification delivery success rates</purpose>
  </query>
</diagnostic-queries>
</troubleshooting>

<patterns>
<pattern name="secure-data-access">
  // Always use parameterized queries to prevent SQL injection
  const result = await database.get(
    'SELECT * FROM users WHERE username = ? AND is_active = 1',
    [username.toLowerCase()]
  );
  
  // Verify user permissions before data access
  if (req.user.role !== 'hr' && req.user.id !== targetUserId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
</pattern>

<pattern name="audit-logging">
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
</pattern>

<pattern name="transaction-management">
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
</pattern>

<pattern name="data-validation">
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
</pattern>
</patterns>