import type { RefObject } from 'react';

interface RadarProps {
  radarCanvasRef: RefObject<HTMLCanvasElement | null>;
}

export default function Radar({ radarCanvasRef }: RadarProps) {
  return (
    <div className="radar-container">
      <h2>RADAR</h2>
      <canvas id="radarCanvas" ref={radarCanvasRef} width="200" height="200"></canvas>
    </div>
  );
}
