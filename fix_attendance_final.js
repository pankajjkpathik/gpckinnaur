import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let replacedReturn = false;
let startReplacing = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('function AttendanceReportsView')) {
        startReplacing = true;
    }

    if (startReplacing && !replacedReturn && trimmed === 'return (') {
        newLines.push('  return (');
        newLines.push('    <div className="space-y-4">');
        replacedReturn = true;
        continue;
    }

    // Handle existing space-y-4 at 1120
    if (replacedReturn && i < 1125 && trimmed === '<div className="space-y-4">') {
        continue;
    }

    if (i >= 1205 && i <= 1210 && trimmed === '</div>') {
        // Look ahead for closure
        if (lines[i+1]?.trim() === ')' || lines[i+1]?.trim() === ');') {
             newLines.push('    </div>');
             continue;
        }
    }
    
    // Stop replacing at function end
    if (startReplacing && trimmed === '}' && i > 1205) {
        startReplacing = false;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Fixed AttendanceReportsView structure.');
