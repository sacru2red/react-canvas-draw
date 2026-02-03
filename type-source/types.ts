export interface Point {
  x: number
  y: number
}

export interface CoordinateSystemView {
  scale: number
  x: number
  y: number
}

export interface CoordinateSystemMatrix {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export interface CoordinateSystemViewPoint {
  x: number
  y: number
  relativeClientX: number
  relativeClientY: number
}

export interface CoordinateSystemCanvasBounds {
  left: number
  top: number
  right: number
  bottom: number
  canvasWidth: number
  canvasHeight: number
  viewMin: CoordinateSystemViewPoint
  viewMax: CoordinateSystemViewPoint
}

/**
 * `coordinateSystem.ts`의 `CoordinateSystem`을 위한 최소(구조적) 타입.
 *
 * 주의: `coordinateSystem.ts`가 이 파일의 `Extents`, `Size`를 import하므로,
 * 여기서 `CoordinateSystem` 클래스를 import하면 순환 의존성이 생길 수 있다.
 */
export interface CoordinateSystemApi {
  canvas: HTMLCanvasElement | null
  readonly transformMatrix: CoordinateSystemMatrix
  readonly canvasBounds: CoordinateSystemCanvasBounds | undefined

  scale: number
  x: number
  y: number
  scaleExtents: Extents
  documentSize: Size

  resetView: () => void
  setView: (view?: Partial<CoordinateSystemView>) => CoordinateSystemView
  scaleAtClientPoint: (
    deltaScale: number,
    clientPoint: { clientX: number; clientY: number },
  ) => CoordinateSystemView
  clientPointToViewPoint: (
    clientPoint: { clientX: number; clientY: number },
    view?: CoordinateSystemView,
  ) => CoordinateSystemViewPoint
  attachViewChangeListener: (listener: (view: CoordinateSystemView) => void) => void
}

/**
 * `lazy-brush`의 `LazyBrush`를 위한 최소(구조적) 타입.
 * 실제 구현체에 의존하지 않도록 여기서는 필요한 멤버만 노출한다.
 */
export interface LazyBrushApi {
  brush: { toObject: () => Point }
  isEnabled: () => boolean
  update: (point: Point, options?: { both?: boolean }) => void
  setRadius: (radius: number) => void
  getPointerCoordinates: () => Point
  getBrushCoordinates: () => Point
}

export interface Line {
  points: Point[]
  brushColor: string
  brushRadius: number
}

export interface CanvasDrawProps {
  onChange?: (api: CanvasDrawApi) => void
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
  coordSystem: CoordinateSystemApi
  lazy?: LazyBrushApi

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
  resetView: () => void
  setView: (view?: Partial<CoordinateSystemView>) => CoordinateSystemView

  getSaveData: () => string
  getDataURL: (fileType: string, useBgImage: boolean, backgroundColour: string) => string
  loadSaveData: (saveData: unknown, immediate?: boolean) => void

  clampPointToDocument: (point: Point) => Point
  drawPoints: (options: { points: Point[]; brushColor: string; brushRadius: number }) => void
  saveLine: (params?: { brushColor: string; brushRadius: number }) => void
}
