import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Home Assistant API client
class HomeAssistantAPI {
  constructor(baseUrl, accessToken) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.accessToken = accessToken;
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}/api/${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HA API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Entity Registry Operations
  async getEntityRegistry() {
    return await this.makeRequest('config/entity_registry/list');
  }

  async updateEntity(entityId, updates) {
    return await this.makeRequest(`config/entity_registry/update`, 'POST', {
      entity_id: entityId,
      ...updates
    });
  }

  async removeEntity(entityId) {
    return await this.makeRequest(`config/entity_registry/remove`, 'POST', {
      entity_id: entityId
    });
  }

  // Device Registry Operations
  async getDeviceRegistry() {
    return await this.makeRequest('config/device_registry/list');
  }

  async updateDevice(deviceId, updates) {
    return await this.makeRequest(`config/device_registry/update`, 'POST', {
      device_id: deviceId,
      ...updates
    });
  }

  // Area Registry Operations
  async getAreaRegistry() {
    return await this.makeRequest('config/area_registry/list');
  }

  async createArea(name, aliases = []) {
    return await this.makeRequest('config/area_registry/create', 'POST', {
      name,
      aliases
    });
  }

  async updateArea(areaId, updates) {
    return await this.makeRequest(`config/area_registry/update`, 'POST', {
      area_id: areaId,
      ...updates
    });
  }

  // States and Services
  async getStates() {
    return await this.makeRequest('states');
  }

  async getServices() {
    return await this.makeRequest('services');
  }

  async callService(domain, service, serviceData = {}) {
    return await this.makeRequest(`services/${domain}/${service}`, 'POST', serviceData);
  }

  // Configuration
  async getConfig() {
    return await this.makeRequest('config');
  }

  // History and Statistics
  async getHistory(entityIds, startTime, endTime) {
    const params = new URLSearchParams();
    if (entityIds) params.append('filter_entity_id', entityIds.join(','));
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);
    
    return await this.makeRequest(`history/period?${params}`);
  }

  // Integration Management
  async getIntegrations() {
    return await this.makeRequest('config/config_entries');
  }

  async disableIntegration(entryId) {
    return await this.makeRequest(`config/config_entries/${entryId}/disable`, 'POST');
  }
}

// Analysis Helper Functions
class HAAnalyzer {
  constructor(haAPI) {
    this.ha = haAPI;
  }

  async analyzeEntities() {
    const [entities, devices, areas, states] = await Promise.all([
      this.ha.getEntityRegistry(),
      this.ha.getDeviceRegistry(),
      this.ha.getAreaRegistry(),
      this.ha.getStates()
    ]);

    const deviceMap = new Map(devices.map(d => [d.id, d]));
    const areaMap = new Map(areas.map(a => [a.area_id, a]));
    const stateMap = new Map(states.map(s => [s.entity_id, s]));

    // Analysis by platform/integration
    const byPlatform = {};
    const byDomain = {};
    const byArea = { unassigned: [] };
    const hiddenEntities = [];
    const disabledEntities = [];
    const orphanedEntities = [];
    const unusedEntities = [];

    entities.forEach(entity => {
      const platform = entity.platform || 'unknown';
      const domain = entity.entity_id.split('.')[0];
      
      // Group by platform
      if (!byPlatform[platform]) byPlatform[platform] = [];
      byPlatform[platform].push(entity);

      // Group by domain
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(entity);

      // Group by area
      let areaId = entity.area_id;
      if (!areaId && entity.device_id) {
        const device = deviceMap.get(entity.device_id);
        areaId = device?.area_id;
      }
      
      if (areaId) {
        if (!byArea[areaId]) byArea[areaId] = [];
        byArea[areaId].push(entity);
      } else {
        byArea.unassigned.push(entity);
      }

      // Categorize special entities
      if (entity.hidden_by) hiddenEntities.push(entity);
      if (entity.disabled_by) disabledEntities.push(entity);
      if (entity.device_id && !deviceMap.has(entity.device_id)) {
        orphanedEntities.push(entity);
      }
      if (!stateMap.has(entity.entity_id)) {
        unusedEntities.push(entity);
      }
    });

    return {
      summary: {
        totalEntities: entities.length,
        totalDevices: devices.length,
        totalAreas: areas.length,
        hiddenCount: hiddenEntities.length,
        disabledCount: disabledEntities.length,
        orphanedCount: orphanedEntities.length,
        unusedCount: unusedEntities.length,
        unassignedCount: byArea.unassigned.length
      },
      byPlatform: Object.entries(byPlatform).map(([platform, entities]) => ({
        platform,
        count: entities.length,
        entities: entities.map(e => e.entity_id)
      })).sort((a, b) => b.count - a.count),
      byDomain: Object.entries(byDomain).map(([domain, entities]) => ({
        domain,
        count: entities.length,
        entities: entities.map(e => e.entity_id)
      })).sort((a, b) => b.count - a.count),
      byArea: Object.entries(byArea).map(([areaId, entities]) => ({
        areaId,
        areaName: areaId === 'unassigned' ? 'Unassigned' : areaMap.get(areaId)?.name || 'Unknown',
        count: entities.length,
        entities: entities.map(e => e.entity_id)
      })).sort((a, b) => b.count - a.count),
      problemEntities: {
        hidden: hiddenEntities.map(e => e.entity_id),
        disabled: disabledEntities.map(e => e.entity_id),
        orphaned: orphanedEntities.map(e => e.entity_id),
        unused: unusedEntities.map(e => e.entity_id)
      }
    };
  }

  async findDuplicateEntities() {
    const entities = await this.ha.getEntityRegistry();
    const nameGroups = {};
    const duplicates = [];

    entities.forEach(entity => {
      const baseName = entity.name || entity.entity_id.split('.')[1];
      if (!nameGroups[baseName]) nameGroups[baseName] = [];
      nameGroups[baseName].push(entity);
    });

    Object.entries(nameGroups).forEach(([name, entities]) => {
      if (entities.length > 1) {
        duplicates.push({
          name,
          count: entities.length,
          entities: entities.map(e => ({
            entity_id: e.entity_id,
            platform: e.platform,
            device_id: e.device_id,
            disabled: !!e.disabled_by
          }))
        });
      }
    });

    return duplicates.sort((a, b) => b.count - a.count);
  }

  async suggestCleanup() {
    const analysis = await this.analyzeEntities();
    const duplicates = await this.findDuplicateEntities();

    const suggestions = [];

    // Suggest hiding diagnostic entities
    const diagnosticPatterns = [
      /.*_battery$/,
      /.*_temperature$/,
      /.*_voltage$/,
      /.*_signal_strength$/,
      /.*_rssi$/,
      /.*_linkquality$/,
      /.*_last_seen$/,
      /.*_update_available$/,
      /.*_restart_required$/
    ];

    analysis.byDomain.forEach(domainGroup => {
      if (['sensor', 'binary_sensor'].includes(domainGroup.domain)) {
        const diagnosticEntities = domainGroup.entities.filter(entityId =>
          diagnosticPatterns.some(pattern => pattern.test(entityId))
        );
        
        if (diagnosticEntities.length > 0) {
          suggestions.push({
            type: 'hide_diagnostic',
            description: `Hide ${diagnosticEntities.length} diagnostic ${domainGroup.domain} entities`,
            entities: diagnosticEntities,
            impact: 'low'
          });
        }
      }
    });

    // Suggest disabling unused integrations
    analysis.byPlatform.forEach(platformGroup => {
      if (platformGroup.count > 50 && platformGroup.platform !== 'homeassistant') {
        suggestions.push({
          type: 'review_platform',
          description: `Review ${platformGroup.platform} platform with ${platformGroup.count} entities`,
          platform: platformGroup.platform,
          entities: platformGroup.entities,
          impact: 'medium'
        });
      }
    });

    // Suggest organizing unassigned entities
    if (analysis.summary.unassignedCount > 10) {
      suggestions.push({
        type: 'organize_areas',
        description: `Organize ${analysis.summary.unassignedCount} unassigned entities into areas`,
        entities: analysis.byArea.find(a => a.areaId === 'unassigned')?.entities || [],
        impact: 'high'
      });
    }

    return {
      analysis,
      duplicates,
      suggestions: suggestions.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
    };
  }
}

// MCP Server Setup and Tool Definitions
const haBaseUrl = process.env.HA_BASE_URL;
const haAccessToken = process.env.HA_ACCESS_TOKEN;

if (!haBaseUrl || !haAccessToken) {
  throw new Error('Environment variables HA_BASE_URL and HA_ACCESS_TOKEN must be set');
}

const haAPI = new HomeAssistantAPI(haBaseUrl, haAccessToken);
const analyzer = new HAAnalyzer(haAPI);

// Define MCP tools
const tools = {
  listTools: {
    schema: ListToolsRequestSchema,
    handler: async () => {
      return Object.keys(tools).map(name => ({ name }));
    },
  },

  callTool: {
    schema: CallToolRequestSchema,
    handler: async ({ toolName, params }) => {
      switch (toolName) {
        case 'analyzeEntities':
          return await analyzer.analyzeEntities();
        case 'findDuplicateEntities':
          return await analyzer.findDuplicateEntities();
        case 'suggestCleanup':
          return await analyzer.suggestCleanup();
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    },
  },
};

// Create and start the MCP server
const server = new Server({
  transport: new StdioServerTransport(),
  tools,
});

server.start().catch(err => {
  console.error('MCP Server failed to start:', err);
  process.exit(1);
});
