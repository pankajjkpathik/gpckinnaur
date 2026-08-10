import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let replacedReturn = false;
let foundStart = false;
let skipCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // AttendanceReportsView signature at 1093
    if (trimmed.startsWith('function AttendanceReportsView')) {
        foundStart = true;
    }

    if (foundStart && !replacedReturn && trimmed === 'return (') {
        newLines.push('  return (');
        newLines.push('    <div className="space-y-4">');
        replacedReturn = true;
        continue;
    }

    // Handle existing nested space-y-4 div that might be orphaned or duplicated
    if (replacedReturn && skipCount === 0 && trimmed === '<div className="space-y-4">') {
        // Skip it, we already added it correctly
        continue;
    }

    if (i >= 1205 && i <= 1210 && trimmed === '</div>') {
        // Look for the correct closing place
        if (lines[i+1]?.trim() === ')' || lines[i+1]?.trim() === ');') {
             // This is the closing of our outer div
             newLines.push('    </div>');
             continue;
        }
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Normalized AttendanceReportsView.');
