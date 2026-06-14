import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brownis Cinta | E-Commerce",
  description: "Beli Brownis Cinta, Dessert Lumer, Roti Ring, dan aneka bakery dengan mudah.",
};

import { Providers } from "@/components/providers/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased text-gray-800 bg-[#F8F9FA]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
