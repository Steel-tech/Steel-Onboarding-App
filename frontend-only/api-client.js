// API Client for Steel Onboarding Application
// Handles all backend communication with proper error handling and authentication

class APIClient {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('authToken');
        this.isOnline = false; // Force offline mode for client-side operation
        this.clientSideMode = true; // Flag for client-side only operation
        
        // In client-side mode, we don't need online/offline event listeners
        // All operations will be handled locally with localStorage
    }
    
    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }
    
    // Get headers for API requests
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.handleAuthError();
                    throw new Error('Authentication required');
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
            
        } catch (error) {
            if (!this.isOnline) {
                // Store for offline sync
                this.storeOfflineRequest(endpoint, config);
                throw new Error('Request stored for offline sync');
            }
            
            console.error(`API Request failed: ${endpoint}`, error);
            throw error;
        }
    }
    
    // Authentication methods
    async login(username, password) {
        try {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            if (response.success && response.token) {
                this.setToken(response.token);
                return response.user;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }
    
    async logout() {
        this.setToken(null);
        // Clear any cached data
        localStorage.removeItem('onboardingAppState');
        window.location.reload();
    }
    
    handleAuthError() {
        console.warn('Authentication error - clearing token');
        this.setToken(null);
        if (window.authManager) {
            window.authManager.logout('Token expired');
        }
    }
    
    // Employee data methods
    async saveEmployeeData(employeeData) {
        try {
            const response = await this.request('/employee/data', {
                method: 'POST',
                body: JSON.stringify(employeeData)
            });
            
            if (response.success) {
                logger?.info('Employee data saved to server', {
                    employeeId: response.employeeId
                });
                return response.employeeId;
            } else {
                throw new Error('Failed to save employee data');
            }
        } catch (error) {
            console.error('Save employee data failed:', error);
            // Fallback to localStorage
            this.storeOfflineData('employeeData', employeeData);
            throw error;
        }
    }
    
    // Progress tracking methods
    async saveModuleProgress(moduleName, progressData = {}) {
        try {
            const response = await this.request('/progress/module', {
                method: 'POST',
                body: JSON.stringify({ 
                    moduleName, 
                    progressData: {
                        ...progressData,
                        completedAt: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    }
                })
            });
            
            if (response.success) {
                logger?.info('Module progress saved to server', {
                    moduleName
                });
                return true;
            } else {
                throw new Error('Failed to save module progress');
            }
        } catch (error) {
            console.error('Save module progress failed:', error);
            // Fallback to localStorage
            this.storeOfflineData('moduleProgress', { moduleName, progressData });
            throw error;
        }
    }
    
    // Form submission methods
    async submitForm(formType, formData, digitalSignature = null) {
        try {
            const response = await this.request('/forms/submit', {
                method: 'POST',
                body: JSON.stringify({
                    formType,
                    formData,
                    digitalSignature
                })
            });
            
            if (response.success) {
                logger?.info('Form submitted to server', {
                    formType
                });
                return true;
            } else {
                throw new Error('Failed to submit form');
            }
        } catch (error) {
            console.error('Form submission failed:', error);
            // Fallback to localStorage
            this.storeOfflineData('formSubmission', { formType, formData, digitalSignature });
            throw error;
        }
    }
    
    // HR Dashboard methods (HR role only)
    async getHRDashboard() {
        try {
            const response = await this.request('/hr/dashboard');
            return response;
        } catch (error) {
            console.error('HR Dashboard failed:', error);
            throw error;
        }
    }
    
    // Data export methods
    async exportData() {
        try {
            const response = await fetch(`${this.baseURL}/backup/export`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Export failed');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fsw-onboarding-backup-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            return true;
        } catch (error) {
            console.error('Data export failed:', error);
            throw error;
        }
    }
    
    // Offline support methods
    storeOfflineData(type, data) {
        const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
        offlineData.push({
            type,
            data,
            timestamp: Date.now()
        });
        localStorage.setItem('offlineData', JSON.stringify(offlineData));
        console.log('Data stored for offline sync:', type);
    }
    
    storeOfflineRequest(endpoint, config) {
        const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
        offlineRequests.push({
            endpoint,
            config,
            timestamp: Date.now()
        });
        localStorage.setItem('offlineRequests', JSON.stringify(offlineRequests));
    }
    
    async syncOfflineData() {
        console.log('Syncing offline data...');
        
        // Sync stored data
        const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
        for (const item of offlineData) {
            try {
                switch (item.type) {
                    case 'employeeData':
                        await this.saveEmployeeData(item.data);
                        break;
                    case 'moduleProgress':
                        await this.saveModuleProgress(item.data.moduleName, item.data.progressData);
                        break;
                    case 'formSubmission':
                        await this.submitForm(item.data.formType, item.data.formData, item.data.digitalSignature);
                        break;
                }
            } catch (error) {
                console.error('Failed to sync offline data:', error);
                break; // Stop syncing if there's an error
            }
        }
        
        // Clear synced data
        localStorage.removeItem('offlineData');
        
        // Sync stored requests
        const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
        for (const request of offlineRequests) {
            try {
                await this.request(request.endpoint, request.config);
            } catch (error) {
                console.error('Failed to sync offline request:', error);
                break;
            }
        }
        
        // Clear synced requests
        localStorage.removeItem('offlineRequests');
        
        if (offlineData.length > 0 || offlineRequests.length > 0) {
            showNotification('Offline data synchronized successfully!', 'success');
        }
    }
    
    // Health check
    async healthCheck() {
        try {
            const response = await this.request('/health');
            return response.status === 'healthy';
        } catch (error) {
            return false;
        }
    }
    
    // Utility method to check if we're in offline mode
    isOffline() {
        return !this.isOnline;
    }
}

// Enhanced Authentication Manager that works with the backend
class BackendAuthManager extends AuthManager {
    constructor() {
        super();
        this.apiClient = new APIClient();
    }
    
    async handleLogin(form) {
        const formData = new FormData(form);
        const username = formData.get('username').trim().toLowerCase();
        const password = formData.get('password');
        
        // Check for lockout
        if (this.isAccountLocked()) {
            this.showLoginError('Account temporarily locked due to multiple failed attempts. Try again later.');
            return;
        }
        
        try {
            // Try backend authentication first
            const user = await this.apiClient.login(username, password);
            
            // Successful login
            this.createSession(username, user);
            this.clearLoginAttempts();
            this.hideLoginModal();
            this.startApplication();
            
            logger?.info('User authenticated via backend', {
                username: username,
                role: user.role,
                timestamp: new Date().toISOString()
            });
            
            showNotification(`Welcome back, ${user.name}!`, 'success');
            
        } catch (error) {
            console.error('Backend login failed:', error);
            
            // Fallback to local authentication if backend is unavailable
            if (error.message.includes('fetch') || !navigator.onLine) {
                console.log('Falling back to local authentication');
                super.handleLogin(form); // Call parent method
            } else {
                // Backend returned an error
                this.incrementLoginAttempts();
                this.showLoginError(error.message || 'Authentication failed');
                
                logger?.warn('Backend login attempt failed', {
                    username: username,
                    attempts: this.getLoginAttempts(),
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    logout(reason = 'User logout') {
        // Call parent logout method
        super.logout(reason);
        
        // Also logout from API client
        this.apiClient.logout();
    }
}

// Initialize the enhanced auth manager and API client
window.apiClient = new APIClient();

// Replace the basic auth manager with the backend-enabled one
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authManager = new BackendAuthManager();
    });
} else {
    window.authManager = new BackendAuthManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, BackendAuthManager };
}