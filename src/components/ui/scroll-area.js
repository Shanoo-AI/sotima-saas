import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const ScrollArea = React.forwardRef(function ScrollArea({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("overflow-auto", className)}
      {...props}
    />
  );
});

export { ScrollArea };
