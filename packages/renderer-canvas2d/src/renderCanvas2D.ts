import {
    Scene,
    Node,
    Geometry,
    GeometryPrimitive,
    Material,
    Camera,
    CameraType,
    ComponentType,
    BoxGeometryDef,
    SphereGeometryDef,
    Path2DGeometryDef,
    TextGeometryDef,
    OrthographicCameraDef,
    Matrix4,
    ColorRGB,
    GradientDef,
    LinearGradientDef,
    RadialGradientDef,
} from '@joroya/core';

/**
 * Options for Canvas2D rendering.
 */
export interface Canvas2DRenderOptions {
    width: number;
    height: number;
    /** Background color (default: transparent) */
    backgroundColor?: ColorRGB;
    /** Enable anti-aliasing (default: true) */
    antialias?: boolean;
}

/**
 * Convert ColorRGB to CSS color string.
 */
function toCssColor(color: ColorRGB | undefined, defaultColor: string): string {
    if (!color) return defaultColor;
    return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

/**
 * Extract 2D affine transform from a column-major 4×4 matrix.
 * Returns [a, b, c, d, e, f] for ctx.transform(a, b, c, d, e, f).
 */
function matrix4ToCanvas2DTransform(m: Matrix4): [number, number, number, number, number, number] {
    // Column-major: m[0]=a, m[1]=b, m[4]=c, m[5]=d, m[12]=e, m[13]=f
    return [m[0], m[1], m[4], m[5], m[12], m[13]];
}

/**
 * Find the first node with a Camera component.
 */
function findCameraNode(scene: Scene): Node | null {
    let result: Node | null = null;
    scene.traverse((node) => {
        if (!result && node.hasComponent(ComponentType.Camera)) {
            result = node;
        }
    });
    return result;
}

/**
 * Apply camera transform to canvas context.
 */
function applyCameraTransform(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    camNode: Node,
    width: number,
    height: number
): void {
    if (cam.definition.type === CameraType.Orthographic) {
        const orthoCam = cam.definition as OrthographicCameraDef;
        const viewWidth = orthoCam.right - orthoCam.left;
        const viewHeight = orthoCam.bottom - orthoCam.top;

        // Scale to fit canvas
        const scaleX = width / viewWidth;
        const scaleY = height / viewHeight;

        // Translate to center view
        const tx = -orthoCam.left * scaleX;
        const ty = -orthoCam.top * scaleY;

        // Apply camera position offset
        const camPos = camNode.transform.worldMatrix;
        const camOffsetX = camPos[12] * scaleX;
        const camOffsetY = camPos[13] * scaleY;

        ctx.setTransform(scaleX, 0, 0, scaleY, tx + camOffsetX, ty + camOffsetY);
    } else {
        // Perspective camera: use simple centered coordinate system
        ctx.translate(width / 2, height / 2);
    }
}

/**
 * Create a Canvas2D gradient from Oroya GradientDef.
 */
function createGradient(
    ctx: CanvasRenderingContext2D,
    gradientDef: GradientDef,
    width: number,
    height: number
): CanvasGradient {
    if (gradientDef.type === 'linear') {
        const g = gradientDef as LinearGradientDef;
        const x1 = (g.x1 ?? 0) * width;
        const y1 = (g.y1 ?? 0) * height;
        const x2 = (g.x2 ?? 1) * width;
        const y2 = (g.y2 ?? 0) * height;
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

        for (const stop of g.stops) {
            const color = toCssColor(stop.color, 'black');
            gradient.addColorStop(stop.offset, color);
        }

        return gradient;
    } else {
        const g = gradientDef as RadialGradientDef;
        const cx = (g.cx ?? 0.5) * width;
        const cy = (g.cy ?? 0.5) * height;
        const r = (g.r ?? 0.5) * Math.max(width, height);
        const fx = (g.fx ?? g.cx ?? 0.5) * width;
        const fy = (g.fy ?? g.cy ?? 0.5) * height;
        const gradient = ctx.createRadialGradient(fx, fy, 0, cx, cy, r);

        for (const stop of g.stops) {
            const color = toCssColor(stop.color, 'black');
            gradient.addColorStop(stop.offset, color);
        }

        return gradient;
    }
}

/**
 * Apply material fill and stroke to canvas context.
 */
function applyMaterial(
    ctx: CanvasRenderingContext2D,
    mat: Material | undefined,
    width: number,
    height: number
): void {
    if (!mat) {
        ctx.fillStyle = 'none';
        ctx.strokeStyle = 'none';
        return;
    }

    const def = mat.definition;

    // Fill
    if (def.fillGradient) {
        ctx.fillStyle = createGradient(ctx, def.fillGradient, width, height);
    } else if (def.fill) {
        ctx.fillStyle = toCssColor(def.fill, 'black');
    } else {
        ctx.fillStyle = 'none';
    }

    // Stroke
    if (def.strokeGradient) {
        ctx.strokeStyle = createGradient(ctx, def.strokeGradient, width, height);
        ctx.lineWidth = def.strokeWidth ?? 1;
    } else if (def.stroke) {
        ctx.strokeStyle = toCssColor(def.stroke, 'black');
        ctx.lineWidth = def.strokeWidth ?? 1;
    }

    // Opacity
    if (def.opacity !== undefined) {
        ctx.globalAlpha = def.opacity;
    }
}

/**
 * Render a single geometry to the canvas.
 */
function renderGeometry(
    ctx: CanvasRenderingContext2D,
    geo: Geometry,
    mat: Material | undefined,
    width: number,
    height: number
): void {
    applyMaterial(ctx, mat, width, height);

    switch (geo.definition.type) {
        case GeometryPrimitive.Box: {
            const boxDef = geo.definition as BoxGeometryDef;
            const x = -boxDef.width / 2;
            const y = -boxDef.height / 2;

            if (mat?.definition.fill) {
                ctx.fillRect(x, y, boxDef.width, boxDef.height);
            }
            if (mat?.definition.stroke) {
                ctx.strokeRect(x, y, boxDef.width, boxDef.height);
            }
            break;
        }

        case GeometryPrimitive.Sphere: {
            const sphereDef = geo.definition as SphereGeometryDef;
            ctx.beginPath();
            ctx.arc(0, 0, sphereDef.radius, 0, Math.PI * 2);

            if (mat?.definition.fill) {
                ctx.fill();
            }
            if (mat?.definition.stroke) {
                ctx.stroke();
            }
            break;
        }

        case GeometryPrimitive.Path2D: {
            const pathDef = geo.definition as Path2DGeometryDef;
            ctx.beginPath();

            for (const cmd of pathDef.path) {
                const args = cmd.args;
                switch (cmd.command) {
                    case 'M':
                        ctx.moveTo(args[0], args[1]);
                        break;
                    case 'L':
                        ctx.lineTo(args[0], args[1]);
                        break;
                    case 'C':
                        ctx.bezierCurveTo(args[0], args[1], args[2], args[3], args[4], args[5]);
                        break;
                    case 'Q':
                        ctx.quadraticCurveTo(args[0], args[1], args[2], args[3]);
                        break;
                    case 'Z':
                        ctx.closePath();
                        break;
                }
            }

            if (mat?.definition.fill) {
                ctx.fill();
            }
            if (mat?.definition.stroke) {
                ctx.stroke();
            }
            break;
        }

        case GeometryPrimitive.Text: {
            const textDef = geo.definition as TextGeometryDef;
            const fontSize = textDef.fontSize ?? 16;
            const fontFamily = textDef.fontFamily ?? 'sans-serif';
            const fontWeight = textDef.fontWeight ?? 'normal';

            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
            ctx.textAlign = (textDef.textAnchor ?? 'start') as CanvasTextAlign;
            ctx.textBaseline = (textDef.dominantBaseline ?? 'alphabetic') as CanvasTextBaseline;

            if (mat?.definition.fill) {
                ctx.fillText(textDef.text, 0, 0);
            }
            if (mat?.definition.stroke) {
                ctx.strokeText(textDef.text, 0, 0);
            }
            break;
        }
    }
}

/**
 * Recursively render a node and its children.
 */
function renderNode(
    ctx: CanvasRenderingContext2D,
    node: Node,
    width: number,
    height: number
): void {
    ctx.save();

    // Apply local transform
    const transform = matrix4ToCanvas2DTransform(node.transform.localMatrix);
    ctx.transform(...transform);

    // Render geometry if present
    const geo = node.getComponent<Geometry>(ComponentType.Geometry);
    const mat = node.getComponent<Material>(ComponentType.Material);
    if (geo) {
        renderGeometry(ctx, geo, mat, width, height);
    }

    // Render children
    for (const child of node.children) {
        renderNode(ctx, child, width, height);
    }

    ctx.restore();
}

/**
 * Render a scene to a canvas element (one-shot render).
 */
export function renderToCanvas(
    scene: Scene,
    canvas: HTMLCanvasElement,
    options: Canvas2DRenderOptions
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get 2D context from canvas');
    }

    // Set canvas size
    canvas.width = options.width;
    canvas.height = options.height;

    // Configure rendering
    if (options.antialias !== false) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }

    // Clear canvas
    if (options.backgroundColor) {
        ctx.fillStyle = toCssColor(options.backgroundColor, 'white');
        ctx.fillRect(0, 0, options.width, options.height);
    } else {
        ctx.clearRect(0, 0, options.width, options.height);
    }

    // Update world matrices
    scene.updateWorldMatrices();

    // Apply camera transform
    const camNode = findCameraNode(scene);
    if (camNode) {
        const cam = camNode.getComponent<Camera>(ComponentType.Camera);
        if (cam) {
            applyCameraTransform(ctx, cam, camNode, options.width, options.height);
        }
    }

    // Render scene graph
    for (const child of scene.root.children) {
        renderNode(ctx, child, options.width, options.height);
    }
}

/**
 * Persistent Canvas2D renderer with animation loop support.
 */
export class CanvasRenderer {
    private canvas: HTMLCanvasElement | null = null;
    private animationFrameId: number | null = null;
    private renderCallback: (() => void) | null = null;

    /**
     * Mount the renderer to a container element.
     */
    mount(container: HTMLElement, options: Canvas2DRenderOptions): HTMLCanvasElement {
        this.canvas = document.createElement('canvas');
        this.canvas.width = options.width;
        this.canvas.height = options.height;
        this.canvas.style.display = 'block';
        container.appendChild(this.canvas);
        return this.canvas;
    }

    /**
     * Unmount the renderer and clean up.
     */
    unmount(): void {
        this.stopLoop();
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        this.canvas = null;
    }

    /**
     * Render a scene once.
     */
    render(scene: Scene, options: Canvas2DRenderOptions): void {
        if (!this.canvas) {
            throw new Error('Renderer not mounted. Call mount() first.');
        }
        renderToCanvas(scene, this.canvas, options);
    }

    /**
     * Start an animation loop.
     */
    startLoop(callback: () => void): void {
        this.renderCallback = callback;
        const loop = () => {
            if (this.renderCallback) {
                this.renderCallback();
                this.animationFrameId = requestAnimationFrame(loop);
            }
        };
        loop();
    }

    /**
     * Stop the animation loop.
     */
    stopLoop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.renderCallback = null;
    }

    /**
     * Get the canvas element.
     */
    getCanvas(): HTMLCanvasElement | null {
        return this.canvas;
    }
}
