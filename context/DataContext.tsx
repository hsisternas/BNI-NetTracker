
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Member, ExtractedEntry, Reference, ProcessedSheetResult, Guest } from '../types';
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
  guests: Guest[];
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
  const [guests, setGuests] = useState<Guest[]>([]);
  const [lastScan, setLastScan] = useState<ProcessedSheetResult | null>(null);

  // --- Sincronización en Tiempo Real con Firestore ---

  useEffect(() => {
    if (!user) {
      setMembers([]);
      setGuests([]);
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

    // 2. Escuchar Invitados
    const guestsRef = collection(db, "guests");
    const qGuests = query(guestsRef, where("userId", "==", user.id));

    const unsubGuests = onSnapshot(qGuests, (snapshot) => {
      const fetchedGuests: Guest[] = [];
      snapshot.forEach((doc) => {
        fetchedGuests.push(doc.data() as Guest);
      });
      setGuests(fetchedGuests.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()));
    });

    // 3. Escuchar Último Escaneo (Guardado en un documento único por usuario)
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
      unsubGuests();
      unsubScan();
    };
  }, [user]);

  // --- Acciones ---

  const addOrUpdateMembers = useCallback(async (entries: ExtractedEntry[], date: string) => {
    if (!user) return;

    // 1. Guardar Last Scan en Firestore
    const scanData: ProcessedSheetResult = { date, entries };
    await setDoc(doc(db, "lastScans", user.id), scanData);

    // 2. Procesar Entradas (Miembros o Invitados)
    const membersMap = new Map<string, Member>(
      members.map(m => [m.id, m])
    );

    for (const entry of entries) {
      const cleanName = entry.name.trim().toLowerCase().replace(/\s+/g, '-');
      const normalizedId = `${user.id}_${cleanName}`;

      if (entry.isGuest) {
        // --- LÓGICA DE INVITADOS ---
        // Buscar el ID del miembro que invitó
        let inviterId = "";
        let inviterName = entry.invitedByName || "";
        
        if (entry.invitedByName) {
             const inviter = members.find(m => m.name.toLowerCase().includes(entry.invitedByName?.toLowerCase() || ""));
             if (inviter) {
                 inviterId = inviter.id;
                 inviterName = inviter.name;
             }
        }

        const newGuest: Guest = {
            id: Date.now().toString() + Math.random().toString().slice(2),
            userId: user.id,
            name: entry.name,
            company: entry.company,
            sector: entry.sector,
            phone: entry.phone,
            visitDate: date,
            invitedByMemberId: inviterId,
            invitedByMemberName: inviterName
        };

        // Guardar en colección de invitados
        await setDoc(doc(db, "guests", newGuest.id), newGuest);

      } else {
        // --- LÓGICA DE MIEMBROS ---
        const existingMember = membersMap.get(normalizedId);

        const newReference: Reference | null = entry.handwrittenRequest && entry.handwrittenRequest.trim().length > 0 
          ? {
              id: Date.now().toString() + Math.random().toString().slice(2),
              date: date,
              text: entry.handwrittenRequest.trim(),
            }
          : null;

        if (existingMember) {
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

          await setDoc(doc(db, "members", normalizedId), updatedMember);

        } else {
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

    // 1. Actualizar Last Scan
    const updatedEntries = [...lastScan.entries];
    // @ts-ignore
    updatedEntries[index][field] = value;
    await setDoc(doc(db, "lastScans", user.id), { ...lastScan, entries: updatedEntries });

    // 2. Sincronizar si es Miembro (Los invitados no se editan desde aquí por ahora)
    const entry = updatedEntries[index];
    if (!entry.isGuest) {
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
      
      // 3. Borrar invitados
      const guestsRef = collection(db, "guests");
      const qGuests = query(guestsRef, where("userId", "==", user.id));
      const snapshotGuests = await getDocs(qGuests);
      const deleteGuestPromises = snapshotGuests.docs.map(doc => deleteDoc(doc.ref));

      await Promise.all([...deletePromises, ...deleteGuestPromises]);
    }
  }, [user]);

  return (
    <DataContext.Provider value={{ 
      members, 
      guests,
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
