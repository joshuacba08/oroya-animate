import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
    Camera,
    CameraType,
    Light,
    LightType,
    Material,
    Node as OroyaNode,
    createBox,
    createSphere,
    createPlane,
    type Vec3,
    type Quat,
    type ColorRGB,
} from '@joroya/core';
import { OroyaContext, useOroya } from './context';

interface NodeBaseProps {
    name?: string;
    position?: Partial<Vec3>;
    rotation?: Partial<Quat>;
    scale?: Partial<Vec3>;
    children?: ReactNode;
}

/**
 * Internal helper: create an Oroya node, attach it under the JSX parent,
 * apply transform props each render, and provide a fresh context so JSX
 * children can attach under *this* node.
 *
 * The Oroya node identity is stable for the lifetime of the React component
 * — re-mounting React components recreates the underlying scene node.
 */
function NodeHost(props: NodeBaseProps & {
    setup?: (node: OroyaNode) => void;
}) {
    const { scene, parentNode, registerFrameCallback } = useOroya();
    // Setup runs once on mount. The `setup` callback identity is intentionally
    // NOT in the dependency array — re-running it on every prop change would
    // recreate the Oroya node and discard its JSX children. Transform props
    // are applied below on every render instead.
    const node = useMemo(
        () => {
            const n = new OroyaNode(props.name ?? 'react-node');
            props.setup?.(n);
            return n;
        },
        [],
    );

    useEffect(() => {
        parentNode.add(node);
        return () => {
            parentNode.remove(node);
        };
    }, [node, parentNode]);

    // Apply transform props on every render so JSX-driven motion works.
    if (props.position) Object.assign(node.transform.position, props.position);
    if (props.rotation) Object.assign(node.transform.rotation, props.rotation);
    if (props.scale) Object.assign(node.transform.scale, props.scale);
    node.transform.updateLocalMatrix();

    const childContext = useMemo(() => ({
        scene,
        parentNode: node,
        registerFrameCallback,
    }), [scene, node, registerFrameCallback]);

    return (
        <OroyaContext.Provider value={childContext}>
            {props.children}
        </OroyaContext.Provider>
    );
}

interface GroupProps extends NodeBaseProps {
    /** Optional ref to the underlying Oroya node, useful with `useFrame`. */
    nodeRef?: { current: OroyaNode | null };
}

/** A transform-only container — analogous to `<group>` in r3f. */
export function Group(props: GroupProps) {
    return (
        <NodeHost
            {...props}
            setup={(n) => { if (props.nodeRef) props.nodeRef.current = n; }}
        />
    );
}

interface BoxProps extends NodeBaseProps {
    size?: number | [number, number, number];
    color?: ColorRGB;
    castShadow?: boolean;
    receiveShadow?: boolean;
}

export function Box(props: BoxProps) {
    const [w, h, d] = useMemo<[number, number, number]>(() => {
        if (Array.isArray(props.size)) return props.size;
        const s = props.size ?? 1;
        return [s, s, s];
    }, [props.size]);
    return (
        <NodeHost
            {...props}
            name={props.name ?? 'box'}
            setup={(n) => {
                n.addComponent(createBox(w, h, d, {
                    castShadow: props.castShadow,
                    receiveShadow: props.receiveShadow,
                }));
                if (props.color) n.addComponent(new Material({ color: props.color }));
            }}
        />
    );
}

interface SphereProps extends NodeBaseProps {
    radius?: number;
    segments?: number;
    color?: ColorRGB;
    castShadow?: boolean;
    receiveShadow?: boolean;
}

export function Sphere(props: SphereProps) {
    return (
        <NodeHost
            {...props}
            name={props.name ?? 'sphere'}
            setup={(n) => {
                n.addComponent(createSphere(
                    props.radius ?? 0.5,
                    props.segments ?? 16,
                    props.segments ?? 16,
                    { castShadow: props.castShadow, receiveShadow: props.receiveShadow },
                ));
                if (props.color) n.addComponent(new Material({ color: props.color }));
            }}
        />
    );
}

interface PlaneProps extends NodeBaseProps {
    width?: number;
    height?: number;
    color?: ColorRGB;
    receiveShadow?: boolean;
}

export function Plane(props: PlaneProps) {
    return (
        <NodeHost
            {...props}
            name={props.name ?? 'plane'}
            setup={(n) => {
                n.addComponent(createPlane(
                    props.width ?? 1,
                    props.height ?? 1,
                    1,
                    1,
                    { receiveShadow: props.receiveShadow },
                ));
                if (props.color) n.addComponent(new Material({ color: props.color }));
            }}
        />
    );
}

interface PerspectiveCameraProps extends NodeBaseProps {
    fov?: number;
    near?: number;
    far?: number;
    /** If true, mark this as the active scene camera. Currently informational — the renderer picks the first Camera component it finds. */
    active?: boolean;
}

export function PerspectiveCamera(props: PerspectiveCameraProps) {
    return (
        <NodeHost
            {...props}
            name={props.name ?? 'camera'}
            setup={(n) => {
                n.addComponent(new Camera({
                    type: CameraType.Perspective,
                    fov: props.fov ?? 60,
                    aspect: 1,
                    near: props.near ?? 0.1,
                    far: props.far ?? 1000,
                }));
            }}
        />
    );
}

interface AmbientLightProps extends Omit<NodeBaseProps, 'children'> {
    intensity?: number;
    color?: ColorRGB;
}

export function AmbientLight(props: AmbientLightProps) {
    return (
        <NodeHost
            {...props}
            name={props.name ?? 'ambient'}
            setup={(n) => {
                n.addComponent(new Light({
                    type: LightType.Ambient,
                    color: props.color,
                    intensity: props.intensity ?? 1,
                }));
            }}
        />
    );
}

interface DirectionalLightProps extends Omit<NodeBaseProps, 'children'> {
    intensity?: number;
    color?: ColorRGB;
    castShadow?: boolean;
}

export function DirectionalLight(props: DirectionalLightProps) {
    return (
        <NodeHost
            {...props}
            name={props.name ?? 'directional'}
            setup={(n) => {
                n.addComponent(new Light({
                    type: LightType.Directional,
                    color: props.color,
                    intensity: props.intensity ?? 1,
                    castShadow: props.castShadow,
                }));
            }}
        />
    );
}

/** Bridge for app code that wants to forward a ref to the underlying Oroya node. */
export function useNodeRef() {
    return useRef<OroyaNode | null>(null);
}
