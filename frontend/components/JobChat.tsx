"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useGetMessages, useSendMessage, type ChatMessage } from "@/hooks/useArbiqContract";
import { Send, MessageSquare, Loader2, Lock, ChevronDown } from "lucide-react";
import { TxHudOverlay } from "@/components/TxHudOverlay";

interface Props {
  jobId: number;
  address: string;
  clientAddress: string;
  freelancerAddress: string;
}

function formatTime(ts: number): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(ts: number): string {
  if (!ts) return "Today";
  const d = new Date(ts * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function shouldShowDateDivider(msgs: ChatMessage[], index: number): boolean {
  if (index === 0) return true;
  const prev = msgs[index - 1];
  const curr = msgs[index];
  if (!prev.timestamp || !curr.timestamp) return false;
  return (
    new Date(prev.timestamp * 1000).toDateString() !==
    new Date(curr.timestamp * 1000).toDateString()
  );
}

function initials(role: string, isMe: boolean): string {
  if (isMe) return "ME";
  return role === "client" ? "CL" : "FR";
}

function Avatar({ role, isMe }: { role: string; isMe: boolean }) {
  const bg = isMe
    ? "linear-gradient(135deg, #7c3aed, #6366f1)"
    : role === "client"
    ? "linear-gradient(135deg, #0ea5e9, #3b82f6)"
    : "linear-gradient(135deg, #059669, #10b981)";

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white select-none"
      style={{ background: bg, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
    >
      {initials(role, isMe)}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function JobChat({ jobId, address, clientAddress, freelancerAddress: _ }: Props) {
  const { data: messages = [], isLoading } = useGetMessages(jobId);
  const { sendMessage, txState, reset } = useSendMessage();

  const [input, setInput] = useState("");
  const [optimisticMsgs, setOptimisticMsgs] = useState<ChatMessage[]>([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);
  const forceScrollRef = useRef(false);

  const isMe = (sender: string) => sender.toLowerCase() === address.toLowerCase();
  const myRole = address.toLowerCase() === clientAddress.toLowerCase() ? "client" : "freelancer";
  const isSending = txState.status === "pending" || txState.status === "finalizing";

  const allMessages: ChatMessage[] = [
    ...messages,
    ...optimisticMsgs.filter(
      (o) => !messages.some((m) => m.sender === o.sender && m.content === o.content)
    ),
  ];

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowScrollBtn(false);
  }, []);

  // Track whether user is near bottom
  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distFromBottom < 60;
    setShowScrollBtn(distFromBottom > 120);
  };

  // After every render: if forceScroll flag is set, scroll instantly; otherwise
  // only auto-scroll when already near bottom.
  useLayoutEffect(() => {
    if (forceScrollRef.current) {
      forceScrollRef.current = false;
      scrollToBottom("smooth");
    } else if (isAtBottomRef.current) {
      scrollToBottom("smooth");
    } else {
      setShowScrollBtn(true);
    }
  });

  // Finalize / error cleanup
  useEffect(() => {
    if (txState.status === "finalized") reset();
    if (txState.status === "error") {
      setOptimisticMsgs([]);
      reset();
    }
  }, [txState.status, reset]);

  // Drop optimistic once confirmed
  useEffect(() => {
    if (optimisticMsgs.length === 0) return;
    if (
      optimisticMsgs.every((o) =>
        messages.some((m) => m.sender === o.sender && m.content === o.content)
      )
    ) {
      setOptimisticMsgs([]);
    }
  }, [messages, optimisticMsgs]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setOptimisticMsgs((prev) => [
      ...prev,
      {
        sender: address,
        content,
        role: myRole,
        timestamp: Math.floor(Date.now() / 1000),
        optimistic: true,
      },
    ]);
    setInput("");
    // Signal the layout effect to force-scroll after the next paint
    isAtBottomRef.current = true;
    forceScrollRef.current = true;

    await sendMessage(jobId, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const charCount = input.length;
  const charWarn = charCount > 420;
  const charOver = charCount >= 500;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border-mid)",
        height: "520px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
        style={{
          background: "var(--surface-card)",
          borderBottom: "1px solid var(--border-divider)",
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(124,58,237,0.14)",
            border: "1px solid rgba(124,58,237,0.28)",
          }}
        >
          <MessageSquare className="w-4 h-4" style={{ color: "#a78bfa" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-none mb-0.5" style={{ color: "var(--text-primary)" }}>
            On-Chain Chat
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 5px #22c55e" }}
            />
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Live · Messages stored on GenLayer
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.18)",
          }}
        >
          <Lock className="w-2.5 h-2.5" style={{ color: "#22c55e" }} />
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: "#22c55e", letterSpacing: "0.12em" }}
          >
            On-Chain
          </span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
        style={{
          padding: "16px 16px 8px",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border-mid) transparent",
        }}
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#a78bfa" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading messages…</p>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
              style={{ background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.20)" }}
            >
              <MessageSquare className="w-6 h-6" style={{ color: "#a78bfa", opacity: 0.7 }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              No messages yet
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Start the conversation. Every message is stored permanently on the GenLayer blockchain.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {allMessages.map((msg, i) => {
              const mine = isMe(msg.sender);
              const showDate = shouldShowDateDivider(allMessages, i);
              const prevMsg = allMessages[i - 1];
              const nextMsg = allMessages[i + 1];
              const isGroupStart =
                i === 0 || prevMsg.sender !== msg.sender || showDate;
              const isGroupEnd =
                i === allMessages.length - 1 ||
                nextMsg.sender !== msg.sender ||
                shouldShowDateDivider(allMessages, i + 1);

              return (
                <div key={i}>
                  {/* Date divider */}
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px" style={{ background: "var(--border-divider)" }} />
                      <span
                        className="text-[10px] font-bold px-3 py-1 rounded-full"
                        style={{
                          color: "var(--text-muted)",
                          background: "var(--surface-card)",
                          border: "1px solid var(--border-subtle)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {formatDate(msg.timestamp)}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "var(--border-divider)" }} />
                    </div>
                  )}

                  {/* Message row */}
                  <div
                    className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
                    style={{ marginBottom: isGroupEnd ? "10px" : "2px" }}
                  >
                    {/* Avatar — only on group end */}
                    <div className="flex-shrink-0 w-7 flex items-end">
                      {isGroupEnd ? (
                        <Avatar role={msg.role} isMe={mine} />
                      ) : (
                        <div className="w-7" />
                      )}
                    </div>

                    {/* Bubble + meta */}
                    <div
                      className={`flex flex-col gap-0.5 max-w-[72%] ${mine ? "items-end" : "items-start"}`}
                    >
                      {/* Sender label — only on group start */}
                      {isGroupStart && (
                        <p
                          className="text-[10px] font-bold px-1"
                          style={{
                            color: mine
                              ? "#a78bfa"
                              : msg.role === "client"
                              ? "#38bdf8"
                              : "#34d399",
                            letterSpacing: "0.07em",
                          }}
                        >
                          {mine ? "You" : msg.role === "client" ? "Client" : "Freelancer"}
                        </p>
                      )}

                      {/* Bubble */}
                      <div
                        className="relative px-4 py-2.5"
                        style={{
                          ...(mine
                            ? {
                                background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                                borderRadius: isGroupStart && isGroupEnd
                                  ? "18px"
                                  : isGroupStart
                                  ? "18px 18px 6px 18px"
                                  : isGroupEnd
                                  ? "18px 6px 18px 18px"
                                  : "18px 6px 6px 18px",
                                boxShadow: "0 2px 12px rgba(124,58,237,0.35)",
                                opacity: msg.optimistic ? 0.75 : 1,
                              }
                            : {
                                background: "var(--surface-raised)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: isGroupStart && isGroupEnd
                                  ? "18px"
                                  : isGroupStart
                                  ? "18px 18px 18px 6px"
                                  : isGroupEnd
                                  ? "6px 18px 18px 18px"
                                  : "6px 18px 18px 6px",
                              }),
                        }}
                      >
                        <p
                          className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                          style={{ color: mine ? "rgba(255,255,255,0.95)" : "var(--text-primary)" }}
                        >
                          {msg.content}
                        </p>
                      </div>

                      {/* Timestamp — only on group end */}
                      {isGroupEnd && (
                        <div
                          className={`flex items-center gap-1 px-1 ${mine ? "flex-row-reverse" : ""}`}
                        >
                          {msg.optimistic ? (
                            <span
                              className="flex items-center gap-1 text-[10px]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              Confirming on-chain…
                            </span>
                          ) : (
                            <span
                              className="text-[10px]"
                              style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                color: "var(--text-muted)",
                              }}
                            >
                              {formatTime(msg.timestamp)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Scroll-to-bottom button ── */}
      {showScrollBtn && (
        <div className="flex justify-center" style={{ marginTop: -20, position: "relative", zIndex: 10, flexShrink: 0 }}>
          <button
            onClick={() => scrollToBottom("smooth")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-mid)",
              color: "var(--text-secondary)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <ChevronDown className="w-3 h-3" />
            New messages
          </button>
        </div>
      )}

      {/* ── TX status bar ── */}
      {txState.status !== "idle" && (
        <div style={{ padding: "0 12px 4px", flexShrink: 0 }}>
          <TxHudOverlay
            status={txState.status}
            consensusStatus={txState.consensusStatus}
            txHash={txState.txHash}
            error={txState.error}
            operation="send_message"
            onDismiss={reset}
          />
        </div>
      )}

      {/* ── Input area ── */}
      <div
        className="flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-divider)", background: "var(--surface-card)" }}
      >
        {/* Char counter */}
        {charCount > 0 && (
          <div className="px-5 pt-2 flex justify-end">
            <span
              className="text-[10px] font-mono"
              style={{
                color: charOver ? "#ef4444" : charWarn ? "#f59e0b" : "var(--text-muted)",
              }}
            >
              {charCount}/500
            </span>
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="flex items-end gap-3 px-4 py-3"
        >
          {/* Textarea wrapper */}
          <div
            className="flex-1 flex items-end rounded-2xl px-4 py-2.5 transition-all"
            style={{
              background: "var(--bg-primary)",
              border: `1px solid ${isSending ? "rgba(124,58,237,0.4)" : "var(--border-mid)"}`,
              boxShadow: isSending ? "0 0 0 3px rgba(124,58,237,0.10)" : "none",
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder="Type a message… (Enter to send)"
              className="flex-1 resize-none text-sm leading-relaxed outline-none bg-transparent"
              style={{
                color: "var(--text-primary)",
                fontFamily: '"Darker Grotesque", system-ui, sans-serif',
                fontSize: "0.9rem",
                minHeight: "22px",
                maxHeight: "120px",
                padding: 0,
                caretColor: "#a78bfa",
              }}
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || isSending || charOver}
            className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95"
            style={{
              background:
                input.trim() && !isSending && !charOver
                  ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                  : "var(--surface-raised)",
              border: `1px solid ${
                input.trim() && !isSending && !charOver
                  ? "rgba(124,58,237,0.5)"
                  : "var(--border-subtle)"
              }`,
              color: input.trim() && !isSending && !charOver ? "white" : "var(--text-muted)",
              opacity: isSending ? 0.7 : 1,
              boxShadow:
                input.trim() && !isSending && !charOver
                  ? "0 4px 14px rgba(124,58,237,0.35)"
                  : "none",
            }}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" style={{ transform: "translateX(1px)" }} />
            )}
          </button>
        </form>

        {/* Hint */}
        <p
          className="text-center pb-2 text-[10px]"
          style={{ color: "var(--text-muted)", opacity: 0.6 }}
        >
          Shift+Enter for new line · Messages are permanent on-chain
        </p>
      </div>
    </div>
  );
}
