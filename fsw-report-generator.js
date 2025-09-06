// Flawless Steel Welding - Onboarding Report Generator
// Generates comprehensive reports for completed onboarding processes
// Creates formatted documents for HR records and compliance

// Get employee data from previous node
const employeeData = $input.first().json;

// Libraries available as globals
// Using: dayjs, lodash (_), Handlebars

// Generate comprehensive onboarding report
function generateOnboardingReport(data) {
    const reportDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const completionDate = dayjs().format('MMMM D, YYYY');
    
    // Calculate metrics
    const metrics = calculateMetrics(data);
    
    // Build report structure
    const report = {
        // Header Information
        header: {
            title: 'EMPLOYEE ONBOARDING COMPLETION REPORT',
            company: 'Flawless Steel Welding',
            address: '5353 Joliet St, Denver, CO 80239',
            phone: '(720) 638-7289',
            reportDate: reportDate,
            reportId: generateReportId()
        },
        
        // Employee Details
        employee: {
            fullName: data.name || data.fullName || 'Not Provided',
            employeeId: data.employeeId || generateEmployeeId(data),
            position: data.position || 'Not Specified',
            department: data.department || determineDepartment(data.position),
            supervisor: data.supervisor || 'To Be Assigned',
            startDate: formatDate(data.startDate),
            email: data.email || '',
            phone: formatPhone(data.phone || '')
        },
        
        // Onboarding Progress
        progress: {
            overallCompletion: data.progress || 0,
            status: getStatus(data.progress),
            startDate: formatDate(data.onboardingStarted || data.startDate),
            completionDate: data.progress === 100 ? completionDate : 'In Progress',
            totalDays: calculateDaysInOnboarding(data),
            expectedCompletion: formatDate(data.expectedCompletionDate)
        },
        
        // Safety Compliance
        safetyCompliance: {
            overallStatus: metrics.safetyComplete ? 'COMPLIANT' : 'PENDING',
            modules: [
                { name: 'PPE Requirements', status: data.completedModules?.includes('ppe') ? '✓ Complete' : '⚠ Pending' },
                { name: 'Hazard Recognition', status: data.completedModules?.includes('hazards') ? '✓ Complete' : '⚠ Pending' },
                { name: 'Emergency Procedures', status: data.completedModules?.includes('emergency') ? '✓ Complete' : '⚠ Pending' },
                { name: 'Crane & Rigging Safety', status: data.completedModules?.includes('crane') ? '✓ Complete' : '⚠ Pending' }
            ],
            certifications: generateCertifications(data)
        },
        
        // Documentation Status
        documentation: {
            overallStatus: metrics.documentsComplete ? 'COMPLETE' : 'INCOMPLETE',
            forms: [
                { name: 'W-4 Tax Withholding', status: data.documentsCompleted?.w4 ? '✓ Filed' : '⚠ Required' },
                { name: 'I-9 Employment Eligibility', status: data.documentsCompleted?.i9 ? '✓ Filed' : '⚠ Required' },
                { name: 'Direct Deposit Form', status: data.documentsCompleted?.directDeposit ? '✓ Filed' : '○ Optional' },
                { name: 'Emergency Contacts', status: data.documentsCompleted?.emergencyContact ? '✓ Filed' : '⚠ Required' },
                { name: 'Benefits Enrollment', status: data.documentsCompleted?.benefitsEnrollment ? '✓ Filed' : '○ Pending' },
                { name: 'Safety Agreement', status: data.documentsCompleted?.safetyAgreement ? '✓ Signed' : '⚠ Required' }
            ]
        },
        
        // Training Record
        training: {
            scheduledSessions: data.trainingSchedule?.length || 5,
            completedSessions: countCompletedTraining(data),
            upcomingTraining: getUpcomingTraining(data),
            specializedTraining: getSpecializedTraining(data.position)
        },
        
        // Checklist Summary
        checklistSummary: {
            totalTasks: data.totalTasks || 0,
            completedTasks: data.completedTasks || 0,
            remainingTasks: (data.totalTasks || 0) - (data.completedTasks || 0),
            completionRate: metrics.taskCompletionRate
        },
        
        // Recommendations
        recommendations: generateRecommendations(data, metrics),
        
        // Next Steps
        nextSteps: generateNextSteps(data, metrics),
        
        // Compliance Verification
        compliance: {
            oshaCompliant: metrics.safetyComplete,
            companyPolicyCompliant: metrics.documentsComplete,
            readyForWork: metrics.readyForWork,
            restrictions: generateRestrictions(metrics)
        },
        
        // Sign-off Section
        signoff: {
            hrReviewed: false,
            hrReviewDate: null,
            supervisorApproved: false,
            supervisorApprovalDate: null,
            employeeAcknowledged: data.progress === 100,
            employeeAckDate: data.progress === 100 ? completionDate : null
        }
    };
    
    // Generate formatted output
    const formattedReport = formatReport(report);
    
    return {
        report: report,
        formatted: formattedReport,
        metrics: metrics,
        pdfReady: preparePdfData(report)
    };
}

// Calculate onboarding metrics
function calculateMetrics(data) {
    const safetyModulesComplete = ['ppe', 'hazards', 'emergency', 'crane'].every(
        module => data.completedModules?.includes(module)
    );
    
    const requiredDocs = ['w4', 'i9', 'emergencyContact', 'safetyAgreement'];
    const documentsComplete = requiredDocs.every(
        doc => data.documentsCompleted?.[doc] === true
    );
    
    const taskCompletionRate = data.totalTasks > 0 
        ? Math.round((data.completedTasks / data.totalTasks) * 100) 
        : 0;
    
    return {
        safetyComplete: safetyModulesComplete,
        documentsComplete: documentsComplete,
        taskCompletionRate: taskCompletionRate,
        overallProgress: data.progress || 0,
        readyForWork: safetyModulesComplete && documentsComplete && (data.progress >= 100),
        daysInOnboarding: calculateDaysInOnboarding(data)
    };
}

// Generate report ID
function generateReportId() {
    const timestamp = dayjs().format('YYMMDD-HHmmss');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FSW-OBR-${timestamp}-${random}`;
}

// Generate employee ID if not provided
function generateEmployeeId(data) {
    const name = data.name || data.fullName || 'Unknown';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const dateCode = dayjs().format('YYMMDD');
    return `FSW-${initials}-${dateCode}`;
}

// Determine department from position
function determineDepartment(position) {
    if (!position) return 'Operations';
    const pos = position.toLowerCase();
    
    if (pos.includes('weld')) return 'Welding Department';
    if (pos.includes('fabricat')) return 'Fabrication Department';
    if (pos.includes('erect')) return 'Erection Department';
    if (pos.includes('safety')) return 'Safety Department';
    if (pos.includes('quality')) return 'Quality Control';
    if (pos.includes('admin') || pos.includes('office')) return 'Administration';
    
    return 'Operations';
}

// Format date
function formatDate(date) {
    if (!date) return 'Not Specified';
    return dayjs(date).format('MMMM D, YYYY');
}

// Format phone number
function formatPhone(phone) {
    if (!phone) return 'Not Provided';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

// Get status based on progress
function getStatus(progress) {
    if (progress === 0) return 'Not Started';
    if (progress < 25) return 'Initial Phase';
    if (progress < 50) return 'In Progress';
    if (progress < 75) return 'Advanced Progress';
    if (progress < 100) return 'Near Completion';
    return 'Completed';
}

// Calculate days in onboarding
function calculateDaysInOnboarding(data) {
    const start = data.onboardingStarted || data.startDate;
    if (!start) return 0;
    return dayjs().diff(dayjs(start), 'days') + 1;
}

// Generate certifications based on position
function generateCertifications(data) {
    const certs = [];
    const position = (data.position || '').toLowerCase();
    
    if (position.includes('weld')) {
        certs.push('AWS D1.1 Structural Welding (Required)');
    }
    if (position.includes('crane') || position.includes('rigg')) {
        certs.push('NCCCO Crane Operator Certification (Required)');
        certs.push('Qualified Rigger Certification (Required)');
    }
    if (position.includes('forklift')) {
        certs.push('Forklift Operator Certification (Required)');
    }
    
    return certs.length > 0 ? certs : ['No specialized certifications required'];
}

// Count completed training sessions
function countCompletedTraining(data) {
    if (!data.trainingSchedule) return 0;
    const today = dayjs();
    return data.trainingSchedule.filter(session => 
        dayjs(session.date).isBefore(today)
    ).length;
}

// Get upcoming training
function getUpcomingTraining(data) {
    if (!data.trainingSchedule) return [];
    const today = dayjs();
    return data.trainingSchedule
        .filter(session => dayjs(session.date).isAfter(today))
        .slice(0, 3)
        .map(session => ({
            date: formatDate(session.date),
            activity: session.activity,
            location: session.location
        }));
}

// Get specialized training requirements
function getSpecializedTraining(position) {
    if (!position) return ['General safety and operations training'];
    const pos = position.toLowerCase();
    const training = [];
    
    if (pos.includes('weld')) {
        training.push('Welding procedures and techniques');
        training.push('Weld quality and inspection');
    }
    if (pos.includes('crane')) {
        training.push('Crane operations and signals');
        training.push('Load calculations and rigging');
    }
    if (pos.includes('fabricat')) {
        training.push('Blueprint reading');
        training.push('Precision measurement');
    }
    
    return training.length > 0 ? training : ['Position-specific training as assigned'];
}

// Generate recommendations
function generateRecommendations(data, metrics) {
    const recommendations = [];
    
    if (!metrics.safetyComplete) {
        recommendations.push('Priority: Complete all safety training modules before shop access');
    }
    if (!metrics.documentsComplete) {
        recommendations.push('Complete required documentation for payroll and benefits');
    }
    if (metrics.daysInOnboarding > 30 && metrics.overallProgress < 100) {
        recommendations.push('Schedule meeting with supervisor - onboarding exceeding timeline');
    }
    if (metrics.overallProgress === 100) {
        recommendations.push('Schedule 30-day performance review');
        recommendations.push('Assign to production team');
    }
    
    return recommendations;
}

// Generate next steps
function generateNextSteps(data, metrics) {
    const steps = [];
    
    if (metrics.readyForWork) {
        steps.push('Report to supervisor for work assignment');
        steps.push('Receive tools and equipment issue');
        steps.push('Begin regular production duties');
    } else {
        if (!metrics.safetyComplete) {
            steps.push('Complete remaining safety modules');
        }
        if (!metrics.documentsComplete) {
            steps.push('Submit outstanding documentation');
        }
        steps.push('Review progress with HR coordinator');
    }
    
    return steps;
}

// Generate work restrictions
function generateRestrictions(metrics) {
    const restrictions = [];
    
    if (!metrics.safetyComplete) {
        restrictions.push('No shop floor access until safety training complete');
        restrictions.push('No equipment operation permitted');
    }
    if (!metrics.documentsComplete) {
        restrictions.push('Payroll processing may be delayed');
    }
    
    return restrictions.length > 0 ? restrictions : ['None - cleared for full duties'];
}

// Format report for output
function formatReport(report) {
    const lines = [];
    
    // Header
    lines.push('═'.repeat(60));
    lines.push(report.header.title);
    lines.push('═'.repeat(60));
    lines.push(`${report.header.company}`);
    lines.push(`${report.header.address}`);
    lines.push(`Phone: ${report.header.phone}`);
    lines.push(`Report Date: ${report.header.reportDate}`);
    lines.push(`Report ID: ${report.header.reportId}`);
    lines.push('─'.repeat(60));
    
    // Employee Information
    lines.push('\nEMPLOYEE INFORMATION:');
    lines.push(`Name: ${report.employee.fullName}`);
    lines.push(`Employee ID: ${report.employee.employeeId}`);
    lines.push(`Position: ${report.employee.position}`);
    lines.push(`Department: ${report.employee.department}`);
    lines.push(`Start Date: ${report.employee.startDate}`);
    lines.push('─'.repeat(60));
    
    // Progress Summary
    lines.push('\nONBOARDING PROGRESS:');
    lines.push(`Overall Completion: ${report.progress.overallCompletion}%`);
    lines.push(`Status: ${report.progress.status}`);
    lines.push(`Days in Onboarding: ${report.progress.totalDays}`);
    lines.push('─'.repeat(60));
    
    // Safety Compliance
    lines.push('\nSAFETY COMPLIANCE:');
    lines.push(`Status: ${report.safetyCompliance.overallStatus}`);
    report.safetyCompliance.modules.forEach(module => {
        lines.push(`  ${module.name}: ${module.status}`);
    });
    lines.push('─'.repeat(60));
    
    // Next Steps
    lines.push('\nNEXT STEPS:');
    report.nextSteps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step}`);
    });
    lines.push('═'.repeat(60));
    
    return lines.join('\n');
}

// Prepare data for PDF generation
function preparePdfData(report) {
    return {
        content: report,
        metadata: {
            title: 'FSW Onboarding Report',
            author: 'Flawless Steel Welding HR System',
            subject: `Onboarding Report for ${report.employee.fullName}`,
            keywords: 'onboarding, employee, safety, compliance',
            creator: 'FSW Automated Reporting System'
        }
    };
}

// Main execution
try {
    const result = generateOnboardingReport(employeeData);
    
    return {
        success: true,
        reportId: result.report.header.reportId,
        employee: result.report.employee,
        metrics: result.metrics,
        formattedReport: result.formatted,
        fullReport: result.report,
        pdfData: result.pdfReady,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    
} catch (error) {
    return {
        error: `Report generation failed: ${error.message}`,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        input: employeeData
    };
}