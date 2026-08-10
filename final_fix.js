import fs from 'fs';
const content = fs.readFileSync('src/routes/hod.tsx', 'utf8');
const lines = content.split('\n');
const fixed = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  fixed.push(line);
  // Correct the MarksTable balance at the end of its block (around line 1617)
  if (i === 1616 && line.trim() === '</div>' && lines[i+1].trim() === ');') {
      fixed.push('    </div>'); 
  }
}
fs.writeFileSync('src/routes/hod.tsx', fixed.join('\n'));
