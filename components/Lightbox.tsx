'use client';

interface LightboxProps {
  src: string;
  onClose: () => void;
}

export default function Lightbox({ src, onClose }: LightboxProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', cursor: 'zoom-out',
      }}
    >
      <img src={src} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '0.5rem' }} />
    </div>
  );
}
