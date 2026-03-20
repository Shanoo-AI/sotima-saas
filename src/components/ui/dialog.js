import React, { useContext, useMemo, useState } from "react";

const DialogContext = React.createContext(null);

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Dialog({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;

  const setOpen = (v) => {
    if (open === undefined) setInternalOpen(v);
    if (onOpenChange) onOpenChange(v);
  };

  const ctx = useMemo(() => ({ open: isOpen, setOpen }), [isOpen]);

  return <DialogContext.Provider value={ctx}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ asChild, children }) {
  const ctx = useContext(DialogContext);
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

function DialogContent({ className, children }) {
  const ctx = useContext(DialogContext);
  if (!ctx?.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => ctx?.setOpen(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-2", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle };
