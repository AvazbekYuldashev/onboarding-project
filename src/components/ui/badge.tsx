import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        green: "bg-success/15 text-success dark:bg-success/25 dark:text-success-foreground",
        yellow: "bg-warning/20 text-warning-foreground dark:bg-warning/25",
        red: "bg-danger/15 text-danger dark:bg-danger/25 dark:text-danger-foreground",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
