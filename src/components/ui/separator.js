import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Separator = React.forwardRef(function Separator(
  { className, orientation = "horizontal", ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "h-full w-px" : "h-px w-full",
        className
      )}
      {...props}
    />
  );
});

export { Separator };
