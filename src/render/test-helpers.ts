// Фальшивый 2D-контекст для тестов: записывает вызовы fillText, остальное молча принимает.
// measureText отдаёт нулевую ширину — тестам важно, какой текст и где, а не как он выглядит.
export function fillTextCalls(draw: (ctx: CanvasRenderingContext2D) => void): [string, number, number][] {
  const calls: [string, number, number][] = [];
  const target: Record<string | symbol, unknown> = {};
  const ctx = new Proxy(target, {
    get: (_, key) => {
      if (key === 'fillText') return (text: string, x: number, y: number) => calls.push([text, x, y]);
      if (key === 'measureText') return () => ({ width: 0 });
      return key in target ? target[key] : () => {};
    },
  }) as unknown as CanvasRenderingContext2D;
  draw(ctx);
  return calls;
}
