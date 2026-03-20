import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Table = React.forwardRef(function Table({ className, ...props }, ref) {
  return <table ref={ref} className={cn("w-full text-sm", className)} {...props} />;
});

const TableHeader = React.forwardRef(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn("border-b", className)} {...props} />;
});

const TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn("divide-y", className)} {...props} />;
});

const TableRow = React.forwardRef(function TableRow({ className, ...props }, ref) {
  return <tr ref={ref} className={cn("hover:bg-muted/40", className)} {...props} />;
});

const TableHead = React.forwardRef(function TableHead({ className, ...props }, ref) {
  return <th ref={ref} className={cn("text-left font-medium text-muted-foreground px-4 py-2", className)} {...props} />;
});

const TableCell = React.forwardRef(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn("px-4 py-2", className)} {...props} />;
});

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
