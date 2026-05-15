import { describe, expect, it } from 'vitest';
import { ParticleSystem } from '../src/components/ParticleSystem';

describe('ParticleSystem', () => {
  it('applies default definition values when none provided', () => {
    const ps = new ParticleSystem();
    expect(ps.definition.maxParticles).toBe(1000);
    expect(ps.definition.emissionRate).toBe(10);
    expect(ps.definition.speed).toBe(1);
    expect(ps.definition.gravity).toEqual({ x: 0, y: 0, z: 0 });
    expect(ps.particles).toEqual([]);
  });

  it('overrides defaults with provided definition fields', () => {
    const ps = new ParticleSystem({ maxParticles: 50, emissionRate: 20, speed: 5 });
    expect(ps.definition.maxParticles).toBe(50);
    expect(ps.definition.emissionRate).toBe(20);
    expect(ps.definition.speed).toBe(5);
  });

  it('emits particles at the configured rate', () => {
    const ps = new ParticleSystem({ maxParticles: 100, emissionRate: 10 });
    // 10 particles/sec × 1 second = 10 emissions
    ps.onUpdate(1.0);
    // Each tick emits AND decays. Life starts at 2.0s so all 10 stay alive after 1s tick.
    expect(ps.particles.length).toBe(10);
  });

  it('respects maxParticles cap', () => {
    const ps = new ParticleSystem({ maxParticles: 5, emissionRate: 1000 });
    ps.onUpdate(1.0); // would emit 1000 without the cap
    expect(ps.particles.length).toBe(5);
  });

  it('decays particles over time and removes them when life expires', () => {
    // emissionRate=4 → interval=0.25s, so a single 0.5s tick produces 2 emissions
    const ps = new ParticleSystem({ maxParticles: 20, emissionRate: 4 });
    ps.onUpdate(0.5);
    expect(ps.particles.length).toBeGreaterThan(0);

    // Particles start with life=2.0; step past expiration of the first batch.
    ps.onUpdate(3.0);
    // The invariant we care about: every surviving particle still has positive life.
    for (const p of ps.particles) {
      expect(p.life).toBeGreaterThan(0);
    }
  });

  it('integrates gravity into velocity each tick', () => {
    const ps = new ParticleSystem({ maxParticles: 1, emissionRate: 1000, gravity: { x: 0, y: -10, z: 0 } });
    ps.onUpdate(0.01); // emit one particle (rate=1000, so the very first tick is enough)
    expect(ps.particles.length).toBe(1);
    const before = ps.particles[0].velocity.y;
    ps.onUpdate(0.1); // gravity applies: vy -= 10 * 0.1 = -1
    const after = ps.particles[0].velocity.y;
    expect(after).toBeLessThan(before);
  });
});
