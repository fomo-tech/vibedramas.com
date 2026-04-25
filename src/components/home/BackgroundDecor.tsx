'use client';

export default function BackgroundDecor() {
  return (
    <div className="blob-container">
      {/* Dynamic Blobs */}
      <div className="blob" style={{ top: '10%', left: '-5%', animationDelay: '0s' }} />
      <div className="blob" style={{ top: '60%', left: '70%', animationDelay: '-5s', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255, 45, 149, 0.1) 0%, transparent 70%)' }} />
      <div className="blob" style={{ top: '40%', left: '20%', animationDelay: '-10s', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)' }} />
    </div>
  );
}
