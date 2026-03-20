import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, ShoppingBag, Printer } from "lucide-react";
import api from "lib/api";

const appLogo = `${process.env.PUBLIC_URL}/logo.png`;

export default function POSPage() {
  const [products, setProducts]       = useState([]);
  const [cart, setCart]               = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [discountType, setDiscountType]   = useState("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings]   = useState(null);
  const [lastSale, setLastSale]   = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/settings")])
      .then(([p, s]) => { setProducts(p.data); setSettings(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery)
  );

  const addToCart = (product) => {
    if (product.quantity <= 0) { toast.error("Out of stock!"); return; }
    setCart(prev => {
      const ex = prev.find(i => i.product_id === product.id);
      if (ex) {
        if (ex.quantity >= product.quantity) { toast.error("Maximum stock reached"); return prev; }
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, sale_price: product.sale_price, cost_price: product.cost_price, max_qty: product.quantity, quantity: 1 }];
    });
  };

  const handleSearchInput = (value) => {
    setSearchQuery(value);
    const match = products.find(p => p.barcode === value);
    if (match) { addToCart(match); setSearchQuery(""); }
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      const n = i.quantity + delta;
      if (n <= 0) return null;
      if (n > i.max_qty) { toast.error("Maximum stock reached"); return i; }
      return { ...i, quantity: n };
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((s, i) => s + i.sale_price * i.quantity, 0);
  const discountAmount = discountType === "percentage" ? subtotal * (discountValue / 100)
    : discountType === "flat" ? discountValue : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async () => {
    if (!cart.length) { toast.error("Cart is empty"); return; }
    setProcessing(true);
    try {
      const res = await api.post("/sales", {
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        discount_type: discountType, discount_value: discountValue,
      });
      setLastSale(res.data);
      toast.success(`Sale complete - Rs. ${Number(res.data.total).toFixed(2)}`);
      setCart([]); setDiscountType("none"); setDiscountValue(0);
      const p = await api.get("/products"); setProducts(p.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  const stockClass = (p) => {
    if (p.quantity <= 0) return "pos-stock-badge pos-stock-out";
    if (p.quantity <= p.low_stock_threshold) return "pos-stock-badge pos-stock-low";
    return "pos-stock-badge pos-stock-ok";
  };

  return (
    <div className="page-root" data-testid="pos-page">
      <div className="page-header">
        <h1 className="page-title font-heading">Point of Sale</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Product grid Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div>
          <div className="search-wrap" style={{ marginBottom: 16 }}>
            <Search />
            <input ref={searchRef} data-testid="pos-search"
              placeholder="Scan barcode or search productsÃ¢â‚¬Â¦"
              value={searchQuery} onChange={e => handleSearchInput(e.target.value)} />
          </div>

          <div className="pos-product-grid">
            {filtered.map(p => (
              <div key={p.id}
                className={`pos-product-card${p.quantity <= 0 ? " out-of-stock" : p.quantity <= p.low_stock_threshold ? " low-stock" : ""}`}
                onClick={() => addToCart(p)}
                data-testid={`pos-product-${p.id}`}>
                <p className="pos-product-name">{p.name}</p>
                <p className="pos-product-sku">{p.sku}</p>
                <div className="pos-product-footer">
                  <span className="pos-price">Rs. {Number(p.sale_price).toFixed(2)}</span>
                  <span className={stockClass(p)}>{p.quantity <= 0 ? "Out" : p.quantity}</span>
                </div>
              </div>
            ))}
            {!filtered.length && !loading && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0", color: "var(--dash-muted)" }}>
                <ShoppingBag style={{ width: 36, height: 36, margin: "0 auto 10px", opacity: 0.25 }} />
                <p style={{ fontSize: 13 }}>No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Cart Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div className="cart-panel" style={{ position: "sticky", top: 78 }} data-testid="pos-cart">
          <div className="cart-header">
            <ShoppingBag style={{ width: 16, height: 16, color: "var(--brand-primary)", strokeWidth: 2 }} />
            <h3 className="cart-title">Cart</h3>
            {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
          </div>

          <div className="cart-body" style={{ maxHeight: 280 }}>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag />
                <p>Cart is empty</p>
              </div>
            ) : cart.map(item => (
              <div key={item.product_id} className="cart-item" data-testid={`cart-item-${item.product_id}`}>
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-price">Rs. {Number(item.sale_price).toFixed(2)} each</p>
                </div>
                <div className="cart-qty-row">
                  <button className="cart-qty-btn" onClick={() => updateQuantity(item.product_id, -1)}>
                    <Minus />
                  </button>
                  <span className="cart-qty-num">{item.quantity}</span>
                  <button className="cart-qty-btn" onClick={() => updateQuantity(item.product_id, 1)}>
                    <Plus />
                  </button>
                  <button className="cart-remove" onClick={() => setCart(c => c.filter(i => i.product_id !== item.product_id))}>
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            {/* Discount */}
            <div>
              <p className="form-label" style={{ marginBottom: 6 }}>Discount</p>
              <div className="cart-discount-row">
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger style={{ width: 120, height: 38, borderRadius: 10, borderColor: "var(--dash-border)" }} data-testid="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="percentage">Percent %</SelectItem>
                    <SelectItem value="flat">Flat Rs.</SelectItem>
                  </SelectContent>
                </Select>
                {discountType !== "none" && (
                  <input className="form-input" type="number" min="0"
                    data-testid="discount-value" value={discountValue}
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                    style={{ flex: 1 }} />
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="cart-totals">
              <div className="cart-row"><span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && <div className="cart-row discount"><span>Discount</span><span>-Rs. {discountAmount.toFixed(2)}</span></div>}
              <div className="cart-row total"><span>Total</span><span data-testid="pos-total">Rs. {total.toFixed(2)}</span></div>
            </div>

            <button className="checkout-btn" onClick={handleCheckout}
              disabled={!cart.length || processing} data-testid="checkout-btn">
              {processing ? "Processing..." : `Charge Rs. ${total.toFixed(2)}`}
            </button>

            {lastSale && (
              <button className="action-secondary" style={{ width: "100%", justifyContent: "center" }}
                onClick={() => window.print()} data-testid="print-receipt-btn">
                <Printer style={{ width: 14, height: 14 }} /> Print Receipt
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ A5 Print Invoice Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {lastSale && (
        <div id="receipt-content" className="print-only" data-testid="receipt-content">
          {settings?.print_format === "thermal" ? (
            /* Ã¢â€â‚¬Ã¢â€â‚¬ Thermal fallback (unchanged) Ã¢â€â‚¬Ã¢â€â‚¬ */
            <div className="receipt-thermal">
              <img src={settings?.logo || appLogo} alt="logo" className="receipt-logo" />
              <h2 className="receipt-shop-name">{settings?.shop_name || "Shop"}</h2>
              {settings?.address && <p className="receipt-address">{settings.address}</p>}
              {settings?.phone   && <p className="receipt-phone">{settings.phone}</p>}
              <div className="receipt-divider">--------------------------------</div>
              <p className="receipt-date">{new Date(lastSale.created_at).toLocaleString()}</p>
              <div className="receipt-divider">--------------------------------</div>
              <table className="receipt-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                  {lastSale.items.map((item, i) => (
                    <tr key={i}><td>{item.product_name}</td><td>{item.quantity}</td><td>Rs.{item.sale_price}</td><td>Rs.{item.subtotal}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="receipt-divider">--------------------------------</div>
              <div className="receipt-totals">
                <p>Subtotal: Rs.{lastSale.subtotal}</p>
                {lastSale.discount_amount > 0 && <p>Discount: -Rs.{lastSale.discount_amount}</p>}
                <p className="receipt-grand-total">Total: Rs.{lastSale.total}</p>
              </div>
              <p className="receipt-thanks">Thank you!</p>
            </div>
          ) : (
            /* Ã¢â€â‚¬Ã¢â€â‚¬ A5 Professional Invoice Ã¢â€â‚¬Ã¢â€â‚¬ */
            <div className="inv-a5">

              {/* Header: logo+name left, INVOICE stamp right */}
              <div className="inv-header">
                <div className="inv-brand">
                  {settings?.logo
                    ? <img src={settings.logo} alt="logo" className="inv-logo" />
                    : <img src={appLogo} alt="Sotima logo" className="inv-logo" />
                  }
                  <div>
                    <div className="inv-shop-name">{settings?.shop_name || "My Shop"}</div>
                    <div className="inv-shop-tagline">STATIONERY STUDIO</div>
                  </div>
                </div>
                <div className="inv-stamp-block">
                  <div className="inv-stamp">INVOICE</div>
                  <div className="inv-meta">
                    <span className="inv-inv-num">#{lastSale.invoice_number || `INV-${String(lastSale.id).padStart(4,"0")}`}</span>
                    <span>Date: {new Date(lastSale.created_at).toLocaleDateString("en-PK",{day:"2-digit",month:"short",year:"numeric"})}</span>
                    <span>Time: {new Date(lastSale.created_at).toLocaleTimeString("en-PK",{hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                </div>
              </div>

              <div className="inv-rule" />

              {/* FROM / BILL TO */}
              <div className="inv-parties">
                <div className="inv-party">
                  <div className="inv-party-label">FROM:</div>
                  <div className="inv-party-name">{settings?.shop_name || "My Shop"}</div>
                  {settings?.address && <div className="inv-party-detail">{settings.address}</div>}
                  {settings?.phone   && <div className="inv-party-detail">Contact: {settings.phone}</div>}
                </div>
                <div className="inv-party inv-party-right">
                  <div className="inv-party-label">BILL TO:</div>
                  <div className="inv-party-name">Walking Customer</div>
                  <div className="inv-party-detail">Payment: Cash</div>
                </div>
              </div>

              <div className="inv-rule" />

              {/* Items table */}
              <table className="inv-table">
                <thead>
                  <tr>
                    <th className="inv-th inv-th-desc">DESCRIPTION</th>
                    <th className="inv-th inv-th-num">QTY</th>
                    <th className="inv-th inv-th-num">PRICE</th>
                    <th className="inv-th inv-th-num">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {lastSale.items.map((item, i) => (
                    <tr key={i} className="inv-tr">
                      <td className="inv-td inv-td-desc">{item.product_name}</td>
                      <td className="inv-td inv-td-num">{String(item.quantity).padStart(2,"0")}</td>
                      <td className="inv-td inv-td-num">{Number(item.sale_price).toFixed(2)}</td>
                      <td className="inv-td inv-td-num inv-td-bold">{Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals block */}
              <div className="inv-totals-wrap">
                <div className="inv-totals">
                  <div className="inv-total-row">
                    <span className="inv-total-label">Subtotal:</span>
                    <span className="inv-total-val">Rs. {Number(lastSale.subtotal).toLocaleString("en-PK",{minimumFractionDigits:2})}</span>
                  </div>
                  {lastSale.discount_amount > 0 && (
                    <div className="inv-total-row">
                      <span className="inv-total-label">
                        Discount ({lastSale.discount_type === "percentage" ? `${lastSale.discount_value}%` : "Flat"}):
                      </span>
                      <span className="inv-total-val inv-discount">-Rs. {Number(lastSale.discount_amount).toLocaleString("en-PK",{minimumFractionDigits:2})}</span>
                    </div>
                  )}
                  <div className="inv-grand-row">
                    <span className="inv-grand-label">NET PAYABLE:</span>
                    <span className="inv-grand-val">Rs. {Number(lastSale.total).toLocaleString("en-PK",{minimumFractionDigits:2})}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="inv-terms">
                <div className="inv-terms-title">TERMS &amp; CONDITIONS:</div>
                <ul className="inv-terms-list">
                  <li>Sold items are not returnable without this original invoice.</li>
                  <li>Exchange possible within 3 days in original packaging.</li>
                </ul>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
