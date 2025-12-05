
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Member, ExtractedEntry, Reference, ProcessedSheetResult } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';

interface DataContextType {
  members: Member[];
  lastScan: ProcessedSheetResult | null;
  addOrUpdateMembers: (entries: ExtractedEntry[], date: string) => Promise<void>;
  getMember: (id: string) => Member | undefined;
  deleteMember: (id: string) => void;
  clearAll: () => void;
  updateMemberProfile: (id: string, data: Partial<Omit<Member, 'id' | 'references' | 'createdAt'>>) => void;
  updateReference: (memberId: string, refId: string, newText: string) => void;
  updateLastScanEntry: (index: number, field: keyof ExtractedEntry, value: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [lastScan, setLastScan] = useState<ProcessedSheetResult | null>(null);

  // --- Sincronización en Tiempo Real con Firestore ---

  useEffect(() => {
    if (!user) {
      setMembers([]);
      setLastScan(null);
      return;
    }

    // 1. Escuchar Miembros (Filtrados por ID de usuario para privacidad)
    const membersRef = collection(db, "members");
    const qMembers = query(membersRef, where("userId", "==", user.id));

    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      const fetchedMembers: Member[] = [];
      snapshot.forEach((doc) => {
        fetchedMembers.push(doc.data() as Member);
      });
      // Ordenar alfabéticamente
      setMembers(fetchedMembers.sort((a, b) => a.name.localeCompare(b.name)));
    });

    // 2. Escuchar Último Escaneo (Guardado en un documento único por usuario)
    const lastScanRef = doc(db, "lastScans", user.id);
    const unsubScan = onSnapshot(lastScanRef, (doc) => {
      if (doc.exists()) {
        setLastScan(doc.data() as ProcessedSheetResult);
      } else {
        setLastScan(null);
      }
    });

    return () => {
      unsubMembers();
      unsubScan();
    };
  }, [user]);

  // --- Acciones ---

  const addOrUpdateMembers = useCallback(async (entries: ExtractedEntry[], date: string) => {
    if (!user) return;

    // 1. Guardar Last Scan en Firestore
    const scanData: ProcessedSheetResult = { date, entries };
    await setDoc(doc(db, "lastScans", user.id), scanData);

    // 2. Procesar Miembros
    // Crear mapa de miembros actuales para búsqueda rápida
    const membersMap = new Map<string, Member>(
      members.map(m => [m.id, m])
    );

    for (const entry of entries) {
      // GENERACIÓN DE ID ÚNICO: userId + nombre normalizado
      // Esto evita colisiones entre usuarios diferentes que tienen miembros con el mismo nombre.
      const cleanName = entry.name.trim().toLowerCase().replace(/\s+/g, '-');
      const normalizedId = `${user.id}_${cleanName}`;

      const existingMember = membersMap.get(normalizedId);

      const newReference: Reference | null = entry.handwrittenRequest && entry.handwrittenRequest.trim().length > 0 
        ? {
            id: Date.now().toString() + Math.random().toString().slice(2),
            date: date,
            text: entry.handwrittenRequest.trim(),
          }
        : null;

      if (existingMember) {
        // Lógica de actualización de referencias
        const hasRefForDate = existingMember.references.some(r => r.date === date);
        let updatedRefs = existingMember.references;

        if (newReference && !hasRefForDate) {
            updatedRefs = [newReference, ...existingMember.references];
        } else if (newReference && hasRefForDate) {
            updatedRefs = existingMember.references.map(r => r.date === date ? newReference : r);
        }

        const updatedMember: Member & { userId: string } = {
          ...existingMember,
          company: entry.company || existingMember.company,
          sector: entry.sector || existingMember.sector,
          phone: entry.phone || existingMember.phone,
          references: updatedRefs,
          userId: user.id
        };

        // Guardar en Firestore
        await setDoc(doc(db, "members", normalizedId), updatedMember);

      } else {
        // Nuevo Miembro
        const newMember: Member & { userId: string } = {
          id: normalizedId,
          userId: user.id,
          name: entry.name,
          company: entry.company,
          sector: entry.sector,
          phone: entry.phone,
          createdAt: new Date().toISOString(),
          references: newReference ? [newReference] : []
        };
        await setDoc(doc(db, "members", normalizedId), newMember);
      }
    }
  }, [user, members]);

  const getMember = useCallback((id: string) => {
    return members.find(m => m.id === id);
  }, [members]);

  const deleteMember = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "members", id));
  }, []);

  const updateMemberProfile = useCallback(async (id: string, data: Partial<Omit<Member, 'id' | 'references' | 'createdAt'>>) => {
    const memberRef = doc(db, "members", id);
    await updateDoc(memberRef, data);
  }, []);

  const updateReference = useCallback(async (memberId: string, refId: string, newText: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const updatedRefs = member.references.map(r => r.id === refId ? { ...r, text: newText } : r);
    const memberRef = doc(db, "members", memberId);
    await updateDoc(memberRef, { references: updatedRefs });
  }, [members]);

  const updateLastScanEntry = useCallback(async (index: number, field: keyof ExtractedEntry, value: string) => {
    if (!lastScan || !user) return;

    // 1. Actualizar Last Scan en Firestore
    const updatedEntries = [...lastScan.entries];
    // @ts-ignore
    updatedEntries[index][field] = value;
    
    await setDoc(doc(db, "lastScans", user.id), { ...lastScan, entries: updatedEntries });

    // 2. Sincronizar con el perfil del miembro en Firestore
    const entry = updatedEntries[index];
    
    // GENERACIÓN DE ID ÚNICO (Misma lógica que en addOrUpdateMembers)
    const cleanName = entry.name.trim().toLowerCase().replace(/\s+/g, '-');
    const normalizedId = `${user.id}_${cleanName}`;

    const member = members.find(m => m.id === normalizedId);

    if (member) {
      const scanDate = lastScan.date;
      const updates: any = {};

      if (field === 'company') updates.company = value;
      if (field === 'sector') updates.sector = value;
      if (field === 'phone') updates.phone = value;

      if (field === 'handwrittenRequest') {
        const refIndex = member.references.findIndex(r => r.date === scanDate);
        let newRefs = [...member.references];
        
        if (refIndex >= 0) {
           newRefs[refIndex] = { ...newRefs[refIndex], text: value };
        } else if (value.trim().length > 0) {
           newRefs = [{ id: Date.now().toString(), date: scanDate, text: value }, ...newRefs];
        }
        updates.references = newRefs;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "members", normalizedId), updates);
      }
    }

  }, [lastScan, user, members]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    if(window.confirm("¿Seguro que quieres borrar todos los datos de tu cuenta?")) {
      
      // 1. Borrar Last Scan
      await deleteDoc(doc(db, "lastScans", user.id));

      // 2. Borrar miembros
      const membersRef = collection(db, "members");
      const q = query(membersRef, where("userId", "==", user.id));
      const snapshot = await getDocs(q); 
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }
  }, [user]);

  return (
    <DataContext.Provider value={{ 
      members, 
      lastScan, 
      addOrUpdateMembers, 
      getMember, 
      deleteMember, 
      clearAll,
      updateMemberProfile,
      updateReference,
      updateLastScanEntry
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
