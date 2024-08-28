import CanvasDraw from ".";
export declare class DefaultState {
    handleMouseWheel(e: WheelEvent, canvasDraw: CanvasDraw): DisabledState | DefaultState;
    handleDrawStart: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => DefaultState | DisabledState | DrawingState | PanState | WaitForPinchState | ScaleOrPanState;
    handleDrawMove: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => DefaultState | DisabledState;
    handleDrawEnd: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => DefaultState | DisabledState;
}
export declare class DisabledState {
    handleMouseWheel(e: WheelEvent, canvasDraw: CanvasDraw): DisabledState | DefaultState;
    handleDrawStart: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => DisabledState | DefaultState | DrawingState | PanState | WaitForPinchState | ScaleOrPanState | DisabledState;
    handleDrawMove: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => DisabledState | DefaultState;
    handleDrawEnd: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => DisabledState | DefaultState;
}
export declare class PanState {
    dragStart: {
        clientX: number;
        clientY: number;
    };
    panStart: {
        x: number;
        y: number;
    };
    constructor();
    handleMouseWheel: <T>(this: T, e: Event) => T;
    handleDrawStart: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => PanState;
    handleDrawMove: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => PanState;
    handleDrawEnd: () => DefaultState;
}
export declare class WaitForPinchState {
    startClientPoint: {
        clientX: number;
        clientY: number;
    } | null;
    startTimestamp: number;
    deferredPoints: {
        clientX: number;
        clientY: number;
    }[];
    constructor();
    handleMouseWheel: <T>(this: T, e: Event) => T;
    handleDrawStart: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => DefaultState | DrawingState | ScaleOrPanState | WaitForPinchState;
    handleDrawMove: (e: TouchEvent | MouseEvent, canvasDraw: CanvasDraw) => DefaultState | WaitForPinchState | DrawingState | ScaleOrPanState;
    handleDrawEnd: (e: TouchEvent, canvasDraw: CanvasDraw) => DefaultState | DisabledState;
    issueDeferredPoints: (canvasDraw: CanvasDraw) => DefaultState | DrawingState;
}
export declare class ScaleOrPanState {
    start: {
        t1: {
            clientX: number;
            clientY: number;
        };
        t2: {
            clientX: number;
            clientY: number;
        };
        distance: number;
        centroid: {
            clientX: number;
            clientY: number;
        };
    };
    panStart: {
        x: number;
        y: number;
    };
    scaleStart: number;
    recentMetrics: {
        centroid: {
            clientX: number;
            clientY: number;
        };
        distance: number;
    };
    constructor();
    handleMouseWheel: <T>(this: T, e: Event) => T;
    handleDrawStart: (e: TouchEvent, canvasDraw: CanvasDraw) => ScaleOrPanState | DefaultState;
    handleDrawMove: (e: TouchEvent, canvasDraw: CanvasDraw) => ScaleOrPanState | TouchPanState | TouchScaleState | DefaultState;
    handleDrawEnd: () => DefaultState;
    getTouchMetrics: (e: TouchEvent) => {
        t1: {
            clientX: number;
            clientY: number;
        };
        t2: {
            clientX: number;
            clientY: number;
        };
        distance: number;
        centroid: {
            clientX: number;
            clientY: number;
        };
    };
}
export declare class TouchPanState {
    scaleOrPanState: ScaleOrPanState;
    constructor(scaleOrPanState: ScaleOrPanState);
    handleMouseWheel: <T>(this: T, e: Event) => T;
    handleDrawStart: () => TouchPanState;
    handleDrawMove: (e: TouchEvent, canvasDraw: CanvasDraw) => TouchPanState | DefaultState;
    handleDrawEnd: () => DefaultState;
}
export declare class TouchScaleState {
    scaleOrPanState: ScaleOrPanState;
    constructor(scaleOrPanState: ScaleOrPanState);
    handleMouseWheel: <T>(this: T, e: Event) => T;
    handleDrawStart: () => TouchScaleState;
    handleDrawMove: (e: TouchEvent, canvasDraw: CanvasDraw) => TouchScaleState | DefaultState;
    handleDrawEnd: () => DefaultState;
}
export declare class DrawingState {
    isDrawing: boolean;
    constructor();
    handleMouseWheel: <T>(this: T, e: Event) => T;
    handleDrawStart: (e: MouseEvent | TouchEvent | SyntheticEvent, canvasDraw: CanvasDraw) => DrawingState;
    handleDrawMove: (e: MouseEvent | TouchEvent | SyntheticEvent, canvasDraw: CanvasDraw) => DrawingState;
    handleDrawEnd: (e: MouseEvent | TouchEvent, canvasDraw: CanvasDraw) => DefaultState;
}
export declare class SyntheticEvent {
    clientX: number;
    clientY: number;
    touches: {
        clientX: number;
        clientY: number;
    }[];
    constructor({ clientX, clientY }: {
        clientX: number;
        clientY: number;
    });
    preventDefault: () => void;
}
export declare function clientPointFromEvent(e: WheelEvent | TouchEvent | MouseEvent | SyntheticEvent | TouchList | Touch): {
    clientX: number;
    clientY: number;
};
export declare function viewPointFromEvent(coordSystem: any, e: MouseEvent | TouchEvent | SyntheticEvent): {
    x: number;
    y: number;
};
