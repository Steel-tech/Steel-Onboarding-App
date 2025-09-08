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
        // CLIENT-SIDE MODE: No authentication required
        // Automatically create a mock session for the app to work
        console.log('[FSW Auth] Running in client-side mode - no authentication required');
        this.createMockSession();
        this.hideLoadingScreen();
    }
    
    createMockSession() {
        // Create a mock user session for the app to function
        const mockUser = {
            id: 'client-user-001',
            username: 'client-user',
            role: 'employee',
            name: 'Onboarding User',
            email: 'user@fsw-denver.com',
            loginTime: Date.now()
        };
        
        // Store session data
        sessionStorage.setItem('fsw_user_session', JSON.stringify(mockUser));
        sessionStorage.setItem('fsw_session_start', Date.now().toString());
        
        console.log('[FSW Auth] Mock session created for client-side app');
        
        // Trigger session ready event
        this.onSessionReady(mockUser);
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