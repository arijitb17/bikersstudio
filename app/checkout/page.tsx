// app/checkout/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { Loader2, MapPin, CreditCard, Tag } from 'lucide-react';
import Script from 'next/script';
import AddressForm from '@/components/AddressForm';
import Image from 'next/image';
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: { name: string; email: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}   
interface AppliedCoupon {
  code: string;
  discount: number;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/checkout');
    }
  }, [status, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && status === 'authenticated') {
      router.push('/');
    }
  }, [items, status, router]);

  // Load addresses and applied coupon
  useEffect(() => {
    if (status === 'authenticated') {
      loadAddresses();
      loadAppliedCoupon();
    }
  }, [status]);

  const loadAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses');
      const data = await response.json();
      
      if (response.ok) {
        setAddresses(data.addresses);
        // Auto-select default address
        const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr.id);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppliedCoupon = () => {
    const couponData = sessionStorage.getItem('appliedCoupon');
    if (couponData) {
      const parsed = JSON.parse(couponData);
      setAppliedCoupon(parsed);
      setDiscount(parsed.discount);
    }
  };

  const handleAddressAdded = (newAddress: Address) => {
    setAddresses([newAddress, ...addresses]);
    setSelectedAddress(newAddress.id);
    setShowAddressForm(false);
  };

  const subtotal = total;
  const tax = subtotal * 0.18; // 18% GST
  const shipping = subtotal > 1000 ? 0 : 50;
  const finalTotal = subtotal + tax + shipping - discount;

  const handlePayment = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order on backend
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addressId: selectedAddress,
          // Current — missing selectedSize
items: items.map(item => ({
  productId: item.productId,
  quantity: item.quantity,
  price: item.salePrice || item.price,
  selectedSize: item.selectedSize ?? null, 
})),
          subtotal,
          tax,
          shippingCost: shipping,
          discount,
          total: finalTotal,
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Initialize Razorpay
      const options: RazorpayOptions = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  amount: Math.round(finalTotal * 100),
  currency: 'INR',
  name: 'Your Store Name',
  description: `Order #${orderData.orderNumber}`,
  order_id: orderData.razorpayOrderId,
  handler: async function (response: RazorpayResponse) {  // now typed, not any
    const verifyResponse = await fetch('/api/orders/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderData.orderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });
    await verifyResponse.json();
    if (verifyResponse.ok) {
      clearCart();
      sessionStorage.removeItem('appliedCoupon');
      router.push(`/orders/${orderData.orderId}?success=true`);
    } else {
      alert('Payment verification failed. Please contact support.');
    }
  },
  prefill: { name: session?.user?.name || '', email: session?.user?.email || '' },
  theme: { color: '#DC2626' },
  modal: { ondismiss: () => { setIsProcessing(false); } },
};

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Address & Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <h2 className="text-xl font-semibold">Delivery Address</h2>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {showAddressForm ? 'Cancel' : '+ Add New'}
                  </button>
                </div>

                {showAddressForm && <AddressForm onSuccess={handleAddressAdded} />}

                {addresses.length === 0 && !showAddressForm ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No saved addresses</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Add New Address
                    </button>
                  </div>
                ) : !showAddressForm ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddress === address.id
                            ? 'border-red-600 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {address.fullName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {address.street}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="text-sm text-gray-600">
                              Phone: {address.phone}
                            </p>
                          </div>
                          {address.isDefault && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded h-fit">
                              Default
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {items.map((item) => {
                    const price = item.salePrice || item.price;
                    return (
                      <div key={item.productId} className="flex gap-4 pb-4 border-b">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                          <Image
    src={item.thumbnail}
    alt={item.name}
    fill
    className="object-contain"
  />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-red-600 mt-1">
                            Rs. {price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            Rs. {(price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
                    <span className="font-semibold">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (GST 18%):</span>
                    <span className="font-semibold">Rs. {tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-semibold">
                      {shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  {discount > 0 && appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Coupon ({appliedCoupon.code}):</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        - Rs. {discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-gray-900">Total:</span>
                      <span className="font-bold text-2xl text-red-600">
                        Rs. {finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing || !selectedAddress}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay Rs. {finalTotal.toFixed(2)}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Secure payment powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
