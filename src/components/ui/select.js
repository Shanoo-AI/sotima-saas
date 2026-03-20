import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function collectOptions(children, acc) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      acc.items.push({ value: child.props.value, label: child.props.children });
    }
    if (child.type === SelectValue && child.props.placeholder) {
      acc.placeholder = child.props.placeholder;
    }
    if (child.type === SelectTrigger && child.props.className) {
      acc.triggerClassName = child.props.className;
    }
    if (child.props && child.props.children) {
      collectOptions(child.props.children, acc);
    }
  });
}

function Select({ value, onValueChange, children }) {
  const acc = { items: [], placeholder: "Select...", triggerClassName: "" };
  collectOptions(children, acc);

  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm",
        acc.triggerClassName
      )}
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
    >
      <option value="" disabled>
        {acc.placeholder}
      </option>
      {acc.items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function SelectTrigger() {
  return null;
}

function SelectValue() {
  return null;
}

function SelectContent({ children }) {
  return <>{children}</>;
}

function SelectItem() {
  return null;
}

SelectTrigger.displayName = "SelectTrigger";
SelectValue.displayName = "SelectValue";
SelectContent.displayName = "SelectContent";
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
