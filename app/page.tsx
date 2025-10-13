"use client";

import Link from "next/link";
import {
  Eye,
  Sparkles,
  Users,
  Calendar,
  Package,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  ArrowRight,
  Activity,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface StatCard {
  label: string;
  value: string;
  icon: typeof Package;
  color: string;
  bgGradient: string;
  textColor: string;
  change?: string;
  changeType?: 'up' | 'down';
}

export default function HomePage() {
  const [stats, setStats] = useState<StatCard[]>([
    {
      label: "Productos en Stock",
      value: "...",
      icon: Package,
      color: "blue",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      textColor: "text-blue-600"
    },
    {
      label: "Citas del Mes",
      value: "...",
      icon: Calendar,
      color: "emerald",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      textColor: "text-emerald-600"
    },
    {
      label: "Clientes Activos",
      value: "...",
      icon: Users,
      color: "orange",
      bgGradient: "from-orange-500/10 to-amber-500/10",
      textColor: "text-orange-600"
    },
    {
      label: "Ventas del Mes",
      value: "...",
      icon: TrendingUp,
      color: "green",
      bgGradient: "from-green-500/10 to-emerald-500/10",
      textColor: "text-green-600"
    },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { count: citasMes } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', primerDiaMes)
        .lte('fecha', ultimoDiaMes);

      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      const { data: salidasMes } = await supabase
        .from('movimientos_inventario')
        .select(`
          cantidad,
          producto:productos(precio)
        `)
        .eq('tipo', 'salida')
        .gte('fecha', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());

      const totalVentasMes = salidasMes?.reduce((acc: number, salida: any) => {
        const precio = salida.producto?.precio || 0;
        return acc + (salida.cantidad * precio);
      }, 0) || 0;

      setStats([
        {
          label: "Productos en Stock",
          value: totalProductos?.toString() || "0",
          icon: Package,
          color: "blue",
          bgGradient: "from-blue-500/10 to-cyan-500/10",
          textColor: "text-blue-600"
        },
        {
          label: "Citas del Mes",
          value: citasMes?.toString() || "0",
          icon: Calendar,
          color: "emerald",
          bgGradient: "from-emerald-500/10 to-teal-500/10",
          textColor: "text-emerald-600"
        },
        {
          label: "Clientes Activos",
          value: totalClientes?.toString() || "0",
          icon: Users,
          color: "orange",
          bgGradient: "from-orange-500/10 to-amber-500/10",
          textColor: "text-orange-600"
        },
        {
          label: "Ventas del Mes",
          value: `$${totalVentasMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: TrendingUp,
          color: "green",
          bgGradient: "from-green-500/10 to-emerald-500/10",
          textColor: "text-green-600"
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Inventario",
      description: "Gestiona el stock de productos y controla el inventario",
      icon: Package,
      href: "/inventario",
      gradient: "from-blue-500 to-cyan-600",
      hoverGradient: "hover:from-blue-600 hover:to-cyan-700"
    },
    {
      title: "Citas",
      description: "Agenda y gestiona las citas de tus clientes",
      icon: Calendar,
      href: "/citas",
      gradient: "from-emerald-500 to-teal-600",
      hoverGradient: "hover:from-emerald-600 hover:to-teal-700"
    },
    {
      title: "Clientes",
      description: "Administra tu base de datos de clientes",
      icon: Users,
      href: "/clientes",
      gradient: "from-orange-500 to-amber-600",
      hoverGradient: "hover:from-orange-600 hover:to-amber-700"
    },
    {
      title: "Productos",
      description: "Explora y gestiona el catálogo de productos",
      icon: ShoppingCart,
      href: "/productos",
      gradient: "from-green-500 to-emerald-600",
      hoverGradient: "hover:from-green-600 hover:to-emerald-700"
    },
    {
      title: "Estadísticas",
      description: "Análisis detallado y reportes del negocio",
      icon: BarChart3,
      href: "/inventario/estadisticas",
      gradient: "from-violet-500 to-fuchsia-600",
      hoverGradient: "hover:from-violet-600 hover:to-fuchsia-700"
    },
    {
      title: "Nuevo Cliente",
      description: "Registrar un nuevo cliente en el sistema",
      icon: Users,
      href: "/clientes/nuevo",
      gradient: "from-rose-500 to-pink-600",
      hoverGradient: "hover:from-rose-600 hover:to-pink-700"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-8 shadow-xl shadow-blue-500/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4">
                    <Eye className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Bienvenido a OptiGestión
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    Panel de control principal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10 from-blue-500/20 to-cyan-500/20"></div>
                <div className="relative bg-white border border-gray-200/50 rounded-2xl p-6 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm`}>
                      <Icon className={`h-6 w-6 ${stat.textColor}`} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? (
                      <span className="inline-block w-20 h-8 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Accesos Rápidos</h2>
            <div className="h-1 flex-1 ml-6 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href={action.href}>
                    <div className={`group relative overflow-hidden bg-gradient-to-br ${action.gradient} ${action.hoverGradient} text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer`}>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-6 w-6" />
                          </div>
                          <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </div>

                        <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-cyan-50 border border-blue-200/50 rounded-3xl p-8 shadow-lg">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Sistema de Gestión para Ópticas
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  OptiGestión te permite administrar tu óptica de manera eficiente.
                  Controla tu inventario, agenda citas, gestiona clientes y genera reportes
                  desde una sola plataforma intuitiva y profesional.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    Inventario
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                    Citas
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                    Clientes
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Reportes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
