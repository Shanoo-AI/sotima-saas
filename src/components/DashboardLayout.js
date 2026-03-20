import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "components/ui/sheet";
import { Button } from "components/ui/button";
import {
  LayoutDashboard, ShoppingCart, Package, Receipt, Truck,
  Settings, Shield, Sun, Moon, Menu, LogOut,
  TrendingUp, Plus
} from "lucide-react";

const appLogo = `${process.env.PUBLIC_URL}/logo.png`;

const navItems = [
  { name: "Dashboard",    path: "/dashboard",  icon: LayoutDashboard, group: "main" },
  { name: "Point of Sale",path: "/pos",         icon: ShoppingCart,    group: "main", badge: "POS" },
  { name: "Inventory",    path: "/inventory",   icon: Package,         group: "main" },
  { name: "Sales",        path: "/sales",       icon: Receipt,         group: "main" },
  { name: "Purchases",    path: "/purchases",   icon: Truck,           group: "main" },
  { name: "Settings",     path: "/settings",    icon: Settings,        group: "system" },
];

// Greeting based on time of day
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Today's date formatted
function getTodayLabel() {
  return new Date().toLocaleDateString("en-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ── Nav item ──────────────────────────────────────────────────
function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={`sb-nav-item${isActive ? " active" : ""}`}
      data-testid={`nav-${item.path.slice(1)}`}
    >
      <span className="sb-nav-icon"><Icon /></span>
      <span className="sb-nav-label">{item.name}</span>
      {item.badge && <span className="sb-nav-badge">{item.badge}</span>}
    </NavLink>
  );
}

// ── Sidebar content ───────────────────────────────────────────
function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const mainItems   = navItems.filter(i => i.group === "main");
  const systemItems = navItems.filter(i => i.group === "system");
  if (user?.role === "admin") {
    systemItems.push({ name: "Admin Panel", path: "/admin", icon: Shield, group: "system" });
  }

  // Initials from user name
  const initials = (user?.username || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="sb-inner">
      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-logo">
          <img src={appLogo} alt="Sotima logo" className="sb-logo-img" />
        </div>
        <div className="sb-brand-text">
          <p className="sb-brand-name font-heading">Sotima Built</p>
          <span className="sb-shop-name">{user?.shop_name || "My Shop"}</span>
        </div>
      </div>

      <div className="sb-sep" />

      {/* Nav */}
      <nav className="sb-nav">
        <span className="sb-group-label">Main Menu</span>
        {mainItems.map(item => (
          <NavItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={onNavigate}
          />
        ))}

        <span className="sb-group-label" style={{ marginTop: 8 }}>System</span>
        {systemItems.map(item => (
          <NavItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="sb-bottom">
        <div className="sb-sep" style={{ margin: "0 0 10px" }} />

        {/* User chip */}
        <div className="sb-user-chip">
          <div className="sb-user-avatar">{initials}</div>
          <div className="sb-user-text">
            <p>{user?.username || "Owner"}</p>
            <span>{user?.role === "admin" ? "Admin · Online" : "Staff"}</span>
          </div>
        </div>

        {/* Theme + logout */}
        <button
          className="sb-action-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          data-testid="theme-toggle"
        >
          {theme === "dark" ? <Sun /> : <Moon />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          className="sb-action-btn danger"
          onClick={logout}
          data-testid="logout-btn"
        >
          <LogOut />
          Log Out
        </button>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────
export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="dl-root">
      {/* Desktop Sidebar */}
      <aside className="dl-sidebar" data-testid="sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="dl-mobile-header">
        <div className="dl-mobile-brand">
          <div className="dl-mobile-logo"><img src={appLogo} alt="Sotima logo" className="dl-mobile-logo-img" /></div>
          <span className="font-heading dl-mobile-title">ShopNexus</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="dl-sheet p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main */}
      <main className="dl-main">
        {/* Topbar */}
        <div className="dl-topbar">
          <div className="dl-topbar-left">
            <h2 className="dl-greeting font-heading">
              {getGreeting()}, {user?.username?.split(" ")[0] || "there"} 👋
            </h2>
            <p className="dl-topbar-sub">
              {getTodayLabel()}
              {user?.shop_name && <> &nbsp;·&nbsp; {user.shop_name}</>}
            </p>
          </div>
          <div className="dl-topbar-right">
            <NavLink to="/sales" className="dl-topbar-btn">
              <TrendingUp className="h-3.5 w-3.5" />
              Reports
            </NavLink>
            <NavLink to="/pos" className="dl-topbar-btn primary">
              <Plus className="h-3.5 w-3.5" />
              New Sale
            </NavLink>
          </div>
        </div>

        {/* Page content */}
        <div className="dl-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
