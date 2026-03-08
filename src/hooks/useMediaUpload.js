import { useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';

/**
 * useMediaUpload - Hook for handling media uploads
 * 
 * Handles:
 * - Image/video selection
 * - Upload progress
 * - Preview generation
 * - Upload queue management
 * - Error handling
 * 
 * @param {Object} options
 * @param {string} options.uploadEndpoint - API endpoint for uploads (default: '/upload')
 * @param {number} options.maxFileSize - Max file size in bytes (default: 10MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @returns {Object} Media upload state and handlers
 */
export function useMediaUpload({
  uploadEndpoint = '/upload',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
} = {}) {
  const [uploads, setUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  
  const fileInputRef = useRef(null);

  // Validate file
  const validateFile = useCallback((file) => {
    const errors = [];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds ${maxFileSize / 1024 / 1024}MB limit`);
    }
    
    return errors;
  }, [allowedTypes, maxFileSize]);

  // Generate preview URL
  const generatePreview = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  // Select files from input
  const selectFiles = useCallback(async (files) => {
    const newUploads = [];
    const newErrors = [];
    
    for (const file of files) {
      const fileErrors = validateFile(file);
      
      if (fileErrors.length > 0) {
        newErrors.push({ file: file.name, errors: fileErrors });
        continue;
      }
      
      const preview = await generatePreview(file);
      
      newUploads.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending', // pending, uploading, complete, error
        progress: 0,
        url: null,
        error: null
      });
    }
    
    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
    }
    
    if (newUploads.length > 0) {
      setUploads(prev => [...prev, ...newUploads]);
    }
    
    return newUploads;
  }, [validateFile, generatePreview]);

  // Upload a single file
  const uploadFile = useCallback(async (uploadId) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload || upload.status === 'uploading') return null;

    setUploads(prev => prev.map(u => 
      u.id === uploadId ? { ...u, status: 'uploading', progress: 0 } : u
    ));

    try {
      const formData = new FormData();
      formData.append('file', upload.file);

      const response = await api.post(uploadEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress } : u
          ));
        }
      });

      const uploadedUrl = response.data?.url || response.data?.secure_url;
      
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { 
          ...u, 
          status: 'complete', 
          progress: 100,
          url: uploadedUrl
        } : u
      ));

      return {
        url: uploadedUrl,
        type: upload.type.startsWith('video') ? 'video' : 'image',
        ...response.data
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { 
          ...u, 
          status: 'error', 
          error: errorMessage 
        } : u
      ));

      return null;
    }
  }, [uploads, uploadEndpoint]);

  // Upload all pending files
  const uploadAll = useCallback(async () => {
    const pendingUploads = uploads.filter(u => u.status === 'pending');
    
    if (pendingUploads.length === 0) return [];
    
    setIsUploading(true);
    const results = [];
    
    for (const upload of pendingUploads) {
      const result = await uploadFile(upload.id);
      if (result) {
        results.push(result);
      }
    }
    
    setIsUploading(false);
    return results;
  }, [uploads, uploadFile]);

  // Remove upload from queue
  const removeUpload = useCallback((uploadId) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
    setUploadProgress(prev => {
      const { [uploadId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Clear all uploads
  const clearUploads = useCallback(() => {
    setUploads([]);
    setUploadProgress({});
    setErrors([]);
  }, []);

  // Clear specific error
  const clearError = useCallback((index) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Trigger file input click
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file input change
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    selectFiles(files);
    // Reset input value to allow selecting same file again
    e.target.value = '';
  }, [selectFiles]);

  // Get completed uploads
  const getCompletedUploads = useCallback(() => {
    return uploads
      .filter(u => u.status === 'complete' && u.url)
      .map(u => ({
        url: u.url,
        type: u.type.startsWith('video') ? 'video' : 'image'
      }));
  }, [uploads]);

  return {
    // State
    uploads,
    isUploading,
    uploadProgress,
    errors,
    
    // Refs
    fileInputRef,
    
    // Handlers
    selectFiles,
    uploadFile,
    uploadAll,
    removeUpload,
    clearUploads,
    clearError,
    triggerFileSelect,
    handleFileChange,
    
    // Helpers
    getCompletedUploads,
    validateFile,
    generatePreview,
    
    // Computed
    pendingCount: uploads.filter(u => u.status === 'pending').length,
    completedCount: uploads.filter(u => u.status === 'complete').length,
    errorCount: uploads.filter(u => u.status === 'error').length,
  };
}

export default useMediaUpload;

