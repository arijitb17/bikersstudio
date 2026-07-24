'use client';

import { useEffect, useState, use } from 'react';
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
  Mail,
} from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number | { toNumber: () => number };
  subtotal: number | { toNumber: () => number };
  selectedSize?: string | null;
  selectedColor?: string | null;
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

  useEffect(() => {
    if (status !== 'authenticated') return;

    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/user/orders/${id}`);
        const json = await response.json();
        if (response.ok) {
          setOrder(json?.order ?? json ?? null);
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
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!order) return null;

  const statusSteps = [
    { key: 'CONFIRMED', label: 'Order Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStepIndex = statusSteps.findIndex((step) => step.key === order.status);

  return (
    <div className="min-h-screen bg-neutral-50 pt-40 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showSuccess && (
          <div className="mb-6 bg-yellow-400 border border-black rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-black" />
            <div>
              <p className="font-black uppercase text-black">Payment Successful!</p>
              <p className="text-sm text-neutral-800">Your order has been placed successfully.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/orders')}
              className="flex items-center gap-2 text-black hover:text-yellow-600 mb-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">Order Details</h1>
            <p className="text-neutral-600 mt-1 font-mono">Order #{order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Status Progress */}
            {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200">
                <h2 className="text-xl font-black uppercase tracking-tight text-black mb-6">Order Status</h2>
                <div className="relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-neutral-200">
                    <div
                      className="h-full bg-black transition-all duration-500"
                      style={{
                        width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="relative flex justify-between">
                    {statusSteps.map((step, index) => (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index <= currentStepIndex
                              ? 'bg-black text-yellow-400'
                              : 'bg-neutral-200 text-neutral-400'
                          }`}
                        >
                          {index < currentStepIndex ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <p
                          className={`text-xs mt-2 text-center max-w-[80px] ${
                            index <= currentStepIndex
                              ? 'text-black font-medium'
                              : 'text-neutral-500'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-6 p-4 bg-neutral-100 rounded-lg border border-neutral-200">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-black" />
                      <div>
                        <p className="text-sm font-medium text-black">Tracking Number</p>
                        <p className="text-sm text-neutral-700 font-mono">{order.trackingNumber}</p>
                        {order.courierService && (
                          <p className="text-xs text-neutral-500 mt-1">via {order.courierService}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200">
              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-neutral-200 last:border-b-0">
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
                      <p className="text-sm text-neutral-600 mt-1">Quantity: {item.quantity}</p>
                      <p className="text-sm text-neutral-600">
                        Price: Rs. {toNumber(item.price).toFixed(2)}
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
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-black" />
                <h2 className="text-xl font-black uppercase tracking-tight text-black">Shipping Address</h2>
              </div>
              <div className="text-neutral-700">
                <p className="font-semibold text-black">{order.address.fullName}</p>
                <p className="mt-1">{order.address.street}</p>
                <p>
                  {order.address.city}, {order.address.state}
                </p>
                <p>{order.address.pincode}</p>
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <span>{order.address.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200 sticky top-4">
              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal:</span>
                  <span className="font-semibold text-black tabular-nums">
                    Rs. {toNumber(order.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tax (GST):</span>
                  <span className="font-semibold text-black tabular-nums">
                    Rs. {toNumber(order.tax).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping:</span>
                  <span className="font-semibold text-black tabular-nums">
                    {toNumber(order.shippingCost) === 0
                      ? 'FREE'
                      : `Rs. ${toNumber(order.shippingCost).toFixed(2)}`}
                  </span>
                </div>
                {toNumber(order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Discount:</span>
                    <span className="font-semibold text-black tabular-nums">
                      - Rs. {toNumber(order.discount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between text-lg items-center">
                    <span className="font-black uppercase text-black">Total:</span>
                    <span className="font-black text-2xl text-black flex items-center bg-yellow-400 px-2 py-1 rounded tabular-nums">
                      <IndianRupee className="w-5 h-5" />
                      {toNumber(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 font-mono">Payment Method:</span>
                  <span className="font-semibold text-black">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 font-mono">Payment Status:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                      order.paymentStatus === 'COMPLETED'
                        ? 'bg-yellow-400 text-black'
                        : 'bg-neutral-200 text-neutral-800'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 font-mono">Order Date:</span>
                  <span className="font-semibold text-black">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {order.deliveredAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 font-mono">Delivered On:</span>
                    <span className="font-semibold text-black">
                      {new Date(order.deliveredAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 text-center uppercase font-mono">
                  Need help? Contact our support team
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-black">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:bikerstudio.com@gmail.com" className="hover:text-yellow-600 hover:underline decoration-yellow-400 underline-offset-4">
                    bikerstudio.com@gmail.com
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