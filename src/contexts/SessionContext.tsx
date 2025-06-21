import React, { createContext, useState, useContext, useEffect } from 'react';

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
  // Initialiser la session depuis le localStorage s'il existe
  const [session, setSession] = useState<Session>(() => {
    const savedSession = localStorage.getItem('player-session');
    return savedSession ? JSON.parse(savedSession) : { playerId: null, gameId: null, nickname: null, teamId: null };
  });

  useEffect(() => {
    if (session.playerId) {
      localStorage.setItem('player-session', JSON.stringify(session));
    } else {
      localStorage.removeItem('player-session');
    }
  }, [session]);

  // Fonction pour effacer la session
  const clearSession = () => {
    setSession({ playerId: null, gameId: null, nickname: null, teamId: null });
  };

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