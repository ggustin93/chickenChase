import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { PhotoUploadService, PhotoMetadata, PhotoUploadResult, UploadProgress } from '../services/photoUploadService';

export interface UseCameraPhoto {
  filepath: string | undefined;
  webviewPath?: string;
  file?: File;
}

export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: PhotoUploadResult | null;
}

export function useCamera() {
  const [photo, setPhoto] = useState<UseCameraPhoto | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null
  });

  const takePhoto = async (): Promise<Photo | null> => {
    try {
      const cameraPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri, // Use Uri for web display
        source: CameraSource.Camera, // Prompt user to select Camera or Gallery
        quality: 90,
        allowEditing: false, // Optional: allow editing
        saveToGallery: false // Don't save automatically on web
      });

      if (cameraPhoto) {
         // Convert photo to File object for upload
         const file = await convertPhotoToFile(cameraPhoto);
         
         // webPath is automatically available for web URIs
         const newPhoto: UseCameraPhoto = {
             filepath: cameraPhoto.path, // path might be undefined on web sometimes
             webviewPath: cameraPhoto.webPath,
             file: file
         };
         setPhoto(newPhoto);
         console.log('Photo taken:', newPhoto);
         return cameraPhoto; // Return the full Photo object
      } else {
         setPhoto(null);
         return null;
      }

    } catch (error) {
      console.error("Error taking photo:", error);
      setPhoto(null);
      return null;
    }
  };

  const uploadPhoto = useCallback(async (
    metadata: PhotoMetadata,
    customFile?: File
  ): Promise<PhotoUploadResult | null> => {
    const fileToUpload = customFile || photo?.file;
    
    if (!fileToUpload) {
      setUploadState(prev => ({
        ...prev,
        error: 'No photo file available for upload'
      }));
      return null;
    }

    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      result: null
    });

    try {
      const result = await PhotoUploadService.uploadPhotoWithErrorHandling(
        fileToUpload,
        metadata,
        (progress: UploadProgress) => {
          setUploadState(prev => ({
            ...prev,
            progress: progress.percentage
          }));
        }
      );

      setUploadState({
        uploading: false,
        progress: 100,
        error: result.success ? null : result.error || 'Upload failed',
        result: result
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        result: null
      });
      return null;
    }
  }, [photo]);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  const clearUploadState = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  return {
    photo,
    uploadState,
    takePhoto,
    uploadPhoto,
    clearPhoto,
    clearUploadState,
  };
}

/**
 * Convert Capacitor Photo to File object
 */
async function convertPhotoToFile(photo: Photo): Promise<File> {
  if (!photo.webPath) {
    throw new Error('Photo webPath is not available');
  }

  try {
    // Fetch the photo as blob
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    
    // Create a File object with appropriate name and type
    const fileName = `photo-${Date.now()}.jpg`;
    const file = new File([blob], fileName, { 
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    return file;
  } catch (error) {
    console.error('Error converting photo to file:', error);
    throw new Error('Failed to convert photo to file format');
  }
} 