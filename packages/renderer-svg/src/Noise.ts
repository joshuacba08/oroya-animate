/**
 * An implementation of Ken Perlin's noise algorithm in 2D.
 *
 * With thanks to Joe Iddon. https://github.com/joeiddon/perlin
 */
export class Noise {
    private grad: Record<string, { x: number; y: number }>;
    private cache: Record<string, number>;

    constructor() {
        this.grad = {};
        this.cache = {};
    }

    /**
     * Get the noise value at the specified co-ordinates.
     *
     * @param x - The noise x co-ordinate.
     * @param y - The noise y co-ordinate.
     * @returns the noise value (float between -1 and 1).
     */
    get(x: number, y: number = 0): number {
        const key = `${x},${y}`;
        if (this.cache.hasOwnProperty(key)) return this.cache[key];

        const xf = Math.floor(x);
        const yf = Math.floor(y);

        const tl = this.gridDotProduct(x, y, xf, yf);
        const tr = this.gridDotProduct(x, y, xf + 1, yf);
        const bl = this.gridDotProduct(x, y, xf, yf + 1);
        const br = this.gridDotProduct(x, y, xf + 1, yf + 1);

        const xt = this.fade(x - xf, tl, tr);
        const xb = this.fade(x - xf, bl, br);
        const v = this.fade(y - yf, xt, xb);

        this.cache[key] = v;

        return v;
    }

    private gridDotProduct(x: number, y: number, vx: number, vy: number): number {
        let gVec: { x: number; y: number };
        const dVec = { x: x - vx, y: y - vy };
        const key = `${vx},${vy}`;

        if (this.grad[key]) {
            gVec = this.grad[key];
        } else {
            const th = Math.random() * 2 * Math.PI;
            gVec = { x: Math.cos(th), y: Math.sin(th) };
            this.grad[key] = gVec;
        }

        return dVec.x * gVec.x + dVec.y * gVec.y;
    }

    private fade(x: number, a: number, b: number): number {
        const s = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
        return a + s * (b - a);
    }
}
