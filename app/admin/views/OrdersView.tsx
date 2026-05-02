"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Package,
  MapPin,
  User,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Phone,
  Mail,
  Hash,
  Calendar,
  IndianRupee,
  ArrowUpDown,
  Save,
} from "lucide-react";
import { api } from "../api";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
type PaymentMethod = "CARD" | "UPI" | "NET_BANKING" | "COD" | "WALLET";

interface OrderAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface OrderUser {
  id: string;
  name: string | null;
  email: string;
}

interface OrderProduct {
  name: string;
  thumbnail: string;
}

interface OrderItem {
  id: string;
  productId: string;
  product: OrderProduct;
  quantity: number;
  price: string | number;
  subtotal: string | number;
  selectedSize?: string | null;  // ← add this
}

interface Order {
  id: string;
  orderNumber: string;
  user: OrderUser;
  address: OrderAddress;
  status: OrderStatus;
  subtotal: string | number;
  tax: string | number;
  shippingCost: string | number;
  discount: string | number;
  total: string | number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId: string | null;
  trackingNumber: string | null;
  courierService: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  createdAt: string | number;
  updatedAt: string | number;
  deliveredAt: string | number | null;
  items: OrderItem[];
}

interface PaginatedResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50 border border-amber-200",
    icon: <Clock size={12} />,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "text-blue-700",
    bg: "bg-blue-50 border border-blue-200",
    icon: <CheckCircle size={12} />,
  },
  PROCESSING: {
    label: "Processing",
    color: "text-violet-700",
    bg: "bg-violet-50 border border-violet-200",
    icon: <RefreshCw size={12} />,
  },
  SHIPPED: {
    label: "Shipped",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border border-indigo-200",
    icon: <Truck size={12} />,
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border border-emerald-200",
    icon: <CheckCircle size={12} />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50 border border-red-200",
    icon: <XCircle size={12} />,
  },
  REFUNDED: {
    label: "Refunded",
    color: "text-gray-700",
    bg: "bg-gray-50 border border-gray-200",
    icon: <AlertCircle size={12} />,
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50" },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50" },
  FAILED: { label: "Failed", color: "text-red-700", bg: "bg-red-50" },
  REFUNDED: { label: "Refunded", color: "text-gray-700", bg: "bg-gray-50" },
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: "Credit/Debit Card",
  UPI: "UPI",
  NET_BANKING: "Net Banking",
  COD: "Cash on Delivery",
  WALLET: "Wallet",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Robustly parse a date that may be:
 *  - an ISO string  ("2024-01-15T10:30:00.000Z")
 *  - a Unix timestamp in ms  (1776719629362)
 *  - a Unix timestamp in s   (1776719629)   — rarely, but guard anyway
 *  - already a Date object
 */
function parseDate(val: string | number | null | undefined): Date | null {
  if (val === null || val === undefined || val === "") return null;

  // Already a number — treat as Unix ms (Prisma serialises BigInt-style timestamps this way)
  if (typeof val === "number") {
    // Heuristic: timestamps before year 2001 in ms would be < 10^12
    const ms = val < 1e12 ? val * 1000 : val;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // String — try ISO parse first
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;

  // Fallback: maybe it's a numeric string
  const n = Number(val);
  if (!isNaN(n)) {
    const ms = n < 1e12 ? n * 1000 : n;
    const d2 = new Date(ms);
    return isNaN(d2.getTime()) ? null : d2;
  }

  return null;
}

function formatDate(val: string | number | null | undefined): string {
  const d = parseDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(val: string | number | null | undefined): string {
  const d = parseDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(val: string | number | null | undefined): string {
  const d = parseDate(val);
  if (!d) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "₹0.00";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function unwrapOrders(response: unknown): {
  orders: Order[];
  pagination?: PaginatedResponse["pagination"];
} {
  if (!response) return { orders: [] };
  const r = response as Record<string, unknown>;
  if (Array.isArray(r)) return { orders: r as Order[] };
  if (Array.isArray(r.data)) {
    return {
      orders: r.data as Order[],
      pagination: r.pagination as PaginatedResponse["pagination"],
    };
  }
  return { orders: [] };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-100",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_STATUS_CONFIG[status] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-100",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Order Detail Panel ───────────────────────────────────────────────────────

function OrderDetailPanel({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hasChanged = selectedStatus !== order.status;

  const handleSaveStatus = async () => {
    if (!hasChanged) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await onStatusChange(order.id, selectedStatus);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-0.5">
              Order Details
            </p>
            <h2 className="text-lg font-bold text-gray-900 font-mono">
              {order.orderNumber}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <XCircle size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Timeline */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>
                  Placed:{" "}
                  <strong className="text-gray-700">
                    {formatDate(order.createdAt)}
                  </strong>
                </span>
              </div>
              {order.deliveredAt && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span>
                    Delivered:{" "}
                    <strong className="text-gray-700">
                      {formatDate(order.deliveredAt)}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Status Change ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <RefreshCw size={12} /> Update Status
            </h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-600"
                >
                  {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveStatus}
                  disabled={!hasChanged || saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    hasChanged && !saving
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Save size={14} />
                  {saving ? "Saving…" : saveSuccess ? "Saved ✓" : "Save"}
                </button>
              </div>
              {saveError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {saveError}
                </p>
              )}
              {saveSuccess && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={11} /> Status updated successfully
                </p>
              )}
            </div>
          </section>

          {/* Customer */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <User size={12} /> Customer
            </h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-900">{order.user?.name || "—"}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail size={13} />
                <span>{order.user?.email || "—"}</span>
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <MapPin size={12} /> Shipping Address
            </h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-gray-900 mb-1">{order.address?.fullName}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                <Phone size={13} />
                <span>{order.address?.phone}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {order.address?.street},<br />
                {order.address?.city}, {order.address?.state} — {order.address?.pincode}
                <br />
                {order.address?.country}
              </p>
            </div>
          </section>

          {/* Items */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShoppingBag size={12} /> Items ({order.items?.length || 0})
            </h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {order.items?.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 ${
                    idx !== order.items.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.product?.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
  <p className="font-medium text-gray-900 text-sm truncate">
    {item.product?.name || "Unknown Product"}
  </p>
  {item.selectedSize && (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-0.5">
      Size: {item.selectedSize}
    </span>
  )}
  <p className="text-xs text-gray-400 mt-0.5">
    Qty: {item.quantity} × {formatCurrency(item.price)}
  </p>
</div>
                  <p className="font-semibold text-gray-900 text-sm flex-shrink-0">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <CreditCard size={12} /> Payment
            </h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Status</span>
                <PaymentBadge status={order.paymentStatus} />
              </div>
              {order.paymentId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                    {order.paymentId}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 mt-1 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
                {parseFloat(String(order.discount)) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>−{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-1">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tracking */}
          {(order.trackingNumber || order.courierService) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Truck size={12} /> Tracking
              </h3>
              <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                {order.courierService && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Courier</span>
                    <span className="font-medium text-gray-900">{order.courierService}</span>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tracking #</span>
                    <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Notes */}
          {(order.customerNotes || order.adminNotes) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Notes
              </h3>
              <div className="space-y-2">
                {order.customerNotes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-600 mb-1">Customer Note</p>
                    <p className="text-sm text-gray-700">{order.customerNotes}</p>
                  </div>
                )}
                {order.adminNotes && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-600 mb-1">Admin Note</p>
                    <p className="text-sm text-gray-700">{order.adminNotes}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main OrdersView ──────────────────────────────────────────────────────────

export const OrdersView: React.FC<{ refreshTrigger: number }> = ({
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [sortField, setSortField] = useState<"createdAt" | "total">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const LIMIT = 20;

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const response = await api.fetchData<unknown>(`/orders?${params}`);
      const { orders: fetched, pagination } = unwrapOrders(response);
      setOrders(fetched);
      if (pagination) {
        setTotalPages(pagination.totalPages);
        setTotalOrders(pagination.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ── Status update ──────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistically update local state so the badge in the table updates instantly
    const updateOrder = (o: Order): Order =>
      o.id === orderId ? { ...o, status: newStatus } : o;

    setOrders((prev) => prev.map(updateOrder));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }

    // Persist to backend
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      // Roll back on failure
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: o.status } : o)));
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || `HTTP ${response.status}`);
    }
  };

  // Client-side search + sort (on current page)
  const filtered = orders
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o.address?.city?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortField === "createdAt") {
        const aT = parseDate(a.createdAt)?.getTime() ?? 0;
        const bT = parseDate(b.createdAt)?.getTime() ?? 0;
        return sortDir === "asc" ? aT - bT : bT - aT;
      }
      const aTotal = parseFloat(String(a.total)) || 0;
      const bTotal = parseFloat(String(b.total)) || 0;
      return sortDir === "asc" ? aTotal - bTotal : bTotal - aTotal;
    });

  const toggleSort = (field: "createdAt" | "total") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Summary counts (from all loaded orders, irrespective of search)
  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading orders…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(statusFilter === s ? "" : s);
              setPage(1);
            }}
            className={`rounded-xl p-3 text-left transition-all border ${
              statusFilter === s
                ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} shadow-sm`
                : "bg-white border-gray-100 hover:border-gray-200"
            }`}
          >
            <p className="text-xl font-bold text-gray-900">{counts[s] || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {STATUS_CONFIG[s].label}
            </p>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search order #, customer, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-700 text-gray-700"
          />
        </div>

        <div className="relative">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | "");
              setPage(1);
            }}
            className="pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-600"
          >
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-400 flex items-center whitespace-nowrap">
          {filtered.length} of {totalOrders} orders
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Hash size={11} /> Order
                  </div>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <User size={11} /> Customer
                  </div>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <MapPin size={11} /> Delivery
                  </div>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <ShoppingBag size={11} /> Items
                  </div>
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort("total")}
                >
                  <div className="flex items-center gap-1">
                    <IndianRupee size={11} /> Total
                    <ArrowUpDown
                      size={10}
                      className={sortField === "total" ? "text-blue-500" : ""}
                    />
                  </div>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort("createdAt")}
                >
                  <div className="flex items-center gap-1">
                    <Calendar size={11} /> Date
                    <ArrowUpDown
                      size={10}
                      className={sortField === "createdAt" ? "text-blue-500" : ""}
                    />
                  </div>
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No orders found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {order.orderNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {order.user?.name || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.user?.email}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-gray-800 font-medium">
                        {order.address?.city || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.address?.state}
                        {order.address?.pincode
                          ? ` — ${order.address.pincode}`
                          : ""}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 3).map((item) =>
                            item.product?.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={item.id}
                                src={item.product.thumbnail}
                                alt={item.product.name}
                                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                              />
                            ) : (
                              <div
                                key={item.id}
                                className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center"
                              >
                                <Package size={10} className="text-gray-400" />
                              </div>
                            )
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {order.items?.length || 0} item
                          {(order.items?.length || 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <PaymentBadge status={order.paymentStatus} />
                        <p className="text-xs text-gray-400">
                          {PAYMENT_METHOD_LABELS[order.paymentMethod] ||
                            order.paymentMethod}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-gray-700 text-xs">
                        {formatDateShort(order.createdAt)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {formatTime(order.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="opacity-50 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p =
                  Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Panel ── */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};