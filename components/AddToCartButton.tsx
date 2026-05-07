'use client';

import { useState } from 'react';
import { useCart } from './CartContext';
import { Check, ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  disabled?: boolean;
  outOfStock?: boolean;
  stock?: number;
  product: {
    id: string;
    name: string;
    price: number;
    salePrice: number | null;
    thumbnail: string;
    brandName?: string;
    selectedSize?: string;
    selectedColor?: string | null;
  };
}

export default function AddToCartButton({
  product,
  disabled = false,
  outOfStock = false,
  stock = Infinity,
}: AddToCartButtonProps) {
  const { addToCart, items } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const cartId = [product.id, product.selectedColor, product.selectedSize]
    .filter(Boolean)
    .join('-');

  const currentQtyInCart = items.find((i) => i.id === cartId)?.quantity ?? 0;
  const isAtStockLimit = currentQtyInCart >= stock;

  const handleAddToCart = () => {
    if (disabled || outOfStock || isAtStockLimit) return;

    const tags = [product.selectedColor, product.selectedSize].filter(Boolean);
    const displayName =
      tags.length > 0 ? `${product.name} (${tags.join(', ')})` : product.name;

    addToCart({
      id: cartId,
      productId: product.id,
      name: displayName,
      price: product.price,
      salePrice: product.salePrice,
      thumbnail: product.thumbnail,
      brandName: product.brandName,
      selectedSize: product.selectedSize,
      selectedColor: product.selectedColor ?? undefined,
      maxStock: stock,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const isDisabled = disabled || outOfStock || isAdded || isAtStockLimit;

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`w-full font-bold py-4 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2
        ${
          isAdded
            ? 'bg-green-600 text-white cursor-default'
            : outOfStock || isAtStockLimit
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
          {outOfStock
            ? 'Out of Stock'
            : isAtStockLimit
            ? `Max stock reached (${stock})`
            : disabled
            ? 'Select a size first'
            : 'Add to Cart'}
        </>
      )}
    </button>
  );
}