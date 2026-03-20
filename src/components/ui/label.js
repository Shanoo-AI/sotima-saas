import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Label = React.forwardRef(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
});

export { Label };
