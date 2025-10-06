"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface Cliente {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  ultimaCompra: string;
}

export default function ClientesActualesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulación de carga de clientes
    setTimeout(() => {
      setClientes([
        {
          id: "1",
          nombre: "Juan Pérez",
          correo: "juan@email.com",
          telefono: "5512345678",
          ultimaCompra: "2025-10-01",
        },
        {
          id: "2",
          nombre: "María López",
          correo: "maria@email.com",
          telefono: "5598765432",
          ultimaCompra: "2025-09-28",
        },
        {
          id: "3",
          nombre: "Carlos Gómez",
          correo: "carlos@email.com",
          telefono: "5511122233",
          ultimaCompra: "2025-09-20",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEliminar = (id: string) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    toast.success("Cliente eliminado correctamente");
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Clientes Actuales</h1>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Correo</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Teléfono</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Última compra</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2">{cliente.nombre}</td>
                  <td className="px-4 py-2">{cliente.correo}</td>
                  <td className="px-4 py-2">{cliente.telefono}</td>
                  <td className="px-4 py-2">{cliente.ultimaCompra}</td>
                  <td className="px-4 py-2 flex justify-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition">
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleEliminar(cliente.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
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
