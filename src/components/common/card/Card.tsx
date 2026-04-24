import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "surface" | "auth";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  /** Padding applies to `surface` only; `auth` uses `.card` padding from globals. */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  height?: "sm" | "md" | "lg" | "xl" | "auto";
};

const surfacePadding: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
  xl: "p-8",
};
const heightStyles = {
  sm: "min-h-[120px]",
  md: "min-h-[160px]",
  lg: "min-h-[220px]",
  xl: "min-h-[280px]",
  auto: "",
};
export default function Card({
  variant = "surface",
  padding = "lg",
  height = "auto",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        variant === "auth" ? "card" : "surface-card",
        variant === "surface" && surfacePadding[padding],
        variant === "surface" && heightStyles[height],
        "flex items-center justify-center",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
