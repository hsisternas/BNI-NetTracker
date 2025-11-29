import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search, Briefcase, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MemberDirectory: React.FC = () => {
  const { members } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Directorio de Miembros</h1>
           <p className="text-sm text-gray-500">Total: {members.length} miembros registrados</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar miembro, empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div 
            key={member.id} 
            onClick={() => navigate(`/member/${member.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{member.name}</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{member.sector}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-400" />
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="truncate">{member.company}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
               <span className="text-gray-500">Refs. Totales</span>
               <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-700">{member.references.length}</span>
            </div>
          </div>
        ))}

        {filteredMembers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No se encontraron miembros. Intenta escanear una hoja de asistencia primero.
          </div>
        )}
      </div>
    </div>
  );
};
