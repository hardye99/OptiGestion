"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Eye,
  Package,
  ShoppingCart,
  Calendar,
  Users,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";

const menuItems = [
  { href: "/", icon: Home, label: "Principal" },
  { href: "/inventario", icon: Package, label: "Inventario" },
  { href: "/productos", icon: ShoppingCart, label: "Productos" },
  { href: "/citas", icon: Calendar, label: "Citas" },
  { href: "/clientes", icon: Users, label: "Clientes" },
];

const menuItemsSecundarios = [
  { href: "/login", icon: LogIn, label: "Login" },
];

export function Sidebar() {
  // En móvil, la barra lateral será fija (w-20)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // FIX: Ajustar la clase principal para ser w-full en móvil (o pequeña) y expandirse solo en LG
  return (
    <aside
      className={`
        ${isCollapsed ? "w-20" : "w-64"} 
        lg:w-64 xl:w-64 
        bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white min-h-screen transition-all duration-300 flex flex-col shadow-2xl relative
        hidden md:block 
      `}
      style={{ minWidth: isCollapsed ? '5rem' : '16rem' }} // Asegurar el ancho
    >
      {/* El Sidebar es complejo. Si lo forzamos a ser visible en móvil sin un off-canvas,
          romperá el diseño. Volveremos a la configuración anterior con un ajuste: */}
      
      {/* Mantener la visibilidad solo en desktop (el enfoque off-canvas requiere más código) */}
      <div className={`
        ${isCollapsed ? "w-20" : "w-64"} 
        bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white 
        min-h-screen transition-all duration-300 flex flex-col shadow-2xl relative
        hidden lg:flex 
      `}>
          {/* Header con logo */}
          <div className="p-6 border-b border-blue-700/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm opacity-50"></div>
                <Eye className="h-8 w-8 text-blue-300 relative z-10" />
              </div>
              {!isCollapsed && (
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                    OptiGestión
                  </h2>
                  <p className="text-xs text-blue-300">Sistema de Gestión</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation principal */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="mb-6">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3 px-3">
                  Menú Principal
                </p>
              )}
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-blue-600 text-white shadow-lg scale-105"
                        : "text-blue-100 hover:bg-blue-700 hover:text-white hover:scale-105"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-blue-200" : ""} flex-shrink-0`} />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                    {active && !isCollapsed && (
                      <div className="ml-auto w-2 h-2 bg-blue-200 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Separador */}
            <div className="border-t border-blue-700/50 my-4"></div>

            {/* Menú secundario */}
            <div>
              {!isCollapsed && (
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3 px-3">
                  Sesión
                </p>
              )}
              {menuItemsSecundarios.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-blue-100 hover:bg-blue-700 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer con información */}
          {!isCollapsed && (
            <div className="p-4 border-t border-blue-700/50">
              <div className="bg-blue-700/30 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-blue-200 mb-1">Sistema OptiGestión</p>
                <p className="text-xs text-blue-300">v1.0.0</p>
              </div>
            </div>
          )}

          {/* Botón para colapsar/expandir */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-20 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
      </div>
    </aside>
  );
}
