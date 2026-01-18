#!/usr/bin/env node
/**
 * Validate pre-commit: Run lint, format check, and build
 */

const { execSync } = require('child_process');

try {
  console.log('🔨 Building...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('\n🔍 Linting...');
  execSync('npm run lint', { stdio: 'inherit' });

  console.log('\n📝 Checking format...');
  execSync('npm run format:check', { stdio: 'inherit' });

  console.log('\n✅ Pre-commit validation passed!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Pre-commit validation failed!');
  process.exit(1);
}
