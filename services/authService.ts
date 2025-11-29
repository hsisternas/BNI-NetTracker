
import { User } from '../types';

const USERS_STORAGE_KEY = 'networking_app_users_v1';
const SESSION_KEY = 'networking_app_session_v1';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    // Buscar usuario
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.isApproved) {
      throw new Error('Tu cuenta está pendiente de aprobación por el administrador.');
    }

    const safeUser: User = { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role || 'user',
        isApproved: user.isApproved
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];

    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('El correo electrónico ya está registrado');
    }

    // El primer usuario registrado es Admin automáticamente
    const isFirstUser = users.length === 0;
    
    const newUser = {
      id: Date.now().toString() + Math.random().toString().slice(2, 8),
      name,
      email,
      password, // Nota: En producción real, esto debería estar hasheado en un backend real.
      role: isFirstUser ? 'admin' : 'user',
      isApproved: isFirstUser ? true : false
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const safeUser: User = { 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name,
        role: newUser.role as 'admin' | 'user',
        isApproved: newUser.isApproved
    };

    // Solo iniciar sesión automáticamente si está aprobado (es decir, es el admin)
    if (safeUser.isApproved) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    }
    
    return safeUser;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

  // --- Métodos de Administración ---

  getAllUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];
    return users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isApproved: u.isApproved
    }));
  },

  approveUser: async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
    let users = usersStr ? JSON.parse(usersStr) : [];
    
    // Forzamos comparación de strings para evitar errores de tipo
    users = users.map((u: any) => {
        if (String(u.id) === String(userId)) {
            return { ...u, isApproved: true };
        }
        return u;
    });

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  suspendUser: async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
    let users = usersStr ? JSON.parse(usersStr) : [];
    
    users = users.map((u: any) => {
        if (String(u.id) === String(userId)) {
            return { ...u, isApproved: false };
        }
        return u;
    });

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  deleteUser: async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
    let users = usersStr ? JSON.parse(usersStr) : [];
    
    // Filtrar eliminando el ID coincidente
    users = users.filter((u: any) => String(u.id) !== String(userId));

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
};
