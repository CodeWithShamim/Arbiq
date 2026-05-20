"use client";

import { useEffect, useRef, useState } from "react";
import { useGetMessages, useSendMessage, type ChatMessage } from "@/hooks/useArbiqContract";
import { Send, MessageSquare, Loader2, Lock } from "lucide-react";

interface Props {
  jobId: number;
  address: string;
  clientAddress: string;
  freelancerAddress: string;
}

function formatTime(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return "Today";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shouldShowDateDivider(msgs: ChatMessage[], index: number): boolean {
  if (index === 0) return true;
  const prev = msgs[index - 1];
  const curr = msgs[index];
  if (!prev.timestamp || !curr.timestamp) return false;
  const prevDate = new Date(prev.timestamp * 1000).toDateString();
  const currDate = new Date(curr.timestamp * 1000).toDateString();
  return prevDate !== currDate;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function JobChat({ jobId, address, clientAddress, freelancerAddress: _ }: Props) {
  const { data: messages = [], isLoading } = useGetMessages(jobId);
  const { sendMessage, txState, reset } = useSendMessage();

  const [input, setInput] = useState("");
  const [optimisticMsgs, setOptimisticMsgs] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isMe = (sender: string) => sender.toLowerCase() === address.toLowerCase();
  const myRole = address.toLowerCase() === clientAddress.toLowerCase() ? "client" : "freelancer";
  const isSending = txState.status === "pending" || txState.status === "finalizing";

  // Merge confirmed + optimistic, dedup by content+sender
  const allMessages: ChatMessage[] = [
    ...messages,
    ...optimisticMsgs.filter(
      (o) => !messages.some((m) => m.sender === o.sender && m.content === o.content)
    ),
  ];

  // Once tx finalizes, reset state. Keep optimistic msgs until confirmed msgs catch up.
  useEffect(() => {
    if (txState.status === "finalized") {
      reset();
    }
    if (txState.status === "error") {
      setOptimisticMsgs([]);
      reset();
    }
  }, [txState.status, reset]);

  // Drop optimistic messages once the confirmed list contains them
  useEffect(() => {
    if (optimisticMsgs.length === 0) return;
    const allConfirmed = optimisticMsgs.every((o) =>
      messages.some((m) => m.sender === o.sender && m.content === o.content)
    );
    if (allConfirmed) setOptimisticMsgs([]);
  }, [messages, optimisticMsgs]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

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

    // Optimistic update
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

    await sendMessage(jobId, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        height: "440px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-divider)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)" }}
        >
          <MessageSquare className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>On-chain Chat</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Messages stored on GenLayer · End-to-end immutable
          </p>
        </div>
        <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <Lock className="w-3 h-3" />
          <span className="text-[10px] font-bold" style={{ letterSpacing: "0.06em" }}>ON-CHAIN</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-8 h-8">
                <div className="orbit-dot" />
                <div className="orbit-dot" />
                <div className="orbit-dot" />
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading messages…</p>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <MessageSquare className="w-8 h-8 opacity-20" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No messages yet</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Start the conversation — all messages are stored on-chain.
            </p>
          </div>
        ) : (
          allMessages.map((msg, i) => {
            const mine = isMe(msg.sender);
            const showDate = shouldShowDateDivider(allMessages, i);
            const showSender =
              i === 0 ||
              allMessages[i - 1].sender !== msg.sender ||
              showDate;

            return (
              <div key={i}>
                {/* Date divider */}
                {showDate && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px" style={{ background: "var(--border-divider)" }} />
                    <span
                      className="text-[10px] font-bold px-2"
                      style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
                    >
                      {formatDate(msg.timestamp)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "var(--border-divider)" }} />
                  </div>
                )}

                <div className={`flex flex-col ${mine ? "items-end" : "items-start"} mb-1`}>
                  {/* Role label */}
                  {showSender && (
                    <p
                      className="text-[10px] font-bold mb-1 px-1"
                      style={{
                        color: mine ? "#a78bfa" : "var(--text-muted)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {mine ? "YOU" : msg.role === "client" ? "CLIENT" : "FREELANCER"}
                    </p>
                  )}

                  {/* Bubble */}
                  <div
                    className="max-w-[78%] px-3.5 py-2.5 rounded-2xl relative"
                    style={
                      mine
                        ? {
                            background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                            borderBottomRightRadius: "6px",
                            opacity: msg.optimistic ? 0.7 : 1,
                          }
                        : {
                            background: "var(--surface-raised)",
                            border: "1px solid var(--border-subtle)",
                            borderBottomLeftRadius: "6px",
                          }
                    }
                  >
                    <p
                      className="text-sm leading-relaxed break-words"
                      style={{ color: mine ? "white" : "var(--text-primary)" }}
                    >
                      {msg.content}
                    </p>

                    {/* Timestamp */}
                    <p
                      className="text-[10px] mt-1"
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        color: mine ? "rgba(255,255,255,0.55)" : "var(--text-muted)",
                        textAlign: mine ? "right" : "left",
                      }}
                    >
                      {msg.optimistic ? (
                        <span className="flex items-center gap-1 justify-end">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          confirming…
                        </span>
                      ) : (
                        formatTime(msg.timestamp)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {txState.status === "error" && txState.error && (
        <div
          className="px-4 py-2 text-xs font-medium"
          style={{
            background: "rgba(239,68,68,0.08)",
            borderTop: "1px solid rgba(239,68,68,0.18)",
            color: "#f87171",
          }}
        >
          {txState.error}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 px-4 py-3 flex items-end gap-2"
        style={{ borderTop: "1px solid var(--border-divider)" }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder="Message… (Enter to send, Shift+Enter for new line)"
          className="flex-1 resize-none text-sm leading-relaxed outline-none"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            fontFamily: '"Darker Grotesque", system-ui, sans-serif',
            fontSize: "0.9rem",
            minHeight: "24px",
            maxHeight: "120px",
            padding: "2px 0",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background:
              input.trim() && !isSending
                ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                : "var(--surface-raised)",
            border: `1px solid ${input.trim() && !isSending ? "rgba(124,58,237,0.4)" : "var(--border-subtle)"}`,
            color: input.trim() && !isSending ? "white" : "var(--text-muted)",
            opacity: isSending ? 0.6 : 1,
          }}
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </form>
    </div>
  );
}
