import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Inbox, Mail, User, Users, Search } from "lucide-react";
import { inbox, sent, sendMessage, markRead, contacts } from "@/lib/messages.functions";

type View = "inbox" | "sent" | "compose";

export default function MessagesTab({ readOnly = false }: { readOnly?: boolean }) {
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

  return (
    <div className="space-y-3">
      <div className="flex gap-2 border-b">
        {([
          ["inbox", "Inbox", Inbox],
          ["sent", "Sent", Mail],
          ["compose", "Compose", Send],
        ] as [View, string, any][]).map(([k, l, Icon]) => (
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
        <MessageList loading={inboxQ.isLoading} items={inboxQ.data?.items ?? []} who="sender" onOpen={(id) => mark.mutate(id)} />
      )}
      {view === "sent" && (
        <MessageList loading={sentQ.isLoading} items={sentQ.data?.items ?? []} who="recipient" />
      )}
      {view === "compose" && (
        <ComposeForm disabled={readOnly} onSent={() => { setView("sent"); qc.invalidateQueries({ queryKey: ["msg-sent"] }); }} />
      )}
    </div>
  );
}

function MessageList({ items, who, loading, onOpen }: { items: any[]; who: "sender" | "recipient"; loading?: boolean; onOpen?: (id: number) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!items.length) return <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No messages.</p>;
  return (
    <ul className="bg-white border rounded divide-y">
      {items.map((m) => {
        const name = who === "sender" ? m.sender_name : m.recipient_name;
        const meta = who === "sender" ? m.sender_meta : m.recipient_meta;
        const kindLabel = (who === "sender" ? m.sender_kind : m.recipient_kind) === "staff" ? "Staff" : "Student";
        const unread = who === "sender" && !m.read_at;
        return (
          <li key={m.id}>
            <button
              onClick={() => { setOpen(open === m.id ? null : m.id); if (unread && onOpen) onOpen(m.id); }}
              className="w-full text-left px-4 py-3 hover:bg-muted/30 flex items-start gap-3"
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
