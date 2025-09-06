// ENHANCED DOCUMENT DOWNLOAD FIXES FOR STEEL ONBOARDING APP
// This file contains improved download functions to replace the current handleDocumentDownload

// Enhanced download function with multiple fallback strategies
function enhancedHandleDocumentDownload(fileName, documentName, buttonElement) {
    console.log(`Attempting to download: ${fileName}`);
    
    // Show immediate feedback
    showNotification(`Preparing ${documentName} for download...`, 'info');
    
    // Strategy 1: Try direct window.open (current method)
    try {
        const downloadResult = window.open(fileName, '_blank');
        
        // Check if popup was blocked
        if (downloadResult === null || downloadResult === undefined) {
            console.warn('Window.open blocked, trying alternative method...');
            return tryAlternativeDownload(fileName, documentName, buttonElement);
        }
        
        // Success with window.open
        trackSuccessfulDownload(fileName, documentName, buttonElement, 'window.open');
        return true;
        
    } catch (error) {
        console.error('Window.open failed:', error);
        return tryAlternativeDownload(fileName, documentName, buttonElement);
    }
}

// Alternative download method using anchor element
function tryAlternativeDownload(fileName, documentName, buttonElement) {
    console.log(`Trying alternative download for: ${fileName}`);
    
    try {
        // Create temporary download link
        const link = document.createElement('a');
        link.href = fileName;
        link.download = fileName;
        link.style.display = 'none';
        link.target = '_blank';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        setTimeout(() => {
            if (link.parentNode) {
                document.body.removeChild(link);
            }
        }, 100);
        
        trackSuccessfulDownload(fileName, documentName, buttonElement, 'anchor');
        return true;
        
    } catch (error) {
        console.error('Alternative download failed:', error);
        return tryFetchDownload(fileName, documentName, buttonElement);
    }
}

// Fetch-based download method
function tryFetchDownload(fileName, documentName, buttonElement) {
    console.log(`Trying fetch-based download for: ${fileName}`);
    
    showNotification(`Downloading ${documentName}...`, 'info');
    
    fetch(fileName)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Create blob URL and trigger download
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up blob URL
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            
            trackSuccessfulDownload(fileName, documentName, buttonElement, 'fetch');
        })
        .catch(error => {
            console.error('Fetch download failed:', error);
            handleDownloadFailure(fileName, documentName, buttonElement, error);
        });
}

// Track successful downloads
function trackSuccessfulDownload(fileName, documentName, buttonElement, method) {
    console.log(`Download successful using ${method}: ${fileName}`);
    
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
    
    // Track in app state (if the tracking function exists)
    if (typeof trackDocumentDownload === 'function') {
        trackDocumentDownload(documentName);
    }
    
    // Show success message
    showNotification(`${documentName} downloaded successfully!`, 'success');
    
    // Log success
    if (typeof logger !== 'undefined') {
        logger.info('Document download successful', {
            fileName,
            documentName,
            method,
            timestamp: new Date().toISOString()
        });
    }
}

// Handle download failures
function handleDownloadFailure(fileName, documentName, buttonElement, error) {
    console.error(`All download methods failed for ${fileName}:`, error);
    
    // Update button state
    const card = buttonElement.closest('.document-card');
    if (card) {
        buttonElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Download Failed';
        buttonElement.style.backgroundColor = '#e74c3c';
        buttonElement.disabled = true;
        
        // Add retry option
        setTimeout(() => {
            buttonElement.innerHTML = '<i class="fas fa-redo"></i> Retry Download';
            buttonElement.style.backgroundColor = '#f39c12';
            buttonElement.disabled = false;
            buttonElement.onclick = () => enhancedHandleDocumentDownload(fileName, documentName, buttonElement);
        }, 3000);
    }
    
    // Show detailed error message
    let errorMessage = `Unable to download ${documentName}.`;
    if (error.message.includes('CORS')) {
        errorMessage += ' Please ensure the app is served via HTTP server.';
    } else if (error.message.includes('blocked')) {
        errorMessage += ' Please allow popups for this site.';
    } else {
        errorMessage += ' Please contact HR for assistance.';
    }
    
    showNotification(errorMessage, 'error');
    
    // Log error
    if (typeof logger !== 'undefined') {
        logger.error('Document download failed', {
            fileName,
            documentName,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Browser compatibility check
function checkDownloadSupport() {
    const support = {
        windowOpen: typeof window.open === 'function',
        downloadAttribute: 'download' in document.createElement('a'),
        fetch: typeof fetch === 'function',
        blob: typeof Blob === 'function',
        createObjectURL: typeof URL.createObjectURL === 'function'
    };
    
    console.log('Download support check:', support);
    return support;
}

// Initialize enhanced download system
function initializeEnhancedDownloads() {
    console.log('Initializing enhanced download system...');
    
    // Check browser support
    const support = checkDownloadSupport();
    
    // Replace all existing download button handlers
    document.querySelectorAll('.download-btn').forEach(button => {
        // Remove existing onclick handlers
        const originalOnclick = button.getAttribute('onclick');
        if (originalOnclick) {
            button.removeAttribute('onclick');
            
            // Extract fileName and docName from original onclick
            const fileMatch = originalOnclick.match(/handleDocumentDownload\('([^']+)'/);
            const nameMatch = originalOnclick.match(/handleDocumentDownload\('[^']+',\s*'([^']+)'/);
            
            if (fileMatch && nameMatch) {
                const fileName = fileMatch[1];
                const docName = nameMatch[1];
                
                // Add new enhanced handler
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    enhancedHandleDocumentDownload(fileName, docName, button);
                });
            }
        }
    });
    
    console.log('Enhanced download system initialized successfully');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedDownloads);
} else {
    initializeEnhancedDownloads();
}

// Export for manual initialization
window.enhancedDownloads = {
    init: initializeEnhancedDownloads,
    download: enhancedHandleDocumentDownload,
    checkSupport: checkDownloadSupport
};

console.log('Enhanced download system loaded. Use enhancedDownloads.init() to initialize manually if needed.');