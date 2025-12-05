
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Building2, Phone, Calendar, Trash2, Pencil, Save, X, Tag, UserPlus, ScrollText } from 'lucide-react';

export const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMember, deleteMember, updateMemberProfile, updateReference, guests } = useData();
  const member = getMember(id || '');

  const [activeTab, setActiveTab] = useState<'references' | 'guests'>('references');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    sector: '',
    phone: ''
  });

  const [editingRefId, setEditingRefId] = useState<string | null>(null);
  const [editRefText, setEditRefText] = useState('');

  useEffect(() => {
    if (member) {
      setEditForm({
        name: member.name,
        company: member.company,
        sector: member.sector,
        phone: member.phone
      });
    }
  }, [member]);

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900">Miembro no encontrado</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-primary-600 hover:underline">Volver al inicio</button>
      </div>
    );
  }

  // Filter guests invited by this member
  const invitedGuests = guests.filter(g => g.invitedByMemberId === member.id);

  const handleDelete = () => {
    if (window.confirm(`¿Seguro que quieres eliminar a ${member.name}?`)) {
      deleteMember(member.id);
      navigate('/');
    }
  };

  const handleSaveProfile = () => {
    updateMemberProfile(member.id, editForm);
    setIsEditingProfile(false);
  };

  const startEditingRef = (refId: string, text: string) => {
    setEditingRefId(refId);
    setEditRefText(text);
  };

  const saveReference = (refId: string) => {
    updateReference(member.id, refId, editRefText);
    setEditingRefId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Top Bar with Name and Sector */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white">
           <div className="flex justify-between items-start mb-4">
             <div className="flex gap-4 items-center w-full">
               <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30 shrink-0">
                 {member.name.charAt(0)}
               </div>
               
               <div className="flex-1">
                 {isEditingProfile ? (
                   <div className="space-y-2">
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="block w-full text-gray-900 px-2 py-1 rounded text-lg font-bold"
                        placeholder="Nombre"
                      />
                      <input 
                        type="text" 
                        value={editForm.sector}
                        onChange={e => setEditForm({...editForm, sector: e.target.value})}
                        className="block w-full text-gray-900 px-2 py-1 rounded text-sm"
                        placeholder="Sector / Especialidad"
                      />
                   </div>
                 ) : (
                   <div>
                     <h1 className="text-2xl font-bold">{member.name}</h1>
                     <p className="text-primary-100 font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {member.sector}
                     </p>
                   </div>
                 )}
               </div>
             </div>

             <div className="flex gap-2">
                {!isEditingProfile ? (
                  <>
                    <button onClick={() => setIsEditingProfile(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white" title="Editar Perfil">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={handleDelete} className="p-2 bg-white/10 hover:bg-red-500/50 rounded-lg transition-colors text-white" title="Eliminar Miembro">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white" title="Cancelar">
                      <X className="w-5 h-5" />
                    </button>
                    <button onClick={handleSaveProfile} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-white" title="Guardar">
                      <Save className="w-5 h-5" />
                    </button>
                  </>
                )}
             </div>
           </div>
        </div>

        {/* Contact Info Section */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
          <div className="flex items-start gap-3">
             <div className="p-2 bg-gray-100 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-600" />
             </div>
             <div className="flex-1">
               <p className="text-sm text-gray-500 font-medium">Empresa</p>
               {isEditingProfile ? (
                 <input 
                    type="text" 
                    value={editForm.company}
                    onChange={e => setEditForm({...editForm, company: e.target.value})}
                    className="w-full border-gray-300 border rounded px-2 py-1 mt-1 text-gray-900"
                  />
               ) : (
                 <p className="text-gray-900 font-medium">{member.company}</p>
               )}
             </div>
          </div>
          <div className="flex items-start gap-3">
             <div className="p-2 bg-gray-100 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600" />
             </div>
             <div className="flex-1">
               <p className="text-sm text-gray-500 font-medium">Teléfono</p>
               {isEditingProfile ? (
                 <input 
                    type="text" 
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full border-gray-300 border rounded px-2 py-1 mt-1 text-gray-900"
                  />
               ) : (
                 <p className="text-gray-900 font-medium">{member.phone}</p>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('references')}
            className={`flex-1 py-4 text-center font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'references' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <ScrollText className="w-4 h-4" />
            Historial de Referencias
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`flex-1 py-4 text-center font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'guests' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <UserPlus className="w-4 h-4" />
            Invitados Traídos ({invitedGuests.length})
          </button>
      </div>

      {/* Tab Content: References */}
      {activeTab === 'references' && (
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Peticiones Semanales
            </h2>

            {member.references.length === 0 ? (
            <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No hay referencias registradas aún.
            </div>
            ) : (
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pl-8 py-2">
                {member.references.map((ref, idx) => (
                <div key={ref.id} className="relative">
                    <span className="absolute -left-[41px] top-1 h-5 w-5 rounded-full border-2 border-white bg-primary-500 ring-4 ring-gray-50"></span>
                    <div className="mb-1 flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {new Date(ref.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    
                    {editingRefId === ref.id ? (
                        <div className="flex gap-2">
                            <button onClick={() => setEditingRefId(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                            <button onClick={() => saveReference(ref.id)} className="text-green-600 hover:text-green-700">
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => startEditingRef(ref.id, ref.text)} className="text-gray-300 hover:text-primary-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                    </div>

                    {editingRefId === ref.id ? (
                        <div className="mt-2">
                            <textarea
                                value={editRefText}
                                onChange={(e) => setEditRefText(e.target.value)}
                                rows={3}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm p-3 border"
                            />
                        </div>
                    ) : (
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 text-gray-800 mt-2 shadow-sm font-handwriting">
                            <p className="italic">"{ref.text}"</p>
                        </div>
                    )}
                </div>
                ))}
            </div>
            )}
        </div>
      )}

      {/* Tab Content: Guests */}
      {activeTab === 'guests' && (
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 animate-fade-in">
             <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                Historial de Invitados
            </h2>

            {invitedGuests.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p>Este miembro aún no ha traído invitados registrados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invitedGuests.map(guest => (
                        <div key={guest.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900">{guest.name}</h3>
                                <span className="text-xs text-gray-500">{new Date(guest.visitDate).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1"><span className="font-medium text-xs uppercase text-gray-400">Empresa:</span> {guest.company}</p>
                            <p className="text-sm text-gray-600 mb-2"><span className="font-medium text-xs uppercase text-gray-400">Sector:</span> {guest.sector}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 mt-2">
                                <Phone className="w-3 h-3" /> {guest.phone}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
};
