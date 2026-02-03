"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewPointFromEvent = exports.clientPointFromEvent = exports.SyntheticEvent = exports.DrawingState = exports.TouchScaleState = exports.TouchPanState = exports.ScaleOrPanState = exports.WaitForPinchState = exports.PanState = exports.DisabledState = exports.DefaultState = void 0;
var TOUCH_SLOP = 10;
var PINCH_TIMEOUT_MS = 250;
var SUPPRESS_SCROLL = function (e) {
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
var DefaultState = /** @class */ (function () {
    function DefaultState() {
        var _this = this;
        this.handleDrawStart = function (e, canvasDraw) {
            if (canvasDraw.props.disabled) {
                return new DisabledState();
            }
            else if (e instanceof MouseEvent && e.ctrlKey && canvasDraw.props.enablePanAndZoom) {
                return (new PanState()).handleDrawStart(e, canvasDraw);
            }
            return (new WaitForPinchState()).handleDrawStart(e, canvasDraw);
        };
        this.handleDrawMove = function (e, canvasDraw) {
            if (canvasDraw.props.disabled) {
                return new DisabledState();
            }
            else {
                var _a = viewPointFromEvent(canvasDraw.coordSystem, e), x = _a.x, y = _a.y;
                if (canvasDraw.lazy) {
                    canvasDraw.lazy.update({ x: x, y: y });
                }
                return _this;
            }
        };
        this.handleDrawEnd = function (e, canvasDraw) {
            return canvasDraw.props.disabled ? (new DisabledState()) : _this;
        };
    }
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
    DefaultState.prototype.handleMouseWheel = function (e, canvasDraw) {
        var _a = canvasDraw.props, disabled = _a.disabled, enablePanAndZoom = _a.enablePanAndZoom, mouseZoomFactor = _a.mouseZoomFactor;
        if (disabled) {
            return new DisabledState();
        }
        else if (enablePanAndZoom && e.ctrlKey) {
            e.preventDefault();
            canvasDraw.coordSystem.scaleAtClientPoint(mouseZoomFactor * e.deltaY, clientPointFromEvent(e));
        }
        return this;
    };
    return DefaultState;
}());
exports.DefaultState = DefaultState;
var DisabledState = /** @class */ (function () {
    function DisabledState() {
        var _this = this;
        this.handleDrawStart = function (e, canvasDraw) {
            if (canvasDraw.props.disabled) {
                return _this;
            }
            else {
                return (new DefaultState()).handleDrawStart(e, canvasDraw);
            }
        };
        this.handleDrawMove = function (e, canvasDraw) {
            if (canvasDraw.props.disabled) {
                return _this;
            }
            else {
                return (new DefaultState()).handleDrawMove(e, canvasDraw);
            }
        };
        this.handleDrawEnd = function (e, canvasDraw) {
            if (canvasDraw.props.disabled) {
                return _this;
            }
            else {
                return (new DefaultState()).handleDrawEnd(e, canvasDraw);
            }
        };
    }
    DisabledState.prototype.handleMouseWheel = function (e, canvasDraw) {
        if (canvasDraw.props.disabled) {
            return this;
        }
        return (new DefaultState()).handleMouseWheel(e, canvasDraw);
    };
    return DisabledState;
}());
exports.DisabledState = DisabledState;
var PanState = /** @class */ (function () {
    function PanState() {
        var _this = this;
        this.handleMouseWheel = SUPPRESS_SCROLL.bind(this);
        this.handleDrawStart = function (e, canvasDraw) {
            e.preventDefault();
            _this.dragStart = clientPointFromEvent(e);
            _this.panStart = { x: canvasDraw.coordSystem.x, y: canvasDraw.coordSystem.y };
            return _this;
        };
        this.handleDrawMove = function (e, canvasDraw) {
            e.preventDefault();
            var _a = clientPointFromEvent(e), clientX = _a.clientX, clientY = _a.clientY;
            var dx = clientX - _this.dragStart.clientX;
            var dy = clientY - _this.dragStart.clientY;
            canvasDraw.coordSystem.setView({ x: _this.panStart.x + dx, y: _this.panStart.y + dy });
            return _this;
        };
        this.handleDrawEnd = function () { return new DefaultState(); };
        this.dragStart = { clientX: NaN, clientY: NaN };
        this.panStart = { x: NaN, y: NaN };
    }
    return PanState;
}());
exports.PanState = PanState;
var WaitForPinchState = /** @class */ (function () {
    function WaitForPinchState() {
        var _this = this;
        this.handleMouseWheel = SUPPRESS_SCROLL.bind(this);
        this.handleDrawStart = function (e, canvasDraw) {
            var enablePanAndZoom = canvasDraw.props.enablePanAndZoom;
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
            return _this.handleDrawMove(e, canvasDraw);
        };
        this.handleDrawMove = function (e, canvasDraw) {
            e.preventDefault();
            if (e instanceof TouchEvent) {
                if (e.touches && e.touches.length >= 2) {
                    return (new ScaleOrPanState()).handleDrawStart(e, canvasDraw);
                }
            }
            var clientPt = clientPointFromEvent(e);
            _this.deferredPoints.push(clientPt);
            if ((new Date()).valueOf() - _this.startTimestamp < PINCH_TIMEOUT_MS) {
                if (_this.startClientPoint === null) {
                    _this.startClientPoint = clientPt;
                }
                var d = Math.abs(clientPt.clientX - _this.startClientPoint.clientX)
                    + Math.abs(clientPt.clientY - _this.startClientPoint.clientY);
                if (d < TOUCH_SLOP) {
                    return _this;
                }
            }
            return _this.issueDeferredPoints(canvasDraw);
        };
        this.handleDrawEnd = function (e, canvasDraw) {
            return _this.issueDeferredPoints(canvasDraw).handleDrawEnd(e, canvasDraw);
        };
        this.issueDeferredPoints = function (canvasDraw) {
            var nextState = new DrawingState();
            for (var i = 0; i < _this.deferredPoints.length; i++) {
                var deferredPt = _this.deferredPoints[i];
                var syntheticEvt = new SyntheticEvent(deferredPt);
                var func = i === 0 ? nextState.handleDrawStart : nextState.handleDrawMove;
                nextState = func(syntheticEvt, canvasDraw);
            }
            return nextState;
        };
        this.startClientPoint = null;
        this.startTimestamp = (new Date()).valueOf();
        this.deferredPoints = [];
    }
    return WaitForPinchState;
}());
exports.WaitForPinchState = WaitForPinchState;
var ScaleOrPanState = /** @class */ (function () {
    function ScaleOrPanState() {
        var _this = this;
        this.handleMouseWheel = SUPPRESS_SCROLL.bind(this);
        this.handleDrawStart = function (e, canvasDraw) {
            e.preventDefault();
            if (!e.touches || e.touches.length < 2) {
                return new DefaultState();
            }
            _this.start = _this.getTouchMetrics(e);
            _this.panStart = { x: canvasDraw.coordSystem.x, y: canvasDraw.coordSystem.y };
            _this.scaleStart = canvasDraw.coordSystem.scale;
            return _this;
        };
        this.handleDrawMove = function (e, canvasDraw) {
            e.preventDefault();
            if (!e.touches || e.touches.length < 2) {
                return new DefaultState();
            }
            var _a = _this.recentMetrics = _this.getTouchMetrics(e), centroid = _a.centroid, distance = _a.distance;
            var dd = Math.abs(distance - _this.start.distance);
            if (dd >= TOUCH_SLOP) {
                return new TouchScaleState(_this).handleDrawMove(e, canvasDraw);
            }
            var dx = centroid.clientX - _this.start.centroid.clientX;
            var dy = centroid.clientY - _this.start.centroid.clientY;
            var dc = Math.abs(dx) + Math.abs(dy);
            if (dc >= TOUCH_SLOP) {
                return new TouchPanState(_this).handleDrawMove(e, canvasDraw);
            }
            return _this;
        };
        this.handleDrawEnd = function () { return new DefaultState(); };
        this.getTouchMetrics = function (e) {
            var _a = clientPointFromEvent(e.touches[0]), t1x = _a.clientX, t1y = _a.clientY;
            var _b = clientPointFromEvent(e.touches[1]), t2x = _b.clientX, t2y = _b.clientY;
            var dx = t2x - t1x;
            var dy = t2y - t1y;
            return {
                t1: { clientX: t1x, clientY: t1y },
                t2: { clientX: t2x, clientY: t2y },
                distance: Math.sqrt(dx * dx + dy * dy),
                centroid: { clientX: (t1x + t2x) / 2.0, clientY: (t1y + t2y) / 2.0 },
            };
        };
        this.start = { t1: { clientX: NaN, clientY: NaN }, t2: { clientX: NaN, clientY: NaN }, distance: NaN, centroid: { clientX: NaN, clientY: NaN } };
        this.panStart = { x: NaN, y: NaN };
        this.scaleStart = NaN;
        this.recentMetrics = { centroid: { clientX: NaN, clientY: NaN }, distance: NaN };
    }
    return ScaleOrPanState;
}());
exports.ScaleOrPanState = ScaleOrPanState;
var TouchPanState = /** @class */ (function () {
    function TouchPanState(scaleOrPanState) {
        var _this = this;
        this.handleMouseWheel = SUPPRESS_SCROLL.bind(this);
        this.handleDrawStart = function () { return _this; };
        this.handleDrawMove = function (e, canvasDraw) {
            e.preventDefault();
            if (!e.touches || e.touches.length < 2) {
                return new DefaultState();
            }
            var ref = _this.scaleOrPanState;
            var centroid = (ref.recentMetrics = ref.getTouchMetrics(e)).centroid;
            var dx = centroid.clientX - ref.start.centroid.clientX;
            var dy = centroid.clientY - ref.start.centroid.clientY;
            canvasDraw.setView({ x: ref.panStart.x + dx, y: ref.panStart.y + dy });
            return _this;
        };
        this.handleDrawEnd = function () { return new DefaultState(); };
        this.scaleOrPanState = scaleOrPanState;
    }
    return TouchPanState;
}());
exports.TouchPanState = TouchPanState;
var TouchScaleState = /** @class */ (function () {
    function TouchScaleState(scaleOrPanState) {
        var _this = this;
        this.handleMouseWheel = SUPPRESS_SCROLL.bind(this);
        this.handleDrawStart = function () { return _this; };
        this.handleDrawMove = function (e, canvasDraw) {
            e.preventDefault();
            if (!e.touches || e.touches.length < 2) {
                return new DefaultState();
            }
            var ref = _this.scaleOrPanState;
            var _a = ref.recentMetrics = ref.getTouchMetrics(e), centroid = _a.centroid, distance = _a.distance;
            var targetScale = ref.scaleStart * (distance / ref.start.distance);
            var dScale = targetScale - canvasDraw.coordSystem.scale;
            canvasDraw.coordSystem.scaleAtClientPoint(dScale, centroid);
            return _this;
        };
        this.handleDrawEnd = function () { return new DefaultState(); };
        this.scaleOrPanState = scaleOrPanState;
    }
    return TouchScaleState;
}());
exports.TouchScaleState = TouchScaleState;
var DrawingState = /** @class */ (function () {
    function DrawingState() {
        var _this = this;
        this.handleMouseWheel = SUPPRESS_SCROLL.bind(this);
        this.handleDrawStart = function (e, canvasDraw) {
            e.preventDefault();
            if (e instanceof TouchEvent && e.touches.length) {
                var _a = viewPointFromEvent(canvasDraw.coordSystem, e), x = _a.x, y = _a.y;
                if (canvasDraw.lazy) {
                    canvasDraw.lazy.update({ x: x, y: y }, { both: true });
                }
            }
            return _this.handleDrawMove(e, canvasDraw);
        };
        this.handleDrawMove = function (e, canvasDraw) {
            e.preventDefault();
            var _a = viewPointFromEvent(canvasDraw.coordSystem, e), x = _a.x, y = _a.y;
            if (canvasDraw.lazy) {
                canvasDraw.lazy.update({ x: x, y: y });
            }
            var isDisabled = canvasDraw.lazy ? !canvasDraw.lazy.isEnabled() : false;
            if (!_this.isDrawing || isDisabled) {
                if (canvasDraw.lazy) {
                    canvasDraw.points.push(canvasDraw.clampPointToDocument(canvasDraw.lazy.brush.toObject()));
                }
                _this.isDrawing = true;
            }
            if (canvasDraw.lazy) {
                canvasDraw.points.push(canvasDraw.clampPointToDocument(canvasDraw.lazy.brush.toObject()));
            }
            canvasDraw.drawPoints({
                points: canvasDraw.points,
                brushColor: canvasDraw.props.brushColor,
                brushRadius: canvasDraw.props.brushRadius
            });
            return _this;
        };
        this.handleDrawEnd = function (e, canvasDraw) {
            e.preventDefault();
            _this.handleDrawMove(e, canvasDraw);
            canvasDraw.saveLine();
            return new DefaultState();
        };
        this.isDrawing = false;
    }
    return DrawingState;
}());
exports.DrawingState = DrawingState;
var SyntheticEvent = /** @class */ (function () {
    function SyntheticEvent(_a) {
        var clientX = _a.clientX, clientY = _a.clientY;
        this.preventDefault = function () { };
        this.clientX = clientX;
        this.clientY = clientY;
        this.touches = [{ clientX: clientX, clientY: clientY }];
    }
    return SyntheticEvent;
}());
exports.SyntheticEvent = SyntheticEvent;
function clientPointFromEvent(e) {
    var clientX = NaN;
    var clientY = NaN;
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
    return { clientX: clientX, clientY: clientY };
}
exports.clientPointFromEvent = clientPointFromEvent;
function viewPointFromEvent(coordSystem, e) {
    return coordSystem.clientPointToViewPoint(clientPointFromEvent(e));
}
exports.viewPointFromEvent = viewPointFromEvent;
