import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { validateProgramItem } from '../utils/validation';
import { useImageUpload } from './useImageUpload';
import type { FestivalProgramItem } from '../types/event';

interface UseFestivalProgramReturn {
  programItems: FestivalProgramItem[];
  setProgramItems: React.Dispatch<React.SetStateAction<FestivalProgramItem[]>>;
  currentItem: FestivalProgramItem | null;
  setCurrentItem: React.Dispatch<React.SetStateAction<FestivalProgramItem | null>>;
  isEditing: boolean;
  addProgramItem: (item: FestivalProgramItem) => void;
  updateProgramItem: (index: number, item: FestivalProgramItem) => void;
  removeProgramItem: (index: number) => void;
  editProgramItem: (index: number) => void;
  cancelEdit: () => void;
  handleImageUpload: (file: File) => Promise<string | null>;
  uploading: boolean;
  uploadProgress: number;
  validateItem: (item: FestivalProgramItem) => { isValid: boolean; message: string };
}

export const useFestivalProgram = (
  initialProgram: FestivalProgramItem[] = []
): UseFestivalProgramReturn => {
  const [programItems, setProgramItems] = useState<FestivalProgramItem[]>(initialProgram);
  const [currentItem, setCurrentItem] = useState<FestivalProgramItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { uploadProgramImage, uploading, progress: uploadProgress } = useImageUpload();

  const validateItem = (item: FestivalProgramItem) => {
    return validateProgramItem(item);
  };

  const addProgramItem = (item: FestivalProgramItem) => {
    const validation = validateItem(item);
    
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    setProgramItems(prev => [...prev, item]);
    setCurrentItem(null);
  };

  const updateProgramItem = (index: number, item: FestivalProgramItem) => {
    const validation = validateItem(item);
    
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    setProgramItems(prev => {
      const updated = [...prev];
      updated[index] = item;
      return updated;
    });
    
    setCurrentItem(null);
    setIsEditing(false);
  };

  const removeProgramItem = (index: number) => {
    setProgramItems(prev => prev.filter((_, i) => i !== index));
  };

  const editProgramItem = (index: number) => {
    setCurrentItem(programItems[index]);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setCurrentItem(null);
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    return await uploadProgramImage(file);
  };

  return {
    programItems,
    setProgramItems,
    currentItem,
    setCurrentItem,
    isEditing,
    addProgramItem,
    updateProgramItem,
    removeProgramItem,
    editProgramItem,
    cancelEdit,
    handleImageUpload,
    uploading,
    uploadProgress,
    validateItem,
  };
};