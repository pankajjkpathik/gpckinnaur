import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

function countTags(lines, start, end) {
    let divStack = 0;
    let fragmentStack = 0;
    for (let i = start; i < end; i++) {
        const line = lines[i];
        // Match <div> but not </div>
        const divOpens = (line.match(/<div(?![^>]*\/)(?![^>]*>.*<\/div>)[^>]*>/g) || []).length;
        const divCloses = (line.match(/<\/div>/g) || []).length;
        // Simple fragment match
        const fragOpens = (line.match(/<>/g) || []).length;
        const fragCloses = (line.match(/<\/>/g) || []).length;
        
        divStack += divOpens - divCloses;
        fragmentStack += fragOpens - fragCloses;
        
        if (divStack < 0 || fragmentStack < 0) {
            console.log(`Mismatch at line ${i+1}: divs=${divStack}, frags=${fragmentStack}`);
            console.log(`Line content: ${line}`);
        }
    }
    return { divs: divStack, frags: fragmentStack };
}

const componentStarts = lines.map((l, i) => l.startsWith('function ') ? i : -1).filter(i => i !== -1);
componentStarts.forEach((start, idx) => {
    const end = idx < componentStarts.length - 1 ? componentStarts[idx + 1] : lines.length;
    const name = lines[start].split(' ')[1].split('(')[0];
    const balance = countTags(lines, start, end);
    if (balance.divs !== 0 || balance.frags !== 0) {
        console.log(`Component ${name} (lines ${start+1}-${end}) is unbalanced:`, balance);
    }
});
