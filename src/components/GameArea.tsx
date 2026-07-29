import type { RefObject } from 'react';

interface GameAreaProps {
  gameCanvasRef: RefObject<HTMLCanvasElement | null>;
}

export default function GameArea({ gameCanvasRef }: GameAreaProps) {
  return (
    <div className="canvas-wrapper">
      <canvas id="gameCanvas" ref={gameCanvasRef} width="800" height="600"></canvas>
    </div>
  );
}
