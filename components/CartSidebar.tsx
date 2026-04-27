'use client';

import { useCart } from './CartContext';
import { X, Minus, Plus, ShoppingBag, Trash2, Tag, AlertCircle } from 'lucide-react';
import Image from 'next/image';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
interface Coupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscount?: number;
}
export default function CartSidebar() {
  const { items, itemCount, total, isOpen, closeCart, updateQuantity, removeFromCart } = useCart();
  const { status } = useSession();
  const router = useRouter();
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Calculate subtotal and final total
  const subtotal = total;
  const finalTotal = subtotal - discount;

  // Key changes for handleApplyCoupon function in CartSidebar

const handleApplyCoupon = async () => {
  if (!couponCode.trim()) {
    setCouponError('Please enter a coupon code');
    return;
  }

  setIsApplyingCoupon(true);
  setCouponError('');

  try {
    const response = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: couponCode.toUpperCase(),
        orderValue: subtotal,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setCouponError(data.error || 'Invalid coupon code');
      setIsApplyingCoupon(false);
      return;
    }

    // Calculate discount - values are already numbers from API
    let discountAmount = 0;
    if (data.coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * data.coupon.discountValue) / 100;
      if (data.coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, data.coupon.maxDiscount);
      }
    } else if (data.coupon.discountType === 'FIXED') {
      discountAmount = data.coupon.discountValue;
    }

    setAppliedCoupon(data.coupon);
    setDiscount(discountAmount);
    setCouponError('');
    setCouponCode(''); // Clear input after successful application
  } catch (error) {
    console.error('Error applying coupon:', error);
    setCouponError('Failed to apply coupon. Please try again.');
  } finally {
    setIsApplyingCoupon(false);
  }
};
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = () => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      // Store the current URL to redirect back after login
      const returnUrl = encodeURIComponent('/checkout');
      closeCart();
      router.push(`/auth/signin?callbackUrl=${returnUrl}`);
      return;
    }

    // If logged in, proceed to checkout
    if (appliedCoupon) {
      // Store coupon in session storage to use in checkout
      sessionStorage.setItem('appliedCoupon', JSON.stringify({
        code: appliedCoupon.code,
        discount: discount,
      }));
    }
    closeCart();
    router.push('/checkout');
  };

  return (
    <>
      {/* Subtle Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-[60] transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Shopping Cart ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-20 h-20 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-500 mb-6">
                  Add some products to get started!
                </p>
                <button
                  onClick={closeCart}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const price = item.salePrice || item.price;
                  const itemTotal = price * item.quantity;

                  return (
                    <div
                      key={item.productId}
                      className="flex gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow border border-gray-100"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-lg overflow-hidden">
                        <Image
                          src={item.thumbnail}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                          {item.name}
                        </h3>
                        {item.brandName && (
                          <p className="text-xs text-gray-500 uppercase mb-2">
                            {item.brandName}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-red-600">
                              Rs. {price.toFixed(2)}
                            </span>
                            {item.salePrice && (
                              <span className="text-sm text-gray-400 line-through">
                                Rs. {item.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="px-3 font-semibold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-600">Subtotal: </span>
                          <span className="text-sm font-bold text-gray-900">
                            Rs. {itemTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-white shadow-lg">
              <div className="space-y-4">
                {/* Coupon Section */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Tag className="w-4 h-4" />
                    Have a coupon code?
                  </label>
                  
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 uppercase text-gray-600 placeholder-gray-600"
                        disabled={isApplyingCoupon}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApplyingCoupon ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-sm text-green-600">
                          (-Rs. {discount.toFixed(2)})
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span className="text-sm text-red-600">{couponError}</span>
                    </div>
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      Rs. {subtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Discount:</span>
                      <span className="font-semibold text-green-600">
                        - Rs. {discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-lg pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-2xl text-red-600">
                      Rs. {finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Auth Status Message */}
                {status === 'unauthenticated' && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      You&apos;ll be redirected to sign in before checkout
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-center transition-all transform hover:scale-105 shadow-lg"
                  >
                    {status === 'unauthenticated' ? 'Sign In & Checkout' : 'Proceed to Checkout'}
                  </button>
                  <button
                    onClick={closeCart}
                    className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 rounded-xl border-2 border-gray-300 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
