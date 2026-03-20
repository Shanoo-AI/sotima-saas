import { useState, useEffect, useRef } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, AlertTriangle, Package } from "lucide-react";
import JsBarcode from "jsbarcode";
import api from "lib/api";

function BarcodeDisplay({ value }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "EAN13", width: 1.5, height: 36, fontSize: 10, margin: 3, displayValue: true,
        });
      } catch (_) {}
    }
  }, [value]);
  return <svg ref={svgRef} style={{ maxWidth: 110 }} />;
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState({
    name: "", category: "", cost_price: "", sale_price: "", quantity: "", low_stock_threshold: "10",
  });

  const fetchData = () => {
    Promise.all([api.get("/products"), api.get("/categories")])
      .then(([p, c]) => { setProducts(p.data); setCategories(c.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: "", category: "", cost_price: "", sale_price: "", quantity: "", low_stock_threshold: "10" });
    setEditProduct(null);
  };

  const handleSave = async () => {
    try {
      const data = {
        name: form.name, category: form.category,
        cost_price: parseFloat(form.cost_price), sale_price: parseFloat(form.sale_price),
        quantity: parseInt(form.quantity), low_stock_threshold: parseInt(form.low_stock_threshold),
      };
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, data);
        toast.success("Product updated");
      } else {
        await api.post("/products", data);
        toast.success("Product added");
      }
      setDialogOpen(false); resetForm(); fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted"); fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await api.post("/categories", { name: newCategory.trim() });
      setNewCategory("");
      const c = await api.get("/categories");
      setCategories(c.data);
      toast.success("Category added");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add category");
    }
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name, category: product.category,
      cost_price: String(product.cost_price), sale_price: String(product.sale_price),
      quantity: String(product.quantity), low_stock_threshold: String(product.low_stock_threshold),
    });
    setDialogOpen(true);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.quantity <= p.low_stock_threshold).length;

  return (
    <div className="page-root" data-testid="inventory-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title font-heading">Inventory</h1>
          <p className="page-sub">
            {products.length} products
            {lowStockCount > 0 && (
              <span style={{ color: "#DC2626", marginLeft: 8, fontWeight: 600 }}>
                · {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <div className="page-actions">
          <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="action-primary" data-testid="add-product-btn">
                <Plus /> Add Product
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {editProduct ? "Edit Product" : "Add Product"}
                </DialogTitle>
              </DialogHeader>
              <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
                <div className="form-field">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" data-testid="product-name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pilot G2 Pen" />
                </div>
                <div className="form-field">
                  <label className="form-label">Category</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger data-testid="product-category" style={{ height: 42, borderRadius: 11, borderColor: "var(--dash-border)" }}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <input className="form-input" style={{ flex: 1 }} value={newCategory}
                      onChange={e => setNewCategory(e.target.value)} placeholder="New category name"
                      data-testid="new-category-input" />
                    <button className="action-secondary" onClick={handleAddCategory} data-testid="add-category-btn">Add</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Cost Price", key: "cost_price", test: "product-cost", type: "number" },
                    { label: "Sale Price", key: "sale_price", test: "product-price", type: "number" },
                    { label: "Quantity",   key: "quantity",   test: "product-qty",   type: "number" },
                    { label: "Low Stock Alert", key: "low_stock_threshold", test: "product-threshold", type: "number" },
                  ].map(f => (
                    <div className="form-field" key={f.key}>
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" type={f.type} min="0" step={f.key.includes("price") ? "0.01" : "1"}
                        data-testid={f.test} value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <button className="form-submit" style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleSave} data-testid="save-product-btn">
                  {editProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="search-wrap" style={{ marginBottom: 16 }}>
        <Search />
        <input data-testid="inventory-search" placeholder="Search by name, SKU, or category…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="data-card">
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th className="right">Cost</th>
                <th className="right">Price</th>
                <th className="right">Stock</th>
                <th>Barcode</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id}
                  className={product.quantity <= product.low_stock_threshold ? "row-warn" : ""}
                  data-testid={`product-row-${product.id}`}>
                  <td style={{ fontWeight: 600 }}>{product.name}</td>
                  <td className="mono">{product.sku}</td>
                  <td>
                    <span className="badge badge-default">{product.category || "Uncategorized"}</span>
                  </td>
                  <td className="right">₨ {product.cost_price.toFixed(2)}</td>
                  <td className="right" style={{ fontWeight: 600 }}>₨ {product.sale_price.toFixed(2)}</td>
                  <td className="right">
                    {product.quantity <= product.low_stock_threshold ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#DC2626", fontWeight: 700 }}>
                        <AlertTriangle style={{ width: 12, height: 12 }} />
                        {product.quantity}
                      </span>
                    ) : product.quantity}
                  </td>
                  <td><BarcodeDisplay value={product.barcode} /></td>
                  <td className="right">
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                      <button className="icon-btn" onClick={() => openEdit(product)} data-testid={`edit-product-${product.id}`}>
                        <Pencil />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(product.id)} data-testid={`delete-product-${product.id}`}>
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-empty">
                    <Package />
                    {loading ? "Loading products…" : "No products found. Add your first product!"}
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