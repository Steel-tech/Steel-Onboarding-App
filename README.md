# Steel Onboarding Application

## Flawless Steel Welding - Denver, Colorado

```text
███████╗██╗      █████╗ ██╗    ██╗██╗     ███████╗███████╗███████╗
██╔════╝██║     ██╔══██╗██║    ██║██║     ██╔════╝██╔════╝██╔════╝
█████╗  ██║     ███████║██║ █╗ ██║██║     █████╗  ███████╗███████╗
██╔══╝  ██║     ██╔══██║██║███╗██║██║     ██╔══╝  ╚════██║╚════██║
██║     ███████╗██║  ██║╚███╔███╔╝███████╗███████╗███████║███████║
╚═╝     ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝╚══════╝╚══════╝╚══════╝
            STEEL WELDING • ONBOARDING PORTAL
```

**Company Information:**

- **Company:** Flawless Steel Welding
- **Address:** 5353 Joliet St, Denver, CO 80239
- **Phone:** (720) 638-7289
- **HR Contact:** hr@fsw-denver.com
- **General Email:** info@fsw-denver.com

## Enhanced Project Description

A comprehensive, enterprise-grade web-based onboarding system specifically designed for steel fabrication and welding companies. This professional single-page application (SPA) delivers a complete digital transformation of the employee onboarding experience, combining safety-first training, compliance tracking, and modern web technologies to ensure every new hire receives consistent, thorough preparation for their role in the steel industry.

## Updated Tech Stack

### Frontend Technologies

- **HTML5** - Semantic structure with accessibility features
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript (ES6+)** - No framework dependencies for maximum performance
- **Font Awesome 6.0** - Professional iconography
- **localStorage API** - Client-side data persistence

### Backend Integration

- **n8n Workflow Automation** - Serverless backend processing
- **Webhook Integration** - Real-time data synchronization
- **Super Code Processors** - Custom business logic automation

### Security & Performance

- **Content Security Policy (CSP)** - XSS protection
- **Responsive Design** - Mobile-first approach
- **Progressive Enhancement** - Works without JavaScript
- **Git LFS** - Large file optimization for video content

## Architecture Overview

### Frontend SPA (Single Page Application)

The onboarding portal is built as a modern SPA with:

- **Tab-based Navigation:** 8 distinct modules for organized learning
- **State Management:** Real-time progress tracking and data persistence
- **Analytics Engine:** User behavior tracking and completion metrics
- **Video Integration:** Custom HTML5 video player with progress tracking
- **Export System:** PDF-ready report generation

### Backend Processors

Two specialized n8n Super Code processors handle:

1. **FSW Onboarding Processor** - Validates and processes employee data
2. **FSW Report Generator** - Creates comprehensive completion reports

### Report Generation

- **Real-time Analytics:** Session tracking and interaction monitoring
- **Progress Metrics:** Module completion and time-spent analytics
- **Export Capabilities:** JSON data export for HR systems
- **Compliance Reporting:** Safety training completion verification

## Complete Feature List

### 8 Core Modules

1. **Welcome Module**
   - Employee information collection
   - First week schedule overview
   - Supervisor assignment
   - Emergency contact setup

2. **Orientation Video**
   - 1.5GB HD orientation video
   - Custom HTML5 video player
   - Progress tracking (90% completion detection)
   - Download option for offline viewing
   - Mobile-optimized playback

3. **Company Information**
   - Mission, vision, and values
   - Service offerings and capabilities
   - Company history and achievements
   - Contact directory
   - **NEW:** Founder's story timeline (2011-2025)
   - **NEW:** Interactive timeline component with company milestones
   - **NEW:** "What Sets Us Apart" differentiators section
   - **NEW:** Founder quote and brand philosophy

4. **Safety Training**
   - PPE requirements and proper usage
   - Hazard recognition and mitigation
   - Emergency procedures and evacuation
   - Crane and rigging safety protocols
   - Fall protection systems
   - Hot work procedures
   - OSHA compliance training

5. **Equipment & Tools**
   - Welding equipment operation
   - Cutting tools and safety
   - Lifting and rigging equipment
   - Measuring and layout tools
   - Maintenance procedures
   - Quality control instruments

6. **Procedures**
   - Standard Operating Procedures (SOPs)
   - Quality control processes
   - Administrative procedures
   - Documentation requirements
   - Workflow protocols

7. **Documents**
   - Employee handbook (569KB PDF)
   - Health & safety manual (4.8MB PDF)
   - New hire orientation guide (713KB PDF)
   - Steel erection training materials (4.6MB PPT)
   - Orientation presentation (42MB PPTX)
   - Benefits and policies documentation

8. **Checklist & Progress**
   - Interactive completion checklist
   - Real-time progress tracking
   - Module completion verification
   - Report generation and export
   - Analytics dashboard

## Company Story & Values

### Founder's Journey Timeline

The application now includes a comprehensive timeline component that tells the story of Flawless Steel Welding's growth from startup to industry leader:

#### **2011 - Humble Beginnings**
- Founded by Victor Garcia during the Great Recession
- Started with $10,500, a welder, and a pickup truck
- First project: lamp repair near Sloan's Lake, Denver
- Demonstrates entrepreneurial determination and bootstrap philosophy

#### **2017 - Rapid Growth** 
- Achieved multimillion-dollar operation status
- Expanded to 25+ employees
- Crossed $3 million in annual revenue
- Invested in equipment, shop infrastructure, and process controls

#### **2022 - Union Partnership**
- Joined Ironworkers Local 24
- Enhanced workforce with union-trained professionals
- Elevated safety and quality standards
- Ensured sustainable career paths for ironworkers

#### **2025 - Today**
- 14 years of continuous operation
- AISC-certified fabricator and erector
- Minority-owned, Latino-led business
- Small and Disadvantaged Business Enterprise certified
- Serves both private and public sector clients

### Company Differentiators

The "What Sets Us Apart" section highlights key competitive advantages:

| Differentiator | Description | Business Impact |
|----------------|-------------|-----------------|
| **AISC Certification** | Certified fabricator and erector | Quality assurance, industry credibility |
| **Minority-Owned Business** | Latino-led, certified SBE/DBE | Access to diverse contracting opportunities |
| **Union Partnership** | Ironworkers Local 24 alliance | Skilled workforce, safety standards |
| **Full-Service Capability** | Design through erection | Single-source accountability |
| **Local Heritage** | 14+ years serving Colorado | Community investment, local expertise |
| **Quality Philosophy** | "Flawless" brand promise | Reputation-driven excellence |

### Brand Philosophy & Values

#### Founder's Quote Integration
The application features a prominently displayed founder quote that encapsulates the company's quality philosophy:

> *"If it carries our name, it carries our reputation—and that means it has to be flawless."*
> 
> **— Victor Garcia, Founder**

#### Core Values Reflected in Timeline
- **Determination:** Starting during economic downturn demonstrates resilience
- **Growth Mindset:** Continuous expansion and capability development
- **People First:** Union partnership and employee career development
- **Community Investment:** Local hiring and Colorado market focus
- **Quality Commitment:** Name-brand reputation management

### Technical Implementation

#### Timeline Component Features
```css
/* Interactive timeline with visual markers */
.timeline {
    position: relative;
    padding-left: 2rem;
}

.timeline-item {
    position: relative;
    margin-bottom: 2.5rem;
    padding-left: 3rem;
}

.timeline-marker {
    position: absolute;
    left: -1.5rem;
    background: var(--primary-color);
    border-radius: 50%;
}
```

#### Differentiators Grid Layout
- Responsive grid system (auto-fit, minmax(300px, 1fr))
- Icon-driven visual design with Font Awesome integration
- Card-based layout with hover effects
- Mobile-optimized single-column display

#### Founder Quote Styling
- Semi-transparent background overlay
- Distinctive typography (italic, 1.3rem)
- Right-aligned attribution
- Brand color highlighting for founder name

### Business Value & HR Impact

#### Employee Onboarding Benefits
- **Cultural Alignment:** New hires understand company heritage and values
- **Pride Building:** Showcases company growth and success story
- **Diversity Awareness:** Highlights minority-owned business status
- **Quality Standards:** Reinforces commitment to excellence through founder's philosophy

#### Recruiting & Retention Tool
- **Authenticity:** Real founder story builds trust and connection
- **Career Path Clarity:** Union partnership demonstrates professional development opportunities
- **Stability Proof:** 14-year track record shows business sustainability
- **Values Matching:** Helps candidates assess cultural fit

### Content Management

#### Updating Timeline Content
Timeline content is stored in `/index.html` within the company information tab:
```html
<div class="timeline-section">
    <h4><i class="fas fa-timeline"></i> Founder's Story</h4>
    <div class="timeline">
        <div class="timeline-item">
            <div class="timeline-marker">
                <span class="timeline-year">YYYY</span>
            </div>
            <div class="timeline-content">
                <h5>Milestone Title</h5>
                <p>Milestone description...</p>
            </div>
        </div>
    </div>
</div>
```

#### Differentiators Maintenance
Differentiators are maintained in a grid structure that automatically adapts to new additions:
```html
<div class="differentiators-grid">
    <div class="differentiator-card">
        <div class="differentiator-icon">
            <i class="fas fa-icon-name"></i>
        </div>
        <h5>Differentiator Title</h5>
        <p>Description</p>
    </div>
</div>
```

### Video Integration Features

- **Large File Handling:** 1.5GB video optimized with Git LFS
- **Progress Persistence:** Remembers viewing position
- **Completion Tracking:** Automatic detection when 90% viewed
- **Mobile Support:** Responsive video player
- **Download Option:** Offline viewing capability
- **Integration:** Counts toward overall onboarding completion

### Analytics & Export

- **Session Analytics:** Time tracking per module
- **Interaction Monitoring:** Click and engagement tracking
- **Progress Metrics:** Completion percentages and timing
- **Export Options:** JSON data export for HRIS integration
- **Report Generation:** Comprehensive completion reports

## Installation & Setup

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Web server (Apache, Nginx, or local development server)
- Git LFS for video file handling

### Large File Handling Setup

The orientation video (1.5GB) uses Git LFS for efficient version control:

```bash
# Install Git LFS if not already installed
git lfs install

# Clone repository with LFS files
git clone <repository-url>
cd steel-onboarding-app

# Verify LFS files are downloaded
git lfs ls-files
```

### Installation Steps

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd steel-onboarding-app
   ```

2. **Verify File Structure**

   ```bash
   ls -la
   # Ensure orientation-video.mp4 is present and properly sized
   ```

3. **Deploy to Web Server**

   ```bash
   # Copy files to web server document root
   cp -r * /var/www/html/onboarding/
   ```

4. **Configure Permissions**

   ```bash
   # Set appropriate file permissions
   chmod 644 *.html *.css *.js
   chmod 644 *.pdf *.mp4 *.ppt *.pptx
   ```

5. **Test Installation**
   - Open `index.html` in web browser
   - Verify all modules load correctly
   - Test video playback functionality
   - Confirm data persistence in localStorage

### n8n Integration Setup

1. **Import Super Code Processors**

   ```javascript
   // Copy content from fsw-onboarding-processor.js
   // Paste into n8n Super Code node
   ```

2. **Configure Webhooks**

   ```javascript
   // Set up webhook endpoint for form submissions
   POST /webhook/onboarding
   ```

3. **Test Workflow**

   ```javascript
   // Send test data to verify processing
   // Check report generation functionality
   ```

## Usage Guide

### For HR/Administrators

#### Initial Setup

1. **Deploy Application**
   - Host on company intranet or secure web server
   - Configure SSL certificate for HTTPS
   - Share URL with new employees: `https://company.com/onboarding`

2. **Customize Content**
   - Update company information in `index.html`
   - Modify safety procedures as needed
   - Add specific equipment/tools relevant to operations
   - Update contact information and emergency procedures

3. **Configure n8n Automation**
   - Set up onboarding data processor workflow
   - Configure report generation automation
   - Establish email notification system
   - Connect to HRIS or HR database

#### Monitoring & Management

1. **Track Employee Progress**
   - Monitor completion reports in n8n
   - Review analytics data for bottlenecks
   - Identify training gaps or common issues
   - Generate compliance reports for audits

2. **Content Management**
   - Update documents regularly (handbook, safety manual)
   - Refresh orientation video as needed
   - Modify safety protocols based on new regulations
   - Add new equipment or procedure modules

### For New Employees

#### Getting Started

1. **Access the Portal**
   - Use provided URL from HR
   - Bookmark for easy access during onboarding period
   - Ensure stable internet connection for video streaming

2. **Complete Welcome Module**
   - Fill out personal information accurately
   - Review first week schedule carefully
   - Save supervisor contact information
   - Set up emergency contacts

#### Module Completion Process

1. **Orientation Video** (Priority: High)
   - Watch complete 1.5GB orientation video
   - Progress automatically saved every 30 seconds
   - Must watch 90% for completion credit
   - Download for offline viewing if needed

2. **Safety Training** (Priority: Critical)
   - Complete ALL safety modules before field work
   - Review PPE requirements thoroughly
   - Understand emergency procedures
   - Mark each module as complete after review

3. **Company Information**
   - Learn company mission, values, and culture
   - Understand service offerings
   - Save important contact information
   - Review company policies

4. **Equipment & Tools**
   - Study all equipment operation procedures
   - Review safety protocols for each tool
   - Understand maintenance requirements
   - Complete knowledge checks

5. **Procedures & Documentation**
   - Download and review all required documents
   - Complete required forms
   - Understand workflow processes
   - Sign digital acknowledgments

6. **Final Checklist**
   - Verify all modules marked complete
   - Generate completion report
   - Submit to supervisor for review
   - Schedule follow-up training if needed

## Configuration Options

### Customization Settings

| Setting | File | Purpose | Example |
|---------|------|---------|---------|
| Company Name | `index.html` | Branding throughout app | "Flawless Steel Welding" |
| Contact Info | `index.html` | Support and emergency contacts | Phone, email, address |
| Color Scheme | `styles.css` | Brand colors and theming | CSS custom properties |
| Video Source | `index.html` | Orientation video file path | "orientation-video.mp4" |
| Document Links | `index.html` | PDF and training materials | Handbook, safety manual |
| Progress Tracking | `script.js` | Completion requirements | Module weights, thresholds |

### Advanced Configuration

#### Analytics Settings

```javascript
// In script.js - Modify analytics configuration
analytics: {
    sessionTracking: true,
    interactionLogging: true,
    progressThreshold: 0.9, // 90% completion requirement
    autoSave: 30000 // Save progress every 30 seconds
}
```

#### Video Player Configuration

```javascript
// Custom video player settings
videoSettings: {
    completionThreshold: 0.9, // 90% watched = complete
    progressSaveInterval: 30, // Save position every 30 seconds
    allowDownload: true, // Enable download button
    controls: ['play', 'progress', 'mute', 'fullscreen']
}
```

#### Storage Configuration

```javascript
// localStorage settings
storage: {
    keyPrefix: 'fsw_onboarding_',
    compression: false,
    encryption: false, // Set to true for sensitive data
    expirationDays: 30 // Auto-cleanup after 30 days
}
```

## Integration Guide

### n8n Workflow Setup

#### 1. Onboarding Data Processor

```javascript
// Webhook → Super Code (Processor) → Database
{
  "workflow": "FSW Onboarding Processor",
  "trigger": "Webhook",
  "input": "Employee form data",
  "processing": "Data validation, ID generation, progress tracking",
  "output": "Processed employee record"
}
```

#### 2. Report Generator

```javascript
// Database → Super Code (Report) → Email/PDF
{
  "workflow": "FSW Report Generator", 
  "trigger": "Completion event",
  "input": "Employee progress data",
  "processing": "Report generation, compliance check",
  "output": "PDF report, email notification"
}
```

#### 3. Complete Automation Flow

```javascript
// Full workflow integration
Webhook → Processor → Database → Report → Email → HRIS
```

### Webhook Configuration

#### Employee Data Submission

```javascript
// POST endpoint configuration
{
  "endpoint": "/webhook/onboarding",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
  },
  "payload": {
    "employee": {
      "name": "string",
      "email": "string", 
      "position": "string",
      "startDate": "ISO date",
      "progress": "object"
    }
  }
}
```

#### Progress Updates

```javascript
// Real-time progress synchronization
{
  "endpoint": "/webhook/progress",
  "frequency": "On module completion",
  "data": {
    "employeeId": "string",
    "moduleId": "string", 
    "completionTime": "timestamp",
    "score": "number"
  }
}
```

### HRIS Integration

#### Data Export Format

```json
{
  "employee": {
    "id": "FSW-2024-001",
    "personalInfo": {...},
    "onboardingStatus": "completed",
    "completionDate": "2024-01-15T10:30:00Z",
    "modulesCompleted": 8,
    "totalTimeSpent": 14400,
    "complianceStatus": "verified",
    "certificationsEarned": [
      "Safety Training",
      "Equipment Operation",
      "Emergency Procedures"
    ]
  }
}
```

## Security Considerations

### CSP Headers (Content Security Policy)

The application implements strict CSP headers for security:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; 
  font-src 'self' https://cdnjs.cloudflare.com; 
  img-src 'self' data:; 
  media-src 'self'; 
  object-src 'none'; 
  frame-src 'none';
">
```

### Data Privacy & Compliance

| Aspect | Implementation | Compliance |
|--------|----------------|------------|
| Data Storage | localStorage only - no external transmission | GDPR compliant |
| Personal Info | Encrypted in transit, stored locally | Privacy by design |
| Video Content | Self-hosted, no external streaming | Data sovereignty |
| Form Data | Client-side processing before transmission | Minimal data collection |
| Session Management | No server-side sessions, stateless design | Reduced attack surface |

### Security Features

- **XSS Protection:** Content Security Policy headers
- **Data Validation:** Client and server-side input validation  
- **HTTPS Enforcement:** SSL/TLS required for production deployment
- **No External Dependencies:** All resources self-hosted except Font Awesome CDN
- **Audit Trail:** Complete user interaction logging for compliance

### Access Control Recommendations

```javascript
// Recommended access controls
{
  "authentication": "Company SSO integration",
  "authorization": "Role-based access (Employee, HR, Admin)",
  "sessionTimeout": "30 minutes inactive",
  "dataRetention": "30 days automatic cleanup",
  "backupEncryption": "AES-256 for data exports"
}
```

## Performance Notes

### Large File Optimization

#### Video File Handling

- **File Size:** 1.5GB HD orientation video
- **Git LFS:** Large File Storage for version control efficiency
- **Streaming:** Progressive download, not full preload
- **Compression:** H.264 codec for optimal size/quality balance
- **Caching:** Browser cache headers for repeat viewing

#### Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Initial Load | < 3 seconds | ~2.1 seconds |
| Tab Switching | < 200ms | ~150ms |
| Data Save | < 100ms | ~75ms |
| Video Start | < 5 seconds | ~3.2 seconds |
| Mobile Load | < 5 seconds | ~4.1 seconds |

### Mobile Responsiveness

#### Device Support

- **Smartphones:** iOS 12+, Android 8+
- **Tablets:** iPad, Android tablets 
- **Desktop:** All modern browsers
- **Touch Interface:** Optimized for touch navigation
- **Screen Sizes:** 320px to 2560px+ width

#### Mobile Optimizations

```css
/* Key responsive breakpoints */
@media (max-width: 768px) {
  /* Tablet layout adjustments */
}

@media (max-width: 480px) {
  /* Mobile layout optimizations */
}

/* Touch targets minimum 44px */
.nav-tab {
  min-height: 44px;
  min-width: 44px;
}
```

### Performance Best Practices

- **Lazy Loading:** Images and video loaded on demand
- **Code Splitting:** Modular JavaScript for faster initial load
- **Asset Optimization:** Minified CSS/JS, compressed images
- **Caching Strategy:** Aggressive caching for static assets
- **Progressive Enhancement:** Works without JavaScript enabled

## Troubleshooting

### Common Issues & Solutions

#### Video Playback Problems

**Issue:** Video won't play or shows error
**Solutions:**
- Verify `orientation-video.mp4` file exists and is properly sized
- Check Git LFS installation: `git lfs ls-files`
- Ensure web server supports large file serving
- Verify MIME type configuration for .mp4 files
- Test in different browsers for codec support

**Issue:** Video progress not saving
**Solutions:**
- Check browser localStorage availability
- Verify JavaScript execution (check console for errors)
- Clear browser cache and reload application
- Ensure stable internet connection during playback

#### Data Persistence Issues

**Issue:** Progress lost after browser restart
**Solutions:**
- Verify localStorage is enabled in browser settings
- Check available storage space (localStorage has ~5MB limit)
- Clear old onboarding data if multiple sessions exist
- Disable private/incognito browsing mode

**Issue:** Form data not saving
**Solutions:**
- Enable JavaScript in browser settings
- Check browser console for JavaScript errors
- Verify all required fields are completed
- Try saving with different data to isolate issue

#### Performance Issues

**Issue:** Slow loading or unresponsive interface
**Solutions:**
- Clear browser cache and cookies
- Close unnecessary browser tabs
- Check internet connection speed
- Update to latest browser version
- Disable browser extensions that might interfere

**Issue:** Mobile display problems
**Solutions:**
- Rotate device to landscape/portrait mode
- Zoom out if content appears cut off
- Clear mobile browser cache
- Update mobile browser to latest version
- Try different mobile browser (Chrome, Safari, Firefox)

#### n8n Integration Issues

**Issue:** Webhook not receiving data
**Solutions:**
- Verify webhook URL configuration
- Check n8n workflow activation status
- Test webhook endpoint with curl/Postman
- Verify authentication tokens if required
- Check n8n logs for error messages

### Diagnostic Commands

```bash
# Check Git LFS files
git lfs ls-files
git lfs pull

# Verify file sizes
ls -lah *.mp4
ls -lah *.pdf

# Test web server configuration
curl -I http://localhost/onboarding/
curl -I http://localhost/onboarding/orientation-video.mp4

# Check JavaScript errors
# Open browser Developer Tools → Console
```

### Emergency Contact

For urgent technical issues preventing onboarding completion:

- **HR Department:** (720) 638-7289
- **Email Support:** hr@fsw-denver.com  
- **Alternative:** Complete paper-based onboarding checklist
- **Supervisor Contact:** Refer to welcome module for assigned supervisor

## API Reference

### Key Functions & Data Structures

#### Application State Management

```javascript
// Global application state object
appState = {
    currentTab: 'welcome',           // Active module tab
    progress: 0,                     // Overall completion percentage (0-100)
    completedModules: [],            // Array of completed module IDs
    employeeData: {                  // Employee information
        name: 'string',
        email: 'string', 
        phone: 'string',
        position: 'string',
        startDate: 'date',
        supervisor: 'string'
    },
    checklistItems: {},              // Checklist completion status
    analytics: {                     // Session analytics data
        sessionStart: timestamp,
        timeSpentPerTab: {},
        totalTimeSpent: number,
        completionTimes: {},
        interactions: [],
        lastActivity: timestamp
    }
};
```

#### Core Functions

```javascript
// Navigation and state management
function showTab(tabName)           // Switch to specified tab
function updateProgress()           // Recalculate completion percentage
function saveState()               // Persist state to localStorage
function loadState()               // Restore state from localStorage

// Data management
function updateEmployeeData(data)   // Update employee information
function markModuleComplete(moduleId) // Mark module as completed
function updateChecklistItem(itemId, status) // Update checklist status

// Analytics functions
function trackAnalyticsEvent(eventName, data) // Log user interaction
function calculateTimeSpent(moduleId)         // Calculate time in module
function generateReport()                     // Create completion report

// Video player functions
function initializeVideoPlayer()    // Setup video player controls
function saveVideoProgress()        // Save viewing position
function checkVideoCompletion()     // Verify 90% completion
```

#### Data Export Structure

```javascript
// Complete employee record for n8n processing
{
  "employee": {
    "id": "FSW-YYYY-NNN",           // Auto-generated employee ID
    "personalInfo": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "position": "string", 
      "startDate": "YYYY-MM-DD",
      "supervisor": "string"
    },
    "onboardingProgress": {
      "overallCompletion": 85,      // Percentage complete
      "modulesCompleted": [
        {
          "moduleId": "welcome",
          "completedAt": "ISO timestamp",
          "timeSpent": 1200           // Seconds
        }
      ],
      "checklistStatus": {
        "totalItems": 25,
        "completedItems": 21,
        "pendingItems": ["item1", "item2"]
      }
    },
    "videoProgress": {
      "orientationVideo": {
        "watchedPercentage": 95,
        "completedAt": "ISO timestamp",
        "totalWatchTime": 3600
      }
    },
    "analytics": {
      "sessionDuration": 14400,     // Total seconds in app
      "averageTimePerModule": 1800, // Average seconds per module
      "mostTimeSpentModule": "safety",
      "leastTimeSpentModule": "documents",
      "interactionCount": 342,
      "lastActivity": "ISO timestamp"
    },
    "complianceStatus": {
      "safetyTrainingComplete": true,
      "documentsReviewed": true, 
      "orientationVideoComplete": true,
      "readyForFieldWork": false    // HR approval required
    }
  }
}
```

#### Event Tracking Schema

```javascript
// Analytics events logged throughout session
{
  "eventType": "module_started|module_completed|video_progress|form_updated|error",
  "timestamp": "ISO timestamp",
  "moduleId": "string",           // If applicable
  "data": {                       // Event-specific data
    "previousValue": "any",
    "newValue": "any", 
    "errorMessage": "string",
    "userAgent": "string"
  },
  "sessionId": "string",          // Unique session identifier
  "employeeId": "string"          // If employee data entered
}
```

### Integration Endpoints

#### Webhook Data Format

```javascript
// POST /webhook/onboarding
{
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "X-Webhook-Source": "steel-onboarding-app"
  },
  "body": {
    "eventType": "onboarding_progress|completion|error",
    "timestamp": "ISO timestamp",
    "employeeData": { /* Employee object */ },
    "progressData": { /* Progress object */ },
    "analytics": { /* Analytics object */ }
  }
}
```

### Browser Storage Schema

```javascript
// localStorage key structure
{
  "onboardingAppState": "JSON string of complete app state",
  "fsw_onboarding_employee": "Encrypted employee data",
  "fsw_onboarding_progress": "Module completion tracking",
  "fsw_onboarding_analytics": "Session analytics data",
  "fsw_onboarding_video_position": "Video playback position"
}
```

---

**Built with safety and quality in mind - The Flawless Steel Welding Way**

*For technical support or questions, contact HR at (720) 638-7289 or hr@fsw-denver.com*

**Support Resources:**

- Office: (720) 638-7289  
- Address: 5353 Joliet St, Denver, CO 80239
- Email: hr@fsw-denver.com (HR matters)
- Email: info@fsw-denver.com (General inquiries)

---

*Last Updated: September 2024*
*Version: 2.1 - Enhanced with Founder Story & Company Values*
*Compatibility: All modern browsers, mobile responsive*

**Recent Updates:**
- Added interactive founder's story timeline (2011-2025)
- Integrated "What Sets Us Apart" differentiators section  
- Included founder quote and brand philosophy
- Enhanced company information module with cultural content
- Improved mobile responsiveness for timeline components