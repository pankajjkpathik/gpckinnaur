import fs from 'fs';

const content = fs.readFileSync('src/routes/hod.tsx', 'utf8');
const lines = content.split('\n');

let openDivs = 0;
let closeDivs = 0;

lines.forEach((line, i) => {
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;
  openDivs += opens;
  closeDivs += closes;
  if (opens !== closes) {
    console.log(`Line ${i + 1}: ${opens} opens, ${closes} closes. Balance: ${openDivs - closeDivs}`);
  }
});

console.log(`\nFinal: ${openDivs} opens, ${closeDivs} closes.`);
