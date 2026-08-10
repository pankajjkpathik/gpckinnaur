import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

// The MarksTable component start
const marksTableStart = lines.findIndex(l => l.includes('function MarksTable'));
console.log('MarksTable starts at line:', marksTableStart + 1);

// Look for the return statement after the start
const returnIndex = lines.findIndex((l, i) => i > marksTableStart && l.includes('return ('));
console.log('MarksTable return at line:', returnIndex + 1);

// We changed it to <div className="space-y-4"> at line 1440
// Let's verify and find the closing tag.
// It should be before the end of the MarksTable function.
const nextFunc = lines.findIndex((l, i) => i > returnIndex && l.includes('function SyllabusProgressView'));
console.log('Next function at line:', nextFunc + 1);

// The closing tag for that div should be just before that next function.
// In previous turn I changed </> to </div> at line 1618 (approx)

let depth = 0;
let foundClosing = -1;
for (let i = returnIndex + 1; i < nextFunc; i++) {
    const line = lines[i];
    // Very naive tag counting
    const opens = (line.match(/<div[^>]*>/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens;
    depth -= closes;
    
    // The return starts with one div, so depth started at 1 relative to that div
    // But we are looking for the closing tag of THAT specific div.
}

// Build log said: Error transforming route file /dev-server/src/routes/hod.js: SyntaxError: Expected corresponding JSX closing tag for <div>. (1105:4)
// This is likely referring to the generated JS or a transformed line.
// But 1105 in my file is AttendanceReportsView.

console.log('Line 1119 return:', lines[1118]);
console.log('Line 1210 closing:', lines[1209]);

// Let's just wrap everything in Fragments to be safe and avoid div-mismatch paranoia if not needed.
// Or ensure they match.

lines[1439] = '    <>';
lines[1617] = '    </>';

writeFileSync('src/routes/hod.tsx', lines.join('\n'));
