import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("rounded-xl border border-border bg-card text-card-foreground", className)}
      {...props}
    />
  );
});

const CardHeader = React.forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn("p-6 pb-2", className)} {...props} />;
});

const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn("p-6", className)} {...props} />;
});

const CardTitle = React.forwardRef(function CardTitle({ className, ...props }, ref) {
  return <h3 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />;
});

const CardDescription = React.forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />;
});

export { Card, CardHeader, CardContent, CardTitle, CardDescription };
