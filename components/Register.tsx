import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, LayoutGrid, CheckCircle, Clock } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const newUser = await register(name, email, password);
      if (newUser.isApproved) {
          // If approved (first admin), go to dashboard
          navigate('/');
      } else {
          // If pending, show pending message
          setPendingApproval(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingApproval) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registro Completado</h2>
                <p className="text-gray-600 mb-6">
                    Tu cuenta ha sido creada exitosamente, pero requiere <strong>aprobación del administrador</strong> antes de poder acceder.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-6">
                    Te notificaremos cuando tu acceso haya sido activado. Por favor, contacta con el administrador del grupo si necesitas acceso urgente.
                </div>
                <Link to="/login" className="text-primary-600 font-medium hover:underline">
                    Volver al inicio de sesión
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-4">
              <LayoutGrid className="w-6 h-6 fill-current" />
           </div>
           <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
           <p className="text-gray-500 mt-2">Empieza a digitalizar tu networking en BNI NetTracker</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Cargando...' : <><UserPlus className="w-4 h-4" /> Registrarse</>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary-600 hover:underline font-medium">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};