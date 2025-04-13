import { useState, useEffect } from 'react';

interface UseCagnotteConsumptionProps {
  currentCagnotte: number;
  onCagnotteConsumption?: (amount: number, reason: string) => void;
}

interface UseCagnotteConsumptionReturn {
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;
  amount?: number;
  setAmount: (value?: number) => void;
  error: string;
  handleSubmit: () => void;
  resetForm: () => void;
  localCagnotte: number;
}

/**
 * Hook personnalisé pour gérer la consommation de la cagnotte
 * Sépare la logique métier de l'interface utilisateur
 */
export const useCagnotteConsumption = ({
  currentCagnotte,
  onCagnotteConsumption
}: UseCagnotteConsumptionProps): UseCagnotteConsumptionReturn => {
  // État de la modale
  const [showModal, setShowModal] = useState(false);
  
  // Valeur entrée par l'utilisateur
  const [amount, setAmount] = useState<number | undefined>(undefined);
  
  // Message d'erreur
  const [error, setError] = useState('');
  
  // Gardez une copie locale du montant de la cagnotte pour refléter les mises à jour immédiatement
  const [localCagnotte, setLocalCagnotte] = useState(currentCagnotte);
  
  // Mettre à jour la copie locale quand les props changent
  useEffect(() => {
    setLocalCagnotte(currentCagnotte);
  }, [currentCagnotte]);

  // Ouvrir la modale
  const openModal = () => {
    setShowModal(true);
  };

  // Fermer la modale
  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setAmount(undefined);
    setError('');
  };

  // Gérer la soumission du formulaire
  const handleSubmit = () => {
    // Validation
    if (!amount || amount <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }
    
    if (amount > localCagnotte) {
      setError(`Le montant ne peut pas dépasser la cagnotte (${localCagnotte}€)`);
      return;
    }
    
    // Mise à jour immédiate de la cagnotte locale
    setLocalCagnotte(prevCagnotte => Math.max(0, prevCagnotte - amount));
    
    // Exécuter le callback si disponible
    if (onCagnotteConsumption) {
      onCagnotteConsumption(amount, 'Dépense cagnotte');
      resetForm();
      setShowModal(false);
    }
  };

  return {
    showModal,
    openModal,
    closeModal,
    amount,
    setAmount,
    error,
    handleSubmit,
    resetForm,
    localCagnotte
  };
};

export default useCagnotteConsumption; 