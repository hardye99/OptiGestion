import "./globals.css";
import { Sidebar } from "@/components/SideBar";
import type { ReactNode } from "react";

export const metadata = {
  title: "OptiGestión",
  description: "Sistema de gestión para ópticas",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
