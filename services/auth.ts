
import { Role, User } from '../types';

// Usuarios simulados (Mock Database)
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
    await new Promise(resolve => setTimeout(resolve, 1500));

    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

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
      // Por seguridad, a veces se responde lo mismo aunque no exista, 
      // pero para este demo retornamos éxito simulado.
      return `Se ha enviado un correo de recuperación a ${email}`;
    }
  }
};
