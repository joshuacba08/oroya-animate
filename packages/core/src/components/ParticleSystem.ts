import { Component, ComponentType } from './Component';
import { Vec3 } from './Transform';

export interface Particle {
    position: Vec3;
    velocity: Vec3;
    life: number; // Remaining life in seconds
    maxLife: number;
    color: { r: number; g: number; b: number; a: number };
    size: number;
}

export interface ParticleSystemDef {
    maxParticles?: number;
    emissionRate?: number; // particles per second
    texture?: string; // Path to texture
    startColor?: { r: number; g: number; b: number };
    endColor?: { r: number; g: number; b: number };
    startSize?: number;
    endSize?: number;
    speed?: number;
    gravity?: Vec3;
}

export class ParticleSystem extends Component {
    readonly type = ComponentType.ParticleSystem;

    definition: Required<Omit<ParticleSystemDef, 'texture' | 'startColor' | 'endColor'>> & {
        texture?: string;
        startColor: { r: number; g: number; b: number };
        endColor: { r: number; g: number; b: number };
    };

    particles: Particle[] = [];

    // Runtime state
    private emissionAccumulator = 0;

    constructor(definition: ParticleSystemDef = {}) {
        super();
        this.definition = {
            maxParticles: 1000,
            emissionRate: 10,
            speed: 1,
            gravity: { x: 0, y: 0, z: 0 },
            startSize: 1,
            endSize: 0,
            startColor: { r: 1, g: 1, b: 1 },
            endColor: { r: 1, g: 1, b: 1 },
            ...definition
        };
    }

    onUpdate(dt: number) {
        this.updateParticles(dt);
        this.emitParticles(dt);
    }

    private updateParticles(dt: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                // Remove dead particle
                this.particles.splice(i, 1);
                continue;
            }

            // Physics (Euler integration)
            p.velocity.x += this.definition.gravity.x * dt;
            p.velocity.y += this.definition.gravity.y * dt;
            p.velocity.z += this.definition.gravity.z * dt;

            p.position.x += p.velocity.x * dt;
            p.position.y += p.velocity.y * dt;
            p.position.z += p.velocity.z * dt;

            // Interpolate Size
            const t = 1 - (p.life / p.maxLife); // 0 to 1
            p.size = this.lerp(this.definition.startSize, this.definition.endSize, t);

            // Interpolate Color (Alpha fading logic could go here)
            p.color.r = this.lerp(this.definition.startColor.r, this.definition.endColor.r, t);
            p.color.g = this.lerp(this.definition.startColor.g, this.definition.endColor.g, t);
            p.color.b = this.lerp(this.definition.startColor.b, this.definition.endColor.b, t);
        }
    }

    private emitParticles(dt: number) {
        if (this.particles.length >= this.definition.maxParticles) return;

        const rate = this.definition.emissionRate;
        const interval = 1 / rate;

        this.emissionAccumulator += dt;

        while (this.emissionAccumulator > interval) {
            this.emissionAccumulator -= interval;
            if (this.particles.length < this.definition.maxParticles) {
                this.spawnParticle();
            }
        }
    }

    private spawnParticle() {
        // Random velocity in specific cone or just uncontrolled sphere for now
        const angle = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const speed = this.definition.speed * (0.5 + Math.random() * 0.5); // Variation

        const vx = speed * Math.sin(phi) * Math.cos(angle);
        const vy = speed * Math.sin(phi) * Math.sin(angle);
        const vz = speed * Math.cos(phi);

        const particle: Particle = {
            position: { x: 0, y: 0, z: 0 }, // Local to emitter (handled by renderer usually converting to world? Or verify usage)
            // Actually, points are usually simulated in local space of the system node
            velocity: { x: vx, y: vy, z: vz },
            life: 2.0, // Hardcoded for now, add to def
            maxLife: 2.0,
            color: { ...this.definition.startColor, a: 1 },
            size: this.definition.startSize
        };

        this.particles.push(particle);
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
}
