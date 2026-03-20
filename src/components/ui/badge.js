import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ className, variant = "default", ...props }) {
  const variantClass = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
    destructive: "bg-destructive text-destructive-foreground",
  }[variant] || "bg-primary text-primary-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClass,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
