import React, { useState } from 'react';
import { Camera, Upload, Loader2, ArrowRight, AlertCircle, FileText } from 'lucide-react';
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
  const { addOrUpdateMembers } = useData();
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

  const handleConfirm = () => {
    addOrUpdateMembers(extractedData, meetingDate);
    setStatus('success');
    setTimeout(() => {
      navigate('/summary');
    }, 1500);
  };

  const handleEntryChange = (index: number, field: keyof ExtractedEntry, value: string) => {
    const updated = [...extractedData];
    // @ts-ignore
    updated[index][field] = value;
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
           
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3 text-left font-medium text-gray-500">Miembro</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500">Empresa</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500">Sector</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 w-1/3">Ref. Solicitada (Escrito a mano)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {extractedData.map((entry, idx) => (
                        <tr key={idx}>
                            <td className="px-3 py-2">
                                <input 
                                    value={entry.name} 
                                    onChange={(e) => handleEntryChange(idx, 'name', e.target.value)}
                                    className="w-full border-gray-300 rounded p-1 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </td>
                             <td className="px-3 py-2">
                                <input 
                                    value={entry.company} 
                                    onChange={(e) => handleEntryChange(idx, 'company', e.target.value)}
                                    className="w-full border-gray-300 rounded p-1 text-gray-500"
                                />
                            </td>
                             <td className="px-3 py-2">
                                <input 
                                    value={entry.sector} 
                                    onChange={(e) => handleEntryChange(idx, 'sector', e.target.value)}
                                    className="w-full border-gray-300 rounded p-1 text-gray-500"
                                />
                            </td>
                            <td className="px-3 py-2">
                                <textarea 
                                    value={entry.handwrittenRequest} 
                                    onChange={(e) => handleEntryChange(idx, 'handwrittenRequest', e.target.value)}
                                    className={`w-full border rounded p-1 text-sm ${entry.handwrittenRequest ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-gray-50 text-gray-400'}`}
                                    rows={2}
                                    placeholder="Sin referencias"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
           </div>

           <div className="mt-6 flex justify-end gap-3">
               <button onClick={() => setStatus('idle')} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
               <button onClick={handleConfirm} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm">
                   Confirmar y Guardar
                   <ArrowRight className="w-4 h-4" />
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