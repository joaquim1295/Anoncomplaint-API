import { cn } from "../../lib/utils";

type Props = {
  className?: string;
  /** Tamanho tipográfico do wordmark */
  size?: "sm" | "md" | "lg" | "inherit";
  /** Em fundos / textos muted (ex.: footer) */
  variant?: "default" | "muted";
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-sm font-semibold",
  md: "text-base font-semibold",
  lg: "text-lg font-semibold sm:text-xl",
  inherit: "font-semibold",
};

const complaintTone: Record<NonNullable<Props["variant"]>, string> = {
  default: "text-zinc-900 dark:text-zinc-100",
  muted: "text-zinc-600 dark:text-zinc-400",
};

/**
 * Nome da marca: "Smart" em vermelho + "Complaint" na cor do contexto.
 */
export function SmartComplaintMark({ className, size = "md", variant = "default" }: Props) {
  return (
    <span className={cn("inline-flex items-baseline tracking-tight", sizeClass[size], className)}>
      <span className="text-red-600 dark:text-red-400">Smart</span>
      <span className={complaintTone[variant]}>Complaint</span>
    </span>
  );
}
