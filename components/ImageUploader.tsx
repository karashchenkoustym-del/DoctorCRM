'use client';

import { useRef, useState } from 'react';
import Lightbox from './Lightbox';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({ images, onChange, label = 'Photos' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const dataUrls = await Promise.all(
      Array.from(files).filter(f => f.type.startsWith('image/')).map(readAsDataURL)
    );
    onChange([...images, ...dataUrls]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {images.map((src, idx) => (
          <div key={idx} style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <img
              src={src}
              alt={`Attachment ${idx + 1}`}
              onClick={() => setPreview(src)}
              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border)', cursor: 'pointer' }}
            />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              title="Remove"
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 20, height: 20, borderRadius: '50%',
                background: '#dc2626', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: '0.6875rem', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: 64, height: 64, borderRadius: '0.5rem',
            border: '1px dashed var(--border)', background: 'none',
            color: 'var(--muted)', cursor: 'pointer', fontSize: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={e => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />

      {preview && <Lightbox src={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
