import { ComponentType } from '../components/Component';
import type { Scene } from '../scene/Scene';

/** A recoverable capability or persistence issue. @public */
export interface Diagnostic {
  code: string;
  message: string;
  nodeId?: string;
  path?: string;
  severity: 'warning' | 'error';
}

/** Compatible frame options shared by rendering entry points. @public */
export interface RenderOptions {
  /** Default true. Set false after advancing a scene once for multiple backends. */
  advanceScene?: boolean;
  onDiagnostic?: (diagnostic: Diagnostic) => void;
}

/** Capabilities describe supported translation, rather than pixel equivalence. @public */
export interface RendererCapabilities {
  readonly backend: 'three' | 'svg' | 'canvas2d';
  readonly geometry: readonly string[];
  readonly components: readonly ComponentType[];
  readonly interaction: boolean;
  readonly requiresDOM: boolean;
}

/** Inspect incompatibilities before rendering or exporting a scene. @public */
export function diagnoseScene(scene: Scene, capabilities: RendererCapabilities): Diagnostic[] {
  const result: Diagnostic[] = [];
  scene.traverse((node) => {
    for (const component of node.components.values()) {
      if (!capabilities.components.includes(component.type)) {
        result.push({ code: 'UNSUPPORTED_COMPONENT', nodeId: node.id, severity: 'warning',
          message: capabilities.backend + ' does not translate ' + component.type + '.' });
      }
      if (component.type === ComponentType.Geometry && 'definition' in component) {
        const definition = component.definition as { type: string };
        if (!capabilities.geometry.includes(definition.type)) result.push({
          code: 'UNSUPPORTED_GEOMETRY', nodeId: node.id, severity: 'warning',
          message: capabilities.backend + ' does not translate geometry ' + definition.type + '.',
        });
      }
    }
  });
  return result;
}
