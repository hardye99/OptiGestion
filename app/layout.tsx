import "./globals.css";
import type { ReactNode } from "react";
import { AuthAppLayout } from '@/components/AuthAppLayout'; // <-- Importa el nuevo componente

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
      {/* <body> ya no tiene la clase 'flex' ni la estructura visual */}
      <body>
        <AuthAppLayout>
          {children}
        </AuthAppLayout>
      </body>
    </html>
  );
}
