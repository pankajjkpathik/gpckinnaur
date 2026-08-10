import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let replacedReturn = false;
let foundStart = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('function AttendanceReportsView')) {
        foundStart = true;
    }

    if (foundStart && !replacedReturn && trimmed === 'return (') {
        newLines.push('  return (');
        newLines.push('    <div className="space-y-4">');
        replacedReturn = true;
        continue;
    }

    // Handle existing space-y-4 at line 1120
    if (replacedReturn && i < 1125 && trimmed === '<div className="space-y-4">') {
        continue;
    }

    if (foundStart && i >= 1205 && i <= 1210 && trimmed === '</div>') {
        // Look ahead for closure
        if (lines[i+1]?.trim() === ')' || lines[i+1]?.trim() === ');') {
             newLines.push('    </div>');
             continue;
        }
    }
    
    if (foundStart && trimmed === '}' && i > 1205) {
        foundStart = false;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Fixed AttendanceReportsView structure.');
