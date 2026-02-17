import { Quat, Vec3 } from '../components/Transform';
import { Matrix4 } from './Matrix4';
import * as Vector3 from './Vector3';

export function createQuat(x: number = 0, y: number = 0, z: number = 0, w: number = 1): Quat {
    return { x, y, z, w };
}

export function setFromAxisAngle(axis: Vec3, angle: number): Quat {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized
    const halfAngle = angle / 2,
        s = Math.sin(halfAngle);

    return {
        x: axis.x * s,
        y: axis.y * s,
        z: axis.z * s,
        w: Math.cos(halfAngle),
    };
}

export function multiplyQuaternions(a: Quat, b: Quat): Quat {
    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
    const qax = a.x,
        qay = a.y,
        qaz = a.z,
        qaw = a.w;
    const qbx = b.x,
        qby = b.y,
        qbz = b.z,
        qbw = b.w;

    return {
        x: qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
        y: qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
        z: qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
        w: qaw * qbw - qax * qbx - qay * qby - qaz * qbz,
    };
}

export function setFromRotationMatrix(m: Matrix4): Quat {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
    const te = m;
    const m11 = te[0],
        m12 = te[4],
        m13 = te[8],
        m21 = te[1],
        m22 = te[5],
        m23 = te[9],
        m31 = te[2],
        m32 = te[6],
        m33 = te[10];
    const trace = m11 + m22 + m33;

    let x = 0,
        y = 0,
        z = 0,
        w = 0;

    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1.0);
        w = 0.25 / s;
        x = (m32 - m23) * s;
        y = (m13 - m31) * s;
        z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
        const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
        w = (m32 - m23) / s;
        x = 0.25 * s;
        y = (m12 + m21) / s;
        z = (m13 + m31) / s;
    } else if (m22 > m33) {
        const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
        w = (m13 - m31) / s;
        x = (m12 + m21) / s;
        y = 0.25 * s;
        z = (m23 + m32) / s;
    } else {
        const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
        w = (m21 - m12) / s;
        x = (m13 + m31) / s;
        y = (m23 + m32) / s;
        z = 0.25 * s;
    }

    return { x, y, z, w };
}

export function lookAtQuaternion(eye: Vec3, target: Vec3, up: Vec3): Quat {
    let zVec = Vector3.normalize(Vector3.sub(eye, target));

    if (Vector3.lengthSq(zVec) === 0) {
        // eye and target are in the same position
        zVec.z = 1;
    }

    let x = Vector3.cross(up, zVec);

    if (Vector3.lengthSq(x) === 0) {
        // up and z are parallel
        // Check if z is vertical
        if (Math.abs(up.z) === 1) {
            zVec.x += 0.0001;
        } else {
            zVec.z += 0.0001;
        }
        zVec = Vector3.normalize(zVec);
        x = Vector3.cross(up, zVec);
    }

    x = Vector3.normalize(x);
    const y = Vector3.cross(zVec, x);

    const m: Matrix4 = [
        x.x,
        x.y,
        x.z,
        0,
        y.x,
        y.y,
        y.z,
        0,
        zVec.x,
        zVec.y,
        zVec.z,
        0,
        0,
        0,
        0,
        1,
    ];

    return setFromRotationMatrix(m);
}

export function slerp(qa: Quat, qb: Quat, t: number): Quat {
    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/index.htm
    let x = qa.x, y = qa.y, z = qa.z, w = qa.w;
    let cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

    if (cosHalfTheta < 0) {
        w = -qb.w;
        x = -qb.x;
        y = -qb.y;
        z = -qb.z;
        cosHalfTheta = -cosHalfTheta;
    } else {
        w = qb.w;
        x = qb.x;
        y = qb.y;
        z = qb.z;
    }

    if (cosHalfTheta >= 1.0) {
        return { x: qa.x, y: qa.y, z: qa.z, w: qa.w };
    }

    const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    if (Math.abs(sinHalfTheta) < 0.001) {
        return {
            w: 0.5 * (qa.w + w),
            x: 0.5 * (qa.x + x),
            y: 0.5 * (qa.y + y),
            z: 0.5 * (qa.z + z)
        };
    }

    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    return {
        w: (qa.w * ratioA + w * ratioB),
        x: (qa.x * ratioA + x * ratioB),
        y: (qa.y * ratioA + y * ratioB),
        z: (qa.z * ratioA + z * ratioB)
    };
}
