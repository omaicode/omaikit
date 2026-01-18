#!/usr/bin/env node
/**
 * Rebuild: Clean and build all packages
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧹 Cleaning build artifacts...');
execSync('node scripts/clean.js', { stdio: 'inherit' });

console.log('\n📦 Building all packages...');
execSync('npm run build', { stdio: 'inherit' });

console.log('\n✅ Rebuild complete!');
