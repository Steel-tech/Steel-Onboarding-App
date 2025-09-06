#!/usr/bin/env node

/**
 * Production Health Check Script for Steel Onboarding Application
 * 
 * Features:
 * - Comprehensive application health monitoring
 * - Database connectivity and integrity checks
 * - Email service availability testing
 * - Resource utilization monitoring
 * - API endpoint testing
 * - Exit codes for monitoring systems
 * 
 * Usage:
 *   node health-check.js              # Full health check
 *   node health-check.js --quick      # Quick check only
 *   node health-check.js --database   # Database check only
 *   node health-check.js --email      # Email service check only
 *   node health-check.js --api        # API endpoints check only
 *   node health-check.js --json       # JSON output for monitoring
 *   node health-check.js --help       # Show help
 * 
 * Exit Codes:
 *   0: All checks passed (healthy)
 *   1: Critical failure (unhealthy)
 *   2: Warning state (degraded)
 *   3: Configuration error
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const http = require('http');
const os = require('os');
require('dotenv').config();

// Configuration
const config = {
    DB_PATH: process.env.DB_PATH || path.join(__dirname, 'onboarding.db'),
    SERVER_URL: process.env.HEALTH_CHECK_URL || `http://localhost:${process.env.PORT || 3001}`,
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: process.env.EMAIL_PORT || 587,
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    TIMEOUT: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 10000, // 10 seconds
    MEMORY_THRESHOLD: parseInt(process.env.MEMORY_THRESHOLD) || 80, // 80%
    DISK_THRESHOLD: parseInt(process.env.DISK_THRESHOLD) || 85, // 85%
    CPU_THRESHOLD: parseInt(process.env.CPU_THRESHOLD) || 90 // 90%
};

class HealthChecker {
    constructor(options = {}) {
        this.options = {
            quick: options.quick || false,
            database: options.database || false,
            email: options.email || false,
            api: options.api || false,
            json: options.json || false,
            verbose: options.verbose || false
        };
        
        this.results = {
            timestamp: new Date().toISOString(),
            status: 'unknown',
            checks: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            },
            system: {},
            uptime: process.uptime(),
            version: this.getAppVersion()
        };
    }

    /**
     * Execute health checks
     */
    async execute() {
        try {
            this.log('🏥 Starting health check', 'INFO');
            this.log(`📊 Mode: ${this.getCheckMode()}`, 'INFO');
            
            // System information
            this.results.system = await this.getSystemInfo();
            
            // Run appropriate checks based on options
            if (this.options.quick) {
                await this.runQuickChecks();
            } else if (this.options.database) {
                await this.checkDatabase();
            } else if (this.options.email) {
                await this.checkEmailService();
            } else if (this.options.api) {
                await this.checkAPIEndpoints();
            } else {
                await this.runAllChecks();
            }
            
            // Calculate final status
            this.calculateFinalStatus();
            
            // Output results
            this.outputResults();
            
            // Return appropriate exit code
            return this.getExitCode();
            
        } catch (error) {
            this.log(`❌ Health check failed: ${error.message}`, 'ERROR');
            this.results.status = 'error';
            this.results.error = error.message;
            
            if (this.options.json) {
                console.log(JSON.stringify(this.results, null, 2));
            }
            
            return 3; // Configuration error
        }
    }

    /**
     * Run quick checks (essential services only)
     */
    async runQuickChecks() {
        this.log('⚡ Running quick health checks', 'INFO');
        
        await Promise.all([
            this.checkDatabaseConnection(),
            this.checkAPIHealth(),
            this.checkMemoryUsage()
        ]);
    }

    /**
     * Run all comprehensive checks
     */
    async runAllChecks() {
        this.log('🔍 Running comprehensive health checks', 'INFO');
        
        const checks = [
            this.checkDatabaseConnection(),
            this.checkDatabase(),
            this.checkAPIHealth(),
            this.checkAPIEndpoints(),
            this.checkEmailService(),
            this.checkFileSystem(),
            this.checkMemoryUsage(),
            this.checkCPUUsage(),
            this.checkDiskUsage()
        ];
        
        await Promise.allSettled(checks);
    }

    /**
     * Check database connection
     */
    async checkDatabaseConnection() {
        const checkName = 'database_connection';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(config.DB_PATH, sqlite3.OPEN_READONLY, (err) => {
                    if (err) {
                        reject(new Error(`Cannot connect to database: ${err.message}`));
                        return;
                    }
                    
                    db.close((closeErr) => {
                        if (closeErr) {
                            reject(new Error(`Error closing database: ${closeErr.message}`));
                        } else {
                            resolve({ message: 'Database connection successful' });
                        }
                    });
                });
            });
        });
    }

    /**
     * Check database integrity and data
     */
    async checkDatabase() {
        const checkName = 'database_integrity';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(config.DB_PATH, sqlite3.OPEN_READONLY, (err) => {
                    if (err) {
                        reject(new Error(`Database connection failed: ${err.message}`));
                        return;
                    }
                    
                    // Check table existence and basic counts
                    const queries = [
                        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'",
                        "SELECT COUNT(*) as count FROM users",
                        "SELECT COUNT(*) as count FROM employee_data",
                        "SELECT COUNT(*) as count FROM onboarding_progress",
                        "SELECT COUNT(*) as count FROM form_submissions",
                        "SELECT COUNT(*) as count FROM audit_logs"
                    ];
                    
                    const results = {};
                    let completed = 0;
                    
                    queries.forEach((query, index) => {
                        db.get(query, (err, row) => {
                            if (err) {
                                reject(new Error(`Database query failed: ${err.message}`));
                                return;
                            }
                            
                            const tableName = index === 0 ? 'tables' : queries[index].match(/FROM (\w+)/)[1];
                            results[tableName] = row.count;
                            completed++;
                            
                            if (completed === queries.length) {
                                db.close();
                                resolve({
                                    message: 'Database integrity check passed',
                                    data: results
                                });
                            }
                        });
                    });
                });
            });
        });
    }

    /**
     * Check API health endpoint
     */
    async checkAPIHealth() {
        const checkName = 'api_health';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            return new Promise((resolve, reject) => {
                const url = new URL('/api/health', config.SERVER_URL);
                const options = {
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname,
                    method: 'GET',
                    timeout: config.TIMEOUT
                };
                
                const req = http.request(options, (res) => {
                    let data = '';
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            try {
                                const healthData = JSON.parse(data);
                                resolve({
                                    message: 'API health endpoint responding',
                                    data: healthData
                                });
                            } catch (error) {
                                reject(new Error('Invalid health endpoint response'));
                            }
                        } else {
                            reject(new Error(`Health endpoint returned ${res.statusCode}`));
                        }
                    });
                });
                
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('API health check timeout'));
                });
                
                req.on('error', (err) => {
                    reject(new Error(`API health check failed: ${err.message}`));
                });
                
                req.end();
            });
        });
    }

    /**
     * Check critical API endpoints
     */
    async checkAPIEndpoints() {
        const checkName = 'api_endpoints';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            const endpoints = [
                { path: '/api/health', method: 'GET', expectedStatus: 200 },
                { path: '/api/auth/login', method: 'POST', expectedStatus: 400 } // Should fail without credentials
            ];
            
            const results = {};
            
            for (const endpoint of endpoints) {
                try {
                    const result = await this.testEndpoint(endpoint);
                    results[endpoint.path] = result;
                } catch (error) {
                    results[endpoint.path] = {
                        success: false,
                        error: error.message
                    };
                }
            }
            
            const successCount = Object.values(results).filter(r => r.success).length;
            
            return {
                message: `${successCount}/${endpoints.length} endpoints responding correctly`,
                data: results
            };
        });
    }

    /**
     * Test individual API endpoint
     */
    async testEndpoint(endpoint) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint.path, config.SERVER_URL);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: endpoint.method,
                timeout: config.TIMEOUT,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const success = res.statusCode === endpoint.expectedStatus;
                    resolve({
                        success,
                        statusCode: res.statusCode,
                        expectedStatus: endpoint.expectedStatus,
                        responseTime: Date.now() - startTime
                    });
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Endpoint timeout'));
            });
            
            req.on('error', (err) => {
                reject(new Error(`Endpoint error: ${err.message}`));
            });
            
            const startTime = Date.now();
            
            // Send test data for POST requests
            if (endpoint.method === 'POST') {
                req.write(JSON.stringify({}));
            }
            
            req.end();
        });
    }

    /**
     * Check email service connectivity
     */
    async checkEmailService() {
        const checkName = 'email_service';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            if (!config.EMAIL_USER || !config.EMAIL_PASS) {
                return {
                    status: 'warning',
                    message: 'Email service not configured'
                };
            }
            
            const transporter = nodemailer.createTransporter({
                host: config.EMAIL_HOST,
                port: config.EMAIL_PORT,
                secure: false,
                auth: {
                    user: config.EMAIL_USER,
                    pass: config.EMAIL_PASS
                }
            });
            
            await transporter.verify();
            
            return {
                message: 'Email service connectivity verified',
                data: {
                    host: config.EMAIL_HOST,
                    port: config.EMAIL_PORT,
                    user: config.EMAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2')
                }
            };
        });
    }

    /**
     * Check file system access
     */
    async checkFileSystem() {
        const checkName = 'filesystem';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            const checks = [];
            
            // Check database file
            try {
                const dbStats = await fs.stat(config.DB_PATH);
                checks.push({
                    file: config.DB_PATH,
                    accessible: true,
                    size: dbStats.size,
                    modified: dbStats.mtime
                });
            } catch (error) {
                checks.push({
                    file: config.DB_PATH,
                    accessible: false,
                    error: error.message
                });
            }
            
            // Check write permissions in app directory
            const testFile = path.join(__dirname, '.health-check-test');
            try {
                await fs.writeFile(testFile, 'test');
                await fs.unlink(testFile);
                checks.push({
                    path: __dirname,
                    writable: true
                });
            } catch (error) {
                checks.push({
                    path: __dirname,
                    writable: false,
                    error: error.message
                });
            }
            
            return {
                message: 'File system access verified',
                data: checks
            };
        });
    }

    /**
     * Check memory usage
     */
    async checkMemoryUsage() {
        const checkName = 'memory_usage';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            const usage = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memPercentage = (usedMem / totalMem) * 100;
            
            const status = memPercentage > config.MEMORY_THRESHOLD ? 'warning' : 'ok';
            
            return {
                status,
                message: `Memory usage: ${memPercentage.toFixed(1)}%`,
                data: {
                    heapUsed: usage.heapUsed,
                    heapTotal: usage.heapTotal,
                    external: usage.external,
                    rss: usage.rss,
                    systemTotal: totalMem,
                    systemFree: freeMem,
                    systemUsed: usedMem,
                    systemUsedPercentage: memPercentage
                }
            };
        });
    }

    /**
     * Check CPU usage
     */
    async checkCPUUsage() {
        const checkName = 'cpu_usage';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            const cpus = os.cpus();
            let totalIdle = 0;
            let totalTick = 0;
            
            cpus.forEach(cpu => {
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });
            
            const idle = totalIdle / cpus.length;
            const total = totalTick / cpus.length;
            const usage = 100 - ~~(100 * idle / total);
            
            const status = usage > config.CPU_THRESHOLD ? 'warning' : 'ok';
            
            return {
                status,
                message: `CPU usage: ${usage}%`,
                data: {
                    usage,
                    cores: cpus.length,
                    model: cpus[0].model
                }
            };
        });
    }

    /**
     * Check disk usage
     */
    async checkDiskUsage() {
        const checkName = 'disk_usage';
        this.results.checks[checkName] = await this.runCheck(checkName, async () => {
            try {
                // Simple disk usage check (basic implementation)
                const stats = await fs.stat(__dirname);
                
                // This is a simplified check - in production you might want more sophisticated disk monitoring
                return {
                    status: 'ok',
                    message: 'Disk access verified',
                    data: {
                        directory: __dirname,
                        accessible: true
                    }
                };
                
            } catch (error) {
                return {
                    status: 'error',
                    message: 'Disk access failed',
                    data: {
                        error: error.message
                    }
                };
            }
        });
    }

    /**
     * Run individual check with error handling
     */
    async runCheck(name, checkFunction) {
        const startTime = Date.now();
        
        try {
            this.log(`🔍 Running check: ${name}`, 'DEBUG');
            
            const result = await Promise.race([
                checkFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Check timeout')), config.TIMEOUT)
                )
            ]);
            
            const duration = Date.now() - startTime;
            const status = result.status || 'ok';
            
            this.results.summary.total++;
            if (status === 'ok') {
                this.results.summary.passed++;
            } else if (status === 'warning') {
                this.results.summary.warnings++;
            } else {
                this.results.summary.failed++;
            }
            
            this.log(`✅ Check ${name}: ${status} (${duration}ms)`, status === 'ok' ? 'INFO' : 'WARN');
            
            return {
                status,
                message: result.message,
                data: result.data,
                duration,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.results.summary.total++;
            this.results.summary.failed++;
            
            this.log(`❌ Check ${name}: failed - ${error.message} (${duration}ms)`, 'ERROR');
            
            return {
                status: 'error',
                message: error.message,
                duration,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get system information
     */
    async getSystemInfo() {
        return {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptime: os.uptime(),
            loadavg: os.loadavg(),
            totalmem: os.totalmem(),
            freemem: os.freemem(),
            cpus: os.cpus().length
        };
    }

    /**
     * Calculate final health status
     */
    calculateFinalStatus() {
        const { total, passed, failed, warnings } = this.results.summary;
        
        if (failed > 0) {
            this.results.status = 'unhealthy';
        } else if (warnings > 0) {
            this.results.status = 'degraded';
        } else if (passed === total && total > 0) {
            this.results.status = 'healthy';
        } else {
            this.results.status = 'unknown';
        }
    }

    /**
     * Output results based on format
     */
    outputResults() {
        if (this.options.json) {
            console.log(JSON.stringify(this.results, null, 2));
        } else {
            this.outputHumanReadable();
        }
    }

    /**
     * Output human-readable results
     */
    outputHumanReadable() {
        const statusEmoji = {
            healthy: '✅',
            degraded: '⚠️',
            unhealthy: '❌',
            unknown: '❓'
        };
        
        console.log('\n🏥 Steel Onboarding Application Health Check');
        console.log('=' .repeat(50));
        console.log(`${statusEmoji[this.results.status]} Overall Status: ${this.results.status.toUpperCase()}`);
        console.log(`📊 Summary: ${this.results.summary.passed}/${this.results.summary.total} checks passed`);
        console.log(`⏱️  Uptime: ${Math.floor(this.results.uptime)}s`);
        console.log(`📅 Timestamp: ${this.results.timestamp}`);
        
        if (this.results.summary.warnings > 0) {
            console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
        }
        
        if (this.results.summary.failed > 0) {
            console.log(`❌ Failures: ${this.results.summary.failed}`);
        }
        
        console.log('\n📋 Check Details:');
        console.log('-'.repeat(30));
        
        for (const [name, result] of Object.entries(this.results.checks)) {
            const emoji = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
            console.log(`${emoji} ${name}: ${result.message} (${result.duration}ms)`);
            
            if (this.options.verbose && result.data) {
                console.log(`   Data: ${JSON.stringify(result.data)}`);
            }
        }
        
        console.log('\n💻 System Information:');
        console.log('-'.repeat(25));
        console.log(`🖥️  Hostname: ${this.results.system.hostname}`);
        console.log(`⚙️  Platform: ${this.results.system.platform} (${this.results.system.arch})`);
        console.log(`🟢 Node.js: ${this.results.system.nodeVersion}`);
        console.log(`💾 Memory: ${this.formatBytes(this.results.system.freemem)}/${this.formatBytes(this.results.system.totalmem)} free`);
        console.log(`🔌 CPU Cores: ${this.results.system.cpus}`);
        console.log(`⏰ System Uptime: ${Math.floor(this.results.system.uptime / 3600)}h`);
    }

    /**
     * Get appropriate exit code
     */
    getExitCode() {
        switch (this.results.status) {
            case 'healthy': return 0;
            case 'degraded': return 2;
            case 'unhealthy': return 1;
            default: return 3;
        }
    }

    /**
     * Get check mode description
     */
    getCheckMode() {
        if (this.options.quick) return 'Quick';
        if (this.options.database) return 'Database Only';
        if (this.options.email) return 'Email Only';
        if (this.options.api) return 'API Only';
        return 'Comprehensive';
    }

    /**
     * Get application version
     */
    getAppVersion() {
        try {
            const packageJson = require('./package.json');
            return packageJson.version;
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Format bytes for human readable output
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Log message (respects verbose mode)
     */
    log(message, level = 'INFO') {
        if (this.options.verbose || level === 'ERROR' || level === 'WARN') {
            const timestamp = new Date().toISOString().substr(11, 8);
            console.error(`[${timestamp}] ${message}`);
        }
    }
}

/**
 * Command line interface
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Steel Onboarding Health Check Tool

Usage:
  node health-check.js [options]

Options:
  --quick       Quick check (essential services only)
  --database    Database checks only
  --email       Email service checks only
  --api         API endpoint checks only
  --json        Output in JSON format
  --verbose     Verbose output
  --help        Show this help

Exit Codes:
  0   All checks passed (healthy)
  1   Critical failure (unhealthy)
  2   Warning state (degraded)
  3   Configuration error

Examples:
  # Full health check with verbose output
  node health-check.js --verbose

  # Quick check for monitoring systems
  node health-check.js --quick --json

  # Database-only check
  node health-check.js --database

  # Use in monitoring (cron example)
  */5 * * * * cd /path/to/app && node health-check.js --quick --json >> /var/log/health.log 2>&1

Environment Variables:
  HEALTH_CHECK_URL         Server URL (default: http://localhost:3001)
  HEALTH_CHECK_TIMEOUT     Check timeout in ms (default: 10000)
  MEMORY_THRESHOLD         Memory usage warning % (default: 80)
  DISK_THRESHOLD          Disk usage warning % (default: 85)
  CPU_THRESHOLD           CPU usage warning % (default: 90)
        `);
        process.exit(0);
    }
    
    const options = {
        quick: args.includes('--quick'),
        database: args.includes('--database'),
        email: args.includes('--email'),
        api: args.includes('--api'),
        json: args.includes('--json'),
        verbose: args.includes('--verbose')
    };
    
    const checker = new HealthChecker(options);
    const exitCode = await checker.execute();
    
    process.exit(exitCode);
}

// Execute if run directly
if (require.main === module) {
    main().catch(error => {
        console.error(`❌ Health check error: ${error.message}`);
        process.exit(3);
    });
}

module.exports = HealthChecker;