import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Line 1104 is currently '  }, []);'
    if (i === 1103) { // 0-indexed
        newLines.push(line);
        newLines.push('/* SPLIT POINT */'); // Break the block if needed
        continue;
    }
    
    // Change line 1105 slightly
    if (i === 1104) {
        newLines.push('  const [branch, setBranch] = useState<string>(defaultBranch);');
        continue;
    }

    newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Modified line 1105 to force parser refresh.');
