const fs = require('fs');
const path = require('path');

const workspaceRoot = path.join(__dirname, '..');
const srcDir = path.join(__dirname, 'testfile-src');
const resultDir = path.join(__dirname, 'testfile-result');
const formatterPath = path.join(workspaceRoot, 'out', 'formatter.js');

let formatter;
try {
    formatter = require(formatterPath);
} catch (error) {
    console.error('Cannot load formatter. Run "npm run compile" first.');
    console.error(`Expected: ${formatterPath}`);
    process.exit(1);
}

if (!fs.existsSync(srcDir)) {
    console.error(`Missing source folder: ${srcDir}`);
    process.exit(1);
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function collectFiles(dirPath, fileList = []) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            collectFiles(fullPath, fileList);
        } else if (entry.isFile()) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

function formatFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.compute' && ext !== '.shader') {
        return;
    }

    const relativePath = path.relative(srcDir, filePath);
    const outputPath = path.join(resultDir, relativePath);
    const inputText = fs.readFileSync(filePath, 'utf8');
    const formattedText = ext === '.compute'
        ? formatter.formatUnityComputeShader(inputText)
        : formatter.formatUnityShaderlabShader(inputText);

    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, formattedText, 'utf8');
    console.log(`Formatted: ${relativePath}`);
}

ensureDir(resultDir);

const files = collectFiles(srcDir);
if (files.length === 0) {
    console.warn('No files found in testfile-src.');
    process.exit(0);
}

files.forEach(formatFile);
console.log('Done.');
