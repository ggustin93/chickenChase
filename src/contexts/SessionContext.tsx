import React, { createContext, useState, useContext, ReactNode } from 'react';

// 1. Définir la structure de notre session
interface Session {
  playerId: string | null;
  gameId: string | null;
  nickname: string | null;
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
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Initialiser la session depuis le localStorage s'il existe
  const [session, setSessionState] = useState<Session>(() => {
    const savedSession = localStorage.getItem('player-session');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error("Erreur lors de la récupération de la session:", e);
        return { playerId: null, gameId: null, nickname: null };
      }
    }
    return { playerId: null, gameId: null, nickname: null };
  });

  // Fonction pour mettre à jour la session et la sauvegarder dans localStorage
  const setSession = (newSession: Session) => {
    setSessionState(newSession);
    localStorage.setItem('player-session', JSON.stringify(newSession));
  };

  // Fonction pour effacer la session
  const clearSession = () => {
    setSessionState({ playerId: null, gameId: null, nickname: null });
    localStorage.removeItem('player-session');
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