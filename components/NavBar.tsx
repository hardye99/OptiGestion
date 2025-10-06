"use client";
export function Navbar() {
  return (
    <header className="bg-white shadow-md p-4 rounded-xl flex justify-between items-center">
      <h1 className="text-xl font-semibold">Panel de Control</h1>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Cerrar sesión</button>
    </header>
  );
}
