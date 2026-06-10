// -------------------------------------------------------------
// REST client for the Express + Postgres backend (server.ts).
// Replaces the previous direct-to-Firebase data layer.
// -------------------------------------------------------------

const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  const text = await res.text();
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error || parsed.message || message;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as unknown as T;
  }
}

export const apiGet = <T>(path: string) => request<T>(path);
export const apiPost = <T>(path: string, body: any) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T>(path: string, body: any) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: any) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) =>
  request<T>(path, { method: 'DELETE' });

export interface UploadedFile {
  url: string;
  name: string;
  type: 'image' | 'video';
  size: number;
}

// Upload one or more files (images/videos) from the user's device. Returns the
// stored public URLs. Progress is reported via the optional callback.
export function uploadFiles(
  files: File[],
  uploadedBy = 'Admin',
  onProgress?: (percent: number) => void
): Promise<UploadedFile[]> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    form.append('uploadedBy', uploadedBy);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.files || []);
        } catch {
          reject(new Error('Invalid upload response from server.'));
        }
      } else {
        let message = `Upload failed (${xhr.status})`;
        try {
          message = JSON.parse(xhr.responseText).error || message;
        } catch { /* keep default */ }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(form);
  });
}
