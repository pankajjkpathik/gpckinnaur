import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let transformed = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Convert generic fragments to explicit containers if they are top-level component returns
    if (trimmed === '<>') {
        newLines.push(line.replace('<>', '<div className="fragment-replacement">'));
        transformed++;
        continue;
    }
    if (trimmed === '</>') {
        newLines.push(line.replace('</>', '</div>'));
        transformed++;
        continue;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log(`Transformed ${transformed} generic fragment markers.`);
