// Flawless Steel Welding - Webhook Data Receiver for n8n
// Receives data from the onboarding application and prepares it for processing

// Get webhook data
const webhookData = $input.first().json;

// Validate webhook authentication (if token is provided)
function validateWebhook(data) {
    // Check for authentication token if required
    const expectedToken = $env.FSW_WEBHOOK_TOKEN || 'fsw-secure-token-2025';
    
    if (data.headers && data.headers['x-webhook-token']) {
        if (data.headers['x-webhook-token'] !== expectedToken) {
            return {
                valid: false,
                error: 'Invalid webhook token'
            };
        }
    }
    
    // Validate source
    const allowedSources = [
        'onboarding-app',
        'hr-portal',
        'admin-dashboard',
        'mobile-app'
    ];
    
    if (data.source && !allowedSources.includes(data.source)) {
        return {
            valid: false,
            error: 'Unknown source application'
        };
    }
    
    return { valid: true };
}

// Process incoming webhook data
function processWebhookData(data) {
    // Determine webhook type
    const webhookType = determineWebhookType(data);
    
    // Extract and normalize data based on type
    let processedData = {};
    
    switch (webhookType) {
        case 'employee_update':
            processedData = processEmployeeUpdate(data);
            break;
            
        case 'progress_sync':
            processedData = processProgressSync(data);
            break;
            
        case 'module_completion':
            processedData = processModuleCompletion(data);
            break;
            
        case 'document_signed':
            processedData = processDocumentSigned(data);
            break;
            
        case 'form_submission':
            processedData = processFormSubmission(data);
            break;
            
        case 'emergency_alert':
            processedData = processEmergencyAlert(data);
            break;
            
        case 'analytics_update':
            processedData = processAnalyticsUpdate(data);
            break;
            
        default:
            processedData = processGenericData(data);
    }
    
    return {
        type: webhookType,
        data: processedData,
        metadata: extractMetadata(data),
        routing: determineRouting(webhookType, processedData)
    };
}

// Determine webhook type from data structure
function determineWebhookType(data) {
    if (data.type) return data.type;
    
    if (data.employeeData && data.progress) return 'employee_update';
    if (data.completedModule) return 'module_completion';
    if (data.signatureData) return 'document_signed';
    if (data.formData) return 'form_submission';
    if (data.emergency) return 'emergency_alert';
    if (data.analytics) return 'analytics_update';
    if (data.progress && data.checklistItems) return 'progress_sync';
    
    return 'generic';
}

// Process employee update webhook
function processEmployeeUpdate(data) {
    return {
        employeeId: data.employeeData?.employeeId || generateTempId(),
        employeeData: data.employeeData || {},
        progress: data.progress || 0,
        completedModules: data.completedModules || [],
        checklistItems: data.checklistItems || {},
        procedureAcknowledgments: data.procedureAcknowledgments || {},
        formCompletions: data.formCompletions || {},
        digitalSignatures: data.digitalSignatures || {},
        analytics: data.analytics || {},
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        action: 'update_employee_record'
    };
}

// Process progress sync webhook
function processProgressSync(data) {
    return {
        employeeId: data.employeeId || data.employee_id,
        currentProgress: data.progress || 0,
        previousProgress: data.previousProgress || 0,
        progressDelta: (data.progress || 0) - (data.previousProgress || 0),
        completedItems: {
            modules: data.completedModules || [],
            checklist: Object.keys(data.checklistItems || {}).filter(key => data.checklistItems[key]),
            forms: Object.keys(data.formCompletions || {}).filter(key => data.formCompletions[key]),
            procedures: Object.keys(data.procedureAcknowledgments || {}).filter(key => data.procedureAcknowledgments[key])
        },
        syncTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        requiresNotification: (data.progress || 0) >= 100
    };
}

// Process module completion webhook
function processModuleCompletion(data) {
    return {
        employeeId: data.employeeId,
        moduleName: data.completedModule,
        completionTime: data.completionTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        score: data.score || null,
        attempts: data.attempts || 1,
        timeSpent: data.timeSpent || 0,
        nextModule: data.nextModule || null,
        certification: data.certification || null
    };
}

// Process document signed webhook
function processDocumentSigned(data) {
    return {
        employeeId: data.employeeId,
        documentType: data.documentType,
        documentId: data.documentId,
        signatureData: data.signatureData,
        signedAt: data.signedAt || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
        isValid: validateSignature(data.signatureData)
    };
}

// Process form submission webhook
function processFormSubmission(data) {
    return {
        employeeId: data.employeeId,
        formType: data.formType,
        formData: sanitizeFormData(data.formData),
        submittedAt: data.submittedAt || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        validationStatus: validateFormData(data.formType, data.formData),
        requiresReview: determineReviewRequired(data.formType)
    };
}

// Process emergency alert webhook
function processEmergencyAlert(data) {
    return {
        alertType: 'EMERGENCY',
        employeeId: data.employeeId,
        issue: data.emergency.issue,
        severity: data.emergency.severity || 'high',
        location: data.emergency.location || 'unknown',
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        requiresImmediate: true,
        notificationTargets: ['hr', 'safety', 'supervisor', 'admin']
    };
}

// Process analytics update webhook
function processAnalyticsUpdate(data) {
    return {
        employeeId: data.employeeId,
        sessionData: data.analytics || {},
        engagement: calculateEngagement(data.analytics),
        timeMetrics: {
            totalTime: data.analytics?.totalTimeSpent || 0,
            activeTime: data.analytics?.activeTime || 0,
            idleTime: data.analytics?.idleTime || 0,
            perSection: data.analytics?.timeSpentPerTab || {}
        },
        interactions: data.analytics?.interactions || [],
        completionPrediction: predictCompletion(data.analytics)
    };
}

// Process generic webhook data
function processGenericData(data) {
    return {
        rawData: data,
        processedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        requiresManualReview: true
    };
}

// Extract metadata from webhook
function extractMetadata(data) {
    return {
        source: data.source || 'unknown',
        version: data.version || '1.0',
        environment: data.environment || 'production',
        userAgent: data.userAgent || data.headers?.['user-agent'] || 'unknown',
        ipAddress: data.ipAddress || data.headers?.['x-forwarded-for'] || 'unknown',
        timestamp: data.timestamp || dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
}

// Determine routing for processed data
function determineRouting(type, data) {
    const routes = {
        employee_update: ['database', 'notification'],
        progress_sync: ['database', 'analytics'],
        module_completion: ['database', 'certification', 'notification'],
        document_signed: ['database', 'compliance', 'archive'],
        form_submission: ['database', 'validation', 'hr'],
        emergency_alert: ['notification', 'escalation', 'logging'],
        analytics_update: ['analytics', 'reporting'],
        generic: ['queue', 'review']
    };
    
    return {
        primary: routes[type]?.[0] || 'queue',
        secondary: routes[type]?.slice(1) || [],
        priority: determinePriority(type, data)
    };
}

// Helper functions
function generateTempId() {
    return `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function validateSignature(signatureData) {
    if (!signatureData) return false;
    // Basic validation - check if signature has minimum required data
    return signatureData.length > 100;
}

function sanitizeFormData(formData) {
    if (!formData) return {};
    
    // Remove any potential XSS or injection attempts
    const sanitized = {};
    for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
            sanitized[key] = value
                .replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, '')
                .trim();
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

function validateFormData(formType, formData) {
    const requiredFields = {
        w4: ['name', 'ssn', 'address', 'filingStatus'],
        i9: ['name', 'dateOfBirth', 'ssn', 'citizenship'],
        emergency: ['contactName', 'relationship', 'phone'],
        benefits: ['planSelection', 'dependents']
    };
    
    const required = requiredFields[formType] || [];
    const missing = required.filter(field => !formData[field]);
    
    return {
        isValid: missing.length === 0,
        missingFields: missing
    };
}

function determineReviewRequired(formType) {
    const reviewRequired = ['i9', 'benefits', 'injury_report'];
    return reviewRequired.includes(formType);
}

function calculateEngagement(analytics) {
    if (!analytics) return 0;
    
    const factors = {
        timeSpent: Math.min(analytics.totalTimeSpent / 600000, 1) * 30, // 10 min = full score
        interactions: Math.min(analytics.interactions?.length / 50, 1) * 30,
        sectionsVisited: Math.min(Object.keys(analytics.timeSpentPerTab || {}).length / 8, 1) * 40
    };
    
    return Math.round(Object.values(factors).reduce((a, b) => a + b, 0));
}

function predictCompletion(analytics) {
    if (!analytics) return { likelihood: 'unknown', estimatedTime: null };
    
    const progressRate = analytics.progressRate || 0;
    const engagementScore = calculateEngagement(analytics);
    
    if (engagementScore > 70 && progressRate > 5) {
        return {
            likelihood: 'high',
            estimatedTime: Math.round((100 - (analytics.currentProgress || 0)) / progressRate)
        };
    } else if (engagementScore > 40) {
        return {
            likelihood: 'medium',
            estimatedTime: Math.round((100 - (analytics.currentProgress || 0)) / Math.max(progressRate, 2))
        };
    }
    
    return {
        likelihood: 'low',
        estimatedTime: null
    };
}

function determinePriority(type, data) {
    const highPriority = ['emergency_alert', 'document_signed', 'module_completion'];
    const mediumPriority = ['employee_update', 'form_submission'];
    
    if (highPriority.includes(type)) return 'high';
    if (mediumPriority.includes(type)) return 'medium';
    
    // Check for specific conditions
    if (data.requiresImmediate) return 'urgent';
    if (data.progress >= 95) return 'high';
    
    return 'normal';
}

// Main execution
try {
    // Validate webhook
    const validation = validateWebhook(webhookData);
    if (!validation.valid) {
        return {
            error: validation.error,
            status: 'rejected',
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
    }
    
    // Process webhook data
    const processed = processWebhookData(webhookData);
    
    // Return processed data for next node
    return {
        success: true,
        webhookType: processed.type,
        data: processed.data,
        metadata: processed.metadata,
        routing: processed.routing,
        nextAction: processed.routing.primary,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    
} catch (error) {
    return {
        error: `Webhook processing failed: ${error.message}`,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        webhookData: webhookData,
        requiresManualIntervention: true
    };
}
