// app/orders/page.tsx

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
  IndianRupee
} from 'lucide-react';
import Image from 'next/image';
interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number | { toNumber: () => number };
  subtotal: number | { toNumber: () => number };
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

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/orders');
    }
  }, [status, router]);

  // Load orders
  useEffect(() => {
    if (status === 'authenticated') {
      loadOrders();
    }
  }, [status]);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/user/orders');
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert Decimal to number
 type DecimalLike = number | string | { toNumber: () => number };

const toNumber = (value: DecimalLike): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return value.toNumber();
};
  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <Link
            href="/profile"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Back to Profile
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto">
          <div className="flex border-b">
            {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${
                  filter === status
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status === 'ALL' ? 'All Orders' : status}
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {status === 'ALL' 
                    ? orders.length 
                    : orders.filter(o => o.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'ALL' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'ALL' 
                ? "Start shopping to see your orders here"
                : `You don't have any ${filter.toLowerCase()} orders`}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-gray-600">Order Number</p>
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Order Date</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Amount</p>
                          <p className="font-semibold text-gray-900 flex items-center">
                            <IndianRupee className="w-3 h-3" />
                            {toNumber(order.total).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[order.status as keyof typeof statusColors]
                        }`}>
                          <StatusIcon className="w-4 h-4" />
                          {order.status}
                        </span>
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
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
                          
                          <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                            <Image src={item.product.thumbnail} alt={item.product.name} fill className="object-contain" />
                          </div>

                          <div className="flex-1">
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="font-semibold text-gray-900 hover:text-red-600"
                            >
                              {item.product.name}
                            </Link>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × Rs. {toNumber(item.price).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              Rs. {toNumber(item.subtotal).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address */}
                    <div className="border-t pt-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{order.address.fullName}</p>
                          <p className="text-gray-600">
                            {order.address.street}, {order.address.city}
                          </p>
                          <p className="text-gray-600">
                            {order.address.state} - {order.address.pincode}
                          </p>
                          <p className="text-gray-600">Phone: {order.address.phone}</p>
                        </div>
                      </div>

                      {order.trackingNumber && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-600">Tracking: </span>
                            <span className="font-medium text-gray-900">{order.trackingNumber}</span>
                            {order.courierService && (
                              <span className="text-gray-600"> via {order.courierService}</span>
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
