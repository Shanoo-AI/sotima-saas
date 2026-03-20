import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Store, Users, Package, TrendingUp, UserPlus } from "lucide-react";
import { toast } from "sonner";
import api from "lib/api";

export default function AdminPage() {
  const [shops,  setShops]  = useState([]);
  const [stats,  setStats]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", shop_name: "", role: "owner" });
  const [lastReset, setLastReset] = useState({});

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const fetchAll = () => {
    setLoading(true);
    Promise.all([api.get("/admin/shops"), api.get("/admin/stats")])
      .then(([u, s]) => { setShops(u.data); setStats(s.data); })
      .catch(err => toast.error(err.response?.data?.detail || "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(fetchAll, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/admin/users", form);
      toast.success("User created successfully");
      setForm({ username: "", password: "", shop_name: "", role: "owner" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const toggleUser = async (id) => {
    try {
      const r = await api.put(`/admin/users/${id}/toggle`);
      toast.success(r.data.message || "Status updated"); fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
  };

  const resetPassword = async (id) => {
    const pw = window.prompt("Enter new password (leave empty to auto-generate):");
    try {
      const r = await api.put(`/admin/users/${id}/reset-password`, { new_password: pw || undefined });
      if (r.data.temp_password) {
        setLastReset(p => ({ ...p, [id]: r.data.temp_password }));
        toast.success("Password reset — temp password shown below");
      } else {
        toast.success("Password reset");
      }
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user and ALL their data? This cannot be undone.")) return;
    try {
      const r = await api.delete(`/admin/users/${id}`);
      toast.success(r.data.message || "User deleted"); fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="page-root" data-testid="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title font-heading">Admin Panel</h1>
          <p className="page-sub">Manage users and platform statistics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Shops",    value: stats?.total_shops    ?? 0, cls: "c-teal",   icls: "si-teal",   Icon: Store },
          { label: "Active Shops",   value: stats?.active_shops   ?? 0, cls: "c-green",  icls: "si-green",  Icon: Users },
          { label: "Total Products", value: stats?.total_products ?? 0, cls: "c-purple", icls: "si-purple", Icon: Package },
          { label: "Total Revenue",  value: `₨ ${(stats?.total_revenue ?? 0).toLocaleString()}`, cls: "c-orange", icls: "si-orange", Icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-content">
              <div className="stat-info">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value font-heading">{s.value}</span>
              </div>
              <div className={`stat-icon ${s.icls}`}><s.Icon /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Create User */}
      <div className="form-card" style={{ maxWidth: 560, marginBottom: 24 }}>
        <div className="form-card-head">
          <h2 className="form-card-title">Create New User</h2>
        </div>
        <div className="form-card-body">
          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-field">
              <label className="form-label">Shop Name</label>
              <input className="form-input" placeholder="e.g. Al-Noor Stationery"
                value={form.shop_name} onChange={e => set("shop_name", e.target.value)} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-field">
                <label className="form-label">Username</label>
                <input className="form-input" placeholder="username"
                  value={form.username} onChange={e => set("username", e.target.value)} required />
              </div>
              <div className="form-field">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => set("password", e.target.value)} required />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Role</label>
              <Select value={form.role} onValueChange={v => set("role", v)}>
                <SelectTrigger style={{ height: 42, borderRadius: 11, borderColor: "var(--dash-border)", fontFamily: "'DM Sans',sans-serif" }}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button className="form-submit" type="submit" disabled={creating}>
              <UserPlus style={{ width: 15, height: 15 }} />
              {creating ? "Creating…" : "Create User"}
            </button>
          </form>
        </div>
      </div>

      {/* User list */}
      <div className="form-card">
        <div className="form-card-head">
          <h2 className="form-card-title">All Users</h2>
        </div>
        <div className="form-card-body">
          {loading && <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>Loading…</p>}
          {!loading && shops.length === 0 && <p style={{ fontSize: 13, color: "var(--dash-muted)" }}>No users found.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shops.map(shop => (
              <div key={shop.id || shop.shop_id} className="user-row">
                <div className="user-row-info">
                  <p className="user-name">{shop.shop_name}</p>
                  <p className="user-handle">@{shop.username}</p>
                  {lastReset[shop.id] && (
                    <p className="user-temp-pwd">
                      Temp password: <span>{lastReset[shop.id]}</span>
                    </p>
                  )}
                </div>
                <div className="user-row-actions">
                  <span className={`badge ${shop.is_active ? "badge-active" : "badge-inactive"}`}>
                    {shop.is_active ? "Active" : "Inactive"}
                  </span>
                  <button className="btn-sm" onClick={() => toggleUser(shop.id)}>
                    {shop.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn-sm" onClick={() => resetPassword(shop.id)}>
                    Reset Password
                  </button>
                  <button className="btn-sm destructive" onClick={() => deleteUser(shop.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}