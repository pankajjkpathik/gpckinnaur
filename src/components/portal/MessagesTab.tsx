import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Inbox, Mail, User, Users, Search, Trash2, Megaphone, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { inbox, sent, sendMessage, markRead, contacts, broadcastMessage, bulkDeleteMessages } from "@/lib/messages.functions";

type View = "inbox" | "sent" | "compose" | "broadcast";

export default function MessagesTab({ readOnly = false, allowBroadcast = false }: { readOnly?: boolean; allowBroadcast?: boolean }) {
  const [view, setView] = useState<View>("inbox");
  const qc = useQueryClient();
  const inboxQ = useQuery({
    queryKey: ["msg-inbox"], queryFn: () => inbox(), refetchInterval: 30000,
  });
  const sentQ = useQuery({
    queryKey: ["msg-sent"], queryFn: () => sent(), enabled: view === "sent",
  });
  const mark = useMutation({
    mutationFn: (id: number) => markRead({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["msg-inbox"] }),
  });

  const tabs: [View, string, any][] = [
    ["inbox", "Inbox", Inbox],
    ["sent", "Sent", Mail],
    ["compose", "Compose", Send],
  ];
  if (allowBroadcast) tabs.push(["broadcast", "Broadcast", Megaphone]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 border-b flex-wrap">
        {tabs.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setView(k)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px inline-flex items-center gap-2 ${view === k ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground"}`}>
            <Icon className="w-4 h-4" />{l}
            {k === "inbox" && inboxQ.data && (() => {
              const unread = (inboxQ.data.items as any[]).filter((m) => !m.read_at).length;
              return unread > 0 ? <span className="bg-rose-500 text-white text-[10px] rounded-full px-1.5">{unread}</span> : null;
            })()}
          </button>
        ))}
      </div>

      {view === "inbox" && (
        <MessageList scope="inbox" loading={inboxQ.isLoading} items={inboxQ.data?.items ?? []} who="sender" onOpen={(id) => mark.mutate(id)} />
      )}
      {view === "sent" && (
        <MessageList scope="sent" loading={sentQ.isLoading} items={sentQ.data?.items ?? []} who="recipient" />
      )}
      {view === "compose" && (
        <ComposeForm disabled={readOnly} onSent={() => { setView("sent"); qc.invalidateQueries({ queryKey: ["msg-sent"] }); }} />
      )}
      {view === "broadcast" && (
        <BroadcastForm onSent={() => qc.invalidateQueries({ queryKey: ["msg-sent"] })} />
      )}
    </div>
  );
}

function MessageList({ items, who, loading, onOpen, scope }: { items: any[]; who: "sender" | "recipient"; loading?: boolean; onOpen?: (id: number) => void; scope: "inbox" | "sent" }) {
  const [open, setOpen] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteMessages({ data: { ids, scope } }),
    onSuccess: () => { setSelected(new Set()); qc.invalidateQueries({ queryKey: [`msg-${scope}`] }); },
  });
  const toggle = (id: number) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!items.length) return <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No messages.</p>;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs inline-flex items-center gap-1">
          <input type="checkbox" checked={selected.size > 0 && selected.size === items.length} onChange={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map((m) => m.id)))} />
          Select all
        </label>
        {selected.size > 0 && (
          <button onClick={() => { if (confirm(`Delete ${selected.size} message(s) from your ${scope}?`)) del.mutate(Array.from(selected)); }} disabled={del.isPending}
            className="ml-auto text-xs px-3 py-1.5 bg-rose-700 text-white rounded inline-flex items-center gap-1 disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /> {del.isPending ? "Deleting…" : `Delete Selected (${selected.size})`}
          </button>
        )}
      </div>
      <ul className="bg-white border rounded divide-y">
        {items.map((m) => {
          const name = who === "sender" ? m.sender_name : m.recipient_name;
          const meta = who === "sender" ? m.sender_meta : m.recipient_meta;
          const kindLabel = (who === "sender" ? m.sender_kind : m.recipient_kind) === "staff" ? "Staff" : "Student";
          const unread = who === "sender" && !m.read_at;
          return (
            <li key={m.id} className="flex items-start">
              <label className="px-3 py-3"><input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} /></label>
              <button
                onClick={() => { setOpen(open === m.id ? null : m.id); if (unread && onOpen) onOpen(m.id); }}
                className="flex-1 text-left px-2 py-3 hover:bg-muted/30 flex items-start gap-3"
              >
                <span className={`w-2 h-2 mt-2 rounded-full ${unread ? "bg-rose-500" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <strong className={unread ? "font-bold" : "font-medium"}>{name || "Unknown"}</strong>
                    <span className="text-xs text-muted-foreground">· {kindLabel}{meta ? ` · ${meta}` : ""}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className={`text-sm mt-0.5 ${open === m.id ? "whitespace-pre-wrap" : "truncate"} ${unread ? "text-foreground" : "text-muted-foreground"}`}>{m.body}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ComposeForm({ onSent, disabled }: { onSent: () => void; disabled?: boolean }) {
  const [kind, setKind] = useState<"staff" | "student">("staff");
  const [q, setQ] = useState("");
  const [recipient, setRecipient] = useState<{ id: number; label: string } | null>(null);
  const [body, setBody] = useState("");
  const list = useQuery({
    queryKey: ["msg-contacts", kind, q], queryFn: () => contacts({ data: { kind, q: q || undefined } }),
  });
  const send = useMutation({
    mutationFn: () => sendMessage({ data: { recipient_kind: kind, recipient_id: recipient!.id, body } }),
    onSuccess: () => { setBody(""); setRecipient(null); onSent(); },
  });
  return (
    <fieldset disabled={disabled} className={disabled ? "opacity-60" : ""}>
    <div className="bg-white border rounded p-4 space-y-3 max-w-2xl">
      <div className="flex gap-2 items-center text-sm">
        <span className="text-muted-foreground">To:</span>
        <div className="flex border rounded overflow-hidden">
          <button onClick={() => { setKind("staff"); setRecipient(null); }} className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${kind === "staff" ? "bg-primary text-primary-foreground" : "bg-white"}`}><Users className="w-3 h-3" /> Staff</button>
          <button onClick={() => { setKind("student"); setRecipient(null); }} className={`px-3 py-1.5 text-xs inline-flex items-center gap-1 ${kind === "student" ? "bg-primary text-primary-foreground" : "bg-white"}`}><User className="w-3 h-3" /> Student</button>
        </div>
      </div>
      {recipient ? (
        <div className="flex items-center gap-2 bg-muted/40 rounded px-3 py-2 text-sm">
          <span className="font-medium">{recipient.label}</span>
          <button onClick={() => setRecipient(null)} className="ml-auto text-xs text-rose-600 hover:underline">Change</button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 border rounded px-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${kind}…`} className="flex-1 py-1.5 text-sm bg-transparent outline-none" />
          </div>
          <div className="max-h-48 overflow-auto border rounded divide-y">
            {(list.data ?? []).map((c: any) => (
              <button key={c.id} onClick={() => setRecipient(c)} className="w-full text-left px-3 py-2 hover:bg-muted/40 text-sm">
                <div className="font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.sub}</div>
              </button>
            ))}
            {!list.isLoading && (list.data ?? []).length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">No matches.</p>}
          </div>
        </div>
      )}
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={5}
        placeholder="Write your message…"
        className="w-full border rounded p-2 text-sm resize-y"
      />
      <div className="flex justify-end">
        <button
          onClick={() => send.mutate()}
          disabled={!recipient || !body.trim() || send.isPending}
          className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> {send.isPending ? "Sending…" : "Send"}
        </button>
      </div>
      {send.isError && <p className="text-xs text-rose-600">{(send.error as Error).message}</p>}
    </div>
    </fieldset>
  );
}

const BROADCAST_SAMPLE = [
  { kind: "staff", identifier: "prof.sharma" },
  { kind: "student", identifier: "GPK202401" },
];

function BroadcastForm({ onSent }: { onSent: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [recipients, setRecipients] = useState<{ kind: "staff" | "student"; identifier: string }[]>([]);
  const [body, setBody] = useState("");
  const [result, setResult] = useState<{ inserted: number; errors: any[] } | null>(null);

  const send = useMutation({
    mutationFn: () => broadcastMessage({ data: { recipients, body } }),
    onSuccess: (r) => { setResult(r as any); setBody(""); setRecipients([]); onSent(); },
  });

  const downloadSample = () => {
    const ws = XLSX.utils.json_to_sheet(BROADCAST_SAMPLE);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recipients");
    XLSX.writeFile(wb, "broadcast-recipients-sample.xlsx");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf);
    const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const parsed = rows
      .map((r) => ({
        kind: String(r.kind ?? r.Kind ?? "").trim().toLowerCase(),
        identifier: String(r.identifier ?? r.username ?? r.enrollment_no ?? r.Identifier ?? "").trim(),
      }))
      .filter((r) => (r.kind === "staff" || r.kind === "student") && r.identifier) as any;
    setRecipients(parsed);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-white border rounded p-4 space-y-3 max-w-3xl">
      <div className="flex items-center gap-2 flex-wrap">
        <Megaphone className="w-4 h-4 text-rose-700" />
        <strong className="text-sm">Bulk Broadcast</strong>
        <span className="text-xs text-muted-foreground">Upload Excel: columns <code>kind</code> (staff|student), <code>identifier</code> (username or enrollment_no)</span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={downloadSample} className="px-3 py-1.5 border rounded text-xs inline-flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Sample.xlsx
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Upload Recipients
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
        </div>
      </div>

      {recipients.length > 0 && (
        <div className="text-xs text-muted-foreground bg-secondary/40 rounded p-2">
          {recipients.length} recipient(s) loaded · {recipients.filter((r) => r.kind === "staff").length} staff · {recipients.filter((r) => r.kind === "student").length} students
          <button onClick={() => setRecipients([])} className="ml-2 text-rose-600 hover:underline">clear</button>
        </div>
      )}

      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={6}
        placeholder="Message body (will be sent individually to each recipient)…"
        className="w-full border rounded p-2 text-sm resize-y"
      />
      <div className="flex items-center justify-between">
        {result && <span className="text-xs text-muted-foreground">✓ {result.inserted} sent{result.errors.length ? ` · ${result.errors.length} unresolved` : ""}</span>}
        <button
          onClick={() => send.mutate()}
          disabled={recipients.length === 0 || !body.trim() || send.isPending}
          className="ml-auto bg-rose-700 text-white text-sm px-4 py-2 rounded inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> {send.isPending ? "Broadcasting…" : `Broadcast to ${recipients.length}`}
        </button>
      </div>
      {send.isError && <p className="text-xs text-rose-600">{(send.error as Error).message}</p>}
    </div>
  );
}
