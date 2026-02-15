
import { Role, User } from '../types';
import { api } from './api';

// Usuarios simulados por defecto (Mock Database)
const MOCK_USERS: User[] = [
  {
    id: 'SU-000',
    name: 'Analista Nova (Super Admin)',
    email: 'analistadedatosnova@gmail.com',
    password: 'Gene.2302',
    role: Role.SUPER_ADMIN,
    avatar: 'SA'
  },
  {
    id: 'U-001',
    name: 'Admin General',
    email: 'admin@fiscal.com',
    password: 'admin',
    role: Role.ADMIN,
    avatar: 'AD'
  },
  {
    id: 'U-002',
    name: 'Auditor Jefe',
    email: 'auditor@fiscal.com',
    password: 'audit',
    role: Role.AUDITOR,
    avatar: 'AU'
  },
  {
    id: 'U-003',
    name: 'Presidente',
    email: 'ceo@fiscal.com',
    password: 'ceo',
    role: Role.PRESIDENT,
    avatar: 'PR'
  }
];

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1. Intentar buscar en los usuarios locales (Mocks) primero para asegurar acceso
    let user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    // 2. Si no se encuentra, intentar buscar en la base de datos remota
    if (!user) {
        try {
            const remoteUsers = await api.getUsers();
            user = remoteUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        } catch (e) {
            console.warn("Fallo conectando a BD remota para usuarios, usando solo locales.");
        }
    }

    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    // Validación de contraseña
    if (user.password !== password) {
      throw new Error('Contraseña incorrecta.');
    }

    // Retornar usuario sin la contraseña
    const { password: _, ...userWithoutPass } = user;
    return userWithoutPass as User;
  },

  recoverPassword: async (email: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      return `Se ha enviado un correo de recuperación a ${email}`;
    } else {
      // Por seguridad, retornamos éxito simulado aunque no exista
      return `Se ha enviado un correo de recuperación a ${email}`;
    }
  }
};
