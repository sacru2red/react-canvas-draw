import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { LazyBrush } from "lazy-brush";
import ResizeObserver from "resize-observer-polyfill";
import CoordinateSystem from "./coordinateSystem";
import { DefaultState, DisabledState, DrawingState, PanState, ScaleOrPanState, TouchPanState, WaitForPinchState } from "./interactionStateMachine";
import { CanvasDrawProps, CanvasTypes, Line, Point } from "./types";
export default class CanvasDraw extends PureComponent<CanvasDrawProps> {
    lines: Line[];
    erasedLines: Line[];
    coordSystem: CoordinateSystem;
    ctx: {
        [key in CanvasTypes]?: CanvasRenderingContext2D;
    };
    canvas: {
        [key in CanvasTypes]?: HTMLCanvasElement | null;
    };
    points: Point[];
    mouseHasMoved: boolean;
    valuesChanged: boolean;
    isDrawing: boolean;
    isPressing: boolean;
    deferRedrawOnViewChange: boolean;
    interactionSM: DefaultState | DisabledState | PanState | WaitForPinchState | DrawingState | ScaleOrPanState | TouchPanState;
    lazy?: LazyBrush;
    chainLength?: number;
    canvasObserver?: ResizeObserver;
    canvasContainer?: HTMLDivElement;
    image?: HTMLImageElement;
    static propTypes: {
        onChange: PropTypes.Requireable<(...args: any[]) => any>;
        loadTimeOffset: PropTypes.Requireable<number>;
        lazyRadius: PropTypes.Requireable<number>;
        brushRadius: PropTypes.Requireable<number>;
        brushColor: PropTypes.Requireable<string>;
        catenaryColor: PropTypes.Requireable<string>;
        gridColor: PropTypes.Requireable<string>;
        backgroundColor: PropTypes.Requireable<string>;
        hideGrid: PropTypes.Requireable<boolean>;
        canvasWidth: PropTypes.Requireable<string | number>;
        canvasHeight: PropTypes.Requireable<string | number>;
        disabled: PropTypes.Requireable<boolean>;
        imgSrc: PropTypes.Requireable<string>;
        saveData: PropTypes.Requireable<string>;
        immediateLoading: PropTypes.Requireable<boolean>;
        hideInterface: PropTypes.Requireable<boolean>;
        gridSizeX: PropTypes.Requireable<number>;
        gridSizeY: PropTypes.Requireable<number>;
        gridLineWidth: PropTypes.Requireable<number>;
        hideGridX: PropTypes.Requireable<boolean>;
        hideGridY: PropTypes.Requireable<boolean>;
        enablePanAndZoom: PropTypes.Requireable<boolean>;
        mouseZoomFactor: PropTypes.Requireable<number>;
        zoomExtents: PropTypes.Requireable<PropTypes.InferProps<{
            min: PropTypes.Validator<number>;
            max: PropTypes.Validator<number>;
        }>>;
        clampLinesToDocument: PropTypes.Requireable<boolean>;
    };
    static defaultProps: {
        onChange: null;
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
        zoomExtents: {
            min: number;
            max: number;
        };
        clampLinesToDocument: boolean;
    };
    constructor(props: CanvasDrawProps);
    undo: () => void;
    eraseAll: () => void;
    clear: () => void;
    resetView: () => void;
    setView: (view: object) => {
        scale: number;
        x: number;
        y: number;
    };
    getSaveData: () => string;
    /**
     * Combination of work by Ernie Arrowsmith and emizz
     * References:
     * https://stackoverflow.com/questions/32160098/change-html-canvas-black-background-to-white-background-when-creating-jpg-image
     * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
  
     * This function will export the canvas to a data URL, which can subsequently be used to share or manipulate the image file.
     * @param {string} fileType Specifies the file format to export to. Note: should only be the file type, not the "image/" prefix.
     *  For supported types see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
     * @param {bool} useBgImage Specifies whether the canvas' current background image should also be exported. Default is false.
     * @param {string} backgroundColour The desired background colour hex code, e.g. "#ffffff" for white.
     */
    getDataURL: (fileType: string, useBgImage: boolean, backgroundColour: string) => string;
    loadSaveData: (saveData: unknown, immediate?: boolean) => void;
    componentDidMount(): void;
    componentDidUpdate(prevProps: CanvasDrawProps): void;
    componentWillUnmount: () => void;
    render(): import("react/jsx-runtime").JSX.Element;
    handleWheel: (e: React.WheelEvent) => void;
    handleDrawStart: (e: React.MouseEvent | React.TouchEvent) => void;
    handleDrawMove: (e: React.MouseEvent | React.TouchEvent) => void;
    handleDrawEnd: (e: React.MouseEvent | React.TouchEvent) => void;
    applyView: () => void;
    handleCanvasResize: (entries: ResizeObserverEntry[], _observer?: unknown) => void;
    clampPointToDocument: (point: Point) => Point;
    redrawImage: () => void;
    simulateDrawingLines: ({ lines, immediate }: {
        lines: Line[] | undefined;
        immediate: boolean;
    }) => void;
    setCanvasSize: (canvas: HTMLCanvasElement, width: number, height: number) => void;
    drawPoints: ({ points, brushColor, brushRadius }: {
        points: Point[];
        brushColor: string;
        brushRadius: number;
    }) => void;
    saveLine: (params?: {
        brushColor: string;
        brushRadius: number;
    } | undefined) => void;
    triggerOnChange: () => void;
    clearWindow: (ctx?: CanvasRenderingContext2D | null | undefined) => void;
    clearExceptErasedLines: () => void;
    loop: ({ once }?: {
        once?: boolean | undefined;
    }) => void;
    inClientSpace: (ctxs: Array<CanvasRenderingContext2D | null | undefined>, action: () => void) => void;
    drawImage: () => void;
    drawGrid: (ctx?: CanvasRenderingContext2D | null | undefined) => void;
    drawInterface: (ctx: CanvasRenderingContext2D | null | undefined, pointer: Point, brush: Point) => void;
}
