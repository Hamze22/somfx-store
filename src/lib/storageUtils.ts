import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  UploadTaskSnapshot 
} from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  state: string;
}

export const uploadFileWithProgress = (
  file: File, 
  path: string, 
  onProgress?: (progress: UploadProgress) => void,
  maxRetries: number = 2
): Promise<string> => {
  let attempt = 0;

  const performUpload = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Generate unique path using timestamp to avoid collisions
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, `${path}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state
            });
          }
        },
        (error) => {
          console.error(`Upload error (Attempt ${attempt + 1}):`, error);
          
          // Retry logic for transient errors
          if (attempt < maxRetries && (
            error.code === 'storage/retry-limit-exceeded' || 
            error.code === 'storage/unknown' ||
            error.message.includes('network')
          )) {
            attempt++;
            console.log(`Retrying upload... Attempt ${attempt + 1}`);
            setTimeout(() => {
              performUpload().then(resolve).catch(reject);
            }, 2000 * attempt); // Exponential backoff
            return;
          }

          switch (error.code) {
            case 'storage/unauthorized':
              reject(new Error("User doesn't have permission to upload. Check security rules."));
              break;
            case 'storage/canceled':
              reject(new Error("Upload cancelled."));
              break;
            case 'storage/retry-limit-exceeded':
              reject(new Error("Upload failed: Network timeout. Please check your connection and try again."));
              break;
            default:
              reject(error);
          }
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  return performUpload();
};

export const validateFile = (file: File, allowedTypes: string[], maxMB: number = 20) => {
  const maxBytes = maxMB * 1024 * 1024;
  
  if (!allowedTypes.some(type => file.type.includes(type) || file.name.endsWith(type))) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxBytes) {
    throw new Error(`File too large. Maximum size is ${maxMB}MB.`);
  }
  
  return true;
};
