import { Vec3 } from '../components/Transform';

export function createVec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
    return { x, y, z };
}

export function add(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function multiplyScalar(v: Vec3, s: number): Vec3 {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function dot(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vec3, b: Vec3): Vec3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

export function lengthSq(v: Vec3): number {
    return v.x * v.x + v.y * v.y + v.z * v.z;
}

export function length(v: Vec3): number {
    return Math.sqrt(lengthSq(v));
}

export function normalize(v: Vec3): Vec3 {
    const len = length(v);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return multiplyScalar(v, 1 / len);
}

export function distanceTo(a: Vec3, b: Vec3): number {
    return length(sub(a, b));
}

export function copy(v: Vec3): Vec3 {
    return { ...v };
}
