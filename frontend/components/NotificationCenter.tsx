"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCheck } from "lucide-react";
import { useNotifications, type AppNotification, type NotificationType } from "@/hooks/useNotifications";

// ── Colour mapping ────────────────────────────────────────────────────────────

const TYPE_DOT: Record<NotificationType, string> = {
  approved:  "#22c55e",
  disputed:  "#ef4444",
  delivered: "#38bdf8",
  taken:     "#f59e0b",
  stale:     "#71717a",
};

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: AppNotification;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const show = setTimeout(() => setVisible(true), 30);
    // Auto-dismiss after 5s
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 350);
    }, 5_000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [onDismiss]);

  const handleClick = () => {
    router.push(`/jobs/${notification.jobId}`);
    onDismiss();
  };

  const dot = TYPE_DOT[notification.type];

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        maxWidth: 360,
        padding: "14px 16px",
        borderRadius: 16,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-mid)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        cursor: "pointer",
        transform: visible ? "translateY(0)" : "translateY(calc(100% + 24px))",
        opacity: visible ? 1 : 0,
        transition: "transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease",
      }}
    >
      {/* Coloured dot */}
      <span
        style={{
          flexShrink: 0,
          marginTop: 3,
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: dot,
          boxShadow: `0 0 8px ${dot}88`,
        }}
      />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.4,
          }}
        >
          {notification.message}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 3,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          Tap to view Job #{notification.jobId}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          setTimeout(onDismiss, 350);
        }}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          padding: 2,
          cursor: "pointer",
          color: "var(--text-muted)",
          lineHeight: 1,
        }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function NotificationItem({ notif, onClick }: { notif: AppNotification; onClick: () => void }) {
  const dot = TYPE_DOT[notif.type];
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        padding: "10px 14px",
        background: notif.read ? "transparent" : "rgba(124,58,237,0.06)",
        border: "none",
        borderBottom: "1px solid var(--border-divider)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = notif.read
          ? "transparent"
          : "rgba(124,58,237,0.06)";
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 5,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dot,
          boxShadow: `0 0 6px ${dot}99`,
          opacity: notif.read ? 0.4 : 1,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 12.5,
            fontWeight: notif.read ? 400 : 600,
            color: notif.read ? "var(--text-secondary)" : "var(--text-primary)",
            lineHeight: 1.45,
            marginBottom: 2,
          }}
        >
          {notif.message}
        </p>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {relativeTime(notif.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ── Bell + dropdown ───────────────────────────────────────────────────────────

export function NotificationCenter() {
  const router = useRouter();
  const { notifications, unreadCount, newToast, markAllRead, dismissToast } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      {/* Bell button */}
      <div ref={panelRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Notifications"
          style={{
            position: "relative",
            width: 32,
            height: 32,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: open ? "rgba(124,58,237,0.14)" : "rgba(255,255,255,0.06)",
            border: open ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.09)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Bell style={{ width: 15, height: 15 }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 17,
                height: 17,
                borderRadius: 999,
                background: "#ef4444",
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                border: "1.5px solid var(--bg-primary)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: 360,
              maxHeight: 400,
              borderRadius: 16,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-mid)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 200,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px 10px",
                borderBottom: "1px solid var(--border-divider)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell style={{ width: 14, height: 14, color: "#a78bfa" }} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: "rgba(124,58,237,0.18)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      color: "var(--text-label)",
                      borderRadius: 999,
                      padding: "1px 7px",
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#a78bfa",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: 6,
                    transition: "background 0.1s",
                  }}
                >
                  <CheckCheck style={{ width: 12, height: 12 }} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {sorted.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 13,
                  }}
                >
                  <Bell style={{ width: 28, height: 28, opacity: 0.2, margin: "0 auto 8px" }} />
                  <p>No notifications yet</p>
                  <p style={{ fontSize: 11, marginTop: 4 }}>
                    Activity on your jobs will appear here
                  </p>
                </div>
              ) : (
                sorted.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notif={n}
                    onClick={() => {
                      markAllRead();
                      setOpen(false);
                      router.push(`/jobs/${n.jobId}`);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {newToast && (
        <NotificationToast notification={newToast} onDismiss={dismissToast} />
      )}
    </>
  );
}
