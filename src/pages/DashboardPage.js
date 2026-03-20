import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Skeleton } from "components/ui/skeleton";
import { Button } from "components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { DollarSign, TrendingUp, Package, AlertTriangle, Languages } from "lucide-react";
import api from "lib/api";

const copy = {
  en: {
    title: "Dashboard",
    subtitle: "Your store at a glance",
    revenue: "Revenue",
    profit: "Profit",
    products: "Products",
    lowStock: "Low Stock",
    monthlyRevenue: "Monthly Revenue",
    topSelling: "Top Selling Items",
    noRevenue: "No revenue data yet. Make your first sale!",
    noSales: "No sales data yet",
  },
  ur: {
    title: "??? ????",
    subtitle: "?? ?? ???? ?? ?????",
    revenue: "????",
    profit: "?????",
    products: "???????",
    lowStock: "?? ?????",
    monthlyRevenue: "?????? ????",
    topSelling: "????? ????? ???? ???? ?????",
    noRevenue: "???? ?? ???? ?? ???? ???? ????",
    noSales: "???? ?? ????? ?? ???? ???? ????",
  },
};

function StatCard({ title, value, icon: Icon, tone }) {
  const toneStyle = {
    teal: { backgroundColor: "rgba(0,106,103,0.12)", color: "#006A67" },
    emerald: { backgroundColor: "rgba(16,185,129,0.12)", color: "#10B981" },
    orange: { backgroundColor: "rgba(249,115,22,0.12)", color: "#F97316" },
    gold: { backgroundColor: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  }[tone] || { backgroundColor: "rgba(0,106,103,0.12)", color: "#006A67" };

  return (
    <Card className="stat-card" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="stat-content">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value font-heading">{value}</p>
        </div>
        <div className="stat-icon" style={toneStyle}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="chart-tooltip-value" style={{ color: p.color }}>
          {p.name}: Rs. {Number(p.value).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en");
  const t = copy[lang];

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/stats"),
      api.get("/dashboard/revenue"),
      api.get("/dashboard/top-products"),
    ])
      .then(([s, r, tRes]) => {
        setStats(s.data);
        setRevenue(r.data);
        setTopProducts(tRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-loading">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-page ${lang === "ur" ? "lang-ur" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"} data-testid="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="font-heading dashboard-title">{t.title}</h1>
          <p className="dashboard-subtitle">{t.subtitle}</p>
        </div>
        <Button variant="outline" className="lang-toggle" onClick={() => setLang(lang === "en" ? "ur" : "en")}>
          <Languages className="lang-icon" />
          {lang === "en" ? "????" : "English"}
        </Button>
      </div>

      <div className="stat-grid">
        <StatCard title={t.revenue} value={`Rs. ${(stats?.total_revenue || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`} icon={DollarSign} tone="teal" />
        <StatCard title={t.profit} value={`Rs. ${(stats?.total_profit || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`} icon={TrendingUp} tone="emerald" />
        <StatCard title={t.products} value={stats?.total_products || 0} icon={Package} tone="gold" />
        <StatCard title={t.lowStock} value={stats?.low_stock_count || 0} icon={AlertTriangle} tone="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="chart-card">
          <CardHeader>
            <CardTitle className="text-base font-medium">{t.monthlyRevenue}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#006A67" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#006A67" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#006A67" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name={t.revenue} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">{t.noRevenue}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <CardTitle className="text-base font-medium">{t.topSelling}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} stroke="#6B7280" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} name={t.revenue} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">{t.noSales}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
