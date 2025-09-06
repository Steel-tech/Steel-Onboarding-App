# Flawless Steel Welding - Complete Onboarding System Setup Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

---

## 🎯 System Overview

### What You're Building
A complete employee onboarding system for Flawless Steel Welding that includes:
- **Frontend**: Interactive web application for new employees
- **Backend**: Express.js server with SQLite database
- **Integration**: n8n workflow automation with Super Code agents
- **Features**: Video training, document management, progress tracking, compliance monitoring

### Key Components

#### 1. **Web Application** (Frontend)
- **Location**: `/Steel Onboarding App/index.html`
- **Features**:
  - Employee information collection
  - Orientation video player with tracking
  - Safety training modules
  - Document library with real PDFs
  - Digital signature capture
  - Progress tracking & analytics
  - Mobile-responsive design

#### 2. **Backend Server** (Node.js/Express)
- **Location**: `/Steel Onboarding App/server.js`
- **Features**:
  - RESTful API endpoints
  - SQLite database for data persistence
  - JWT authentication
  - Email notifications
  - Security validation
  - Audit logging

#### 3. **n8n Integration** (Workflow Automation)
- **Super Code Agents**:
  - `fsw-enhanced-onboarding-processor.js` - Main data processor
  - `fsw-webhook-receiver.js` - Webhook data handler
  - `fsw-report-generator.js` - Report generation
- **Capabilities**:
  - Real-time data processing
  - Automated notifications
  - Compliance monitoring
  - Report generation

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     EMPLOYEE BROWSER                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Onboarding Web Application                  │     │
│  │  • HTML/CSS/JavaScript                             │     │
│  │  • Video Player                                    │     │
│  │  • Document Viewer                                 │     │
│  │  • Progress Tracking                               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS/API Calls
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Express.js Application (Port 3001)          │     │
│  │  • Authentication (JWT)                            │     │
│  │  • API Endpoints                                   │     │
│  │  • Data Validation                                 │     │
│  │  • Email Service                                   │     │
│  └────────────────────────────────────────────────────┘     │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │              SQLite Database                        │     │
│  │  • Employee Records                                │     │
│  │  • Progress Data                                   │     │
│  │  • Compliance Status                               │     │
│  │  • Analytics                                       │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Webhook Events
┌─────────────────────────────────────────────────────────────┐
│                       n8n AUTOMATION                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Webhook Trigger Node                     │     │
│  │         Receives: Employee Updates                  │     │
│  └────────────────────────────────────────────────────┘     │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │     Super Code: fsw-webhook-receiver.js             │     │
│  │  • Validates webhook data                          │     │
│  │  • Routes to appropriate workflow                  │     │
│  └────────────────────────────────────────────────────┘     │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Super Code: fsw-enhanced-onboarding-processor.js   │     │
│  │  • Processes employee data                         │     │
│  │  • Calculates metrics                              │     │
│  │  • Checks compliance                               │     │
│  └────────────────────────────────────────────────────┘     │
│                              │                               │
│                    ┌─────────┴─────────┐                    │
│                    ▼                   ▼                    │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Email Notifications  │  │   Report Generator    │        │
│  │  • HR Alerts         │  │  • PDF Reports        │        │
│  │  • Welcome Emails    │  │  • Compliance Docs    │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

### Required Software
- [ ] Node.js (v14 or higher)
- [ ] npm (v6 or higher)
- [ ] n8n (latest version)
- [ ] Modern web browser (Chrome, Firefox, Safari)
- [ ] Text editor (VS Code recommended)

### Required Accounts
- [ ] Email account for notifications (Gmail recommended)
- [ ] n8n instance (self-hosted or cloud)

---

## 📝 Step-by-Step Setup

### Phase 1: Backend Server Setup

#### Step 1: Install Dependencies
```bash
cd "/Users/vics/Documents/Steel Onboarding App"

# Install Node.js dependencies
npm install express cors helmet bcrypt jsonwebtoken nodemailer sqlite3
npm install express-rate-limit express-validator dotenv
npm install --save-dev nodemon
```

#### Step 2: Configure Environment Variables
Create `.env` file:
```bash
cat > .env << 'EOL'
# Server Configuration
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
BCRYPT_ROUNDS=12

# Database
DB_PATH=./onboarding.db

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
HR_EMAIL=hr@flawlesssteelwelding.com
ADMIN_EMAIL=admin@flawlesssteelwelding.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# n8n Webhook
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/fsw-onboarding
N8N_WEBHOOK_TOKEN=fsw-secure-token-2025

# Session
SESSION_TIMEOUT=1800000
EOL
```

#### Step 3: Initialize Database
```bash
# Run database setup script
node setup-database.js
```

#### Step 4: Start Backend Server
```bash
# For development
npm run dev

# For production
npm start
```

Expected output:
```
🚀 Server running on port 3001
📁 Serving static files from: /Steel Onboarding App
🔐 Security middleware configured
✅ Database connected: onboarding.db
📧 Email service configured
```

---

### Phase 2: n8n Workflow Setup

#### Step 5: Access n8n Instance
1. Open n8n in your browser
2. Create a new workflow named "FSW Onboarding System"

#### Step 6: Create Webhook Trigger
1. Add a **Webhook** node
2. Configure:
   - **Webhook URL**: Copy the generated URL
   - **HTTP Method**: POST
   - **Response Mode**: Immediately
   - **Response Data**: Success Message
   - **Authentication**: Header Auth
   - **Header Name**: x-webhook-token
   - **Header Value**: fsw-secure-token-2025

#### Step 7: Add Webhook Receiver Super Code
1. Add a **Code** node (Super Code)
2. Name it: "Webhook Data Receiver"
3. Copy entire content from `fsw-webhook-receiver.js`
4. Connect to Webhook node

#### Step 8: Add Router Node
1. Add a **Switch** node
2. Configure routing rules:
   ```
   - employee_update → Processing workflow
   - module_completion → Notification workflow
   - document_signed → Compliance workflow
   - emergency_alert → Alert workflow
   ```

#### Step 9: Add Main Processor Super Code
1. Add a **Code** node (Super Code)
2. Name it: "Onboarding Data Processor"
3. Copy entire content from `fsw-enhanced-onboarding-processor.js`
4. Connect to Router node

#### Step 10: Add Database Node
1. Add a **Postgres/MySQL/SQLite** node
2. Configure connection:
   - **Database**: SQLite
   - **File Path**: ./onboarding.db
3. Set operation: Insert/Update

#### Step 11: Add Email Notification
1. Add an **Email** node
2. Configure SMTP:
   ```
   Host: smtp.gmail.com
   Port: 587
   User: your-email@gmail.com
   Password: app-specific-password
   ```
3. Set email template for notifications

#### Step 12: Add Report Generator
1. Add a **Code** node (Super Code)
2. Name it: "Report Generator"
3. Copy content from `fsw-report-generator.js`
4. Connect for weekly/monthly reports

#### Step 13: Save and Activate Workflow
1. Click "Save"
2. Toggle workflow to "Active"
3. Copy webhook URL for backend configuration

---

### Phase 3: Frontend Configuration

#### Step 14: Update API Endpoints
Edit `api-client.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:3001/api',
    WEBHOOK_URL: 'YOUR_N8N_WEBHOOK_URL_HERE'
};
```

#### Step 15: Configure Authentication
Edit `auth.js` to match your JWT settings

#### Step 16: Test Frontend Connection
1. Open `index.html` in browser
2. Open Developer Console (F12)
3. Check for any CORS or connection errors

---

### Phase 4: Integration Testing

#### Step 17: Test Data Flow
1. **Frontend → Backend**:
   ```bash
   # Test employee registration
   curl -X POST http://localhost:3001/api/employees \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@test.com"}'
   ```

2. **Backend → n8n**:
   ```bash
   # Test webhook
   curl -X POST YOUR_N8N_WEBHOOK_URL \
     -H "x-webhook-token: fsw-secure-token-2025" \
     -H "Content-Type: application/json" \
     -d '{"type":"test","data":"test"}'
   ```

#### Step 18: Complete Test Onboarding
1. Open application in browser
2. Fill out employee information
3. Watch orientation video
4. Complete one safety module
5. Download a document
6. Check n8n execution history

---

### Phase 5: Production Deployment

#### Step 19: Security Hardening
```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env with production values
# Enable HTTPS
# Configure firewall rules
```

#### Step 20: Deploy Backend
```bash
# Using PM2 for process management
npm install -g pm2
pm2 start server.js --name "fsw-onboarding"
pm2 save
pm2 startup
```

#### Step 21: Deploy Frontend
1. Host on web server (Apache/Nginx)
2. Configure SSL certificate
3. Set up CDN for assets

#### Step 22: Configure Backups
```bash
# Automated database backup
crontab -e
# Add: 0 2 * * * sqlite3 /path/to/onboarding.db ".backup /path/to/backup/onboarding-$(date +\%Y\%m\%d).db"
```

---

## 🧪 Testing & Validation

### Functional Tests
- [ ] Employee can register
- [ ] Video plays and tracks progress
- [ ] Documents download correctly
- [ ] Progress saves to database
- [ ] Emails send to HR
- [ ] Reports generate properly

### Security Tests
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens working
- [ ] Rate limiting active
- [ ] JWT authentication secure

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Video streams smoothly
- [ ] Database queries optimized

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot connect to database"
```bash
# Check database file exists
ls -la onboarding.db

# Check permissions
chmod 664 onboarding.db

# Reinitialize if needed
node setup-database.js
```

#### Issue: "CORS error in browser"
```javascript
// In server.js, update CORS settings
app.use(cors({
    origin: ['http://localhost:3000', 'YOUR_FRONTEND_URL'],
    credentials: true
}));
```

#### Issue: "Webhook not receiving data"
```bash
# Test webhook directly
curl -X POST YOUR_N8N_WEBHOOK_URL \
  -H "x-webhook-token: fsw-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Check n8n logs
docker logs n8n  # if using Docker
```

#### Issue: "Email not sending"
1. Enable 2-factor authentication on Gmail
2. Generate app-specific password
3. Update EMAIL_PASS in .env
4. Allow "Less secure apps" if needed

#### Issue: "Progress not saving"
```javascript
// Check localStorage in browser console
console.log(localStorage.getItem('onboardingAppState'));

// Clear and retry
localStorage.clear();
location.reload();
```

---

## 🔄 Maintenance

### Daily Tasks
- Monitor error logs
- Check disk space
- Verify backup completion

### Weekly Tasks
- Review n8n workflow executions
- Check email delivery rates
- Update security patches

### Monthly Tasks
- Generate compliance reports
- Review user feedback
- Update training content
- Test disaster recovery

### Quarterly Tasks
- Security audit
- Performance optimization
- Update dependencies
- Review and update documentation

---

## 📊 Monitoring

### Key Metrics to Track
1. **Completion Rate**: % of employees completing onboarding
2. **Time to Complete**: Average days to finish
3. **Module Performance**: Which modules take longest
4. **Error Rate**: Failed API calls or workflows
5. **User Engagement**: Video watch time, document downloads

### Setting Up Monitoring
```javascript
// Add to server.js
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date(),
        database: db ? 'connected' : 'disconnected'
    });
});
```

---

## 🚀 Advanced Features

### Enable Real-time Updates
```javascript
// Add WebSocket support
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    ws.on('message', message => {
        // Broadcast progress updates
        wss.clients.forEach(client => {
            client.send(message);
        });
    });
});
```

### Add Multi-language Support
```javascript
// In script.js
const translations = {
    en: { welcome: "Welcome" },
    es: { welcome: "Bienvenido" }
};
```

### Implement Offline Mode
```javascript
// Service worker for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
```

---

## 📞 Support Contacts

### Technical Support
- **Developer**: Your Name
- **Email**: developer@flawlesssteelwelding.com
- **Phone**: (720) 638-7289

### Business Contacts
- **HR Department**: hr@flawlesssteelwelding.com
- **Management**: admin@flawlesssteelwelding.com

### Emergency Support
- **24/7 Hotline**: (720) 638-7289
- **After Hours**: emergency@flawlesssteelwelding.com

---

## 📝 Appendix

### File Structure
```
Steel Onboarding App/
├── index.html                 # Main application
├── styles.css                 # Styling
├── script.js                  # Frontend logic
├── server.js                  # Backend server
├── setup-database.js          # Database initialization
├── validators.js              # Input validation
├── api-client.js             # API communication
├── auth.js                   # Authentication
├── event-handlers.js         # Event management
├── fsw-enhanced-onboarding-processor.js  # n8n processor
├── fsw-webhook-receiver.js   # n8n webhook handler
├── fsw-report-generator.js   # n8n report generator
├── .env                      # Environment variables
├── package.json              # Dependencies
└── onboarding.db            # SQLite database
```

### API Endpoints
```
POST   /api/auth/login         # Employee login
POST   /api/auth/logout        # Employee logout
GET    /api/employees/:id      # Get employee data
POST   /api/employees          # Create employee
PUT    /api/employees/:id      # Update employee
POST   /api/progress           # Update progress
GET    /api/reports/:id        # Get report
POST   /api/webhook            # n8n webhook
GET    /api/health            # Health check
```

### Database Schema
```sql
-- Employees table
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    employee_id TEXT UNIQUE,
    name TEXT,
    email TEXT,
    position TEXT,
    start_date DATE,
    created_at TIMESTAMP
);

-- Progress table
CREATE TABLE progress (
    id INTEGER PRIMARY KEY,
    employee_id TEXT,
    module_name TEXT,
    completed BOOLEAN,
    completed_at TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    employee_id TEXT,
    document_name TEXT,
    downloaded_at TIMESTAMP
);
```

---

## ✅ Completion Checklist

### Pre-Launch
- [ ] All dependencies installed
- [ ] Database initialized
- [ ] Environment variables configured
- [ ] n8n workflow created and tested
- [ ] Email service configured
- [ ] SSL certificates installed
- [ ] Backup system configured
- [ ] Monitoring setup
- [ ] Documentation complete
- [ ] User training complete

### Post-Launch
- [ ] First employee onboarded successfully
- [ ] All notifications working
- [ ] Reports generating
- [ ] No critical errors in logs
- [ ] Performance metrics acceptable
- [ ] User feedback collected
- [ ] Security audit passed

---

**Document Version**: 2.0  
**Last Updated**: January 2025  
**Author**: FSW Development Team  
**Status**: Production Ready

---

## 🎉 Congratulations!

Your Flawless Steel Welding Onboarding System is now fully configured and ready for production use. This system will streamline your employee onboarding process while ensuring compliance and safety standards are met.

For additional support or customization requests, please contact the development team.

**Remember**: Safety First, Quality Always!
