/**
 * PhotoUploadService - Secure photo upload functionality for challenge submissions
 * 
 * Features:
 * - File validation (size, format, dimensions)
 * - Image compression for mobile optimization
 * - Progress tracking with retry mechanisms
 * - Secure file naming with path validation
 * - Integration with Supabase Storage
 */

import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

// Type definitions
export interface PhotoMetadata {
  gameId: string;
  teamId: string;
  challengeId: string;
  playerId?: string;
  originalName: string;
  timestamp: number;
}

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  metadata?: {
    originalSize: number;
    compressedSize: number;
    dimensions: {
      width: number;
      height: number;
    };
    format: string;
    uploadTime: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    size: number;
    format: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  quality: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Constants
const MAX_FILE_SIZE_MB = 5;
const MAX_DIMENSION = 2048;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const COMPRESSION_QUALITY = 0.8;
const BUCKET_NAME = 'challenges';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const RETRY_DELAY_MULTIPLIER = 2; // Exponential backoff

// File naming pattern: {gameId}/{teamId}/{challengeId}/{timestamp}-{uuid}.{ext}
// Updated to support both UUID format and team-XXX format for teamId
const FILE_NAME_PATTERN = /^[a-fA-F0-9-]{36}\/(team-[a-zA-Z0-9]+|[a-fA-F0-9-]{36})\/[a-fA-F0-9-]{36}\/[0-9]{13}-[a-fA-F0-9-]{36}\.(jpg|jpeg|png|webp)$/;

export class PhotoUploadService {
  
  /**
   * Retry utility with exponential backoff
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    baseDelay: number = RETRY_DELAY_BASE
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Don't retry certain types of errors
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(RETRY_DELAY_MULTIPLIER, attempt);
        const jitter = Math.random() * 0.1 * delay; // 10% jitter
        const totalDelay = delay + jitter;
        
        console.warn(`Upload attempt ${attempt + 1} failed, retrying in ${Math.round(totalDelay)}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
    
    throw lastError || new Error('Upload failed after retries');
  }
  
  /**
   * Check if error is non-retryable (e.g., validation errors, permission errors)
   */
  private static isNonRetryableError(error: unknown): boolean {
    if (!error) return false;
    
    // Supabase-specific non-retryable errors
    const nonRetryableMessages = [
      'Invalid file type',
      'File too large',
      'Unauthorized',
      'Forbidden',
      'Not found',
      'Invalid request'
    ];
    
    const errorMessage = (error as Error)?.message?.toLowerCase() || '';
    return nonRetryableMessages.some(msg => errorMessage.includes(msg.toLowerCase()));
  }
  
  /**
   * Validate file before upload
   */
  static validateFile(file: File): ValidationResult {
    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return {
        valid: false,
        error: `File size (${sizeMB.toFixed(1)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE_MB}MB)`,
        details: { size: file.size, format: file.type }
      };
    }

    // Check file format
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file format: ${file.type}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
        details: { size: file.size, format: file.type }
      };
    }

    return {
      valid: true,
      details: { size: file.size, format: file.type }
    };
  }

  /**
   * Compress image for mobile optimization
   */
  static async compressImage(
    file: File, 
    options: Partial<CompressionOptions> = {}
  ): Promise<File> {
    const compressionOptions: CompressionOptions = {
      maxSizeMB: MAX_FILE_SIZE_MB * 0.8, // Target 80% of max size
      maxWidthOrHeight: MAX_DIMENSION,
      useWebWorker: true,
      quality: COMPRESSION_QUALITY,
      ...options
    };

    try {
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      const compressedFile = await imageCompression(file, {
        maxSizeMB: compressionOptions.maxSizeMB,
        maxWidthOrHeight: compressionOptions.maxWidthOrHeight,
        useWebWorker: compressionOptions.useWebWorker,
        initialQuality: compressionOptions.quality
      });

      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      return compressedFile;
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
      return file;
    }
  }

  /**
   * Generate secure file path with validation
   */
  static generateFilePath(metadata: PhotoMetadata, file: File): string {
    const timestamp = metadata.timestamp || Date.now();
    const uuid = uuidv4();
    const extension = this.getFileExtension(file);
    
    const path = `${metadata.gameId}/${metadata.teamId}/${metadata.challengeId}/${timestamp}-${uuid}.${extension}`;
    
    // Validate generated path matches our security pattern
    console.log('🔧 DEBUG: Testing file path against pattern...');
    console.log('🔧 DEBUG: Generated path:', path);
    console.log('🔧 DEBUG: Pattern:', FILE_NAME_PATTERN.toString());
    
    if (!FILE_NAME_PATTERN.test(path)) {
      console.error('🔧 DEBUG: Pattern test failed');
      throw new Error(`Generated file path does not match security pattern: ${path}`);
    }
    
    console.log('🔧 DEBUG: Pattern test passed');
    
    return path;
  }

  /**
   * Get file extension from file type or name
   */
  static getFileExtension(file: File): string {
    // Prefer getting extension from MIME type for security
    switch (file.type) {
      case 'image/jpeg':
      case 'image/jpg': {
        return 'jpg';
      }
      case 'image/png': {
        return 'png';
      }
      case 'image/webp': {
        return 'webp';
      }
      default: {
        // Fallback to file name extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension && ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
          return extension === 'jpeg' ? 'jpg' : extension;
        }
        return 'jpg'; // Default fallback
      }
    }
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for dimension calculation'));
      };
      
      img.src = url;
    });
  }

  /**
   * Upload photo to Supabase Storage with progress tracking
   */
  static async uploadPhoto(
    file: File,
    metadata: PhotoMetadata,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<PhotoUploadResult> {
    const startTime = Date.now();
    console.log('🔧 DEBUG: uploadPhoto started');
    
    try {
      // Validate file
      console.log('🔧 DEBUG: Validating file...');
      const validation = this.validateFile(file);
      console.log('🔧 DEBUG: File validation result:', validation);
      
      if (!validation.valid) {
        console.error('🔧 DEBUG: File validation failed:', validation.error);
        return {
          success: false,
          error: validation.error
        };
      }

      // Get original dimensions
      console.log('🔧 DEBUG: Getting image dimensions...');
      const originalDimensions = await this.getImageDimensions(file);
      const originalSize = file.size;
      console.log('🔧 DEBUG: Original dimensions:', originalDimensions, 'Size:', originalSize);

      // Compress image
      console.log('🔧 DEBUG: Compressing image...');
      const compressedFile = await this.compressImage(file);
      const compressedSize = compressedFile.size;
      console.log('🔧 DEBUG: Compressed size:', compressedSize);

      // Generate secure file path
      console.log('🔧 DEBUG: Generating file path...');
      const filePath = this.generateFilePath(metadata, compressedFile);
      console.log('🔧 DEBUG: Generated file path:', filePath);

      // Report initial progress
      if (onProgress) {
        onProgress({ loaded: 0, total: compressedFile.size, percentage: 0 });
      }

      // Upload to Supabase Storage with retry mechanism
      console.log('🔧 DEBUG: Starting Supabase upload...');
      console.log('🔧 DEBUG: Bucket:', BUCKET_NAME);
      console.log('🔧 DEBUG: File path:', filePath);
      console.log('🔧 DEBUG: File type:', compressedFile.type);
      
      const uploadResult = await this.withRetry(async () => {
        console.log('🔧 DEBUG: Attempting upload to Supabase...');
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, compressedFile, {
            contentType: compressedFile.type,
            upsert: false, // Don't overwrite existing files
            duplex: 'half'
          });

        if (error) {
          console.error('🔧 DEBUG: Supabase upload error:', error);
          throw new Error(`Upload failed: ${error.message}`);
        }
        
        console.log('🔧 DEBUG: Supabase upload successful');
        return true;
      });

      // Report completion progress
      if (onProgress) {
        onProgress({ loaded: compressedFile.size, total: compressedFile.size, percentage: 100 });
      }

      // If we reach here, upload was successful
      console.log('🔧 DEBUG: Upload completed successfully:', uploadResult);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const uploadTime = Date.now() - startTime;

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        metadata: {
          originalSize,
          compressedSize,
          dimensions: originalDimensions,
          format: file.type,
          uploadTime
        }
      };

    } catch (error) {
      console.error('Photo upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload multiple photos with batch processing
   */
  static async uploadMultiplePhotos(
    files: File[],
    metadata: PhotoMetadata,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, result: PhotoUploadResult) => void
  ): Promise<PhotoUploadResult[]> {
    const results: PhotoUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Create unique metadata for each file
      const fileMetadata: PhotoMetadata = {
        ...metadata,
        timestamp: Date.now() + i, // Ensure unique timestamps
        originalName: file.name
      };

      const result = await this.uploadPhoto(
        file,
        fileMetadata,
        (progress) => onProgress?.(i, progress)
      );

      results.push(result);
      onFileComplete?.(i, result);

      // Add small delay between uploads to prevent overwhelming the server
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Delete photo from storage
   */
  static async deletePhoto(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate file path matches our pattern for security
      if (!FILE_NAME_PATTERN.test(filePath)) {
        return {
          success: false,
          error: 'Invalid file path format'
        };
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deletion error'
      };
    }
  }

  /**
   * Generate thumbnail URL with transformations
   */
  static getThumbnailUrl(photoUrl: string, size: number = 150): string {
    // Supabase Storage supports image transformations
    // Add resize parameters to the URL for thumbnails
    const url = new URL(photoUrl);
    url.searchParams.set('width', size.toString());
    url.searchParams.set('height', size.toString());
    url.searchParams.set('resize', 'cover');
    return url.toString();
  }

  /**
   * Validate if a URL belongs to our storage bucket
   */
  static isValidPhotoUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('supabase') && 
             urlObj.pathname.includes(`/storage/v1/object/public/${BUCKET_NAME}/`);
    } catch {
      return false;
    }
  }

  /**
   * Upload photo with enhanced error handling and user-friendly messages
   */
  static async uploadPhotoWithErrorHandling(
    file: File,
    metadata: PhotoMetadata,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<PhotoUploadResult> {
    console.log('🔧 DEBUG: uploadPhotoWithErrorHandling called');
    console.log('🔧 DEBUG: file:', file);
    console.log('🔧 DEBUG: metadata:', metadata);
    
    try {
      const result = await this.uploadPhoto(file, metadata, onProgress);
      console.log('🔧 DEBUG: uploadPhoto result:', result);
      return result;
    } catch (error) {
      console.error('🔧 DEBUG: Photo upload failed after all retries:', error);
      
      // Provide user-friendly error messages
      const errorMessage = this.getUserFriendlyErrorMessage(error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private static getUserFriendlyErrorMessage(error: unknown): string {
    if (!error) return 'Une erreur inconnue s\'est produite';
    
    const errorMessage = (error as Error).message?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'Problème de connexion. Vérifiez votre connexion internet et réessayez.';
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
      return 'Vous n\'avez pas les permissions nécessaires pour uploader cette photo.';
    }
    
    if (errorMessage.includes('file too large') || errorMessage.includes('size')) {
      return 'La photo est trop volumineuse. Essayez avec une photo plus petite.';
    }
    
    if (errorMessage.includes('invalid file') || errorMessage.includes('format')) {
      return 'Format de fichier non supporté. Utilisez JPG, PNG ou WebP.';
    }
    
    if (errorMessage.includes('storage') || errorMessage.includes('quota')) {
      return 'Espace de stockage insuffisant. Contactez l\'administrateur.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'L\'upload a pris trop de temps. Réessayez avec une connexion plus stable.';
    }
    
    return 'Erreur lors de l\'upload de la photo. Veuillez réessayer.';
  }

  /**
   * Extract metadata from photo URL
   */
  static extractMetadataFromUrl(url: string): Partial<PhotoMetadata> | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf(BUCKET_NAME);
      
      if (bucketIndex === -1 || pathParts.length < bucketIndex + 5) {
        return null;
      }

      const gameId = pathParts[bucketIndex + 1];
      const teamId = pathParts[bucketIndex + 2];
      const challengeId = pathParts[bucketIndex + 3];
      const fileName = pathParts[bucketIndex + 4];
      
      // Extract timestamp from filename
      const timestampMatch = fileName.match(/^(\d{13})-/);
      const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

      return {
        gameId,
        teamId,
        challengeId,
        timestamp
      };
    } catch {
      return null;
    }
  }
}

export default PhotoUploadService;