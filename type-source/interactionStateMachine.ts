import CanvasDraw from ".";

const TOUCH_SLOP = 10;
const PINCH_TIMEOUT_MS = 250;
const SUPPRESS_SCROLL = function <T>(this: T, e: Event) {
  e.preventDefault();
  return this;
};

// interface CanvasDraw {
//   props: {
//     disabled: boolean;
//     enablePanAndZoom: boolean;
//     mouseZoomFactor: number;
//     brushColor: string;
//     brushRadius: number;
//   };
//   coordSystem: {
//     x: number;
//     y: number;
//     scale: number;
//     scaleAtClientPoint: (scale: number, point: { clientX: number, clientY: number }) => void;
//     setView: (view: { x: number, y: number }) => void;
//     clientPointToViewPoint: (point: { clientX: number, clientY: number }) => { x: number, y: number };
//   };
//   lazy: {
//     update: (point: { x: number, y: number }, options?: { both: boolean }) => void;
//     isEnabled: () => boolean;
//     brush: {
//       toObject: () => { x: number, y: number };
//     };
//   };
//   points: { x: number, y: number }[];
//   clampPointToDocument: (point: { x: number, y: number }) => { x: number, y: number };
//   drawPoints: (options: { points: { x: number, y: number }[], brushColor: string, brushRadius: number }) => void;
//   saveLine: () => void;
//   setView: (view: { x: number, y: number }) => void;
// }

export class DefaultState {
  // handleMouseWheel = (e: WheelEvent, canvasDraw: CanvasDraw): DefaultState | DisabledState => {
  //   const { disabled, enablePanAndZoom, mouseZoomFactor } = canvasDraw.props;
  //   if (disabled) {
  //     return new DisabledState();
  //   } else if (enablePanAndZoom && e.ctrlKey) {
  //     e.preventDefault();
  //     canvasDraw.coordSystem.scaleAtClientPoint(mouseZoomFactor * e.deltaY, clientPointFromEvent(e));
  //   }
  //   return this;
  // };
  handleMouseWheel (e: WheelEvent, canvasDraw: CanvasDraw): DisabledState | DefaultState {
    const { disabled, enablePanAndZoom, mouseZoomFactor } = canvasDraw.props;
    if (disabled) {
      return new DisabledState();
    } else if (enablePanAndZoom && e.ctrlKey) {
      e.preventDefault();
      canvasDraw.coordSystem.scaleAtClientPoint(mouseZoomFactor * e.deltaY, clientPointFromEvent(e));
    }
    return this;
  }

  handleDrawStart = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => {
    if (canvasDraw.props.disabled) {
      return new DisabledState();
    } else if (e instanceof MouseEvent && e.ctrlKey && canvasDraw.props.enablePanAndZoom) {
      return (new PanState()).handleDrawStart(e, canvasDraw);
    } 
    return (new WaitForPinchState()).handleDrawStart(e, canvasDraw);
  };

  handleDrawMove = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): DefaultState | DisabledState => {
    if (canvasDraw.props.disabled) {
      return new DisabledState();
    } else {
      const { x, y } = viewPointFromEvent(canvasDraw.coordSystem, e);
      if (canvasDraw.lazy) {
        canvasDraw.lazy.update({ x, y });
      }
      return this;
    }
  };

  handleDrawEnd = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): DefaultState | DisabledState => {
    return canvasDraw.props.disabled ? (new DisabledState()) : this;
  };
}

export class DisabledState {
  handleMouseWheel (e: WheelEvent, canvasDraw: CanvasDraw): DisabledState | DefaultState {
    if (canvasDraw.props.disabled) {
      return this;
    } 
    return (new DefaultState()).handleMouseWheel(e, canvasDraw);
  }

  handleDrawStart = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): DisabledState | DefaultState | DrawingState | PanState | WaitForPinchState | ScaleOrPanState | DisabledState => {
    if (canvasDraw.props.disabled) {
      return this;
    } else {
      return (new DefaultState()).handleDrawStart(e, canvasDraw);
    }
  };

  handleDrawMove = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): DisabledState | DefaultState => {
    if (canvasDraw.props.disabled) {
      return this;
    } else {
      return (new DefaultState()).handleDrawMove(e, canvasDraw);
    }
  };

  handleDrawEnd = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): DisabledState | DefaultState => {
    if (canvasDraw.props.disabled) {
      return this;
    } else {
      return (new DefaultState()).handleDrawEnd(e, canvasDraw);
    }
  }
}

export class PanState {
  dragStart: { clientX: number, clientY: number };
  panStart: { x: number, y: number };

  constructor() {
    this.dragStart = { clientX: NaN, clientY: NaN };
    this.panStart = { x: NaN, y: NaN };
  }

  handleMouseWheel = SUPPRESS_SCROLL.bind(this);

  handleDrawStart = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): PanState => {
    e.preventDefault();

    this.dragStart = clientPointFromEvent(e);
    this.panStart = { x: canvasDraw.coordSystem.x, y: canvasDraw.coordSystem.y };

    return this;
  };

  handleDrawMove = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): PanState => {
    e.preventDefault();

    const { clientX, clientY } = clientPointFromEvent(e);
    const dx = clientX - this.dragStart.clientX;
    const dy = clientY - this.dragStart.clientY;
    canvasDraw.coordSystem.setView({ x: this.panStart.x + dx, y: this.panStart.y + dy });

    return this;
  };

  handleDrawEnd = (): DefaultState => new DefaultState();
}

export class WaitForPinchState {
  startClientPoint: { clientX: number, clientY: number } | null;
  startTimestamp: number;
  deferredPoints: { clientX: number, clientY: number }[];

  constructor() {
    this.startClientPoint = null;
    this.startTimestamp = (new Date()).valueOf();
    this.deferredPoints = [];
  }

  handleMouseWheel = SUPPRESS_SCROLL.bind(this);

  handleDrawStart = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): DefaultState | DrawingState | ScaleOrPanState | WaitForPinchState => {
    const { enablePanAndZoom } = canvasDraw.props;
    e.preventDefault();

    if (e instanceof TouchEvent) {
      if (enablePanAndZoom && e.touches && e.touches.length >= 2) {
        return (new ScaleOrPanState()).handleDrawStart(e, canvasDraw);
      }
    }

    // @ts-ignore
    if (!e.touches || !e.touches.length || !enablePanAndZoom) {
      return (new DrawingState()).handleDrawStart(e, canvasDraw);
    }

    return this.handleDrawMove(e, canvasDraw);
  };

  handleDrawMove = (e: TouchEvent | MouseEvent, canvasDraw: CanvasDraw): DefaultState | WaitForPinchState | DrawingState | ScaleOrPanState => {
    e.preventDefault();

    if (e instanceof TouchEvent) {
      if (e.touches && e.touches.length >= 2) {
        return (new ScaleOrPanState()).handleDrawStart(e, canvasDraw);
      }
    }

    const clientPt = clientPointFromEvent(e);
    this.deferredPoints.push(clientPt);

    if ((new Date()).valueOf() - this.startTimestamp < PINCH_TIMEOUT_MS) {
      if (this.startClientPoint === null) {
        this.startClientPoint = clientPt;
      }

      const d =
        Math.abs(clientPt.clientX - this.startClientPoint.clientX)
        + Math.abs(clientPt.clientY - this.startClientPoint.clientY);

      if (d < TOUCH_SLOP) {
        return this;
      }
    }

    return this.issueDeferredPoints(canvasDraw);
  };

  handleDrawEnd = (e: TouchEvent, canvasDraw: CanvasDraw): DefaultState | DisabledState => {
    return this.issueDeferredPoints(canvasDraw).handleDrawEnd(e, canvasDraw);
  };

  issueDeferredPoints = (canvasDraw: CanvasDraw): DefaultState | DrawingState => {
    let nextState: DrawingState = new DrawingState();
    for (let i = 0; i < this.deferredPoints.length; i++) {
      const deferredPt = this.deferredPoints[i];
      const syntheticEvt = new SyntheticEvent(deferredPt);
      const func = i === 0 ? nextState.handleDrawStart : nextState.handleDrawMove;
      nextState = func(syntheticEvt, canvasDraw);
    }
    return nextState;
  };
}

export class ScaleOrPanState {
  start: { t1: { clientX: number, clientY: number }, t2: { clientX: number, clientY: number }, distance: number, centroid: { clientX: number, clientY: number } };
  panStart: { x: number, y: number };
  scaleStart: number;
  recentMetrics: { centroid: { clientX: number, clientY: number }, distance: number };

  constructor() {
    this.start = { t1: { clientX: NaN, clientY: NaN }, t2: { clientX: NaN, clientY: NaN }, distance: NaN, centroid: { clientX: NaN, clientY: NaN } };
    this.panStart = { x: NaN, y: NaN };
    this.scaleStart = NaN;
    this.recentMetrics = { centroid: { clientX: NaN, clientY: NaN }, distance: NaN };
  }

  handleMouseWheel = SUPPRESS_SCROLL.bind(this);

  handleDrawStart = (e: TouchEvent, canvasDraw: CanvasDraw): ScaleOrPanState | DefaultState => {
    e.preventDefault();
    if (!e.touches || e.touches.length < 2) {
      return new DefaultState();
    }
    this.start = this.getTouchMetrics(e);
    this.panStart = { x: canvasDraw.coordSystem.x, y: canvasDraw.coordSystem.y };
    this.scaleStart = canvasDraw.coordSystem.scale;
    return this;
  };

  handleDrawMove = (e: TouchEvent, canvasDraw: CanvasDraw): ScaleOrPanState | TouchPanState | TouchScaleState | DefaultState => {
    e.preventDefault();
    if (!e.touches || e.touches.length < 2) {
      return new DefaultState();
    }

    const { centroid, distance } = this.recentMetrics = this.getTouchMetrics(e);

    const dd = Math.abs(distance - this.start.distance);
    if (dd >= TOUCH_SLOP) {
      return new TouchScaleState(this).handleDrawMove(e, canvasDraw);
    }

    const dx = centroid.clientX - this.start.centroid.clientX;
    const dy = centroid.clientY - this.start.centroid.clientY;
    const dc = Math.abs(dx) + Math.abs(dy);
    if (dc >= TOUCH_SLOP) {
      return new TouchPanState(this).handleDrawMove(e, canvasDraw);
    }

    return this;
  };

  handleDrawEnd = (): DefaultState => new DefaultState();

  getTouchMetrics = (e: TouchEvent): { t1: { clientX: number, clientY: number }, t2: { clientX: number, clientY: number }, distance: number, centroid: { clientX: number, clientY: number } } => {
    const { clientX: t1x, clientY: t1y } = clientPointFromEvent(e.touches[0]);
    const { clientX: t2x, clientY: t2y } = clientPointFromEvent(e.touches[1]);

    const dx = t2x - t1x;
    const dy = t2y - t1y;

    return {
      t1: { clientX: t1x, clientY: t1y },
      t2: { clientX: t2x, clientY: t2y },
      distance: Math.sqrt(dx * dx + dy * dy),
      centroid: { clientX: (t1x + t2x) / 2.0, clientY: (t1y + t2y) / 2.0 },
    };
  };
}

export class TouchPanState {
  scaleOrPanState: ScaleOrPanState;

  constructor(scaleOrPanState: ScaleOrPanState) {
    this.scaleOrPanState = scaleOrPanState;
  }

  handleMouseWheel = SUPPRESS_SCROLL.bind(this);
  handleDrawStart = (): TouchPanState => this;

  handleDrawMove = (e: TouchEvent, canvasDraw: CanvasDraw): TouchPanState | DefaultState => {
    e.preventDefault();
    if (!e.touches || e.touches.length < 2) {
      return new DefaultState();
    }

    const ref = this.scaleOrPanState;
    const { centroid } = ref.recentMetrics = ref.getTouchMetrics(e);

    const dx = centroid.clientX - ref.start.centroid.clientX;
    const dy = centroid.clientY - ref.start.centroid.clientY;

    canvasDraw.setView({ x: ref.panStart.x + dx, y: ref.panStart.y + dy });

    return this;
  };

  handleDrawEnd = (): DefaultState => new DefaultState();
}

export class TouchScaleState {
  scaleOrPanState: ScaleOrPanState;

  constructor(scaleOrPanState: ScaleOrPanState) {
    this.scaleOrPanState = scaleOrPanState;
  }

  handleMouseWheel = SUPPRESS_SCROLL.bind(this);
  handleDrawStart = (): TouchScaleState => this;

  handleDrawMove = (e: TouchEvent, canvasDraw: CanvasDraw): TouchScaleState | DefaultState => {
    e.preventDefault();
    if (!e.touches || e.touches.length < 2) {
      return new DefaultState();
    }

    const ref = this.scaleOrPanState;
    const { centroid, distance } = ref.recentMetrics = ref.getTouchMetrics(e);

    const targetScale = ref.scaleStart * (distance / ref.start.distance);
    const dScale = targetScale - canvasDraw.coordSystem.scale;
    canvasDraw.coordSystem.scaleAtClientPoint(dScale, centroid);

    return this;
  };

  handleDrawEnd = (): DefaultState => new DefaultState();
}

export class DrawingState {
  isDrawing: boolean;

  constructor() {
    this.isDrawing = false;
  }

  handleMouseWheel = SUPPRESS_SCROLL.bind(this);

  handleDrawStart = (e: MouseEvent | TouchEvent | SyntheticEvent, canvasDraw: CanvasDraw): DrawingState => {
    e.preventDefault();

    if (e instanceof TouchEvent && e.touches.length) {
      const { x, y } = viewPointFromEvent(canvasDraw.coordSystem, e);
      if (canvasDraw.lazy) {
        canvasDraw.lazy.update({ x, y }, { both: true });
      }
    }

    return this.handleDrawMove(e, canvasDraw);
  };

  handleDrawMove = (e: MouseEvent | TouchEvent | SyntheticEvent, canvasDraw: CanvasDraw): DrawingState => {
    e.preventDefault();

    const { x, y } = viewPointFromEvent(canvasDraw.coordSystem, e);
    if (canvasDraw.lazy) {
      canvasDraw.lazy.update({ x, y });
    }
    const isDisabled = canvasDraw.lazy ? !canvasDraw.lazy.isEnabled() : false;

    if (!this.isDrawing || isDisabled) {
      if (canvasDraw.lazy) {
        canvasDraw.points.push(canvasDraw.clampPointToDocument(canvasDraw.lazy.brush.toObject()));
      }
      this.isDrawing = true;
    }

    if (canvasDraw.lazy) {
      canvasDraw.points.push(canvasDraw.clampPointToDocument(canvasDraw.lazy.brush.toObject()));
    }

    canvasDraw.drawPoints({
      points: canvasDraw.points,
      brushColor: canvasDraw.props.brushColor,
      brushRadius: canvasDraw.props.brushRadius
    });

    return this;
  };

  handleDrawEnd = (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw): DefaultState => {
    e.preventDefault();

    this.handleDrawMove(e, canvasDraw);
    canvasDraw.saveLine();

    return new DefaultState();
  };
}

export class SyntheticEvent {
  clientX: number;
  clientY: number;
  touches: { clientX: number, clientY: number }[];

  constructor({ clientX, clientY }: { clientX: number, clientY: number }) {
    this.clientX = clientX;
    this.clientY = clientY;
    this.touches = [{ clientX, clientY }];
  }

  preventDefault = (): void => {};
}

export function clientPointFromEvent(e: WheelEvent | TouchEvent | MouseEvent | SyntheticEvent | TouchList | Touch) {
  let clientX = NaN;
  let clientY = NaN;

  if ('clientX' in e) {
    clientX = e.clientX;
  }
  if ('clientY' in e) {
    clientY = e.clientY;
  }

  if (e instanceof TouchEvent && e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  }

  return { clientX, clientY };
}

export function viewPointFromEvent(coordSystem: any, e: MouseEvent | TouchEvent | SyntheticEvent): { x: number, y: number } {
  return coordSystem.clientPointToViewPoint(clientPointFromEvent(e));
}
