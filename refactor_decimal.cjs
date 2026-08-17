const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'backend', 'src', 'entities');

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const newContent = content.replace(/precision:\s*15,\s*scale:\s*2/g, 'precision: 14, scale: 2');

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated precision in ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Precision replacement complete.');
