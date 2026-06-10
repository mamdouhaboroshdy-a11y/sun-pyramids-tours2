import React, { useRef, useState } from 'react';
import { UploadCloud, X, Loader2, Link as LinkIcon, Film, ImageIcon } from 'lucide-react';
import { uploadFiles } from '../lib/api';

interface MediaUploaderProps {
  images: string[];
  videos: string[];
  onImagesChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
  uploadedBy?: string;
}

export default function MediaUploader({
  images,
  videos,
  onImagesChange,
  onVideosChange,
  uploadedBy = 'Admin',
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadFiles(Array.from(fileList), uploadedBy, setProgress);
      const newImages = uploaded.filter((u) => u.type === 'image').map((u) => u.url);
      const newVideos = uploaded.filter((u) => u.type === 'video').map((u) => u.url);
      if (newImages.length) onImagesChange([...images, ...newImages]);
      if (newVideos.length) onVideosChange([...videos, ...newVideos]);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = () => {
    const v = urlValue.trim();
    if (!v) return;
    const isVideo = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(v);
    if (isVideo) onVideosChange([...videos, v]);
    else onImagesChange([...images, v]);
    setUrlValue('');
  };

  const removeImage = (idx: number) => onImagesChange(images.filter((_, i) => i !== idx));
  const removeVideo = (idx: number) => onVideosChange(videos.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {/* Upload dropzone / button */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-6 px-4 text-center cursor-pointer transition ${
          uploading ? 'opacity-60 cursor-wait border-amber-300 bg-amber-50' : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/40'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            <span className="text-xs font-bold text-amber-700">Uploading… {progress}%</span>
            <div className="w-40 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="w-7 h-7 text-amber-500" />
            <span className="text-xs font-bold text-slate-700">Upload images & videos from your device</span>
            <span className="text-[10px] text-gray-400">Click or drag & drop · multiple files allowed · images & videos</span>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-[11px] text-red-600 font-semibold">{error}</p>}

      {/* Optional: paste a URL */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={urlValue}
            placeholder="…or paste an image/video URL"
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
          />
        </div>
        <button type="button" onClick={addUrl} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition">
          Add
        </button>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            <ImageIcon className="w-3 h-3" /> Images ({images.length})
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((url, idx) => (
              <div key={`${url}-${idx}`} className="relative group">
                <img src={url} alt="" className="w-full h-16 object-cover rounded-lg border border-gray-200" referrerPolicy="no-referrer" />
                {idx === 0 && (
                  <span className="absolute bottom-0 left-0 bg-amber-500 text-slate-900 text-[8px] font-extrabold px-1 rounded-tr-md rounded-bl-lg">MAIN</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video previews */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            <Film className="w-3 h-3" /> Videos ({videos.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {videos.map((url, idx) => (
              <div key={`${url}-${idx}`} className="relative group">
                <video src={url} className="w-full h-20 object-cover rounded-lg border border-gray-200 bg-black" muted controls />
                <button
                  type="button"
                  onClick={() => removeVideo(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition"
                  title="Remove video"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
