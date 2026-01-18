const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const readline = require('readline');

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function isSemver(value) {
  return /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(value);
}

function getPackages(rootDir) {
  const packagesDir = path.join(rootDir, 'packages');
  if (!fs.existsSync(packagesDir)) return [];

  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesDir, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'package.json')));
}

function readPackageJson(pkgDir) {
  const filePath = path.join(pkgDir, 'package.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return { filePath, data: JSON.parse(raw) };
}

function writePackageJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function runPublish(pkgDir, access) {
  const result = spawnSync('npm', ['publish', `--access=${access}`], {
    cwd: pkgDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`npm publish failed in ${pkgDir}`);
  }
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const packages = getPackages(rootDir);

  if (packages.length === 0) {
    console.log('No packages found under /packages.');
    return;
  }

  const packageInfo = packages.map((pkgDir) => {
    const { data } = readPackageJson(pkgDir);
    return { pkgDir, name: data.name || path.basename(pkgDir), private: !!data.private };
  });

  const available = packageInfo.filter((pkg) => !pkg.private);
  if (available.length === 0) {
    console.log('No publishable (non-private) packages found.');
    return;
  }

  console.log('Packages:');
  for (const pkg of available) {
    console.log(`- ${pkg.name}`);
  }

  const selection = await prompt(
    'Enter package names to publish (comma-separated) or press Enter for all: ',
  );
  const selectedNames = selection
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  const selected = selectedNames.length
    ? available.filter((pkg) => selectedNames.includes(pkg.name))
    : available;

  if (selected.length === 0) {
    console.log('No matching packages selected. Aborting.');
    return;
  }

  for (const pkg of selected) {
    const { filePath, data } = readPackageJson(pkg.pkgDir);
    const currentVersion = data.version || '0.0.0';
    const version = await prompt(
      `Enter new version for ${pkg.name} (current ${currentVersion}): `,
    );
    if (!version || !isSemver(version)) {
      console.error(`Invalid version for ${pkg.name}. Aborting.`);
      process.exit(1);
    }
    data.version = version;
    writePackageJson(filePath, data);
  }

  for (const pkg of selected) {
    const answer = await prompt(`Publish ${pkg.name} with access public? (y/N): `);
    if (answer.toLowerCase() !== 'y') {
      console.log(`Skipping ${pkg.name}`);
      continue;
    }

    runPublish(pkg.pkgDir, 'public');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
