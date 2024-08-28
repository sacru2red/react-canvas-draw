/**
 * Original from: https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas
 * Original By Ken Fyrstenberg Nilsen
 *
 * Note: img must be fully loaded or have correct width & height set.
 */
export default function drawImageProp({ ctx, img, x, y, w, h, offsetX, offsetY }: {
    ctx?: CanvasRenderingContext2D;
    img?: HTMLImageElement | null;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    offsetX?: number;
    offsetY?: number;
}): void;
