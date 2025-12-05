
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Scanner } from './components/Scanner';
import { MemberDirectory } from './components/MemberDirectory';
import { GuestDirectory } from './components/GuestDirectory';
import { MemberDetail } from './components/MemberDetail';
import { LastScan } from './components/LastScan';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { AdminPanel } from './components/AdminPanel';
import { Users, Scan, Menu, X, LayoutGrid, ClipboardList, LogOut, Shield, UserPlus } from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
      {label}
    </Link>
  );
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <span className="font-bold text-lg text-primary-600">BNI NetTracker</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 z-10 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b border-gray-100">
           <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
             <LayoutGrid className="text-primary-600 fill-current" />
             BNI NetTracker
           </h1>
           {user && (
             <div className="mt-2">
                <p className="text-xs text-gray-500 truncate">Hola, {user.name}</p>
                {isAdmin && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Administrador</span>}
             </div>
           )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink to="/" icon={Users} label="Miembros" />
          <SidebarLink to="/guests" icon={UserPlus} label="Invitados" />
          <SidebarLink to="/scan" icon={Scan} label="Escanear Hoja" />
          <SidebarLink to="/summary" icon={ClipboardList} label="Resumen Semanal" />
          {isAdmin && (
             <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin</p>
                <SidebarLink to="/admin" icon={Shield} label="Aprobar Usuarios" />
             </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
           <button 
             onClick={logout}
             className="flex items-center gap-3 px-4 py-2 w-full text-left text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
           >
             <LogOut className="w-4 h-4" />
             Cerrar Sesión
           </button>

           <div className="bg-primary-50 p-4 rounded-xl">
             <p className="text-xs text-primary-800 mb-2 font-medium">Givers Gain®</p>
             <p className="text-xs text-primary-700 leading-relaxed">Recuerda digitalizar las hojas cada semana para mantener el seguimiento de referencias al día.</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full md:w-auto">
        {children}
      </main>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, requireAdmin?: boolean }> = ({ children, requireAdmin = false }) => {
  const { user, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
      return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <MemberDirectory />
                </ProtectedRoute>
            } />
            <Route path="/guests" element={
                <ProtectedRoute>
                    <GuestDirectory />
                </ProtectedRoute>
            } />
            <Route path="/scan" element={
                <ProtectedRoute>
                    <Scanner />
                </ProtectedRoute>
            } />
            <Route path="/summary" element={
                <ProtectedRoute>
                    <LastScan />
                </ProtectedRoute>
            } />
            <Route path="/member/:id" element={
                <ProtectedRoute>
                    <MemberDetail />
                </ProtectedRoute>
            } />
            <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                    <AdminPanel />
                </ProtectedRoute>
            } />
        </Routes>
    )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
        <DataProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </DataProvider>
    </AuthProvider>
  );
};

export default App;
