import React, { useContext, useMemo, useState } from "react";

const TabsContext = React.createContext(null);

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Tabs({ value, defaultValue, onValueChange, className, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;

  const setValue = (next) => {
    if (value === undefined) setInternalValue(next);
    if (onValueChange) onValueChange(next);
  };

  const ctx = useMemo(() => ({ value: currentValue, setValue }), [currentValue]);

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className} {...props} />
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn("inline-flex items-center rounded-lg bg-muted p-1", className)}
      {...props}
    />
  );
}

function TabsTrigger({ value, className, ...props }) {
  const ctx = useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
        active ? "bg-background text-foreground shadow" : "text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ value, className, ...props }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={className} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
