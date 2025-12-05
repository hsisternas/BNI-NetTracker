
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search, UserPlus, Calendar, ArrowRight } from 'lucide-react';

export const GuestDirectory: React.FC = () => {
  const { guests } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Registro de Invitados</h1>
           <p className="text-sm text-gray-500">Total: {guests.length} visitas registradas</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar invitado, empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map((guest) => (
          <div 
            key={guest.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
                <UserPlus className="w-12 h-12 text-gray-100 -rotate-12 transform translate-x-4 -translate-y-4" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                    {guest.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{guest.name}</h3>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{guest.sector}</p>
                    </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mt-4">
                    <p className="flex items-center gap-2">
                        <span className="font-medium text-gray-400 w-16">Empresa:</span>
                        {guest.company || "-"}
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="font-medium text-gray-400 w-16">Teléfono:</span>
                        {guest.phone || "-"}
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        Visita: {new Date(guest.visitDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs">
                        <span className="text-gray-400">Invitado por: </span>
                        <span className="font-medium text-primary-600">{guest.invitedByMemberName || "Desconocido"}</span>
                    </div>
                </div>
            </div>
          </div>
        ))}

        {filteredGuests.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-gray-200">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <UserPlus className="w-8 h-8 text-gray-400" />
             </div>
            <h3 className="text-lg font-medium text-gray-900">No hay invitados registrados</h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                Los invitados aparecerán aquí cuando los marques en el escaneo semanal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
