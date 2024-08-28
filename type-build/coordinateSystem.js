"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDENTITY = void 0;
/**
 * @type {ViewPoint}
 */
var NULL_VIEW_POINT = Object.freeze({
    x: 0, y: 0, untransformedX: 0, untransformedY: 0
});
/**
 * @type {CanvasBounds}
 */
var NULL_BOUNDS = Object.freeze({
    canvasWidth: 0, canvasHeight: 0,
    left: 0, top: 0, right: 0, bottom: 0,
    viewMin: NULL_VIEW_POINT, viewMax: NULL_VIEW_POINT,
});
/**
 * The identity matrix (a transform that results in view coordinates that are
 * identical to relative client coordinates).
 * @type {Matrix}
 */
exports.IDENTITY = Object.freeze({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
function valueOrDefault(value, defaultValue) {
    if (value === null || (typeof value) === "undefined") {
        return defaultValue;
    }
    else {
        return value;
    }
}
/**
 * Facilitates calculation and manipulation of a zoom-and-pannable view within a
 * canvas.
 */
var CoordinateSystem = /** @class */ (function () {
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
    function CoordinateSystem(_a) {
        var _this = this;
        var scaleExtents = _a.scaleExtents, documentSize = _a.documentSize;
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
        this._canvas = null;
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
        this._view = { scale: 1.0, x: 0, y: 0 };
        /**
         * Describes a callback function that receives info about view changes
         * @typedef {(update: { view: View, transform: Matrix }) => void} ViewListener
         */
        /**
         * @type {ViewListener[]}
         * @private
         */
        this._viewChangeListeners = new Set();
        /**
         * Sets the zoom factor (clamped by the scale extents) and updates the view.
         * @param {number} the new zoom factor
         */
        this.setScale = function (scale) {
            _this.setView({ scale: scale });
        };
        /**
         * Calculates a variant of the given view clamped according to the scale and
         * document bounds. Does not modify this instance.
         * @param {View} view the view constraints to clamp.
         * @returns {View} a new view object representing the constrained input.
         */
        this.clampView = function (_a) {
            var scale = _a.scale, x = _a.x, y = _a.y;
            var _b = _this.scaleExtents, min = _b.min, max = _b.max;
            var _c = _this.documentSize, width = _c.width, height = _c.height;
            var _d = _this.canvasRect || NULL_BOUNDS, left = _d.left, top = _d.top, right = _d.right, bottom = _d.bottom;
            var canvasWidth = right - left;
            var canvasHeight = bottom - top;
            var maxx = canvasWidth / 2;
            var minx = -(width * _this._view.scale - canvasWidth / 2);
            var maxy = canvasHeight / 2;
            var miny = -(height * _this._view.scale - canvasHeight / 2);
            // Clamp values to acceptible range.
            return {
                scale: Math.min(Math.max(scale, min), max),
                x: Math.min(Math.max(x, minx), maxx),
                y: Math.min(Math.max(y, miny), maxy),
            };
        };
        /**
         * Resets the view transform to its default state.
         */
        this.resetView = function () {
            _this.setView({ scale: 1.0, x: 0, y: 0 });
        };
        /**
         * Updates the view, ensuring that it is within the document and scale bounds.
         * @param {View} view
         *    the new view state. Any view property not specified will remain
         *    unchanged.
         * @return {View}
         *    a copy of the view state after having been constrained and applied.
         */
        this.setView = function (view) {
            var newView = _this.clampView(__assign(__assign({}, _this._view), (view || {})));
            var _a = _this._view, scale = _a.scale, x = _a.x, y = _a.y;
            // Only trigger if the view actually changed.
            if (newView.scale !== scale || newView.x !== x || newView.y !== y) {
                _this._view = newView;
                _this._viewChangeListeners.forEach(function (listener) { return listener && listener(newView); });
            }
            return __assign({}, _this._view);
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
        this.scaleAtClientPoint = function (deltaScale, clientPoint) {
            var viewPt = _this.clientPointToViewPoint(clientPoint);
            var newView = _this.clampView(__assign(__assign({}, _this._view), { scale: _this._view.scale + deltaScale }));
            var clientPtPostScale = _this.viewPointToClientPoint(viewPt, newView);
            newView.x = _this._view.x - (clientPtPostScale.clientX - clientPoint.clientX);
            newView.y = _this._view.y - (clientPtPostScale.clientY - clientPoint.clientY);
            return _this.setView(newView);
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
        this.clientPointToViewPoint = function (_a, view) {
            var clientX = _a.clientX, clientY = _a.clientY;
            if (view === void 0) { view = _this._view; }
            var _b = _this.canvasRect || NULL_BOUNDS, left = _b.left, top = _b.top;
            var relativeClientX = clientX - left;
            var relativeClientY = clientY - top;
            return {
                x: (relativeClientX - view.x) / view.scale,
                y: (relativeClientY - view.y) / view.scale,
                relativeClientX: relativeClientX,
                relativeClientY: relativeClientY,
            };
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
        this.viewPointToClientPoint = function (_a, view) {
            var x = _a.x, y = _a.y;
            if (view === void 0) { view = _this._view; }
            var _b = _this.canvasRect || NULL_BOUNDS, left = _b.left, top = _b.top;
            var relativeX = x * view.scale + view.x;
            var relativeY = y * view.scale + view.y;
            var clientX = relativeX + left;
            var clientY = relativeY + top;
            return { clientX: clientX, clientY: clientY, relativeX: relativeX, relativeY: relativeY, x: clientX, y: clientY };
        };
        /**
         * Adds a new callback function that will be invoked each time the view
         * transform changes.
         * @param {ViewListener} listener the callback to execute.
         */
        this.attachViewChangeListener = function (listener) {
            _this._viewChangeListeners.add(listener);
        };
        this._scaleExtents = scaleExtents;
        this._documentSize = documentSize;
    }
    Object.defineProperty(CoordinateSystem.prototype, "canvas", {
        /**
         * @returns {Canvas} the canvas currently associated with this instance.
         */
        get: function () {
            return this._canvas;
        },
        /**
         * Updates the canvas for this coordinate system and recalculates the view.
         * @param {Canvas} canvas the new canvas to associate with this instance.
         */
        set: function (canvas) {
            this._canvas = canvas;
            this.setView();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "scale", {
        /**
         * @returns {number} the current zoom factor
         */
        get: function () {
            return this._view.scale;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "x", {
        /**
         * @returns {number} the horizontal component of the current pan offset
         */
        get: function () {
            return this._view.x;
        },
        /**
         * Sets the horizontal pan offset (clamped by the document extents) and
         * updates the view.
         * @param {number} x the new offset
         */
        set: function (x) {
            this.setView({ x: x });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "y", {
        /**
         * @retruns {number} the vertical component of the current pan offset
         */
        get: function () {
            return this._view.y;
        },
        /**
         * Sets the vertical pan offset (clamped by the document extents) and
         * updates the view.
         * @param {number} y the new offset
         */
        set: function (y) {
            this.setView({ y: y });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "view", {
        /**
         * @returns {View} a copy of this instance's current view state.
         */
        get: function () {
            return __assign({}, this._view);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "scaleExtents", {
        /**
         * @returns {Extents} a copy of the scale extents currently applied to this
         * instance.
         */
        get: function () {
            return __assign({}, this._scaleExtents);
        },
        /**
         * Updates the minimum and maximum scale and resets the view transform if it
         * is outside the new extents.
         * @param {Extents} extents the new scale extents.
         */
        set: function (_a) {
            var min = _a.min, max = _a.max;
            this._scaleExtents = { min: min, max: max };
            this.setView();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "documentSize", {
        /**
         * @returns {Size} the current document size (used to constrain the pan
         * offset).
         */
        get: function () {
            return __assign({}, this._documentSize);
        },
        /**
         * Sets the document size and recalculates the view if it is outside the new
         * bounds.
         * @param {Size} size the new document size.
         */
        set: function (_a) {
            var width = _a.width, height = _a.height;
            this._documentSize = { width: width, height: height };
            this.setView();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "transformMatrix", {
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
        get: function () {
            //
            return {
                a: this._view.scale,
                b: 0,
                c: 0,
                d: this._view.scale,
                e: this._view.x,
                f: this._view.y,
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "canvasBounds", {
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
        get: function () {
            if (this._canvas) {
                var _a = this._canvas.getBoundingClientRect(), left = _a.left, top_1 = _a.top, right = _a.right, bottom = _a.bottom;
                return {
                    viewMin: this.clientPointToViewPoint({ clientX: left, clientY: top_1 }),
                    viewMax: this.clientPointToViewPoint({ clientX: right, clientY: bottom }),
                    left: left,
                    top: top_1,
                    right: right,
                    bottom: bottom,
                    canvasWidth: this._canvas.width,
                    canvasHeight: this._canvas.height,
                };
            }
            else {
                return undefined;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CoordinateSystem.prototype, "canvasRect", {
        /**
         * @private
         * @return {{left: number, top: number} | undefined}
         */
        get: function () {
            if (this.canvas) {
                return this.canvas.getBoundingClientRect();
            }
            else {
                return undefined;
            }
        },
        enumerable: false,
        configurable: true
    });
    return CoordinateSystem;
}());
exports.default = CoordinateSystem;
