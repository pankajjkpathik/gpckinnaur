import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let transformed = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Remove the accidental wrapper div
    if (trimmed === '<div className="attendance-reports-wrapper space-y-4">') {
        transformed++;
        continue;
    }
    
    // Fix the misplaced </div> and handle the balanced return
    if (i >= 1205 && i <= 1209 && trimmed === '</div>') {
        // Only skip if it's the one before the </div> that belongs to the Card/View
        if (lines[i+1]?.trim() === ')}' || lines[i+1]?.trim() === '</Card>') {
             transformed++;
             continue;
        }
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log(`Cleaned up AttendanceReportsView. Removed ${transformed} nodes.`);
