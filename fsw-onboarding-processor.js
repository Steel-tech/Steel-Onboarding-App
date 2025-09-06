// Flawless Steel Welding - Employee Onboarding Data Processor
// This Super Code processes new employee onboarding data from web forms
// Validates completion, generates reports, and manages employee records

// Get input data from previous node or webhook
const inputData = $input.first().json;

// Libraries are pre-loaded as globals in n8n
// Using: validator, dayjs, lodash (_)

// Process employee onboarding data
function processOnboardingData(data) {
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'position', 'startDate'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            missingFields.push(field);
        }
    });
    
    if (missingFields.length > 0) {
        return {
            success: false,
            error: `Missing required fields: ${missingFields.join(', ')}`
        };
    }
    
    // Validate email format
    if (!validator.isEmail(data.email)) {
        return {
            success: false,
            error: 'Invalid email format'
        };
    }
    
    // Format phone number
    const phoneRegex = /^\d{3}-?\d{3}-?\d{4}$/;
    const cleanPhone = data.phone.replace(/[^\d]/g, '');
    if (cleanPhone.length !== 10) {
        return {
            success: false,
            error: 'Invalid phone number. Must be 10 digits.'
        };
    }
    const formattedPhone = `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`;
    
    // Process and format the data
    const processedData = {
        // Employee Information
        employeeId: generateEmployeeId(data.name, data.startDate),
        fullName: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: formattedPhone,
        position: data.position.trim(),
        department: determineDepartment(data.position),
        supervisor: data.supervisor || 'To be assigned',
        
        // Dates and Timeline
        startDate: dayjs(data.startDate).format('YYYY-MM-DD'),
        onboardingStarted: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        expectedCompletionDate: dayjs(data.startDate).add(30, 'days').format('YYYY-MM-DD'),
        
        // Company Information
        company: 'Flawless Steel Welding',
        location: {
            address: '5353 Joliet St',
            city: 'Denver',
            state: 'CO',
            zip: '80239',
            phone: '(720) 638-7289'
        },
        
        // Progress Tracking
        progress: data.progress || 0,
        completedModules: data.completedModules || [],
        completedTasks: data.completedTasks || 0,
        totalTasks: data.totalTasks || 0,
        
        // Safety Compliance
        safetyModules: {
            ppe: data.completedModules?.includes('ppe') || false,
            hazards: data.completedModules?.includes('hazards') || false,
            emergency: data.completedModules?.includes('emergency') || false,
            crane: data.completedModules?.includes('crane') || false
        },
        
        // Required Documents
        documentsCompleted: data.documentsCompleted || {
            w4: false,
            i9: false,
            directDeposit: false,
            emergencyContact: false,
            benefitsEnrollment: false,
            safetyAgreement: false
        },
        
        // Training Schedule
        trainingSchedule: generateTrainingSchedule(data.startDate, data.position),
        
        // Status and Notifications
        status: calculateStatus(data.progress),
        requiresAction: determineRequiredActions(data),
        notifications: generateNotifications(data)
    };
    
    return {
        success: true,
        data: processedData,
        summary: generateSummary(processedData)
    };
}

// Generate unique employee ID
function generateEmployeeId(name, startDate) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const dateCode = dayjs(startDate).format('YYMMDD');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `FSW-${initials}-${dateCode}-${random}`;
}

// Determine department based on position
function determineDepartment(position) {
    const positionLower = position.toLowerCase();
    
    if (positionLower.includes('weld')) return 'Welding';
    if (positionLower.includes('fabricat')) return 'Fabrication';
    if (positionLower.includes('erect') || positionLower.includes('install')) return 'Erection';
    if (positionLower.includes('office') || positionLower.includes('admin')) return 'Administration';
    if (positionLower.includes('safety')) return 'Safety';
    if (positionLower.includes('quality') || positionLower.includes('inspect')) return 'Quality Control';
    if (positionLower.includes('engineer')) return 'Engineering';
    
    return 'Operations';
}

// Generate training schedule based on position
function generateTrainingSchedule(startDate, position) {
    const baseSchedule = [
        { day: 1, activity: 'Orientation & Safety Training', location: 'Main Office' },
        { day: 2, activity: 'PPE Fitting & Equipment Overview', location: 'Safety Office' },
        { day: 3, activity: 'Shop Floor Tour & Team Introduction', location: 'Fabrication Shop' },
        { day: 4, activity: 'Basic Skills Assessment', location: 'Training Bay' },
        { day: 5, activity: 'Job Site Visit & Hands-on Training', location: 'Active Job Site' }
    ];
    
    // Add position-specific training
    const positionLower = position.toLowerCase();
    
    if (positionLower.includes('weld')) {
        baseSchedule.push(
            { day: 6, activity: 'Welding Certification Test Prep', location: 'Welding Shop' },
            { day: 7, activity: 'Welding Procedures Review', location: 'Training Room' }
        );
    }
    
    if (positionLower.includes('crane') || positionLower.includes('rigg')) {
        baseSchedule.push(
            { day: 6, activity: 'Crane & Rigging Certification', location: 'Equipment Yard' },
            { day: 7, activity: 'Load Calculation Training', location: 'Training Room' }
        );
    }
    
    // Add dates to schedule
    return baseSchedule.map(item => ({
        ...item,
        date: dayjs(startDate).add(item.day - 1, 'days').format('YYYY-MM-DD')
    }));
}

// Calculate onboarding status
function calculateStatus(progress) {
    if (progress === 0) return 'Not Started';
    if (progress < 25) return 'Just Started';
    if (progress < 50) return 'In Progress';
    if (progress < 75) return 'Making Good Progress';
    if (progress < 100) return 'Nearly Complete';
    return 'Completed';
}

// Determine required actions
function determineRequiredActions(data) {
    const actions = [];
    
    // Check safety module completion
    if (!data.completedModules?.includes('ppe')) {
        actions.push('Complete PPE Requirements training');
    }
    if (!data.completedModules?.includes('emergency')) {
        actions.push('Complete Emergency Procedures training');
    }
    
    // Check document completion
    if (!data.documentsCompleted?.w4) {
        actions.push('Submit W-4 Tax Form');
    }
    if (!data.documentsCompleted?.i9) {
        actions.push('Complete I-9 Employment Eligibility');
    }
    
    // Check progress milestones
    if (data.progress < 50 && dayjs().diff(dayjs(data.startDate), 'days') > 7) {
        actions.push('Schedule check-in with supervisor - onboarding behind schedule');
    }
    
    return actions;
}

// Generate notifications
function generateNotifications(data) {
    const notifications = [];
    
    // Welcome notification
    if (data.progress === 0) {
        notifications.push({
            type: 'welcome',
            message: `Welcome to Flawless Steel Welding, ${data.name}!`,
            priority: 'info'
        });
    }
    
    // Safety reminders
    if (!data.completedModules?.includes('ppe')) {
        notifications.push({
            type: 'safety',
            message: 'PPE training must be completed before shop access',
            priority: 'high'
        });
    }
    
    // Progress milestone
    if (data.progress >= 50 && data.progress < 100) {
        notifications.push({
            type: 'progress',
            message: `Great progress! ${100 - data.progress}% remaining to complete onboarding`,
            priority: 'info'
        });
    }
    
    // Completion notification
    if (data.progress === 100) {
        notifications.push({
            type: 'completion',
            message: 'Congratulations! Onboarding completed successfully',
            priority: 'success'
        });
    }
    
    return notifications;
}

// Generate summary report
function generateSummary(data) {
    return {
        employeeId: data.employeeId,
        name: data.fullName,
        position: data.position,
        startDate: data.startDate,
        progressPercentage: data.progress,
        status: data.status,
        safetyCompliant: Object.values(data.safetyModules).every(v => v === true),
        documentsComplete: Object.values(data.documentsCompleted).every(v => v === true),
        readyForWork: data.progress === 100,
        nextSteps: data.requiresAction.length > 0 ? data.requiresAction : ['Continue with regular duties'],
        reportGeneratedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reportGeneratedBy: 'FSW Onboarding System'
    };
}

// Main execution
try {
    // Process the onboarding data
    const result = processOnboardingData(inputData);
    
    if (!result.success) {
        return {
            error: result.error,
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            input: inputData
        };
    }
    
    // Return processed data
    return {
        success: true,
        employee: result.data,
        summary: result.summary,
        metadata: {
            processedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            processor: 'FSW Onboarding Processor v1.0',
            company: 'Flawless Steel Welding',
            location: 'Denver, CO'
        }
    };
    
} catch (error) {
    return {
        error: `Processing failed: ${error.message}`,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        input: inputData
    };
}