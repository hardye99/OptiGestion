"use client";

import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import { ShieldAlert } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { hasRole, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!hasRole(roles)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <div className="bg-gray-100 rounded-lg p-4 max-w-md">
            <p className="text-sm text-gray-700">
              <strong>Tu rol actual:</strong>{" "}
              <span className="capitalize font-semibold text-blue-600">
                {profile?.role || "No asignado"}
              </span>
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Roles requeridos:</strong>{" "}
              <span className="capitalize font-semibold text-blue-600">
                {roles.join(", ")}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
