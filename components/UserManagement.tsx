
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Users
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.ADMIN
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Error cargando usuarios", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    const userToCreate: User = {
      id: `U-${Date.now().toString().slice(-4)}`,
      ...newUser
    };

    try {
      const res = await api.createUser(userToCreate);
      if (res.status === 'success') {
        setMessage({ type: 'success', text: 'Usuario creado correctamente.' });
        setUsers(prev => [...prev, userToCreate]);
        setShowForm(false);
        setNewUser({ name: '', email: '', password: '', role: Role.ADMIN });
      } else {
        setMessage({ type: 'error', text: res.message || 'Error creando usuario' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setIsCreating(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch(role) {
      case Role.SUPER_ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
      case Role.ADMIN: return 'bg-blue-100 text-blue-700 border-blue-200';
      case Role.AUDITOR: return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper seguro para obtener iniciales
  const getUserInitial = (name: string | undefined | null) => {
    if (typeof name === 'string' && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-blue-500" />
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Administre el acceso al sistema.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <UserPlus size={18} />
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Formulario de Creación */}
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Registrar Nuevo Usuario</h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol de Acceso</label>
              <div className="relative">
                <select 
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value={Role.ADMIN}>Administrador</option>
                  <option value={Role.AUDITOR}>Auditor</option>
                  <option value={Role.PRESIDENT}>Presidencia</option>
                  {/* Super Admin no puede crear otro Super Admin por seguridad en esta UI, pero podría habilitarse */}
                </select>
                <Shield className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-3 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="usuario@fiscal.com"
                />
                <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña Temporal</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full p-3 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="********"
                />
                <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              <button 
                type="submit" 
                disabled={isCreating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.99] flex justify-center items-center gap-2"
              >
                {isCreating ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Usuarios */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No se encontraron usuarios remotos (Solo Mocks locales).
                   </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs shrink-0">
                          {user.avatar || getUserInitial(user.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{user.name || 'Sin Nombre'}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-500 font-bold text-xs flex items-center justify-end gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Activo
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
