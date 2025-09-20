#!/bin/bash

echo "🏠 Home Assistant MCP Server - Local Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your Home Assistant details:"
    echo "   1. Set HA_BASE_URL to your Home Assistant URL"
    echo "   2. Set HA_ACCESS_TOKEN to your long-lived access token"
    echo ""
    echo "   Your current setup should be:"
    echo "   HA_BASE_URL=http://192.168.11.198:8123"
    echo "   HA_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyZDFlMDlkYWQ5ZWQ0NzExYjBhODc0YTE2Y2UxZGI3MiIsImlhdCI6MTc1ODM4MDI3NCwiZXhwIjoyMDczNzQwMjc0fQ.2m3ltQcvnsGcZYxVBc18ASP-Upcaqa9cUqohyxpvtpM"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🧪 Testing Home Assistant connection..."
npm run test

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Home Assistant details (if not done already)"
echo "2. Test connection: npm run test"
echo "3. Start MCP server: npm start"
echo "4. Configure Claude Desktop (see README.md)"
echo ""
echo "Repository: https://github.com/bader1919/ha-mcp-server"
