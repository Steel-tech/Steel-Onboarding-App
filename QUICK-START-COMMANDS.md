# 🚀 Quick Start Commands - FSW Onboarding System

## 🔥 Most Used Commands

### Start Everything
```bash
# Navigate to app directory
cd "/Users/vics/Documents/Steel Onboarding App"

# Start backend server
npm start

# Open frontend in browser
open index.html
```

### Test the System
```bash
# Quick health check
curl http://localhost:3001/api/health

# Test webhook to n8n
curl -X POST YOUR_N8N_WEBHOOK_URL \
  -H "x-webhook-token: fsw-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"type":"test","employeeId":"TEST-001"}'
```

### View Logs
```bash
# Server logs
pm2 logs fsw-onboarding

# Database queries
sqlite3 onboarding.db "SELECT * FROM employees ORDER BY created_at DESC LIMIT 5;"

# Check progress
sqlite3 onboarding.db "SELECT e.name, COUNT(p.id) as modules_completed FROM employees e LEFT JOIN progress p ON e.employee_id = p.employee_id GROUP BY e.id;"
```

## 📊 Database Quick Queries

```sql
-- Get today's new employees
SELECT * FROM employees WHERE DATE(created_at) = DATE('now');

-- Check incomplete onboardings
SELECT name, email, created_at FROM employees WHERE employee_id NOT IN (SELECT DISTINCT employee_id FROM progress WHERE module_name = 'final_checklist');

-- Generate completion report
SELECT 
    e.name,
    e.position,
    COUNT(p.id) as completed_modules,
    GROUP_CONCAT(p.module_name) as modules
FROM employees e
LEFT JOIN progress p ON e.employee_id = p.employee_id
GROUP BY e.id;
```

## 🔧 Troubleshooting Commands

```bash
# Restart server
pm2 restart fsw-onboarding

# Clear all app data (WARNING: Deletes progress!)
localStorage.clear()  # Run in browser console

# Reset database (WARNING: Deletes all data!)
rm onboarding.db && node setup-database.js

# Check port usage
lsof -i :3001

# Kill process on port
kill -9 $(lsof -t -i:3001)
```

## 🔗 Important URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **n8n Webhook**: [Configure in n8n]
- **Company Site**: https://flawlesssteelwelding.com

## 📞 Emergency Contacts

- **Developer Support**: (720) 638-7289
- **HR Department**: hr@flawlesssteelwelding.com
- **IT Support**: support@flawlesssteelwelding.com

## 🎯 Daily Checklist

Morning:
- [ ] Check server status: `pm2 status`
- [ ] Verify database: `sqlite3 onboarding.db ".tables"`
- [ ] Review error logs: `pm2 logs --err`

Evening:
- [ ] Backup database: `sqlite3 onboarding.db ".backup backup-$(date +%Y%m%d).db"`
- [ ] Check disk space: `df -h`
- [ ] Review completion stats

---
**Pro Tip**: Save this file to your desktop for quick access!
