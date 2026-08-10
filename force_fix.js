import fs from 'fs';
const content = fs.readFileSync('src/routes/hod.tsx', 'utf8');
const lines = content.split('\n');

const fixed = [];
let openStack = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Basic cleanup of double returns and extra back buttons if present
  if (line.trim() === 'return (' && i > 0 && lines[i-1].trim() === 'return (') continue;
  if (line.trim() === '<BackBtn onClick={onBack} />' && i > 0 && lines[i-1].trim() === '<BackBtn onClick={onBack} />') continue;

  fixed.push(line);
  
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;
  openStack += (opens - closes);

  // Close the final div for components that are returning but have unbalanced stacks
  if (line.trim() === ');' && openStack > 0) {
      // Find where the return ( started
      let j = fixed.length - 2;
      while (j >= 0 && !fixed[j].includes('return (')) j--;
      
      if (j >= 0) {
          // This is a component return block. If stack is positive, close it.
          const returnBlock = fixed.slice(j).join('\n');
          const bOpens = (returnBlock.match(/<div/g) || []).length;
          const bCloses = (returnBlock.match(/<\/div/g) || []).length;
          const diff = bOpens - bCloses;
          if (diff > 0) {
              fixed.splice(fixed.length - 1, 0, '    ' + '</div>'.repeat(diff));
              openStack -= diff;
          }
      }
  }
}

fs.writeFileSync('src/routes/hod.tsx', fixed.join('\n'));
console.log("Forced balance across all component return blocks.");
