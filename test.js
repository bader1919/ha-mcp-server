// Simple test script to verify Home Assistant connection
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const HA_BASE_URL = process.env.HA_BASE_URL;
const HA_ACCESS_TOKEN = process.env.HA_ACCESS_TOKEN;

if (!HA_BASE_URL || !HA_ACCESS_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   HA_BASE_URL and HA_ACCESS_TOKEN must be set');
  console.error('   Create a .env file or set environment variables');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔄 Testing Home Assistant connection...');
    console.log(`📍 URL: ${HA_BASE_URL}`);
    
    const response = await fetch(`${HA_BASE_URL}/api/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Connection successful!');
    console.log(`📊 Home Assistant version: ${data.version}`);
    console.log(`🏠 Location: ${data.location_name}`);
    
    // Test entity registry access
    console.log('\n🔄 Testing entity registry access...');
    const entitiesResponse = await fetch(`${HA_BASE_URL}/api/config/entity_registry/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!entitiesResponse.ok) {
      throw new Error(`Entity registry error: ${entitiesResponse.status}`);
    }

    const entities = await entitiesResponse.json();
    console.log(`✅ Entity registry access successful!`);
    console.log(`📈 Total entities: ${entities.length}`);
    
    // Show top platforms
    const platformCounts = {};
    entities.forEach(entity => {
      const platform = entity.platform || 'unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
    
    const topPlatforms = Object.entries(platformCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.log('\n🏆 Top 5 platforms by entity count:');
    topPlatforms.forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} entities`);
    });

    console.log('\n🎉 All tests passed! Your Home Assistant MCP server is ready to use.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check your Home Assistant URL is accessible');
    console.error('   2. Verify your access token is valid');
    console.error('   3. Ensure Home Assistant API is enabled');
    console.error('   4. Check firewall/network settings');
    process.exit(1);
  }
}

testConnection();
