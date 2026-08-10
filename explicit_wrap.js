import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let transformed = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Replace the specific problematic Return in AttendanceReportsView
    if (i >= 1115 && i <= 1125 && trimmed === 'return (') {
        newLines.push('  return (');
        newLines.push('    <div className="attendance-reports-wrapper space-y-4">');
        transformed++;
        continue;
    }
    
    // Replace its closing tag
    if (i >= 1205 && i <= 1215 && trimmed === '</div>' && lines[i+1]?.trim() === ');') {
        newLines.push('    </div>');
        newLines.push('  );');
        i++; // skip next line ');'
        transformed++;
        continue;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log(`Explicitly wrapped AttendanceReportsView. Transformed ${transformed} points.`);
