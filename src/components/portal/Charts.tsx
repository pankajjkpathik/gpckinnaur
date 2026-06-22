import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

export const CHART_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1"];

export function BarStats({ data, dataKey = "value", height = 220, color = "#0ea5e9", xKey = "label" }: { data: any[]; dataKey?: string; height?: number; color?: string; xKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval={0} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 50 : 30} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieStats({ data, height = 220, nameKey = "label", valueKey = "value" }: { data: any[]; height?: number; nameKey?: string; valueKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} outerRadius={80} label={(d: any) => `${d[nameKey]}: ${d[valueKey]}`}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LineStats({ data, dataKey = "value", height = 220, color = "#10b981", xKey = "label" }: { data: any[]; dataKey?: string; height?: number; color?: string; xKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip wrapperStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AttendanceGauge({ percent, height = 220 }: { percent: number; height?: number }) {
  const data = [
    { label: "Attended", value: Math.max(0, Math.min(100, percent)) },
    { label: "Missed", value: Math.max(0, 100 - percent) },
  ];
  const color = percent >= 75 ? "#10b981" : percent >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={60} outerRadius={85} startAngle={90} endAngle={-270} stroke="none">
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-3xl font-bold" style={{ color }}>{percent}%</p>
        <p className="text-xs text-muted-foreground">Attendance</p>
      </div>
    </div>
  );
}
