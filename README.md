# Home Assistant MCP Server 🏠🤖

A powerful Model Context Protocol (MCP) server that gives Claude AI full read/write access to your Home Assistant instance. Perfect for managing and organizing thousands of entities with AI assistance.

## 🚀 Features

- **Complete Entity Analysis**: Breakdown by platform, domain, area, and problem categories
- **Smart Cleanup Suggestions**: Identifies diagnostic entities, duplicates, and unused items  
- **Bulk Operations**: Hide, disable, rename, and organize entities in batches
- **Area Management**: Create areas and automatically organize entities
- **Duplicate Detection**: Find and manage duplicate entities across your setup
- **Integration Review**: Analyze which integrations are creating the most entities
- **Cloudflare Workers Ready**: Deploy serverlessly or run locally

## 📋 Prerequisites

- Home Assistant instance with API access
- Node.js 18+ (for local development)
- Cloudflare account (for serverless deployment)
- Claude Desktop application

## 🔧 Quick Setup

### 1. Get Home Assistant Access Token

1. Go to your Home Assistant web interface
2. Click on your profile (bottom left)
3. Scroll down to "Long-lived access tokens"
4. Click "Create Token"
5. Give it a name like "Claude MCP Server"
6. **Copy the token** (you won't see it again!)

### 2. Clone and Setup

```bash
git clone https://github.com/bader1919/ha-mcp-server.git
cd ha-mcp-server
npm install
```

### 3. Environment Configuration

Create a `.env` file for local testing:

```bash
HA_BASE_URL=https://your-ha-instance.duckdns.org:8123
HA_ACCESS_TOKEN=your-long-lived-access-token
```

### 4. Test Locally

```bash
npm start
```

Should output: `Home Assistant MCP Server running on stdio`

### 5. Configure Claude Desktop

Find your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "home-assistant": {
      "command": "node",
      "args": ["/path/to/your/ha-mcp-server/index.js"],
      "env": {
        "HA_BASE_URL": "https://your-ha-instance.duckdns.org:8123",
        "HA_ACCESS_TOKEN": "your-long-lived-access-token"
      }
    }
  }
}
```

### 6. Restart Claude Desktop

Restart Claude Desktop and you should see the MCP server connected!

## ☁️ Cloudflare Workers Deployment

### 1. Login to Cloudflare

```bash
npx wrangler login
```

### 2. Set Secrets (Recommended)

```bash
npx wrangler secret put HA_BASE_URL
npx wrangler secret put HA_ACCESS_TOKEN
```

### 3. Deploy

```bash
npm run deploy
```

## 🎯 Usage Examples

Once connected, you can ask Claude things like:

### Analysis Commands
- "Analyze my Home Assistant entities and show me the breakdown"
- "Find duplicate entities in my setup"
- "What cleanup suggestions do you have for my 2000 entities?"
- "Show me which integrations are creating the most entities"

### Cleanup Commands
- "Hide all diagnostic sensor entities"
- "Disable all battery/linkquality/temperature diagnostic entities"
- "Create areas for my rooms and organize unassigned entities"
- "Find and disable orphaned entities"

### Organization Commands
- "Create a 'Living Room' area and assign all living room entities"
- "Rename all Zigbee sensors to include their room name"
- "Group all MQTT entities and suggest organization"

## 🛠️ Available Tools

The MCP server provides these tools to Claude:

- `analyze_entities` - Complete entity analysis and breakdown
- `find_duplicates` - Find potentially duplicate entities
- `suggest_cleanup` - AI-powered cleanup recommendations
- `hide_entities` - Hide multiple entities from UI
- `disable_entities` - Disable multiple entities
- `assign_area` - Assign entities to areas
- `create_area` - Create new areas
- `get_entity_details` - Get detailed entity information
- `bulk_rename` - Rename entities with patterns

## 🔒 Security Notes

- **Never commit your access token** to version control
- Use Cloudflare secrets for production deployment
- The access token has full Home Assistant API access
- Consider creating a dedicated HA user for the MCP server

## 🐛 Troubleshooting

### Connection Issues
- Verify your Home Assistant URL is accessible
- Check that your access token is valid
- Ensure Home Assistant API is enabled

### Claude Desktop Issues
- Restart Claude Desktop after config changes
- Check the config file path is correct
- Verify the node path in the config

### Entity Updates Failing
- Check Home Assistant logs for API errors
- Verify the entity IDs exist
- Some entities may be read-only

## 📖 API Documentation

### Home Assistant API Endpoints Used

- `/api/config/entity_registry/list` - Get all entities
- `/api/config/entity_registry/update` - Update entity properties
- `/api/config/device_registry/list` - Get all devices
- `/api/config/area_registry/list` - Get all areas
- `/api/states` - Get current entity states

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Model Context Protocol](https://modelcontextprotocol.io/)
- Powered by [Home Assistant](https://www.home-assistant.io/)
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com/)

## 📞 Support

- Create an issue for bugs or feature requests
- Check Home Assistant community forums for HA-specific questions
- Review MCP documentation for protocol questions

---

**⚡ Transform your overwhelming Home Assistant entity mess into a clean, organized system with AI assistance!**
