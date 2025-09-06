// Flawless Steel Welding - Enhanced Onboarding Data Processor for n8n
// Matches the updated application structure with backend integration
// Processes employee data, tracks analytics, and manages compliance

// Get input data from webhook or previous node
const inputData = $input.first().json;

// Libraries available as globals in n8n
// Using: dayjs, lodash (_), validator, axios

// Enhanced processor matching your updated application structure
function processEnhancedOnboardingData(data) {
    // Validate against your new appState structure
    const requiredFields = [
        'employeeData',
        'progress',
        'completedModules',
        'checklistItems',
        'procedureAcknowledgments',
        'formCompletions',
        'digitalSignatures',
        'analytics'
    ];
    
    // Check for missing fields
    const missingFields = [];
    requiredFields.forEach(field => {
        if (!data[field]) {
            missingFields.push(field);
        }
    });
    
    if (missingFields.length > 0 && !data.employeeData) {
        return {
            success: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }
    
    // Process employee data with enhanced validation
    const employeeInfo = processEmployeeInfo(data.employeeData || data);
    if (!employeeInfo.success) {
        return employeeInfo;
    }
    
    // Calculate comprehensive metrics
    const metrics = calculateEnhancedMetrics(data);
    
    // Process analytics data
    const analytics = processAnalytics(data.analytics);
    
    // Generate compliance status
    const compliance = generateComplianceStatus(data);
    
    // Determine required actions
    const actions = determineActions(data, metrics);
    
    // Prepare notification data
    const notifications = prepareNotifications(data, metrics, compliance);
    
    // Build complete processed result
    const processedData = {
        // Employee Information
        employee: employeeInfo.data,
        
        // Progress & Completion
        progress: {
            overall: data.progress || 0,
            modules: data.completedModules || [],
            checklistItems: countCompletedItems(data.checklistItems),
            procedures: countAcknowledged(data.procedureAcknowledgments),
            forms: countCompletedForms(data.formCompletions),
            signatures: countSignatures(data.digitalSignatures)
        },
        
        // Analytics & Engagement
        analytics: analytics,
        
        // Compliance & Safety
        compliance: compliance,
        
        // Training Status
        training: {
            safetyModules: processSafetyModules(data),
            equipmentTraining: processEquipmentTraining(data),
            procedureAcknowledgments: data.procedureAcknowledgments || {},
            certifications: determineCertifications(data)
        },
        
        // Document Management
        documents: {
            downloaded: data.downloadedDocuments || [],
            signed: Object.keys(data.digitalSignatures || {}),
            pending: getPendingDocuments(data)
        },
        
        // Next Steps & Actions
        actions: actions,
        notifications: notifications,
        
        // Integration Data for Backend
        backendSync: {
            employeeId: employeeInfo.data.employeeId,
            lastSync: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            requiresUpdate: true,
            syncPriority: determineSyncPriority(metrics)
        },
        
        // Reporting
        reportData: {
            generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            reportType: 'comprehensive',
            version: '2.0',
            includesAnalytics: true
        }
    };
    
    return {
        success: true,
        data: processedData,
        summary: generateEnhancedSummary(processedData),
        integrationReady: prepareForIntegration(processedData)
    };
}

// Process employee information with validation
function processEmployeeInfo(data) {
    if (!data.name && !data.fullName && !data.employeeName) {
        return {
            success: false,
            error: 'Employee name is required'
        };
    }
    
    const name = data.name || data.fullName || data.employeeName || '';
    const email = data.email || '';
    
    // Validate email if provided
    if (email && !validator.isEmail(email)) {
        return {
            success: false,
            error: 'Invalid email format'
        };
    }
    
    // Generate employee ID
    const employeeId = data.employeeId || generateEmployeeId(name, data.startDate);
    
    return {
        success: true,
        data: {
            employeeId: employeeId,
            fullName: name.trim(),
            email: email.toLowerCase().trim(),
            phone: formatPhone(data.phone || ''),
            position: data.position || data.role || 'To be assigned',
            department: determineDepartment(data.position || data.role),
            supervisor: data.supervisor || 'To be assigned',
            startDate: dayjs(data.startDate || dayjs()).format('YYYY-MM-DD'),
            location: {
                site: 'Flawless Steel Welding',
                address: '5353 Joliet St',
                city: 'Denver',
                state: 'CO',
                zip: '80239'
            }
        }
    };
}

// Calculate enhanced metrics
function calculateEnhancedMetrics(data) {
    const totalModules = 10; // Based on your app structure
    const completedModules = (data.completedModules || []).length;
    
    const checklistTotal = Object.keys(data.checklistItems || {}).length || 20;
    const checklistCompleted = Object.values(data.checklistItems || {}).filter(v => v).length;
    
    const formsTotal = 6; // Standard forms
    const formsCompleted = Object.values(data.formCompletions || {}).filter(v => v).length;
    
    const proceduresTotal = Object.keys(data.procedureAcknowledgments || {}).length || 8;
    const proceduresAcked = Object.values(data.procedureAcknowledgments || {}).filter(v => v).length;
    
    // Calculate weighted progress
    const moduleWeight = 0.4;
    const checklistWeight = 0.2;
    const formsWeight = 0.2;
    const proceduresWeight = 0.2;
    
    const weightedProgress = 
        (completedModules / totalModules * moduleWeight * 100) +
        (checklistCompleted / checklistTotal * checklistWeight * 100) +
        (formsCompleted / formsTotal * formsWeight * 100) +
        (proceduresAcked / proceduresTotal * proceduresWeight * 100);
    
    return {
        overallProgress: Math.round(weightedProgress),
        moduleProgress: Math.round((completedModules / totalModules) * 100),
        checklistProgress: Math.round((checklistCompleted / checklistTotal) * 100),
        formProgress: Math.round((formsCompleted / formsTotal) * 100),
        procedureProgress: Math.round((proceduresAcked / proceduresTotal) * 100),
        isComplete: weightedProgress >= 95,
        readyForWork: weightedProgress >= 90 && hasRequiredSafety(data),
        detailedMetrics: {
            modulesCompleted: completedModules,
            modulesTotal: totalModules,
            checklistCompleted: checklistCompleted,
            checklistTotal: checklistTotal,
            formsCompleted: formsCompleted,
            formsTotal: formsTotal,
            proceduresAcked: proceduresAcked,
            proceduresTotal: proceduresTotal
        }
    };
}

// Process analytics data
function processAnalytics(analytics) {
    if (!analytics) {
        return {
            sessionDuration: 0,
            timePerSection: {},
            engagementScore: 0,
            lastActivity: 'Unknown'
        };
    }
    
    const sessionDuration = analytics.totalTimeSpent || 
        (Date.now() - (analytics.sessionStart || Date.now()));
    
    const avgTimePerTab = analytics.timeSpentPerTab ? 
        Object.values(analytics.timeSpentPerTab).reduce((a, b) => a + b, 0) / 
        Object.keys(analytics.timeSpentPerTab).length : 0;
    
    // Calculate engagement score (0-100)
    const interactionCount = (analytics.interactions || []).length;
    const engagementScore = Math.min(100, 
        (interactionCount * 2) + 
        (sessionDuration > 300000 ? 20 : sessionDuration / 15000) +
        (Object.keys(analytics.timeSpentPerTab || {}).length * 10)
    );
    
    return {
        sessionDuration: Math.round(sessionDuration / 1000), // in seconds
        totalTimeSpent: Math.round((analytics.totalTimeSpent || 0) / 1000),
        timePerSection: analytics.timeSpentPerTab || {},
        completionTimes: analytics.completionTimes || {},
        engagementScore: Math.round(engagementScore),
        interactionCount: interactionCount,
        lastActivity: dayjs(analytics.lastActivity).format('YYYY-MM-DD HH:mm:ss'),
        averageTimePerSection: Math.round(avgTimePerTab / 1000)
    };
}

// Generate compliance status
function generateComplianceStatus(data) {
    const requiredSafety = ['ppe', 'hazards', 'emergency', 'crane'];
    const requiredForms = ['w4', 'i9', 'emergencyContact', 'safetyAgreement'];
    const requiredDocs = ['Employee Handbook', 'Safety Manual'];
    
    const safetyComplete = requiredSafety.every(module => 
        (data.completedModules || []).includes(module)
    );
    
    const formsComplete = requiredForms.every(form => 
        data.formCompletions?.[form] === true
    );
    
    const docsReviewed = requiredDocs.every(doc => 
        (data.downloadedDocuments || []).some(d => d.includes(doc))
    );
    
    const hasDigitalSignature = Object.keys(data.digitalSignatures || {}).length > 0;
    
    return {
        overallCompliant: safetyComplete && formsComplete && docsReviewed && hasDigitalSignature,
        safetyCompliant: safetyComplete,
        documentCompliant: formsComplete && docsReviewed,
        signatureCompliant: hasDigitalSignature,
        details: {
            safetModules: {
                required: requiredSafety,
                completed: requiredSafety.filter(m => (data.completedModules || []).includes(m)),
                missing: requiredSafety.filter(m => !(data.completedModules || []).includes(m))
            },
            forms: {
                required: requiredForms,
                completed: requiredForms.filter(f => data.formCompletions?.[f]),
                missing: requiredForms.filter(f => !data.formCompletions?.[f])
            },
            documents: {
                required: requiredDocs,
                reviewed: requiredDocs.filter(d => (data.downloadedDocuments || []).some(dd => dd.includes(d))),
                pending: requiredDocs.filter(d => !(data.downloadedDocuments || []).some(dd => dd.includes(d)))
            }
        },
        riskLevel: determineRiskLevel(safetyComplete, formsComplete, docsReviewed)
    };
}

// Helper functions
function generateEmployeeId(name, startDate) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3);
    const dateCode = dayjs(startDate).format('YYMMDD');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FSW-${initials}-${dateCode}-${random}`;
}

function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone || 'Not provided';
}

function determineDepartment(position) {
    if (!position) return 'Operations';
    const pos = position.toLowerCase();
    
    if (pos.includes('weld')) return 'Welding';
    if (pos.includes('fabricat')) return 'Fabrication';
    if (pos.includes('erect') || pos.includes('install')) return 'Erection';
    if (pos.includes('admin') || pos.includes('office')) return 'Administration';
    if (pos.includes('safety')) return 'Safety';
    if (pos.includes('quality')) return 'Quality Control';
    if (pos.includes('engineer')) return 'Engineering';
    
    return 'Operations';
}

function countCompletedItems(items) {
    if (!items) return 0;
    return Object.values(items).filter(v => v === true).length;
}

function countAcknowledged(acknowledgments) {
    if (!acknowledgments) return 0;
    return Object.values(acknowledgments).filter(v => v === true).length;
}

function countCompletedForms(forms) {
    if (!forms) return 0;
    return Object.values(forms).filter(v => v === true).length;
}

function countSignatures(signatures) {
    if (!signatures) return 0;
    return Object.keys(signatures).length;
}

function processSafetyModules(data) {
    const modules = ['ppe', 'hazards', 'emergency', 'crane'];
    return modules.map(module => ({
        name: module.toUpperCase(),
        completed: (data.completedModules || []).includes(module),
        completedAt: data.analytics?.completionTimes?.[module] || null
    }));
}

function processEquipmentTraining(data) {
    const equipment = ['welding', 'cutting', 'lifting', 'measuring'];
    return equipment.map(eq => ({
        type: eq,
        trained: (data.completedModules || []).includes(`equipment-${eq}`),
        certification: null // Placeholder for cert data
    }));
}

function determineCertifications(data) {
    const certs = [];
    const position = (data.employeeData?.position || '').toLowerCase();
    
    if (position.includes('weld')) {
        certs.push({
            name: 'AWS D1.1 Structural Welding',
            required: true,
            status: 'pending'
        });
    }
    
    if (position.includes('crane') || position.includes('rigg')) {
        certs.push({
            name: 'NCCCO Crane Operator',
            required: true,
            status: 'pending'
        });
    }
    
    return certs;
}

function getPendingDocuments(data) {
    const allDocs = [
        'Employee Handbook',
        'Safety Manual',
        'Benefits Guide',
        'Emergency Procedures'
    ];
    
    const downloaded = data.downloadedDocuments || [];
    return allDocs.filter(doc => !downloaded.some(d => d.includes(doc)));
}

function hasRequiredSafety(data) {
    const required = ['ppe', 'hazards', 'emergency'];
    return required.every(module => (data.completedModules || []).includes(module));
}

function determineRiskLevel(safety, forms, docs) {
    if (safety && forms && docs) return 'low';
    if (safety && (forms || docs)) return 'medium';
    if (!safety) return 'high';
    return 'medium';
}

function determineSyncPriority(metrics) {
    if (metrics.overallProgress === 100) return 'high';
    if (metrics.overallProgress >= 75) return 'medium';
    return 'low';
}

function determineActions(data, metrics) {
    const actions = [];
    
    if (!metrics.isComplete) {
        if (metrics.moduleProgress < 100) {
            actions.push({
                type: 'complete_modules',
                priority: 'high',
                message: 'Complete remaining training modules'
            });
        }
        
        if (metrics.formProgress < 100) {
            actions.push({
                type: 'submit_forms',
                priority: 'high',
                message: 'Submit required employment forms'
            });
        }
        
        if (metrics.procedureProgress < 100) {
            actions.push({
                type: 'acknowledge_procedures',
                priority: 'medium',
                message: 'Review and acknowledge procedures'
            });
        }
    }
    
    if (metrics.isComplete) {
        actions.push({
            type: 'schedule_review',
            priority: 'low',
            message: 'Schedule 30-day performance review'
        });
    }
    
    return actions;
}

function prepareNotifications(data, metrics, compliance) {
    const notifications = [];
    
    // Welcome notification for new employees
    if (metrics.overallProgress === 0) {
        notifications.push({
            type: 'welcome',
            recipient: 'employee',
            subject: 'Welcome to Flawless Steel Welding',
            priority: 'info'
        });
    }
    
    // HR notification for completion
    if (metrics.isComplete) {
        notifications.push({
            type: 'completion',
            recipient: 'hr',
            subject: `Employee ${data.employeeData?.name || 'Unknown'} completed onboarding`,
            priority: 'high'
        });
    }
    
    // Compliance warnings
    if (!compliance.safetyCompliant && metrics.overallProgress > 25) {
        notifications.push({
            type: 'safety_warning',
            recipient: 'both',
            subject: 'Safety training incomplete',
            priority: 'urgent'
        });
    }
    
    return notifications;
}

function generateEnhancedSummary(data) {
    return {
        employee: {
            id: data.employee.employeeId,
            name: data.employee.fullName,
            position: data.employee.position,
            department: data.employee.department
        },
        status: {
            overallProgress: data.progress.overall,
            isComplete: data.progress.overall >= 95,
            readyForWork: data.compliance.overallCompliant,
            riskLevel: data.compliance.riskLevel
        },
        metrics: {
            engagementScore: data.analytics.engagementScore,
            sessionDuration: data.analytics.sessionDuration,
            completedModules: data.progress.modules.length
        },
        nextSteps: data.actions.map(a => a.message),
        notifications: data.notifications.length,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
}

function prepareForIntegration(data) {
    // Prepare data for backend API integration
    return {
        endpoint: '/api/onboarding/update',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Employee-ID': data.employee.employeeId
        },
        payload: {
            employeeId: data.employee.employeeId,
            progress: data.progress,
            compliance: data.compliance,
            analytics: data.analytics,
            lastUpdated: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
    };
}

// Main execution
try {
    const result = processEnhancedOnboardingData(inputData);
    
    if (!result.success) {
        return {
            error: result.error,
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            input: inputData
        };
    }
    
    // Return comprehensive processed data
    return {
        success: true,
        data: result.data,
        summary: result.summary,
        integration: result.integrationReady,
        metadata: {
            processedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            processor: 'FSW Enhanced Onboarding Processor v2.0',
            company: 'Flawless Steel Welding',
            location: 'Denver, CO'
        }
    };
    
} catch (error) {
    return {
        error: `Processing failed: ${error.message}`,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        input: inputData,
        stack: error.stack
    };
}
