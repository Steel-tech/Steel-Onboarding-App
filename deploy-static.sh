#!/bin/bash

# Steel Onboarding App - Static Deployment Script
# Deploys the app to Netlify for new hire access

echo "🚀 Deploying Steel Onboarding App for New Hires"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the Steel Onboarding App directory"
    exit 1
fi

# Install Netlify CLI if not present
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if this is first deployment or update
if [ -f ".netlify/state.json" ]; then
    echo "🔄 Updating existing deployment..."
    netlify deploy --prod --dir=. --message="Steel Onboarding App update - $(date)"
else
    echo "🆕 First-time deployment..."
    echo "📝 You'll need to:"
    echo "   1. Connect to your Netlify account"
    echo "   2. Choose a site name (suggestion: fsw-onboarding)"
    echo "   3. Set deployment directory to current directory"
    
    netlify deploy --prod --dir=.
fi

# Get the deployment URL
SITE_URL=$(netlify status --json | grep -o '"url":"[^"]*' | grep -o '[^"]*$')

if [ ! -z "$SITE_URL" ]; then
    echo ""
    echo "✅ Deployment Complete!"
    echo "========================"
    echo ""
    echo "🌐 Your onboarding app is live at:"
    echo "   $SITE_URL"
    echo ""
    echo "📧 Share this URL with new hires along with:"
    echo "   📄 DEPLOYMENT-GUIDE-NEW-HIRES.md (instructions for employees)"
    echo ""
    echo "📊 To monitor your site:"
    echo "   netlify open:site"
    echo ""
    echo "🔧 To see deployment logs:"
    echo "   netlify logs"
    echo ""
else
    echo "⚠️  Deployment completed but couldn't retrieve URL"
    echo "   Run 'netlify status' to get your site URL"
fi

echo ""
echo "🎉 New hires can now access their onboarding at the URL above!"
echo ""
echo "💡 Next steps:"
echo "   1. Update DEPLOYMENT-GUIDE-NEW-HIRES.md with the actual URL"
echo "   2. Test the complete workflow yourself"
echo "   3. Set up Supabase database tables if needed"
echo "   4. Configure email notifications in Supabase Edge Functions"