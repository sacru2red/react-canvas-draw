import { Extents, Size } from "./types";
/**
 * The identity matrix (a transform that results in view coordinates that are
 * identical to relative client coordinates).
 * @type {Matrix}
 */
export declare const IDENTITY: Readonly<{
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}>;
/**
 * Facilitates calculation and manipulation of a zoom-and-pannable view within a
 * canvas.
 */
export default class CoordinateSystem {
    /**
     * @typedef Extents
     * @property {number} min the minimal value in the range
     * @property {number} max the maximal value in the range
     */
    /**
     * @typedef Size
     * @property {number} width the span of the element's horizontal axis
     * @property {number} height the span of the element's vertical axis
     */
    /**
     * @param {Object} parameters the initialization parameters for this instance.
     * @param {Extents} parameters.scaleExtents the minimum and maximum allowable scale factor.
     * @param {Sizee} parameters.documentSize the width and height of the document, in client space.
     */
    constructor({ scaleExtents, documentSize }: {
        scaleExtents: Extents;
        documentSize: Size;
    });
    /**
     * @type {Extents}
     */
    _scaleExtents: Extents;
    /**
     * @type {Size}
     */
    _documentSize: Size;
    /**
     * @typedef Canvas
     * @property {number} width the canvas's width
     * @property {number} height the canvas's height
     * @property {() => Object} getBoundingClientRect returns the client bounds
     */
    /**
     * @type {Canvas}
     * @private
     */
    _canvas: HTMLCanvasElement | null;
    /**
     * @typedef View
     * @property {number} scale the zoom factor
     * @property {number} x the current x offset
     * @property {number} y the current y offset
     */
    /**
     * @type {View}
     * @private
     */
    _view: {
        scale: number;
        x: number;
        y: number;
    };
    /**
     * Describes a callback function that receives info about view changes
     * @typedef {(update: { view: View, transform: Matrix }) => void} ViewListener
     */
    /**
     * @type {ViewListener[]}
     * @private
     */
    _viewChangeListeners: Set<Function>;
    /**
     * @returns {Canvas} the canvas currently associated with this instance.
     */
    get canvas(): HTMLCanvasElement | null;
    /**
     * Updates the canvas for this coordinate system and recalculates the view.
     * @param {Canvas} canvas the new canvas to associate with this instance.
     */
    set canvas(canvas: HTMLCanvasElement | null);
    /**
     * @returns {number} the current zoom factor
     */
    get scale(): number;
    /**
     * Sets the zoom factor (clamped by the scale extents) and updates the view.
     * @param {number} the new zoom factor
     */
    setScale: (scale: number) => void;
    /**
     * @returns {number} the horizontal component of the current pan offset
     */
    get x(): number;
    /**
     * Sets the horizontal pan offset (clamped by the document extents) and
     * updates the view.
     * @param {number} x the new offset
     */
    set x(x: number);
    /**
     * @retruns {number} the vertical component of the current pan offset
     */
    get y(): number;
    /**
     * Sets the vertical pan offset (clamped by the document extents) and
     * updates the view.
     * @param {number} y the new offset
     */
    set y(y: number);
    /**
     * @returns {View} a copy of this instance's current view state.
     */
    get view(): {
        scale: number;
        x: number;
        y: number;
    };
    /**
     * @returns {Extents} a copy of the scale extents currently applied to this
     * instance.
     */
    get scaleExtents(): {
        min: number;
        max: number;
    };
    /**
     * Updates the minimum and maximum scale and resets the view transform if it
     * is outside the new extents.
     * @param {Extents} extents the new scale extents.
     */
    set scaleExtents({ min, max }: {
        min: number;
        max: number;
    });
    /**
     * @returns {Size} the current document size (used to constrain the pan
     * offset).
     */
    get documentSize(): {
        width: number;
        height: number;
    };
    /**
     * Sets the document size and recalculates the view if it is outside the new
     * bounds.
     * @param {Size} size the new document size.
     */
    set documentSize({ width, height }: {
        width: number;
        height: number;
    });
    /**
     * A view matrix expressing a series of transformations.
     * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
     * @typedef Matrix
     * @property {number} a horizontal scaling factor (1 == unscaled)
     * @property {number} b vertical skewing factor (0 == unskewed)
     * @property {number} c horizontal skewing factor (0 == unskewed)
     * @property {number} d vertical scaling factor (1 == unscaled)
     * @property {number} e horizontal translation (0 == untranslated)
     * @property {number} f vertical translation (0 == untranslated)
     */
    /**
     * @returns {Matrix} this coordinate system's current transformation matrix
     */
    get transformMatrix(): {
        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        f: number;
    };
    /**
     * An object expressing the bounds of a canvas object in terms of the
     * coordinate system.
     * @typedef CanvasBounds
     * @property {number} left the left edge of the canvas in client space
     * @property {number} right the right edge of the canvas in client space
     * @property {number} top the top edge of the canvas in client space
     * @property {number} bottom the bottom edge of the canvas in client space
     * @property {number} canvasWidth the width of the canvas in client space
     * @property {number} canvasHeight the height of the canvas in client space
     * @property {ViewPoint} viewMin the top-left corner of the canvas in view space
     * @property {ViewPoint} viewMax the bottom-right corner of the canvas in view space
     */
    /**
     * @returns {CanvasBounds | undefined} the boundaries of the canvas linked to
     * this coordinate system, or undefined if no canvas is set.
     */
    get canvasBounds(): {
        viewMin: {
            x: number;
            y: number;
            relativeClientX: number;
            relativeClientY: number;
        };
        viewMax: {
            x: number;
            y: number;
            relativeClientX: number;
            relativeClientY: number;
        };
        left: number;
        top: number;
        right: number;
        bottom: number;
        canvasWidth: number;
        canvasHeight: number;
    } | undefined;
    /**
     * @private
     * @return {{left: number, top: number} | undefined}
     */
    get canvasRect(): DOMRect | undefined;
    /**
     * Calculates a variant of the given view clamped according to the scale and
     * document bounds. Does not modify this instance.
     * @param {View} view the view constraints to clamp.
     * @returns {View} a new view object representing the constrained input.
     */
    clampView: ({ scale, x, y }: {
        scale: number;
        x: number;
        y: number;
    }) => {
        scale: number;
        x: number;
        y: number;
    };
    /**
     * Resets the view transform to its default state.
     */
    resetView: () => void;
    /**
     * Updates the view, ensuring that it is within the document and scale bounds.
     * @param {View} view
     *    the new view state. Any view property not specified will remain
     *    unchanged.
     * @return {View}
     *    a copy of the view state after having been constrained and applied.
     */
    setView: (view?: object | undefined) => {
        scale: number;
        x: number;
        y: number;
    };
    /**
     * Updates the current view scale while attempting to keep the given point
     * fixed within the canvas.
     *
     * @param {number} deltaScale the amount by which to change the current scale factor.
     * @param {ClientPoint} clientPoint the origin of the zoom, in client space.
     *
     * @returns {View} the newly computed view.
     */
    scaleAtClientPoint: (deltaScale: number, clientPoint: {
        clientX: number;
        clientY: number;
    }) => {
        scale: number;
        x: number;
        y: number;
    };
    /**
     * Describes a point in view space (client space after the viewport transform
     * has been applied).
     * @typedef ViewPoint
     * @property {number} x
     *    the x-coordinate in view space
     * @property {number} y
     *    the y-coordinate in view space
     * @property {number} relativeClientX
     *    the x-coordinate of the point in client space, relative to the top-left
     *    corner of the canvas
     * @property {number} relativeClientY
     *    the y-coordinate of the point in client space, relative to the top-left
     *    corner of the canvas
     */
    /**
     * @param {ClientPoint} point the point to transform in client space
     * @param {View} view the view transform to apply (defaults to the current view)
     * @returns {ViewPoint} the result of converting the given client coordinate
     * to view space. If there is no canvas set, a top-left corner of (0, 0) is
     * assumed.
     */
    clientPointToViewPoint: ({ clientX, clientY }: {
        clientX: number;
        clientY: number;
    }, view?: {
        scale: number;
        x: number;
        y: number;
    }) => {
        x: number;
        y: number;
        relativeClientX: number;
        relativeClientY: number;
    };
    /**
     * @typedef ClientPoint
     * @property {number} clientX
     *    the x-coordinate in client space
     * @property {number} clientY
     *    the y-coordinate in client space
     * @property {number} x
     *    an alias for clientX
     * @property {number} y
     *    an alias for clientY
     * @property {number} relativeX
     *    the x-coordinate in client space, relative to the top-left corner of the
     *    canvas
     * @property {number} relativeY
     *    the y-coordinate in client space, relative to the top-left corner of the
     *    canvas
     */
    /**
     * @param {ViewPoint} point the point to transform in view space
     * @param {number} point.x the point's x-coordinate
     * @param {number} point.y the point's y-coordinate
     * @param {View} view the view transform to apply (defaults to the current view)
     * @returns {ClientPoint} the result of converting the given coordinate to
     * client space. If there is no canvas set, a top-left corner of (0, 0) is
     * assumed.
     */
    viewPointToClientPoint: ({ x, y }: {
        x: number;
        y: number;
    }, view?: {
        scale: number;
        x: number;
        y: number;
    }) => {
        clientX: number;
        clientY: number;
        relativeX: number;
        relativeY: number;
        x: number;
        y: number;
    };
    /**
     * Adds a new callback function that will be invoked each time the view
     * transform changes.
     * @param {ViewListener} listener the callback to execute.
     */
    attachViewChangeListener: (listener: Function) => void;
}
