import { Matrix4 } from './Matrix4';
import { BoundingSphere } from './BoundingSphere';
import { Vec3 } from '../components/Transform';

class Plane {
    normal: Vec3 = { x: 1, y: 0, z: 0 };
    constant: number = 0;

    setComponents(x: number, y: number, z: number, w: number): this {
        const inverseNormalLength = 1.0 / Math.sqrt(x * x + y * y + z * z);
        this.normal.x = x * inverseNormalLength;
        this.normal.y = y * inverseNormalLength;
        this.normal.z = z * inverseNormalLength;
        this.constant = w * inverseNormalLength;
        return this;
    }

    distanceToPoint(point: Vec3): number {
        return this.normal.x * point.x + this.normal.y * point.y + this.normal.z * point.z + this.constant;
    }
}

export class Frustum {
    planes: Plane[];

    constructor() {
        this.planes = [
            new Plane(), new Plane(), new Plane(), new Plane(), new Plane(), new Plane()
        ];
    }

    setFromProjectionMatrix(m: Matrix4): this {
        const planes = this.planes;
        const me = m;
        const me0 = me[0], me1 = me[1], me2 = me[2], me3 = me[3];
        const me4 = me[4], me5 = me[5], me6 = me[6], me7 = me[7];
        const me8 = me[8], me9 = me[9], me10 = me[10], me11 = me[11];
        const me12 = me[12], me13 = me[13], me14 = me[14], me15 = me[15];

        planes[0].setComponents(me3 - me0, me7 - me4, me11 - me8, me15 - me12);
        planes[1].setComponents(me3 + me0, me7 + me4, me11 + me8, me15 + me12);
        planes[2].setComponents(me3 + me1, me7 + me5, me11 + me9, me15 + me13);
        planes[3].setComponents(me3 - me1, me7 - me5, me11 - me9, me15 - me13);
        planes[4].setComponents(me3 - me2, me7 - me6, me11 - me10, me15 - me14);
        planes[5].setComponents(me3 + me2, me7 + me6, me11 + me10, me15 + me14);

        return this;
    }

    intersectsSphere(sphere: BoundingSphere): boolean {
        const planes = this.planes;
        const center = sphere.center;
        const negRadius = -sphere.radius;

        for (let i = 0; i < 6; i++) {
            const distance = planes[i].distanceToPoint(center);
            if (distance < negRadius) {
                return false;
            }
        }

        return true;
    }
}
