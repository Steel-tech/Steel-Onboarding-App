# Steel Onboarding App - System Architecture

## Overview

The Steel Onboarding Application is a comprehensive, production-ready employee onboarding system for Flawless Steel Welding. It combines modern web technologies with secure data management to provide an engaging, compliant, and efficient onboarding experience for new employees.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Web Browser (Chrome/Firefox/Safari/Edge 90+)                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │   index.html    │ │   styles.css    │ │   script.js     │                │
│  │   - Main UI     │ │   - Responsive  │ │   - State Mgmt  │                │
│  │   - Forms       │ │   - Company     │ │   - Analytics   │                │
│  │   - Navigation  │ │     Branding    │ │   - LocalStorage│                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
│              │                    │                    │                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │  auth.js        │ │ api-client.js   │ │event-handlers.js│                │
│  │  - Supabase     │ │ - API Layer     │ │ - User Events   │                │
│  │    Auth         │ │ - HTTP Requests │ │ - Form Handling │                │
│  │  - JWT Tokens   │ │ - Error Mgmt    │ │ - Progress      │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/TLS 1.2+
                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION TIER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Node.js + Express Server (server.js)                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │  Authentication │ │   API Endpoints │ │  Business Logic │                │
│  │  - JWT Verify   │ │   - Employee    │ │  - Progress     │                │
│  │  - Supabase     │ │   - Progress    │ │  - Validation   │                │
│  │    Integration  │ │   - Forms       │ │  - Email        │                │
│  │  - Role Guards  │ │   - HR Reports  │ │  - Audit Logs   │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
│              │                    │                    │                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │  Validators     │ │   Email Service │ │  Database Layer │                │
│  │  - Input Valid  │ │   - Nodemailer  │ │  - PostgreSQL   │                │
│  │  - Rate Limits  │ │   - HR Notify   │ │  - Connection   │                │
│  │  - Audit Logs   │ │   - Templates   │ │    Pool         │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ PostgreSQL Protocol
                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATA TIER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL Database                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │   User Tables   │ │ Employee Tables │ │   Audit Tables  │                │
│  │   - users       │ │ - employee_data │ │ - audit_logs    │                │
│  │   - roles       │ │ - progress      │ │ - form_submit   │                │
│  │   - sessions    │ │ - modules       │ │ - login_logs    │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
│              │                    │                    │                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    Row-Level Security (RLS)                            │  │
│  │  - User isolation  - Data encryption  - Access policies              │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Layer
- **HTML5**: Semantic markup with accessibility features (ARIA, skip navigation)
- **CSS3**: Modern responsive design with CSS Grid/Flexbox
- **Vanilla JavaScript (ES6+)**: No frameworks, direct DOM manipulation
- **Font Awesome**: Professional iconography
- **LocalStorage**: Client-side state persistence

### Backend Layer
- **Node.js (18+)**: JavaScript runtime environment
- **Express.js**: Web application framework
- **JWT**: JSON Web Token authentication
- **bcrypt**: Password hashing (12+ rounds)
- **Helmet**: Security headers middleware
- **CORS**: Cross-origin resource sharing
- **express-rate-limit**: API rate limiting
- **express-validator**: Input validation and sanitization

### Database Layer
- **PostgreSQL**: Primary relational database
- **Supabase**: Database-as-a-Service with built-in authentication
- **Connection Pooling**: Optimized for serverless/cloud deployment

### Security & Validation
- **Content Security Policy**: Strict CSP headers
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: Tiered rate limits (5 auth attempts, 100 general requests/15min)
- **Audit Logging**: Complete action tracking with IP/user-agent

### Email & Notifications
- **Nodemailer**: Email service integration
- **HTML Templates**: Rich HTML email notifications
- **SMTP**: Configurable email delivery (Gmail/custom SMTP)

## Component Interactions

### Frontend → Backend Communication

```javascript
// API Client Pattern (api-client.js)
const API = {
    baseURL: '/api',
    
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };
        
        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        return response.json();
    },
    
    // Employee data submission
    async saveEmployeeData(data) {
        return this.request('/employee/data', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};
```

### Backend → Database Communication

```javascript
// Database Layer (database.js)
class Database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production',
            max: 5,     // Connection pool size
            min: 0,     // Serverless scaling
            idleTimeoutMillis: 10000
        });
    }
    
    async saveEmployee(userData) {
        const result = await this.pool.query(
            'INSERT INTO employee_data (name, email, position) VALUES ($1, $2, $3) RETURNING id',
            [userData.name, userData.email, userData.position]
        );
        return result.rows[0];
    }
}
```

## Authentication Flow

### Dual Authentication System

The application implements a sophisticated dual authentication system combining Express JWT with Supabase Auth for maximum flexibility and security.

#### 1. Express JWT Authentication (Primary)

```
┌─────────────┐    POST /api/auth/login    ┌─────────────┐
│   Client    │ ─────────────────────────> │   Server    │
│             │                            │             │
│             │ <───── JWT Token ────────── │   bcrypt    │
│             │                            │   verify    │
└─────────────┘                            └─────────────┘
      │                                           │
      │ Bearer token in headers                   │
      │                                           │
      v                                           v
┌─────────────┐    All API requests       ┌─────────────┐
│ LocalStorage│ ─────────────────────────> │ JWT Verify  │
│   Token     │                            │ Middleware  │
└─────────────┘                            └─────────────┘
```

#### 2. Supabase Auth Integration (Secondary)

```javascript
// Supabase Authentication (auth.js)
class SupabaseAuthManager {
    async initializeAuth() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            // Sync with Express auth system
            await this.syncWithExpressAuth(session.user);
        } else {
            this.showAuthModal();
        }
    }
    
    async handleSupabaseLogin(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });
        
        if (!error) {
            // Get Express JWT token
            const expressToken = await this.getExpressToken(data.user);
            localStorage.setItem('authToken', expressToken);
        }
    }
}
```

### Authentication Security Measures

- **Password Hashing**: bcrypt with 12+ rounds
- **JWT Expiration**: 8-hour token lifetime
- **Rate Limiting**: 5 login attempts per 15 minutes
- **Account Lockout**: 15-minute lockout after failed attempts
- **Session Validation**: Token verification on every API request
- **Audit Logging**: All authentication events logged with IP/user-agent

## Data Flow Architecture

### 1. Employee Registration Flow

```
Employee Form → Client Validation → API Request → Server Validation
     ↓              ↓                    ↓              ↓
Store Local → Update Progress → JWT Auth Check → Database Insert
     ↓              ↓                    ↓              ↓
Update UI  → Save State → Audit Log → Email Notification
```

### 2. Progress Tracking Flow

```javascript
// Progress tracking pattern
function updateProgress() {
    // Calculate completion percentage
    const totalRequirements = 15; // Safety modules + forms + videos
    const completed = getCompletedCount();
    const percentage = Math.round((completed / totalRequirements) * 100);
    
    // Update state and UI
    appState.progress = percentage;
    saveState(); // LocalStorage persistence
    
    // Sync with server
    API.saveProgress({
        userId: currentUser.id,
        progress: percentage,
        completedModules: appState.completedModules
    });
}
```

### 3. Form Submission Flow

```
Form Fill → Client Validate → Digital Sign → API Submit
    ↓           ↓               ↓             ↓
Save Draft → Show Errors → Canvas Data → Server Validate
    ↓           ↓               ↓             ↓
Auto-save → Block Submit → Store Signature → Database Save
    ↓                           ↓             ↓
Progress++ ← Email HR ← Audit Log ← Success Response
```

## Security Architecture

### Multi-Layer Security Approach

#### 1. Network Security
- **HTTPS/TLS 1.2+**: All communications encrypted
- **CORS Policy**: Restricted origin access
- **Security Headers**: Comprehensive HTTP security headers
- **Content Security Policy**: Strict resource loading policies

```javascript
// Security headers (server.js)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"]
        }
    }
}));
```

#### 2. Application Security
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Protection**: Parameterized queries only
- **XSS Protection**: Input sanitization and CSP
- **Rate Limiting**: Tiered rate limits per endpoint
- **Authentication**: JWT with secure signing

```javascript
// Input validation example (validators.js)
const employeeDataValidation = [
    body('name').isLength({ min: 2, max: 100 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
    body('position').isIn(['Welder', 'Fabricator', 'Supervisor', 'Other'])
];
```

#### 3. Database Security
- **Row-Level Security**: Supabase RLS policies
- **Connection Encryption**: TLS-encrypted database connections
- **Access Control**: Role-based database access
- **Audit Trail**: Complete action logging

#### 4. Data Protection
- **Password Security**: bcrypt hashing (12+ rounds)
- **Session Management**: Secure JWT tokens
- **Data Encryption**: At-rest and in-transit encryption
- **Backup Security**: Encrypted backup exports

## Third-Party Integrations

### 1. n8n Workflow Automation

The application includes specialized n8n Super Code modules for workflow automation:

#### Onboarding Processor (`fsw-onboarding-processor.js`)
```javascript
// n8n workflow integration
function processOnboardingData(inputData) {
    return {
        employeeId: generateEmployeeId(),
        processedData: validateAndTransform(inputData),
        trainingSchedule: generateTrainingSchedule(inputData.position),
        notifications: {
            hr: true,
            supervisor: inputData.supervisor ? true : false
        }
    };
}
```

#### Report Generator (`fsw-report-generator.js`)
```javascript
// Automated reporting for HR
function generateCompletionReport(employeeData) {
    return {
        reportType: 'ONBOARDING_COMPLETE',
        employee: employeeData,
        completionMetrics: calculateMetrics(employeeData),
        complianceStatus: checkCompliance(employeeData),
        nextSteps: generateNextSteps(employeeData.position)
    };
}
```

### 2. Email Notification System

```javascript
// Email service integration (server.js)
class EmailService {
    async sendHRNotification(employeeData, notificationType) {
        const emailContent = this.generateEmailTemplate(employeeData, notificationType);
        
        await this.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.HR_EMAIL,
            subject: `Onboarding Update: ${employeeData.name}`,
            html: emailContent
        });
    }
    
    generateEmailTemplate(data, type) {
        // Rich HTML email with company branding
        return `
            <div style="font-family: Arial, sans-serif;">
                <h2 style="color: #2c3e50;">Flawless Steel Welding</h2>
                <div style="background: #f8f9fa; padding: 20px;">
                    <h3>${type}</h3>
                    <p><strong>Employee:</strong> ${data.name}</p>
                    <p><strong>Position:</strong> ${data.position}</p>
                    <p><strong>Progress:</strong> ${data.progress}%</p>
                </div>
            </div>
        `;
    }
}
```

### 3. YouTube Integration

For orientation videos with progress tracking:

```javascript
// Video player integration (script.js)
function initializeVideoPlayer() {
    // YouTube API integration
    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player('orientation-video', {
            events: {
                'onStateChange': handleVideoStateChange
            }
        });
    };
    
    function handleVideoStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            startProgressTracking();
        }
    }
}
```

## Deployment Architecture

### Production Deployment Options

#### 1. Vercel Deployment (Recommended)
```json
// vercel.json
{
  "rewrites": [
    { "source": "/", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

#### 2. Traditional Server Deployment
```bash
# Production setup
npm install --production
NODE_ENV=production node server.js

# Process management with PM2
pm2 start server.js --name "fsw-onboarding"
pm2 startup
pm2 save
```

### Environment Configuration

```bash
# Required environment variables
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_secure_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=notifications@fsw-denver.com
EMAIL_PASS=your_app_password
HR_EMAIL=tasha@fsw-denver.com
```

### Database Migration Strategy

```javascript
// Database setup and migration (setup-database.js)
async function createDatabaseTables() {
    const migrations = [
        'CREATE_USERS_TABLE',
        'CREATE_EMPLOYEE_DATA_TABLE', 
        'CREATE_PROGRESS_TABLE',
        'CREATE_AUDIT_LOGS_TABLE',
        'ADD_INDEXES',
        'ADD_CONSTRAINTS'
    ];
    
    for (const migration of migrations) {
        await runMigration(migration);
    }
}
```

### Monitoring & Logging

#### Health Check Endpoint
```javascript
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'healthy',
        database: await checkDatabaseHealth(),
        email: checkEmailService(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    };
    
    res.json(health);
});
```

#### Performance Monitoring
- **Response Time Tracking**: API endpoint performance
- **Database Query Monitoring**: Slow query identification  
- **Error Rate Monitoring**: Application error tracking
- **Resource Usage**: Memory and CPU monitoring

## Performance Optimizations

### Frontend Optimizations
- **Lazy Loading**: Progressive content loading
- **LocalStorage Caching**: Client-side state persistence
- **Debounced Saves**: Reduced API calls during form input
- **Progressive Enhancement**: Works without JavaScript

### Backend Optimizations
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: Indexed database queries
- **Caching Strategy**: Session and response caching
- **Compression**: gzip response compression

### Database Optimizations
- **Indexing Strategy**: Optimized query performance
- **Connection Limits**: Serverless-friendly pooling
- **Query Planning**: Efficient join strategies
- **Data Archiving**: Historical data management

## Compliance & Audit Features

### Regulatory Compliance
- **OSHA Requirements**: Safety training documentation
- **Employee Records**: Comprehensive data retention
- **Digital Signatures**: Legally binding form completion
- **Audit Trail**: Complete action tracking

### Data Retention
- **Employee Data**: 7-year retention policy
- **Audit Logs**: 2-year detailed logging
- **Form Submissions**: Permanent digital archive
- **Training Records**: Compliance documentation

## Scalability Considerations

### Horizontal Scaling
- **Stateless Architecture**: Session-independent design
- **Database Scaling**: Supabase auto-scaling
- **Load Balancing**: Multi-instance deployment
- **CDN Integration**: Static asset distribution

### Vertical Scaling
- **Connection Pooling**: Database connection optimization
- **Memory Management**: Efficient resource usage
- **Process Optimization**: Single-threaded Node.js optimization

## Maintenance & Updates

### Automated Maintenance
- **Database Backups**: Daily automated backups
- **Log Rotation**: Automated log management
- **Health Monitoring**: Automated uptime checks
- **Security Updates**: Dependency vulnerability scanning

### Manual Maintenance Tasks
- **Content Updates**: Company information updates
- **User Management**: Account creation and role assignment
- **Report Generation**: HR analytics and compliance reports
- **System Monitoring**: Performance analysis and optimization

---

**Architecture Review Date**: September 2025
**Next Review Due**: March 2026
**Document Version**: 1.0
**Last Updated By**: System Architect