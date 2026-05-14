# Firebase Storage Debugging Checklist

If you are still seeing `storage/retry-limit-exceeded`, follow these steps:

## 1. Verify Storage Bucket in Firebase Console
- Go to **Firebase Console** -> **Storage**.
- Look for the bucket name at the top (e.g., `project-id.appspot.com`).
- Ensure it matches the `storageBucket` in `firebase-applet-config.json`.
- **Note:** Newer projects might use `project-id.firebasestorage.app`. If `.appspot.com` fails, try the other one.

## 2. Check Security Rules
- Go to **Firebase Console** -> **Storage** -> **Rules**.
- Ensure they allow writes. For testing, you can use:
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /{allPaths=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

## 3. CORS Configuration
If you are uploading from a custom domain (like Vercel), you must set CORS on your bucket:
1. Open Google Cloud Shell.
2. Create a file `cors.json`:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   }
   ```
3. Run: `gsutil cors set cors.json gs://YOUR_BUCKET_NAME`

## 4. Vercel Environment Variables
Ensure the following are set in Vercel settings if you moved to environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- etc.

## 5. Spark Plan Limits
- Are you on the **Spark (Free)** plan?
- There are daily upload/download limits. Check the **Usage** tab in Storage.
