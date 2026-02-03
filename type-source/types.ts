export interface Point {
  x: number
  y: number
}

export interface Line {
  points: Point[]
  brushColor: string
  brushRadius: number
}

export interface CanvasDrawProps {
  onChange: Function
  loadTimeOffset: number
  lazyRadius: number
  brushRadius: number
  brushColor: string
  catenaryColor: string
  gridColor: string
  backgroundColor: string
  hideGrid: boolean
  canvasWidth: number
  canvasHeight: number
  disabled: boolean
  imgSrc: string
  saveData: string
  immediateLoading: boolean
  hideInterface: boolean
  gridSizeX: number
  gridSizeY: number
  gridLineWidth: number
  hideGridX: boolean
  hideGridY: boolean
  enablePanAndZoom: boolean
  mouseZoomFactor: number
  zoomExtents: Extents
  clampLinesToDocument: boolean
  className?: string
  style?: React.CSSProperties
}

export type CanvasTypes = 'grid' | 'drawing' | 'temp' | 'interface'

export interface Extents {
  min: number
  max: number
}

export interface Size {
  width: number
  height: number
}

/**
 * `interactionStateMachine` 및 외부(ref/onChange)에서 사용하는 CanvasDraw 인스턴스 형태.
 * 클래스 컴포넌트에서 함수형 컴포넌트로 전환해도, 상태머신은 이 "API 계약"만을 의존한다.
 */
export interface CanvasDrawApi {
  props: CanvasDrawProps
  coordSystem: any
  lazy?: any

  canvas: Partial<Record<CanvasTypes, HTMLCanvasElement | null | undefined>>
  ctx: Partial<Record<CanvasTypes, CanvasRenderingContext2D | undefined>>

  lines: Line[]
  erasedLines: Line[]
  points: Point[]

  mouseHasMoved: boolean
  valuesChanged: boolean
  isDrawing: boolean
  isPressing: boolean
  deferRedrawOnViewChange: boolean

  undo: () => void
  eraseAll: () => void
  clear: () => void
  resetView: () => any
  setView: (view: object) => any

  getSaveData: () => string
  getDataURL: (fileType: string, useBgImage: boolean, backgroundColour: string) => string
  loadSaveData: (saveData: unknown, immediate?: boolean) => void

  clampPointToDocument: (point: Point) => Point
  drawPoints: (options: { points: Point[]; brushColor: string; brushRadius: number }) => void
  saveLine: (params?: { brushColor: string; brushRadius: number }) => void
}
