#!/bin/bash

echo "🚀 Deploying Steel Onboarding App to Vercel with API functions..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run from project root."
    exit 1
fi

# Check if API functions exist
if [ ! -d "api" ]; then
    echo "❌ Error: api directory not found"
    exit 1
fi

echo "✅ API Functions found:"
find api -name "*.js" -type f

# Push latest changes
echo "📤 Pushing latest changes..."
git add -A
git commit -m "deploy: Update for Vercel serverless deployment

- Ensure all API functions are included
- Fix Supabase data persistence in production

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "No changes to commit"

git push origin production-clean

echo "🔄 Deployment should be triggered automatically via Vercel GitHub integration"
echo "🌐 Check: https://steel-onboarding-app.vercel.app/api/health"
echo "📊 Monitor: https://vercel.com/dashboard"

# Wait and test
echo "⏱️  Waiting 30 seconds for deployment..."
sleep 30

echo "🧪 Testing API endpoint..."
curl -s https://steel-onboarding-app.vercel.app/api/health || echo "API not ready yet"

echo "✅ Deployment script completed!"