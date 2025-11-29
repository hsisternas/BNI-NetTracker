import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Member, ExtractedEntry, Reference, ProcessedSheetResult } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  members: Member[];
  lastScan: ProcessedSheetResult | null;
  addOrUpdateMembers: (entries: ExtractedEntry[], date: string) => void;
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
  const [dataLoaded, setDataLoaded] = useState(false);

  // Dynamic keys based on User ID
  const STORAGE_KEY = user ? `networking_app_data_${user.id}` : null;
  const LAST_SCAN_KEY = user ? `networking_app_last_scan_${user.id}` : null;

  // Load data when user changes
  useEffect(() => {
    if (!user || !STORAGE_KEY || !LAST_SCAN_KEY) {
      setMembers([]);
      setLastScan(null);
      return;
    }

    const storedMembers = localStorage.getItem(STORAGE_KEY);
    if (storedMembers) {
      try {
        setMembers(JSON.parse(storedMembers));
      } catch (e) {
        console.error("Failed to parse stored members", e);
      }
    } else {
        setMembers([]);
    }

    const storedLastScan = localStorage.getItem(LAST_SCAN_KEY);
    if (storedLastScan) {
      try {
        setLastScan(JSON.parse(storedLastScan));
      } catch (e) {
        console.error("Failed to parse stored last scan", e);
      }
    } else {
        setLastScan(null);
    }
    
    setDataLoaded(true);
  }, [user, STORAGE_KEY, LAST_SCAN_KEY]);

  // Save to local storage whenever members change
  useEffect(() => {
    if (user && STORAGE_KEY && dataLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    }
  }, [members, user, STORAGE_KEY, dataLoaded]);

  // Save last scan to local storage
  useEffect(() => {
    if (user && LAST_SCAN_KEY && dataLoaded && lastScan) {
      localStorage.setItem(LAST_SCAN_KEY, JSON.stringify(lastScan));
    }
  }, [lastScan, user, LAST_SCAN_KEY, dataLoaded]);

  const addOrUpdateMembers = useCallback((entries: ExtractedEntry[], date: string) => {
    if (!user) return;

    // Save this batch as the last scan
    setLastScan({ date, entries });

    setMembers(prevMembers => {
      const newMembersMap = new Map<string, Member>(
        prevMembers.map(m => [m.id, m] as [string, Member])
      );

      entries.forEach(entry => {
        // Normalize ID (simple lowercase trim for this demo)
        const normalizedId = entry.name.trim().toLowerCase().replace(/\s+/g, '-');
        
        const existingMember = newMembersMap.get(normalizedId);

        // Prepare the new reference if handwritten request exists
        const newReference: Reference | null = entry.handwrittenRequest && entry.handwrittenRequest.trim().length > 0 
          ? {
              id: Date.now().toString() + Math.random().toString().slice(2),
              date: date,
              text: entry.handwrittenRequest.trim(),
            }
          : null;

        if (existingMember) {
          // Check if we already have a reference for this date to avoid duplicates if re-scanning same sheet
          const hasRefForDate = existingMember.references.some(r => r.date === date);
          
          let updatedRefs = existingMember.references;
          if (newReference && !hasRefForDate) {
             updatedRefs = [newReference, ...existingMember.references];
          } else if (newReference && hasRefForDate) {
             // Update existing ref for today if re-scanning
             updatedRefs = existingMember.references.map(r => r.date === date ? newReference : r);
          }

          const updatedMember: Member = {
            ...existingMember,
            company: entry.company || existingMember.company,
            sector: entry.sector || existingMember.sector,
            phone: entry.phone || existingMember.phone,
            references: updatedRefs
          };
          newMembersMap.set(normalizedId, updatedMember);
        } else {
          // Create new member
          const newMember: Member = {
            id: normalizedId,
            name: entry.name,
            company: entry.company,
            sector: entry.sector,
            phone: entry.phone,
            createdAt: new Date().toISOString(),
            references: newReference ? [newReference] : []
          };
          newMembersMap.set(normalizedId, newMember);
        }
      });

      return Array.from(newMembersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [user]);

  const getMember = useCallback((id: string) => {
    return members.find(m => m.id === id);
  }, [members]);

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMemberProfile = useCallback((id: string, data: Partial<Omit<Member, 'id' | 'references' | 'createdAt'>>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const updateReference = useCallback((memberId: string, refId: string, newText: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      return {
        ...m,
        references: m.references.map(r => r.id === refId ? { ...r, text: newText } : r)
      };
    }));
  }, []);

  const updateLastScanEntry = useCallback((index: number, field: keyof ExtractedEntry, value: string) => {
    if (!lastScan) return;

    // 1. Update the local scan state so the UI reflects changes immediately
    const updatedEntries = [...lastScan.entries];
    // @ts-ignore
    updatedEntries[index][field] = value;
    
    const updatedScan = { ...lastScan, entries: updatedEntries };
    setLastScan(updatedScan);

    // 2. Sync changes to the permanent Members database
    const entry = updatedEntries[index];
    const normalizedId = entry.name.trim().toLowerCase().replace(/\s+/g, '-');
    const scanDate = lastScan.date;

    setMembers(prev => prev.map(m => {
      if (m.id !== normalizedId) return m;

      // Update profile info if changed
      const updatedMember = { ...m };
      if (field === 'company') updatedMember.company = value;
      if (field === 'sector') updatedMember.sector = value;
      if (field === 'phone') updatedMember.phone = value;

      // Update Reference if the 'handwrittenRequest' changed
      if (field === 'handwrittenRequest') {
        // Find reference for this date
        const refIndex = updatedMember.references.findIndex(r => r.date === scanDate);
        if (refIndex >= 0) {
          // Update existing reference
          const newRefs = [...updatedMember.references];
          newRefs[refIndex] = { ...newRefs[refIndex], text: value };
          updatedMember.references = newRefs;
        } else if (value.trim().length > 0) {
          // If no reference existed for this date but user added text, create one
          const newRef: Reference = {
             id: Date.now().toString(),
             date: scanDate,
             text: value
          };
          updatedMember.references = [newRef, ...updatedMember.references];
        }
      }

      return updatedMember;
    }));

  }, [lastScan]);

  const clearAll = useCallback(() => {
    if(window.confirm("¿Seguro que quieres borrar todos los datos de tu cuenta?")) {
      setMembers([]);
      setLastScan(null);
      if (user && LAST_SCAN_KEY) {
          localStorage.removeItem(LAST_SCAN_KEY);
      }
    }
  }, [user, LAST_SCAN_KEY]);

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