"use client";

import { useState } from "react";
import { User, Mail, Lock, Building, Save, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RegistroPage() {
  const router = useRouter();
  const { signUp } = useAuth(); // Obtener la función signUp del contexto
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!formData.email || !formData.password || !formData.nombre) {
      setError("Por favor completa los campos obligatorios");
      return;
    }
    
    setLoading(true);

    try {
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        { 
          nombre: formData.nombre,
          empresa: formData.empresa 
        }
      );

      if (signUpError) {
        setError(signUpError);
      } else {
        // Registro exitoso, Supabase enviará el correo de verificación.
        // Redirigimos al usuario a una página de confirmación.
        alert("¡Registro exitoso! Por favor revisa tu correo electrónico para verificar tu cuenta.");
        router.push("/login"); 
      }
    } catch (e: any) {
      console.error('Error al registrar:', e);
      setError(e.message || "Error al crear la cuenta. Intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      {/* Fondo decorativo heredado del Login */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="w-full max-w-lg px-4">
        {/* Header */}
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Crear una Cuenta</h1>
            <p className="text-gray-500 mt-1">Únete a OptiGestión y administra tu óptica.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-white/50 space-y-6">
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Nombre y Empresa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    Nombre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Tu Nombre"
                        required
                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-gray-900"
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    Empresa
                </label>
                <div className="relative">
                    <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        placeholder="Nombre de la óptica"
                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-gray-900"
                    />
                </div>
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"} // Tipo corregido para seguridad
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Botón de registro */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login">
            <span className="text-blue-600 hover:text-blue-700 font-semibold">
              Inicia sesión aquí
            </span>
          </Link>
        </p>
        
        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} OptiGestión.
        </p>
      </div>

      {/* Estilos del fondo animado */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
