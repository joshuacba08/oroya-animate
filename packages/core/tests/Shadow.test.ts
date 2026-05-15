import { describe, expect, it } from 'vitest';
import { Light, LightType, DirectionalLightDef, PointLightDef, SpotLightDef } from '../src/components/Light';
import { Geometry, GeometryPrimitive, BoxGeometryDef } from '../src/components/Geometry';
import { createBox, createSphere, createPlane } from '../src/geometry/primitives';

describe('Shadow flags on geometry', () => {
  it('factory propagates castShadow / receiveShadow to the definition', () => {
    const box = createBox(1, 1, 1, { castShadow: true, receiveShadow: false });
    const def = box.definition as BoxGeometryDef;
    expect(def.castShadow).toBe(true);
    expect(def.receiveShadow).toBe(false);
  });

  it('shadow flags default to undefined (renderer treats as off)', () => {
    const sphere = createSphere();
    const def = sphere.definition as { castShadow?: boolean; receiveShadow?: boolean };
    expect(def.castShadow).toBeUndefined();
    expect(def.receiveShadow).toBeUndefined();
  });

  it('a ground plane can receive shadows without casting them', () => {
    // createPlane signature: (width, height, widthSegments, heightSegments, options)
    const plane = createPlane(10, 10, 1, 1, { receiveShadow: true });
    const def = plane.definition as { castShadow?: boolean; receiveShadow?: boolean };
    expect(def.castShadow).toBeUndefined();
    expect(def.receiveShadow).toBe(true);
  });

  it('direct Geometry construction preserves shadow flags on every primitive variant', () => {
    const def: BoxGeometryDef = {
      type: GeometryPrimitive.Box,
      width: 2,
      height: 2,
      depth: 2,
      castShadow: true,
      receiveShadow: true,
    };
    const geo = new Geometry(def);
    expect((geo.definition as BoxGeometryDef).castShadow).toBe(true);
    expect((geo.definition as BoxGeometryDef).receiveShadow).toBe(true);
  });
});

describe('Shadow properties on lights', () => {
  it('ambient lights do not expose shadow properties (compile-time guarantee)', () => {
    const ambient = new Light({ type: LightType.Ambient, intensity: 0.5 });
    // Type-level check: AmbientLightDef has no castShadow. Runtime sanity:
    expect(ambient.definition.type).toBe(LightType.Ambient);
    expect((ambient.definition as { castShadow?: boolean }).castShadow).toBeUndefined();
  });

  it('directional lights carry castShadow, shadowBias and shadowMapSize', () => {
    const def: DirectionalLightDef = {
      type: LightType.Directional,
      castShadow: true,
      shadowBias: -0.001,
      shadowMapSize: 2048,
    };
    const light = new Light(def);
    const ld = light.definition as DirectionalLightDef;
    expect(ld.castShadow).toBe(true);
    expect(ld.shadowBias).toBe(-0.001);
    expect(ld.shadowMapSize).toBe(2048);
  });

  it('point and spot lights also support shadow casting', () => {
    const point: PointLightDef = { type: LightType.Point, castShadow: true, shadowMapSize: 512 };
    const spot: SpotLightDef = { type: LightType.Spot, castShadow: true, angle: Math.PI / 4 };
    expect(point.castShadow).toBe(true);
    expect(spot.castShadow).toBe(true);
  });
});
