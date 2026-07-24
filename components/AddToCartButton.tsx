'use client';

import { useState } from 'react';
import { useCart } from './CartContext';
import { Check, ShoppingCart, Ban } from 'lucide-react';

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

  const isBlocked = outOfStock || isAtStockLimit;
  const isDisabled = disabled || isBlocked || isAdded;

  const stateClasses = isAdded
    ? 'bg-black text-white cursor-default'
    : isBlocked
    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
    : disabled
    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
    : 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-black hover:from-yellow-300 hover:to-yellow-200 active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-yellow-400/30';

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`w-full font-bold text-sm uppercase tracking-wide py-4 rounded-xl
                  transition-all duration-300 ease-out
                  flex items-center justify-center gap-2
                  ${stateClasses}`}
    >
      {isAdded ? (
        <>
          <Check className="w-4 h-4" strokeWidth={3} />
          Added to Cart
        </>
      ) : isBlocked ? (
        <>
          <Ban className="w-4 h-4" />
          {isAtStockLimit ? `Max Stock (${stock})` : 'Out of Stock'}
        </>
      ) : disabled ? (
        <>
          <ShoppingCart className="w-4 h-4" />
          Select a Size
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </>
      )}
    </button>
  );
}