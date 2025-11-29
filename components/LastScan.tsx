import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Calendar, Users, MessageSquare, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExtractedEntry } from '../types';

export const LastScan: React.FC = () => {
  const { lastScan, updateLastScanEntry } = useData();
  const navigate = useNavigate();
  
  // Track which entry is being edited by its index
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExtractedEntry>>({});

  if (!lastScan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">No hay escaneos recientes</h2>
        <p className="text-gray-500 mt-2 max-w-sm text-center">
          Escanea una hoja de asistencia para ver el resumen de las solicitudes de la semana.
        </p>
        <button 
            onClick={() => navigate('/scan')}
            className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
            Ir a Escanear
        </button>
      </div>
    );
  }

  // Filter those with actual requests (ignoring edit mode for filter, we use original data index)
  const requests = lastScan.entries
    .map((entry, index) => ({ ...entry, originalIndex: index }))
    .filter(e => e.handwrittenRequest && e.handwrittenRequest.trim().length > 0);
  
  const attendeesWithoutRequests = lastScan.entries
    .map((entry, index) => ({ ...entry, originalIndex: index }))
    .filter(e => !e.handwrittenRequest || e.handwrittenRequest.trim().length === 0);

  const getMemberId = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

  const startEditing = (index: number, entry: ExtractedEntry) => {
    setEditingIndex(index);
    setEditForm(entry);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  const saveEntry = (index: number) => {
    if (editForm.handwrittenRequest !== undefined) {
        updateLastScanEntry(index, 'handwrittenRequest', editForm.handwrittenRequest);
    }
    // We can also update other fields if we exposed inputs for them
    setEditingIndex(null);
    setEditForm({});
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary-600" />
                Resumen Semanal
            </h1>
            <p className="text-gray-500 mt-1">
                Reunión del <span className="font-semibold text-gray-800">{new Date(lastScan.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
         </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Asistentes</p>
                  <p className="text-2xl font-bold text-gray-900">{lastScan.entries.length}</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Solicitudes</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
          </div>
      </div>

      {/* Requests Section */}
      <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
             Solicitudes Activas ({requests.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
             {requests.map((entry) => (
                 <div key={entry.originalIndex} className="bg-white rounded-xl p-5 border-l-4 border-l-green-500 shadow-sm border-t border-r border-b border-gray-200 hover:shadow-md transition-shadow relative group">
                     
                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-gray-900 text-lg">{entry.name}</span>
                                <span className="text-gray-400 text-sm">•</span>
                                <span className="text-gray-600 text-sm">{entry.company}</span>
                            </div>

                            {editingIndex === entry.originalIndex ? (
                                <div className="mt-2">
                                    <textarea 
                                        value={editForm.handwrittenRequest || ''}
                                        onChange={(e) => setEditForm({...editForm, handwrittenRequest: e.target.value})}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 p-3 border font-handwriting bg-green-50/50"
                                        rows={3}
                                    />
                                    <div className="flex gap-2 mt-2 justify-end">
                                        <button onClick={cancelEditing} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                                        <button onClick={() => saveEntry(entry.originalIndex)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Guardar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-green-900 font-handwriting text-lg italic pr-10">
                                    "{entry.handwrittenRequest}"
                                    <button 
                                        onClick={() => startEditing(entry.originalIndex, entry)}
                                        className="absolute top-4 right-4 text-gray-300 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Editar solicitud"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                         </div>
                         
                         {editingIndex !== entry.originalIndex && (
                            <div className="flex items-center">
                                <button 
                                    onClick={() => navigate(`/member/${getMemberId(entry.name)}`)}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    Ver Historial <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                         )}
                     </div>
                 </div>
             ))}
             {requests.length === 0 && (
                 <p className="text-gray-500 italic">No se detectaron solicitudes escritas a mano en esta sesión.</p>
             )}
          </div>
      </div>

      {/* Other Attendees Section */}
      {attendeesWithoutRequests.length > 0 && (
        <div className="pt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 text-gray-500">
                Otros Asistentes
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miembro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {attendeesWithoutRequests.map((entry) => (
                            <tr key={entry.originalIndex} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                            {entry.name.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {entry.company}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {entry.sector}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                    <button 
                                        onClick={() => navigate(`/member/${getMemberId(entry.name)}`)}
                                        className="text-primary-600 hover:text-primary-900"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};