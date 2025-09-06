// DEBUG SCRIPT FOR DOCUMENT DOWNLOAD ISSUES
// Add this to the browser console to test download functionality

console.log("=== DOCUMENT DOWNLOAD DEBUGGING ===");

// Test 1: Check if popup blocker is blocking window.open
function testPopupBlocker() {
    console.log("\n1. Testing popup blocker...");
    const testWindow = window.open('', '_blank');
    if (testWindow === null || testWindow === undefined) {
        console.error("❌ POPUP BLOCKED: Browser is blocking window.open()");
        console.log("💡 SOLUTION: Allow popups for this site in browser settings");
        return false;
    } else {
        console.log("✅ Popup allowed");
        testWindow.close();
        return true;
    }
}

// Test 2: Check file accessibility
function testFileAccess() {
    console.log("\n2. Testing file accessibility...");
    const testFiles = [
        'fsw-employee-handbook-2024.pdf',
        'fsw-health-safety-2024.pdf',
        'orientation-video.mp4'
    ];
    
    testFiles.forEach(file => {
        fetch(file, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log(`✅ ${file} - accessible`);
                } else {
                    console.error(`❌ ${file} - HTTP ${response.status} ${response.statusText}`);
                }
            })
            .catch(error => {
                console.error(`❌ ${file} - ${error.message}`);
                if (error.message.includes('CORS')) {
                    console.log("💡 SOLUTION: Serve files through HTTP server (python -m http.server)");
                }
            });
    });
    
    return { testStarted: true, fileCount: testFiles.length };
}

// Test 3: Test direct download function
function testDirectDownload(fileName = 'fsw-employee-handbook-2024.pdf') {
    console.log(`\n3. Testing direct download of ${fileName}...`);
    try {
        const result = window.open(fileName, '_blank');
        if (result === null) {
            console.error("❌ DOWNLOAD BLOCKED: window.open() returned null");
            return false;
        } else {
            console.log("✅ Download initiated successfully");
            return true;
        }
    } catch (error) {
        console.error(`❌ ERROR: ${error.message}`);
        return false;
    }
}

// Test 4: Alternative download methods
function testAlternativeDownload(fileName = 'fsw-employee-handbook-2024.pdf') {
    console.log(`\n4. Testing alternative download method for ${fileName}...`);
    try {
        // Create download link
        const link = document.createElement('a');
        link.href = fileName;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("✅ Alternative download method executed");
        return true;
    } catch (error) {
        console.error(`❌ ERROR: ${error.message}`);
        return false;
    }
}

// Test 5: Check Content Security Policy
function checkCSP() {
    console.log("\n5. Checking Content Security Policy...");
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    if (metaTags.length > 0) {
        const cspContent = metaTags[0].getAttribute('content');
        console.log("CSP found:", cspContent);
        const hasBlockingRules = cspContent.includes("object-src 'none'");
        if (hasBlockingRules) {
            console.log("⚠️  CSP may be blocking some download methods");
        }
        return { hasCSP: true, content: cspContent, hasBlockingRules };
    } else {
        console.log("No CSP meta tag found");
        return { hasCSP: false, content: null, hasBlockingRules: false };
    }
}

// Test 6: Check browser download permissions
function checkDownloadPermissions() {
    console.log("\n6. Checking browser download behavior...");
    console.log("User Agent:", navigator.userAgent);
    console.log("OS:", navigator.userAgentData ? navigator.userAgentData.platform : 'Unknown');
    
    // Check if running locally vs served
    if (location.protocol === 'file:') {
        console.log("⚠️  Running from file:// protocol - may cause CORS issues");
        console.log("💡 SOLUTION: Use HTTP server instead");
        return { protocol: 'file', hasIssues: true };
    } else {
        console.log("✅ Running from HTTP/HTTPS protocol");
        return { protocol: location.protocol, hasIssues: false };
    }
}

// Run all tests
async function runAllTests() {
    console.clear();
    console.log("=== DOCUMENT DOWNLOAD DEBUGGING ===\n");
    
    const results = {
        popupTest: testPopupBlocker(),
        fileAccessTest: testFileAccess(),
        directDownloadTest: testDirectDownload(),
        alternativeDownloadTest: testAlternativeDownload(),
        cspCheck: checkCSP(),
        permissionsCheck: checkDownloadPermissions()
    };
    
    console.log("\n=== SUMMARY ===");
    console.log("Results:", results);
    
    // Provide specific recommendations
    setTimeout(() => {
        console.log("\n=== RECOMMENDATIONS ===");
        if (!results.popupTest) {
            console.log("🔧 Enable popups for this site in browser settings");
        }
        if (location.protocol === 'file:') {
            console.log("🔧 Serve via HTTP server: python3 -m http.server 8000");
        }
        console.log("🔧 Try the alternative download method if window.open fails");
        console.log("🔧 Check browser console for specific error messages during download attempts");
    }, 2000);
}

// Auto-run tests
runAllTests();

// Export test functions for manual use
window.debugDownloads = {
    runAllTests,
    testPopupBlocker,
    testFileAccess,
    testDirectDownload,
    testAlternativeDownload,
    checkCSP,
    checkDownloadPermissions
};

console.log("\n💡 You can also run individual tests manually:");
console.log("debugDownloads.testPopupBlocker()");
console.log("debugDownloads.testDirectDownload('filename.pdf')");
console.log("debugDownloads.testAlternativeDownload('filename.pdf')");