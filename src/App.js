
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "components/ui/sonner";
import { AuthProvider, useAuth } from "contexts/AuthContext";
import DashboardLayout from "components/DashboardLayout";
import AuthPage from "pages/AuthPage";
import DashboardPage from "pages/DashboardPage";
import POSPage from "pages/POSPage";
import InventoryPage from "pages/InventoryPage";
import SalesPage from "pages/SalesPage";
import PurchasePage from "pages/PurchasePage";
import SettingsPage from "pages/SettingsPage";
import AdminPage from "pages/AdminPage";
import "App.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/purchases" element={<PurchasePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}


