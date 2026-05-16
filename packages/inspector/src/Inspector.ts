import { ComponentType, type Node, type Scene } from '@joroya/core';
import { FrameMetrics } from './FrameMetrics';
import { collectSceneStats } from './SceneStats';

/**
 * Construction options for `Inspector`.
 */
export interface InspectorOptions {
    /** Element that hosts the overlay. Default `document.body`. */
    container?: HTMLElement;
    /**
     * Refresh interval in milliseconds for the DOM rebuild. The inspector
     * receives frame ticks every render via `update(dt)` but only re-renders
     * the panel at most this often, to keep DOM cost bounded.
     * Default `200ms` (5Hz UI updates against ~60Hz simulation).
     */
    refreshIntervalMs?: number;
    /** Panel position. Default `'top-right'`. */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /** Initial collapsed state. Default `false`. */
    startCollapsed?: boolean;
}

/**
 * Vanilla-DOM debug overlay for an Oroya `Scene`.
 *
 * Renders a fixed-position panel showing FPS, frame-time, scene-graph
 * counts, and a click-to-select hierarchy. Selecting a node shows its
 * transform values (position / rotation / scale) and the list of its
 * components. The panel is plain DOM (no React/Vue dep) so it works
 * regardless of which framework the host app uses.
 *
 * Usage:
 * ```ts
 * const inspector = new Inspector(scene);
 * inspector.attach();
 * // inside render loop:
 * inspector.update(dt);
 * // when done:
 * inspector.detach();
 * ```
 *
 * @public
 */
export class Inspector {
    private readonly scene: Scene;
    private readonly metrics = new FrameMetrics();
    private readonly options: Required<InspectorOptions>;

    private root: HTMLDivElement | null = null;
    private hierarchyEl: HTMLDivElement | null = null;
    private metricsEl: HTMLDivElement | null = null;
    private selectionEl: HTMLDivElement | null = null;
    private collapsed: boolean;
    private selectedNode: Node | null = null;
    private elapsedSinceRefresh = 0;

    constructor(scene: Scene, options: InspectorOptions = {}) {
        this.scene = scene;
        this.options = {
            container: options.container ?? (typeof document !== 'undefined' ? document.body : null!),
            refreshIntervalMs: options.refreshIntervalMs ?? 200,
            position: options.position ?? 'top-right',
            startCollapsed: options.startCollapsed ?? false,
        };
        this.collapsed = this.options.startCollapsed;
    }

    /** Build the DOM and attach it to the container. Safe to call repeatedly. */
    attach(): void {
        if (this.root || !this.options.container) return;

        const root = document.createElement('div');
        root.dataset.oroyaInspector = '';
        Object.assign(root.style, this.panelBaseStyle());
        this.applyPositionStyle(root);

        const header = this.buildHeader();
        const body = document.createElement('div');
        body.style.display = this.collapsed ? 'none' : 'block';

        const metricsEl = document.createElement('div');
        metricsEl.style.fontFamily = 'monospace';
        metricsEl.style.fontSize = '11px';
        metricsEl.style.padding = '6px 8px';
        metricsEl.style.borderBottom = '1px solid #333';

        const hierarchyEl = document.createElement('div');
        hierarchyEl.style.padding = '6px 8px';
        hierarchyEl.style.maxHeight = '240px';
        hierarchyEl.style.overflowY = 'auto';
        hierarchyEl.style.borderBottom = '1px solid #333';

        const selectionEl = document.createElement('div');
        selectionEl.style.padding = '6px 8px';
        selectionEl.style.fontFamily = 'monospace';
        selectionEl.style.fontSize = '11px';
        selectionEl.style.maxHeight = '200px';
        selectionEl.style.overflowY = 'auto';

        body.append(metricsEl, hierarchyEl, selectionEl);
        root.append(header, body);
        this.options.container.appendChild(root);

        this.root = root;
        this.metricsEl = metricsEl;
        this.hierarchyEl = hierarchyEl;
        this.selectionEl = selectionEl;
        this.refresh();
    }

    detach(): void {
        if (!this.root) return;
        this.root.remove();
        this.root = null;
        this.metricsEl = null;
        this.hierarchyEl = null;
        this.selectionEl = null;
        this.selectedNode = null;
    }

    /**
     * Frame tick. Records `dt`, throttles DOM refresh to
     * `refreshIntervalMs`.
     */
    update(dt: number): void {
        this.metrics.record(dt);
        this.elapsedSinceRefresh += dt * 1000;
        if (this.elapsedSinceRefresh >= this.options.refreshIntervalMs) {
            this.elapsedSinceRefresh = 0;
            this.refresh();
        }
    }

    /** Programmatically select a node (highlights it in the hierarchy). */
    select(node: Node | null): void {
        this.selectedNode = node;
        this.refresh();
    }

    /** Public read of the currently selected node, for app-side reactions. */
    getSelected(): Node | null {
        return this.selectedNode;
    }

    // ── Internals ─────────────────────────────────────────────

    private refresh(): void {
        if (!this.root) return;
        this.renderMetrics();
        this.renderHierarchy();
        this.renderSelection();
    }

    private renderMetrics(): void {
        if (!this.metricsEl) return;
        const fps = this.metrics.fps();
        const avg = this.metrics.avgFrameTimeMs();
        const max = this.metrics.maxFrameTimeMs();
        const stats = collectSceneStats(this.scene);
        this.metricsEl.textContent =
            `${fps.toFixed(0)} fps · avg ${avg.toFixed(1)}ms · max ${max.toFixed(1)}ms\n` +
            `${stats.nodeCount} nodes · ${stats.componentCount} components`;
    }

    private renderHierarchy(): void {
        if (!this.hierarchyEl) return;
        this.hierarchyEl.replaceChildren();
        this.appendNodeRow(this.scene.root, 0);
    }

    private appendNodeRow(node: Node, depth: number): void {
        if (!this.hierarchyEl) return;
        const row = document.createElement('div');
        row.textContent = `${'  '.repeat(depth)}${node.name || '(unnamed)'}`;
        row.style.fontFamily = 'monospace';
        row.style.fontSize = '11px';
        row.style.padding = '2px 4px';
        row.style.cursor = 'pointer';
        row.style.whiteSpace = 'pre';
        if (this.selectedNode === node) {
            row.style.background = '#2d4a8a';
            row.style.color = '#fff';
        }
        row.addEventListener('click', () => this.select(node));
        this.hierarchyEl.appendChild(row);
        for (const child of node.children) {
            this.appendNodeRow(child, depth + 1);
        }
    }

    private renderSelection(): void {
        if (!this.selectionEl) return;
        const node = this.selectedNode;
        if (!node) {
            this.selectionEl.textContent = '(no selection — click a node above)';
            return;
        }
        const t = node.transform;
        const components = Array.from(node.components.keys())
            .filter((k) => k !== ComponentType.Transform)
            .join(', ') || '(only Transform)';

        this.selectionEl.textContent =
            `Node: ${node.name}\n` +
            `ID:   ${node.id.slice(0, 8)}…\n` +
            `pos:  (${t.position.x.toFixed(2)}, ${t.position.y.toFixed(2)}, ${t.position.z.toFixed(2)})\n` +
            `rot:  (${t.rotation.x.toFixed(2)}, ${t.rotation.y.toFixed(2)}, ${t.rotation.z.toFixed(2)}, ${t.rotation.w.toFixed(2)})\n` +
            `scl:  (${t.scale.x.toFixed(2)}, ${t.scale.y.toFixed(2)}, ${t.scale.z.toFixed(2)})\n` +
            `components: ${components}`;
    }

    private buildHeader(): HTMLDivElement {
        const header = document.createElement('div');
        header.textContent = '⚙ Oroya Inspector';
        Object.assign(header.style, {
            padding: '6px 10px',
            background: '#1a1a1a',
            color: '#ddd',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            userSelect: 'none',
        });
        header.addEventListener('click', () => this.toggleCollapsed());
        return header;
    }

    private toggleCollapsed(): void {
        if (!this.root) return;
        this.collapsed = !this.collapsed;
        const body = this.root.children[1] as HTMLDivElement | undefined;
        if (body) body.style.display = this.collapsed ? 'none' : 'block';
    }

    private panelBaseStyle(): Partial<CSSStyleDeclaration> {
        return {
            position: 'fixed',
            zIndex: '999999',
            width: '260px',
            background: '#222',
            color: '#ddd',
            border: '1px solid #444',
            borderRadius: '4px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            fontFamily: 'system-ui, sans-serif',
        };
    }

    private applyPositionStyle(el: HTMLElement): void {
        switch (this.options.position) {
            case 'top-left':
                el.style.top = '8px';
                el.style.left = '8px';
                break;
            case 'bottom-right':
                el.style.bottom = '8px';
                el.style.right = '8px';
                break;
            case 'bottom-left':
                el.style.bottom = '8px';
                el.style.left = '8px';
                break;
            case 'top-right':
            default:
                el.style.top = '8px';
                el.style.right = '8px';
                break;
        }
    }
}
