'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number | { toNumber: () => number };
  subtotal: number | { toNumber: () => number };
  selectedSize?: string | null;
  selectedColor?: string | null; // ← added
  product: {
    name: string;
    thumbnail: string;
    slug: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number | { toNumber: () => number };
  subtotal: number | { toNumber: () => number };
  tax: number | { toNumber: () => number };
  shippingCost: number | { toNumber: () => number };
  discount: number | { toNumber: () => number };
  createdAt: string;
  deliveredAt: string | null;
  trackingNumber: string | null;
  courierService: string | null;
  items: OrderItem[];
  address: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
}

// Monochrome + yellow scale: progression darkens as the order advances,
// yellow marks the positive terminal state (Delivered), dark marks a closed/negative state.
const statusColors = {
  PENDING: 'bg-neutral-100 text-neutral-700',
  CONFIRMED: 'bg-neutral-200 text-neutral-800',
  PROCESSING: 'bg-neutral-300 text-black',
  SHIPPED: 'bg-black text-yellow-400',
  DELIVERED: 'bg-yellow-400 text-black',
  CANCELLED: 'bg-neutral-800 text-white',
  REFUNDED: 'bg-neutral-200 text-neutral-600',
};

const statusIcons = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
  REFUNDED: XCircle,
};

export default function OrdersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/orders');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') loadOrders();
  }, [status]);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/user/orders');
      const json = await response.json();
      if (response.ok) {
        const orders = json?.data ?? [];
        setOrders(Array.isArray(orders) ? orders : []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  type DecimalLike = number | string | { toNumber: () => number };
  const toNumber = (value: DecimalLike): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return value.toNumber();
  };

  const filteredOrders =
    filter === 'ALL' ? orders : orders.filter((order) => order.status === filter);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">My Orders</h1>
          <Link href="/profile" className="text-black hover:text-yellow-600 font-medium underline decoration-yellow-400 underline-offset-4">
            Back to Profile
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto border border-neutral-200">
          <div className="flex border-b border-neutral-200">
            {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${
                  filter === s
                    ? 'border-b-2 border-yellow-400 text-black'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                {s === 'ALL' ? 'All Orders' : s}
                <span className="ml-2 text-xs bg-black text-yellow-400 px-2 py-1 rounded-full font-mono">
                  {s === 'ALL' ? orders.length : orders.filter((o) => o.status === s).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-neutral-200">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-xl font-black uppercase text-black mb-2">
              {filter === 'ALL' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
            </h2>
            <p className="text-neutral-600 mb-6">
              {filter === 'ALL'
                ? 'Start shopping to see your orders here'
                : `You don't have any ${filter.toLowerCase()} orders`}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-900 transition-colors font-bold uppercase text-sm border border-transparent hover:border-yellow-400"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-neutral-200">
                  {/* Order Header */}
                  <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-neutral-500 font-mono">Order Number</p>
                          <p className="font-semibold text-black">{order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 font-mono">Order Date</p>
                          <p className="font-semibold text-black flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 font-mono">Total Amount</p>
                          <p className="font-black text-black flex items-center tabular-nums">
                            <IndianRupee className="w-3 h-3" />
                            {toNumber(order.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            statusColors[order.status as keyof typeof statusColors]
                          }`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {order.status}
                        </span>
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-4 py-2 text-black hover:bg-yellow-50 rounded-lg font-medium transition-colors border border-transparent hover:border-yellow-300"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="space-y-4 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="relative w-20 h-20 bg-neutral-100 rounded-lg flex-shrink-0">
                            <Image
                              src={item.product.thumbnail}
                              alt={item.product.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="font-semibold text-black hover:text-yellow-600"
                            >
                              {item.product.name}
                            </Link>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedSize && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700 font-mono">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                              {item.selectedColor && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700 font-mono">
                                  Color: {item.selectedColor}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-600 mt-1">
                              Qty: {item.quantity} × Rs. {toNumber(item.price).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-black tabular-nums">
                              Rs. {toNumber(item.subtotal).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address */}
                    <div className="border-t border-neutral-200 pt-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-black">{order.address.fullName}</p>
                          <p className="text-neutral-600">
                            {order.address.street}, {order.address.city}
                          </p>
                          <p className="text-neutral-600">
                            {order.address.state} - {order.address.pincode}
                          </p>
                          <p className="text-neutral-600">Phone: {order.address.phone}</p>
                        </div>
                      </div>
                      {order.trackingNumber && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-neutral-400" />
                          <div>
                            <span className="text-neutral-600">Tracking: </span>
                            <span className="font-medium text-black">{order.trackingNumber}</span>
                            {order.courierService && (
                              <span className="text-neutral-600"> via {order.courierService}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}