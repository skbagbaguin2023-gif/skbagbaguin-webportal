import React, { useEffect, useRef, useState } from 'react';
import { Check, Move, RotateCcw, X } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  aspectRatio?: number;
  onCancel: () => void;
  onComplete: (file: File) => void;
}

const VIEWPORT_WIDTH = 640;
const VIEWPORT_HEIGHT = 360;

export const ImageCropper: React.FC<ImageCropperProps> = ({
  file,
  aspectRatio = 16 / 9,
  onCancel,
  onComplete,
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imagePositionStart = useRef({ x: 0, y: 0 });

  const viewportHeight = VIEWPORT_WIDTH / aspectRatio;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const scale = imageSize.width && imageSize.height
    ? Math.max(VIEWPORT_WIDTH / imageSize.width, viewportHeight / imageSize.height) * zoom
    : 1;
  const renderedWidth = imageSize.width * scale;
  const renderedHeight = imageSize.height * scale;
  const minimumPosition = {
    x: Math.min(0, VIEWPORT_WIDTH - renderedWidth),
    y: Math.min(0, viewportHeight - renderedHeight),
  };

  const centerImage = (width: number, height: number) => {
    const initialScale = Math.max(VIEWPORT_WIDTH / width, viewportHeight / height);
    setZoom(1);
    setPosition({
      x: (VIEWPORT_WIDTH - width * initialScale) / 2,
      y: (viewportHeight - height * initialScale) / 2,
    });
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    centerImage(image.naturalWidth, image.naturalHeight);
  };

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextZoom = Number(event.target.value);
    const center = { x: VIEWPORT_WIDTH / 2, y: viewportHeight / 2 };
    const imagePoint = {
      x: (center.x - position.x) / scale,
      y: (center.y - position.y) / scale,
    };
    const nextScale = Math.max(VIEWPORT_WIDTH / imageSize.width, viewportHeight / imageSize.height) * nextZoom;
    setZoom(nextZoom);
    setPosition({
      x: Math.min(0, Math.max(VIEWPORT_WIDTH - imageSize.width * nextScale, center.x - imagePoint.x * nextScale)),
      y: Math.min(0, Math.max(viewportHeight - imageSize.height * nextScale, center.y - imagePoint.y * nextScale)),
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY };
    imagePositionStart.current = position;
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const nextX = imagePositionStart.current.x + event.clientX - dragStart.current.x;
    const nextY = imagePositionStart.current.y + event.clientY - dragStart.current.y;
    setPosition({
      x: Math.min(0, Math.max(minimumPosition.x, nextX)),
      y: Math.min(0, Math.max(minimumPosition.y, nextY)),
    });
  };

  const handleComplete = () => {
    if (!imageUrl || !imageSize.width || !imageSize.height) return;
    const image = new Image();
    image.onload = () => {
      const sourceX = Math.max(0, -position.x / scale);
      const sourceY = Math.max(0, -position.y / scale);
      const sourceWidth = Math.min(imageSize.width - sourceX, VIEWPORT_WIDTH / scale);
      const sourceHeight = Math.min(imageSize.height - sourceY, viewportHeight / scale);
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = Math.round(canvas.width / aspectRatio);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        onComplete(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    };
    image.src = imageUrl;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Adjust program photo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Drag the image and zoom until the public card looks right.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div
            className="relative mx-auto max-w-full touch-none overflow-hidden rounded-lg bg-slate-800"
            style={{ width: 'min(640px, 100%)', aspectRatio }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setIsDragging(false)}
            onPointerCancel={() => setIsDragging(false)}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                draggable={false}
                className="pointer-events-none absolute max-w-none select-none"
                style={{
                  width: renderedWidth,
                  height: renderedHeight,
                  left: position.x,
                  top: position.y,
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 border-2 border-white/80 shadow-[inset_0_0_0_9999px_rgba(15,23,42,0.12)]" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/80">
              <Move className="h-7 w-7" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Zoom</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={handleZoomChange}
              className="flex-1 accent-[#0F2C59] dark:accent-amber-400"
            />
            <button
              type="button"
              onClick={() => imageSize.width && centerImage(imageSize.width, imageSize.height)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="button" onClick={handleComplete} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b2348]">
            <Check className="h-3.5 w-3.5" />
            Use This Crop
          </button>
        </div>
      </div>
    </div>
  );
};
