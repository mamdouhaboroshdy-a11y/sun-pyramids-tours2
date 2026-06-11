import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export interface GalleryItem {
  url: string;
  type: 'image' | 'video';
}

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  images?: string[];
  videos?: string[];
}

export default function MediaGalleryModal({ isOpen, onClose, title, images = [], videos = [] }: MediaGalleryModalProps) {
  const items: GalleryItem[] = [
    ...images.filter(Boolean).map((url) => ({ url, type: 'image' as const })),
    ...videos.filter(Boolean).map((url) => ({ url, type: 'video' as const })),
  ];
  const [index, setIndex] = useState(0);

  // Reset to first item whenever the modal is (re)opened.
  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % Math.max(items.length, 1));
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + items.length) % Math.max(items.length, 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items.length]);

  if (!isOpen || items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];
  const go = (dir: number) => setIndex((i) => (i + dir + items.length) % items.length);

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex flex-col font-sans"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 text-white shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <h4 className="font-black text-sm sm:text-base truncate">{title || 'Gallery'}</h4>
          <span className="text-[11px] text-white/60 font-semibold">{index + 1} / {items.length}</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
          aria-label="Close gallery"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main stage */}
      <div className="flex-1 flex items-center justify-center relative px-2 sm:px-16 min-h-0" onClick={(e) => e.stopPropagation()}>
        {items.length > 1 && (
          <button
            onClick={() => go(-1)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition cursor-pointer z-10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {current.type === 'video' ? (
          <video
            src={current.url}
            className="max-h-[70vh] max-w-full rounded-xl bg-black shadow-2xl"
            controls
            autoPlay
          />
        ) : (
          <img
            src={current.url}
            alt={title || ''}
            referrerPolicy="no-referrer"
            className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
        )}

        {items.length > 1 && (
          <button
            onClick={() => go(1)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition cursor-pointer z-10"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="shrink-0 px-3 sm:px-6 py-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2 justify-center min-w-min">
            {items.map((it, i) => (
              <button
                key={`${it.url}-${i}`}
                onClick={() => setIndex(i)}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                  i === index ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {it.type === 'video' ? (
                  <>
                    <video src={it.url} className="w-full h-full object-cover bg-black" muted />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </span>
                  </>
                ) : (
                  <img src={it.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
