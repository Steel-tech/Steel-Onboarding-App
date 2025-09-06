# Steel Onboarding App - API Documentation

## Overview

The Steel Onboarding App provides comprehensive APIs for employee onboarding
automation through n8n workflows, frontend state management, video player
controls, analytics tracking, and data export systems.

**Metadata:**

- Purpose: API documentation for Steel Onboarding App n8n integrations
- Type: API Documentation
- Language: JavaScript
- Dependencies: n8n, validator, dayjs, lodash, Handlebars
- Last Updated: 2025-09-05

## N8N Super Code APIs

### processOnboardingData

**Signature:** `processOnboardingData(data: Object) -> ProcessingResult`

**Purpose:** Processes new employee onboarding data from web forms, validates
completion, and generates employee records.

**Parameters:**

- `data` (Object, required): Employee onboarding data object
  - `data.name` (string, required): Full employee name
  - `data.email` (string, required): Valid email address
  - `data.phone` (string, required): 10-digit phone number
  - `data.position` (string, required): Job position title
  - `data.startDate` (string, required): ISO date string for start date
  - `data.supervisor` (string, optional): Supervisor name
  - `data.progress` (number, optional): Completion progress (0-100)
  - `data.completedModules` (Array, optional): Array of completed safety modules
  - `data.documentsCompleted` (Object, optional): Document completion status

**Returns:** ProcessingResult object with success/error status, processed
employee data, and summary information.

**Example:**

```javascript
processOnboardingData({
  name: "John Smith",
  email: "john.smith@fsw-denver.com", 
  phone: "555-123-4567",
  position: "Welder",
  startDate: "2025-01-15"
})
```

**Response:**

```javascript
{
  success: true,
  data: {
    employeeId: "FSW-JS-250115-42",
    fullName: "John Smith",
    email: "john.smith@fsw-denver.com",
    phone: "555-123-4567",
    position: "Welder",
    department: "Welding",
    startDate: "2025-01-15",
    trainingSchedule: [...],
    status: "Not Started"
  },
  summary: { ... }
}
```

**Errors:**

- `ValidationError`: When required fields are missing or invalid
- `EmailFormatError`: When email format is invalid
- `PhoneFormatError`: When phone number is not 10 digits

### generateEmployeeId

**Signature:** `generateEmployeeId(name: string, startDate: string) -> string`

**Purpose:** Generates unique employee ID using initials, date code, and random
number.

**Parameters:**

- `name` (string, required): Full employee name
- `startDate` (string, required): ISO date string

**Returns:** Formatted employee ID string (FSW-XX-YYMMDD-NN)

**Example:**

```javascript
generateEmployeeId("John Smith", "2025-01-15")
// Returns: "FSW-JS-250115-42"
```

### determineDepartment

**Signature:** `determineDepartment(position: string) -> string`

**Purpose:** Determines department assignment based on job position.

**Parameters:**

- `position` (string, required): Job position title

**Returns:** Department name string

**Examples:**

```javascript
determineDepartment("Structural Welder")
// Returns: "Welding"

determineDepartment("Steel Fabricator")
// Returns: "Fabrication"
```

### generateTrainingSchedule

**Signature:**
`generateTrainingSchedule(startDate: string, position: string) -> Array`

**Purpose:** Creates position-specific training schedule with dates and
locations.

**Parameters:**

- `startDate` (string, required): Employee start date
- `position` (string, required): Job position for specialized training

**Returns:** Array of training session objects with day, date, activity, and
location.

**Example:**

```javascript
generateTrainingSchedule("2025-01-15", "Welder")
```

**Response:**

```javascript
[
  { 
    day: 1, 
    date: "2025-01-15", 
    activity: "Orientation & Safety Training", 
    location: "Main Office" 
  },
  { 
    day: 6, 
    date: "2025-01-20", 
    activity: "Welding Certification Test Prep", 
    location: "Welding Shop" 
  }
]
```

### calculateStatus

**Signature:** `calculateStatus(progress: number) -> string`

**Purpose:** Converts numeric progress to human-readable status.

**Parameters:**

- `progress` (number, required): Progress percentage (0-100)

**Returns:** Status string description

**Example:**

```javascript
calculateStatus(75)
// Returns: "Nearly Complete"
```

### generateOnboardingReport

**Signature:** `generateOnboardingReport(employeeData: Object) -> ReportResult`

**Purpose:** Generates comprehensive onboarding completion report for HR records.

**Parameters:**

- `employeeData` (Object, required): Complete employee onboarding data

**Returns:** ReportResult with formatted report, metrics, and PDF-ready data

**Example Response:**

```javascript
{
  success: true,
  reportId: "FSW-OBR-250105-123456-001",
  employee: { ... },
  metrics: { safetyComplete: true, readyForWork: true },
  formattedReport: "text version",
  fullReport: { ... },
  pdfData: { ... }
}
```

### calculateMetrics

**Signature:** `calculateMetrics(data: Object) -> MetricsResult`

**Purpose:** Calculates onboarding completion metrics and compliance status.

**Parameters:**

- `data` (Object, required): Employee onboarding data

**Returns:** Metrics object with safety, documents, task completion, and work
readiness status.

## Frontend JavaScript APIs

### State Management

#### loadState

**Signature:** `loadState() -> void`

**Purpose:** Loads saved application state from localStorage with validation.

**Parameters:** None

**Returns:** void - Updates global appState object

**Errors:**

- `ParseError`: When localStorage data is corrupted - resets to default state

#### saveState

**Signature:** `saveState() -> void`

**Purpose:** Saves current application state to localStorage with error handling.

**Parameters:** None

**Returns:** void

**Errors:**

- `StorageError`: When localStorage quota exceeded or unavailable

### Navigation

#### showTab

**Signature:** `showTab(tabName: string) -> void`

**Purpose:** Handles tab navigation with analytics tracking and accessibility.

**Parameters:**

- `tabName` (string, required): Tab identifier to display

**Returns:** void - Updates UI and saves state

**Example:**

```javascript
showTab('safety')
// Switches to safety tab, updates navigation, tracks analytics
```

### Module Management

#### completeModule

**Signature:**
`completeModule(moduleName: string, buttonElement: HTMLElement) -> void`

**Purpose:** Marks safety module as completed with UI updates and progress
tracking.

**Parameters:**

- `moduleName` (string, required): Module identifier
  (ppe, hazards, emergency, crane)
- `buttonElement` (HTMLElement, required): Button element to update

**Returns:** void - Updates state, progress, and shows notifications

### Employee Data

#### saveEmployeeData

**Signature:** `saveEmployeeData() -> void`

**Purpose:** Validates and saves employee form data with comprehensive validation.

**Parameters:** None

**Returns:** void

**Errors:**

- `ValidationError`: When required fields are missing
- `EmailFormatError`: When email format is invalid

### Progress Tracking Functions

#### updateProgress

**Signature:** `updateProgress() -> void`

**Purpose:** Calculates and updates overall completion progress with visual
indicators.

**Parameters:** None

**Returns:** void - Updates progress bar and percentage display

### Notifications

#### showNotification

**Signature:** `showNotification(message: string, type?: string) -> void`

**Purpose:** Displays styled notification messages with auto-dismiss.

**Parameters:**

- `message` (string, required): Notification message text
- `type` (string, optional): Notification type: success, error, warning, info

**Returns:** void

**Example:**

```javascript
showNotification("Module completed!", "success")
// Shows green success notification that auto-dismisses after 3 seconds
```

## Video Player APIs

### initializeVideoPlayer

**Signature:** `initializeVideoPlayer() -> void`

**Purpose:** Initializes custom video player with progress tracking and
completion detection.

**Parameters:** None

**Returns:** void - Sets up video controls and event listeners

### Video Progress Tracking

The video player automatically tracks viewing progress:

```javascript
video.addEventListener('timeupdate', function() {
  const progress = (video.currentTime / video.duration) * 100;
  if (progress > 90 && 
      !appState.completedModules.includes('orientation-video')) {
    appState.completedModules.push('orientation-video');
    updateProgress();
  }
});
```

## Data Export APIs

### DataExporter Class

#### exportData

**Signature:** `exportData(format: string, type: string) -> void`

**Purpose:** Exports onboarding data in multiple formats for different
stakeholders.

**Parameters:**

- `format` (string, required): Export format: json, csv, txt, pdf
- `type` (string, required): Report type: completion, analytics, full, hr

**Returns:** void - Triggers file download

**Example:**

```javascript
dataExporter.exportData('json', 'hr')
// Downloads JSON file with HR summary data
```

#### prepareExportData

**Signature:** `prepareExportData(type: string) -> Object`

**Purpose:** Prepares structured data for export based on report type.

**Parameters:**

- `type` (string, required): Report type to prepare

**Returns:** Structured data object for export

#### getCompletionDetails

**Signature:** `getCompletionDetails() -> Object`

**Purpose:** Generates detailed completion status for all onboarding components.

**Parameters:** None

**Returns:** Object with safety modules, required forms, and completion status

#### getHRSummary

**Signature:** `getHRSummary() -> Object`

**Purpose:** Creates HR-focused summary with compliance status and recommendations.

**Parameters:** None

**Returns:** HR summary object with employee info, metrics, compliance status,
and recommendations

## Analytics APIs

### trackAnalyticsEvent

**Signature:** `trackAnalyticsEvent(eventType: string, data?: Object) -> void`

**Purpose:** Records analytics events with timestamp and contextual data.

**Parameters:**

- `eventType` (string, required): Event type identifier
- `data` (Object, optional): Additional event data

**Returns:** void - Adds event to analytics store

### generateAnalyticsReport

**Signature:** `generateAnalyticsReport() -> Object`

**Purpose:** Generates comprehensive analytics report with time tracking and
interaction data.

**Parameters:** None

**Returns:** Analytics report object with session info, tab times, interactions,
and completion data

### trackTabSwitch

**Signature:** `trackTabSwitch(newTab: string) -> void`

**Purpose:** Tracks time spent on tabs and records navigation analytics.

**Parameters:**

- `newTab` (string, required): Tab being switched to

**Returns:** void - Updates time tracking and analytics

### formatDuration

**Signature:** `formatDuration(ms: number) -> string`

**Purpose:** Formats milliseconds to human-readable duration string.

**Parameters:**

- `ms` (number, required): Duration in milliseconds

**Returns:** Formatted duration string (e.g., "1h 23m 45s")

## Error Handling & Logging APIs

### Logger Class

#### log

**Signature:** `log(level: string, message: string, data?: Object) -> void`

**Purpose:** Logs events with structured metadata for debugging and monitoring.

**Parameters:**

- `level` (string, required): Log level: ERROR, WARN, INFO, DEBUG
- `message` (string, required): Log message
- `data` (Object, optional): Additional log data

**Returns:** void - Adds to log store and console output

#### exportLogs

**Signature:** `exportLogs() -> void`

**Purpose:** Exports system logs and analytics for technical support.

**Parameters:** None

**Returns:** void - Downloads JSON file with logs and analytics data

### Utility Functions

#### safeExecute

**Signature:**
`safeExecute(func: Function, context?: string, fallback?: any) -> any`

**Purpose:** Executes function with error handling and logging.

**Parameters:**

- `func` (Function, required): Function to execute safely
- `context` (string, optional): Context description for error logging
- `fallback` (any, optional): Value to return on error

**Returns:** Function result or fallback value on error

## Configuration Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| N8N_WEBHOOK_URL | string | "" | n8n webhook endpoint URL |
| EMPLOYEE_ID_PREFIX | string | "FSW" | Prefix for generated employee IDs |
| TRAINING_DAYS | number | 7 | Number of days for standard training schedule |
| PROGRESS_SAVE_INTERVAL | number | 30000 | Auto-save interval in milliseconds |
| MAX_LOG_ENTRIES | number | 500 | Maximum log entries to retain |
| VIDEO_COMPLETION_THRESHOLD | number | 90 | Video completion threshold |
| ANALYTICS_BATCH_SIZE | number | 100 | Maximum analytics events in memory |

## Integration Patterns

### Webhook Integration

```javascript
// N8N Webhook Integration Pattern
const webhookData = {
  employee: processedEmployeeData,
  timestamp: new Date().toISOString(),
  source: 'onboarding-app',
  event: 'completion'
};

// Send to n8n webhook
fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData)
});
```

### State Management Pattern

```javascript
// State Management Pattern
const appState = {
  currentTab: 'welcome',
  progress: 0,
  completedModules: [],
  employeeData: {},
  checklistItems: {},
  analytics: { /* tracking data */ }
};

// Save state with error handling
function saveState() {
  try {
    localStorage.setItem('onboardingAppState', JSON.stringify(appState));
  } catch (error) {
    logger.error('State save failed', error);
  }
}
```

### Progress Tracking Pattern

```javascript
// Progress Tracking Pattern
function updateProgress() {
  const totalItems = calculateTotalItems();
  const completedItems = calculateCompletedItems();
  const percentage = Math.round((completedItems / totalItems) * 100);
  
  appState.progress = percentage;
  updateProgressBar(percentage);
  
  if (percentage === 100) {
    triggerCompletionEvents();
  }
}
```

### Error Handling

```javascript
// Comprehensive Error Handling Pattern
async function safeApiCall(apiFunction, context) {
  try {
    const result = await apiFunction();
    logger.info(`${context} completed successfully`);
    return result;
  } catch (error) {
    logger.error(`${context} failed`, { 
      error: error.message, 
      stack: error.stack 
    });
    showNotification(`Operation failed: ${error.message}`, 'error');
    return null;
  }
}
```

### Data Export

```javascript
// Data Export Pattern
class DataExporter {
  exportData(format, type) {
    const data = this.prepareExportData(type);
    
    switch(format) {
      case 'json': this.exportAsJSON(data, type); break;
      case 'csv': this.exportAsCSV(data, type); break;
      case 'pdf': this.exportAsPDF(data, type); break;
    }
  }
}

// Usage
dataExporter.exportData('json', 'hr');
```

### Analytics Tracking

```javascript
// Analytics Tracking Pattern
function trackEvent(eventType, data = {}) {
  const event = {
    type: eventType,
    timestamp: Date.now(),
    tab: appState.currentTab,
    employee: appState.employeeData.name,
    data: data
  };
  
  appState.analytics.interactions.push(event);
  logger.info('Analytics event', event);
}
```

## Webhook Endpoints

### Onboarding Submission

**Endpoint:** `POST /webhook/onboarding`

**Description:** Receives employee onboarding form submissions

**Headers:**

- `Content-Type: application/json` (required)
- `X-Webhook-Source: fsw-onboarding-app` (optional)

**Payload:**

```javascript
{
  employee: Object,        // Complete employee data object
  timestamp: string,       // ISO timestamp of submission
  source: string,         // Source application identifier
  event: string           // Event type (submission, completion, update)
}
```

**Responses:**

- **200 Success:**

  ```javascript
  { 
    "success": true, 
    "employeeId": "FSW-XX-YYMMDD-NN", 
    "message": "Onboarding data processed" 
  }
  ```

- **400 Bad Request:**

  ```javascript
  { 
    "error": "Validation failed", 
    "details": ["field1 required", "field2 invalid"] 
  }
  ```

- **500 Internal Error:**

  ```javascript
  { 
    "error": "Processing failed", 
    "message": "Internal server error" 
  }
  ```

### Progress Update

**Endpoint:** `POST /webhook/progress`

**Description:** Receives real-time progress updates from the application

**Authentication:** API key in `X-API-Key` header

**Rate Limit:** 100 requests per minute per employee

**Payload:**

```javascript
{
  employeeId: string,      // Employee identifier
  progress: number,        // Progress percentage (0-100)
  completedModules: Array, // Array of completed module names
  lastActivity: string     // ISO timestamp of last activity
}
```

## Error Codes

| Code | Description | Details |
|------|-------------|---------|
| ONB001 | Missing required employee information | Missing required fields |
| ONB002 | Invalid email format | Email format validation failed |
| ONB003 | Invalid phone number format | Phone must be 10 digits |
| ONB004 | Employee ID generation failed | Unable to generate unique ID |
| ONB005 | State persistence failed | localStorage save error |
| ONB006 | Report generation failed | Report compilation error |
| ONB007 | Video player initialization failed | Video controls setup error |
| ONB008 | Analytics tracking failed | Analytics event recording error |
| ONB009 | Data export failed | Export file generation error |
| ONB010 | Network connectivity error | External service connection failed |

## Integration Examples

### N8N Workflow Trigger

```javascript
// N8N Workflow Node - Onboarding Processor
// Input: Employee data from webhook
const result = processOnboardingData($input.first().json);

if (result.success) {
  // Generate welcome email data
  const emailData = {
    to: result.data.email,
    subject: `Welcome to ${result.data.company}!`,
    template: 'welcome-template',
    data: result.data
  };
  
  // Generate HR notification
  const hrNotification = {
    employee: result.data,
    status: result.data.status,
    nextSteps: result.data.requiresAction
  };
  
  return [emailData, hrNotification];
} else {
  return { error: result.error };
}
```

### Progress Monitoring

```javascript
// Real-time Progress Monitoring
function monitorProgress(employeeId) {
  const progressData = {
    employeeId: employeeId,
    progress: appState.progress,
    completedModules: appState.completedModules,
    timeSpent: Date.now() - appState.analytics.sessionStart,
    lastActivity: new Date().toISOString()
  };
  
  // Send to monitoring webhook
  fetch('/webhook/progress-update', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    },
    body: JSON.stringify(progressData)
  });
}
```

### Completion Workflow

```javascript
// Completion Workflow Integration
async function handleCompletion() {
  if (appState.progress === 100) {
    // Generate completion report
    const report = dataExporter.prepareExportData('completion');
    
    // Notify HR system
    await fetch('/webhook/employee-ready', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: appState.employeeData.employeeId,
        completionDate: new Date().toISOString(),
        report: report,
        readyForWork: report.readyForWork
      })
    });
    
    // Trigger badge/certificate generation
    await generateCompletionCertificate(report);
  }
}
```
