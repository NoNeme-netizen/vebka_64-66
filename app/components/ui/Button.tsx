import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "px-5 h-11 rounded-md text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const look =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent/90"
      : "bg-white border border-muted/50 text-ink hover:bg-soft";
  return <button className={`${base} ${look} ${className}`} {...props} />;
}
