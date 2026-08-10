import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let skipUntil = -1;

for (let i = 0; i < lines.length; i++) {
    if (i < skipUntil) continue;
    
    // The duplicate starts after line 1210
    if (i === 1210) { // 1211 in 1-indexed
        // Verify it is indeed the start of the duplicate
        if (lines[i].includes('const today = new Date().toISOString()')) {
            console.log('Skipping duplicate code starting at line', i+1);
            skipUntil = 1327; // The next function starts at 1330 (1-indexed)
            continue;
        }
    }
    newLines.push(lines[i]);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Cleaned up duplicate AttendanceReportsView logic.');
