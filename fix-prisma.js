const fs = require('fs');
const path = require('path');

const targetDir = path.join('.next', 'standalone', 'node_modules', '@prisma', 'client-2c3a283f134fdcb6');
const sourceDir = path.join('.next', 'standalone', 'node_modules', '@prisma', 'client');

if (fs.existsSync(targetDir)) {
    console.log('Removing existing target...');
    fs.rmSync(targetDir, { recursive: true, force: true });
}

console.log('Copying directory...');
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log('Done!');
