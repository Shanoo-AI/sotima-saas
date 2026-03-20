import { useState, useEffect } from "react";
import { Receipt } from "lucide-react";
import api from "lib/api";

export default function SalesPage() {
  const [sales, setSales]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/sales")
      .then(r => setSales(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-root" data-testid="sales-loading">
        <div className="page-header"><div className="page-title font-heading" style={{ background: "#E2EBE8", borderRadius: 8, width: 160, height: 28 }} /></div>
        {[1,2,3].map(i => <div key={i} style={{ height: 52, borderRadius: 12, background: "#E2EBE8", marginBottom: 8 }} />)}
      </div>
    );
  }

  const totalRevenue = sales.reduce((s, x) => s + (x.total || 0), 0);
  const totalProfit  = sales.reduce((s, x) => s + (x.profit || 0), 0);

  return (
    <div className="page-root" data-testid="sales-page">
      <div className="page-header">
        <div>
          <h1 className="page-title font-heading">Sales History</h1>
          <p className="page-sub">{sales.length} transactions</p>
        </div>
      </div>

      {/* Summary strip */}
      {sales.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card c-teal">
            <div className="stat-content">
              <div className="stat-info">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-value font-heading">₨ {totalRevenue.toLocaleString()}</span>
              </div>
              <div className="stat-icon si-teal">
                <Receipt />
              </div>
            </div>
          </div>
          <div className={`stat-card ${totalProfit >= 0 ? "c-green" : "c-pink"}`}>
            <div className="stat-content">
              <div className="stat-info">
                <span className="stat-label">Total Profit</span>
                <span className="stat-value font-heading">₨ {totalProfit.toLocaleString()}</span>
              </div>
              <div className={`stat-icon ${totalProfit >= 0 ? "si-green" : "si-pink"}`}>
                <Receipt />
              </div>
            </div>
          </div>
          <div className="stat-card c-orange">
            <div className="stat-content">
              <div className="stat-info">
                <span className="stat-label">Avg. Sale</span>
                <span className="stat-value font-heading">
                  ₨ {sales.length ? (totalRevenue / sales.length).toFixed(0) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="data-card">
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Items</th>
                <th className="right">Subtotal</th>
                <th className="right">Discount</th>
                <th className="right">Total</th>
                <th className="right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} data-testid={`sale-row-${sale.id}`}>
                  <td style={{ whiteSpace: "nowrap", fontSize: 12.5, color: "var(--dash-muted)" }}>
                    {new Date(sale.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {sale.items.map((item, i) => (
                        <span key={i} className="badge badge-default">{item.product_name} ×{item.quantity}</span>
                      ))}
                    </div>
                  </td>
                  <td className="right">₨ {sale.subtotal?.toFixed(2)}</td>
                  <td className="right" style={{ color: sale.discount_amount > 0 ? "#DC2626" : "var(--dash-muted)" }}>
                    {sale.discount_amount > 0 ? `−₨ ${sale.discount_amount?.toFixed(2)}` : "—"}
                  </td>
                  <td className="right" style={{ fontWeight: 700 }}>₨ {sale.total?.toFixed(2)}</td>
                  <td className="right" style={{ fontWeight: 600, color: sale.profit >= 0 ? "#059669" : "#DC2626" }}>
                    ₨ {sale.profit?.toFixed(2)}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-empty">
                    <Receipt style={{ width: 36, height: 36, margin: "0 auto 10px", display: "block", opacity: 0.22 }} />
                    No sales yet. Start selling from the POS!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}