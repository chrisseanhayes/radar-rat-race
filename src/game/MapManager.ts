import { gameBus } from './EventBus';
import { MAZE_WIDTH, MAZE_HEIGHT } from './Constants';

export const START_X = 15; 
export const START_Y = 10; 

export let map: number[][] = [];
export let gameAssetMap: number[][] | null = null;
export let activeCustomMap: number[][] | null = null;

export function setGameAssetMap(data: number[][] | null) {
  gameAssetMap = data;
}

export function getActiveCustomMap() {
    return activeCustomMap;
}

export function getGameAssetMap() {
    return gameAssetMap;
}

export function generateMaze(): { pX: number, pY: number, ratSpawns: {x:number, y:number}[] } {
  let pX = START_X, pY = START_Y;
  let ratSpawns: {x:number, y:number}[] = [];

  const srcMap = activeCustomMap || gameAssetMap;

  if (srcMap) {
    map = [];
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (srcMap[y][x] === 2) {
          pX = x; pY = y;
        } else if (srcMap[y][x] === 3) {
          ratSpawns.push({x, y});
        }
        row.push(srcMap[y][x] === 1 ? 1 : 0);
      }
      map.push(row);
    }
    gameBus.emit('map_invalidated');
    return { pX, pY, ratSpawns };
  }

  map = [];
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (x <= 1 || x >= MAZE_WIDTH - 2 || y <= 1 || y >= MAZE_HEIGHT - 2) {
        row.push(1); 
      } else if (x % 5 >= 2 && y % 5 >= 2) {
        row.push(1); 
      } else {
        row.push(0); 
      }
    }
    map.push(row);
  }

  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * (MAZE_WIDTH - 4)) + 2;
    const y = Math.floor(Math.random() * (MAZE_HEIGHT - 4)) + 2;
    if (map[y][x] === 1) {
      map[y][x] = 0;
    }
  }

  for (let y = START_Y - 2; y <= START_Y + 8; y++) {
    if (y > 1 && y < MAZE_HEIGHT - 2) {
      map[y][START_X] = 0;
      map[y][START_X + 1] = 0;
    }
  }
  
  gameBus.emit('map_invalidated');
  return { pX, pY, ratSpawns };
}

gameBus.on('request_map_data', () => {
  gameBus.emit('map_data', activeCustomMap ? activeCustomMap : map);
});

gameBus.on('import_map_data', (newMap: number[][]) => {
  activeCustomMap = newMap.map(row => [...row]);
  gameBus.emit('map_imported');
});

gameBus.on('update_map_tile', ({x, y, value}: {x:number, y:number, value:number}) => {
  if (y >= 0 && y < MAZE_HEIGHT && x >= 0 && x < MAZE_WIDTH) {
    if (activeCustomMap) {
      activeCustomMap[y][x] = value;
    } else {
      activeCustomMap = map.map(row => [...row]);
      activeCustomMap[y][x] = value;
    }
    if (value === 0 || value === 1) {
      map[y][x] = value;
    }
    gameBus.emit('map_invalidated');
  }
});
