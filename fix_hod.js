import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/routes/hod.tsx', 'utf-8');

// The replacement for MarksTable fragment
content = content.replace(/1440:     <>\n1441:       <div className="border rounded overflow-hidden">/g, '    <div className="space-y-4">\n      <div className="border rounded overflow-hidden">');
// Replaced by line numbers previously, let's just do a clean rewrite of the known broken area.

// I will rewrite the file by parts to be absolutely sure.
const lines = content.split('\n');
console.log("Total lines:", lines.length);

// Fixing line 1440
if (lines[1439].includes('<>')) {
  lines[1439] = lines[1439].replace('<>', '<div className="space-y-4">');
}

// Fixing line 1618 (was 1617)
if (lines[1617].trim() === '</>') {
  lines[1617] = lines[1617].replace('</>', '</div>');
}

// Fixing line 1105 error reported by build:dev (div mismatch)
// Line 1105 is inside AttendanceReportsView
// Let's check 1119 return
console.log("Line 1120:", lines[1119]);

writeFileSync('src/routes/hod.tsx', lines.join('\n'));
