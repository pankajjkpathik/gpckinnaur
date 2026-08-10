import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect the double return
  if (i > 0 && lines[i-1].trim() === 'return (' && line.trim() === 'return (') {
      console.log('Detected duplicate return at line', i+1);
      continue;
  }
  
  newLines.push(line);
}

// Also let's fix the Card depth issue if it exists
// Looking at the output earlier:
// Mismatch at line 87: divs=-1, frags=0
// Line content:   return <div className={`bg-white border rounded-lg shadow-sm p-5 ${className}`}>{children}</div>;
// This was actually a false positive from the countTags script because it was on one line.

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Removed duplicate return statement.');
