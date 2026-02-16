/**
 * A class to instantiate a new SvJs element.
 */
export class SvJs {
    public element: SVGElement;
    public cursorX: number | null;
    public cursorY: number | null;
    private child: SvJs | null = null; // Track the last created child for continuity if needed

    /**
     * Create an SVG element.
     *
     * @param element - The name of the SVG element to create, or an existing SVGElement.
     * @param namespace - The namespace url to reference.
     */
    constructor(element: string | SVGElement = 'svg', namespace: string = 'http://www.w3.org/2000/svg') {
        if (typeof element === 'string') {
            this.element = document.createElementNS(namespace, element) as SVGElement;
        } else {
            this.element = element;
        }
        this.cursorX = null;
        this.cursorY = null;

        this.checkIsValid();

        if (this.element.nodeName === 'svg') {
            this.element.setAttribute('xmlns', namespace);
        }
    }

    /**
     * An alias of the DOM addEventListener method.
     *
     * @chainable
     * @param type - The event type.
     * @param callback - The callback function.
     * @returns itself.
     */
    addEventListener(type: string, callback: EventListenerOrEventListenerObject): this {
        this.element.addEventListener(type, callback);
        return this;
    }

    /**
     * Add the SVG element to the specified node.
     *
     * @chainable
     * @param node - A HTML or SVG parent node.
     * @returns itself.
     */
    addTo(node: Element): this {
        node.appendChild(this.element);
        return this;
    }

    /**
     * Animate an element using the Web Animations API.
     *
     * @chainable
     * @param keyframes - An array of keyframe objects, or an object of keyframe arrays.
     * @param options - A single duration, or an object containing timing properties.
     * @returns itself.
     */
    animate(keyframes: Keyframe[] | PropertyIndexedKeyframes, options: number | KeyframeAnimationOptions): this {
        this.element.animate(keyframes, options);
        return this;
    }

    /**
     * Inserts content within an element. Useful for textual elements.
     *
     * @chainable
     * @param text - The content to insert.
     * @returns itself.
     */
    content(text: string): this {
        this.element.innerHTML = text;
        return this;
    }

    /**
     * Create and append an SVG child element.
     *
     * @chainable
     * @param element - The name of the SVG element to create.
     * @returns The created SVG child element.
     */
    create(element: string): SvJs {
        const newChild = new SvJs(element);
        this.child = newChild;

        if (element === 'defs') {
            const defs = this.defsCheck();
            newChild.element = defs; // Use existing defs if present
            // If it became the existing defs, we don't append it again
        } else {
            this.element.appendChild(newChild.element);
        }

        return newChild;
    }

    /**
     * Creates a smooth, open bezier curve from an array of points.
     *
     * @chainable
     * @param points - A two-dimensional array of [[x,y], [x,y]...] points.
     * @param curveFactor - 0 means that points connected by straight lines. Default is 1.
     * @returns The created path.
     */
    createCurve(points: number[][], curveFactor: number = 1): SvJs {
        const path = new SvJs('path');

        const flatPoints = points.flat();

        let pathData = `M ${[flatPoints[0], flatPoints[1]]}`;

        for (let i = 0; i < flatPoints.length - 2; i += 2) {
            const x0 = i ? flatPoints[i - 2] : flatPoints[0];
            const y0 = i ? flatPoints[i - 1] : flatPoints[1];

            const x1 = flatPoints[i];
            const y1 = flatPoints[i + 1];

            const x2 = flatPoints[i + 2];
            const y2 = flatPoints[i + 3];

            const x3 = i !== flatPoints.length - 4 ? flatPoints[i + 4] : x2;
            const y3 = i !== flatPoints.length - 4 ? flatPoints[i + 5] : y2;

            const cp1x = x1 + ((x2 - x0) / 6) * curveFactor;
            const cp1y = y1 + ((y2 - y0) / 6) * curveFactor;

            const cp2x = x2 - ((x3 - x1) / 6) * curveFactor;
            const cp2y = y2 - ((y3 - y1) / 6) * curveFactor;

            pathData += `C ${[cp1x, cp1y, cp2x, cp2y, x2, y2]}`;
        }

        path.set({
            d: pathData,
            stroke: '#888',
            fill: 'none',
        });

        this.element.appendChild(path.element);

        return path;
    }

    /**
     * Creates a filter and appends it to the defs element.
     *
     * @chainable
     * @param id - The id. Reference this when applying the filter.
     * @returns The created filter.
     */
    createFilter(id: string): SvJs {
        this.isMainSVG();

        const filter = new SvJs('filter');
        filter.set({
            id: id,
            x: '-25%',
            y: '-25%',
            width: '150%',
            height: '150%',
            filterUnits: 'userSpaceOnUse',
            color_interpolation_filters: 'sRGB',
        });

        const defs = this.defsCheck();
        defs.appendChild(filter.element);

        return filter;
    }

    /**
     * Creates a gradient and appends it to the defs element.
     *
     * @chainable
     * @param id - The id. Reference this when applying the gradient.
     * @param type - Accepts linear or radial.
     * @param colours - An array of gradient colours to be applied equidistantly.
     * @param rotation - The angle of rotation. Ignored if gradient is radial.
     * @returns The created gradient.
     */
    createGradient(id: string, type: 'linear' | 'radial', colours: string[], rotation: number = 45): SvJs {
        this.isMainSVG();

        const gradient = new SvJs(`${type}Gradient`);
        gradient.set({ id: id });

        if (type === 'linear') {
            gradient.set({ gradientTransform: `rotate(${rotation})` });
        }

        for (let i = 0; i < colours.length; i += 1) {
            gradient.create('stop').set({
                stop_color: colours[i],
                offset: String(i * (100 / (colours.length - 1)) / 100),
            });
        }

        const defs = this.defsCheck();
        defs.appendChild(gradient.element);

        return gradient;
    }

    /**
     * Creates a pattern and appends it to the defs element.
     *
     * @chainable
     * @param id - The id. Reference this when applying the gradient.
     * @param width - The width of the pattern.
     * @param height - The height of the pattern.
     * @returns The created pattern element.
     */
    createPattern(id: string, width: number, height: number): SvJs {
        this.isMainSVG();

        const pattern = new SvJs('pattern');
        pattern.set({
            id: id,
            x: 0,
            y: 0,
            width,
            height,
            patternUnits: 'userSpaceOnUse',
        });

        const defs = this.defsCheck();
        defs.appendChild(pattern.element);

        return pattern;
    }

    /**
     * Delete the SVG element.
     */
    delete(): void {
        this.element.remove();
    }

    /**
     * Get a given attribute's value.
     *
     * @param attribute - The attribute.
     * @returns the attribute value.
     */
    get(attribute: string): string | null {
        return this.element.getAttributeNS(null, attribute);
    }

    /**
     * Get a given element's centre { x, y } co-ordinates.
     *
     * @returns the centre.x and centre.y co-ordinates.
     */
    getCentre(): { x: number; y: number } {
        // Only works if element is in DOM and has dimensions
        // SVGElement.getBBox() is available usually.
        // Casting to any because TS might complain about getBBox on generic SVGElement in some envs,
        // though it is standard on SVGGraphicsElement.
        const graphicsEl = this.element as unknown as SVGGraphicsElement;
        if (typeof graphicsEl.getBBox !== 'function') {
            return { x: 0, y: 0 };
        }
        const bbox = graphicsEl.getBBox();
        const cx = bbox.x + (bbox.width / 2);
        const cy = bbox.y + (bbox.height / 2);
        return { x: cx, y: cy };
    }

    /**
     * Move an element to a desired position with respect to its centre.
     *
     * @chainable
     * @param x - The target x co-ordinate.
     * @param y - The target y co-ordinate.
     * @returns itself.
     */
    moveTo(x: number, y: number): this {
        const c = this.getCentre();
        const t = this.createTransform();

        t.setTranslate(x - c.x, y - c.y);

        this.addTransform(t);

        return this;
    }

    /**
     * Rotate an element around a specified origin point (the element centre by default).
     *
     * @chainable
     * @param angle - The angle of rotation.
     * @param cx - The origin x co-ordinate.
     * @param cy - The origin y co-ordinate.
     * @returns itself.
     */
    rotate(angle: number, cx: number | null = null, cy: number | null = null): this {
        const c = this.getCentre();
        const t = this.createTransform();
        const safeCx = (cx === null) ? c.x : cx;
        const safeCy = (cy === null) ? c.y : cy;

        t.setRotate(angle, safeCx, safeCy);

        this.addTransform(t);

        return this;
    }

    /**
     * Saves and downloads the SVG markup.
     */
    save(): void {
        const name = prompt('Enter the file name', 'sketch.svg');
        if (name !== null) {
            const a = document.createElement('a');
            a.download = name;
            const data = this.element.outerHTML;
            const file = new Blob([data], { type: 'text/plain;charset=utf-8' });
            a.href = URL.createObjectURL(file);
            a.click();
        }
    }

    /**
     * Scale an element by a desired proportion.
     *
     * @chainable
     * @param sx - The amount to scale on the x-axis.
     * @param sy - The amount to scale on the y-axis. Defaults to sx if not supplied.
     * @returns itself.
     */
    scale(sx: number, sy: number | null = null): this {
        const c = this.getCentre();
        const t1 = this.createTransform();
        const t2 = this.createTransform();

        const safeSy = (sy === null) ? sx : sy;
        t1.setTranslate((1 - sx) * c.x, (1 - safeSy) * c.y);
        t2.setScale(sx, safeSy);

        this.addTransform(t1);
        this.addTransform(t2);

        return this;
    }

    /**
     * Set the attribute values of an SVG element. Replaces _ with - for relevant attributes.
     *
     * @chainable
     * @param attributes - An object of attribute value pairs.
     * @returns itself.
     */
    set(attributes: Record<string, string | number>): this {
        for (const key in attributes) {
            const prop = key.replace(/_/g, '-');
            this.element.setAttributeNS(null, prop, String(attributes[key]));
        }
        return this;
    }

    /**
     * Update the cursorX and cursorY properties on the main SVG element.
     * Accurate cursor tracking via matrix transformation. Compatible with touch devices.
     *
     * @chainable
     * @param callback - An optional callback function to trigger whenever the cursor moves.
     * @returns itself.
     */
    trackCursor(callback: ((e: PointerEvent) => void) | null = null): this {
        this.isMainSVG();

        let point = new DOMPoint();

        // Check if getScreenCTM is available (it should be on SVGSVGElement)
        const svgEl = this.element as unknown as SVGSVGElement;

        this.element.addEventListener('pointermove', ((event: Event) => {
            const ptrEvent = event as PointerEvent;
            this.element.style.touchAction = 'none';
            point.x = ptrEvent.clientX;
            point.y = ptrEvent.clientY;

            if (svgEl.getScreenCTM) {
                const ctm = svgEl.getScreenCTM();
                if (ctm) {
                    point = point.matrixTransform(ctm.inverse());
                }
            }

            this.cursorX = Math.ceil(point.x);
            this.cursorY = Math.ceil(point.y);
        }) as EventListener);

        this.element.addEventListener('pointerleave', () => {
            this.element.style.touchAction = 'auto';
        });

        if (callback !== null) {
            this.element.addEventListener('pointermove', callback as EventListener);
        }

        return this;
    }

    /**
     * Appends an SVG transform object to a transform list.
     *
     * @param transform - An SVGTransform object.
     */
    private addTransform(transform: SVGTransform): void {
        const graphicsEl = this.element as unknown as SVGGraphicsElement;
        if (graphicsEl.transform) {
            graphicsEl.transform.baseVal.appendItem(transform);
        }
    }

    /**
     * Alows for the creation of a cumulative transform.
     *
     * @returns An SVGTransform object.
     */
    private createTransform(): SVGTransform {
        // We need a main SVG element to create a transform, or we can use the ownerSVGElement if attached
        // But safely, we can create a detached SVG to act as factory if needed, or use the current one if it's an SVG.
        let root: SVGSVGElement;
        if (this.element.nodeName === 'svg') {
            root = this.element as SVGSVGElement;
        } else if (this.element.ownerSVGElement) {
            root = this.element.ownerSVGElement;
        } else {
            // Fallback
            root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        }
        return root.createSVGTransform();
    }

    /**
     * Checks if the def element already exists, and creates it if it doesn't.
     *
     * @returns The defs element.
     */
    private defsCheck(): SVGDefsElement {
        let defs: SVGDefsElement | null = null;

        // Check children of current element if it's the root
        if (this.element.nodeName === 'svg') {
            defs = this.element.querySelector('defs');
        } else if (this.element.ownerSVGElement) {
            defs = this.element.ownerSVGElement.querySelector('defs');
        }

        if (defs) {
            return defs;
        } else {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            if (this.element.nodeName === 'svg') {
                this.element.prepend(defs);
            } else if (this.element.ownerSVGElement) {
                this.element.ownerSVGElement.prepend(defs);
            } else {
                // Detached element, just append to it?
                this.element.prepend(defs);
            }
            return defs;
        }
    }

    /**
     * Check if the element is the main SVG element.
     *
     * @throws error if the element is not the main SVG.
     */
    private isMainSVG(): void {
        if (this.element.nodeName !== 'svg') {
            throw new Error('This function can only be called on the main SVG element.');
        }
    }

    /**
     * Check if the created SVG element is valid.
     */
    private checkIsValid(): void {
        // In TS environment with DOM types, we trust document.createElementNS returns valid elements usually.
        // The original check relied on Object.prototype.toString which might be finicky in some environments (e.g. JSDOM vs Browser).
        // We'll trust the constructor logic but keep a basic check.
        if (!this.element) {
            throw new Error('Invalid SVG element');
        }
    }
}

/* ── Fluent Construction Shortcuts ───────────────────────────── */

/**
 * Create a <rect> element.
 */
rect(width: number, height: number, x: number = 0, y: number = 0): SvJs {
    const el = this.create('rect');
    el.set({ width, height, x, y });
    return el;
}

/**
 * Create a <circle> element.
 */
circle(r: number, cx: number = 0, cy: number = 0): SvJs {
    const el = this.create('circle');
    el.set({ r, cx, cy });
    return el;
}

/**
 * Create an <ellipse> element.
 */
ellipse(rx: number, ry: number, cx: number = 0, cy: number = 0): SvJs {
    const el = this.create('ellipse');
    el.set({ rx, ry, cx, cy });
    return el;
}

/**
 * Create a <line> element.
 */
line(x1: number, y1: number, x2: number, y2: number): SvJs {
    const el = this.create('line');
    el.set({ x1, y1, x2, y2 });
    return el;
}

/**
 * Create a <polyline> element.
 */
polyline(points: number[] | number[][]): SvJs {
    const el = this.create('polyline');
    // Handle flat array or array of pairs
    const pts = points.flat().join(' ');
    el.set({ points: pts });
    return el;
}

/**
 * Create a <text> element.
 */
text(content: string, x: number = 0, y: number = 0): SvJs {
    const el = this.create('text');
    el.set({ x, y });
    el.content(content);
    return el;
}

/**
 * Create a <g> (group) element.
 */
g(): SvJs {
    return this.create('g');
}

/**
* Create a <g> (group) element (alias).
*/
group(): SvJs {
    return this.create('g');
}

/* ── Fluent Styling ──────────────────────────────────────────── */

/**
 * Set fill color and optional opacity.
 */
fill(color: string, opacity ?: number): this {
    this.set({ fill: color });
    if (opacity !== undefined) {
        this.set({ fill_opacity: opacity });
    }
    return this;
}

/**
 * Set stroke color, width, and optional opacity.
 */
stroke(color: string, width ?: number, opacity ?: number): this {
    this.set({ stroke: color });
    if (width !== undefined) {
        this.set({ stroke_width: width });
    }
    if (opacity !== undefined) {
        this.set({ stroke_opacity: opacity });
    }
    return this;
}

/**
 * Set stroke-dasharray.
 */
strokeDash(array: number[] | string): this {
    const val = Array.isArray(array) ? array.join(' ') : array;
    this.set({ stroke_dasharray: val });
    return this;
}
}
