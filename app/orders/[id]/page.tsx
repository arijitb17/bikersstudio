// app/orders/[id]/page.tsx

'use client';

import { useEffect, useState, use} from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  MapPin,
  IndianRupee,
  CheckCircle,
  ArrowLeft,
  Truck,
  Phone,
  Mail
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
  paymentMethod: string;
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const { id } = use(params);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/orders');
    }
  }, [status, router]);

  // Single effect — no useCallback needed with React Compiler
  useEffect(() => {
    if (status !== 'authenticated') return;

    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/user/orders/${id}`);
        const data = await response.json();
        if (response.ok) {
          setOrder(data.order);
        } else {
          router.push('/orders');
        }
      } catch (error) {
        console.error('Error loading order:', error);
        router.push('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [status, id, router]);

  type DecimalLike = number | string | { toNumber: () => number };

  const toNumber = (value: DecimalLike): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return value.toNumber();
  };
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const statusSteps = [
    { key: 'CONFIRMED', label: 'Order Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50 pt-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Payment Successful!</p>
              <p className="text-sm text-green-700">Your order has been placed successfully.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/orders"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Progress */}
            {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Order Status</h2>
                <div className="relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
                    <div 
                      className="h-full bg-green-600 transition-all duration-500"
                      style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                  <div className="relative flex justify-between">
                    {statusSteps.map((step, index) => (
                      <div key={step.key} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index <= currentStepIndex
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {index < currentStepIndex ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <p className={`text-xs mt-2 text-center max-w-[80px] ${
                          index <= currentStepIndex ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Tracking Number</p>
                        <p className="text-sm text-gray-600">{order.trackingNumber}</p>
                        {order.courierService && (
                          <p className="text-xs text-gray-500 mt-1">via {order.courierService}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
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
                        className="font-semibold text-gray-900 hover:text-red-600"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: Rs. {toNumber(item.price).toFixed(2)}
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
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold">Shipping Address</h2>
              </div>
              <div className="text-gray-700">
                <p className="font-semibold text-gray-900">{order.address.fullName}</p>
                <p className="mt-1">{order.address.street}</p>
                <p>{order.address.city}, {order.address.state}</p>
                <p>{order.address.pincode}</p>
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{order.address.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">Rs. {toNumber(order.subtotal).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (GST):</span>
                  <span className="font-semibold">Rs. {toNumber(order.tax).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">
                    {toNumber(order.shippingCost) === 0 ? 'FREE' : `Rs. ${toNumber(order.shippingCost).toFixed(2)}`}
                  </span>
                </div>

                {toNumber(order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount:</span>
                    <span className="font-semibold text-green-600">
                      - Rs. {toNumber(order.discount).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-2xl text-red-600 flex items-center">
                      <IndianRupee className="w-5 h-5" />
                      {toNumber(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold">{order.paymentMethod}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-semibold ${
                    order.paymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-semibold">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                {order.deliveredAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivered On:</span>
                    <span className="font-semibold">
                      {new Date(order.deliveredAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-500 text-center">
                  Need help? Contact our support team
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-red-600">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:support@yourstore.com" className="hover:underline">
                    support@yourstore.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}