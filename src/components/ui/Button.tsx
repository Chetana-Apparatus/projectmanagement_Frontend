import type * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "secondary" | "ghost";
  size?: "default" | "icon";
};

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap rounded-md text-sm font-medium transition-colors cursor-pointer outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none";
  const variantClasses =
    variant === "secondary"
      ? "bg-white text-cs-text hover:bg-cs-primary-100/10 border border-cs-border hover:border-cs-primary-100"
      : variant === "ghost"
        ? "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        : "bg-gradient-to-tl from-cs-primary-100 to-cs-primary-200 text-white hover:ring-2 hover:ring-cs-primary-100";
  const sizeClasses =
    size === "icon"
      ? "size-9 rounded-md p-0"
      : "h-10 rounded-md px-6 has-[>svg]:px-4";

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      {...props}
    />
  );
}

export { Button };
export default Button;
