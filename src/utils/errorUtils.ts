/**
 * Error handling utilities for improved maintainability and type safety
 */

// Standard error messages for consistency
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Erreur de connexion reseau',
  TIMEOUT_ERROR: 'Delai d\'attente depasse',
  
  // Authentication errors
  INVALID_SESSION: 'Session invalide ou expiree',
  UNAUTHORIZED: 'Acces non autorise',
  
  // Game errors
  GAME_NOT_FOUND: 'Partie non trouvee',
  PLAYER_NOT_FOUND: 'Joueur non trouve',
  TEAM_NOT_FOUND: 'Equipe non trouvee',
  INVALID_GAME_STATE: 'Etat de jeu invalide',
  
  // Generic errors
  GENERIC_ERROR: 'Une erreur inattendue s\'est produite',
  VALIDATION_ERROR: 'Donnees invalides',
  SERVER_ERROR: 'Erreur serveur'
} as const;

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Enhanced error interface
export interface AppError extends Error {
  code?: string;
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  timestamp?: number;
  userId?: string;
}

/**
 * Creates a standardized error object
 */
export const createAppError = (
  message: string,
  code?: string,
  severity: ErrorSeverity = 'medium',
  context?: Record<string, unknown>
): AppError => {
  const error = new Error(message) as AppError;
  error.code = code;
  error.severity = severity;
  error.context = context;
  error.timestamp = Date.now();
  return error;
};

/**
 * Safe error message extraction
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return ERROR_MESSAGES.GENERIC_ERROR;
};

/**
 * Type-safe error checking
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof Error && 'code' in error;
};

/**
 * Error logging utility with context
 */
export const logError = (
  error: unknown,
  context?: Record<string, unknown>
): void => {
  const errorMessage = getErrorMessage(error);
  const logContext = {
    timestamp: new Date().toISOString(),
    error: errorMessage,
    ...context
  };
  
  if (isAppError(error) && error.severity === 'critical') {
    console.error('CRITICAL ERROR:', logContext);
  } else {
    console.error('Error:', logContext);
  }
};

/**
 * Async error boundary wrapper
 */
export const safeAsyncCall = async <T>(
  asyncFn: () => Promise<T>,
  fallbackValue?: T,
  context?: Record<string, unknown>
): Promise<T | undefined> => {
  try {
    return await asyncFn();
  } catch (error) {
    logError(error, context);
    return fallbackValue;
  }
};

/**
 * Retry logic for failed operations
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};