#!/usr/bin/env node
/**
 * Clean build artifacts and dependencies
 */

const fs = require('fs');
const path = require('path');

const dirs = ['dist', 'build', 'coverage', 'node_modules'];

function deleteRecursiveSync(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        deleteRecursiveSync(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dir);
    console.log(`Deleted: ${dir}`);
  }
}

dirs.forEach((dir) => {
  deleteRecursiveSync(path.join(__dirname, '..', dir));
});

// Clean workspace packages
const packagesDir = path.join(__dirname, '..', 'packages');
fs.readdirSync(packagesDir).forEach((pkg) => {
  const pkgPath = path.join(packagesDir, pkg);
  ['dist', 'coverage'].forEach((subdir) => {
    deleteRecursiveSync(path.join(pkgPath, subdir));
  });
});

console.log('Clean complete!');
