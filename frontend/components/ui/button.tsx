import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 select-none",
  {
    variants: {
      variant: {
        primary: "btn-primary text-white rounded-xl",
        outline: [
          "text-gray-300 rounded-xl",
          "bg-white/[0.04] hover:bg-white/[0.08]",
          "border border-white/10 hover:border-white/20",
        ].join(" "),
        ghost: "text-gray-400 hover:text-white hover:bg-white/5 rounded-xl",
        destructive: [
          "text-red-300 rounded-xl",
          "bg-red-500/10 hover:bg-red-500/20",
          "border border-red-500/20 hover:border-red-500/40",
        ].join(" "),
        success: [
          "text-green-300 rounded-xl",
          "bg-green-500/10 hover:bg-green-500/20",
          "border border-green-500/20 hover:border-green-500/40",
        ].join(" "),
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs rounded-lg",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3.5 text-sm",
        xl: "px-8 py-4 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
