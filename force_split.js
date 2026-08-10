import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Line 1093 is currently 'function AttendanceReportsView({ defaultBranch = "", onBack }: { defaultBranch?: string; onBack: () => void }) {'
    if (i === 1092) {
        newLines.push(line);
        newLines.push('/* FORCE SPLIT */');
        continue;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Added FORCE SPLIT before AttendanceReportsView.');
