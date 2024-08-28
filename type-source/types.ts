import CanvasDraw from ".";

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  points: Point[];
  brushColor: string;
  brushRadius: number;
}

export interface CanvasDrawProps {
  onChange: Function;
  loadTimeOffset: number;
  lazyRadius: number;
  brushRadius: number;
  brushColor: string;
  catenaryColor: string;
  gridColor: string;
  backgroundColor: string;
  hideGrid: boolean;
  canvasWidth: number;
  canvasHeight: number;
  disabled: boolean;
  imgSrc: string;
  saveData: string;
  immediateLoading: boolean;
  hideInterface: boolean;
  gridSizeX: number;
  gridSizeY: number;
  gridLineWidth: number;
  hideGridX: boolean;
  hideGridY: boolean;
  enablePanAndZoom: boolean;
  mouseZoomFactor: number;
  zoomExtents: Extents;
  clampLinesToDocument: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export type CanvasTypes = "grid" | "drawing" | "temp" | "interface";


export interface Extents {
  min: number;
  max: number;
}

export interface Size {
  width: number;
  height: number;
}
