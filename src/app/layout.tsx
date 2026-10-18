import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Executive Dark CRM 2.0 | Sistema Comercial Empresarial",
  description: "Plataforma comercial general, operativa y segura para gestión de ventas, clientes, embudo y cotizaciones.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-[#0B1118] text-[#F4F7FA] font-sans antialiased selection:bg-[#28B8AA] selection:text-[#0B1118]">
        {children}
      </body>
    </html>
  );
}
