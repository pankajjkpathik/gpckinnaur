import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Convert problematic fragment returns to explicit divs or fixed Fragments
    // HodSidebar: 352-371
    if (i === 351 && line.trim() === '<>') {
        newLines.push('    <div className="flex">'); // Changed from flex w-full to just flex
        continue;
    }
    if (i === 370 && line.trim() === '</>') {
        newLines.push('    </div>');
        continue;
    }
    
    // MarksTable: 1439-1617
    if (i === 1438 && line.trim() === '<>') {
        newLines.push('    <div className="space-y-4">');
        continue;
    }
    if (i === 1616 && line.trim() === '</>') {
        newLines.push('    </div>');
        continue;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Replaced top-level Fragments with divs in HodSidebar and MarksTable.');
