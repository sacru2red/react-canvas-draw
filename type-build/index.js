"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var prop_types_1 = __importDefault(require("prop-types"));
var lazy_brush_1 = require("lazy-brush");
// import { Catenary } from "catenary-curve";
var resize_observer_polyfill_1 = __importDefault(require("resize-observer-polyfill"));
var coordinateSystem_1 = __importStar(require("./coordinateSystem"));
var drawImage_1 = __importDefault(require("./drawImage"));
var interactionStateMachine_1 = require("./interactionStateMachine");
var makePassiveEventOption_1 = __importDefault(require("./makePassiveEventOption"));
function midPointBtw(p1, p2) {
    return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2,
    };
}
var canvasStyle = {
    display: "block",
    position: "absolute",
};
// The order of these is important: grid > drawing > temp > interface
var canvasTypes = ["grid", "drawing", "temp", "interface"];
var dimensionsPropTypes = prop_types_1.default.oneOfType([
    prop_types_1.default.number,
    prop_types_1.default.string,
]);
var boundsProp = prop_types_1.default.shape({
    min: prop_types_1.default.number.isRequired,
    max: prop_types_1.default.number.isRequired,
});
var CanvasDraw = /** @class */ (function (_super) {
    __extends(CanvasDraw, _super);
    ///// public API /////////////////////////////////////////////////////////////
    function CanvasDraw(props) {
        var _this = _super.call(this, props) || this;
        _this.lines = [];
        _this.erasedLines = [];
        _this.points = [];
        _this.undo = function () {
            var lines = [];
            if (_this.lines.length) {
                lines = _this.lines.slice(0, -1);
            }
            else if (_this.erasedLines.length) {
                var poped = _this.erasedLines.pop();
                lines = poped ? [poped] : undefined;
            }
            _this.clearExceptErasedLines();
            _this.simulateDrawingLines({ lines: lines, immediate: true });
            _this.triggerOnChange();
        };
        _this.eraseAll = function () {
            var _a;
            (_a = _this.erasedLines).push.apply(_a, __spreadArray([], __read(_this.lines), false));
            _this.clearExceptErasedLines();
            _this.triggerOnChange();
        };
        _this.clear = function () {
            _this.erasedLines = [];
            _this.clearExceptErasedLines();
            _this.resetView();
        };
        _this.resetView = function () {
            return _this.coordSystem.resetView();
        };
        _this.setView = function (view) {
            return _this.coordSystem.setView(view);
        };
        _this.getSaveData = function () {
            // Construct and return the stringified saveData object
            return JSON.stringify({
                lines: _this.lines,
                width: _this.props.canvasWidth,
                height: _this.props.canvasHeight,
            });
        };
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
        _this.getDataURL = function (fileType, useBgImage, backgroundColour) {
            // Get a reference to the "drawing" layer of the canvas
            var canvasToExport = _this.canvas.drawing;
            if (!canvasToExport) {
                return "Canvas not found";
            }
            var context = canvasToExport.getContext("2d");
            if (!context) {
                return "Canvas context not found";
            }
            //cache height and width
            var width = canvasToExport.width;
            var height = canvasToExport.height;
            //get the current ImageData for the canvas
            var storedImageData = context.getImageData(0, 0, width, height);
            //store the current globalCompositeOperation
            var compositeOperation = context.globalCompositeOperation;
            //set to draw behind current content
            context.globalCompositeOperation = "destination-over";
            // If "useBgImage" has been set to true, this takes precedence over the background colour parameter
            if (useBgImage) {
                if (!_this.props.imgSrc)
                    return "Background image source not set";
                // Write the background image
                _this.drawImage();
            }
            else if (backgroundColour != null) {
                //set background color
                context.fillStyle = backgroundColour;
                //fill entire canvas with background colour
                context.fillRect(0, 0, width, height);
            }
            // If the file type has not been specified, default to PNG
            if (!fileType)
                fileType = "png";
            // Export the canvas to data URL
            var imageData = canvasToExport.toDataURL("image/" + fileType);
            //clear the canvas
            context.clearRect(0, 0, width, height);
            //restore it with original / cached ImageData
            context.putImageData(storedImageData, 0, 0);
            //reset the globalCompositeOperation to what it was
            context.globalCompositeOperation = compositeOperation;
            return imageData;
        };
        _this.loadSaveData = function (saveData, immediate) {
            if (immediate === void 0) { immediate = _this.props.immediateLoading; }
            if (typeof saveData !== "string") {
                throw new Error("saveData needs to be of type string!");
            }
            var _a = JSON.parse(saveData), lines = _a.lines, width = _a.width, height = _a.height;
            if (!lines || typeof lines.push !== "function" || !Array.isArray(lines)) {
                throw new Error("saveData.lines needs to be an array!");
            }
            _this.clear();
            if (width === _this.props.canvasWidth &&
                height === _this.props.canvasHeight) {
                _this.simulateDrawingLines({
                    lines: lines,
                    immediate: immediate,
                });
            }
            else {
                // we need to rescale the lines based on saved & current dimensions
                var scaleX_1 = _this.props.canvasWidth / width;
                var scaleY_1 = _this.props.canvasHeight / height;
                var scaleAvg_1 = (scaleX_1 + scaleY_1) / 2;
                _this.simulateDrawingLines({
                    lines: lines.map(function (line) { return (__assign(__assign({}, line), { points: line.points.map(function (p) { return ({
                            x: p && typeof p === 'object' && 'x' in p ? p.x * scaleX_1 : NaN,
                            y: p && typeof p === 'object' && 'y' in p ? p.y * scaleY_1 : NaN,
                        }); }), brushRadius: line.brushRadius * scaleAvg_1 })); }),
                    immediate: immediate,
                });
            }
        };
        _this.componentWillUnmount = function () {
            if (_this.canvasObserver && _this.canvasContainer) {
                _this.canvasObserver.unobserve(_this.canvasContainer);
            }
            _this.canvas.interface &&
                // @ts-ignore
                _this.canvas.interface.removeEventListener("wheel", _this.handleWheel);
        };
        ///// Event Handlers
        _this.handleWheel = function (e) {
            // @ts-ignore
            _this.interactionSM = _this.interactionSM.handleMouseWheel(e, _this);
        };
        _this.handleDrawStart = function (e) {
            // @ts-ignore
            _this.interactionSM = _this.interactionSM.handleDrawStart(e, _this);
            _this.mouseHasMoved = true;
        };
        _this.handleDrawMove = function (e) {
            // @ts-ignore
            _this.interactionSM = _this.interactionSM.handleDrawMove(e, _this);
            _this.mouseHasMoved = true;
        };
        _this.handleDrawEnd = function (e) {
            // @ts-ignore
            _this.interactionSM = _this.interactionSM.handleDrawEnd(e, _this);
            _this.mouseHasMoved = true;
        };
        _this.applyView = function () {
            if (!_this.ctx.drawing) {
                return;
            }
            canvasTypes
                .map(function (name) { return _this.ctx[name]; })
                .forEach(function (ctx) {
                _this.clearWindow(ctx);
                var m = _this.coordSystem.transformMatrix;
                if (ctx) {
                    ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
                }
            });
            if (!_this.deferRedrawOnViewChange) {
                if (_this.ctx.grid) {
                    _this.drawGrid(_this.ctx.grid);
                }
                _this.redrawImage();
                _this.loop({ once: true });
                var lines = _this.lines;
                _this.lines = [];
                _this.simulateDrawingLines({ lines: lines, immediate: true });
            }
        };
        _this.handleCanvasResize = function (entries, _observer) {
            var e_1, _a;
            var saveData = _this.getSaveData();
            _this.deferRedrawOnViewChange = true;
            try {
                try {
                    for (var entries_1 = __values(entries), entries_1_1 = entries_1.next(); !entries_1_1.done; entries_1_1 = entries_1.next()) {
                        var entry = entries_1_1.value;
                        var _b = entry.contentRect, width = _b.width, height = _b.height;
                        if (_this.canvas.interface) {
                            _this.setCanvasSize(_this.canvas.interface, width, height);
                        }
                        if (_this.canvas.drawing) {
                            _this.setCanvasSize(_this.canvas.drawing, width, height);
                        }
                        if (_this.canvas.temp) {
                            _this.setCanvasSize(_this.canvas.temp, width, height);
                        }
                        if (_this.canvas.grid) {
                            _this.setCanvasSize(_this.canvas.grid, width, height);
                        }
                        _this.coordSystem.documentSize = { width: width, height: height };
                        _this.drawGrid(_this.ctx.grid);
                        _this.drawImage();
                        _this.loop({ once: true });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (entries_1_1 && !entries_1_1.done && (_a = entries_1.return)) _a.call(entries_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                _this.loadSaveData(saveData, true);
            }
            finally {
                _this.deferRedrawOnViewChange = false;
            }
        };
        ///// Helpers
        _this.clampPointToDocument = function (point) {
            if (_this.props.clampLinesToDocument) {
                return {
                    x: Math.max(Math.min(point.x, _this.props.canvasWidth), 0),
                    y: Math.max(Math.min(point.y, _this.props.canvasHeight), 0),
                };
            }
            else {
                return point;
            }
        };
        _this.redrawImage = function () {
            _this.image &&
                _this.image.complete &&
                (0, drawImage_1.default)({ ctx: _this.ctx.grid, img: _this.image });
        };
        _this.simulateDrawingLines = function (_a) {
            var lines = _a.lines, immediate = _a.immediate;
            // Simulate live-drawing of the loaded lines
            // TODO use a generator
            var curTime = 0;
            var timeoutGap = immediate ? 0 : _this.props.loadTimeOffset;
            if (!lines) {
                return;
            }
            lines.forEach(function (line) {
                var points = line.points, brushColor = line.brushColor, brushRadius = line.brushRadius;
                // Draw all at once if immediate flag is set, instead of using setTimeout
                if (immediate) {
                    // Draw the points
                    _this.drawPoints({
                        points: points,
                        brushColor: brushColor,
                        brushRadius: brushRadius,
                    });
                    // Save line with the drawn points
                    _this.points = points;
                    _this.saveLine({ brushColor: brushColor, brushRadius: brushRadius });
                    return;
                }
                var _loop_1 = function (i) {
                    curTime += timeoutGap;
                    window.setTimeout(function () {
                        _this.drawPoints({
                            points: points.slice(0, i + 1),
                            brushColor: brushColor,
                            brushRadius: brushRadius,
                        });
                    }, curTime);
                };
                // Use timeout to draw
                for (var i = 1; i < points.length; i++) {
                    _loop_1(i);
                }
                curTime += timeoutGap;
                window.setTimeout(function () {
                    // Save this line with its props instead of this.props
                    _this.points = points;
                    _this.saveLine({ brushColor: brushColor, brushRadius: brushRadius });
                }, curTime);
            });
        };
        _this.setCanvasSize = function (canvas, width, height) {
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = width.toString();
            canvas.style.height = height.toString();
        };
        _this.drawPoints = function (_a) {
            var points = _a.points, brushColor = _a.brushColor, brushRadius = _a.brushRadius;
            if (_this.ctx.temp) {
                _this.ctx.temp.lineJoin = "round";
                _this.ctx.temp.lineCap = "round";
                _this.ctx.temp.strokeStyle = brushColor;
            }
            _this.clearWindow(_this.ctx.temp);
            if (_this.ctx.temp) {
                _this.ctx.temp.lineWidth = brushRadius * 2;
            }
            var p1 = points[0];
            var p2 = points[1];
            if (_this.ctx.temp) {
                _this.ctx.temp.moveTo(p2.x, p2.y);
                _this.ctx.temp.beginPath();
            }
            for (var i = 1, len = points.length; i < len; i++) {
                // we pick the point between pi+1 & pi+2 as the
                // end point and p1 as our control point
                var midPoint = midPointBtw(p1, p2);
                if (_this.ctx.temp) {
                    _this.ctx.temp.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
                }
                p1 = points[i];
                p2 = points[i + 1];
            }
            // Draw last line as a straight line while
            // we wait for the next point to be able to calculate
            // the bezier control point
            if (_this.ctx.temp) {
                _this.ctx.temp.lineTo(p1.x, p1.y);
                _this.ctx.temp.stroke();
            }
        };
        _this.saveLine = function (params) {
            var _a = params || {}, brushColor = _a.brushColor, brushRadius = _a.brushRadius;
            if (_this.points.length < 2)
                return;
            // Save as new line
            _this.lines.push({
                points: __spreadArray([], __read(_this.points), false),
                brushColor: brushColor || _this.props.brushColor,
                brushRadius: brushRadius || _this.props.brushRadius,
            });
            // Reset points array
            _this.points.length = 0;
            // Copy the line to the drawing canvas
            _this.inClientSpace([_this.ctx.drawing, _this.ctx.temp], function () {
                if (_this.ctx.drawing && _this.canvas.temp) {
                    _this.ctx.drawing.drawImage(_this.canvas.temp, 0, 0, _this.canvas.drawing ? _this.canvas.drawing.width || NaN : NaN, _this.canvas.drawing ? _this.canvas.drawing.height || NaN : NaN);
                }
            });
            // Clear the temporary line-drawing canvas
            _this.clearWindow(_this.ctx.temp);
            _this.triggerOnChange();
        };
        _this.triggerOnChange = function () {
            _this.props.onChange && _this.props.onChange(_this);
        };
        _this.clearWindow = function (ctx) {
            _this.inClientSpace([ctx], function () {
                if (ctx == null) {
                    return;
                }
                return ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            });
        };
        _this.clearExceptErasedLines = function () {
            _this.lines = [];
            _this.valuesChanged = true;
            _this.clearWindow(_this.ctx.drawing);
            _this.clearWindow(_this.ctx.temp);
        };
        _this.loop = function (_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.once, once = _c === void 0 ? false : _c;
            if (_this.mouseHasMoved || _this.valuesChanged) {
                if (_this.lazy) {
                    var pointer = _this.lazy.getPointerCoordinates();
                    var brush = _this.lazy.getBrushCoordinates();
                    _this.drawInterface(_this.ctx.interface, pointer, brush);
                    _this.mouseHasMoved = false;
                    _this.valuesChanged = false;
                }
            }
            if (!once) {
                window.requestAnimationFrame(function () {
                    _this.loop();
                });
            }
        };
        _this.inClientSpace = function (ctxs, action) {
            ctxs.forEach(function (ctx) {
                if (ctx) {
                    ctx.save();
                    ctx.setTransform(coordinateSystem_1.IDENTITY.a, coordinateSystem_1.IDENTITY.b, coordinateSystem_1.IDENTITY.c, coordinateSystem_1.IDENTITY.d, coordinateSystem_1.IDENTITY.e, coordinateSystem_1.IDENTITY.f);
                }
            });
            try {
                action();
            }
            finally {
                ctxs.forEach(function (ctx) {
                    if (ctx) {
                        ctx.restore();
                    }
                });
            }
        };
        ///// Canvas Rendering
        _this.drawImage = function () {
            if (!_this.props.imgSrc)
                return;
            // Load the image
            _this.image = new Image();
            // Prevent SecurityError "Tainted canvases may not be exported." #70
            _this.image.crossOrigin = "anonymous";
            // Draw the image once loaded
            _this.image.onload = _this.redrawImage;
            _this.image.src = _this.props.imgSrc;
        };
        _this.drawGrid = function (ctx) {
            if (_this.props.hideGrid)
                return;
            _this.clearWindow(ctx);
            if (ctx == null) {
                return;
            }
            var gridSize = 25;
            var bounds = _this.coordSystem.canvasBounds;
            var viewMin = bounds ? bounds.viewMin : { x: NaN, y: NaN };
            var viewMax = bounds ? bounds.viewMax : { x: NaN, y: NaN };
            var minx = Math.floor(viewMin.x / gridSize - 1) * gridSize;
            var miny = Math.floor(viewMin.y / gridSize - 1) * gridSize;
            var maxx = viewMax.x + gridSize;
            var maxy = viewMax.y + gridSize;
            ctx.beginPath();
            ctx.setLineDash([5, 1]);
            ctx.setLineDash([]);
            ctx.strokeStyle = _this.props.gridColor;
            ctx.lineWidth = _this.props.gridLineWidth;
            if (!_this.props.hideGridX) {
                var countX = minx;
                var gridSizeX = _this.props.gridSizeX;
                while (countX < maxx) {
                    countX += gridSizeX;
                    ctx.moveTo(countX, miny);
                    ctx.lineTo(countX, maxy);
                }
                ctx.stroke();
            }
            if (!_this.props.hideGridY) {
                var countY = miny;
                var gridSizeY = _this.props.gridSizeY;
                while (countY < maxy) {
                    countY += gridSizeY;
                    ctx.moveTo(minx, countY);
                    ctx.lineTo(maxx, countY);
                }
                ctx.stroke();
            }
        };
        _this.drawInterface = function (ctx, pointer, brush) {
            if (_this.props.hideInterface)
                return;
            if (ctx == null) {
                return;
            }
            _this.clearWindow(ctx);
            // Draw brush preview
            ctx.beginPath();
            ctx.fillStyle = _this.props.brushColor;
            ctx.arc(brush.x, brush.y, _this.props.brushRadius, 0, Math.PI * 2, true);
            ctx.fill();
            // Draw mouse point (the one directly at the cursor)
            ctx.beginPath();
            ctx.fillStyle = _this.props.catenaryColor;
            ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
            ctx.fill();
            // Draw catenary
            if (_this.lazy) {
                if (_this.lazy.isEnabled()) {
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.setLineDash([2, 4]);
                    ctx.strokeStyle = _this.props.catenaryColor;
                    // this.catenary.drawToCanvas(
                    //   this.ctx.interface,
                    //   brush,
                    //   pointer,
                    //   this.chainLength
                    // );
                    ctx.stroke();
                }
            }
            // Draw brush point (the one in the middle of the brush preview)
            ctx.beginPath();
            ctx.fillStyle = _this.props.catenaryColor;
            ctx.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
            ctx.fill();
        };
        _this.canvas = {};
        _this.ctx = {};
        // this.catenary = new Catenary();
        _this.points = [];
        _this.lines = [];
        _this.erasedLines = [];
        _this.mouseHasMoved = true;
        _this.valuesChanged = true;
        _this.isDrawing = false;
        _this.isPressing = false;
        _this.deferRedrawOnViewChange = false;
        _this.interactionSM = new interactionStateMachine_1.DefaultState();
        _this.coordSystem = new coordinateSystem_1.default({
            scaleExtents: props.zoomExtents,
            documentSize: { width: props.canvasWidth, height: props.canvasHeight },
        });
        _this.coordSystem.attachViewChangeListener(_this.applyView.bind(_this));
        return _this;
    }
    ///// private API ////////////////////////////////////////////////////////////
    ///// React Lifecycle
    CanvasDraw.prototype.componentDidMount = function () {
        var _this = this;
        this.lazy = new lazy_brush_1.LazyBrush({
            radius: this.props.lazyRadius * window.devicePixelRatio,
            enabled: true,
            initialPoint: {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            },
        });
        this.chainLength = this.props.lazyRadius * window.devicePixelRatio;
        this.canvasObserver = new resize_observer_polyfill_1.default(function (entries, observer) {
            return _this.handleCanvasResize(entries, observer);
        });
        if (this.canvasContainer) {
            this.canvasObserver.observe(this.canvasContainer);
        }
        this.drawImage();
        this.loop();
        window.setTimeout(function () {
            var initX = window.innerWidth / 2;
            var initY = window.innerHeight / 2;
            if (_this.lazy && _this.chainLength) {
                _this.lazy.update({ x: initX - _this.chainLength / 4, y: initY }, { both: true });
                _this.lazy.update({ x: initX + _this.chainLength / 4, y: initY }, { both: false });
            }
            _this.mouseHasMoved = true;
            _this.valuesChanged = true;
            _this.clearExceptErasedLines();
            // Load saveData from prop if it exists
            if (_this.props.saveData) {
                _this.loadSaveData(_this.props.saveData);
            }
        }, 100);
        // Attach our wheel event listener here instead of in the render so that we can specify a non-passive listener.
        // This is necessary to prevent the default event action on chrome.
        // https://github.com/facebook/react/issues/14856
        this.canvas.interface &&
            this.canvas.interface.addEventListener("wheel", 
            // @ts-ignore
            this.handleWheel, (0, makePassiveEventOption_1.default)());
    };
    CanvasDraw.prototype.componentDidUpdate = function (prevProps) {
        if (prevProps.lazyRadius !== this.props.lazyRadius) {
            // Set new lazyRadius values
            this.chainLength = this.props.lazyRadius * window.devicePixelRatio;
            if (this.lazy) {
                this.lazy.setRadius(this.props.lazyRadius * window.devicePixelRatio);
            }
        }
        if (prevProps.saveData !== this.props.saveData) {
            this.loadSaveData(this.props.saveData);
        }
        if (JSON.stringify(prevProps) !== JSON.stringify(this.props)) {
            // Signal this.loop function that values changed
            this.valuesChanged = true;
        }
        this.coordSystem.scaleExtents = this.props.zoomExtents;
        if (!this.props.enablePanAndZoom) {
            this.coordSystem.resetView();
        }
        if (prevProps.imgSrc !== this.props.imgSrc) {
            this.drawImage();
        }
    };
    CanvasDraw.prototype.render = function () {
        var _this = this;
        return ((0, jsx_runtime_1.jsx)("div", __assign({ className: this.props.className, style: __assign({ display: "block", background: this.props.backgroundColor, touchAction: "none", width: this.props.canvasWidth, height: this.props.canvasHeight }, this.props.style), ref: function (container) {
                if (container) {
                    _this.canvasContainer = container;
                }
            } }, { children: canvasTypes.map(function (name) {
                var isInterface = name === "interface";
                return ((0, jsx_runtime_1.jsx)("canvas", { ref: function (canvas) {
                        if (canvas) {
                            _this.canvas[name] = canvas;
                            _this.ctx[name] = canvas.getContext("2d") || undefined;
                            if (isInterface) {
                                _this.coordSystem.canvas = canvas;
                            }
                        }
                    }, style: __assign({}, canvasStyle), onMouseDown: isInterface ? _this.handleDrawStart : undefined, onMouseMove: isInterface ? _this.handleDrawMove : undefined, onMouseUp: isInterface ? _this.handleDrawEnd : undefined, onMouseOut: isInterface ? _this.handleDrawEnd : undefined, onTouchStart: isInterface ? _this.handleDrawStart : undefined, onTouchMove: isInterface ? _this.handleDrawMove : undefined, onTouchEnd: isInterface ? _this.handleDrawEnd : undefined, onTouchCancel: isInterface ? _this.handleDrawEnd : undefined }, name));
            }) }), void 0));
    };
    CanvasDraw.propTypes = {
        onChange: prop_types_1.default.func,
        loadTimeOffset: prop_types_1.default.number,
        lazyRadius: prop_types_1.default.number,
        brushRadius: prop_types_1.default.number,
        brushColor: prop_types_1.default.string,
        catenaryColor: prop_types_1.default.string,
        gridColor: prop_types_1.default.string,
        backgroundColor: prop_types_1.default.string,
        hideGrid: prop_types_1.default.bool,
        canvasWidth: dimensionsPropTypes,
        canvasHeight: dimensionsPropTypes,
        disabled: prop_types_1.default.bool,
        imgSrc: prop_types_1.default.string,
        saveData: prop_types_1.default.string,
        immediateLoading: prop_types_1.default.bool,
        hideInterface: prop_types_1.default.bool,
        gridSizeX: prop_types_1.default.number,
        gridSizeY: prop_types_1.default.number,
        gridLineWidth: prop_types_1.default.number,
        hideGridX: prop_types_1.default.bool,
        hideGridY: prop_types_1.default.bool,
        enablePanAndZoom: prop_types_1.default.bool,
        mouseZoomFactor: prop_types_1.default.number,
        zoomExtents: boundsProp,
        clampLinesToDocument: prop_types_1.default.bool,
    };
    CanvasDraw.defaultProps = {
        onChange: null,
        loadTimeOffset: 5,
        lazyRadius: 12,
        brushRadius: 10,
        brushColor: "#444",
        catenaryColor: "#0a0302",
        gridColor: "rgba(150,150,150,0.17)",
        backgroundColor: "#FFF",
        hideGrid: false,
        canvasWidth: 400,
        canvasHeight: 400,
        disabled: false,
        imgSrc: "",
        saveData: "",
        immediateLoading: false,
        hideInterface: false,
        gridSizeX: 25,
        gridSizeY: 25,
        gridLineWidth: 0.5,
        hideGridX: false,
        hideGridY: false,
        enablePanAndZoom: false,
        mouseZoomFactor: 0.01,
        zoomExtents: { min: 0.33, max: 3 },
        clampLinesToDocument: false,
    };
    return CanvasDraw;
}(react_1.PureComponent));
exports.default = CanvasDraw;
