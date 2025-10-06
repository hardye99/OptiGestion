"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface HistorialCliente {
  id: string;
  nombre: string;
  tipo: "Compra" | "Cita";
  detalle: string;
  fecha: string;
  monto?: number;
  estado: "Completado" | "Pendiente" | "Cancelado";
}

export default function HistorialClientesPage() {
  const [historial, setHistorial] = useState<HistorialCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulación de carga de historial
    setTimeout(() => {
      setHistorial([
        {
          id: "1",
          nombre: "Juan Pérez",
          tipo: "Compra",
          detalle: "Lentes de sol Ray-Ban",
          fecha: "2025-09-25",
          monto: 1500,
          estado: "Completado",
        },
        {
          id: "2",
          nombre: "María López",
          tipo: "Cita",
          detalle: "Examen de vista anual",
          fecha: "2025-09-28",
          estado: "Pendiente",
        },
        {
          id: "3",
          nombre: "Carlos Gómez",
          tipo: "Compra",
          detalle: "Lentes de contacto mensuales",
          fecha: "2025-09-20",
          monto: 600,
          estado: "Completado",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Historial de Clientes</h1>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Cliente</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Detalle</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Monto</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {historial.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2">{item.nombre}</td>
                  <td className="px-4 py-2">{item.tipo}</td>
                  <td className="px-4 py-2">{item.detalle}</td>
                  <td className="px-4 py-2">{item.fecha}</td>
                  <td className="px-4 py-2">{item.monto ? `$${item.monto}` : "-"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        item.estado === "Completado"
                          ? "bg-green-100 text-green-800"
                          : item.estado === "Pendiente"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
