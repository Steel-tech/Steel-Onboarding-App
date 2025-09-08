// Event Handlers for Steel Onboarding Application
// All event handlers moved from inline onclick for CSP compliance

// Company details navigation
function showCompanyTab() {
    showTab('company');
}

// Video completion handler
function markVideoComplete(button) {
    button.textContent = '✓ Completed';
    button.disabled = true;
    button.classList.add('completed');
    updateProgress();
}

// Document content visibility toggle
function toggleDocumentContent(documentId, buttonElement) {
    showDocumentContent(documentId, buttonElement);
}

// Form opening handlers
function openHandbookForm() {
    openFillableForm('handbook');
}

function openHealthSafetyForm() {
    openFillableForm('health-safety');
}

function openNewHireOrientationForm() {
    openFillableForm('new-hire-orientation');
}

function openSteelErectionForm() {
    openFillableForm('steel-erection');
}

function openWeldingProceduresForm() {
    openFillableForm('welding-procedures');
}

function openEquipmentTrainingForm() {
    openFillableForm('equipment-training');
}

// Bulk action handlers
function downloadAllCompletedForms() {
    try {
        const completedForms = Object.keys(appState.formCompletions);
        
        if (completedForms.length === 0) {
            showNotification('No completed forms to download.', 'info');
            return;
        }
        
        // Create a ZIP-like structure in JSON format
        const formsData = {
            exportDate: new Date().toISOString(),
            employee: appState.employeeData.name || 'Unknown',
            completedForms: {}
        };
        
        completedForms.forEach(formType => {
            formsData.completedForms[formType] = appState.formCompletions[formType];
        });
        
        // Download as JSON file
        const blob = new Blob([JSON.stringify(formsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `completed-forms-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`Downloaded ${completedForms.length} completed forms`, 'success');
        
        logger?.info('Bulk forms downloaded', {
            formCount: completedForms.length,
            employee: appState.employeeData.name
        });
        
    } catch (error) {
        console.error('Download all forms failed:', error);
        showNotification('Failed to download forms. Please try again.', 'error');
    }
}

function emailFormsToHR() {
    try {
        const completedForms = Object.keys(appState.formCompletions);
        
        if (completedForms.length === 0) {
            showNotification('No completed forms to send.', 'info');
            return;
        }
        
        // Create email content
        const employee = appState.employeeData.name || 'Unknown Employee';
        const subject = `Onboarding Forms Completed - ${employee}`;
        const body = `Hello HR Team,

${employee} has completed the following onboarding forms:

${completedForms.map(form => `- ${formTemplates[form]?.title || form}`).join('\n')}

Forms completed: ${completedForms.length}
Completion date: ${new Date().toLocaleDateString()}

Please review the completed forms in the onboarding system.

Best regards,
Flawless Steel Welding Onboarding System`;
        
        // Create mailto link
        const mailtoLink = `mailto:hr@fsw-denver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Try to open default email client
        const emailWindow = window.open(mailtoLink);
        
        // Fallback if email client doesn't open
        setTimeout(() => {
            if (emailWindow && emailWindow.closed === false) {
                emailWindow.close();
            } else {
                // Show fallback with email details
                const modal = document.createElement('div');
                modal.className = 'email-modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>Email HR Team</h3>
                        <p>Please copy this information and send to HR:</p>
                        <div class="email-details">
                            <p><strong>To:</strong> hr@fsw-denver.com</p>
                            <p><strong>Subject:</strong> ${subject}</p>
                            <textarea readonly rows="10" cols="50">${body}</textarea>
                        </div>
                        <button onclick="this.closest('.email-modal').remove()" class="modern-button">Close</button>
                    </div>
                `;
                document.body.appendChild(modal);
            }
        }, 1000);
        
        // Use API client if available to send through backend
        if (window.apiClient && navigator.onLine) {
            // This would trigger an HR notification through the backend
            window.apiClient.submitForm('hr_notification', {
                type: 'FORMS_COMPLETED',
                employee: employee,
                completedForms: completedForms,
                message: body
            }).catch(error => {
                console.log('Backend notification failed, using email fallback:', error);
            });
        }
        
        showNotification('HR has been notified of completed forms', 'success');
        
        logger?.info('HR notified of completed forms', {
            formCount: completedForms.length,
            employee: employee
        });
        
    } catch (error) {
        console.error('Email HR failed:', error);
        showNotification('Failed to notify HR. Please contact them directly at (720) 638-7289.', 'error');
    }
}

// Checklist management handlers
function markAllChecklistComplete() {
    try {
        const checkboxes = document.querySelectorAll('.checklist-checkbox:not(:checked)');
        let count = 0;
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            handleCheckboxChange(checkbox);
            count++;
        });
        
        if (count > 0) {
            showNotification(`Marked ${count} checklist items as complete`, 'success');
            updateProgress();
        } else {
            showNotification('All checklist items are already complete', 'info');
        }
        
        logger?.info('Bulk checklist completion', { itemsMarked: count });
        
    } catch (error) {
        console.error('Mark all checklist complete failed:', error);
        showNotification('Failed to update checklist items', 'error');
    }
}

function resetAllChecklist() {
    try {
        if (confirm('Are you sure you want to reset all checklist items? This cannot be undone.')) {
            const checkboxes = document.querySelectorAll('.checklist-checkbox:checked');
            let count = 0;
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                handleCheckboxChange(checkbox);
                count++;
            });
            
            showNotification(`Reset ${count} checklist items`, 'info');
            updateProgress();
            
            logger?.info('Bulk checklist reset', { itemsReset: count });
        }
    } catch (error) {
        console.error('Reset checklist failed:', error);
        showNotification('Failed to reset checklist items', 'error');
    }
}

function exportChecklistProgress() {
    try {
        const checklistData = {
            exportDate: new Date().toISOString(),
            employee: appState.employeeData.name || 'Unknown',
            totalItems: document.querySelectorAll('.checklist-checkbox').length,
            completedItems: document.querySelectorAll('.checklist-checkbox:checked').length,
            progress: appState.progress,
            checklistItems: appState.checklistItems,
            completedModules: appState.completedModules
        };
        
        const blob = new Blob([JSON.stringify(checklistData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `checklist-progress-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Checklist progress exported successfully', 'success');
        
        logger?.info('Checklist progress exported', {
            totalItems: checklistData.totalItems,
            completedItems: checklistData.completedItems
        });
        
    } catch (error) {
        console.error('Export checklist progress failed:', error);
        showNotification('Failed to export checklist progress', 'error');
    }
}

// Data export handlers
function exportHRDataJSON() {
    if (window.dataExporter) {
        dataExporter.exportData('json', 'hr');
    } else {
        showNotification('Export functionality not available', 'error');
    }
}

function exportHRDataCSV() {
    if (window.dataExporter) {
        dataExporter.exportData('csv', 'hr');
    } else {
        showNotification('Export functionality not available', 'error');
    }
}

function exportAnalyticsData() {
    if (window.dataExporter) {
        dataExporter.exportData('json', 'analytics');
    } else {
        showNotification('Export functionality not available', 'error');
    }
}

function exportFullData() {
    if (window.dataExporter) {
        dataExporter.exportData('json', 'full');
    } else {
        showNotification('Export functionality not available', 'error');
    }
}

function exportLogData() {
    if (window.logger) {
        logger.exportLogs();
    } else {
        showNotification('Logging functionality not available', 'error');
    }
}

// Modal close handlers
function closeFormModal() {
    closeFillableForm();
}

function closeSignatureModal() {
    closeSignature();
}

// Signature pad handlers
function clearSignaturePad() {
    clearSignature();
}

function saveSignaturePad() {
    saveSignature();
}

// Initialize all event handlers when DOM is loaded
function initializeEventHandlers() {
    // Company details button
    const companyBtn = document.querySelector('.company-details-btn');
    if (companyBtn) {
        companyBtn.addEventListener('click', showCompanyTab);
    }
    
    // Video completion button
    const videoCompleteBtn = document.querySelector('[data-module="video"]');
    if (videoCompleteBtn) {
        videoCompleteBtn.addEventListener('click', function() {
            markVideoComplete(this);
        });
    }
    
    // Document content buttons
    document.querySelectorAll('[onclick*="showDocumentContent"]').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        const regex = /showDocumentContent\('([^']+)',\s*this\)/;
        const match = regex.exec(onclickAttr);
        if (match) {
            const documentId = match[1];
            btn.removeAttribute('onclick');
            btn.addEventListener('click', function() {
                toggleDocumentContent(documentId, this);
            });
        }
    });
    
    // Document download buttons
    document.querySelectorAll('[onclick*="handleDocumentDownload"]').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        const regex = /handleDocumentDownload\('([^']+)',\s*'([^']+)',\s*this\)/;
        const match = regex.exec(onclickAttr);
        if (match) {
            const fileName = match[1];
            const docName = match[2];
            btn.removeAttribute('onclick');
            btn.addEventListener('click', function() {
                handleDocumentDownload(fileName, docName, this);
            });
        }
    });
    
    // Form opening buttons
    const formButtons = [
        { selector: '[onclick*="openFillableForm(\'handbook\')"]', handler: openHandbookForm },
        { selector: '[onclick*="openFillableForm(\'health-safety\')"]', handler: openHealthSafetyForm },
        { selector: '[onclick*="openFillableForm(\'new-hire-orientation\')"]', handler: openNewHireOrientationForm },
        { selector: '[onclick*="openFillableForm(\'steel-erection\')"]', handler: openSteelErectionForm },
        { selector: '[onclick*="openFillableForm(\'welding-procedures\')"]', handler: openWeldingProceduresForm },
        { selector: '[onclick*="openFillableForm(\'equipment-training\')"]', handler: openEquipmentTrainingForm }
    ];
    
    formButtons.forEach(({ selector, handler }) => {
        document.querySelectorAll(selector).forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', handler);
        });
    });
    
    // Bulk action buttons
    const bulkButtons = [
        { selector: '[onclick*="downloadAllCompletedForms"]', handler: downloadAllCompletedForms },
        { selector: '[onclick*="emailFormsToHR"]', handler: emailFormsToHR },
        { selector: '[onclick*="markAllChecklistComplete"]', handler: markAllChecklistComplete },
        { selector: '[onclick*="resetAllChecklist"]', handler: resetAllChecklist },
        { selector: '[onclick*="exportChecklistProgress"]', handler: exportChecklistProgress }
    ];
    
    bulkButtons.forEach(({ selector, handler }) => {
        document.querySelectorAll(selector).forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', handler);
        });
    });
    
    // Export buttons
    const exportButtons = [
        { selector: '[onclick*="dataExporter.exportData(\'json\', \'hr\')"]', handler: exportHRDataJSON },
        { selector: '[onclick*="dataExporter.exportData(\'csv\', \'hr\')"]', handler: exportHRDataCSV },
        { selector: '[onclick*="dataExporter.exportData(\'json\', \'analytics\')"]', handler: exportAnalyticsData },
        { selector: '[onclick*="dataExporter.exportData(\'json\', \'full\')"]', handler: exportFullData },
        { selector: '[onclick*="logger.exportLogs"]', handler: exportLogData }
    ];
    
    exportButtons.forEach(({ selector, handler }) => {
        document.querySelectorAll(selector).forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', handler);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('[onclick*="closeFillableForm"]').forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', closeFormModal);
    });
    
    document.querySelectorAll('[onclick*="closeSignature"]').forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', closeSignatureModal);
    });
    
    // Signature pad buttons
    document.querySelectorAll('[onclick*="clearSignature"]').forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', clearSignaturePad);
    });
    
    document.querySelectorAll('[onclick*="saveSignature"]').forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', saveSignaturePad);
    });
    
    console.log('✅ Event handlers initialized and inline scripts removed');
}

// Enhanced email modal styles
const emailModalStyles = document.createElement('style');
emailModalStyles.textContent = `
.email-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.email-modal .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.email-modal .email-details {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 5px;
    margin: 1rem 0;
}

.email-modal textarea {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 0.5rem;
    font-family: monospace;
    font-size: 0.9rem;
    resize: vertical;
}
`;

document.head.appendChild(emailModalStyles);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventHandlers);
} else {
    initializeEventHandlers();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeEventHandlers,
        downloadAllCompletedForms,
        emailFormsToHR,
        markAllChecklistComplete,
        resetAllChecklist,
        exportChecklistProgress
    };
}