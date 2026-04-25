'use client';

import { CartProvider } from './CartContext';
import CartSidebar from './CartSidebar';
import { ReactNode } from 'react';

export default function CartWrapper({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartSidebar />
    </CartProvider>
  );
}
