import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zipSync, strToU8 } from 'fflate';

const __dirname = process.cwd();

const iconFile = path.join(__dirname, 'icon.png');
const pluginJSON = path.join(__dirname, 'plugin.json');
const distFolder = path.join(__dirname, 'dist');

if (!fs.existsSync(pluginJSON)) {
  console.error('plugin.json not found');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(pluginJSON, 'utf8'));
let readmeDotMd = json.readme ? path.join(__dirname, json.readme) : null;
let changelogDotMd = json.changelogs ? path.join(__dirname, json.changelogs) : null;

if (!json.readme) {
  readmeDotMd = path.join(__dirname, 'readme.md');
  if (!fs.existsSync(readmeDotMd)) {
    readmeDotMd = path.join(__dirname, 'README.md');
  }
}

if (!json.changelogs) {
  const possibleChangelogs = [
    path.join(__dirname, 'CHANGELOG.md'),
    path.join(__dirname, 'changelog.md')
  ];
  for (const file of possibleChangelogs) {
    if (fs.existsSync(file)) {
      changelogDotMd = file;
      break;
    }
  }
}

// Data structure for fflate
// fflate.zipSync takes an object where keys are paths and values are Uint8Arrays or [Uint8Array, options]
const zipData = {};

// Add root files
if (fs.existsSync(iconFile)) {
  zipData['icon.png'] = [fs.readFileSync(iconFile), { level: 9 }];
}

zipData['plugin.json'] = [fs.readFileSync(pluginJSON), { level: 9 }];

if (readmeDotMd && fs.existsSync(readmeDotMd)) {
  zipData['readme.md'] = [fs.readFileSync(readmeDotMd), { level: 9 }];
}

if (changelogDotMd && fs.existsSync(changelogDotMd)) {
  zipData['changelog.md'] = [fs.readFileSync(changelogDotMd), { level: 9 }];
}

/**
 * Recursively load files into the zipData object
 * @param {string} root Relative path within the zip
 * @param {string} folder Absolute path on disk
 */
function loadFile(root, folder) {
  if (!fs.existsSync(folder)) return;

  const distFiles = fs.readdirSync(folder);
  distFiles.forEach((file) => {
    const fullPath = path.join(folder, file);
    const relativePath = path.join(root, file).replace(/\\/g, '/'); // Ensure forward slashes for zip
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // fflate creates folders implicitly, but we can add an empty entry if needed
      // zipData[relativePath + '/'] = new Uint8Array(0); 
      loadFile(relativePath, fullPath);
      return;
    }

    if (!/LICENSE.txt/.test(file)) {
      zipData[relativePath] = [fs.readFileSync(fullPath), { level: 9 }];
    }
  });
}

// Load the dist folder
if (fs.existsSync(distFolder)) {
  loadFile('', distFolder);
}

loadFile('icons', 'icons')

try {
  // Generate the zip buffer with level 9 compression (maximum)
  const zipped = zipSync(zipData, { level: 9 });

  fs.writeFileSync(path.join(__dirname, 'plugin.zip'), zipped);
  console.log('Plugin plugin.zip written using fflate (high compression).');
} catch (err) {
  console.error('Error creating zip:', err);
}