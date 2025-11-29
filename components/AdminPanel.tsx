
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Shield, Loader2, Users, Ban, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminPanel: React.FC = () => {
  const { user: currentUser, isAdmin, getAllUsers, approveUser, suspendUser, deleteUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !isAdmin) {
        navigate('/');
        return;
    }
    loadUsers();
  }, [currentUser, isAdmin, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
    } catch (error) {
        console.error("Error cargando usuarios", error);
    } finally {
        setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
        await approveUser(id);
        // Actualización optimista
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u));
    } catch (error) {
        console.error("Error aprobando usuario", error);
        alert("Hubo un error al aprobar el usuario");
    } finally {
        setProcessingId(null);
    }
  };

  const handleSuspend = async (id: string) => {
    if(!window.confirm('¿Revocar acceso a este usuario? Ya no podrá iniciar sesión.')) return;
    
    setProcessingId(id);
    try {
        await suspendUser(id);
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: false } : u));
    } catch (error) {
        console.error("Error suspendiendo usuario", error);
    } finally {
        setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('¿Eliminar permanentemente este usuario y todos sus datos asociados? Esta acción no se puede deshacer.')) return;
    
    setProcessingId(id);
    try {
        await deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
        console.error("Error eliminando usuario", error);
    } finally {
        setProcessingId(null);
    }
  };

  if (!isAdmin) return null;

  // Separar usuarios pendientes y activos
  const pendingUsers = users.filter(u => !u.isApproved);
  const activeUsers = users.filter(u => u.isApproved);

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <Shield className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-gray-500">Control de acceso y gestión de miembros del grupo</p>
            </div>
        </div>
      </div>

      {/* --- SOLICITUDES PENDIENTES --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-orange-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Solicitudes Pendientes
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">{pendingUsers.length}</span>
            </h2>
        </div>
        
        {loading ? (
             <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
        ) : pendingUsers.length === 0 ? (
             <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <CheckCircle className="w-12 h-12 mb-2 text-green-100" />
                <p>No hay solicitudes pendientes.</p>
             </div>
        ) : (
             <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pendingUsers.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{u.name}</span>
                                        <span className="text-sm text-gray-500">{u.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    Pendiente
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <button 
                                        onClick={() => handleApprove(u.id)} 
                                        disabled={!!processingId}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                    >
                                        {processingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aprobar'}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(u.id)} 
                                        disabled={!!processingId}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 focus:outline-none disabled:opacity-50 transition-colors"
                                    >
                                         Rechazar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
        )}
      </div>

      {/* --- MIEMBROS ACTIVOS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Miembros Activos
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{activeUsers.length}</span>
            </h2>
        </div>

        {activeUsers.length === 0 ? (
             <div className="p-8 text-center text-gray-500">No hay usuarios activos.</div>
        ) : (
             <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gestión</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {activeUsers.map(u => (
                            <tr key={u.id} className="group hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {u.name} 
                                    {u.id === currentUser?.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">TÚ</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                        {u.role === 'admin' ? 'Administrador' : 'Miembro'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {u.id !== currentUser?.id && (
                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleSuspend(u.id)} 
                                                disabled={!!processingId}
                                                className="text-orange-600 hover:text-orange-900 bg-orange-50 p-1.5 rounded hover:bg-orange-100 border border-transparent hover:border-orange-200 disabled:opacity-50 transition-all" 
                                                title="Revocar Acceso (Suspender)"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(u.id)} 
                                                disabled={!!processingId}
                                                className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded hover:bg-red-100 border border-transparent hover:border-red-200 disabled:opacity-50 transition-all" 
                                                title="Eliminar Definitivamente"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
        )}
      </div>
    </div>
  );
};
