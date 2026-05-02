import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/Navbar';
import CartWrapper from "@/components/CartWrapper";
import AuthProvider from "@/components/AuthProvider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Biker's Studio",
  description: "Shop top-quality motorcycle parts, accessories, and gear. Find the best deals on bike components from leading brands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <AuthProvider>
        <CartWrapper>
        <Navbar />
        {children}
        
        </CartWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}