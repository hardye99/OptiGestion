import { UserRole } from "./types";

// Definición de permisos por módulo
export const PERMISSIONS = {
  // Dashboard - Todos pueden ver
  dashboard: {
    view: ["desarrollador", "dueño", "empleado"] as UserRole[],
  },

  // Inventario
  inventario: {
    view: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos pueden ver
    edit: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño pueden modificar
    movimientos: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño ven movimientos
    estadisticas: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño ven estadísticas
  },

  // Productos
  productos: {
    view: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos pueden ver
    create: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño crean
    edit: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño editan
    delete: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño eliminan
    precios: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño modifican precios
  },

  // Clientes
  clientes: {
    view: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos pueden ver
    create: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos pueden crear
    edit: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos pueden editar
    delete: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño eliminan
    historial: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos ven historial
    estadisticas: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño ven stats
  },

  // Citas
  citas: {
    view: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos pueden ver
    create: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos pueden crear
    edit: ["desarrollador", "dueño", "empleado"] as UserRole[], // Todos pueden editar
    delete: ["desarrollador", "dueño"] as UserRole[], // Solo dev y dueño eliminan
  },

  // Configuración
  configuracion: {
    view: ["desarrollador"] as UserRole[], // Solo desarrollador
    usuarios: ["desarrollador"] as UserRole[], // Solo desarrollador gestiona usuarios
    roles: ["desarrollador"] as UserRole[], // Solo desarrollador cambia roles
  },
} as const;

// Helper para verificar permisos
export function hasPermission(
  userRole: UserRole | undefined,
  module: keyof typeof PERMISSIONS,
  action: string
): boolean {
  if (!userRole) return false;

  const modulePermissions = PERMISSIONS[module];
  if (!modulePermissions) return false;

  const actionPermissions = modulePermissions[action as keyof typeof modulePermissions];
  if (!actionPermissions) return false;

  return actionPermissions.includes(userRole);
}
