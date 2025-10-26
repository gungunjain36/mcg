#!/usr/bin/env node

/**
 * Sync Market Contract Addresses to Indexer Config
 * 
 * This script fetches all market addresses from the MarketFactory contract
 * and updates the config.yaml to track them for indexing.
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const FACTORY_ADDRESS = '0x25A57013bc5139E3FCb06189592652Cd146aecA5';
const RPC_URL = 'https://sepolia.base.org'; // Base Sepolia RPC
const NETWORK_ID = 84532; // Base Sepolia

// Minimal ABI for getAllMarkets
const FACTORY_ABI = [
  'function getAllMarkets() view returns (address[])'
];

async function getAllMarketAddresses() {
  console.log('🔍 Connecting to Base Sepolia...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  console.log(`📡 Querying MarketFactory at ${FACTORY_ADDRESS}...`);
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  
  try {
    const markets = await factory.getAllMarkets();
    console.log(`✅ Found ${markets.length} market contracts`);
    return markets.map(addr => addr.toLowerCase());
  } catch (error) {
    console.error('❌ Error fetching markets:', error.message);
    throw error;
  }
}

function updateConfigYaml(marketAddresses) {
  const configPath = path.join(__dirname, '..', 'config.yaml');
  console.log(`📝 Reading config from ${configPath}...`);
  
  let config = fs.readFileSync(configPath, 'utf8');
  
  // Find the Base Sepolia network section
  const networkRegex = /- id: 84532[\s\S]*?(?=- id:|$)/;
  const networkMatch = config.match(networkRegex);
  
  if (!networkMatch) {
    console.error('❌ Could not find Base Sepolia network (id: 84532) in config');
    return false;
  }
  
  const networkSection = networkMatch[0];
  
  // Check if Market section exists
  if (!networkSection.includes('- name: Market')) {
    console.error('❌ Market contract not found in Base Sepolia config');
    return false;
  }
  
  // Build address block
  const addressBlock = marketAddresses.length > 0
    ? `address:\n${marketAddresses.map(addr => `          - ${addr}`).join('\n')}`
    : '# No markets created yet';
  
  // Replace or add addresses in Market section
  let updatedNetwork = networkSection;
  
  // Find Market section and add/update addresses
  const marketSectionRegex = /(- name: Market\s*\n(?:[\s\S]*?)(?=- name:|networks:|$))/;
  const marketMatch = updatedNetwork.match(marketSectionRegex);
  
  if (marketMatch) {
    let marketSection = marketMatch[0];
    
    // Remove old address block if exists
    marketSection = marketSection.replace(/address:[\s\S]*?(?=\n        #|\n      -|\n\n|$)/, '');
    
    // Remove comment about adding addresses
    marketSection = marketSection.replace(/# NOTE:[\s\S]*?# You must add each new market address here and restart the indexer\n/g, '');
    
    // Add new address block after "- name: Market"
    marketSection = marketSection.replace(
      /(- name: Market\s*\n)/,
      `$1        ${addressBlock}\n`
    );
    
    updatedNetwork = updatedNetwork.replace(marketSectionRegex, marketSection);
  }
  
  // Replace in full config
  config = config.replace(networkRegex, updatedNetwork);
  
  // Write back
  fs.writeFileSync(configPath, config);
  console.log('✅ Config updated successfully!');
  
  return true;
}

async function main() {
  console.log('🚀 Starting Market Address Sync...\n');
  
  try {
    const marketAddresses = await getAllMarketAddresses();
    
    if (marketAddresses.length === 0) {
      console.log('⚠️  No markets found. Create a market first!');
      console.log('   Then run this script again.\n');
      process.exit(0);
    }
    
    console.log('\n📋 Market Addresses:');
    marketAddresses.forEach((addr, i) => {
      console.log(`   ${i + 1}. ${addr}`);
    });
    console.log();
    
    const success = updateConfigYaml(marketAddresses);
    
    if (success) {
      console.log('✅ All done!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run: pnpm codegen');
      console.log('   2. Run: TUI_OFF=true pnpm dev');
      console.log('   3. Wait for indexer to sync');
      console.log('   4. Refresh your Portfolio page\n');
    } else {
      console.log('❌ Failed to update config');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

