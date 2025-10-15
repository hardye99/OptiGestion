"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/SideBar";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón de Menú Hamburguesa (Visible solo en pantallas pequeñas) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-blue-600 text-white rounded-lg shadow-lg lg:hidden transition hover:bg-blue-700"
        aria-label="Abrir Menú Principal"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Menú Flotante (Sidebar) */}
      <div
        className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Contenedor del Sidebar */}
        <div className="flex h-full w-full max-w-xs">
          <Sidebar />

          {/* Botón de Cerrar (dentro del área visible del menú) */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-200 transition"
            aria-label="Cerrar Menú"
          >
            <X className="h-8 w-8" />
          </button>
        </div>

        {/* Overlay para cerrar al hacer clic fuera */}
        <div 
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black opacity-50 z-[-1]"
        />
      </div>
    </>
  );
}
