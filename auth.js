// Authentication System for Steel Onboarding App
// CLIENT-SIDE ONLY VERSION - No authentication required

// Auth constants
const AUTH_CONSTANTS = {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    USERNAME_FOCUS_DELAY: 100,
    SESSION_CHECK_INTERVAL: 60000, // 1 minute
    HASH_BIT_MASK: 32
};

class AuthManager {
    constructor() {
        this.sessionTimeout = AUTH_CONSTANTS.SESSION_TIMEOUT;
        this.maxLoginAttempts = AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS;
        this.lockoutDuration = AUTH_CONSTANTS.LOCKOUT_DURATION;
        
        this.initializeAuth();
    }
    
    initializeAuth() {
        // Check if employee is already registered
        const existingEmployee = this.getExistingEmployee();
        
        if (existingEmployee) {
            // Returning employee - create session and continue
            console.log('[FSW Auth] Welcome back:', existingEmployee.name);
            this.createEmployeeSession(existingEmployee);
            this.hideLoadingScreen();
        } else {
            // New employee - show registration form
            console.log('[FSW Auth] New employee - showing registration');
            this.showEmployeeRegistration();
        }
    }
    
    getExistingEmployee() {
        // Check localStorage for existing employee data
        const employeeData = localStorage.getItem('fsw_employee_data');
        if (employeeData) {
            try {
                return JSON.parse(employeeData);
            } catch (e) {
                console.warn('[FSW Auth] Invalid employee data found, clearing...');
                localStorage.removeItem('fsw_employee_data');
                return null;
            }
        }
        return null;
    }

    createEmployeeSession(employee) {
        // Create session for registered employee
        const sessionUser = {
            id: employee.id || `emp-${Date.now()}`,
            username: employee.email,
            role: 'employee',
            name: employee.name,
            email: employee.email,
            position: employee.position,
            startDate: employee.startDate,
            registrationDate: employee.registrationDate,
            loginTime: Date.now()
        };
        
        // Store session data
        sessionStorage.setItem('fsw_user_session', JSON.stringify(sessionUser));
        sessionStorage.setItem('fsw_session_start', Date.now().toString());
        
        console.log('[FSW Auth] Employee session created for:', employee.name);
        
        // Trigger session ready event
        this.onSessionReady(sessionUser);
    }

    showEmployeeRegistration() {
        // Hide loading screen first
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Hide main application
        document.body.style.overflow = 'hidden';
        
        // Create registration modal
        const registrationModal = document.createElement('div');
        registrationModal.id = 'employeeRegistrationModal';
        registrationModal.className = 'auth-modal';
        registrationModal.innerHTML = `
            <div class="auth-modal-content registration-content">
                <div class="auth-header">
                    <img src="Flawless Steel Logo_vector_ydMod3 (002) Page 003.jpg" alt="Flawless Steel Welding" class="auth-logo">
                    <h2>Welcome to Flawless Steel Welding!</h2>
                    <p>Please provide your information to begin your onboarding journey</p>
                </div>
                
                <form id="employeeRegistrationForm" class="auth-form">
                    <div class="form-group">
                        <label for="employeeName">Full Name *</label>
                        <input type="text" id="employeeName" name="employeeName" required 
                               placeholder="Enter your full name" autocomplete="name">
                    </div>
                    
                    <div class="form-group">
                        <label for="employeeEmail">Email Address *</label>
                        <input type="email" id="employeeEmail" name="employeeEmail" required 
                               placeholder="Enter your email address" autocomplete="email">
                    </div>
                    
                    <div class="form-group">
                        <label for="employeePosition">Position/Department *</label>
                        <select id="employeePosition" name="employeePosition" required>
                            <option value="">Select your position...</option>
                            <option value="Welder">Welder</option>
                            <option value="Fabricator">Fabricator</option>
                            <option value="Fitter">Fitter</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Foreman">Foreman</option>
                            <option value="Quality Control">Quality Control</option>
                            <option value="Safety Coordinator">Safety Coordinator</option>
                            <option value="Administrative">Administrative</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="employeeStartDate">Start Date *</label>
                        <input type="date" id="employeeStartDate" name="employeeStartDate" required>
                    </div>
                    
                    <div id="registrationError" class="auth-error" style="display: none;"></div>
                    
                    <button type="submit" class="auth-btn">
                        <i class="fas fa-rocket"></i> Begin My Onboarding
                    </button>
                    
                    <div class="auth-footer">
                        <p><strong>Your information is secure</strong></p>
                        <p>This data is stored locally on your device and used to personalize your onboarding experience.</p>
                        <small>Need help? Contact HR at (720) 638-7289</small>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(registrationModal);
        
        // Add registration form handler
        document.getElementById('employeeRegistrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmployeeRegistration(e.target);
        });
        
        // Focus on name field
        setTimeout(() => {
            document.getElementById('employeeName').focus();
        }, 100);
        
        // Set default start date to today
        document.getElementById('employeeStartDate').value = new Date().toISOString().split('T')[0];
    }

    handleEmployeeRegistration(form) {
        const formData = new FormData(form);
        const employeeData = {
            id: `emp-${Date.now()}`,
            name: formData.get('employeeName').trim(),
            email: formData.get('employeeEmail').trim().toLowerCase(),
            position: formData.get('employeePosition'),
            startDate: formData.get('employeeStartDate'),
            registrationDate: new Date().toISOString(),
            onboardingProgress: {
                completedModules: [],
                formSubmissions: {},
                lastActivity: Date.now()
            }
        };
        
        // Validate required fields
        if (!employeeData.name || !employeeData.email || !employeeData.position || !employeeData.startDate) {
            this.showRegistrationError('Please fill in all required fields.');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(employeeData.email)) {
            this.showRegistrationError('Please enter a valid email address.');
            return;
        }
        
        // Save employee data to localStorage
        try {
            localStorage.setItem('fsw_employee_data', JSON.stringify(employeeData));
            console.log('[FSW Auth] Employee registered:', employeeData.name);
            
            // Remove registration modal
            const modal = document.getElementById('employeeRegistrationModal');
            if (modal) {
                modal.remove();
            }
            
            // Create session and start app
            document.body.style.overflow = 'auto';
            this.createEmployeeSession(employeeData);
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('[FSW Auth] Failed to save employee data:', error);
            this.showRegistrationError('Failed to save your information. Please try again.');
        }
    }

    showRegistrationError(message) {
        const errorElement = document.getElementById('registrationError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Hide error after 5 seconds
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    document.body.classList.remove('loading');
                }, 500);
            }, 1000);
        }
    }
    
    onSessionReady(user) {
        // App is ready - no login modal needed
        console.log('[FSW Auth] Session ready for:', user.name);
        
        // Initialize the main application
        if (typeof initializeApp === 'function') {
            initializeApp(user);
        }
        
        // Fire custom event for other components
        window.dispatchEvent(new CustomEvent('authReady', { 
            detail: { user: user } 
        }));
    }
    
    // Mock authentication methods for compatibility
    isAuthenticated() {
        return true; // Always authenticated in client-side mode
    }
    
    getCurrentUser() {
        const sessionData = sessionStorage.getItem('fsw_user_session');
        if (sessionData) {
            return JSON.parse(sessionData);
        }
        return null;
    }
    
    logout() {
        // Clear session data
        sessionStorage.removeItem('fsw_user_session');
        sessionStorage.removeItem('fsw_session_start');
        
        // Reload page to reset state
        window.location.reload();
    }
    
    // Session management
    checkSession() {
        // In client-side mode, session never expires
        return true;
    }
    
    extendSession() {
        // Update session timestamp
        sessionStorage.setItem('fsw_session_start', Date.now().toString());
    }
    
    // Mock methods for API compatibility
    getAuthToken() {
        return 'client-side-mode-no-token-needed';
    }
    
    refreshToken() {
        return Promise.resolve('client-side-mode-no-token-needed');
    }
}

// Initialize authentication when DOM is ready
let authManager = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[FSW Auth] Initializing client-side authentication system');
    authManager = new AuthManager();
});

// Global auth functions for compatibility
window.authManager = {
    isAuthenticated: () => authManager ? authManager.isAuthenticated() : false,
    getCurrentUser: () => authManager ? authManager.getCurrentUser() : null,
    logout: () => authManager ? authManager.logout() : null,
    checkSession: () => authManager ? authManager.checkSession() : true,
    getAuthToken: () => authManager ? authManager.getAuthToken() : 'client-side-mode'
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, AUTH_CONSTANTS };
}