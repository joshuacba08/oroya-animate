/**
 * Rolling-window FPS / frame-time tracker.
 *
 * Samples are stored in a fixed-size ring buffer so memory cost is bounded
 * regardless of how long the inspector stays attached. The default window of
 * 60 samples covers ~1s at 60Hz — long enough to smooth out micro-jitter,
 * short enough to react when a real perf cliff hits.
 *
 * @public
 */
export class FrameMetrics {
    private readonly samples: number[];
    private writeIndex = 0;
    private filled = 0;

    constructor(private readonly windowSize: number = 60) {
        this.samples = new Array(windowSize).fill(0);
    }

    /** Record a frame's dt (seconds). */
    record(dt: number): void {
        this.samples[this.writeIndex] = dt;
        this.writeIndex = (this.writeIndex + 1) % this.windowSize;
        if (this.filled < this.windowSize) this.filled++;
    }

    /** Average frame time in milliseconds over the window. */
    avgFrameTimeMs(): number {
        if (this.filled === 0) return 0;
        let sum = 0;
        for (let i = 0; i < this.filled; i++) sum += this.samples[i];
        return (sum / this.filled) * 1000;
    }

    /** Average frames per second over the window. */
    fps(): number {
        const avg = this.avgFrameTimeMs();
        return avg > 0 ? 1000 / avg : 0;
    }

    /** Worst frame time observed in the window (ms). */
    maxFrameTimeMs(): number {
        let max = 0;
        for (let i = 0; i < this.filled; i++) {
            if (this.samples[i] > max) max = this.samples[i];
        }
        return max * 1000;
    }
}
