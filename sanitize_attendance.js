import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let replacedReturn = false;
let replacedClose = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if we already have the duplicate div wrapper from previous run
    if (!replacedReturn && trimmed === '<div className="attendance-reports-wrapper space-y-4">') {
        // Just skip this and look for the internal one
        replacedReturn = true; 
        continue;
    }

    if (trimmed === 'return (' && i > 1110 && i < 1130) {
        newLines.push('  return (');
        replacedReturn = true;
        continue;
    }
    
    if (trimmed === '</div>' && i > 1205 && i < 1215) {
        newLines.push('    </div>');
        replacedClose = true;
        continue;
    }
    
    if (trimmed === ');' && i > 1205 && i < 1215) {
        newLines.push('  );');
        continue;
    }

    // Clean up markers
    if (trimmed === '/* FORCE SPLIT */' || trimmed === '/* SPLIT POINT */' || trimmed === '/* FORCE SPLIT 2 */') {
        continue;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Sanitized AttendanceReportsView structure.');
