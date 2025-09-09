// Supabase Authentication System for Steel Onboarding App
// Uses Supabase Auth for secure user authentication and session management

// supabase, authHelpers, profileHelpers are loaded from supabase-client.js

// Auth constants
const AUTH_CONSTANTS = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    USERNAME_FOCUS_DELAY: 100,
    REGISTRATION_TIMEOUT: 30000, // 30 seconds
    LOGIN_TIMEOUT: 15000 // 15 seconds
};

class SupabaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.currentProfile = null;
        this.authListener = null;
        this.maxLoginAttempts = AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS;
        this.lockoutDuration = AUTH_CONSTANTS.LOCKOUT_DURATION;
        
        this.initializeAuth();
    }
    
    async initializeAuth() {
        try {
            console.log('[FSW Auth] Initializing Supabase authentication...');
            
            // Check if supabase is available
            if (!window.supabase) {
                console.warn('[FSW Auth] Supabase client not ready, showing auth modal');
                this.showAuthModal();
                return;
            }
            
            // Check for existing session
            const { data: { session }, error } = await window.supabase.auth.getSession();
            
            if (error) {
                console.error('[FSW Auth] Session check failed:', error.message);
                this.showAuthModal();
                return;
            }
            
            if (session && session.user) {
                // User is logged in
                console.log('[FSW Auth] Found existing session for:', session.user.email);
                await this.handleAuthenticatedUser(session.user);
            } else {
                // No session - show auth modal
                console.log('[FSW Auth] No session found, showing authentication');
                this.showAuthModal();
            }
            
            // Set up auth state listener
            this.setupAuthListener();
            
        } catch (error) {
            console.error('[FSW Auth] Auth initialization failed:', error);
            this.showAuthModal();
        }
    }
    
    setupAuthListener() {
        this.authListener = window.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[FSW Auth] Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session?.user) {
                await this.handleAuthenticatedUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignOut();
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('[FSW Auth] Token refreshed for:', session.user.email);
                this.currentUser = session.user;
            }
        });
    }

    async handleAuthenticatedUser(user) {
        try {
            this.currentUser = user;
            
            // Get or create user profile
            let profile;
            try {
                profile = await profileHelpers.getProfile(user.id);
            } catch (error) {
                if (error.message.includes('No rows')) {
                    console.log('[FSW Auth] Profile not found, user needs to complete registration');
                    this.showRegistrationCompletion(user);
                    return;
                }
                throw error;
            }
            
            this.currentProfile = profile;
            
            console.log('[FSW Auth] Welcome back:', profile.name);
            
            // Hide any auth modals
            this.hideAuthModal();
            
            // Initialize the app
            this.onSessionReady({
                id: user.id,
                email: user.email,
                name: profile.name,
                position: profile.position,
                startDate: profile.start_date,
                role: 'employee'
            });
            
        } catch (error) {
            console.error('[FSW Auth] Failed to handle authenticated user:', error);
            this.showError('Failed to load your profile. Please try signing in again.');
        }
    }

    showAuthModal() {
        // Hide loading screen first
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // Hide main application
        document.body.style.overflow = 'hidden';
        
        // Create auth modal
        const authModal = document.createElement('div');
        authModal.id = 'authModal';
        authModal.className = 'auth-modal';
        authModal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-header">
                    <img src="Flawless Steel Logo_vector_ydMod3 (002) Page 003.jpg" alt="Flawless Steel Welding" class="auth-logo">
                    <h2>Welcome to Flawless Steel Welding!</h2>
                    <p id="authDescription">Sign in to access your onboarding portal</p>
                </div>
                
                <!-- Login Form (default) -->
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="loginEmail">Email Address</label>
                        <input type="email" id="loginEmail" name="email" required 
                               placeholder="Enter your email" autocomplete="email">
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" name="password" required 
                               placeholder="Enter your password" autocomplete="current-password">
                    </div>
                    
                    <div id="loginError" class="auth-error" style="display: none;"></div>
                    
                    <button type="submit" class="auth-btn" id="loginBtn">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </form>
                
                <!-- Registration Form (hidden by default) -->
                <form id="registrationForm" class="auth-form" style="display: none;">
                    <div class="form-group">
                        <label for="regName">Full Name *</label>
                        <input type="text" id="regName" name="name" required 
                               placeholder="Enter your full name" autocomplete="name">
                    </div>
                    
                    <div class="form-group">
                        <label for="regEmail">Email Address *</label>
                        <input type="email" id="regEmail" name="email" required 
                               placeholder="Enter your email" autocomplete="email">
                    </div>
                    
                    <div class="form-group">
                        <label for="regPassword">Password *</label>
                        <input type="password" id="regPassword" name="password" required 
                               placeholder="Create a secure password" autocomplete="new-password"
                               minlength="8">
                    </div>
                    
                    <div class="form-group">
                        <label for="regPosition">Position/Department *</label>
                        <select id="regPosition" name="position" required>
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
                        <label for="regStartDate">Start Date *</label>
                        <input type="date" id="regStartDate" name="startDate" required>
                    </div>
                    
                    <div id="registrationError" class="auth-error" style="display: none;"></div>
                    
                    <button type="submit" class="auth-btn" id="registerBtn">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                </form>
                
                <div class="auth-toggle">
                    <button type="button" id="toggleAuth" class="link-btn">
                        New employee? Create an account
                    </button>
                </div>
                
                <div class="auth-footer">
                    <p><strong>Secure Authentication</strong></p>
                    <p>Your data is protected with enterprise-grade security.</p>
                    <small>Need help? Contact HR at (720) 638-7289</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(authModal);
        
        // Add event handlers
        this.setupAuthModalHandlers();
        
        // Focus on email field
        setTimeout(() => {
            document.getElementById('loginEmail').focus();
        }, AUTH_CONSTANTS.USERNAME_FOCUS_DELAY);
        
        // Set default start date for registration
        document.getElementById('regStartDate').value = new Date().toISOString().split('T')[0];
    }

    setupAuthModalHandlers() {
        const loginForm = document.getElementById('loginForm');
        const registrationForm = document.getElementById('registrationForm');
        const toggleBtn = document.getElementById('toggleAuth');
        const authDescription = document.getElementById('authDescription');
        
        let isLoginMode = true;
        
        // Toggle between login and registration
        toggleBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            
            if (isLoginMode) {
                loginForm.style.display = 'block';
                registrationForm.style.display = 'none';
                toggleBtn.textContent = 'New employee? Create an account';
                authDescription.textContent = 'Sign in to access your onboarding portal';
                setTimeout(() => document.getElementById('loginEmail').focus(), 100);
            } else {
                loginForm.style.display = 'none';
                registrationForm.style.display = 'block';
                toggleBtn.textContent = 'Already have an account? Sign in';
                authDescription.textContent = 'Create your account to begin onboarding';
                setTimeout(() => document.getElementById('regName').focus(), 100);
            }
        });
        
        // Login form handler
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e.target);
        });
        
        // Registration form handler
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration(e.target);
        });
    }
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email').trim().toLowerCase();
        const password = formData.get('password');
        
        // Validate inputs
        if (!email || !password) {
            this.showLoginError('Please fill in all fields.');
            return;
        }
        
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.innerHTML;
        
        try {
            // Show loading state
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            loginBtn.disabled = true;
            
            // Sign in with Supabase
            const { user, session } = await authHelpers.signIn(email, password);
            
            console.log('[FSW Auth] Login successful for:', email);
            
            // Auth state listener will handle the rest
            
        } catch (error) {
            console.error('[FSW Auth] Login failed:', error);
            
            let errorMessage = 'Sign in failed. Please check your credentials.';
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please check your email and confirm your account first.';
            }
            
            this.showLoginError(errorMessage);
            
        } finally {
            // Reset button state
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }
    
    async handleRegistration(form) {
        const formData = new FormData(form);
        const userData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim().toLowerCase(),
            password: formData.get('password'),
            position: formData.get('position'),
            startDate: formData.get('startDate')
        };
        
        // Validate required fields
        if (!userData.name || !userData.email || !userData.password || 
            !userData.position || !userData.startDate) {
            this.showRegistrationError('Please fill in all required fields.');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            this.showRegistrationError('Please enter a valid email address.');
            return;
        }
        
        // Validate password strength
        if (userData.password.length < 8) {
            this.showRegistrationError('Password must be at least 8 characters long.');
            return;
        }
        
        const registerBtn = document.getElementById('registerBtn');
        const originalText = registerBtn.innerHTML;
        
        try {
            // Show loading state
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            registerBtn.disabled = true;
            
            // Sign up with Supabase
            const { user, session } = await authHelpers.signUp(
                userData.email, 
                userData.password, 
                {
                    name: userData.name,
                    position: userData.position,
                    startDate: userData.startDate
                }
            );
            
            console.log('[FSW Auth] Registration successful for:', userData.email);
            
            if (user && !session) {
                // Email confirmation required
                this.showRegistrationSuccess('Account created! Please check your email to confirm your account.');
            } else {
                // Auto-signed in (confirmation disabled)
                // Auth state listener will handle the rest
            }
            
        } catch (error) {
            console.error('[FSW Auth] Registration failed:', error);
            
            let errorMessage = 'Registration failed. Please try again.';
            if (error.message.includes('User already registered')) {
                errorMessage = 'An account with this email already exists. Try signing in instead.';
            } else if (error.message.includes('Password should be at least')) {
                errorMessage = 'Password must be at least 8 characters long.';
            }
            
            this.showRegistrationError(errorMessage);
            
        } finally {
            // Reset button state
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    }
    
    showLoginError(message) {
        this.showError(message, 'loginError');
    }
    
    showRegistrationError(message) {
        this.showError(message, 'registrationError');
    }
    
    showRegistrationSuccess(message) {
        const errorElement = document.getElementById('registrationError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.className = 'auth-success';
            errorElement.style.display = 'block';
            
            setTimeout(() => {
                errorElement.style.display = 'none';
                errorElement.className = 'auth-error';
            }, 10000);
        }
    }
    
    showError(message, elementId = 'authError') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }
    
    hideAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.remove();
            document.body.style.overflow = 'auto';
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
    
    handleSignOut() {
        console.log('[FSW Auth] User signed out');
        this.currentUser = null;
        this.currentProfile = null;
        
        // Clear any cached data
        sessionStorage.clear();
        
        // Show auth modal
        this.showAuthModal();
    }
    
    onSessionReady(user) {
        console.log('[FSW Auth] Session ready for:', user.name);
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Initialize the main application
        if (typeof initializeApp === 'function') {
            initializeApp(user);
        }
        
        // Fire custom event for other components
        window.dispatchEvent(new CustomEvent('authReady', { 
            detail: { user: user } 
        }));
    }
    
    // Authentication methods
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    getCurrentUser() {
        if (this.currentProfile && this.currentUser) {
            return {
                id: this.currentUser.id,
                email: this.currentUser.email,
                name: this.currentProfile.name,
                position: this.currentProfile.position,
                startDate: this.currentProfile.start_date,
                role: 'employee'
            };
        }
        return null;
    }
    
    async logout() {
        try {
            await authHelpers.signOut();
            console.log('[FSW Auth] Logout successful');
        } catch (error) {
            console.error('[FSW Auth] Logout failed:', error);
            // Force local cleanup even if server logout fails
            this.handleSignOut();
        }
    }
    
    // Session management
    async checkSession() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session !== null;
        } catch {
            return false;
        }
    }
    
    async getAuthToken() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session?.access_token || null;
        } catch {
            return null;
        }
    }
    
    async refreshToken() {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) throw error;
            return data.session?.access_token || null;
        } catch (error) {
            console.error('[FSW Auth] Token refresh failed:', error);
            return null;
        }
    }
    
    // Clean up resources
    destroy() {
        if (this.authListener) {
            this.authListener.data.subscription.unsubscribe();
            this.authListener = null;
        }
    }
}

// Initialize authentication when DOM is ready and Supabase is loaded
let authManager = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[FSW Auth] Waiting for Supabase to initialize...');
    
    // Wait for Supabase to be ready
    if (window.supabase) {
        // Already loaded
        initializeAuthManager();
    } else {
        // Wait for supabaseReady event
        window.addEventListener('supabaseReady', initializeAuthManager);
        window.addEventListener('supabaseError', (event) => {
            console.error('[FSW Auth] Supabase failed to initialize:', event.detail.error);
            // Show error to user
            document.body.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #e74c3c;">
                    <h2>⚠️ Authentication System Error</h2>
                    <p>Failed to initialize Supabase: ${event.detail.error}</p>
                    <p>Please check your configuration and try again.</p>
                    <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        });
    }
});

function initializeAuthManager() {
    console.log('[FSW Auth] Initializing Supabase authentication system');
    
    // Double-check that Supabase is ready
    if (window.supabase && window.authHelpers) {
        authManager = new SupabaseAuthManager();
    } else {
        console.error('[FSW Auth] Supabase not ready, retrying in 1 second...');
        setTimeout(initializeAuthManager, 1000);
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (authManager) {
        authManager.destroy();
    }
});

// Global auth functions for compatibility
window.authManager = {
    isAuthenticated: () => authManager ? authManager.isAuthenticated() : false,
    getCurrentUser: () => authManager ? authManager.getCurrentUser() : null,
    logout: () => authManager ? authManager.logout() : null,
    checkSession: () => authManager ? authManager.checkSession() : Promise.resolve(false),
    getAuthToken: () => authManager ? authManager.getAuthToken() : Promise.resolve(null)
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseAuthManager, AUTH_CONSTANTS };
}