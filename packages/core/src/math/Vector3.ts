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

export function applyMatrix4(v: Vec3, m: readonly number[]): Vec3 {
    const x = v.x, y = v.y, z = v.z;
    const e = m;

    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    return {
        x: (e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
        y: (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
        z: (e[2] * x + e[6] * y + e[10] * z + e[14]) * w
    };
}
