import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Button = React.forwardRef(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref
) {
  const variantClass = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-background hover:bg-accent",
    ghost: "bg-transparent hover:bg-accent",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  }[variant] || "bg-primary text-primary-foreground hover:bg-primary/90";

  const sizeClass = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
    lg: "h-11 px-8",
    icon: "h-10 w-10",
  }[size] || "h-10 px-4 py-2";

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    />
  );
});

export { Button };
