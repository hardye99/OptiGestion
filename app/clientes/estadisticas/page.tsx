"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";

interface EstadisticaClientes {
  nombre: string;
  valor: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function ClientesEstadisticasPage() {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<any[]>([]); // <-- Cambiado a any[] para compatibilidad con Recharts

  useEffect(() => {
    // Simulación de carga de estadísticas
    setTimeout(() => {
      setDatos([
        { nombre: "Clientes activos", valor: 45 },
        { nombre: "Clientes inactivos", valor: 10 },
        { nombre: "Nuevos este mes", valor: 15 },
        { nombre: "Clientes VIP", valor: 5 },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas de Clientes</h1>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de pastel */}
          <div className="bg-white p-4 shadow-md rounded-xl">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Distribución de clientes</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datos}
                  dataKey="valor"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {datos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de barras */}
          <div className="bg-white p-4 shadow-md rounded-xl">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Comparativa mensual</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datos}>
                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#0088FE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
