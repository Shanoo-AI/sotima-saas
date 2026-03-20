import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import api from "lib/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({ shop_name: "", address: "", phone: "", print_format: "a5" });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    api.get("/settings")
      .then(r => setForm({ shop_name: r.data.shop_name || "", address: r.data.address || "", phone: r.data.phone || "", print_format: r.data.print_format || "a5" }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put("/settings", form);
      setForm({ shop_name: r.data.shop_name || "", address: r.data.address || "", phone: r.data.phone || "", print_format: r.data.print_format || "a5" });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-root" data-testid="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title font-heading">Settings</h1>
          <p className="page-sub">Manage your shop profile and preferences</p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 540 }}>
        <div className="form-card-head">
          <h2 className="form-card-title">Shop Details</h2>
        </div>
        <div className="form-card-body">
          <form onSubmit={handleSave} className="form-grid">

            <div className="form-field">
              <label className="form-label">Shop Name</label>
              <input className="form-input" placeholder="Your shop name"
                value={form.shop_name} onChange={e => set("shop_name", e.target.value)} disabled={loading} />
            </div>

            <div className="form-field">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="Shop address (shown on receipts)"
                value={form.address} onChange={e => set("address", e.target.value)} disabled={loading} />
            </div>

            <div className="form-field">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+92 300 0000000"
                value={form.phone} onChange={e => set("phone", e.target.value)} disabled={loading} />
            </div>

            <div className="form-field">
              <label className="form-label">Receipt Print Format</label>
              <Select value={form.print_format} onValueChange={v => set("print_format", v)} disabled={loading}>
                <SelectTrigger style={{ height: 42, borderRadius: 11, borderColor: "var(--dash-border)", fontFamily: "'DM Sans',sans-serif" }}>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a5">A5 — Standard paper</SelectItem>
                  <SelectItem value="thermal">Thermal — 80mm roll</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button className="form-submit" type="submit" disabled={saving || loading}>
              <Save style={{ width: 15, height: 15 }} />
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}