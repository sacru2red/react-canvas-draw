"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Original from: https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas
 * Original By Ken Fyrstenberg Nilsen
 *
 * Note: img must be fully loaded or have correct width & height set.
 */
function drawImageProp(_a) {
    var ctx = _a.ctx, img = _a.img, x = _a.x, y = _a.y, w = _a.w, h = _a.h, offsetX = _a.offsetX, offsetY = _a.offsetY;
    // Defaults
    if (typeof x !== "number")
        x = 0;
    if (typeof y !== "number")
        y = 0;
    if (typeof w !== "number") {
        w = ctx && ctx.canvas.width ? ctx.canvas.width : NaN;
    }
    if (typeof h !== "number") {
        h = ctx && ctx.canvas.height ? ctx.canvas.height : NaN;
    }
    if (typeof offsetX !== "number")
        offsetX = 0.5;
    if (typeof offsetY !== "number")
        offsetY = 0.5;
    // keep bounds [0.0, 1.0]
    if (offsetX < 0)
        offsetX = 0;
    if (offsetY < 0)
        offsetY = 0;
    if (offsetX > 1)
        offsetX = 1;
    if (offsetY > 1)
        offsetY = 1;
    var iw = img ? img.width : NaN, ih = img ? img.height : NaN, r = Math.min((w || NaN) / iw, (h || NaN) / ih), nw = iw * r, // new prop. width
    nh = ih * r, // new prop. height
    cx, cy, cw, ch, ar = 1;
    // decide which gap to fill
    if (nw < w)
        ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h)
        ar = h / nh; // updated
    nw *= ar;
    nh *= ar;
    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);
    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;
    // make sure source rectangle is valid
    if (cx < 0)
        cx = 0;
    if (cy < 0)
        cy = 0;
    if (cw > iw)
        cw = iw;
    if (ch > ih)
        ch = ih;
    // fill image in dest. rectangle
    if (ctx) {
        // @ts-ignore
        ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
    }
}
exports.default = drawImageProp;
