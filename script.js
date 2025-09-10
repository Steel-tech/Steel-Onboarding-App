// Constants for magic numbers
const CONSTANTS = {
    LOADING_DELAY: 1500,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    AUTO_SAVE_INTERVAL: 30000,
    NOTIFICATION_DISMISS_TIME: 3000,
    ERROR_NOTIFICATION_DISMISS_TIME: 5000,
    VIDEO_COMPLETION_THRESHOLD: 90,
    INTERACTION_LOG_LIMIT: 100,
    TOTAL_SAFETY_MODULES: 4,
    INACTIVITY_TIMEOUT: 300000, // 5 minutes
    PROGRESS_UPDATE_THROTTLE: 250,
    STATE_SAVE_DEBOUNCE: 500,
    SIGNATURE_LINE_WIDTH: 2,
    MAX_LOGS: 500,
    SESSION_CHECK_INTERVAL: 60000 // 1 minute
};

// DOM element cache
const DOM_CACHE = {
    progressBar: null,
    progressText: null,
    loadingScreen: null,
    // Initialize cache after DOM is ready
    init() {
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.loadingScreen = document.getElementById('loadingScreen');
    }
};

// State Management
let appState = {
    currentTab: 'welcome',
    progress: 0,
    completedModules: [],
    employeeData: {},
    checklistItems: {},
    procedureAcknowledgments: {},
    formCompletions: {},
    digitalSignatures: {},
    analytics: {
        sessionStart: Date.now(),
        timeSpentPerTab: {},
        totalTimeSpent: 0,
        completionTimes: {},
        interactions: [],
        lastActivity: Date.now()
    }
};

// Initialize app - wait for authentication
document.addEventListener('DOMContentLoaded', function() {
    showLoadingScreen();
    
    // TEMPORARY: Skip authentication for testing
    console.log('[FSW App] DEVELOPMENT MODE: Skipping authentication');
    setTimeout(() => {
        DOM_CACHE.init();
        loadState();
        initializeEventListeners();
        initializeVideoPlayer();
        updateProgress();
        personalizeWelcomeSection();
        showTab(appState.currentTab);
        initializePerformanceOptimizations();
        initializeAnalytics();
        
        // Initialize prerequisite checks
        updateDocumentsAccess();
        updateCompletionButtons();
        
        // Restore form completion states
        restoreFormCompletions();
        
        // Check if employee info exists, show login modal if not
        checkEmployeeLogin();
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                document.body.classList.remove('loading');
            }, 500);
        }
        
        trackAnalyticsEvent('app_initialized');
    }, 1500);
    
    // Keep original auth listener for when you want to re-enable
    window.addEventListener('authReady', function(event) {
        const user = event.detail.user;
        console.log('[FSW App] Authentication ready, initializing app for:', user.name);
        
        // Initialize app with authenticated user
        setTimeout(() => {
            DOM_CACHE.init();
            loadState();
            initializeEventListeners();
            initializeVideoPlayer();
            updateProgress();
            personalizeWelcomeSection();
            showTab(appState.currentTab);
            initializePerformanceOptimizations();
            initializeAnalytics();
            
            // Initialize prerequisite checks
            updateDocumentsAccess();
            updateCompletionButtons();
            
            // Restore form completion states
            restoreFormCompletions();
            
            // Check if employee info exists, show login modal if not
            checkEmployeeLogin();
            
            trackAnalyticsEvent('app_initialized');
        }, 500);
    });
});

// Global app initialization function (called by auth system)
function initializeApp(user) {
    console.log('[FSW App] App initialization requested for:', user.name);
    // This triggers the authReady event handled above
}

// Load saved state from Supabase with localStorage fallback
async function loadState() {
    try {
        // Get current employee session
        const currentUser = getCurrentEmployee();
        if (!currentUser) {
            console.warn('[FSW State] No employee session found, using default state');
            return;
        }

        console.log('[FSW Debug] Loading state for user:', currentUser.name);

        // Try loading from Supabase first
        if (window.supabase) {
            try {
                await loadFromSupabase(currentUser);
                console.log('[FSW State] ✅ State loaded from Supabase successfully');
                return;
            } catch (supabaseError) {
                console.warn('[FSW State] ⚠️ Supabase load failed, trying localStorage fallback:', supabaseError.message);
            }
        }

        // Fallback to localStorage
        loadFromLocalStorage(currentUser);
        
    } catch (error) {
        console.error('[FSW State] Failed to load state:', error);
        // If all loading fails, fall back to default state
        resetToDefaultState();
    }
}

// Load data from Supabase
async function loadFromSupabase(currentUser) {
    console.log('[FSW Debug] Loading from Supabase...');
    
    // Load user profile
    const { data: profile, error: profileError } = await window.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
        throw profileError;
    }

    if (profile) {
        appState.employeeData = {
            name: profile.name,
            email: profile.email,
            position: profile.position,
            startDate: profile.start_date,
            phone: profile.phone,
            supervisor: profile.supervisor,
            employeeId: profile.employee_id,
            userId: profile.user_id
        };
        console.log('[FSW Debug] Profile loaded:', profile.name);
    }

    // Load progress data
    const { data: progress, error: progressError } = await window.supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', currentUser.id);

    if (progressError) {
        console.warn('[FSW Debug] Progress load error (continuing):', progressError.message);
    } else if (progress && progress.length > 0) {
        appState.completedModules = progress.map(p => p.module_name);
        console.log('[FSW Debug] Loaded completed modules:', appState.completedModules);
    }

    // Load form submissions
    const { data: forms, error: formsError } = await window.supabase
        .from('form_submissions')
        .select('*')
        .eq('user_id', currentUser.id);

    if (formsError) {
        console.warn('[FSW Debug] Forms load error (continuing):', formsError.message);
    } else if (forms && forms.length > 0) {
        appState.formCompletions = {};
        forms.forEach(form => {
            appState.formCompletions[form.form_type] = JSON.parse(form.form_data);
        });
        console.log('[FSW Debug] Loaded form completions:', Object.keys(appState.formCompletions));
    }

    // Restore UI state
    restoreCheckboxStates();
    setTimeout(markDownloadedDocuments, 100);
}

// Load from localStorage (fallback)
function loadFromLocalStorage(currentUser) {
    console.log('[FSW State] Loading from localStorage fallback');
    
    const stateKey = `fsw_onboarding_${currentUser.email}`;
    const savedState = localStorage.getItem(stateKey);
    
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState && typeof parsedState === 'object') {
            appState = {
                ...appState,
                ...parsedState,
                employeeData: currentUser
            };
            restoreCheckboxStates();
            setTimeout(markDownloadedDocuments, 100);
            console.log(`[FSW State] 💾 Loaded from localStorage for ${currentUser.name}`);
        }
    } else {
        appState.employeeData = currentUser;
        console.log(`[FSW State] Fresh start for ${currentUser.name}`);
    }
}

// Reset to default state
function resetToDefaultState() {
    const currentUser = getCurrentEmployee();
    appState = {
        currentTab: 'welcome',
        progress: 0,
        completedModules: [],
        employeeData: currentUser || {},
        checklistItems: {},
        procedureAcknowledgments: {},
        formCompletions: {},
        digitalSignatures: {},
        analytics: {
            sessionStart: Date.now(),
            timeSpentPerTab: {},
            totalTimeSpent: 0,
            completionTimes: {},
            interactions: [],
            lastActivity: Date.now()
        }
    };
}

function getCurrentEmployee() {
    // Get current employee from auth manager
    const authUser = window.authManager?.getCurrentUser?.();
    if (authUser) {
        return authUser;
    }
    
    // Fallback: try session storage (for backwards compatibility)
    const sessionData = sessionStorage.getItem('fsw_user_session');
    if (sessionData) {
        try {
            return JSON.parse(sessionData);
        } catch (e) {
            console.error('Invalid session data');
            return null;
        }
    }
    return null;
}

// Personalize the welcome section with employee information
function personalizeWelcomeSection() {
    const currentEmployee = appState.employeeData;
    if (!currentEmployee?.name) {
        console.warn('No employee data found for personalization');
        return;
    }

    // Update welcome card with employee information
    const welcomeName = document.getElementById('employeeWelcomeName');
    const employeePosition = document.getElementById('employeePosition');
    const employeeStartDate = document.getElementById('employeeStartDate');
    const employeeEmail = document.getElementById('employeeEmail');
    const overallProgress = document.getElementById('overallProgress');
    const miniProgressFill = document.getElementById('miniProgressFill');

    if (welcomeName) {
        welcomeName.textContent = `Welcome, ${currentEmployee.name}!`;
    }

    if (employeePosition) {
        employeePosition.textContent = currentEmployee.position || 'New Team Member';
    }

    if (employeeStartDate) {
        const startDate = new Date(currentEmployee.startDate);
        employeeStartDate.textContent = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    if (employeeEmail) {
        employeeEmail.textContent = currentEmployee.email;
    }

    // Update progress display
    const progressPercentage = Math.round(appState.progress);
    if (overallProgress) {
        overallProgress.textContent = `${progressPercentage}%`;
    }

    if (miniProgressFill) {
        miniProgressFill.style.width = `${progressPercentage}%`;
    }

    // Add welcome message based on progress
    updateWelcomeMessage(currentEmployee, progressPercentage);

    console.log(`[FSW Welcome] Personalized for ${currentEmployee.name} (${progressPercentage}% complete)`);
}

function updateWelcomeMessage(employee, progress) {
    const welcomeCard = document.getElementById('employeeWelcomeCard');
    if (!welcomeCard) return;

    // Remove any existing status message
    const existingStatus = welcomeCard.querySelector('.welcome-status');
    if (existingStatus) {
        existingStatus.remove();
    }

    // Add status message based on progress
    let statusMessage = '';
    let statusClass = '';
    
    if (progress === 0) {
        statusMessage = "Let's get started on your onboarding journey!";
        statusClass = 'status-start';
    } else if (progress < 50) {
        statusMessage = "Great progress! Keep going to complete your onboarding.";
        statusClass = 'status-progress';
    } else if (progress < 100) {
        statusMessage = "You're almost there! Just a few more steps to complete.";
        statusClass = 'status-almost';
    } else {
        statusMessage = "🎉 Congratulations! You've completed your onboarding!";
        statusClass = 'status-complete';
    }

    const statusElement = document.createElement('div');
    statusElement.className = `welcome-status ${statusClass}`;
    statusElement.innerHTML = `<p><i class="fas fa-info-circle"></i> ${statusMessage}</p>`;
    
    welcomeCard.appendChild(statusElement);
}

// Save state to Supabase database with localStorage fallback
async function saveState() {
    try {
        // Get current employee session
        const currentUser = getCurrentEmployee();
        if (!currentUser) {
            console.warn('[FSW State] No employee session found, cannot save state');
            return;
        }

        console.log('[FSW Debug] Starting saveState for user:', currentUser.name);
        
        // Try saving to Supabase first
        try {
            await saveToSupabase(currentUser);
            console.log(`[FSW State] ✅ Progress saved to Supabase for ${currentUser.name}`);
        } catch (supabaseError) {
            console.error('[FSW State] ❌ Supabase save failed, using localStorage fallback:', supabaseError);
            
            // Fallback to localStorage if Supabase fails
            const stateKey = `fsw_onboarding_${currentUser.email}`;
            const stateToSave = {
                ...appState,
                lastSaved: Date.now(),
                savedTo: 'localStorage_fallback'
            };
            
            localStorage.setItem(stateKey, JSON.stringify(stateToSave));
            console.log(`[FSW State] 💾 Progress saved to localStorage (fallback) for ${currentUser.name}`);
        }
        
    } catch (error) {
        console.error('[FSW State] Critical save error:', error);
        showNotification('Warning: Progress could not be saved. Please try again.', 'error');
    }
}

// Save data to Supabase using direct client calls
async function saveToSupabase(currentUser) {
    console.log('[FSW Debug] Preparing Supabase save...');
    
    // Check if Supabase client is available
    if (!window.supabase) {
        throw new Error('Supabase client not available');
    }
    
    // 1. Save/Update user profile
    if (appState.employeeData?.name) {
        console.log('[FSW Debug] Saving user profile to Supabase...');
        
        const profileData = {
            user_id: currentUser.id || crypto.randomUUID(),
            name: appState.employeeData.name || currentUser.name,
            email: appState.employeeData.email || currentUser.email,
            position: appState.employeeData.position || 'Employee',
            start_date: appState.employeeData.startDate || new Date().toISOString().split('T')[0],
            phone: appState.employeeData.phone || null,
            supervisor: appState.employeeData.supervisor || 'HR Team',
            employee_id: appState.employeeData.employeeId || `EMP_${Date.now()}`,
            onboarding_completed: appState.progress >= 100,
            updated_at: new Date().toISOString()
        };
        
        const { data: profileResult, error: profileError } = await window.supabase
            .from('user_profiles')
            .upsert(profileData, { 
                onConflict: 'user_id',
                ignoreDuplicates: false 
            })
            .select();
        
        if (profileError) {
            console.error('[FSW Debug] Profile save error:', profileError);
            throw profileError;
        }
        
        console.log('[FSW Debug] User profile saved:', profileResult);
    }
    
    // 2. Save module progress
    if (appState.completedModules && appState.completedModules.length > 0) {
        console.log('[FSW Debug] Saving module progress to Supabase...');
        
        for (const moduleName of appState.completedModules) {
            const progressData = {
                user_id: currentUser.id || crypto.randomUUID(),
                employee_id: appState.employeeData.employeeId || `EMP_${Date.now()}`,
                module_name: moduleName,
                progress_data: JSON.stringify({ 
                    module: moduleName, 
                    progress: appState.progress, 
                    completedAt: new Date().toISOString() 
                }),
                completed_at: new Date().toISOString()
            };
            
            const { data: progressResult, error: progressError } = await window.supabase
                .from('onboarding_progress')
                .upsert(progressData, { 
                    onConflict: 'user_id,module_name',
                    ignoreDuplicates: false 
                })
                .select();
            
            if (progressError) {
                console.error(`[FSW Debug] Progress save error for ${moduleName}:`, progressError);
                // Continue with other modules even if one fails
                continue;
            }
            
            console.log(`[FSW Debug] Module '${moduleName}' progress saved:`, progressResult);
        }
    }
    
    // 3. Save form submissions
    if (appState.formCompletions && Object.keys(appState.formCompletions).length > 0) {
        console.log('[FSW Debug] Saving form submissions to Supabase...');
        
        for (const [formType, formData] of Object.entries(appState.formCompletions)) {
            if (formData.completed) {
                const submissionData = {
                    user_id: currentUser.id || crypto.randomUUID(),
                    employee_id: appState.employeeData.employeeId || `EMP_${Date.now()}`,
                    form_type: formType,
                    form_data: JSON.stringify(formData),
                    digital_signature: appState.digitalSignatures?.[formType] || null,
                    submitted_at: new Date().toISOString(),
                    ip_address: 'browser_session'
                };
                
                const { data: formResult, error: formError } = await window.supabase
                    .from('form_submissions')
                    .upsert(submissionData, { 
                        onConflict: 'user_id,form_type',
                        ignoreDuplicates: false 
                    })
                    .select();
                
                if (formError) {
                    console.error(`[FSW Debug] Form save error for ${formType}:`, formError);
                    continue;
                }
                
                console.log(`[FSW Debug] Form '${formType}' saved:`, formResult);
            }
        }
    }
    
    console.log('[FSW Debug] ✅ All data successfully saved to Supabase');
}

// Helper function for fire-and-forget saving
function saveStateAsync() {
    saveState().catch(error => console.error('[FSW] Save state error:', error));
}

// Debug function to test saveState manually
window.testSaveState = async function() {
    console.log('[FSW Debug] Manual save test initiated...');
    console.log('[FSW Debug] Current user:', getCurrentEmployee());
    console.log('[FSW Debug] App state:', JSON.stringify(appState, null, 2));
    
    try {
        await saveState();
        console.log('[FSW Debug] ✅ Manual save test completed successfully!');
        return 'SUCCESS: Data saved to Supabase';
    } catch (error) {
        console.error('[FSW Debug] ❌ Manual save test failed:', error);
        return 'ERROR: ' + error.message;
    }
};

// Initialize all event listeners
function initializeEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });

    // Employee form submission - now handled by login modal

    // Safety module completion buttons - include both selectors
    document.querySelectorAll('.complete-btn, .modern-button[data-module]').forEach(btn => {
        btn.addEventListener('click', function() {
            const module = this.getAttribute('data-module');
            if (module && module !== 'video') { // Skip video button, has its own handler
                completeModule(module, this);
            }
        });
    });

    // Training buttons
    document.querySelectorAll('.training-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showTrainingModal(this.parentElement.querySelector('h3').textContent);
        });
    });

    // Download buttons - handled by onclick in HTML for real file downloads
    // Track document downloads
    document.querySelectorAll('.download-btn').forEach(btn => {
        if (!btn.hasAttribute('onclick')) {
            btn.addEventListener('click', function() {
                downloadDocument(this.parentElement.querySelector('h3').textContent);
            });
        } else {
            // For real file downloads, add error handling
            const originalOnclick = btn.getAttribute('onclick');
            btn.removeAttribute('onclick');
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const docName = this.parentElement.querySelector('h3').textContent;
                const regex = /window\.open\('([^']+)'/;
                const match = regex.exec(originalOnclick);
                const fileName = match?.[1];
                if (fileName) {
                    handleDocumentDownload(fileName, docName, this);
                }
            });
        }
    });

    // Checklist checkboxes
    document.querySelectorAll('.checklist-checkbox, .form-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleCheckboxChange(this);
        });
    });

    // Generate report button
    const reportBtn = document.getElementById('generateReport');
    if (reportBtn) {
        reportBtn.addEventListener('click', generateCompletionReport);
    }

    // Modal close buttons - fix: add listeners to ALL close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    document.querySelectorAll('.modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Delegated handler for fillable form buttons (remove inline handlers for CSP)
    document.addEventListener('click', function(e) {
        const fillBtn = e.target.closest('.fill-form-btn');
        if (fillBtn) {
            e.preventDefault();
            const container = fillBtn.closest('.form-item');
            const formType = container?.getAttribute('data-form');
            if (formType) {
                openFillableForm(formType);
            }
        }
    });

    // Proactively remove inline onclick attributes for CSP compatibility
    document.querySelectorAll('.fill-form-btn[onclick]').forEach(btn => btn.removeAttribute('onclick'));

    // Floating Employee Sign-In Form
    const signinForm = document.getElementById('employeeSigninForm');
    if (signinForm) {
        signinForm.addEventListener('submit', handleEmployeeSignin);
    }

    // Video Completion Button
    const videoCompletionBtn = document.getElementById('videoCompletionBtn');
    if (videoCompletionBtn) {
        videoCompletionBtn.addEventListener('click', function() {
            if (!this.disabled) {
                markVideoComplete(this);
            }
        });
    }

    // Initialize floating form state
    initializeFloatingSigninForm();
}
// Tab navigation with analytics
function showTab(tabName) {
    // Track tab switch
    trackTabSwitch(tabName);
    
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
    });
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
        activeTab.setAttribute('tabindex', '0');
    }

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Save state
    appState.currentTab = tabName;
    saveState().catch(error => console.error('[FSW] Save state error in showTab:', error));
}

// Complete safety module with analytics
function completeModule(moduleName, button) {
    if (!appState.completedModules.includes(moduleName)) {
        appState.completedModules.push(moduleName);
        button.textContent = '✓ Completed';
        button.classList.add('completed');
        button.disabled = true;
        
        // Track module completion
        trackModuleCompletion(moduleName);
        
        saveState().catch(error => console.error('[FSW] Save state error in completeModule:', error));
        updateProgress();
        showNotification(`${moduleName.toUpperCase()} module completed!`);
        
        // Check if all safety and equipment training modules are completed
        const safetyModules = ['ppe', 'hazards', 'emergency', 'crane'];
        const equipmentModules = ['welding-equipment', 'cutting-tools', 'lifting-equipment', 'measuring-tools', 'fabrication-machinery', 'field-equipment'];
        
        const safetyCompleted = safetyModules.every(module => appState.completedModules.includes(module));
        const equipmentCompleted = equipmentModules.every(module => appState.completedModules.includes(module));
        
        if (safetyCompleted && equipmentCompleted) {
            setTimeout(() => {
                showCompletionModal('Congratulations! You have completed all required safety training and equipment training. You are now ready for final sign-off!');
            }, 500);
        } else if (safetyCompleted && !equipmentCompleted) {
            setTimeout(() => {
                showNotification('All safety modules completed! Please complete equipment training modules to finish.', 'info');
            }, 500);
        } else if (equipmentCompleted && !safetyCompleted) {
            setTimeout(() => {
                showNotification('All equipment training completed! Please complete safety training modules to finish.', 'info');
            }, 500);
        }
    }
}

// Save employee data with enhanced validation
function saveEmployeeData() {
    try {
        const form = document.getElementById('employeeForm');
        if (!form) {
            throw new Error('Employee form not found');
        }
        
        const formData = new FormData(form);
        
        // Enhanced validation with security checks
        const requiredFields = ['name', 'email', 'phone', 'position', 'startDate'];
        const missingFields = [];
        
        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                missingFields.push(field);
            }
        });
        
        if (missingFields.length > 0) {
            throw new Error(`Please fill in required fields: ${missingFields.join(', ')}`);
        }
        
        // Enhanced input validation and sanitization
        const name = formData.get('name').trim();
        const email = formData.get('email').toLowerCase().trim();
        const phone = formData.get('phone').trim();
        const position = formData.get('position').trim();
        const startDate = formData.get('startDate');
        const supervisor = formData.get('supervisor')?.trim() || 'To be assigned';
        
        // Validate name (letters, spaces, hyphens, apostrophes only)
        const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
        if (!nameRegex.test(name)) {
            throw new Error('Name must contain only letters, spaces, hyphens, and apostrophes (2-50 characters)');
        }
        
        // Validate email format with stricter regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // Validate phone number (US format)
        const phoneRegex = /^[+]?1?[\s\-.()]?\d{3}[\s\-.()]?\d{3}[\s\-.()]?\d{4}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('Please enter a valid US phone number');
        }
        
        // Validate position (alphanumeric, spaces, common job title characters)
        const positionRegex = /^[a-zA-Z\d\s\-/&.,]{2,100}$/;
        if (!positionRegex.test(position)) {
            throw new Error('Position must be 2-100 characters using letters, numbers, and common punctuation');
        }
        
        // Validate start date (not more than 1 year in past or future)
        const startDateObj = new Date(startDate);
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        
        if (startDateObj < oneYearAgo || startDateObj > oneYearFromNow) {
            throw new Error('Start date must be within one year of today');
        }
        
        // Sanitize and store data
        appState.employeeData = {
            name: name.replace(/\s+/g, ' '), // Normalize whitespace
            email: email,
            phone: phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'), // Format phone
            position: position.replace(/\s+/g, ' '), // Normalize whitespace
            startDate: startDate,
            supervisor: supervisor.replace(/\s+/g, ' ') // Normalize whitespace
        };
        
        saveState().catch(error => console.error('[FSW] Save state error in employee form:', error));
        showNotification('Employee information saved successfully!', 'success');
        updateProgress();
        
        // Track successful form completion
        trackAnalyticsEvent('employee_form_completed', {
            employeeName: appState.employeeData.name,
            position: appState.employeeData.position
        });
        
    } catch (error) {
        logger.error('Error saving employee data', {
            error: error.message,
            formData: Object.fromEntries(new FormData(document.getElementById('employeeForm')).entries())
        });
        showNotification(`Error: ${error.message}`, 'error');
    }
}


// Handle checkbox changes
function handleCheckboxChange(checkbox) {
    const id = checkbox.id || Math.random().toString(36).substring(2, 11);
    appState.checklistItems[id] = checkbox.checked;
    
    // Update visual state
    const parent = checkbox.closest('.checklist-item, .form-item');
    if (parent) {
        if (checkbox.checked) {
            parent.classList.add('completed');
        } else {
            parent.classList.remove('completed');
        }
    }
    
    saveState().catch(error => console.error('[FSW] Save state error in checklist:', error));
    updateProgress();
    updateChecklistStats();
}

// Mark downloaded documents
function markDownloadedDocuments() {
    if (appState.downloadedDocuments) {
        appState.downloadedDocuments.forEach(docName => {
            // Find document cards with matching titles
            document.querySelectorAll('.document-card h3').forEach(title => {
                if (title.textContent === docName || docName.includes(title.textContent.substring(0, 10))) {
                    const card = title.closest('.document-card');
                    if (card && !card.classList.contains('downloaded')) {
                        card.classList.add('downloaded');
                        // Add a checkmark
                        if (!card.querySelector('.download-indicator')) {
                            const indicator = document.createElement('div');
                            indicator.className = 'download-indicator';
                            indicator.innerHTML = '<i class="fas fa-wrench"></i> Downloaded';
                            card.insertBefore(indicator, card.querySelector('.download-btn'));
                        }
                    }
                }
            });
        });
    }
}

// Restore checkbox states
function restoreCheckboxStates() {
    Object.keys(appState.checklistItems).forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = appState.checklistItems[id];
            const parent = checkbox.closest('.checklist-item, .form-item');
            if (parent && checkbox.checked) {
                parent.classList.add('completed');
            }
        }
    });
    
    // Restore completed modules
    appState.completedModules.forEach(module => {
        const btn = document.querySelector(`[data-module="${module}"]`);
        if (btn) {
            btn.textContent = '✓ Completed';
            btn.classList.add('completed');
            btn.disabled = true;
        }
    });
}

// Update progress bar
function updateProgress() {
    const totalItems = calculateTotalItems();
    const completedItems = calculateCompletedItems();
    
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    appState.progress = percentage;
    
    const progressBar = DOM_CACHE.progressBar || document.getElementById('progressBar');
    const progressText = DOM_CACHE.progressText || document.getElementById('progressText');
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    if (progressText) {
        progressText.textContent = percentage + '% Complete';
    }
    
    // Note: Completion modal is now triggered only by safety and equipment training completion
    // not by overall progress percentage
}

// Calculate total items
function calculateTotalItems() {
    const checkboxes = document.querySelectorAll('.checklist-checkbox, .form-checkbox');
    const modules = document.querySelectorAll('.complete-btn').length;
    const procedureCheckboxes = document.querySelectorAll('.understanding-checkbox').length;
    const requiredForms = (typeof formTemplates !== 'undefined') ? Object.keys(formTemplates).length : 6; // Fallback to 6 known forms
    
    return checkboxes.length + modules + procedureCheckboxes + requiredForms + 1; // +1 for employee form
}

// Calculate completed items
function calculateCompletedItems() {
    const checkedBoxes = document.querySelectorAll('.checklist-checkbox:checked, .form-checkbox:checked').length;
    const completedModules = appState.completedModules.length;
    const employeeFormCompleted = Object.keys(appState.employeeData).length > 0 ? 1 : 0;
    const acknowledgedProcedures = Object.values(appState.procedureAcknowledgments)
        .filter(ack => ack.acknowledged).length;
    const completedForms = Object.keys(appState.formCompletions).length;
    
    return checkedBoxes + completedModules + employeeFormCompleted + acknowledgedProcedures + completedForms;
}

// Update checklist statistics
function updateChecklistStats() {
    const totalCheckboxes = document.querySelectorAll('.checklist-checkbox').length;
    const completedCheckboxes = document.querySelectorAll('.checklist-checkbox:checked').length;
    const remaining = totalCheckboxes - completedCheckboxes;
    
    document.getElementById('totalTasks').textContent = totalCheckboxes;
    document.getElementById('completedTasks').textContent = completedCheckboxes;
    document.getElementById('remainingTasks').textContent = remaining;
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Set colors based on notification type
    let backgroundColor = '#27ae60'; // success (green)
    if (type === 'error') backgroundColor = '#e74c3c'; // error (red)
    if (type === 'warning') backgroundColor = '#f39c12'; // warning (orange)
    if (type === 'info') backgroundColor = '#3498db'; // info (blue)
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after longer time for errors
    const dismissTime = type === 'error' ? CONSTANTS.ERROR_NOTIFICATION_DISMISS_TIME : CONSTANTS.NOTIFICATION_DISMISS_TIME;
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, dismissTime);
}

// Show training modal
function showTrainingModal(equipmentType) {
    alert(`Training module for ${equipmentType} will be available soon.\n\nPlease contact your supervisor for hands-on training.`);
}

// Handle document download with multiple fallback strategies
function handleDocumentDownload(fileName, documentName, buttonElement) {
    logger.info('Document download requested', { fileName, documentName });
    
    // Create a simple download link and click it immediately
    const downloadLink = document.createElement('a');
    downloadLink.href = fileName;
    downloadLink.download = fileName;
    downloadLink.style.display = 'none';
    
    // Add to DOM, click, then remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Mark as downloaded and show success
    markDocumentAsDownloaded(fileName, documentName, buttonElement);
    showNotification(`${documentName} download started!`, 'success');
    
    // Track the download
    trackDocumentDownload(documentName);
}

// Simple function to mark document as downloaded in UI
function markDocumentAsDownloaded(fileName, documentName, buttonElement) {
    const card = buttonElement.closest('.document-card');
    if (card && !card.classList.contains('downloaded')) {
        card.classList.add('downloaded');
        if (!card.querySelector('.download-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'download-indicator';
            indicator.innerHTML = '<i class="fas fa-check-circle"></i> Downloaded';
            indicator.style.cssText = 'color: #2ecc71; font-weight: bold; margin-top: 0.5rem;';
            card.insertBefore(indicator, buttonElement);
        }
    }
}

// Alternative download method using anchor element
function tryAlternativeDownload(fileName, documentName, buttonElement) {
    logger.info('Trying alternative download method', { fileName, documentName });
    
    try {
        // Create temporary download link
        const link = document.createElement('a');
        link.href = fileName;
        link.download = fileName;
        link.style.display = 'none';
        link.target = '_blank';
        
        // Add to DOM temporarily
        document.body.appendChild(link);
        
        // Trigger click event
        link.click();
        
        // Clean up after a short delay
        setTimeout(() => {
            if (link.parentNode) {
                document.body.removeChild(link);
            }
        }, 100);
        
        // Track successful download
        trackSuccessfulDownload(fileName, documentName, buttonElement);
        
    } catch (error) {
        logger.error('Alternative download method failed', { error: error.message });
        handleDownloadFailure(fileName, documentName, buttonElement, error);
    }
}

// Track successful downloads with improved UI feedback
function trackSuccessfulDownload(fileName, documentName, buttonElement) {
    logger.info('Download initiated successfully', { fileName, documentName });
    
    // Update UI immediately
    const card = buttonElement.closest('.document-card');
    if (card && !card.classList.contains('downloaded')) {
        card.classList.add('downloaded');
        if (!card.querySelector('.download-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'download-indicator';
            indicator.innerHTML = '<i class="fas fa-check-circle"></i> Downloaded';
            indicator.style.cssText = 'color: #2ecc71; font-weight: bold; margin-top: 0.5rem;';
            card.insertBefore(indicator, buttonElement);
        }
    }
    
    // Track in app state
    trackDocumentDownload(documentName);
    
    // Show success message
    showNotification(`${documentName} download started successfully!`, 'success');
    
    // Log success for debugging
    logger.info('Document download successful', {
        fileName,
        documentName,
        timestamp: new Date().toISOString()
    });
}

// Enhanced download failure handling
function handleDownloadFailure(fileName, documentName, buttonElement, error) {
    logger.error('Document download failed', { fileName, documentName, error: error.message });
    
    // Update button to show retry option
    const card = buttonElement.closest('.document-card');
    if (card) {
        // Show temporary error state
        buttonElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Download Failed';
        buttonElement.style.backgroundColor = '#e74c3c';
        buttonElement.disabled = true;
        
        // Add retry option after 3 seconds
        setTimeout(() => {
            buttonElement.innerHTML = '<i class="fas fa-redo"></i> Retry Download';
            buttonElement.style.backgroundColor = '#f39c12';
            buttonElement.disabled = false;
            
            // Replace click handler with retry
            const newButton = buttonElement.cloneNode(true);
            newButton.onclick = () => handleDocumentDownload(fileName, documentName, newButton);
            buttonElement.parentNode.replaceChild(newButton, buttonElement);
        }, 3000);
    }
    
    // Provide specific error guidance
    let errorMessage = `Unable to download ${documentName}. `;
    
    // Check current protocol and provide specific advice
    if (window.location.protocol === 'file:') {
        errorMessage += 'Please serve the app via HTTP server (python3 -m http.server 8000) and try again.';
    } else {
        errorMessage += 'Please allow popups for this site or contact HR at (720) 638-7289 for assistance.';
    }
    
    showNotification(errorMessage, 'error');
    
    // Log detailed error information
    logger.error('Document download failed', {
        fileName,
        documentName,
        error: error.message,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent.substring(0, 100),
        timestamp: new Date().toISOString()
    });
}

// Show document not available message
function showDocumentNotAvailable(documentName, buttonElement) {
    const card = buttonElement.closest('.document-card');
    if (card) {
        // Update button to show unavailable state
        buttonElement.innerHTML = '<i class="fas fa-stopwatch"></i> Coming Soon';
        buttonElement.disabled = true;
        buttonElement.style.opacity = '0.6';
        
        // Add notice to card
        if (!card.querySelector('.document-notice')) {
            const notice = document.createElement('div');
            notice.className = 'document-notice';
            notice.style.cssText = 'background: #fff3cd; color: #856404; padding: 0.75rem; margin: 1rem 0; border-radius: 5px; border: 1px solid #ffeaa7; font-size: 0.9rem;';
            notice.innerHTML = '<i class="fas fa-toolbox"></i> This document will be provided by HR during your first day.';
            card.insertBefore(notice, buttonElement);
        }
    }
    
    showNotification(`${documentName} will be provided by HR during orientation.`, 'info');
}

// Track document download
function trackDocumentDownload(documentName) {
    // Initialize downloaded documents tracking
    if (!appState.downloadedDocuments) {
        appState.downloadedDocuments = [];
    }
    
    // Add to downloaded list if not already there
    if (!appState.downloadedDocuments.includes(documentName)) {
        appState.downloadedDocuments.push(documentName);
        saveStateAsync();
        
        // Check if all required documents have been downloaded
        const requiredDocs = [
            'Employee Handbook 2024',
            'Health & Safety Manual 2024',
            'New Hire Orientation 2025'
        ];
        
        const allRequiredDownloaded = requiredDocs.every(doc => 
            appState.downloadedDocuments.some(downloaded => 
                downloaded.includes(doc.substring(0, 10))
            )
        );
        
        if (allRequiredDownloaded && !appState.completedModules.includes('required-documents')) {
            appState.completedModules.push('required-documents');
            saveStateAsync();
            updateProgress();
            showNotification('All required documents have been downloaded!');
        } else {
            showNotification(`${documentName} downloaded successfully!`);
        }
        
        // Update completion buttons when documents are downloaded
        updateCompletionButtons();
    }
    
    updateProgress();
}

// Download document (for placeholder documents)
function downloadDocument(documentName) {
    // Track the download
    trackDocumentDownload(documentName);
    
    // Show notification
    showNotification(`${documentName} will be available soon.`);
}

// Check if video is completed (prerequisite for documents)
function isVideoCompleted() {
    return appState.completedModules?.includes('video') || false;
}

// Check if all required documents are downloaded (prerequisite for completion)
function areAllDocumentsDownloaded() {
    if (!appState.downloadedDocuments || appState.downloadedDocuments.length === 0) {
        return false;
    }
    
    const requiredDocuments = [
        'Employee Handbook 2024',
        'Health & Safety Manual 2024', 
        'New Hire Orientation 2025',
        'Orientation Presentation',
        'Steel Erection Training',
        'Welding Procedures Training'
    ];
    
    return requiredDocuments.every(doc => 
        appState.downloadedDocuments.some(downloaded => 
            downloaded.includes(doc) || doc.includes(downloaded.substring(0, 10))
        )
    );
}

// Update documents section based on video completion
function updateDocumentsAccess() {
    const warning = document.getElementById('documentsPrerequisiteWarning');
    const mainContent = document.getElementById('documentsMainContent');
    const documentsSection = document.querySelector('#documents .modern-content-block:nth-of-type(3)');
    
    if (!isVideoCompleted()) {
        // Show warning, hide content
        if (warning) warning.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        if (documentsSection) documentsSection.style.display = 'none';
        
        // Hide all other document sections
        const allDocSections = document.querySelectorAll('#documents .modern-grid, #documents .doc-category');
        allDocSections.forEach(section => section.style.display = 'none');
    } else {
        // Hide warning, show content
        if (warning) warning.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        if (documentsSection) documentsSection.style.display = 'block';
        
        // Show all document sections
        const allDocSections = document.querySelectorAll('#documents .modern-grid, #documents .doc-category');
        allDocSections.forEach(section => section.style.display = 'block');
    }
}

// Employee Login Functions
function checkEmployeeLogin() {
    // Skip login modal - go straight to onboarding (restored from 10:49:13 AM version)
    // Set default employee data if none exists
    if (!appState.employeeData || Object.keys(appState.employeeData).length === 0 || !appState.employeeData.name) {
        appState.employeeData = {
            name: 'New Employee',
            email: 'employee@flawlesssteel.com',
            phone: '(720) 638-7289',
            position: 'Team Member',
            startDate: new Date().toISOString().split('T')[0],
            supervisor: 'HR Team'
        };
        saveStateAsync();
    }
    // Update the summary with employee data
    updateEmployeeSummary();
}

function showEmployeeLoginModal() {
    const modal = document.getElementById('employeeLoginModal');
    if (modal) {
        // Pre-fill form if editing existing data
        if (appState.employeeData) {
            document.getElementById('login-name').value = appState.employeeData.name || '';
            document.getElementById('login-email').value = appState.employeeData.email || '';
            document.getElementById('login-phone').value = appState.employeeData.phone || '';
            document.getElementById('login-position').value = appState.employeeData.position || '';
            document.getElementById('login-start-date').value = appState.employeeData.startDate || '';
            document.getElementById('login-supervisor').value = appState.employeeData.supervisor || '';
        }
        
        modal.style.display = 'block';
        
        // Add form submission handler if not already added
        const form = document.getElementById('employeeLoginForm');
        if (form && !form.hasAttribute('data-handler-added')) {
            form.setAttribute('data-handler-added', 'true');
            form.addEventListener('submit', handleEmployeeLogin);
        }
    }
}

function handleEmployeeLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const employeeData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        position: formData.get('position'),
        startDate: formData.get('startDate'),
        supervisor: formData.get('supervisor') || 'TBD'
    };
    
    // Validate required fields
    if (!employeeData.name || !employeeData.email || !employeeData.phone || !employeeData.position || !employeeData.startDate) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    // Generate UUID for user ID (Supabase expects UUID format)
    const userId = crypto.randomUUID();
    
    // Save employee data with user ID
    appState.employeeData = {
        ...employeeData,
        employeeId: `EMP_${Date.now()}`,
        userId: userId
    };
    
    // Create user session for getCurrentEmployee()
    const userSession = {
        id: userId,
        name: employeeData.name,
        email: employeeData.email,
        employeeId: appState.employeeData.employeeId
    };
    
    // Store session
    sessionStorage.setItem('fsw_user_session', JSON.stringify(userSession));
    
    console.log('[FSW Debug] Created user session:', userSession);
    
    saveStateAsync();
    
    // Close modal
    document.getElementById('employeeLoginModal').style.display = 'none';
    
    // Update UI
    updateEmployeeSummary();
    personalizeWelcomeSection();
    
    // Show success message
    const employeeName = employeeData.name ? String(employeeData.name) : 'New Employee';
    showNotification(`Welcome to Flawless Steel Welding, ${employeeName}!`, 'success');
    
    // Update progress
    updateProgress();
    
    console.log('[FSW Login] Employee logged in:', employeeData.name || 'Unknown');
}

function updateEmployeeSummary() {
    if (!appState.employeeData) return;
    
    const data = appState.employeeData;
    document.getElementById('summary-name').textContent = data.name || 'Not provided';
    document.getElementById('summary-position').textContent = data.position || 'Not provided';
    document.getElementById('summary-email').textContent = data.email || 'Not provided';
    document.getElementById('summary-start-date').textContent = data.startDate ? 
        new Date(data.startDate).toLocaleDateString() : 'Not provided';
    document.getElementById('summary-phone').textContent = data.phone || 'Not provided';
}

// Restore form completion states from appState
function restoreFormCompletions() {
    if (!appState.formCompletions) {
        appState.formCompletions = {};
        return;
    }
    
    // Update form status displays for completed forms
    Object.keys(appState.formCompletions).forEach(formType => {
        updateFormStatus(formType, 'completed');
    });
    
    console.log(`[FSW Forms] Restored ${Object.keys(appState.formCompletions).length} completed forms`);
}

// Update completion buttons based on document prerequisite
function updateCompletionButtons() {
    const allDocumentsDownloaded = areAllDocumentsDownloaded();
    const completionButtons = document.querySelectorAll('.complete-btn, .modern-button[data-module]');
    
    completionButtons.forEach(btn => {
        const module = btn.getAttribute('data-module');
        
        // Skip video completion button - no prerequisites for that
        if (module === 'video') return;
        
        // Skip if already completed
        if (appState.completedModules?.includes(module)) return;
        
        if (!allDocumentsDownloaded) {
            // Disable button and add warning
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            
            // Update button text to show requirement
            const originalText = btn.innerHTML;
            if (!originalText.includes('Complete Documents First')) {
                btn.setAttribute('data-original-text', originalText);
                btn.innerHTML = '<i class="fas fa-lock"></i> Complete Documents First';
            }
            
            // Add click handler to show warning
            btn.onclick = function(e) {
                e.preventDefault();
                showNotification('You must download and review all documents before marking modules as complete.', 'warning');
                showTab('documents');
                return false;
            };
        } else {
            // Enable button and restore original text
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            
            const originalText = btn.getAttribute('data-original-text');
            if (originalText) {
                btn.innerHTML = originalText;
                btn.removeAttribute('data-original-text');
            }
            
            // Restore original click handler
            btn.onclick = function() {
                completeModule(module, this);
            };
        }
    });
}

// Download all documents with staggered approach
function downloadAllDocuments() {
    // Check video prerequisite first
    if (!isVideoCompleted()) {
        showNotification('Please complete the orientation video first before downloading documents.', 'warning');
        showTab('video');
        return;
    }
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const progressDiv = document.getElementById('downloadAllProgress');
    
    // Define all available documents
    const allDocuments = [
        { fileName: 'fsw-employee-handbook-2024.pdf', displayName: 'Employee Handbook 2024' },
        { fileName: 'fsw-health-safety-2024.pdf', displayName: 'Health & Safety Manual 2024' },
        { fileName: 'fsw-new-hire-orientation-2025.pdf', displayName: 'New Hire Orientation 2025' },
        { fileName: 'fsw-orientation-presentation.pptx', displayName: 'Orientation Presentation' },
        { fileName: 'fsw-steel-erection-training.ppt', displayName: 'Steel Erection Training' },
        { fileName: 'fsw-welding-procedures-training.pdf', displayName: 'Welding Procedures Training' }
    ];
    
    // Disable button and show progress
    downloadAllBtn.disabled = true;
    downloadAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    progressDiv.style.display = 'block';
    
    let downloadCount = 0;
    const totalDocuments = allDocuments.length;
    
    // Function to download each document with delay
    const downloadWithDelay = (index) => {
        if (index >= totalDocuments) {
            // All downloads complete
            progressDiv.innerHTML = `<i class="fas fa-check-circle"></i> All ${totalDocuments} documents downloaded successfully!`;
            downloadAllBtn.innerHTML = '<i class="fas fa-check"></i> All Downloaded!';
            downloadAllBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            
            // Track completion
            if (!appState.downloadedDocuments) {
                appState.downloadedDocuments = [];
            }
            allDocuments.forEach(doc => {
                if (!appState.downloadedDocuments.includes(doc.displayName)) {
                    appState.downloadedDocuments.push(doc.displayName);
                    trackDocumentDownload(doc.displayName);
                }
            });
            
            saveStateAsync();
            updateProgress();
            showNotification('All documents downloaded successfully! 📁');
            
            // Update completion buttons now that documents are downloaded
            updateCompletionButtons();
            
            // Reset button after 3 seconds
            setTimeout(() => {
                downloadAllBtn.disabled = false;
                downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All Documents <i class="fas fa-file-archive"></i>';
                downloadAllBtn.style.background = 'linear-gradient(135deg, #2c3e50, #3498db)';
                progressDiv.style.display = 'none';
            }, 3000);
            
            return;
        }
        
        const doc = allDocuments[index];
        downloadCount++;
        
        // Update progress
        progressDiv.innerHTML = `<i class="fas fa-download"></i> Downloading ${downloadCount} of ${totalDocuments}: ${doc.displayName}...`;
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = doc.fileName;
        downloadLink.download = doc.fileName;
        downloadLink.style.display = 'none';
        
        // Add to DOM, click, then remove
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Continue with next download after delay
        setTimeout(() => downloadWithDelay(index + 1), 500);
    };
    
    // Start downloads
    downloadWithDelay(0);
}

// Enhanced Data Export System
class DataExporter {
    constructor() {
        this.reportTypes = {
            'completion': 'Completion Report',
            'analytics': 'Analytics Report', 
            'full': 'Complete Export',
            'hr': 'HR Summary'
        };
    }
    
    exportData(format = 'json', type = 'full') {
        const data = this.prepareExportData(type);
        
        switch(format.toLowerCase()) {
            case 'json':
                this.exportAsJSON(data, type);
                break;
            case 'csv':
                this.exportAsCSV(data, type);
                break;
            case 'txt':
                this.exportAsText(data, type);
                break;
            case 'pdf':
                this.exportAsPDF(data, type);
                break;
            default:
                logger.error('Unsupported export format', { format });
        }
    }
    
    prepareExportData(type) {
        const baseData = {
            exportInfo: {
                timestamp: new Date().toISOString(),
                type: type,
                application: 'Flawless Steel Welding - Onboarding Portal',
                version: '2.0',
                employee: appState.employeeData.name || 'Unknown'
            },
            employee: appState.employeeData,
            progress: {
                overallProgress: appState.progress,
                completedModules: appState.completedModules,
                totalTasks: Object.keys(appState.checklistItems).length,
                completedTasks: Object.keys(appState.checklistItems).filter(key => appState.checklistItems[key]).length
            }
        };
        
        switch(type) {
            case 'completion':
                return {
                    ...baseData,
                    completionDetails: this.getCompletionDetails()
                };
            case 'analytics':
                return {
                    ...baseData,
                    analytics: generateAnalyticsReport(),
                    logs: logger.logs.slice(-50)
                };
            case 'hr':
                return {
                    ...baseData,
                    hrSummary: this.getHRSummary()
                };
            default: // 'full'
                return {
                    ...baseData,
                    analytics: generateAnalyticsReport(),
                    completionDetails: this.getCompletionDetails(),
                    checklistItems: appState.checklistItems,
                    logs: logger.logs.slice(-50),
                    rawState: appState
                };
        }
    }
    
    getCompletionDetails() {
        return {
            safetyModules: {
                ppe: appState.completedModules.includes('ppe'),
                hazards: appState.completedModules.includes('hazards'),
                emergency: appState.completedModules.includes('emergency'),
                crane: appState.completedModules.includes('crane')
            },
            requiredForms: {
                w4: appState.checklistItems['w4-form'] || false,
                i9: appState.checklistItems['i9-form'] || false,
                directDeposit: appState.checklistItems['direct-deposit'] || false,
                emergencyContact: appState.checklistItems['emergency-contact'] || false,
                benefitsEnrollment: appState.checklistItems['benefits'] || false,
                safetyAgreement: appState.checklistItems['safety-agreement'] || false
            },
            completionStatus: appState.progress === 100 ? 'COMPLETE' : 'IN_PROGRESS',
            readyForWork: this.isReadyForWork()
        };
    }
    
    getHRSummary() {
        const timeSpent = Date.now() - appState.analytics.sessionStart;
        return {
            employeeInfo: {
                name: appState.employeeData.name,
                position: appState.employeeData.position,
                startDate: appState.employeeData.startDate,
                supervisor: appState.employeeData.supervisor
            },
            completionMetrics: {
                overallProgress: appState.progress + '%',
                timeSpent: formatDuration(timeSpent),
                modulesCompleted: appState.completedModules.length,
                tasksCompleted: Object.keys(appState.checklistItems).filter(key => appState.checklistItems[key]).length
            },
            complianceStatus: {
                safetyTrainingComplete: ['ppe', 'hazards', 'emergency', 'crane'].every(m => appState.completedModules.includes(m)),
                documentsComplete: this.areRequiredDocumentsComplete(),
                readyForWork: this.isReadyForWork()
            },
            recommendations: this.getRecommendations()
        };
    }
    
    isReadyForWork() {
        const safetyComplete = ['ppe', 'hazards', 'emergency', 'crane'].every(m => appState.completedModules.includes(m));
        const docsComplete = this.areRequiredDocumentsComplete();
        return safetyComplete && docsComplete && appState.progress >= 90;
    }
    
    areRequiredDocumentsComplete() {
        const requiredDocs = ['w4-form', 'i9-form', 'emergency-contact', 'safety-agreement'];
        return requiredDocs.every(doc => appState.checklistItems[doc]);
    }
    
    getRecommendations() {
        const recommendations = [];
        
        if (!this.isReadyForWork()) {
            if (appState.progress < 50) {
                recommendations.push('Schedule check-in with supervisor - low progress');
            }
            if (!this.areRequiredDocumentsComplete()) {
                recommendations.push('Ensure all required documents are completed');
            }
            if (!['ppe', 'hazards', 'emergency', 'crane'].every(m => appState.completedModules.includes(m))) {
                recommendations.push('Complete all safety training modules before work assignment');
            }
        } else {
            recommendations.push('Employee ready for work assignment');
            recommendations.push('Schedule 30-day performance review');
        }
        
        return recommendations;
    }
    
    exportAsJSON(data, type) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `fsw-onboarding-${type}-${Date.now()}.json`);
        logger.info('Data exported as JSON', { type });
    }
    
    exportAsCSV(data, type) {
        let csvContent = '';
        
        if (type === 'hr') {
            // HR Summary CSV format
            csvContent = this.generateHRCSV(data.hrSummary);
        } else {
            // General CSV format
            csvContent = this.generateGeneralCSV(data);
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadFile(blob, `fsw-onboarding-${type}-${Date.now()}.csv`);
        logger.info('Data exported as CSV', { type });
    }
    
    generateHRCSV(hrSummary) {
        const lines = [
            'Employee Information',
            `Name,${hrSummary.employeeInfo.name}`,
            `Position,${hrSummary.employeeInfo.position}`,
            `Start Date,${hrSummary.employeeInfo.startDate}`,
            `Supervisor,${hrSummary.employeeInfo.supervisor}`,
            '',
            'Completion Metrics',
            `Overall Progress,${hrSummary.completionMetrics.overallProgress}`,
            `Time Spent,${hrSummary.completionMetrics.timeSpent}`,
            `Modules Completed,${hrSummary.completionMetrics.modulesCompleted}`,
            `Tasks Completed,${hrSummary.completionMetrics.tasksCompleted}`,
            '',
            'Compliance Status',
            `Safety Training Complete,${hrSummary.complianceStatus.safetyTrainingComplete ? 'Yes' : 'No'}`,
            `Documents Complete,${hrSummary.complianceStatus.documentsComplete ? 'Yes' : 'No'}`,
            `Ready for Work,${hrSummary.complianceStatus.readyForWork ? 'Yes' : 'No'}`,
            '',
            'Recommendations'
        ];
        
        hrSummary.recommendations.forEach(rec => {
            lines.push(rec);
        });
        
        return lines.join('\n');
    }
    
    generateGeneralCSV(data) {
        const lines = [
            'Field,Value',
            `Employee Name,${data.employee.name || ''}`,
            `Position,${data.employee.position || ''}`,
            `Progress,${data.progress.overallProgress}%`,
            `Completed Modules,${data.progress.completedModules.join('; ')}`,
            `Export Date,${data.exportInfo.timestamp}`
        ];
        
        return lines.join('\n');
    }
    
    exportAsText(data, type) {
        const content = this.generateTextReport(data, type);
        const blob = new Blob([content], { type: 'text/plain' });
        this.downloadFile(blob, `fsw-onboarding-${type}-${Date.now()}.txt`);
        logger.info('Data exported as text', { type });
    }
    
    generateTextReport(data, type) {
        const lines = [
            'FLAWLESS STEEL WELDING - ONBOARDING REPORT',
            '='.repeat(50),
            `Report Type: ${this.reportTypes[type] || type}`,
            `Generated: ${new Date(data.exportInfo.timestamp).toLocaleString()}`,
            `Employee: ${data.employee.name || 'Not provided'}`,
            `Position: ${data.employee.position || 'Not provided'}`,
            '',
            'PROGRESS SUMMARY',
            '-'.repeat(30),
            `Overall Progress: ${data.progress.overallProgress}%`,
            `Completed Modules: ${data.progress.completedModules.join(', ')}`,
            `Tasks Completed: ${data.progress.completedTasks}/${data.progress.totalTasks}`,
            ''
        ];
        
        if (data.hrSummary) {
            lines.push('HR SUMMARY', '-'.repeat(20));
            lines.push(`Ready for Work: ${data.hrSummary.complianceStatus.readyForWork ? 'YES' : 'NO'}`);
            lines.push('Recommendations:');
            data.hrSummary.recommendations.forEach(rec => lines.push(`- ${rec}`));
        }
        
        return lines.join('\n');
    }
    
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification(`Report exported: ${filename}`, 'success');
    }
}

// Initialize data exporter
const dataExporter = new DataExporter();

// Enhanced completion report generation
function generateCompletionReport() {
    logger.info('Generating completion report');
    dataExporter.exportData('txt', 'completion');
}

// Show completion modal
function showCompletionModal(message) {
    const modal = document.getElementById('completionModal');
    const modalContent = modal.querySelector('p:nth-of-type(1)');
    const employeeNameSpan = document.getElementById('completionEmployeeName');
    
    modalContent.textContent = message;
    
    // Update employee name from sign-in data
    if (employeeNameSpan && appState.employeeData && appState.employeeData.name) {
        employeeNameSpan.textContent = appState.employeeData.name;
    }
    
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('completionModal');
    modal.style.display = 'none';
}

// YouTube Video Configuration and Tracking
const YOUTUBE_CONFIG = {
    // Replace this with your actual YouTube video ID
    // Example: if your YouTube URL is https://www.youtube.com/watch?v=ABC123DEF45
    // Then your VIDEO_ID should be: ABC123DEF45
    VIDEO_ID: 'iYN_kTnYWR4', // Flawless Steel Welding Orientation Video
    
    // YouTube API configuration
    PLAYER_VARS: {
        autoplay: 0,
        controls: 1,
        disablekb: 0,
        enablejsapi: 1,
        fs: 1,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
    }
};

// Global YouTube player variable
let youtubePlayer = null;

// Load YouTube API
function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        initializeYouTubePlayer();
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
    
    // YouTube API callback
    window.onYouTubeIframeAPIReady = initializeYouTubePlayer;
}

// Initialize YouTube player
function initializeYouTubePlayer() {
    const container = document.getElementById('youtubeVideoContainer');
    const placeholder = document.getElementById('videoPlaceholder');
    
    if (!container || !placeholder) return;
    
    // Check if video ID is configured
    if (YOUTUBE_CONFIG.VIDEO_ID === 'YOUR_VIDEO_ID_HERE') {
        // Show setup message
        placeholder.innerHTML = `
            <div>
                <i class="fas fa-cog" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.8;"></i>
                <h4 style="margin-bottom: 0.5rem;">YouTube Setup Required</h4>
                <p style="margin: 0; opacity: 0.9;">Please follow the YOUTUBE-SETUP.md instructions to configure your video</p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.7;">Update VIDEO_ID in script.js after uploading to YouTube</p>
            </div>
        `;
        return;
    }
    
    // Replace placeholder with YouTube player
    placeholder.style.display = 'none';
    
    const playerDiv = document.createElement('div');
    playerDiv.id = 'youtubePlayer';
    container.appendChild(playerDiv);
    
    // Initialize YouTube player
    youtubePlayer = new YT.Player('youtubePlayer', {
        height: '450',
        width: '100%',
        videoId: YOUTUBE_CONFIG.VIDEO_ID,
        playerVars: YOUTUBE_CONFIG.PLAYER_VARS,
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

// YouTube player ready callback
function onPlayerReady(event) {
    // Show video progress section
    const progressSection = document.getElementById('videoProgressSection');
    if (progressSection) {
        progressSection.style.display = 'block';
    }
    
    // Check if video was previously completed
    const videoCompleted = appState.completedModules.includes('video');
    const completionStatus = document.getElementById('videoCompletionStatus');
    const completionBtn = document.getElementById('videoCompletionBtn');
    
    if (videoCompleted) {
        if (completionStatus) completionStatus.style.display = 'block';
        if (completionBtn) {
            completionBtn.innerHTML = '<i class="fas fa-check-circle"></i> Video Completed!';
            completionBtn.classList.remove('disabled');
            completionBtn.disabled = false;
        }
        updateVideoProgress(100);
    } else {
        // Ensure button starts disabled
        if (completionBtn) {
            completionBtn.innerHTML = '<i class="fas fa-lock"></i> Complete Video First (90% required)';
            completionBtn.classList.add('disabled');
            completionBtn.disabled = true;
        }
    }
    
    trackAnalyticsEvent('youtube_player_ready', {
        timestamp: Date.now(),
        videoId: YOUTUBE_CONFIG.VIDEO_ID
    });
}

// YouTube player state change callback
let watchStartTime = null;
let totalWatchTime = 0;

function onPlayerStateChange(event) {
    const videoCompleted = appState.completedModules.includes('video');
    
    switch (event.data) {
        case YT.PlayerState.PLAYING:
            watchStartTime = Date.now();
            trackAnalyticsEvent('video_started', {
                timestamp: Date.now(),
                currentTime: youtubePlayer.getCurrentTime()
            });
            
            // Start periodic progress checking
            if (!videoCompleted) {
                startProgressTracking();
            }
            break;
            
        case YT.PlayerState.PAUSED:
        case YT.PlayerState.ENDED:
            if (watchStartTime) {
                totalWatchTime += Date.now() - watchStartTime;
                watchStartTime = null;
            }
            
            if (event.data === YT.PlayerState.ENDED) {
                trackAnalyticsEvent('video_ended', {
                    timestamp: Date.now(),
                    totalWatchTime: totalWatchTime,
                    watchedFull: true
                });
                
                // Auto-complete on video end
                if (!videoCompleted) {
                    completeVideoModule();
                }
            }
            break;
    }
}

// Progress tracking for YouTube video
let progressInterval = null;

function updateVideoProgress(percentage) {
    const progressFill = document.getElementById('videoProgressFill');
    const progressText = document.getElementById('videoProgressText');
    const completionBtn = document.getElementById('videoCompletionBtn');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    
    if (progressText) {
        progressText.textContent = Math.round(percentage) + '% watched';
    }
    
    // Enable completion button at 90%
    if (completionBtn && percentage >= 90) {
        completionBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Video as Completed';
        completionBtn.classList.remove('disabled');
        completionBtn.disabled = false;
    }
}

function startProgressTracking() {
    if (progressInterval) clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        if (!youtubePlayer || !youtubePlayer.getDuration) return;
        
        const currentTime = youtubePlayer.getCurrentTime();
        const duration = youtubePlayer.getDuration();
        const videoCompleted = appState.completedModules.includes('video');
        
        if (duration && !videoCompleted) {
            const watchedPercentage = (currentTime / duration) * 100;
            updateVideoProgress(watchedPercentage);
            
            // Auto-complete when 90% watched (but don't auto-mark, let user click)
            if (watchedPercentage >= 90) {
                // Button is already enabled by updateVideoProgress
                trackAnalyticsEvent('video_90_percent_reached', {
                    timestamp: Date.now(),
                    watchTime: currentTime
                });
            }
        }
    }, 1000); // Check every second for smooth progress
}

// Complete video module function
function completeVideoModule() {
    if (!appState.completedModules.includes('video')) {
        appState.completedModules.push('video');
        saveStateAsync();
        updateProgress();
        updateDocumentsAccess();
        
        showNotification('Great! You\'ve completed the orientation video requirement.', 'success');
        
        // Update completion button
        const completionBtn = document.querySelector('[data-module="video"]');
        if (completionBtn) {
            completionBtn.innerHTML = '<i class="fas fa-check-circle"></i> Video Completed!';
            completionBtn.classList.add('completed');
            completionBtn.disabled = true;
        }
        
        // Show completion status
        const completionStatus = document.getElementById('videoCompletionStatus');
        if (completionStatus) {
            completionStatus.style.display = 'block';
        }
        
        trackAnalyticsEvent('video_auto_completed', {
            timestamp: Date.now(),
            method: 'youtube_tracking'
        });
    }
}

// Main video initialization function
function initializeVideoPlayer() {
    loadYouTubeAPI();
}

// Video completion handler
function markVideoComplete(button) {
    // Mark module as completed
    if (!appState.completedModules.includes('video')) {
        appState.completedModules.push('video');
        saveStateAsync();
        updateProgress();
    }
    
    // Update UI
    button.innerHTML = '<i class="fas fa-check-circle"></i> Video Completed!';
    button.classList.remove('disabled');
    button.disabled = true;
    
    // Show completion status
    const completionStatus = document.getElementById('videoCompletionStatus');
    if (completionStatus) {
        completionStatus.style.display = 'block';
    }
    
    // Update progress to 100%
    updateVideoProgress(100);
    
    // Stop progress tracking
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    // Update documents access now that video is complete
    updateDocumentsAccess();
    
    // Show notification about next step
    setTimeout(() => {
        showNotification('Great! You can now access the Safety Training and Documents sections.', 'success');
    }, 1000);
    
    // Track completion
    trackAnalyticsEvent('video_completed', {
        timestamp: Date.now(),
        completionMethod: 'manual_button_click'
    });
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Performance Optimization Functions
function showLoadingScreen() {
    const loadingScreen = DOM_CACHE.loadingScreen || document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

function hideLoadingScreen() {
    const loadingScreen = DOM_CACHE.loadingScreen || document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, CONSTANTS.STATE_SAVE_DEBOUNCE);
    }
}

function initializePerformanceOptimizations() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Add loading states to buttons
    initializeButtonLoadingStates();
    
    // Initialize tab navigation with keyboard support
    initializeKeyboardNavigation();
}

function initializeButtonLoadingStates() {
    const buttons = document.querySelectorAll('button[type="submit"], .complete-btn, .download-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled && !this.classList.contains('completed')) {
                this.classList.add('btn-loading');
                setTimeout(() => {
                    this.classList.remove('btn-loading');
                }, 1000);
            }
        });
    });
}

function initializeKeyboardNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach((tab, index) => {
        tab.addEventListener('keydown', function(e) {
            switch(e.key) {
                case 'ArrowRight':
                case 'ArrowDown': {
                    e.preventDefault();
                    const nextIndex = (index + 1) % tabs.length;
                    tabs[nextIndex].focus();
                    break;
                }
                case 'ArrowLeft':
                case 'ArrowUp': {
                    e.preventDefault();
                    const prevIndex = index === 0 ? tabs.length - 1 : index - 1;
                    tabs[prevIndex].focus();
                    break;
                }
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    tab.click();
                    break;
            }
        });
    });
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Analytics and Tracking Functions
function initializeAnalytics() {
    // Track tab switching time
    appState.analytics.currentTabStartTime = Date.now();
    
    // Track mouse movement and clicks
    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);
    
    // Track time spent in application
    setInterval(updateTimeTracking, 10000); // Every 10 seconds
    
    // Track when user becomes inactive
    let inactivityTimer;
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    
    function resetInactivityTimer() {
        appState.analytics.lastActivity = Date.now();
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            trackAnalyticsEvent('user_inactive', {
                duration: Date.now() - appState.analytics.lastActivity
            });
        }, CONSTANTS.INACTIVITY_TIMEOUT);
    }
}

function trackInteraction(event) {
    const interaction = {
        type: event.type,
        target: event.target.tagName,
        className: event.target.className,
        timestamp: Date.now(),
        tab: appState.currentTab
    };
    
    appState.analytics.interactions.push(interaction);
    
    // Keep only last interactions to prevent memory issues
    if (appState.analytics.interactions.length > CONSTANTS.INTERACTION_LOG_LIMIT) {
        appState.analytics.interactions.shift();
    }
}

function trackAnalyticsEvent(eventType, data = {}) {
    const event = {
        type: eventType,
        timestamp: Date.now(),
        tab: appState.currentTab,
        data: data
    };
    
    appState.analytics.interactions.push(event);
    logger.debug('Analytics Event tracked', event);
}

function trackTabSwitch(newTab) {
    const now = Date.now();
    const timeSpent = now - (appState.analytics.currentTabStartTime || now);
    
    // Update time spent on previous tab
    if (appState.currentTab) {
        appState.analytics.timeSpentPerTab[appState.currentTab] = 
            (appState.analytics.timeSpentPerTab[appState.currentTab] || 0) + timeSpent;
    }
    
    // Start tracking new tab
    appState.analytics.currentTabStartTime = now;
    
    trackAnalyticsEvent('tab_switch', {
        fromTab: appState.currentTab,
        toTab: newTab,
        timeSpentOnPreviousTab: timeSpent
    });
}

function trackModuleCompletion(moduleName) {
    appState.analytics.completionTimes[moduleName] = Date.now();
    
    trackAnalyticsEvent('module_completed', {
        module: moduleName,
        completionTime: Date.now() - appState.analytics.sessionStart,
        totalProgress: appState.progress
    });
}

function updateTimeTracking() {
    const now = Date.now();
    appState.analytics.totalTimeSpent = now - appState.analytics.sessionStart;
    
    // Update time for current tab
    const currentTabTime = now - (appState.analytics.currentTabStartTime || now);
    appState.analytics.timeSpentPerTab[appState.currentTab] = 
        (appState.analytics.timeSpentPerTab[appState.currentTab] || 0) + currentTabTime;
    
    appState.analytics.currentTabStartTime = now;
    
    debouncedSaveState();
}

function generateAnalyticsReport() {
    const totalTime = Date.now() - appState.analytics.sessionStart;
    const report = {
        sessionInfo: {
            startTime: new Date(appState.analytics.sessionStart).toLocaleString(),
            totalDuration: formatDuration(totalTime),
            currentProgress: appState.progress + '%'
        },
        timeSpentPerTab: Object.entries(appState.analytics.timeSpentPerTab).map(([tab, time]) => ({
            tab: tab,
            duration: formatDuration(time),
            percentage: Math.round((time / totalTime) * 100) + '%'
        })),
        completedModules: appState.completedModules.length,
        totalInteractions: appState.analytics.interactions.length,
        completionTimes: Object.entries(appState.analytics.completionTimes).map(([module, time]) => ({
            module: module,
            completedAt: new Date(time).toLocaleString(),
            timeToComplete: formatDuration(time - appState.analytics.sessionStart)
        }))
    };
    
    return report;
}

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

// Error Handling and Logging System
class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = CONSTANTS.MAX_LOGS;
    }
    
    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data,
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100),
            employee: appState.employeeData.name || 'Unknown'
        };
        
        this.logs.push(logEntry);
        
        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Console output based on level
        switch(level) {
            case 'ERROR':
                console.error('[FSW Onboarding]', message, data);
                break;
            case 'WARN':
                console.warn('[FSW Onboarding]', message, data);
                break;
            case 'INFO':
                console.info('[FSW Onboarding]', message, data);
                break;
            default:
                console.log('[FSW Onboarding]', message, data);
        }
        
        // Save logs to localStorage
        this.saveLogs();
        
        // Show user notification for errors
        if (level === 'ERROR') {
            this.showErrorToUser(message);
        }
    }
    
    error(message, data) { this.log('ERROR', message, data); }
    warn(message, data) { this.log('WARN', message, data); }
    info(message, data) { this.log('INFO', message, data); }
    debug(message, data) { this.log('DEBUG', message, data); }
    
    showErrorToUser(message) {
        showNotification(`System Error: ${message}. If this continues, please contact HR at (720) 638-7289.`, 'error');
    }
    
    saveLogs() {
        try {
            localStorage.setItem('fswOnboardingLogs', JSON.stringify({
                logs: this.logs.slice(-100), // Keep last 100 logs
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Failed to save logs:', error);
        }
    }
    
    exportLogs() {
        const logData = {
            exportTime: new Date().toISOString(),
            employee: appState.employeeData.name || 'Unknown',
            session: appState.analytics.sessionStart,
            logs: this.logs,
            analytics: generateAnalyticsReport()
        };
        
        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fsw-onboarding-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('fswOnboardingLogs');
        this.info('Logs cleared');
    }
}

// Initialize logger
const logger = new Logger();

// Global error handler
window.addEventListener('error', function(event) {
    logger.error('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
    });
});

// Enhanced error handling wrapper
function safeExecute(func, context = 'Unknown', fallback = null) {
    try {
        return func();
    } catch (error) {
        logger.error(`Error in ${context}`, {
            error: error.message,
            stack: error.stack
        });
        return fallback;
    }
}

// Enhanced async error handling
async function safeExecuteAsync(func, context = 'Unknown', fallback = null) {
    try {
        return await func();
    } catch (error) {
        logger.error(`Async error in ${context}`, {
            error: error.message,
            stack: error.stack
        });
        return fallback;
    }
}

// Network error handler
function handleNetworkError(error, context) {
    logger.error(`Network error in ${context}`, {
        error: error.message,
        stack: error.stack,
        networkStatus: navigator.onLine ? 'online' : 'offline'
    });
    
    if (!navigator.onLine) {
        showNotification('You appear to be offline. Some features may not work properly.', 'warning');
    }
}

// Optimized save state with debouncing
const debouncedSaveState = debounce(saveState, CONSTANTS.STATE_SAVE_DEBOUNCE);

// Performance optimizations
let saveStateTimer;
let progressUpdateTimer;

// Debounced auto-save using constants
const debouncedAutoSave = debounce(() => {
    clearInterval(saveStateTimer);
    saveStateTimer = setInterval(saveState, CONSTANTS.AUTO_SAVE_INTERVAL);
}, 1000);

// Initialize auto-save
debouncedAutoSave();

// Save state before page unload with cleanup
window.addEventListener('beforeunload', (event) => {
    // Clear timers to prevent memory leaks
    clearInterval(saveStateTimer);
    clearInterval(progressUpdateTimer);
    
    // Save final state
    saveStateAsync();
    
    // Check if there are unsaved changes
    const hasUnsavedChanges = checkUnsavedChanges();
    if (hasUnsavedChanges) {
        event.preventDefault();
        return 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// Check for unsaved changes
function checkUnsavedChanges() {
    const form = document.getElementById('employeeForm');
    if (!form) return false;
    
    const formData = new FormData(form);
    const hasFormData = Array.from(formData.values()).some(value => value.trim() !== '');
    const hasStoredData = Object.keys(appState.employeeData).length > 0;
    
    return hasFormData && !hasStoredData;
}

// Optimized progress updates with throttling
const throttledProgressUpdate = throttle(updateProgress, CONSTANTS.PROGRESS_UPDATE_THROTTLE);

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===== PROCEDURE ACKNOWLEDGMENTS & FILLABLE FORMS SYSTEM =====

// Procedure acknowledgment tracking
function initializeProcedureAcknowledgments() {
    const checkboxes = document.querySelectorAll('.understanding-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const procedure = this.getAttribute('data-procedure');
            appState.procedureAcknowledgments[procedure] = {
                acknowledged: this.checked,
                timestamp: Date.now(),
                employeeName: appState.employeeData.name || 'Unknown'
            };
            
            updateProcedureProgress();
            saveStateAsync();
            
            logger.info('Procedure acknowledgment updated', {
                procedure: procedure,
                acknowledged: this.checked,
                employee: appState.employeeData.name
            });
        });
        
        // Restore checkbox state
        const procedure = checkbox.getAttribute('data-procedure');
        if (appState.procedureAcknowledgments[procedure]?.acknowledged) {
            checkbox.checked = true;
        }
    });
}

function updateProcedureProgress() {
    // Update overall progress
    updateProgress();
}

// ===== FILLABLE FORMS SYSTEM =====

// Global variables for signature functionality
let isDrawing = false;
let signatureContext = null;
let currentFormType = '';

// Form templates
const formTemplates = {
    handbook: {
        title: 'Employee Handbook Acknowledgment',
        sections: [
            {
                title: 'Employee Information',
                fields: [
                    { name: 'fullName', label: 'Full Name *', type: 'text', required: true },
                    { name: 'position', label: 'Position/Title *', type: 'text', required: true },
                    { name: 'department', label: 'Department', type: 'text', required: false },
                    { name: 'startDate', label: 'Start Date *', type: 'date', required: true }
                ]
            },
            {
                title: 'Acknowledgment',
                content: `I acknowledge that I have received and read the Employee Handbook. I understand that it contains important policies and procedures that I am expected to follow. I understand that the handbook is not a contract of employment and that my employment is at-will. I agree to comply with all company policies and procedures outlined in the handbook.`,
                fields: [
                    { name: 'understands', label: 'I understand and agree to comply with all policies', type: 'checkbox', required: true }
                ]
            }
        ]
    },
    'health-safety': {
        title: 'Health & Safety Manual Acknowledgment',
        sections: [
            {
                title: 'Employee Information',
                fields: [
                    { name: 'fullName', label: 'Full Name *', type: 'text', required: true },
                    { name: 'position', label: 'Position/Title *', type: 'text', required: true },
                    { name: 'startDate', label: 'Start Date *', type: 'date', required: true }
                ]
            },
            {
                title: 'Safety Manual Acknowledgment',
                content: `I acknowledge that I have received and read the Health & Safety Manual. I understand the comprehensive safety guidelines, OSHA compliance requirements, and emergency procedures outlined in this manual. I understand my responsibilities for maintaining a safe work environment and agree to follow all safety protocols, use proper PPE, report hazards immediately, and participate in safety training programs.`,
                fields: [
                    { name: 'safetyManualRead', label: 'I have read and understand the Health & Safety Manual', type: 'checkbox', required: true },
                    { name: 'oshaCompliance', label: 'I understand OSHA compliance requirements', type: 'checkbox', required: true },
                    { name: 'emergencyProcedures', label: 'I understand emergency procedures and evacuation plans', type: 'checkbox', required: true }
                ]
            }
        ]
    },
    'new-hire-orientation': {
        title: 'New Hire Orientation Acknowledgment',
        sections: [
            {
                title: 'Employee Information',
                fields: [
                    { name: 'fullName', label: 'Full Name *', type: 'text', required: true },
                    { name: 'position', label: 'Position/Title *', type: 'text', required: true },
                    { name: 'startDate', label: 'Start Date *', type: 'date', required: true }
                ]
            },
            {
                title: 'Orientation Completion',
                content: `I acknowledge that I have completed the New Hire Orientation guide. I have reviewed the orientation materials covering my first day through first month expectations. I understand the company culture, organizational structure, job responsibilities, and performance expectations outlined in the orientation materials.`,
                fields: [
                    { name: 'orientationCompleted', label: 'I have completed the new hire orientation materials', type: 'checkbox', required: true },
                    { name: 'jobResponsibilities', label: 'I understand my job responsibilities and performance expectations', type: 'checkbox', required: true },
                    { name: 'companyCulture', label: 'I understand the company culture and organizational structure', type: 'checkbox', required: true }
                ]
            }
        ]
    },
    'steel-erection': {
        title: 'Steel Erection Training Acknowledgment',
        sections: [
            {
                title: 'Employee Information',
                fields: [
                    { name: 'fullName', label: 'Full Name *', type: 'text', required: true },
                    { name: 'position', label: 'Position/Title *', type: 'text', required: true },
                    { name: 'startDate', label: 'Start Date *', type: 'date', required: true }
                ]
            },
            {
                title: 'Steel Erection Training',
                content: `I acknowledge that I have completed the Steel Erection Training program. I understand the specialized procedures for steel erection, rigging operations, and associated safety requirements. I understand the importance of following proper rigging techniques, load calculations, crane safety protocols, and fall protection requirements when working on steel erection projects.`,
                fields: [
                    { name: 'steelErectionTraining', label: 'I have completed steel erection training procedures', type: 'checkbox', required: true },
                    { name: 'riggingSafety', label: 'I understand rigging operations and safety requirements', type: 'checkbox', required: true },
                    { name: 'craneSafety', label: 'I understand crane safety protocols and hand signals', type: 'checkbox', required: true },
                    { name: 'fallProtection', label: 'I understand fall protection requirements for elevated work', type: 'checkbox', required: true }
                ]
            }
        ]
    },
    'welding-procedures': {
        title: 'Welding Procedures Training Acknowledgment',
        sections: [
            {
                title: 'Employee Information',
                fields: [
                    { name: 'fullName', label: 'Full Name *', type: 'text', required: true },
                    { name: 'position', label: 'Position/Title *', type: 'text', required: true },
                    { name: 'startDate', label: 'Start Date *', type: 'date', required: true }
                ]
            },
            {
                title: 'Welding Procedures Training',
                content: `I acknowledge that I have completed the Welding Procedures Training and understand how to read and interpret Welding Procedure Specifications (WPS). I understand AWS D1.1 requirements, electrode classifications, welding parameters, temperature requirements, and inspection criteria. I understand the importance of following WPS requirements exactly to ensure weld quality and structural integrity.`,
                fields: [
                    { name: 'wpsTraining', label: 'I understand how to read and interpret WPS documents', type: 'checkbox', required: true },
                    { name: 'awsStandards', label: 'I understand AWS D1.1 requirements and standards', type: 'checkbox', required: true },
                    { name: 'weldingParameters', label: 'I understand welding parameters and electrode specifications', type: 'checkbox', required: true },
                    { name: 'qualityRequirements', label: 'I understand quality requirements and inspection criteria', type: 'checkbox', required: true }
                ]
            }
        ]
    }
};

// Open fillable form modal
function openFillableForm(formType) {
    currentFormType = formType;
    const template = formTemplates[formType];
    
    if (!template) {
        logger.error('Form template not found', { formType });
        return;
    }
    
    const formContent = document.getElementById('formContent');
    formContent.innerHTML = generateFormHTML(template, formType);
    
    // Pre-fill with employee data if available
    prefillEmployeeData();
    
    // Show modal
    document.getElementById('fillableFormModal').style.display = 'block';
    
    // Add form event listeners
    initializeFormEvents();
    
    logger.info('Fillable form opened', { formType });
}

// Generate form HTML
function generateFormHTML(template, formType) {
    let html = `
        <div class="form-header">
            <h3>${template.title}</h3>
            <p>Please complete all required fields and provide your digital signature.</p>
        </div>
        <form id="acknowledgeForm" data-form-type="${formType}">
    `;
    
    template.sections.forEach((section, sectionIndex) => {
        html += `
            <div class="form-section">
                <h4>${section.title}</h4>
        `;
        
        if (section.content) {
            html += `<div class="acknowledgment-text">${section.content}</div>`;
        }
        
        section.fields.forEach((field, fieldIndex) => {
            const fieldId = `${formType}_${sectionIndex}_${fieldIndex}`;
            const requiredAttr = field.required ? 'required' : '';
            const requiredLabel = field.required ? ' *' : '';
            
            html += `<div class="form-field">`;
            
            if (field.type === 'checkbox') {
                html += `
                    <label>
                        <input type="checkbox" id="${fieldId}" name="${field.name}" ${requiredAttr}>
                        ${field.label}${requiredLabel}
                    </label>
                `;
            } else {
                html += `
                    <label for="${fieldId}">${field.label}${requiredLabel}</label>
                    <input type="${field.type}" id="${fieldId}" name="${field.name}" ${requiredAttr}>
                `;
            }
            
            html += `</div>`;
        });
        
        html += `</div>`;
    });
    
    html += `
            <div class="signature-required">
                <p><strong>Digital signature required to complete this form</strong></p>
                <button type="button" class="signature-btn" onclick="openSignaturePad()">
                    <i class="fas fa-signature"></i> Add Digital Signature
                </button>
                <div id="signatureStatus" style="margin-top: 1rem; display: none;">
                    <i class="fas fa-check-circle" style="color: #2ecc71;"></i>
                    Signature captured successfully
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button type="button" onclick="closeFillableForm()" style="margin-right: 1rem; background: #6c757d;">
                    Cancel
                </button>
                <button type="submit" class="signature-btn">
                    <i class="fas fa-save"></i> Submit Form
                </button>
            </div>
        </form>
    `;
    
    return html;
}

// Pre-fill employee data
function prefillEmployeeData() {
    if (appState.employeeData) {
        const fields = {
            fullName: appState.employeeData.name,
            position: appState.employeeData.position,
            startDate: appState.employeeData.startDate
        };
        
        Object.entries(fields).forEach(([fieldName, value]) => {
            const inputs = document.querySelectorAll(`input[name="${fieldName}"]`);
            inputs.forEach(input => {
                if (input && value) {
                    input.value = value;
                }
            });
        });
    }
}

// Initialize form event listeners
function initializeFormEvents() {
    const form = document.getElementById('acknowledgeForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmission);
    }
}

// Handle form submission
function handleFormSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const formType = event.target.getAttribute('data-form-type');
    
    // Validate required fields
    if (!validateForm(event.target)) {
        showNotification('Please complete all required fields.', 'error');
        return;
    }
    
    // Check if signature is present
    if (!appState.digitalSignatures[formType]) {
        showNotification('Digital signature is required to submit this form.', 'error');
        return;
    }
    
    // Save form data
    const formDataObject = {};
    for (let [key, value] of formData.entries()) {
        formDataObject[key] = value;
    }
    
    appState.formCompletions[formType] = {
        data: formDataObject,
        signature: appState.digitalSignatures[formType],
        completedAt: Date.now(),
        employeeName: appState.employeeData.name || 'Unknown'
    };
    
    // Update form status
    updateFormStatus(formType, 'completed');
    updateAcknowledmentProgress();
    
    // Close modal
    closeFillableForm();
    
    // Show success notification
    showNotification('Form submitted successfully!', 'success');
    
    // Update overall progress
    updateProgress();
    
    logger.info('Form completed', {
        formType,
        employeeName: appState.employeeData.name,
        completedAt: new Date().toISOString()
    });
    
    saveStateAsync();
}

// Validate form
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value && field.type !== 'checkbox') {
            isValid = false;
            field.style.borderColor = '#e74c3c';
        } else if (field.type === 'checkbox' && !field.checked) {
            isValid = false;
            field.style.outline = '2px solid #e74c3c';
        } else {
            field.style.borderColor = '#dee2e6';
            field.style.outline = 'none';
        }
    });
    
    return isValid;
}

// Close fillable form modal
function closeFillableForm() {
    document.getElementById('fillableFormModal').style.display = 'none';
    currentFormType = '';
}

// ===== DIGITAL SIGNATURE SYSTEM =====

// Open signature pad
function openSignaturePad() {
    if (!currentFormType) {
        logger.error('No current form type for signature');
        return;
    }
    
    // Set employee info
    document.getElementById('signatureName').textContent = appState.employeeData.name || 'Unknown';
    document.getElementById('signatureDate').textContent = new Date().toLocaleDateString();
    document.getElementById('signatureFormType').textContent = formTemplates[currentFormType].title;
    
    // Show signature modal
    document.getElementById('signatureModal').style.display = 'block';
    
    // Initialize signature pad
    setTimeout(initializeSignaturePad, 100);
}

// Initialize signature pad
function initializeSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    if (!canvas) return;
    
    // CRITICAL FIX: Set canvas internal dimensions to match CSS dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    signatureContext = canvas.getContext('2d');
    signatureContext.scale(dpr, dpr);
    
    // Set up canvas
    signatureContext.strokeStyle = '#2c3e50';
    signatureContext.lineWidth = CONSTANTS.SIGNATURE_LINE_WIDTH;
    signatureContext.lineCap = 'round';
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
}

// Start drawing
function startDrawing(event) {
    isDrawing = true;
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    signatureContext.beginPath();
    signatureContext.moveTo(x, y);
}

// Draw signature
function draw(event) {
    if (!isDrawing) return;
    
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    signatureContext.lineTo(x, y);
    signatureContext.stroke();
}

// Stop drawing
function stopDrawing() {
    isDrawing = false;
}

// Handle touch events
function handleTouch(event) {
    event.preventDefault();
    const touch = event.touches[0];
    let eventType;
    if (event.type === 'touchstart') {
        eventType = 'mousedown';
    } else if (event.type === 'touchmove') {
        eventType = 'mousemove';
    } else {
        eventType = 'mouseup';
    }
    const mouseEvent = new MouseEvent(eventType, {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    event.target.dispatchEvent(mouseEvent);
}

// Clear signature
function clearSignature() {
    const canvas = document.getElementById('signaturePad');
    signatureContext.clearRect(0, 0, canvas.width, canvas.height);
}

// Save signature
function saveSignature() {
    const canvas = document.getElementById('signaturePad');
    
    // Check if signature is drawn
    if (isCanvasBlank(canvas)) {
        showNotification('Please provide a signature before saving.', 'error');
        return;
    }
    
    // Save signature data
    appState.digitalSignatures[currentFormType] = {
        dataURL: canvas.toDataURL(),
        timestamp: Date.now(),
        employeeName: appState.employeeData.name || 'Unknown'
    };
    
    // Update UI
    document.getElementById('signatureStatus').style.display = 'block';
    
    // Close signature modal
    closeSignature();
    
    showNotification('Signature saved successfully!', 'success');
    
    logger.info('Digital signature captured', {
        formType: currentFormType,
        employeeName: appState.employeeData.name
    });
    
    saveStateAsync();
}

// Check if canvas is blank
function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(
        context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
}

// Close signature modal
function closeSignature() {
    document.getElementById('signatureModal').style.display = 'none';
}

// Update form status
function updateFormStatus(formType, status) {
    const statusElement = document.getElementById(`${formType}-status`);
    if (statusElement) {
        statusElement.textContent = status === 'completed' ? 'Completed' : 'Not Completed';
        statusElement.className = `form-status ${status === 'completed' ? 'completed' : 'not-completed'}`;
    }
    
    const button = document.querySelector(`[data-form="${formType}"] .fill-form-btn`);
    if (button && status === 'completed') {
        button.innerHTML = '<i class="fas fa-check"></i> Completed';
        button.disabled = true;
    }
}

// Update acknowledgment progress
function updateAcknowledmentProgress() {
    const totalForms = Object.keys(formTemplates).length;
    const completedForms = Object.keys(appState.formCompletions).length;
    
    document.getElementById('acknowledgment-count').textContent = `${completedForms} of ${totalForms}`;
    document.getElementById('acknowledgment-progress').style.width = `${(completedForms / totalForms) * 100}%`;
}

// Initialize all procedure and form functionality
function initializeProceduresAndForms() {
    initializeProcedureAcknowledgments();
    
    // Restore form completions
    Object.keys(appState.formCompletions).forEach(formType => {
        updateFormStatus(formType, 'completed');
    });
    
    updateAcknowledmentProgress();
}

// Show/hide document content instead of downloading
function showDocumentContent(documentId, buttonElement) {
    logger.debug('Document content toggle requested', { documentId });
    const contentDiv = document.getElementById(documentId + '-content');
    logger.debug('Content div lookup result', { found: !!contentDiv });
    
    if (!contentDiv) {
        logger.error('Content div not found', { elementId: documentId + '-content' });
        alert('Content not found for document: ' + documentId);
        return;
    }
    
    const icon = buttonElement.querySelector('i');
    
    if (contentDiv.style.display === 'none' || !contentDiv.style.display) {
        // Show content
        logger.info('Showing document content', { documentId });
        contentDiv.style.display = 'block';
        buttonElement.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Content';
        buttonElement.classList.add('active');
        
        // Scroll to content
        setTimeout(() => {
            contentDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
        
        // Track analytics
        trackAnalyticsEvent('document_viewed', { document: documentId });
    } else {
        // Hide content
        logger.info('Hiding document content', { documentId });
        contentDiv.style.display = 'none';
        buttonElement.innerHTML = '<i class="fas fa-eye"></i> View Content';
        buttonElement.classList.remove('active');
    }
}

// Floating Employee Sign-In Form Functions
function initializeFloatingSigninForm() {
    // Check if employee is already signed in
    if (appState.employeeData && appState.employeeData.name && appState.employeeData.name !== 'New Employee') {
        showEmployeeInfo();
        hideSigninForm();
    } else {
        hideEmployeeInfo();
        showSigninForm();
    }
    
    // Set today's date as default start date
    const startDateInput = document.getElementById('signinStartDate');
    if (startDateInput) {
        startDateInput.value = new Date().toISOString().split('T')[0];
    }
}

function handleEmployeeSignin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const employeeData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        position: formData.get('position'),
        startDate: formData.get('startDate'),
        supervisor: formData.get('supervisor')
    };
    
    // Validate required fields
    if (!employeeData.name || !employeeData.email || !employeeData.position) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Generate UUID for user ID (Supabase expects UUID format)
    const userId = crypto.randomUUID();
    
    // Save employee data with user ID
    appState.employeeData = {
        ...employeeData,
        employeeId: `EMP_${Date.now()}`,
        userId: userId
    };
    
    // Create user session for getCurrentEmployee()
    const userSession = {
        id: userId,
        name: employeeData.name,
        email: employeeData.email,
        employeeId: appState.employeeData.employeeId
    };
    
    // Store session
    sessionStorage.setItem('fsw_user_session', JSON.stringify(userSession));
    
    console.log('[FSW Debug] Created user session from welcome signin:', userSession);
    
    saveStateAsync();
    
    // Update the main employee welcome card
    updateEmployeeSummary();
    
    // Show employee info in bottom left
    showEmployeeInfo();
    
    // Hide the floating sign-in form
    hideSigninForm();
    
    // Add signed-in class to body for styling
    document.body.classList.add('employee-signed-in');
    
    // Show success notification
    showNotification(`Welcome, ${employeeData.name}! You can now proceed with your onboarding.`, 'success');
    
    // Track analytics
    trackAnalyticsEvent('employee_signin', { 
        position: employeeData.position,
        timestamp: Date.now()
    });
}

function showEmployeeInfo() {
    const yourInfoDisplay = document.getElementById('yourInformationDisplay');
    if (yourInfoDisplay && appState.employeeData) {
        // Update content with all employee information
        document.getElementById('infoDisplayName').textContent = appState.employeeData.name || 'Unknown';
        document.getElementById('infoDisplayPosition').textContent = appState.employeeData.position || 'Not specified';
        document.getElementById('infoDisplayEmail').textContent = appState.employeeData.email || 'Not specified';
        document.getElementById('infoDisplayPhone').textContent = appState.employeeData.phone || 'Not specified';
        document.getElementById('infoDisplayStartDate').textContent = 
            appState.employeeData.startDate ? 
            new Date(appState.employeeData.startDate).toLocaleDateString() : 
            'Not specified';
        
        // Show the display
        yourInfoDisplay.style.display = 'block';
    }
}

function hideEmployeeInfo() {
    const yourInfoDisplay = document.getElementById('yourInformationDisplay');
    if (yourInfoDisplay) {
        yourInfoDisplay.style.display = 'none';
    }
}

function showSigninForm() {
    const signinContainer = document.getElementById('floatingSigninContainer');
    if (signinContainer) {
        signinContainer.style.display = 'block';
    }
    document.body.classList.remove('employee-signed-in');
}

function hideSigninForm() {
    const signinContainer = document.getElementById('floatingSigninContainer');
    if (signinContainer) {
        signinContainer.style.display = 'none';
    }
    document.body.classList.add('employee-signed-in');
}
