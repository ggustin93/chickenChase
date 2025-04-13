import { useState } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface UseCameraPhoto {
  filepath: string | undefined;
  webviewPath?: string;
}

export function useCamera() {
  const [photo, setPhoto] = useState<UseCameraPhoto | null>(null);

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
         // webPath is automatically available for web URIs
         const newPhoto: UseCameraPhoto = {
             filepath: cameraPhoto.path, // path might be undefined on web sometimes
             webviewPath: cameraPhoto.webPath,
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

  return {
    photo,
    takePhoto,
  };
} 