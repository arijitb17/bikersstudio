'use client';

import { useState } from 'react';
import { useCart } from './CartContext';
import { Check, ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    salePrice: number | null;
    thumbnail: string;
    brandName?: string;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      thumbnail: product.thumbnail,
      brandName: product.brandName,
    });

    // Show success state
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdded}
      className={`w-full font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 ${
        isAdded
          ? 'bg-green-600 text-white'
          : 'bg-red-600 hover:bg-red-700 text-white'
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
          Add to Cart
        </>
      )}
    </button>
  );
}
