import type { GameStateData } from '../types';
import DebugWindow from '../devtools/DebugWindow';
import MusicEditor from '../devtools/music/MusicEditor';
import MapEditor from '../devtools/map/MapEditor';
import AssetManager from '../devtools/asset/AssetManager';
import BitmapCreator from '../devtools/bitmap/BitmapCreator';

interface DevToolsProps {
  gameState: GameStateData;
}

export default function DevTools({ gameState }: DevToolsProps) {
  // Optionally, you can add a check here to completely disable 
  // devtools in production builds (e.g. if (import.meta.env.PROD) return null;)
  return (
    <>
      <DebugWindow gameState={gameState} />
      <MusicEditor />
      <MapEditor />
      <AssetManager />
      <BitmapCreator />
    </>
  );
}
