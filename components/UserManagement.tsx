
import React from 'react';
import { User, Role, Store as StoreType } from '../types';
import { firestoreService } from '../services/firestoreService';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Users,
  Store as StoreIcon,
  Edit2,
  Trash2
} from 'lucide-react';

interface UserManagementProps {
  currentUser?: User | null;
  stores: StoreType[];
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, stores }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
  }>({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: ''
  });
  
  // Form State
  const [newUser, setNewUser] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: Role.ADMIN,
    storeId: currentUser?.storeId || '',
    avatar: ''
  });
  
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
      reader.onerror = error => reject(error);
    });
  };

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await firestoreService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Error cargando usuarios", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setNewUser({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: user.password || '',
      role: user.role,
      storeId: user.storeId || '',
      avatar: user.avatar || ''
    });
    setShowForm(true);
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar usuario?',
      message: `¿Estás seguro de que deseas eliminar al usuario ${user?.name || ''}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const res = await firestoreService.deleteUser(id);
          if (res?.status === 'success') {
            setUsers(prev => prev.filter(u => u.id !== id));
            setMessage({ type: 'success', text: 'Usuario eliminado correctamente.' });
          } else {
            setMessage({ type: 'error', text: 'Error eliminando usuario' });
          }
        } catch (e) {
          setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
          setTimeout(() => setMessage(null), 3000);
        }
      }
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    const userToSave: User = {
      id: editingUserId || `U-${Date.now().toString().slice(-4)}`,
      ...newUser
    };

    try {
      let res;
      if (editingUserId) {
        res = await firestoreService.updateUser(userToSave);
      } else {
        res = await firestoreService.createUser(userToSave);
      }

      if (res?.status === 'success') {
        setMessage({ type: 'success', text: editingUserId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.' });
        
        if (editingUserId) {
          setUsers(prev => prev.map(u => u.id === editingUserId ? userToSave : u));
        } else {
          setUsers(prev => [...prev, userToSave]);
        }
        
        setShowForm(false);
        setEditingUserId(null);
        setNewUser({ name: '', email: '', phone: '', password: '', role: Role.ADMIN, storeId: currentUser?.storeId || '', avatar: '' });
      } else {
        setMessage({ type: 'error', text: res.message || 'Error guardando usuario' });
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
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingUserId(null);
              setNewUser({ name: '', email: '', phone: '', password: '', role: Role.ADMIN, storeId: currentUser?.storeId || '', avatar: '' });
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
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

      {/* Formulario de Creación / Edición */}
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <h3 className="font-bold text-slate-950 dark:text-slate-50 mb-4">
            {editingUserId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          </h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-900 border-2 border-white dark:border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400 overflow-hidden shrink-0">
                {newUser.avatar ? (
                  <img src={newUser.avatar} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  getUserInitial(newUser.name)
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Avatar del Usuario</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const base64 = await fileToBase64(file);
                        setNewUser({ ...newUser, avatar: base64 });
                      } catch (err) {
                        console.error("Error procesando imagen", err);
                      }
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Rol de Acceso</label>
              <div className="relative">
                <select 
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
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
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Correo Electrónico</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-3 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="usuario@fiscal.com"
                />
                <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono (WhatsApp)</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={newUser.phone}
                  onChange={e => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full p-3 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+584120000000"
                />
                <StoreIcon className="absolute left-3 top-3 text-slate-400" size={16} />
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

            {(newUser.role === Role.ADMIN || newUser.role === Role.AUDITOR) && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tienda Asignada</label>
                <div className="relative">
                  <select 
                    required
                    value={newUser.storeId || ''}
                    onChange={e => setNewUser({...newUser, storeId: e.target.value})}
                    className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="" disabled>Seleccione una tienda...</option>
                    {(currentUser?.storeId ? stores.filter(s => s.id === currentUser.storeId) : stores).map(store => (
                      <option key={store.id} value={store.id}>{store.name} - {store.location}</option>
                    ))}
                  </select>
                  <StoreIcon className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
                <p className="text-xs text-slate-500 mt-1">Este usuario solo tendrá acceso a los datos de la tienda seleccionada.</p>
              </div>
            )}

            <div className="md:col-span-2 pt-2">
              <button 
                type="submit" 
                disabled={isCreating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.99] flex justify-center items-center gap-2"
              >
                {isCreating ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Usuarios */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Tienda</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No se encontraron usuarios remotos (Solo Mocks locales).
                   </td>
                </tr>
              ) : (
                (currentUser?.storeId ? users.filter(u => u.storeId === currentUser.storeId) : users).map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm shrink-0 overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            getUserInitial(user.name)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{user.name || 'Sin Nombre'}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {user.storeId ? stores.find(s => s.id === user.storeId)?.name || 'Desconocida' : 'Todas (Global)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-500 text-[11px] font-bold tracking-tighter">
                      {user.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-500 font-bold text-xs flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Activo
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-3 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all active:scale-90"
                          title="Editar Usuario"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90"
                          title="Eliminar Usuario"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};
