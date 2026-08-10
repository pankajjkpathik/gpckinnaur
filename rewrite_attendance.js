import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/routes/hod.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // The AttendanceReportsView starts at 1093. 
  // We saw the header at 1115-1117 and return at 1119.
  
  // Let's re-write the return of AttendanceReportsView completely to ensure balance.
  if (line.includes('function AttendanceReportsView')) {
      newLines.push(line);
      // Skip until the end of the function
      let foundEnd = false;
      let j = i + 1;
      while (j < lines.length && !foundEnd) {
          if (lines[j].includes('/* -- SESSIONAL REPORTS')) {
              foundEnd = true;
              i = j - 1; // back up so the loop picks it up
          }
          j++;
      }
      
      // Inject a clean version of AttendanceReportsView
      newLines.push(`  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const semesterAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  }, []);
  const [branch, setBranch] = useState(defaultBranch);
  const [sem, setSem] = useState<number | "">( "");
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const q = useQuery({
    enabled: !!branch && !!sem,
    queryKey: ["hod-mon", branch, sem, from, to],
    queryFn: () => deptClassAttendance({ data: { branch, semester: Number(sem), from_date: from, to_date: to } }),
  });
  const rows = (q.data ?? []).map((s: any) => [s.enrollment_no, s.name, s.present, s.total, \`\${s.pct}%\`]);
  const header = ["Enrollment", "Name", "Present", "Total", "Percentage"];
  const fileBase = \`class_attendance_\${branch}_S\${sem}\`;
  const title = \`Class Attendance -- \${branch}-Sem\${sem}\`;

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Attendance Reports</h1>
        <p className="text-xs text-gray-400 mb-4">Filter by branch + semester. Use quick ranges for monthly / semester view.</p>
        <div className="grid sm:grid-cols-4 gap-2 text-sm mb-2">
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded px-3 py-2 bg-white">
            <option value="">-- Branch --</option>
            <option value="civil">Civil Engineering</option>
            <option value="mechanical">Mechanical Engineering</option>
          </select>
          <select
            value={sem}
            onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")}
            className="border rounded px-3 py-2 bg-white"
          >
            <option value="">-- Semester --</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-3 py-2" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <div className="flex gap-2 mb-3 text-xs">
          <button onClick={() => { setFrom(monthAgo); setTo(today); }} className="border rounded px-2 py-1 hover:bg-gray-50">📅 This Month</button>
          <button onClick={() => { setFrom(semesterAgo); setTo(today); }} className="border rounded px-2 py-1 hover:bg-gray-50">📚 This Semester</button>
        </div>

        {rows.length > 0 && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => exportPDF(fileBase, title, \`\${from} to \${to}\`, header, rows)}
              className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded"
            >
              PDF
            </button>
            <button
              onClick={() => exportExcel(fileBase, "Attendance", header, rows)}
              className="text-xs bg-green-700 text-white px-3 py-1.5 rounded"
            >
              Excel
            </button>
            <button
              onClick={() => exportCSV(fileBase, header, rows)}
              className="text-xs bg-gray-100 px-3 py-1.5 rounded"
            >
              CSV
            </button>
          </div>
        )}
        {q.data && (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {header.map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pct = q.data![i].pct;
                  return (
                    <tr key={i} className={\`border-t \${pct < 75 ? "bg-rose-50" : ""}\`}>
                      {r.map((c, j) => (
                        <td key={j} className="px-4 py-3">
                          {c}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Select a branch and semester to view attendance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}`);
      continue;
  }
  
  newLines.push(line);
}

writeFileSync('src/routes/hod.tsx', newLines.join('\n'));
console.log('Cleaned up AttendanceReportsView structure.');
