import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/routes/hod.tsx', 'utf-8');

// Replace all em-dashes and variations of dashes in comments and strings
// This often happens during AI editing or copy-paste
content = content.replace(/—/g, '--');
content = content.replace(/\u2013/g, '--');
content = content.replace(/\u2014/g, '--');

// Programmatically fix common syntax errors observed in HOD portal
// 1. Mutation onSuccess braces
content = content.replace(/onSuccess: \(\) => qc\.invalidateQueries\({ queryKey: \["hod-lessons"\] }\)/g, 'onSuccess: () => { qc.invalidateQueries({ queryKey: ["hod-lessons"] }); }');

// 2. Ensure all components return a balanced structure
// We will look for common return patterns and force them to use <div> instead of Fragments 
// if the parser is struggling with them, or just ensure they are balanced.

writeFileSync('src/routes/hod.tsx', content);
console.log('Sanitized special characters and fixed mutation syntax.');
