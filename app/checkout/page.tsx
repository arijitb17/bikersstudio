'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { Loader2, MapPin, CreditCard, Tag, ShieldCheck } from 'lucide-react';
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
  image?: string;
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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/checkout');
    }
  }, [status, router]);

  useEffect(() => {
    if (items.length === 0 && status === 'authenticated') {
      router.push('/');
    }
  }, [items, status, router]);

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
        const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
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
const shipping = 500;                       // flat ₹500
const finalTotal = subtotal + shipping - discount;

  const handlePayment = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      alert('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddress,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.salePrice || item.price,
            selectedSize: item.selectedSize ?? null,
            selectedColor: item.selectedColor ?? null, // ← added
          })),
          subtotal,
          tax: 0,    
          shippingCost: 500,
          discount,
          total: finalTotal,
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error || 'Failed to create order');

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: Math.round(finalTotal * 100),
        currency: 'INR',
        name: "Biker's Studio",
        image: 'https://bikerstudioindia.store/logo.png',
        description: `Order #${orderData.orderNumber}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: RazorpayResponse) {
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

          const verifyData = await verifyResponse.json();
          if (verifyResponse.ok) {
            clearCart();
            sessionStorage.removeItem('appliedCoupon');
            router.push(`/orders/${orderData.orderId}?success=true`);
          } else {
            alert(verifyData.error || 'Payment verification failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        },
        theme: { color: '#000000' },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => setScriptError(true)}
      />
      {scriptError && (
        <p className="text-sm text-neutral-700 bg-neutral-100 border border-neutral-300 rounded-lg py-2 text-center mt-2 mx-4">
          Payment gateway failed to load. Please disable your ad blocker and refresh.
        </p>
      )}

      <div className="min-h-screen bg-neutral-50 py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-black mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-black" />
                    <h2 className="text-xl font-black uppercase tracking-tight text-black">Delivery Address</h2>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-sm text-black hover:text-yellow-600 font-medium transition-colors"
                  >
                    {showAddressForm ? 'Cancel' : '+ Add New'}
                  </button>
                </div>

                {showAddressForm && <AddressForm onSuccess={handleAddressAdded} />}

                {addresses.length === 0 && !showAddressForm ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-4 text-sm">No saved addresses</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="px-5 py-2.5 bg-black text-yellow-400 rounded-lg hover:bg-neutral-900 font-bold uppercase text-sm transition-colors"
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
                            ? 'border-black bg-yellow-50'
                            : 'border-neutral-200 hover:border-neutral-400'
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
                            <p className="font-semibold text-black">{address.fullName}</p>
                            <p className="text-sm text-neutral-600 mt-1">{address.street}</p>
                            <p className="text-sm text-neutral-600">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="text-sm text-neutral-600">Phone: {address.phone}</p>
                          </div>
                          {address.isDefault && (
                            <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full h-fit font-bold uppercase">
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
              <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200">
                <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4">Order Items</h2>
                <div className="space-y-4">
                  {items.map((item) => {
                    const price = item.salePrice || item.price;
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 pb-4 border-b border-neutral-200 last:border-b-0"
                      >
                        <div className="relative w-20 h-20 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.thumbnail}
                            alt={item.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-black">{item.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
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
                          <p className="text-sm text-neutral-500 mt-1">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-black mt-1 tabular-nums">
                            Rs. {price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-black tabular-nums">
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
              <div className="bg-white rounded-lg shadow-md p-6 border border-neutral-200 sticky top-4">
                <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Subtotal:</span>
                    <span className="font-semibold text-black tabular-nums">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Shipping:</span>
                    <span className="font-semibold text-black tabular-nums">Rs. 500.00</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>GST included in product prices</span>
                  </div>
                  {discount > 0 && appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-black" />
                        <span className="text-neutral-600">Coupon ({appliedCoupon.code}):</span>
                      </div>
                      <span className="font-semibold text-black tabular-nums">
                        - Rs. {discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-neutral-200 pt-3">
                    <div className="flex justify-between text-lg items-center">
                      <span className="font-black uppercase text-black">Total:</span>
                      <span className="font-black text-2xl text-black bg-yellow-400 px-2 py-1 rounded tabular-nums">
                        Rs. {finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing || !selectedAddress || !razorpayLoaded}
                  className="w-full bg-black hover:bg-neutral-900 disabled:bg-neutral-300 disabled:text-neutral-500 text-yellow-400 font-bold uppercase py-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-yellow-400"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : !razorpayLoaded ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading Payment Gateway...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay Rs. {finalTotal.toFixed(2)}
                    </>
                  )}
                </button>

                <p className="text-xs text-neutral-500 text-center mt-4 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
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