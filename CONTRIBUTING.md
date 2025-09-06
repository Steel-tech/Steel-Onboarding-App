# Contributing to Steel Onboarding App

Welcome to the Steel Onboarding App project! This guide will help you set up
your development environment and contribute effectively to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Git Workflow](#git-workflow)
- [Testing Requirements](#testing-requirements)
- [Large File Handling](#large-file-handling)
- [n8n Integration](#n8n-integration)
- [Security Guidelines](#security-guidelines)
- [Documentation Standards](#documentation-standards)
- [Review Process](#review-process)
- [Release Process](#release-process)
- [Specialized Areas](#specialized-areas)

## Development Setup

### Prerequisites

- Web Browser: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- Git: Latest version with Git LFS support
- Text Editor: VS Code, Sublime Text, or similar
- Local Web Server (optional): Python http.server or Node.js http-server

### Local Environment Setup

1. Clone the Repository

   ```bash
   git clone <repository-url>
   cd steel-onboarding-app
   ```

2. Install Git LFS (if not already installed)

   ```bash
   git lfs install
   git lfs pull
   ```

3. Verify Large Files

   ```bash
   # Check that video file is properly downloaded
   ls -la orientation-video.mp4
   ```

4. Start Local Development Server

   ```bash
   # Option 1: Python 3
   python -m http.server 8000
   
   # Option 2: Python 2
   python -m SimpleHTTPServer 8000
   
   # Option 3: Node.js (if you have http-server installed)
   npx http-server -p 8000
   ```

5. Access the Application

   Open your browser to `http://localhost:8000` and test all functionality
   to ensure proper setup.

### Development Tools Setup

Recommended VS Code Extensions:

- HTML CSS Support
- JavaScript (ES6) code snippets
- Live Server
- Prettier - Code formatter
- ESLint
- Git Lens

Browser Developer Tools:

- Enable "Preserve log" for debugging
- Use Application tab to inspect localStorage
- Network tab for testing file downloads

## Code Style Guidelines

### JavaScript Standards

ES6+ Features:

- Use `const` and `let` instead of `var`
- Use arrow functions for callbacks
- Use template literals for string concatenation
- Use destructuring for object/array access

Good Example:

```javascript
const userName = data.employee?.name || 'Unknown';
const message = `Welcome ${userName} to the team!`;
```

Bad Example:

```javascript
var userName = data.employee ? data.employee.name : 'Unknown';
var message = 'Welcome ' + userName + ' to the team!';
```

Function Structure:

- Use descriptive function names
- Add JSDoc comments for complex functions
- Keep functions focused and under 50 lines
- Use early returns to reduce nesting

Example:

```javascript
/**
 * Validates employee onboarding data
 * @param {Object} data - Employee data object
 * @returns {Object} Validation result with success boolean and errors array
 */
function validateEmployeeData(data) {
    if (!data) {
        return { success: false, errors: ['No data provided'] };
    }
    
    // Rest of validation logic...
}
```

### HTML Standards

Structure:

- Use semantic HTML5 elements (main, section, article)
- Include proper ARIA labels for accessibility
- Use meaningful class and ID names
- Maintain proper heading hierarchy (h1 → h2 → h3)

Example:

```html
<section class="safety-training" role="region" aria-labelledby="safety-heading">
    <h2 id="safety-heading">Safety Training Modules</h2>
    <div class="module-list">
        <!-- Module content -->
    </div>
</section>
```

### CSS Standards

Organization:

- Use CSS custom properties (variables) for consistent theming
- Follow BEM naming convention for classes
- Group related styles together
- Use mobile-first responsive design

CSS Variables:

```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #e74c3c;
    --success-color: #27ae60;
    --warning-color: #f39c12;
}
```

BEM Naming:

```css
.module-card {}
.module-card__title {}
.module-card__content {}
.module-card--completed {}
```

Responsive Design:

```css
/* Mobile First */
.navigation {
    flex-direction: column;
}

/* Tablet and up */
@media (min-width: 768px) {
    .navigation {
        flex-direction: row;
    }
}
```

## Git Workflow

### Branch Naming Convention

- Features: `feature/description-of-feature`
- Bug Fixes: `fix/description-of-bug`
- Hotfixes: `hotfix/critical-issue`
- Documentation: `docs/what-documentation`
- Refactoring: `refactor/what-being-refactored`

Examples:

```bash
git checkout -b feature/add-spanish-language-support
git checkout -b fix/video-player-controls
git checkout -b docs/update-safety-procedures
```

### Commit Message Format

Use the conventional commit format:

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Formatting changes (no code logic changes)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

Examples:

```bash
git commit -m "feat(safety): add new PPE requirement module"
git commit -m "fix(video): resolve fullscreen mode on mobile devices"
git commit -m "docs(readme): update installation instructions"
```

### Pull Request Process

1. Create Feature Branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make Changes and Commit

   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```

3. Push to Origin

   ```bash
   git push origin feature/your-feature-name
   ```

4. Create Pull Request

   - Use the PR template (if available)
   - Include screenshots for UI changes
   - Reference any related issues
   - Request review from appropriate team members

5. PR Requirements

   - All tests must pass
   - Code must follow style guidelines
   - Changes must be documented
   - Security review for sensitive changes

## Testing Requirements

### Manual Testing Checklist

Before Submitting Changes:

- Cross-Browser Testing
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)

- Mobile Testing
  - iOS Safari
  - Android Chrome
  - Responsive design at various screen sizes

- Functionality Testing
  - All navigation tabs work
  - Forms submit and validate correctly
  - Progress tracking saves and loads
  - Video player controls function
  - Download links work
  - localStorage persistence works

- Performance Testing
  - Page loads within 3 seconds
  - Video loads without blocking UI
  - No console errors
  - Memory usage remains stable

### Testing Procedures

Local Testing:

```bash
# Start local server
python -m http.server 8000

# Test in multiple browsers
open -a "Google Chrome" http://localhost:8000
open -a "Firefox" http://localhost:8000
open -a "Safari" http://localhost:8000
```

Testing Scenarios:

1. New User Journey: Complete entire onboarding process
2. Returning User: Verify saved progress loads correctly
3. Form Validation: Test all input validation
4. Video Functionality: Test play, pause, progress tracking
5. Download Features: Verify all document downloads work
6. Mobile Experience: Test touch interactions and responsive design

### Automated Testing (Future)

When implementing automated tests:

- Use Jest for JavaScript unit tests
- Use Cypress or Playwright for e2e tests
- Test critical user paths
- Maintain >80% test coverage

## Large File Handling

### Git LFS Configuration

The project uses Git LFS for large files (videos, images, documents).

Current LFS Files:

- `*.mp4` files (videos)
- Large images (>1MB)
- PDF documents (if added)

Working with LFS:

```bash
# Check LFS status
git lfs ls-files

# Track new file types
git lfs track "*.pdf"
git add .gitattributes

# Add large files normally
git add orientation-video.mp4
git commit -m "feat(media): add orientation video"

# Push LFS files
git push origin main
```

Best Practices:

- Keep video files under 100MB when possible
- Use appropriate compression for videos
- Add new large file types to `.gitattributes`
- Verify LFS files upload correctly

## n8n Integration

### Overview

The app includes two n8n Super Code processors for workflow automation:

1. FSW Onboarding Processor (`fsw-onboarding-processor.js`)
2. FSW Report Generator (`fsw-report-generator.js`)

### Testing n8n Workflows

Local Testing:

1. Set up n8n locally or use n8n cloud
2. Create test workflow
3. Copy processor code into Super Code node
4. Test with sample data
5. Verify output format

Sample Test Data:

```javascript
{
  "name": "John Doe",
  "email": "john.doe@fsw-denver.com",
  "phone": "(555) 123-4567",
  "position": "Welder",
  "startDate": "2024-01-15",
  "completedModules": ["ppe", "safety", "equipment"],
  "progress": 85
}
```

### Modifying Workflow Processors

Code Structure:

- Input validation at the top
- Pure functions for data processing
- Consistent error handling
- Comprehensive output formatting

Making Changes:

1. Update processor file locally
2. Test with sample data
3. Copy to n8n Super Code node
4. Test end-to-end workflow
5. Document changes in commit message

## Security Guidelines

### Data Protection

Sensitive Data Handling:

- Never log personally identifiable information (PII)
- Use localStorage only for non-sensitive data
- Validate all user inputs
- Sanitize data before displaying

Input Validation Example:

```javascript
function sanitizeInput(input) {
    return input
        .toString()
        .trim()
        .replace(/[<>]/g, '') // Remove potentially dangerous characters
        .substring(0, 255); // Limit length
}
```

### Content Security Policy

The app uses strict CSP headers. When adding new resources:

1. Update CSP in HTML head
2. Test all functionality
3. Verify no console errors

Current CSP allows:

- Self-hosted resources
- Inline styles and scripts (limited)
- CDN fonts and icons from cdnjs.cloudflare.com
- Data URIs for images

### Security Review Requirements

Before merging changes that involve:

- User input handling
- Data storage/retrieval
- External resource loading
- Authentication/authorization

Required reviews:

- Code review by senior developer
- Security checklist completion
- Testing with malicious input attempts

## Documentation Standards

### Code Documentation

JavaScript Documentation:

```javascript
/**
 * Calculates onboarding completion percentage
 * @param {Array} completedModules - Array of completed module IDs
 * @param {number} totalModules - Total number of modules
 * @returns {number} Completion percentage (0-100)
 * @throws {Error} When totalModules is zero or negative
 */
function calculateProgress(completedModules, totalModules) {
    // Implementation...
}
```

CSS Documentation:

```css
/* 
 * Module Card Component
 * Displays individual training modules with completion status
 * Used in: Safety Training, Equipment Training sections
 */
.module-card {
    /* Styles... */
}
```

### README Updates

When adding features, update relevant sections:

- Features list
- Usage instructions
- Technical details
- Customization examples

### Inline Documentation

HTML Comments:

```html
<!-- Safety Training Section - Core onboarding requirement -->
<section id="safety-training">
    <!-- Module cards populated by script.js -->
</section>
```

Configuration Documentation:

Document all configuration options and their effects.

## Review Process

### Code Review Checklist

For Reviewers:

- Code Quality
  - Follows project style guidelines
  - Functions are well-named and focused
  - No code duplication
  - Proper error handling

- Functionality
  - Changes work as described
  - No breaking changes to existing features
  - Edge cases handled appropriately

- Performance
  - No performance regressions
  - Efficient algorithms used
  - Resources loaded appropriately

- Security
  - Input validation present
  - No sensitive data exposure
  - CSP compliance maintained

- Documentation
  - Code is self-documenting or commented
  - README updated if needed
  - User-facing changes documented

### Approval Process

Required Approvals:

- 1 approval for documentation changes
- 1 approval for minor bug fixes
- 2 approvals for new features
- 2 approvals + security review for security-related changes

Auto-merge Criteria:

- All required approvals received
- All tests passing
- No merge conflicts
- Branch is up-to-date

## Release Process

### Version Management

Version Format: `MAJOR.MINOR.PATCH`

- MAJOR: Breaking changes, major feature additions
- MINOR: New features, backwards-compatible changes
- PATCH: Bug fixes, minor improvements

### Release Steps

1. Pre-release Testing

   ```bash
   # Complete testing checklist
   # Verify all features work
   # Test on multiple browsers/devices
   ```

2. Version Update

   ```bash
   # Update version in relevant files
   # Create release notes
   ```

3. Create Release

   ```bash
   git tag -a v1.2.3 -m "Release version 1.2.3"
   git push origin v1.2.3
   ```

4. Deployment

   - Deploy to staging environment
   - Run smoke tests
   - Deploy to production
   - Monitor for issues

### Release Notes Template

```markdown
## Version 1.2.3 - 2024-01-15

#### New Features

- Added Spanish language support
- New safety module: Crane Operations

#### Bug Fixes

- Fixed video player fullscreen on mobile
- Resolved progress saving issue

#### Improvements

- Faster page load times
- Better mobile responsiveness

#### Breaking Changes

- None

#### Migration Guide

- No migration needed
```

## Specialized Areas

### Safety Modules and Compliance Features

When modifying safety content:

1. Compliance Review Required
   - Verify against OSHA standards
   - Check industry best practices
   - Ensure completeness of safety information

2. Testing Requirements
   - Test all safety checklists
   - Verify completion tracking
   - Ensure no modules can be skipped inappropriately

3. Documentation Updates
   - Update safety compliance documentation
   - Record any regulatory requirement changes
   - Maintain audit trail for compliance

Code Example:

```javascript
// Safety module validation - critical for compliance
function validateSafetyModuleCompletion(moduleId, responses) {
    const requiredResponses = SAFETY_REQUIREMENTS[moduleId];
    const missingResponses = requiredResponses.filter(
        req => !responses[req] || responses[req] !== 'understood'
    );
    
    if (missingResponses.length > 0) {
        throw new Error(`Safety module incomplete: ${missingResponses.join(', ')}`);
    }
}
```

### Adding New Onboarding Steps

Planning New Steps:

1. Requirements Analysis
   - Define learning objectives
   - Identify required resources
   - Plan progress tracking
   - Consider mobile experience

2. Implementation Process

   ```javascript
   // Add to appState structure
   const newModule = {
       id: 'new-module',
       name: 'New Training Module',
       required: true,
       estimatedTime: 15, // minutes
       dependencies: ['safety-basics'], // prerequisite modules
       resources: ['document1.pdf', 'video1.mp4']
   };
   ```

3. Integration Steps
   - Add to navigation
   - Update progress calculation
   - Add completion tracking
   - Update report generation
   - Test thoroughly

### Company/Industry Customization

Customization Framework:

```javascript
// Configuration object for easy customization
const CONFIG = {
    company: {
        name: "Flawless Steel Welding",
        address: "5353 Joliet St, Denver, CO 80239",
        phone: "(720) 638-7289",
        industry: "steel-fabrication"
    },
    branding: {
        primaryColor: "#2c3e50",
        secondaryColor: "#e74c3c",
        logo: "company-logo.jpg"
    },
    modules: {
        required: ["safety", "equipment", "procedures"],
        optional: ["advanced-welding", "leadership"],
        industrySpecific: ["steel-grades", "blueprint-reading"]
    }
};
```

Customization Checklist:

- Update company information
- Replace branding elements
- Modify safety procedures for industry
- Adjust training modules
- Update contact information
- Test all customizations

### Analytics and Reporting Systems

Data Collection Guidelines:

```javascript
// Analytics data structure
const analyticsEvent = {
    timestamp: Date.now(),
    userId: 'anonymous-' + generateId(),
    action: 'module_completed',
    module: 'safety-ppe',
    timeSpent: 300000, // milliseconds
    sessionId: getCurrentSessionId()
};
```

Privacy Considerations:

- No personally identifiable information
- Use anonymous session IDs
- Provide opt-out mechanism
- Clear data retention policy

### HR Integration Requirements

Integration Points:

1. HRIS Systems
   - Employee data import/export
   - Progress synchronization
   - Completion notifications

2. Data Format Standards

   ```json
   {
     "employee": {
       "id": "EMP001",
       "name": "John Doe",
       "department": "Production",
       "startDate": "2024-01-15"
     },
     "progress": {
       "overallCompletion": 85,
       "modulesCompleted": ["safety", "equipment"],
       "timeSpent": 7200,
       "lastActivity": "2024-01-20T10:30:00Z"
     }
   }
   ```

3. API Requirements
   - RESTful endpoints
   - Authentication/authorization
   - Rate limiting
   - Error handling

## Getting Help

For Development Questions:

- Check existing documentation first
- Search closed issues for similar problems
- Create detailed issue with reproduction steps

For Security Concerns:

- Follow responsible disclosure process
- Contact security team directly
- Include detailed vulnerability information

For Feature Requests:

- Use feature request template
- Provide detailed use case
- Include mockups or examples if helpful

## License and Legal

This project is proprietary software for Steel Fabrication & Welding
companies. Contributors must:

- Sign contributor license agreement
- Follow company intellectual property policies
- Respect confidentiality requirements
- Comply with industry regulations

---

Thank you for contributing to the Steel Onboarding App!

For questions about this guide, please open an issue or contact the
development team.
