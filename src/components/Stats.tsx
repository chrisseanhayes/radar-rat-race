import type { GameStateData } from '../types';

interface StatsProps {
  gameState: GameStateData;
}

export default function Stats({ gameState }: StatsProps) {
  return (
    <div className="stats sidebar-stats">
      <div className="stat-box">SCORE <span>{gameState.score}</span></div>
      <div className="stat-box">TIME <span>{gameState.time}</span></div>
      <div className="stat-box">TRAPS <span>{gameState.stars}</span></div>
    </div>
  );
}
