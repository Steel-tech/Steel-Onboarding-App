#!/bin/bash

# Flawless Steel Welding - Onboarding System Deployment Script
# This script automates the setup process

echo "================================================"
echo "FSW Onboarding System - Automated Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running in correct directory
if [ ! -f "index.html" ] || [ ! -f "server.js" ]; then
    print_error "Please run this script from the Steel Onboarding App directory"
    exit 1
fi

echo "Step 1: Checking Prerequisites"
echo "-------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_status "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

echo ""
echo "Step 2: Installing Dependencies"
echo "-------------------------------"

# Install dependencies
print_status "Installing Node.js packages..."
npm install express cors helmet bcrypt jsonwebtoken nodemailer sqlite3 express-rate-limit express-validator dotenv 2>/dev/null

if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
echo "Step 3: Environment Configuration"
echo "-------------------------------"

# Check if .env exists
if [ -f ".env" ]; then
    print_warning ".env file already exists. Skipping creation."
    echo "Please verify your .env settings manually."
else
    print_status "Creating .env file..."
    cat > .env << 'EOL'
# Server Configuration
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=CHANGE_THIS_TO_RANDOM_SECRET_$(date +%s)
BCRYPT_ROUNDS=12

# Database
DB_PATH=./onboarding.db

# Email Configuration (Update these!)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
HR_EMAIL=hr@flawlesssteelwelding.com
ADMIN_EMAIL=admin@flawlesssteelwelding.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# n8n Webhook (Update after n8n setup)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/fsw-onboarding
N8N_WEBHOOK_TOKEN=fsw-secure-token-2025

# Session
SESSION_TIMEOUT=1800000
EOL
    print_status ".env file created"
    print_warning "IMPORTANT: Edit .env file with your actual email and n8n settings!"
fi

echo ""
echo "Step 4: Database Setup"
echo "-------------------------------"

# Initialize database
if [ -f "onboarding.db" ]; then
    print_warning "Database already exists. Skipping initialization."
else
    print_status "Initializing SQLite database..."
    node setup-database.js
    if [ $? -eq 0 ]; then
        print_status "Database initialized successfully"
    else
        print_error "Failed to initialize database"
        exit 1
    fi
fi

echo ""
echo "Step 5: File Permissions"
echo "-------------------------------"

# Set correct permissions
chmod 644 *.html *.css *.js *.pdf *.ppt *.pptx 2>/dev/null
chmod 755 . 2>/dev/null
chmod 600 .env 2>/dev/null
chmod 664 onboarding.db 2>/dev/null

print_status "File permissions set"

echo ""
echo "Step 6: Creating Start Scripts"
echo "-------------------------------"

# Create start script
cat > start.sh << 'EOL'
#!/bin/bash
echo "Starting FSW Onboarding System..."
node server.js
EOL
chmod +x start.sh
print_status "Created start.sh"

# Create stop script
cat > stop.sh << 'EOL'
#!/bin/bash
echo "Stopping FSW Onboarding System..."
pkill -f "node server.js"
echo "Server stopped"
EOL
chmod +x stop.sh
print_status "Created stop.sh"

echo ""
echo "Step 7: Validation"
echo "-------------------------------"

# Validate Super Code files
if [ -f "fsw-enhanced-onboarding-processor.js" ]; then
    print_status "Enhanced processor Super Code found"
else
    print_warning "Enhanced processor Super Code not found"
fi

if [ -f "fsw-webhook-receiver.js" ]; then
    print_status "Webhook receiver Super Code found"
else
    print_warning "Webhook receiver Super Code not found"
fi

if [ -f "fsw-report-generator.js" ]; then
    print_status "Report generator Super Code found"
else
    print_warning "Report generator Super Code not found"
fi

echo ""
echo "Step 8: System Check"
echo "-------------------------------"

# Check if port 3001 is available
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Port 3001 is already in use"
    echo "Run './stop.sh' to stop existing server"
else
    print_status "Port 3001 is available"
fi

echo ""
echo "================================================"
echo "           DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Edit .env file with your actual configuration"
echo "   ${GREEN}nano .env${NC}"
echo ""
echo "2. Start the backend server:"
echo "   ${GREEN}./start.sh${NC}"
echo ""
echo "3. Open the application in your browser:"
echo "   ${GREEN}open index.html${NC}"
echo ""
echo "4. Set up n8n workflows:"
echo "   - Import Super Code files to n8n"
echo "   - Configure webhook URL in .env"
echo ""
echo "5. Test the system:"
echo "   ${GREEN}curl http://localhost:3001/api/health${NC}"
echo ""
echo "For detailed setup instructions, see:"
echo "${GREEN}COMPLETE-SETUP-GUIDE.md${NC}"
echo ""
echo "Support: (720) 638-7289 | hr@flawlesssteelwelding.com"
echo ""
print_status "Deployment script completed successfully!"
