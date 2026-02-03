// JSDOM은 Canvas 2D API를 구현하지 않습니다.
// 테스트에서 CanvasDraw가 mount될 때 호출되는 getContext를 안전하게 스텁 처리합니다.

if (typeof HTMLCanvasElement !== 'undefined') {
  // eslint-disable-next-line no-extend-native
  HTMLCanvasElement.prototype.getContext = function getContext() {
    const base: any = { canvas: this }
    return new Proxy(base, {
      get(target, prop) {
        if (prop in target) return (target as any)[prop]
        // 대부분의 CanvasRenderingContext2D 메서드는 no-op으로 충분
        return () => undefined
      },
    }) as unknown as CanvasRenderingContext2D
  }
}
