'use client';

import { useState } from 'react';
import { useCart } from './CartContext';
import { Check, ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  disabled?: boolean;
  product: {
    id: string;
    name: string;
    price: number;
    salePrice: number | null;
    thumbnail: string;
    brandName?: string;
    selectedSize?: string;
  };
}

export default function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    if (disabled) return;

    addToCart({
      id: product.selectedSize ? `${product.id}-${product.selectedSize}` : product.id,
      productId: product.id,
      name: product.selectedSize ? `${product.name} (${product.selectedSize})` : product.name,
      price: product.price,
      salePrice: product.salePrice,
      thumbnail: product.thumbnail,
      brandName: product.brandName,
      selectedSize: product.selectedSize,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const isDisabled = disabled || isAdded;

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`w-full font-bold py-4 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2
        ${isAdded
          ? 'bg-green-600 text-white cursor-default'
          : disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 transform'
        }`}
    >
      {isAdded ? (
        <>
          <Check className="w-5 h-5" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          {disabled ? 'Select a size first' : 'Add to Cart'}
        </>
      )}
    </button>
  );
}