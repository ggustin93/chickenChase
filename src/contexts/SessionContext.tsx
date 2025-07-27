import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { safeLocalStorage } from '../utils/performanceUtils';
import { logError } from '../utils/errorUtils';

// Constants for session management
const SESSION_STORAGE_KEY = 'player-session';

// 1. Définir la structure de notre session
interface Session {
  playerId: string | null;
  gameId: string | null;
  nickname: string | null;
  teamId: string | null; // Ajout de teamId
}

// 2. Définir ce que notre Contexte va fournir
interface SessionContextType {
  session: Session;
  setSession: (session: Session) => void;
  clearSession: () => void;
}

// 3. Créer le Contexte avec une valeur par défaut
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// 4. Créer le "Fournisseur" de Contexte
// C'est un composant qui enveloppera notre application
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialiser la session depuis le localStorage avec error handling
  const [session, setSession] = useState<Session>(() => {
    const defaultSession = { playerId: null, gameId: null, nickname: null, teamId: null };
    const savedSession = safeLocalStorage.get<Session>(SESSION_STORAGE_KEY, defaultSession);
    return savedSession || defaultSession;
  });

  useEffect(() => {
    if (session.playerId) {
      const success = safeLocalStorage.set(SESSION_STORAGE_KEY, session);
      if (!success) {
        logError('Failed to save session to localStorage', { session });
      }
    } else {
      safeLocalStorage.remove(SESSION_STORAGE_KEY);
    }
  }, [session]);

  // Fonction pour effacer la session avec useCallback
  const clearSession = useCallback(() => {
    const defaultSession = { playerId: null, gameId: null, nickname: null, teamId: null };
    setSession(defaultSession);
  }, []);

  return (
    <SessionContext.Provider value={{ session, setSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
};

// 5. Créer un "Hook" personnalisé pour utiliser facilement notre contexte
// C'est ce que nos pages utiliseront pour accéder à la session
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}; 