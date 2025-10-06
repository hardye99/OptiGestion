"use client";

import Link from "next/link";
import { Eye, Sparkles, Users, Calendar, Package, TrendingUp, BarChart3, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [stats, setStats] = useState([
    { label: "Productos en Stock", value: "...", icon: Package, color: "blue" },
    { label: "Citas del Mes", value: "...", icon: Calendar, color: "indigo" },
    { label: "Clientes Activos", value: "...", icon: Users, color: "purple" },
    { label: "Ventas del Mes", value: "...", icon: TrendingUp, color: "green" },
  ]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Obtener total de productos activos
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      // Obtener citas del mes actual
      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { count: citasMes } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', primerDiaMes)
        .lte('fecha', ultimoDiaMes);

      // Obtener total de clientes
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      // Obtener ventas del mes
      const { data: ventasMes } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', primerDiaMes)
        .lte('fecha', ultimoDiaMes)
        .eq('estado', 'completada');

      const totalVentasMes = ventasMes?.reduce((acc, v) => acc + Number(v.total), 0) || 0;

      setStats([
        { label: "Productos en Stock", value: totalProductos?.toString() || "0", icon: Package, color: "blue" },
        { label: "Citas del Mes", value: citasMes?.toString() || "0", icon: Calendar, color: "indigo" },
        { label: "Clientes Activos", value: totalClientes?.toString() || "0", icon: Users, color: "purple" },
        { label: "Ventas del Mes", value: `$${totalVentasMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: "green" },
      ]);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header de bienvenida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-50"></div>
            <Eye className="h-10 w-10 text-blue-600 relative z-10" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Bienvenido a OptiGestión
            </h1>
            <p className="text-gray-500 mt-1">Panel de control principal</p>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Accesos rápidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/inventario">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <Package className="h-8 w-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Inventario</h3>
              <p className="text-blue-100 text-sm">Gestiona el stock de productos</p>
            </div>
          </Link>

          <Link href="/citas">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <Calendar className="h-8 w-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Citas</h3>
              <p className="text-indigo-100 text-sm">Agenda y gestiona citas</p>
            </div>
          </Link>

          <Link href="/clientes">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <Users className="h-8 w-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Clientes</h3>
              <p className="text-purple-100 text-sm">Administra tu base de clientes</p>
            </div>
          </Link>

          <Link href="/productos">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <ShoppingCart className="h-8 w-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Productos</h3>
              <p className="text-green-100 text-sm">Catálogo de productos</p>
            </div>
          </Link>

          <Link href="/inventario/estadisticas">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <BarChart3 className="h-8 w-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Estadísticas</h3>
              <p className="text-orange-100 text-sm">Análisis y reportes</p>
            </div>
          </Link>

          <Link href="/clientes/nuevo">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <Users className="h-8 w-8 mb-3" />
              <h3 className="text-xl font-bold mb-2">Nuevo Cliente</h3>
              <p className="text-pink-100 text-sm">Registrar nuevo cliente</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Información del sistema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Sistema de Gestión para Ópticas
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              OptiGestión te permite administrar tu óptica de manera eficiente.
              Controla tu inventario, agenda citas, gestiona clientes y genera reportes
              desde una sola plataforma intuitiva y profesional.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
