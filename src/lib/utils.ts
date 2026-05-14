import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDriveDirectLink(url: string): string {
  if (!url) return '';
  
  // If it's already a direct link or not a drive link, return as is
  if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) return url;
  
  try {
    // Extract ID from various Google Drive URL formats
    let fileId = '';
    
    // Pattern 1: /file/d/FILE_ID/...
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    } else {
      // Pattern 2: ?id=FILE_ID
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      } else {
        // Pattern 3: /open?id=FILE_ID
        const openMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
        if (openMatch && openMatch[1]) {
          fileId = openMatch[1];
        }
      }
    }
    
    if (fileId) {
      // LH3 is often more reliable for direct embedding than uc?id=
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  } catch (e) {
    console.error("Error parsing drive link:", e);
  }
  
  return url;
}

export function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
