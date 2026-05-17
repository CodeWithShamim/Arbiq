import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("glass rounded-2xl relative overflow-hidden", className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 pt-6", className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 py-6", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-bold text-lg leading-tight", className)} style={{ color: "var(--text-primary)" }}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm mt-1", className)} style={{ color: "var(--text-secondary)" }}>
      {children}
    </p>
  );
}
