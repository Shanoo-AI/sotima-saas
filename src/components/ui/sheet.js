import React, { useContext, useMemo, useState } from "react";

const SheetContext = React.createContext(null);

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Sheet({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;

  const setOpen = (v) => {
    if (open === undefined) setInternalOpen(v);
    if (onOpenChange) onOpenChange(v);
  };

  const ctx = useMemo(() => ({ open: isOpen, setOpen }), [isOpen]);

  return <SheetContext.Provider value={ctx}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ asChild, children }) {
  const ctx = useContext(SheetContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick && children.props.onClick(e);
        ctx?.setOpen(true);
      },
    });
  }
  return (
    <button type="button" onClick={() => ctx?.setOpen(true)}>
      {children}
    </button>
  );
}

function SheetContent({ side = "right", className, children }) {
  const ctx = useContext(SheetContext);
  if (!ctx?.open) return null;

  const sideClass = {
    left: "left-0 top-0 h-full w-64",
    right: "right-0 top-0 h-full w-64",
    top: "top-0 left-0 w-full h-1/3",
    bottom: "bottom-0 left-0 w-full h-1/3",
  }[side] || "right-0 top-0 h-full w-64";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => ctx?.setOpen(false)}
      />
      <div
        className={cn(
          "absolute bg-background border border-border shadow-lg",
          sideClass,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SheetTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetContent, SheetTitle };
