// Переиспользуемая кнопка с двумя вариантами оформления:
// primary — жёлтая заливка, secondary — белая с рамкой.
// Оба варианта — фирменный стиль «жёсткой тени» (app.css, .btn-hard).

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base = "btn-hard px-5 h-11 text-sm disabled:opacity-40";
  const look = variant === "primary" ? "bg-accent" : "bg-white";
  return <button className={`${base} ${look} ${className}`} {...props} />;
}
