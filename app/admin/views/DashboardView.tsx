"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Package,
  CreditCard,
  Users,
  BarChart3,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
  pendingOrders: number;
  lowStock: number;
}

interface RevenuePoint {
  month: string;
  revenue: number;
  orders: number;
}

interface OrderStatusPoint {
  name: string;
  value: number;
  color: string;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface WeeklyPoint {
  day: string;
  orders: number;
}

interface ChartData {
  revenueData: RevenuePoint[];
  orderStatusData: OrderStatusPoint[];
  topProducts: TopProduct[];
  weeklyOrders: WeeklyPoint[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function pct(a: number, b: number): string {
  if (!b) return "0%";
  return `${((a / b) * 100).toFixed(1)}%`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  // Unwrap { data: ... } envelope produced by ok() helper
  return "data" in json ? (json.data as T) : (json as T);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: { value: string; up: boolean };
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  accent,
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <div
        className={`w-9 h-9 ${accent} rounded-lg flex items-center justify-center`}
      >
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
    {trend && (
      <div className="flex items-center gap-1 text-xs">
        {trend.up ? (
          <TrendingUp size={13} className="text-green-500" />
        ) : (
          <TrendingDown size={13} className="text-red-400" />
        )}
        <span className={trend.up ? "text-green-600" : "text-red-500"}>
          {trend.value}
        </span>
        <span className="text-gray-400">vs last month</span>
      </div>
    )}
  </div>
);

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-gray-100 rounded" />
      <div className="w-9 h-9 bg-gray-100 rounded-lg" />
    </div>
    <div className="h-8 w-28 bg-gray-100 rounded" />
    <div className="h-3 w-32 bg-gray-100 rounded" />
  </div>
);

const SkeletonChart: React.FC<{ height?: number }> = ({ height = 260 }) => (
  <div
    className="bg-gray-100 rounded-xl animate-pulse"
    style={{ height }}
  />
);

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  currency?: boolean;
}> = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      {label && (
        <p className="text-gray-500 mb-1 font-medium">{label}</p>
      )}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}:{" "}
          {currency ? formatINR(p.value) : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ─── Chart components (accept data as props) ──────────────────────────────────

const RevenueChart: React.FC<{ data: RevenuePoint[] }> = ({ data }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">
          Revenue & Orders
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: "#2563eb" }}
          />
          Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: "#7c3aed" }}
          />
          Orders
        </span>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="rev"
          orientation="left"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          width={52}
        />
        <YAxis
          yAxisId="ord"
          orientation="right"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<ChartTooltip currency />} />
        <Area
          yAxisId="rev"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#revGrad)"
          dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Area
          yAxisId="ord"
          type="monotone"
          dataKey="orders"
          name="Orders"
          stroke="#7c3aed"
          strokeWidth={2}
          fill="url(#ordGrad)"
          dot={{ r: 3, fill: "#7c3aed", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const OrderStatusChart: React.FC<{ data: OrderStatusPoint[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <h2 className="text-base font-semibold text-gray-800 mb-1">
        Order Status
      </h2>
      <p className="text-xs text-gray-400 mb-4">All-time breakdown</p>
      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, name) => {
                const num = typeof v === "number" ? v : Number(v);
                return [`${num} (${pct(num, total)})`, String(name)];
              }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        {data.map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-2 text-xs text-gray-600"
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: d.color }}
            />
            <span className="truncate">{d.name}</span>
            <span className="ml-auto font-semibold text-gray-800">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeeklyOrdersChart: React.FC<{ data: WeeklyPoint[] }> = ({ data }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <h2 className="text-base font-semibold text-gray-800 mb-1">
      Orders This Week
    </h2>
    <p className="text-xs text-gray-400 mb-4">Daily order count</p>
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        barSize={24}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0f0ee"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: "#f3f4f6" }} content={<ChartTooltip />} />
        <Bar
          dataKey="orders"
          name="Orders"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const TopProductsTable: React.FC<{ products: TopProduct[] }> = ({
  products,
}) => {
  const maxSales = Math.max(...products.map((p) => p.sales), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-1">
        Top Products
      </h2>
      <p className="text-xs text-gray-400 mb-4">By units sold</p>
      <div className="space-y-3">
        {products.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-300 w-4 text-right">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {p.name}
                </p>
                <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {p.sales} sold
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${(p.sales / maxSales) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-800 w-24 text-right flex-shrink-0">
              {formatINR(p.revenue)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Dashboard View ──────────────────────────────────────────────────────

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await fetchJson<DashboardStats>(
        "/api/admin/dashboard/stats"
      );
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const data = await fetchJson<ChartData>(
        "/api/admin/dashboard/charts"
      );
      setCharts(data);
    } catch {
      // Charts are non-critical; fail silently — keep the page usable
      setCharts(null);
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadCharts();
  }, [loadStats, loadCharts]);

  // ── Stat card definitions (depend on live stats) ──────────────────────────

  const statCards: (StatCardProps & { key: string })[] = stats
    ? [
        {
          key: "revenue",
          title: "Total Revenue",
          value: formatINR(stats.revenue),
          icon: BarChart3,
          accent: "bg-blue-600",
        },
        {
          key: "orders",
          title: "Total Orders",
          value: stats.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          accent: "bg-violet-600",
        },
        {
          key: "users",
          title: "Total Users",
          value: stats.totalUsers.toLocaleString(),
          icon: Users,
          accent: "bg-teal-600",
        },
        {
          key: "products",
          title: "Total Products",
          value: stats.totalProducts.toLocaleString(),
          icon: Package,
          accent: "bg-amber-500",
        },
        {
          key: "pending",
          title: "Pending Orders",
          value: stats.pendingOrders.toLocaleString(),
          icon: AlertCircle,
          accent: "bg-orange-500",
        },
        {
          key: "lowstock",
          title: "Low Stock Items",
          value: stats.lowStock.toLocaleString(),
          icon: CreditCard,
          accent: "bg-red-500",
        },
      ]
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Live store overview
          </p>
        </div>
        <button
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
          <button
            onClick={() => loadStats()}
            className="ml-auto underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          : statCards.map(({ key, ...card }) => (
              <StatCard key={key} {...card} />
            ))}
      </div>

      {/* Revenue Chart */}
      {chartsLoading ? (
        <SkeletonChart height={320} />
      ) : charts?.revenueData?.length ? (
        <RevenueChart data={charts.revenueData} />
      ) : null}

      {/* Middle row */}
      {chartsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonChart height={300} />
          <SkeletonChart height={300} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts?.orderStatusData?.length ? (
            <OrderStatusChart data={charts.orderStatusData} />
          ) : null}
          {charts?.weeklyOrders?.length ? (
            <WeeklyOrdersChart data={charts.weeklyOrders} />
          ) : null}
        </div>
      )}

      {/* Top Products */}
      {chartsLoading ? (
        <SkeletonChart height={260} />
      ) : charts?.topProducts?.length ? (
        <TopProductsTable products={charts.topProducts} />
      ) : null}
    </div>
  );
};

export default DashboardView;