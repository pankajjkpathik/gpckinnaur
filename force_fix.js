import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let transformed = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Convert generic fragments to explicit containers if they are top-level component returns
    // HodSidebar (was lines 352-371)
    if (line.trim() === '<>' && (i >= 350 && i <= 360)) {
        newLines.push('    <div className="flex">');
        transformed++;
        continue;
    }
    if (line.trim() === '</>' && (i >= 365 && i <= 375)) {
        newLines.push('    </div>');
        transformed++;
        continue;
    }
    
    // MarksTable (was lines 1439-1617)
    if (line.trim() === '<>' && (i >= 1435 && i <= 1445)) {
        newLines.push('    <div className="space-y-4">');
        transformed++;
        continue;
    }
    if (line.trim() === '</>' && (i >= 1610 && i <= 1625)) {
        newLines.push('    </div>');
        transformed++;
        continue;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log(`Transformed ${transformed} fragment markers.`);
