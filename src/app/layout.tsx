import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "ร้านค้าออนไลน์",
  description: "ระบบสั่งซื้อสินค้าออนไลน์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} antialiased`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
