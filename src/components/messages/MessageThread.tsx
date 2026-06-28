import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import { FileAsset, FILE_CATEGORIES, getSignedUrl } from "@/lib/files";
import { FileIcon } from "@/components/files/FileIcon";
import { Send, Paperclip, X, Download, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 30;

interface MessageRow {
  id: string;
  thread_id: string;
  project_id: string;
  sender_id: string;
  body: string;
  attachment_file_id: string | null;
  created_at: string;
  sender: { full_name: string | null; role: string } | null;
  attachment: FileAsset | null;
}

interface Props {
  projectId: string;
  currentUserId: string;
  currentUserRole: string; // "ADMIN" | "STAFF" | "CLIENT"
}

function roleBadgeClass(role: string) {
  if (role === "ADMIN") return "bg-red-500/15 text-red-400";
  if (role === "STAFF") return "bg-[#1a365d]/15 text-[#1a365d]";
  return "bg-portal-accent/15 text-portal-accent";
}

export function MessageThread({ projectId, currentUserId, currentUserRole }: Props) {
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // Attachment picker
  const [showPicker, setShowPicker] = useState(false);
  const [projectFiles, setProjectFiles] = useState<FileAsset[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileAsset | null>(null);

  // Ensure thread exists, return threadId
  const ensureThread = useCallback(async (): Promise<string | null> => {
    // Try to get existing
    const { data: existing } = await supabase
      .from("message_threads")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();
    if (existing) return existing.id;

    // Create new
    const { data: created, error } = await supabase
      .from("message_threads")
      .insert({ project_id: projectId })
      .select("id")
      .single();
    if (error || !created) {
      console.error("Thread create error:", error?.message ?? "no row returned");
      return null;
    }
    return created.id;
  }, [projectId]);

  const fetchMessages = useCallback(async (tid: string, off = 0, append = false) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:sender_id(full_name, role), attachment:attachment_file_id(*)")
      .eq("thread_id", tid)
      .order("created_at", { ascending: false })
      .range(off, off + PAGE_SIZE - 1);

    if (error) {
      toast({ title: "Error loading messages", description: error.message, variant: "destructive" });
      return;
    }

    const rows = ((data as unknown as MessageRow[]) ?? []).reverse();
    if (append) {
      setMessages((prev) => [...rows, ...prev]);
    } else {
      setMessages(rows);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setHasMore((data?.length ?? 0) === PAGE_SIZE);
    setOffset(off + PAGE_SIZE);
  }, [toast]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      setLoading(true);
      const tid = await ensureThread();
      if (!tid) { setLoading(false); return; }
      setThreadId(tid);
      await fetchMessages(tid, 0, false);
      setLoading(false);

      // Realtime subscription
      channel = supabase
        .channel(`messages:${tid}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${tid}` },
          async () => { await fetchMessages(tid, 0, false); }
        )
        .subscribe();
    };

    init();
    return () => { channel && supabase.removeChannel(channel); };
  }, [projectId, ensureThread, fetchMessages]);

  const loadMore = async () => {
    if (!threadId) return;
    setLoadingMore(true);
    await fetchMessages(threadId, offset, true);
    setLoadingMore(false);
  };

  const loadProjectFiles = async () => {
    setLoadingFiles(true);
    const { data } = await supabase
      .from("file_assets")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    setProjectFiles((data as unknown as FileAsset[]) ?? []);
    setLoadingFiles(false);
  };

  const togglePicker = () => {
    if (!showPicker) loadProjectFiles();
    setShowPicker((v) => !v);
  };

  const handleSend = async () => {
    if (!body.trim() && !attachedFile) return;
    if (!threadId) return;
    setSending(true);

    const { data: sent, error } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        project_id: projectId,
        sender_id: currentUserId,
        body: body.trim() || (attachedFile ? `[Attached: ${attachedFile.original_name}]` : ""),
        attachment_file_id: attachedFile?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      await writeAuditLog({
        actor_id: currentUserId,
        action: "message_sent",
        entity_type: "message",
        entity_id: sent?.id,
        metadata: { project_id: projectId },
      });
      setBody("");
      setAttachedFile(null);
      setShowPicker(false);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-portal-text-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={loadingMore}
              onClick={loadMore}
              className="text-xs border-portal-border text-portal-text-muted"
            >
              {loadingMore
                ? <Loader2 size={12} className="animate-spin mr-1.5" />
                : <ChevronDown size={12} className="mr-1.5" />}
              Load earlier messages
            </Button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-medium text-portal-text">No messages yet</p>
            <p className="mt-1 text-sm text-portal-text-muted">Start the conversation below.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const role = msg.sender?.role ?? "CLIENT";
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-portal-accent/20 text-portal-accent text-xs font-semibold">
                {(msg.sender?.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
              {/* Bubble */}
              <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs font-semibold text-portal-text">
                    {isMe ? "You" : (msg.sender?.full_name ?? "Unknown")}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${roleBadgeClass(role)}`}>
                    {role}
                  </span>
                  <span className="text-[10px] text-portal-text-muted">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                  isMe
                    ? "bg-portal-accent text-portal-accent-foreground rounded-tr-sm"
                    : "bg-portal-bg border border-portal-border text-portal-text rounded-tl-sm"
                }`}>
                  {msg.body}
                </div>
                {/* Attachment chip */}
                {msg.attachment && (
                  <AttachmentChip file={msg.attachment} />
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Attachment picker */}
      {showPicker && (
        <div className="border-t border-portal-border bg-portal-bg max-h-48 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-portal-text-muted border-b border-portal-border">
            Select a project file
          </div>
          {loadingFiles ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-portal-text-muted" />
            </div>
          ) : projectFiles.length === 0 ? (
            <p className="px-4 py-4 text-sm text-portal-text-muted">No files uploaded to this project yet.</p>
          ) : (
            projectFiles.map((f) => (
              <button
                key={f.id}
                onClick={() => { setAttachedFile(f); setShowPicker(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-portal-surface transition-colors text-left"
              >
                <FileIcon ext={f.extension ?? ""} size={14} className="text-portal-text-muted shrink-0" />
                <span className="text-sm text-portal-text truncate">{f.original_name}</span>
                <span className="ml-auto text-xs text-portal-text-muted shrink-0 capitalize">{f.category}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Attached file chip in composer */}
      {attachedFile && (
        <div className="px-4 pt-2 flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-portal-border bg-portal-bg px-3 py-1.5 text-xs">
            <FileIcon ext={attachedFile.extension ?? ""} size={12} className="text-portal-text-muted" />
            <span className="text-portal-text truncate max-w-[200px]">{attachedFile.original_name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-portal-text-muted hover:text-destructive">
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-portal-border p-4 flex items-end gap-3 bg-portal-bg">
        <button
          onClick={togglePicker}
          title="Attach project file"
          className={`rounded-lg p-2 transition-colors ${
            showPicker
              ? "bg-portal-accent/15 text-portal-accent"
              : "text-portal-text-muted hover:bg-portal-surface hover:text-portal-text"
          }`}
        >
          <Paperclip size={16} />
        </button>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Write a message… (Ctrl+Enter to send)"
          className="flex-1 resize-none rounded-xl border border-portal-border bg-portal-surface px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted focus:outline-none focus:border-portal-accent transition-colors"
        />
        <Button
          onClick={handleSend}
          disabled={sending || (!body.trim() && !attachedFile)}
          className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90 rounded-xl px-4"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </Button>
      </div>
    </div>
  );
}

function AttachmentChip({ file }: { file: FileAsset }) {
  const [url, setUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    if (url) { window.open(url, "_blank"); return; }
    const signed = await getSignedUrl(file.id);
    if (signed) { setUrl(signed); window.open(signed, "_blank"); }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-lg border border-portal-border bg-portal-bg px-3 py-1.5 text-xs hover:bg-portal-surface transition-colors"
    >
      <FileIcon ext={file.extension ?? ""} size={12} className="text-portal-text-muted" />
      <span className="text-portal-text truncate max-w-[180px]">{file.original_name}</span>
      <Download size={11} className="text-portal-text-muted shrink-0" />
    </button>
  );
}
