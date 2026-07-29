import { setGameAssetMap } from './MapManager';

export interface GameData {
  events: Record<string, string>;
  levels: string[];
}
export let gameData: GameData = {
  events: {
    bgm: 'bgm', die: 'sfx_die', turn: 'sfx_turn', walk: 'sfx_walk',
    gameover: 'sfx_gameover', eat: 'sfx_eat', star: 'sfx_star', victory: 'sfx_victory',
    trap: 'sfx_trap'
  },
  levels: ["map.json"]
};

export const spriteCanvases: Record<string, HTMLCanvasElement> = {};

export async function initGameAssets() {
  try {
    const resData = await fetch('/assets/gameData.json');
    if (resData.ok) {
      gameData = await resData.json();
    }
  } catch (e) {
    console.error("Failed to load game data", e);
  }

  try {
    if (gameData.levels && gameData.levels.length > 0) {
      const res = await fetch('/assets/' + gameData.levels[0]);
      if (res.ok) {
        setGameAssetMap(await res.json());
      }
    }
  } catch (e) {
    console.error("Failed to load map asset", e);
  }

  const spriteNames = [
    'enemy_d', 'enemy_l', 'enemy_r', 'enemy_u',
    'player_d', 'player_l', 'player_r', 'player_u',
    'player_dead_d', 'player_dead_l', 'player_dead_r', 'player_dead_u',
    'trap_open', 'trap_closed', 'cheese'
  ];
  await Promise.all(spriteNames.map(loadSprite));
}

async function loadSprite(name: string) {
  try {
    const res = await fetch(`/assets/sprites/${name}.json`);
    if (res.ok) {
      const data = await res.json();
      const canvas = document.createElement('canvas');
      canvas.width = data.width;
      canvas.height = data.height;
      const cctx = canvas.getContext('2d');
      if (cctx) {
        for (let y = 0; y < data.height; y++) {
          for (let x = 0; x < data.width; x++) {
            const color = data.pixels[y * data.width + x];
            if (color) {
              cctx.fillStyle = color;
              cctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
      spriteCanvases[name] = canvas;
    }
  } catch (e) {
    console.error(`Failed to load sprite ${name}`, e);
  }
}
