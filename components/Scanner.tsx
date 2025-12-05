
import React, { useState } from 'react';
import { Camera, Upload, Loader2, ArrowRight, AlertCircle, FileText, UserCheck, UserPlus, Building2, MessageSquare, User } from 'lucide-react';
import { parseNetworkingSheet } from '../services/geminiService';
import { ExtractedEntry, ProcessingStatus } from '../types';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

export const Scanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedEntry[]>([]);
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { addOrUpdateMembers, members } = useData();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setStatus('idle');
      setExtractedData([]);
      setErrorMessage('');
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setStatus('processing');
    setErrorMessage('');
    try {
      const data = await parseNetworkingSheet(file);
      setExtractedData(data);
      setStatus('review');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || "Error desconocido");
    }
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await addOrUpdateMembers(extractedData, meetingDate);
      setStatus('success');
      setTimeout(() => {
        navigate('/summary');
      }, 1500);
    } catch (error: any) {
      console.error("Error saving data:", error);
      const msg = error.message || JSON.stringify(error);
      alert(`Error al guardar en la base de datos: ${msg}. Verifica tu conexión y permisos.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEntryChange = (index: number, field: keyof ExtractedEntry, value: any) => {
    const updated = [...extractedData];
    // @ts-ignore
    updated[index][field] = value;
    setExtractedData(updated);
  };

  const toggleGuest = (index: number) => {
    const updated = [...extractedData];
    updated[index].isGuest = !updated[index].isGuest;
    // Reset or guess inviter if switching to guest
    if (updated[index].isGuest && !updated[index].invitedByName) {
        updated[index].invitedByName = "";
    }
    setExtractedData(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-600" />
          Nueva Hoja de Asistencia
        </h2>
        
        {/* Date Selection */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de la Reunión</label>
            <input 
                type="date" 
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
            />
        </div>

        {/* File Input */}
        <div className="flex flex-col items-center justify-center w-full">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p>
                <p className="text-xs text-gray-500">Imágenes (JPG, PNG)</p>
              </div>
            )}
            <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
          </label>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          {status === 'processing' ? (
            <button disabled className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg cursor-not-allowed">
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando Imagen con IA...
            </button>
          ) : status === 'idle' && file ? (
             <button onClick={handleProcess} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <FileText className="w-4 h-4" />
              Analizar Hoja
            </button>
          ) : null}
        </div>
        
        {status === 'error' && (
             <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                 <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                 <div>
                   <p className="font-medium">Error al procesar la imagen</p>
                   <p className="text-sm mt-1">{errorMessage.includes("API Key") ? "Falta configuración en Vercel: Añade la variable VITE_API_KEY." : errorMessage}</p>
                 </div>
             </div>
        )}
      </div>

      {/* Review Section */}
      {status === 'review' && extractedData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
           <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revisar Datos Extraídos ({extractedData.length})</h3>
                <span className="text-xs text-gray-500 bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Edita si es necesario</span>
           </div>
           
           {/* DESKTOP VIEW: Table */}
           <div className="hidden md:block overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 w-16">Tipo</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500">Nombre</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500">Empresa</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 w-1/3">Info Adicional</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {extractedData.map((entry, idx) => (
                        <tr key={idx} className={entry.isGuest ? "bg-amber-50" : ""}>
                            <td className="px-3 py-2 text-center">
                                <button 
                                    onClick={() => toggleGuest(idx)}
                                    className={`p-1.5 rounded-md transition-colors ${entry.isGuest ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    title={entry.isGuest ? "Es Invitado" : "Es Miembro"}
                                >
                                    {entry.isGuest ? <UserPlus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                            </td>
                            <td className="px-3 py-2">
                                <input 
                                    value={entry.name} 
                                    onChange={(e) => handleEntryChange(idx, 'name', e.target.value)}
                                    className="w-full border-gray-300 rounded p-1 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Nombre"
                                />
                            </td>
                             <td className="px-3 py-2">
                                <input 
                                    value={entry.company} 
                                    onChange={(e) => handleEntryChange(idx, 'company', e.target.value)}
                                    className="w-full border-gray-300 rounded p-1 text-gray-500"
                                    placeholder="Empresa"
                                />
                            </td>
                            <td className="px-3 py-2">
                                {entry.isGuest ? (
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 mb-1">Invitado por:</span>
                                        <select 
                                            value={entry.invitedByName || ""} 
                                            onChange={(e) => handleEntryChange(idx, 'invitedByName', e.target.value)}
                                            className="w-full border-amber-300 rounded p-1 text-sm bg-white"
                                        >
                                            <option value="">-- Seleccionar Miembro --</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.name}>{m.name}</option>
                                            ))}
                                            {entry.invitedByName && !members.find(m => m.name === entry.invitedByName) && (
                                                <option value={entry.invitedByName}>{entry.invitedByName} (Texto detectado)</option>
                                            )}
                                        </select>
                                    </div>
                                ) : (
                                    <textarea 
                                        value={entry.handwrittenRequest} 
                                        onChange={(e) => handleEntryChange(idx, 'handwrittenRequest', e.target.value)}
                                        className={`w-full border rounded p-1 text-sm ${entry.handwrittenRequest ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-gray-50 text-gray-400'}`}
                                        rows={2}
                                        placeholder="Referencia solicitada..."
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
           </div>

           {/* MOBILE VIEW: Cards */}
           <div className="md:hidden space-y-4">
              {extractedData.map((entry, idx) => (
                  <div key={idx} className={`border rounded-lg p-4 shadow-sm flex flex-col gap-3 ${entry.isGuest ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                      {/* Header: Toggle & Name */}
                      <div className="flex items-start gap-3">
                          <button 
                              onClick={() => toggleGuest(idx)}
                              className={`p-3 rounded-lg shrink-0 transition-colors ${entry.isGuest ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          >
                              {entry.isGuest ? <UserPlus className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                              <span className="sr-only">{entry.isGuest ? "Es Invitado" : "Es Miembro"}</span>
                          </button>
                          <div className="flex-1 min-w-0">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nombre</label>
                              <input 
                                  value={entry.name} 
                                  onChange={(e) => handleEntryChange(idx, 'name', e.target.value)}
                                  className="w-full border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 font-medium text-gray-900 border shadow-sm"
                                  placeholder="Nombre completo"
                              />
                          </div>
                      </div>

                      {/* Company Field */}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> Empresa
                          </label>
                          <input 
                              value={entry.company} 
                              onChange={(e) => handleEntryChange(idx, 'company', e.target.value)}
                              className="w-full border-gray-300 rounded-md p-2 text-gray-700 border shadow-sm"
                              placeholder="Nombre de la empresa"
                          />
                      </div>

                      {/* Dynamic Field: Reference or Inviter */}
                      <div>
                          {entry.isGuest ? (
                              <>
                                  <label className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                                      <User className="w-3 h-3" /> Invitado Por
                                  </label>
                                  <select 
                                      value={entry.invitedByName || ""} 
                                      onChange={(e) => handleEntryChange(idx, 'invitedByName', e.target.value)}
                                      className="w-full border-amber-300 rounded-md p-2 text-sm bg-white border shadow-sm"
                                  >
                                      <option value="">-- Seleccionar Miembro --</option>
                                      {members.map(m => (
                                          <option key={m.id} value={m.name}>{m.name}</option>
                                      ))}
                                      {entry.invitedByName && !members.find(m => m.name === entry.invitedByName) && (
                                          <option value={entry.invitedByName}>{entry.invitedByName} (Texto detectado)</option>
                                      )}
                                  </select>
                              </>
                          ) : (
                              <>
                                  <label className="text-xs font-bold text-green-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" /> Referencias Deseadas
                                  </label>
                                  <textarea 
                                      value={entry.handwrittenRequest} 
                                      onChange={(e) => handleEntryChange(idx, 'handwrittenRequest', e.target.value)}
                                      className={`w-full border rounded-md p-2 text-sm shadow-sm ${entry.handwrittenRequest ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                                      rows={3}
                                      placeholder="Escribe aquí las referencias solicitadas..."
                                  />
                              </>
                          )}
                      </div>
                  </div>
              ))}
           </div>

           <div className="mt-6 flex justify-end gap-3 sticky bottom-0 bg-white p-4 border-t md:static md:border-0 md:p-0 md:bg-transparent z-10">
               <button 
                  onClick={() => setStatus('idle')} 
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
               >
                 Cancelar
               </button>
               <button 
                  onClick={handleConfirm} 
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
               >
                   {isSaving ? (
                     <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                     </>
                   ) : (
                     <>
                        Confirmar y Guardar
                        <ArrowRight className="w-4 h-4" />
                     </>
                   )}
               </button>
           </div>
        </div>
      )}

      {status === 'success' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-xl flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <ArrowRight className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">¡Datos Guardados!</h3>
                  <p className="text-gray-500 mt-2">Redirigiendo al resumen...</p>
              </div>
          </div>
      )}
    </div>
  );
};
