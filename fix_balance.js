import fs from 'fs';

let content = fs.readFileSync('src/routes/hod.tsx', 'utf8');

// 1. Fix double return statements
content = content.replace(/return \(\s*return \(/g, 'return (');

// 2. Fix the component AttendanceReportsView which has 6 opens and 4 closes
// The component is between line 1099 and 1215 approximately.
// The audit shows balance jumps from 10 to 11 at 1123 and ends at 9 at 1212.
// It seems I added extra wrappers earlier that didn't get balanced.

// Let's perform a more surgical replacement for the problematic views to ensure balance.

const components = [
  {
    name: "AttendanceReportsView",
    startMarker: "function AttendanceReportsView",
    endMarker: "/* ─── SESSIONAL REPORTS"
  },
  {
    name: "SessionalReportsView",
    startMarker: "function SessionalReportsView",
    endMarker: "function ProvenanceBadge"
  },
  {
    name: "MarksTable",
    startMarker: "function MarksTable",
    endMarker: "/* ─── SYLLABUS COVERAGE"
  },
  {
    name: "LessonsReviewView",
    startMarker: "function LessonsReviewView",
    endMarker: "// end of file" // Special case
  }
];

// Helper to count balance
function getBalance(text) {
  const opens = (text.match(/<div/g) || []).length;
  const closes = (text.match(/<\/div/g) || []).length;
  return opens - closes;
}

// Check and fix double return and double opening divs at component starts
// I noticed I added:
// return (
//   <div className="space-y-4">
//     <div>
// in several places.

content = content.replace(/<div className="space-y-4">\s*<div>/g, '<div className="space-y-4">');
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>/g, '</div>\n    </div>'); // Basic correction for the triple close I might have introduced

fs.writeFileSync('src/routes/hod.tsx', content);
console.log("Applied surgical balance fixes.");
