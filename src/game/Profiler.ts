export const perfStats: Record<string, number> = {
  update: 0,
  draw: 0,
  drawRadar: 0,
};

export function profile<T extends (...args: any[]) => any>(name: string, fn: T): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const t0 = performance.now();
    const result = fn(...args);
    const t1 = performance.now();
    perfStats[name] = (perfStats[name] || 0) * 0.9 + (t1 - t0) * 0.1;
    return result;
  }) as T;
}
