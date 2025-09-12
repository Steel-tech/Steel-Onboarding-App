
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code
in this repository.

## Project Overview

This is a **production-ready full-stack web application** for employee
onboarding at Flawless Steel Welding. The application features a Node.js/Express
backend with PostgreSQL database via Supabase, JWT authentication, and comprehensive
security middleware. The frontend is a sophisticated single-page application with
real-time data synchronization. The app emphasizes **professional company culture**
and **founder story storytelling** to create an engaging onboarding experience that
builds pride and connection to the company's mission.

## Core Architecture

### Application Structure

- **Full-stack architecture** with React-style frontend and Express.js backend
- **Supabase PostgreSQL database** with connection pooling and real-time features
- **Dual authentication system** - Express JWT + Supabase Auth for flexibility
- **Production security** with rate limiting, input validation, and audit logging
- **n8n workflow integration** for automated HR processes and notifications

### Key Backend Files

- `server.js` - Express.js server with JWT auth, security middleware, API routes
- `database.js` - PostgreSQL connection handling via Supabase with pooling
- `auth.js` - Authentication system with bcrypt hashing and session management
- `validators.js` - Input validation, security checks, and rate limiting
- `api-client.js` - Frontend API client with offline support and error handling

### Key Frontend Files

- `index.html` - Single-page application with security headers and responsive design
- `script.js` - Complex state management, API integration, and real-time updates
- `styles.css` - Professional styling with responsive design and brand elements
- `event-handlers.js` - Modular event handling system for security compliance
- `supabase-client.js` - Database client with authentication and real-time subscriptions

### Database Architecture

```javascript
// PostgreSQL schema via Supabase
Tables: {
    users: 'Authentication and user roles',
    employee_data: 'Employee information and onboarding status', 
    onboarding_progress: 'Module completion tracking',
    form_submissions: 'Digital forms with signatures',
    audit_logs: 'Security and compliance tracking',
    hr_notifications: 'Automated HR workflow triggers'
}
```

### State Management Pattern

```javascript
// Hybrid state management - frontend + backend
// Frontend state (script.js)
appState = {
    currentTab: 'welcome',
    progress: 0,
    completedModules: [],
    employeeData: {},
    apiClient: new APIClient(),
    supabaseClient: window.supabase.createClient(...)
}

// Backend state (server.js + database)
// - PostgreSQL persistence via Supabase
// - JWT sessions with 8-hour expiration  
// - Real-time subscriptions for live updates
```

All frontend state syncs with PostgreSQL backend via API calls and Supabase 
real-time subscriptions.

## Development Commands

### Running the Full-Stack Application

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and configuration

# Initialize database (if needed)
node setup-database.js

# Start the Express.js backend server
npm start
# Server runs on http://localhost:3001

# Alternative: Development mode with auto-restart
npm run dev
```

### Environment Setup

Required environment variables in `.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Authentication & Security
JWT_SECRET=your_secure_jwt_secret_here
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=28800000

# Email Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=notifications@flawlesssteelwelding.com
EMAIL_PASS=your_app_password
HR_EMAIL=tasha@fsw-denver.com
ADMIN_EMAIL=admin@flawlesssteelwelding.com
```

### Testing the Application

Full-stack testing approach:

1. **Backend API Testing:**
   ```bash
   # Health check
   curl http://localhost:3001/api/health
   
   # Test authentication
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin2025!"}'
   ```

2. **Frontend Testing:**
   - Navigate to http://localhost:3001
   - Test form submissions and data persistence
   - Check browser dev tools for API calls
   - Verify real-time database updates

3. **Database Testing:**
   - Access Supabase dashboard to verify data
   - Check audit logs and HR notifications
   - Test RLS policies and user permissions

## Key Implementation Patterns

### Adding New API Endpoints

New backend functionality requires updates in multiple layers:

1. **Server Routes** (server.js) - Add Express route with middleware
2. **Database Operations** (database.js) - Add PostgreSQL queries
3. **Frontend Integration** (script.js) - Add API client calls
4. **Validation** (validators.js) - Add input validation rules
5. **Authentication** - Ensure proper JWT/Supabase auth checks

### Adding New Frontend Sections

New tabs require updates across the full stack:

1. **HTML** - Add tab button in navigation and content section
2. **CSS** - Style the new section with brand guidelines
3. **JavaScript** - Add state management and API integration
4. **Backend** - Add corresponding API endpoints for data persistence
5. **Database** - Update schema if new data fields needed

### Company Story CSS Architecture

The founder story sections use a sophisticated styling system:

#### Timeline Styling Pattern

```css
.timeline {
    position: relative;
    padding-left: 2rem;
}

.timeline::before {
    /* Vertical gradient line */
    background: linear-gradient(to bottom, var(--accent-color), var(--secondary-color));
}

.timeline-marker {
    /* Circular gradient markers */
    background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
    border-radius: 50%;
}

.timeline-content {
    /* Clean card styling with left border accent */
    border-left: 4px solid var(--accent-color);
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}
```

#### Professional Card Hover Effects

```css
.differentiator-card {
    transition: all 0.3s ease;
    overflow: hidden;
}

.differentiator-card::before {
    /* Top gradient border */
    background: linear-gradient(90deg, var(--accent-color), var(--secondary-color));
}

.differentiator-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}
```

#### Dark Theme Brand Section

```css
.brand-philosophy {
    /* Professional dark gradient */
    background: linear-gradient(135deg, var(--primary-color) 0%, 
                                var(--dark-gray) 100%);
    color: white;
}

.founder-quote {
    /* Semi-transparent overlay styling */
    background: rgba(255,255,255,0.1);
    border-left: 4px solid var(--warning-color);
}
```

### Form Data Handling

All forms follow this full-stack pattern:

```javascript
// Frontend form submission with API integration
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate data client-side
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        // Submit to backend API with authentication
        const response = await apiClient.submitForm(formType, data, digitalSignature);
        
        // Update local state and sync with database
        updateAppState(response.data);
        
        // Real-time update via Supabase subscriptions
        await supabaseClient.from('form_submissions').upsert(data);
        
        // Trigger HR notification workflow
        await emailService.sendHRNotification(employeeData, 'FORM_SUBMITTED');
        
    } catch (error) {
        handleApiError(error);
    }
});
```

### Progress Tracking

Progress is calculated from both frontend and backend:

**Frontend Tracking:**
- Completed safety modules (localStorage + database sync)
- Downloaded documents (audit logged)
- Checked checklist items (real-time updates)
- Form submissions (PostgreSQL persistence)

**Backend Tracking:**
- Module completion timestamps in `onboarding_progress` table
- Form submission audit trail in `form_submissions` table
- HR notifications triggered via `hr_notifications` table
- Real-time progress updates via Supabase subscriptions

### Authentication Integration

The application uses dual authentication:

```javascript
// Express.js JWT Authentication
const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

// Supabase Authentication
const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
});

// Hybrid session management
if (expressAuth.success || supabaseAuth.success) {
    establishUserSession();
    syncUserData();
}
```

## n8n Integration

The project includes two n8n Super Code scripts that can be used in n8n workflows:

### fsw-onboarding-processor.js

- Validates employee form data
- Generates unique employee IDs
- Creates training schedules based on position
- Returns processed employee records

### fsw-report-generator.js

- Generates completion reports
- Tracks safety compliance
- Monitors training progress
- Outputs formatted reports for HR

## Company-Specific Customization

### Contact Information

- **Company**: Flawless Steel Welding
- **Address**: 5353 Joliet St, Denver, CO 80239
- **Phone**: (720) 638-7289

### Branding Elements

- Logo: `Flawless Steel Logo_vector_ydMod3 (002) Page 003.jpg`
- Primary colors defined in CSS variables
- Company-specific safety protocols in content

### Company Story Components

The application includes a comprehensive **founder story section** that serves as
both cultural onboarding and brand education:

#### Timeline Section (`timeline-section`)

- **Victor Garcia's journey** from 2011 startup ($10,500 investment) to
  AISC-certified leader
- **Visual timeline** with gradient-styled markers and content cards
- **Key milestones**: 2011 (startup), 2017 (growth), 2022 (union partnership),
  2025 (current status)
- **Professional narrative** emphasizing quality, growth, and community
  investment

#### Differentiators Section (`differentiators-section`)

- **Grid-based layout** showcasing company strengths
- **AISC certification** and technical capabilities
- **Union partnership** with Ironworkers Local 24
- **Community commitment** and Latino-owned business values

#### Brand Philosophy Section (`brand-philosophy`)

- **Dark-themed section** with gradient background for emphasis
- **"Flawless" brand explanation** connecting name to quality standards
- **Founder quote** with professional styling and attribution
- **Company values** presented as actionable principles

## Security Considerations

The application implements comprehensive production-grade security:

### Backend Security (Express.js)
- **Helmet middleware** with CSP, XSS protection, and frame options
- **Rate limiting** (3 attempts/15min for auth, 10 requests/15min general)
- **bcrypt password hashing** with 12 rounds for user authentication
- **JWT tokens** with 8-hour expiration and secure signing
- **Input validation** via express-validator with XSS pattern detection
- **SQL injection protection** through parameterized queries
- **CORS configuration** with specific origin restrictions

### Database Security (PostgreSQL/Supabase)
- **Row Level Security (RLS)** policies for data access control
- **SSL/TLS encryption** in transit via Supabase
- **Connection pooling** with timeout and retry mechanisms
- **Audit logging** for all data modifications and user actions
- **Encrypted storage** at rest via Supabase infrastructure

### Frontend Security
- **Content Security Policy** headers preventing XSS attacks
- **Input sanitization** for all user-generated content
- **Secure API communication** with authentication tokens
- **XSS protection** through proper data escaping
- **CSRF protection** via SameSite cookie attributes

### Authentication Security
- **Dual authentication** system (Express JWT + Supabase Auth)
- **Session management** with secure token storage
- **Password policy** enforcement via validation
- **Account lockout** mechanisms for failed attempts
- **Secure password reset** workflows via Supabase Auth

## Browser Compatibility

Minimum supported browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Key JavaScript features used:

- ES6 arrow functions
- Template literals
- LocalStorage API
- querySelector/querySelectorAll
- Fetch API (for potential future enhancements)

## Common Modifications

### Update Company Information

Edit directly in `index.html` - search for company-specific text and replace.

### Change Styling/Colors

Modify CSS variables in `styles.css`:

```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #e74c3c;
    --success-color: #2ecc71;
}
```

### Add New Safety Modules

1. Add HTML structure in safety section of `index.html`
2. Include "Mark Complete" button with `data-module` attribute
3. Progress calculation updates automatically

### Modify Document List

Update the documents section in `index.html` with new PDF/document links.

### Update Company Story Content

When modifying the founder story sections, maintain these patterns:

#### Timeline Updates

```html
<div class="timeline-item">
    <div class="timeline-marker">
        <span class="timeline-year">YYYY</span>
    </div>
    <div class="timeline-content">
        <h5>Milestone Title</h5>
        <p>Professional narrative describing growth, challenges, achievements...</p>
    </div>
</div>
```

#### Differentiator Cards

```html
<div class="differentiator-card">
    <div class="differentiator-icon">
        <i class="fas fa-icon-name"></i>
    </div>
    <h5>Strength Title</h5>
    <p>Professional description emphasizing capability and value...</p>
</div>
```

#### Brand Philosophy Content

- Use **dark theme** (`brand-philosophy` class) for emphasis
- Include **founder quotes** with proper attribution
- Focus on **quality standards** and **professional values**
- Maintain **inspiring but professional** tone

## Troubleshooting

### Progress Not Saving

```javascript
// Check localStorage in console
console.log(localStorage.getItem('onboardingAppState'));
// Clear corrupted state if needed
localStorage.clear();
```

### Video Not Playing

- Check file exists: `orientation-video.mp4`
- Verify browser supports MP4
- Check console for CORS errors if hosted

### Forms Not Submitting

- Verify JavaScript is enabled
- Check browser console for errors
- Ensure all required fields have values

## Design Philosophy and Maintenance Guidelines

### Professional Branding Standards

The application maintains a **professional, inspiring tone** throughout the
company story sections:

- **Authentic storytelling** - Victor Garcia's journey from $10,500 startup to
  AISC leader
- **Community focus** - Latino-owned business, union partnership, local
  investment
- **Quality emphasis** - "Flawless" brand meaning, AISC certification,
  precision standards
- **Professional presentation** - Clean gradients, sophisticated hover effects,
  readable typography

### Content Maintenance Best Practices

#### When updating company milestones

1. **Maintain chronological order** in timeline section
2. **Use consistent narrative style** - professional but personal
3. **Emphasize growth and values** - community, quality, opportunity
4. **Include specific metrics** when relevant (revenue, employees,
   certifications)

#### When adding differentiators

1. **Focus on measurable capabilities** - certifications, partnerships,
   technical skills
2. **Use appropriate FontAwesome icons** that match content
3. **Keep descriptions concise** but impactful
4. **Maintain visual consistency** in card styling

#### Responsive Design Considerations

- Timeline markers scale down on mobile (4rem → 3rem)
- Differentiator grid becomes single column on mobile
- Brand philosophy padding adjusts for smaller screens
- All hover effects remain functional on touch devices

### Quality Assurance Checklist

Before deploying company story updates:

- [ ] Timeline flows chronologically and tells cohesive story
- [ ] All differentiator cards have consistent styling and working hover effects
- [ ] Brand philosophy section maintains professional dark theme
- [ ] Founder quote displays with proper attribution
- [ ] Mobile responsive design works across all screen sizes
- [ ] Content reflects current company status and achievements
