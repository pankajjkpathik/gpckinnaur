import fs from 'fs';

const content = fs.readFileSync('src/routes/hod.tsx', 'utf8');
const lines = content.split('\n');

const cleaned = [];
let openDivs = 0;
let inComponent = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect double returns in components
  if (line.trim() === 'return (' && i > 0 && lines[i-1].trim() === 'return (') {
     continue; 
  }

  cleaned.push(line);
}

fs.writeFileSync('src/routes/hod.tsx', cleaned.join('\n'));
