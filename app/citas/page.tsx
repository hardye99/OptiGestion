"use client";

import Link from "next/link";
import { Calendar, Clock, Plus, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CitasPage() {
  const [estadisticas, setEstadisticas] = useState({
    citasHoy: 0,
    pendientes: 0,
    completadas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];

      // Citas de hoy
      const { count: citasHoy } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', hoy);

      // Pendientes
      const { count: pendientes } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');

      // Completadas
      const { count: completadas } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'completada');

      setEstadisticas({
        citasHoy: citasHoy || 0,
        pendientes: pendientes || 0,
        completadas: completadas || 0
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Citas</h1>
        <p className="text-gray-500">Gestiona y organiza todas tus citas de forma rápida.</p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white shadow-md rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Citas hoy</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : estadisticas.citasHoy}</p>
          </div>
          <Calendar className="h-8 w-8 text-blue-500" />
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : estadisticas.pendientes}</p>
          </div>
          <Clock className="h-8 w-8 text-yellow-500" />
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Completadas</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : estadisticas.completadas}</p>
          </div>
          <ListChecks className="h-8 w-8 text-green-500" />
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        <Link href="/citas/agendar">
          <div className="bg-blue-500 hover:bg-blue-600 text-white shadow-md rounded-xl p-6 flex items-center justify-between transition cursor-pointer">
            <div>
              <p className="text-lg font-semibold">Agendar Cita</p>
              <p className="text-sm text-blue-200">Crear nueva cita rápidamente</p>
            </div>
            <Plus className="h-6 w-6" />
          </div>
        </Link>

        <Link href="/citas/programadas">
          <div className="bg-white hover:bg-gray-50 shadow-md rounded-xl p-6 flex items-center justify-between transition cursor-pointer">
            <div>
              <p className="text-lg font-semibold text-gray-800">Citas Programadas</p>
              <p className="text-sm text-gray-500">Ver y administrar todas las citas</p>
            </div>
            <ListChecks className="h-6 w-6 text-gray-600" />
          </div>
        </Link>
      </div>
    </div>
  );
}
