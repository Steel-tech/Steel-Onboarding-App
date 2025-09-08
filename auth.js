// Authentication System for Steel Onboarding App
// Simple but secure authentication for production use

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
        console.log('🔐 AuthManager: Constructor called');
        this.sessionTimeout = AUTH_CONSTANTS.SESSION_TIMEOUT;
        this.maxLoginAttempts = AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS;
        this.lockoutDuration = AUTH_CONSTANTS.LOCKOUT_DURATION;
        
        // In production, these would come from environment variables
        this.credentials = {
            // Format: username: { password: hashedPassword, role: 'employee'|'hr'|'admin' }
            'employee': { 
                password: this.hashPassword('fsw2025!'), // Default password
                role: 'employee',
                name: 'New Employee'
            },
            'hr': { 
                password: this.hashPassword('hr2025!'), 
                role: 'hr',
                name: 'HR Administrator'
            },
            'victor@fsw-denver.com': {
                password: this.hashPassword('admin2025!'),
                role: 'admin',
                name: 'Victor Garcia - Owner'
            },
            'admin': {
                password: this.hashPassword('admin2025!'),
                role: 'admin', 
                name: 'Administrator'
            }
        };
        
        this.initializeAuth();
    }
    
    initializeAuth() {
        // Check if user is already authenticated
        if (!this.isAuthenticated()) {
            this.showLoginModal();
        } else {
            // Check if session is still valid
            if (this.isSessionExpired()) {
                this.logout();
                return;
            }
            // Update last activity
            this.updateLastActivity();
            // Start session monitoring
            this.startSessionMonitoring();
        }
    }
    
    // Simple password hashing (in production, use bcrypt or similar)
    hashPassword(password) {
        // Simple hash for demo - in production use proper bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    showLoginModal() {
        // Hide main application
        document.body.style.overflow = 'hidden';
        
        // Create login modal
        const loginModal = document.createElement('div');
        loginModal.id = 'authModal';
        loginModal.className = 'auth-modal';
        loginModal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-header">
                    <img src="Flawless Steel Logo_vector_ydMod3 (002) Page 003.jpg" alt="Flawless Steel Welding" class="auth-logo">
                    <h2>Employee Onboarding Portal</h2>
                    <p>Please authenticate to access your onboarding materials</p>
                </div>
                
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required 
                               placeholder="Enter your username" autocomplete="username">
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required 
                               placeholder="Enter your password" autocomplete="current-password">
                    </div>
                    
                    <div id="loginError" class="auth-error" style="display: none;"></div>
                    
                    <button type="submit" class="auth-btn">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                    
                    <div class="auth-footer">
                        <p><strong>Available Accounts:</strong></p>
                        <p>Employee: <code>employee</code> / <code>fsw2025!</code></p>
                        <p>HR Admin: <code>hr</code> / <code>hr2025!</code></p>
                        <p>Owner: <code>victor@fsw-denver.com</code> / <code>admin2025!</code></p>
                        <p>Admin: <code>admin</code> / <code>admin2025!</code></p>
                        <small>Contact HR at (720) 638-7289 for assistance</small>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(loginModal);
        
        // Add login form handler
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e.target);
        });
        
        // Focus on username field
        setTimeout(() => {
            document.getElementById('username').focus();
        }, AUTH_CONSTANTS.USERNAME_FOCUS_DELAY);
    }
    
    handleLogin(form) {
        const formData = new FormData(form);
        const username = formData.get('username').trim().toLowerCase();
        const password = formData.get('password');
        
        // Check for lockout
        if (this.isAccountLocked()) {
            this.showLoginError('Account temporarily locked due to multiple failed attempts. Try again later.');
            return;
        }
        
        // Validate credentials
        const user = this.credentials[username];
        const hashedPassword = this.hashPassword(password);
        
        if (user && user.password === hashedPassword) {
            // Successful login
            this.createSession(username, user);
            this.clearLoginAttempts();
            this.hideLoginModal();
            this.startApplication();
            
            if (typeof logger !== 'undefined') {
                logger.info('User authenticated successfully', {
                    username: username,
                    role: user.role,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            // Failed login
            this.incrementLoginAttempts();
            this.showLoginError('Invalid username or password');
            
            if (typeof logger !== 'undefined') {
                logger.warn('Failed login attempt', {
                    username: username,
                    attempts: this.getLoginAttempts(),
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    createSession(username, user) {
        const session = {
            username: username,
            role: user.role,
            name: user.name,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            sessionId: this.generateSessionId()
        };
        
        // Store session (encrypted in production)
        localStorage.setItem('fswSession', JSON.stringify(session));
        
        // Update global app state with user info
        if (typeof appState !== 'undefined') {
            appState.currentUser = {
                username: username,
                role: user.role,
                name: user.name
            };
        }
    }
    
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    isAuthenticated() {
        const session = this.getSession();
        return session?.username && !this.isSessionExpired();
    }
    
    getSession() {
        try {
            const sessionData = localStorage.getItem('fswSession');
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            if (typeof logger !== 'undefined') {
                logger.error('Error parsing session data', { error: error.message });
            } else {
                console.error('Auth Error - Session parsing failed:', error.message);
            }
            return null;
        }
    }
    
    isSessionExpired() {
        const session = this.getSession();
        if (!session) return true;
        
        const now = Date.now();
        const lastActivity = session.lastActivity || session.loginTime;
        
        return (now - lastActivity) > this.sessionTimeout;
    }
    
    updateLastActivity() {
        const session = this.getSession();
        if (session) {
            session.lastActivity = Date.now();
            localStorage.setItem('fswSession', JSON.stringify(session));
        }
    }
    
    startSessionMonitoring() {
        // Update activity on user interaction
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            });
        });
        
        // Check session validity periodically
        setInterval(() => {
            if (this.isSessionExpired()) {
                this.logout('Session expired');
            }
        }, AUTH_CONSTANTS.SESSION_CHECK_INTERVAL);
    }
    
    logout(reason = 'User logout') {
        const session = this.getSession();
        
        if (session) {
            if (typeof logger !== 'undefined') {
                logger.info('User logged out', {
                    username: session.username,
                    reason: reason,
                    sessionDuration: Date.now() - session.loginTime,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // Clear session data
        localStorage.removeItem('fswSession');
        
        // Clear app state
        if (typeof appState !== 'undefined') {
            delete appState.currentUser;
        }
        
        // Show logout notification
        if (reason !== 'User logout') {
            alert(`Session ended: ${reason}. Please log in again.`);
        }
        
        // Reload page to restart authentication
        window.location.reload();
    }
    
    // Login attempt tracking for security
    getLoginAttempts() {
        return parseInt(localStorage.getItem('loginAttempts') || '0');
    }
    
    incrementLoginAttempts() {
        const attempts = this.getLoginAttempts() + 1;
        localStorage.setItem('loginAttempts', attempts.toString());
        localStorage.setItem('lastFailedLogin', Date.now().toString());
    }
    
    clearLoginAttempts() {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastFailedLogin');
    }
    
    isAccountLocked() {
        const attempts = this.getLoginAttempts();
        const lastFailed = parseInt(localStorage.getItem('lastFailedLogin') || '0');
        
        if (attempts >= this.maxLoginAttempts) {
            const timeSinceLastFailed = Date.now() - lastFailed;
            return timeSinceLastFailed < this.lockoutDuration;
        }
        
        return false;
    }
    
    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
    
    hideLoginModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    }
    
    startApplication() {
        // Initialize the main application
        if (typeof initializeEventListeners === 'function') {
            // Main app is already loaded
            showNotification(`Welcome, ${this.getSession().name}!`, 'success');
        }
    }
    
    // Utility method to get current user info
    getCurrentUser() {
        const session = this.getSession();
        return session ? {
            username: session.username,
            role: session.role,
            name: session.name
        } : null;
    }
    
    // Check if user has specific role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }
    
    // Admin method to add new user (HR only)
    addUser(username, password, role, name) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.role !== 'hr') {
            throw new Error('Unauthorized: Only HR can add users');
        }
        
        this.credentials[username] = {
            password: this.hashPassword(password),
            role: role,
            name: name
        };
        
        if (typeof logger !== 'undefined') {
            logger.info('New user added', {
                newUser: username,
                role: role,
                addedBy: currentUser.username,
                timestamp: new Date().toISOString()
            });
        }
        
        return true;
    }
}

// CSS styles for authentication modal
const authStyles = document.createElement('style');
authStyles.textContent = `
.auth-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--dark-gray) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.auth-modal-content {
    background: white;
    padding: 3rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    width: 90%;
    max-width: 400px;
    text-align: center;
}

.auth-header {
    margin-bottom: 2rem;
}

.auth-logo {
    max-width: 150px;
    margin-bottom: 1rem;
}

.auth-header h2 {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.auth-header p {
    color: #666;
    font-size: 0.9rem;
}

.auth-form {
    text-align: left;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--primary-color);
    font-weight: 600;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.auth-error {
    background: #fee;
    color: var(--danger-color);
    padding: 0.75rem;
    border-radius: 5px;
    margin-bottom: 1rem;
    border: 1px solid #fcc;
    text-align: center;
}

.auth-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 2rem;
}

.auth-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.auth-footer {
    padding-top: 2rem;
    border-top: 1px solid #eee;
    text-align: center;
    font-size: 0.85rem;
    color: #666;
}

.auth-footer code {
    background: #f8f9fa;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    color: var(--primary-color);
    font-weight: 600;
}

.auth-footer small {
    display: block;
    margin-top: 1rem;
    color: #999;
}

@media (max-width: 480px) {
    .auth-modal-content {
        padding: 2rem 1.5rem;
        margin: 1rem;
    }
    
    .auth-logo {
        max-width: 120px;
    }
}
`;

document.head.appendChild(authStyles);

// Initialize authentication when DOM is ready
console.log('🔐 AUTH.JS: Script loaded, readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('🔐 AUTH.JS: DOM still loading, adding event listener');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔐 AUTH.JS: DOMContentLoaded event fired, initializing AuthManager');
        window.authManager = new AuthManager();
    });
} else {
    console.log('🔐 AUTH.JS: DOM already loaded, initializing AuthManager immediately');
    window.authManager = new AuthManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}