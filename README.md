# Flawless Steel Welding - Employee Onboarding Application

## Company Information
**Flawless Steel Welding**  
5353 Joliet St, Denver, CO 80239  
Phone: (720) 638-7289  

## Overview
A comprehensive web-based onboarding application designed specifically for new hires at Flawless Steel Welding. This application streamlines the onboarding process while emphasizing safety, compliance, and industry-specific welding and fabrication training.

## Features

### 🛡️ Safety-First Approach
- **Comprehensive Safety Training Modules**
  - PPE Requirements
  - Hazard Recognition
  - Emergency Procedures
  - Crane & Rigging Safety
- **Interactive safety checklists**
- **Certification tracking**

### 👥 Employee Management
- **Personal Information Collection**
- **Role-specific onboarding paths**
- **Supervisor assignment**
- **Progress tracking**

### 📚 Training & Education
- **Equipment & Tools Training**
  - Welding equipment
  - Cutting tools
  - Lifting equipment
  - Measuring tools
- **Standard Operating Procedures**
- **Quality control processes**
- **Administrative procedures**

### 📄 Documentation
- **Digital document library**
  - Employee handbook
  - Safety manual
  - Benefits guide
  - Emergency contacts
- **Forms management**
- **Completion certificates**

### ✅ Progress Tracking
- **Real-time progress bar**
- **Checklist system**
- **Module completion tracking**
- **Automated report generation**
- **Data persistence (localStorage)**

## Installation & Setup

1. **Extract the files** to your web server or local directory
2. **Open index.html** in a modern web browser
3. **No additional setup required** - the app is ready to use!

## Usage Guide

### For HR/Administrators

1. **Deploy the Application**
   - Host on company intranet or web server
   - Share URL with new employees

2. **Customize Content**
   - Update company information in HTML
   - Modify safety procedures as needed
   - Add specific equipment/tools
   - Update contact information

3. **Track Progress**
   - Review completion reports
   - Monitor employee progress
   - Identify training gaps

### For New Employees

1. **Start with Welcome Tab**
   - Fill out personal information
   - Review first week schedule

2. **Complete Safety Training**
   - Review all safety modules
   - Mark each module as complete
   - Understand PPE requirements

3. **Review Company Information**
   - Learn about mission & values
   - Understand services offered
   - Save important contacts

4. **Study Equipment & Procedures**
   - Review equipment training materials
   - Understand standard procedures
   - Learn quality control processes

5. **Complete Documentation**
   - Download and review all documents
   - Complete required forms
   - Check off completed items

6. **Track Your Progress**
   - Use checklist to track tasks
   - Monitor progress bar
   - Generate completion report

## Technical Details

### Technologies Used
- **HTML5** - Structure and content
- **CSS3** - Styling and responsive design
- **JavaScript (ES6)** - Functionality and interactivity
- **localStorage** - Data persistence
- **Font Awesome** - Icons

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Responsive
- Fully responsive design
- Optimized for tablets and smartphones
- Touch-friendly interface

## Customization Guide

### Modifying Company Information
Edit the relevant sections in `index.html`:
```html
<div class="info-card">
    <h3>Our Mission</h3>
    <p>Your company mission here</p>
</div>
```

### Adding New Safety Modules
Add new module cards in the safety section:
```html
<div class="module-card">
    <h3>New Module Title</h3>
    <div class="module-content">
        <!-- Module content here -->
    </div>
</div>
```

### Updating Styling
Modify CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2c3e50;  /* Change brand colors */
    --secondary-color: #e74c3c;
}
```

## Security & Compliance

### Data Privacy
- All data stored locally in browser
- No external data transmission
- Complies with data protection regulations

### Safety Compliance
- Meets OSHA training requirements
- Includes industry-standard safety protocols
- Emphasizes PPE and hazard recognition

## Support & Maintenance

### Troubleshooting
- **Progress not saving**: Clear browser cache and reload
- **Buttons not working**: Ensure JavaScript is enabled
- **Display issues**: Update to latest browser version

### Future Enhancements
- Backend integration for centralized data
- Video training modules
- Multi-language support
- Advanced reporting analytics
- Mobile app version
- Integration with HRIS systems

## License & Credits

Created for Steel Fabrication & Erection companies
Designed with safety and efficiency in mind

---

For technical support or customization requests, contact your IT department.

## n8n Super Code Integration

The application includes two powerful Super Code agents for n8n workflow automation:

### 1. FSW Onboarding Processor (`fsw-onboarding-processor.js`)
**Purpose:** Processes new employee onboarding data from web forms

**Features:**
- Validates employee information
- Generates unique employee IDs
- Tracks safety module completion
- Monitors document submission
- Creates training schedules based on position
- Provides real-time progress updates
- Generates notifications and alerts

**Input:** Employee onboarding data from webhook or form
**Output:** Processed employee record with validation, metrics, and next steps

### 2. FSW Report Generator (`fsw-report-generator.js`)
**Purpose:** Generates comprehensive onboarding completion reports

**Features:**
- Creates detailed progress reports
- Tracks safety compliance status
- Documents training completion
- Monitors checklist progress
- Generates recommendations
- Produces formatted reports for HR
- Prepares PDF-ready data

**Input:** Employee data with progress information
**Output:** Complete formatted report with metrics and compliance status

## How to Use Super Code in n8n

1. **Create a new workflow** in n8n
2. **Add a Super Code node**
3. **Copy the code** from either `fsw-onboarding-processor.js` or `fsw-report-generator.js`
4. **Paste into the Super Code editor**
5. **Connect to your data source** (webhook, form, database, etc.)
6. **Run the workflow** to process onboarding data automatically

## Integration Examples

### Webhook Integration
```javascript
// Receive data from onboarding app
Webhook → Super Code (Processor) → Database
```

### Report Generation
```javascript
// Generate reports on completion
Database → Super Code (Report) → Email/PDF
```

### Complete Workflow
```javascript
// Full onboarding automation
Webhook → Processor → Database → Report Generator → Email Notification
```

## Customization for Flawless Steel Welding

The application has been customized with:
- Company branding and information
- Denver location-specific details
- Flawless Steel Welding contact information
- Industry-specific welding focus
- Custom safety protocols
- Location-based assembly points

## Support

For technical support or questions:
- **Office:** (720) 638-7289
- **Address:** 5353 Joliet St, Denver, CO 80239
- **Email:** hr@flawlesssteelwelding.com

---

Built with safety and quality in mind - The Flawless Steel Welding Way


## 📹 Orientation Video Feature

The application now includes the FSW Employee Orientation video with:

- **Full video player controls** (play, pause, mute, fullscreen)
- **Progress tracking** - Saves viewing progress automatically
- **Completion detection** - Marks as complete when 90% watched
- **Download option** - For offline viewing
- **Mobile responsive** - Works on all devices
- **Integration with progress system** - Counts toward overall onboarding completion

### Video Location
The orientation video file 'orientation-video.mp4' is included in the application folder.

# Steel-Onboarding-App
