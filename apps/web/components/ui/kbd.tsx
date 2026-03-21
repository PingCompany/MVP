import { cn } from "@/lib/utils";

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded border border-foreground/10 bg-foreground/5",
        "px-1.5 py-px font-mono text-2xs text-foreground/40 leading-none",
        className
      )}
    >
      {children}
    </kbd>
  );
}
