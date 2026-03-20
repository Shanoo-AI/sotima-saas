import { useState } from "react";
import { Truck, Package } from "lucide-react";
import { toast } from "sonner";
import api from "lib/api";

export default function PurchasePage() {
  const [form, setForm] = useState({ product_id: "", quantity: "", cost_price: "", supplier: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/purchases", {
        product_id:  form.product_id.trim(),
        quantity:    parseInt(form.quantity),
        cost_price:  parseFloat(form.cost_price),
        supplier:    form.supplier,
        notes:       form.notes,
      });
      toast.success("Purchase recorded — stock updated");
      setForm({ product_id: "", quantity: "", cost_price: "", supplier: "", notes: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to record purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-root" data-testid="purchase-page">
      <div className="page-header">
        <div>
          <h1 className="page-title font-heading">Purchases</h1>
          <p className="page-sub">Record incoming stock from suppliers</p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 560 }}>
        <div className="form-card-head">
          <h2 className="form-card-title">New Purchase Entry</h2>
        </div>
        <div className="form-card-body">
          <form onSubmit={handleSubmit} className="form-grid">

            <div className="form-field">
              <label className="form-label">Product ID or SKU</label>
              <input className="form-input" placeholder="e.g. PROD-001"
                value={form.product_id} onChange={e => set("product_id", e.target.value)} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-field">
                <label className="form-label">Quantity</label>
                <input className="form-input" type="number" min="1" placeholder="0"
                  value={form.quantity} onChange={e => set("quantity", e.target.value)} required />
              </div>
              <div className="form-field">
                <label className="form-label">Cost Price (₨)</label>
                <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.cost_price} onChange={e => set("cost_price", e.target.value)} required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Supplier Name</label>
              <input className="form-input" placeholder="e.g. National Book Foundation"
                value={form.supplier} onChange={e => set("supplier", e.target.value)} />
            </div>

            <div className="form-field">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" placeholder="Any additional details…"
                value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>

            <button className="form-submit" type="submit" disabled={saving}>
              <Truck style={{ width: 15, height: 15 }} />
              {saving ? "Saving…" : "Record Purchase"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}