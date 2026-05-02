'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  quantity: number;
  brandName?: string;
  selectedSize?: string;  // ← add this
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isOpen: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopping-cart', JSON.stringify(items));
  }, [items]);

const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
  setItems(currentItems => {
    // deduplicate on id (not productId) so M and L are separate lines
    const existingItem = currentItems.find(item => item.id === newItem.id);

    if (existingItem) {
      return currentItems.map(item =>
        item.id === newItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [...currentItems, { ...newItem, quantity: 1 }];
  });

  setIsOpen(true);
};

const removeFromCart = (id: string) => {
  setItems(currentItems => currentItems.filter(item => item.id !== id));
};

const updateQuantity = (id: string, quantity: number) => {
  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }
  setItems(currentItems =>
    currentItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    )
  );
};

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        isOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
