#!/usr/bin/env node
/**
 * Validate pre-push: Run all checks + tests
 */

const { execSync } = require('child_process');

try {
  console.log('🔨 Building...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('\n🔍 Linting...');
  execSync('npm run lint', { stdio: 'inherit' });

  console.log('\n📝 Checking format...');
  execSync('npm run format:check', { stdio: 'inherit' });

  console.log('\n🧪 Running tests...');
  execSync('npm test', { stdio: 'inherit' });

  console.log('\n✅ Pre-push validation passed!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Pre-push validation failed!');
  process.exit(1);
}
