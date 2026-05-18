import { Children, useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type Locale = "en" | "es" | "ja";
type DemoId = "projectile" | "freefall" | "spring" | "pendulum" | "collision" | "orbit";
type PlaybackMode = "moment" | "cycle";

interface PhysicsLearnLabProps {
  locale?: Locale;
}

interface DemoCopy {
  title: string;
  description: string;
  tag: string;
}

interface LabCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  chooseDemo: string;
  controls: string;
  formulas: string;
  readouts: string;
  assumptions: string;
  demos: Record<DemoId, DemoCopy>;
  labels: Record<string, string>;
  statuses: Record<string, string>;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  precision?: number;
  onChange: (value: number) => void;
}

interface MetricProps {
  label: string;
  value: string;
}

interface PlaybackState {
  isPlaying: boolean;
  mode: PlaybackMode;
  setMode: (mode: PlaybackMode) => void;
  toggle: () => void;
  reset: () => void;
}

const DEMO_IDS: DemoId[] = ["projectile", "freefall", "spring", "pendulum", "collision", "orbit"];

const COPY: Record<Locale, LabCopy> = {
  en: {
    eyebrow: "Learn / Physics",
    title: "Physics Lab",
    subtitle:
      "Six formula-driven demos for exploring motion, forces, collisions, and orbital mechanics with live controls.",
    chooseDemo: "Choose a demo",
    controls: "Controls",
    formulas: "Formulas",
    readouts: "Readouts",
    assumptions: "Model notes",
    demos: {
      projectile: {
        title: "Projectile motion",
        description: "Adjust launch speed, angle, gravity, and time to inspect a parabolic trajectory.",
        tag: "Kinematics",
      },
      freefall: {
        title: "Free fall",
        description: "Drop an object from height and watch position, speed, and impact time update together.",
        tag: "Gravity",
      },
      spring: {
        title: "Spring oscillator",
        description: "See how mass, stiffness, and amplitude shape harmonic motion and energy exchange.",
        tag: "Forces",
      },
      pendulum: {
        title: "Simple pendulum",
        description: "Explore the small-angle approximation and how length changes the period.",
        tag: "Oscillation",
      },
      collision: {
        title: "1D collision",
        description: "Compare momentum and kinetic energy before and after a collision.",
        tag: "Momentum",
      },
      orbit: {
        title: "Circular orbit",
        description: "Balance gravity, radius, and tangential speed around a central mass.",
        tag: "Gravity",
      },
    },
    labels: {
      speed: "Launch speed",
      angle: "Angle",
      gravity: "Gravity",
      time: "Time",
      mass: "Mass",
      stiffness: "Stiffness",
      amplitude: "Amplitude",
      length: "Length",
      initialAngle: "Initial angle",
      mass1: "Mass A",
      mass2: "Mass B",
      velocity1: "Velocity A",
      velocity2: "Velocity B",
      restitution: "Restitution",
      centralMass: "Central mass",
      radius: "Orbit radius",
      speedFactor: "Speed factor",
      phase: "Phase",
      range: "Range",
      height: "Max height",
      flight: "Flight time",
      current: "Current position",
      period: "Period",
      angularSpeed: "Angular speed",
      springEnergy: "Spring energy",
      kineticEnergy: "Kinetic energy",
      angleNow: "Current angle",
      momentumBefore: "Momentum before",
      momentumAfter: "Momentum after",
      energyBefore: "Energy before",
      energyAfter: "Energy after",
      circularSpeed: "Circular speed",
      escapeSpeed: "Escape speed",
      gravityPull: "Gravity pull",
      orbitStatus: "Orbit state",
      play: "Play",
      pause: "Pause",
      reset: "Reset",
      previewMoment: "Moment",
      previewCycle: "Cycle",
      dropHeight: "Drop height",
      initialVelocity: "Initial speed",
      impact: "Impact time",
      fallDistance: "Fall distance",
      currentHeight: "Current height",
      currentSpeed: "Current speed",
    },
    statuses: {
      stableOrbit: "Near circular",
      slowOrbit: "Sub-circular",
      fastOrbit: "High-energy",
    },
  },
  es: {
    eyebrow: "Learn / Fisica",
    title: "Laboratorio de fisica",
    subtitle:
      "Seis demos con formulas y controles para explorar movimiento, fuerzas, colisiones y mecanica orbital.",
    chooseDemo: "Elige una demo",
    controls: "Controles",
    formulas: "Formulas",
    readouts: "Lecturas",
    assumptions: "Notas del modelo",
    demos: {
      projectile: {
        title: "Tiro parabolico",
        description: "Ajusta velocidad, angulo, gravedad y tiempo para entender la trayectoria.",
        tag: "Cinematica",
      },
      freefall: {
        title: "Caida libre",
        description: "Suelta un objeto desde una altura y observa posicion, velocidad y tiempo de impacto.",
        tag: "Gravedad",
      },
      spring: {
        title: "Oscilador con resorte",
        description: "Observa como masa, rigidez y amplitud cambian el movimiento armonico.",
        tag: "Fuerzas",
      },
      pendulum: {
        title: "Pendulo simple",
        description: "Explora la aproximacion de angulos pequenos y el efecto de la longitud.",
        tag: "Oscilacion",
      },
      collision: {
        title: "Colision 1D",
        description: "Compara momento y energia cinetica antes y despues del choque.",
        tag: "Momento",
      },
      orbit: {
        title: "Orbita circular",
        description: "Balancea gravedad, radio y velocidad tangencial alrededor de una masa central.",
        tag: "Gravedad",
      },
    },
    labels: {
      speed: "Velocidad inicial",
      angle: "Angulo",
      gravity: "Gravedad",
      time: "Tiempo",
      mass: "Masa",
      stiffness: "Rigidez",
      amplitude: "Amplitud",
      length: "Longitud",
      initialAngle: "Angulo inicial",
      mass1: "Masa A",
      mass2: "Masa B",
      velocity1: "Velocidad A",
      velocity2: "Velocidad B",
      restitution: "Restitucion",
      centralMass: "Masa central",
      radius: "Radio orbital",
      speedFactor: "Factor de velocidad",
      phase: "Fase",
      range: "Alcance",
      height: "Altura maxima",
      flight: "Tiempo de vuelo",
      current: "Posicion actual",
      period: "Periodo",
      angularSpeed: "Velocidad angular",
      springEnergy: "Energia del resorte",
      kineticEnergy: "Energia cinetica",
      angleNow: "Angulo actual",
      momentumBefore: "Momento antes",
      momentumAfter: "Momento despues",
      energyBefore: "Energia antes",
      energyAfter: "Energia despues",
      circularSpeed: "Velocidad circular",
      escapeSpeed: "Velocidad escape",
      gravityPull: "Atraccion",
      orbitStatus: "Estado orbital",
      play: "Play",
      pause: "Pausa",
      reset: "Reiniciar",
      previewMoment: "Momento",
      previewCycle: "Ciclo",
      dropHeight: "Altura",
      initialVelocity: "Velocidad inicial",
      impact: "Tiempo impacto",
      fallDistance: "Distancia caida",
      currentHeight: "Altura actual",
      currentSpeed: "Velocidad actual",
    },
    statuses: {
      stableOrbit: "Casi circular",
      slowOrbit: "Sub-circular",
      fastOrbit: "Alta energia",
    },
  },
  ja: {
    eyebrow: "Learn / Physics",
    title: "Physics Lab",
    subtitle:
      "運動、力、衝突、軌道をライブ操作で学べる6つの物理デモです。",
    chooseDemo: "デモを選択",
    controls: "Controls",
    formulas: "Formulas",
    readouts: "Readouts",
    assumptions: "Model notes",
    demos: {
      projectile: {
        title: "Projectile motion",
        description: "速度、角度、重力、時間を変えて放物運動を確認します。",
        tag: "Kinematics",
      },
      freefall: {
        title: "Free fall",
        description: "高さから落下する物体の位置、速度、衝突時間を確認します。",
        tag: "Gravity",
      },
      spring: {
        title: "Spring oscillator",
        description: "質量、ばね定数、振幅が単振動をどう変えるか見ます。",
        tag: "Forces",
      },
      pendulum: {
        title: "Simple pendulum",
        description: "小角近似と長さによる周期の変化を確認します。",
        tag: "Oscillation",
      },
      collision: {
        title: "1D collision",
        description: "衝突前後の運動量と運動エネルギーを比較します。",
        tag: "Momentum",
      },
      orbit: {
        title: "Circular orbit",
        description: "中心質量、半径、接線速度のバランスを調整します。",
        tag: "Gravity",
      },
    },
    labels: {
      speed: "Launch speed",
      angle: "Angle",
      gravity: "Gravity",
      time: "Time",
      mass: "Mass",
      stiffness: "Stiffness",
      amplitude: "Amplitude",
      length: "Length",
      initialAngle: "Initial angle",
      mass1: "Mass A",
      mass2: "Mass B",
      velocity1: "Velocity A",
      velocity2: "Velocity B",
      restitution: "Restitution",
      centralMass: "Central mass",
      radius: "Orbit radius",
      speedFactor: "Speed factor",
      phase: "Phase",
      range: "Range",
      height: "Max height",
      flight: "Flight time",
      current: "Current position",
      period: "Period",
      angularSpeed: "Angular speed",
      springEnergy: "Spring energy",
      kineticEnergy: "Kinetic energy",
      angleNow: "Current angle",
      momentumBefore: "Momentum before",
      momentumAfter: "Momentum after",
      energyBefore: "Energy before",
      energyAfter: "Energy after",
      circularSpeed: "Circular speed",
      escapeSpeed: "Escape speed",
      gravityPull: "Gravity pull",
      orbitStatus: "Orbit state",
      play: "Play",
      pause: "Pause",
      reset: "Reset",
      previewMoment: "Moment",
      previewCycle: "Cycle",
      dropHeight: "Drop height",
      initialVelocity: "Initial speed",
      impact: "Impact time",
      fallDistance: "Fall distance",
      currentHeight: "Current height",
      currentSpeed: "Current speed",
    },
    statuses: {
      stableOrbit: "Near circular",
      slowOrbit: "Sub-circular",
      fastOrbit: "High-energy",
    },
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function format(value: number, precision = 2): string {
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function sliderValue(value: string, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : min;
}

function usePlayback({
  value,
  setValue,
  min,
  max,
  duration = 4,
}: {
  value: number;
  setValue: Dispatch<SetStateAction<number>>;
  min: number;
  max: number;
  duration?: number;
}): PlaybackState {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<PlaybackMode>("moment");
  const valueRef = useRef(value);
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!isPlaying) {
      lastFrameRef.current = null;
      return;
    }

    let frame = 0;
    const range = Math.max(max - min, 0.0001);
    const unitsPerSecond = range / duration;

    const tick = (now: number) => {
      const lastFrame = lastFrameRef.current ?? now;
      const dt = (now - lastFrame) / 1000;
      lastFrameRef.current = now;

      let next = valueRef.current + dt * unitsPerSecond;
      if (next >= max) {
        if (mode === "cycle") {
          next = min + ((next - min) % range);
        } else {
          next = max;
          setIsPlaying(false);
        }
      }

      valueRef.current = next;
      setValue(next);
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, isPlaying, max, min, mode, setValue]);

  return {
    isPlaying,
    mode,
    setMode,
    toggle: () => setIsPlaying((current) => !current),
    reset: () => {
      setIsPlaying(false);
      valueRef.current = min;
      setValue(min);
    },
  };
}

function Slider({ label, value, min, max, step, unit, precision = 2, onChange }: SliderProps) {
  const handleChange = (next: string) => onChange(sliderValue(next, min, max));
  const shownValue = `${format(value, precision)}${unit ? ` ${unit}` : ""}`;

  return (
    <label className="block rounded-lg border border-base-300/60 bg-base-100/70 p-3">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-base-content/80">{label}</span>
        <span className="shrink-0 rounded-md bg-base-200 px-2 py-1 font-mono text-xs text-base-content/70">
          {shownValue}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <input
          className="range range-primary range-xs min-w-0 flex-1"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => handleChange(event.currentTarget.value)}
        />
        <input
          className="input input-bordered input-xs w-20 shrink-0 font-mono"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => handleChange(event.currentTarget.value)}
          aria-label={label}
        />
      </span>
    </label>
  );
}

function PlaybackControls({ copy, playback }: { copy: LabCopy; playback: PlaybackState }) {
  return (
    <div className="rounded-lg border border-base-300/60 bg-base-100/70 p-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm gap-2" onClick={playback.toggle}>
          {playback.isPlaying ? (
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {playback.isPlaying ? copy.labels.pause : copy.labels.play}
        </button>
        <button type="button" className="btn btn-outline btn-sm gap-2" onClick={playback.reset}>
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v6h6" />
          </svg>
          {copy.labels.reset}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["moment", "cycle"] as PlaybackMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            className={[
              "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              playback.mode === mode
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-base-300/60 bg-base-200/40 text-base-content/65 hover:bg-base-200",
            ].join(" ")}
            onClick={() => playback.setMode(mode)}
            aria-pressed={playback.mode === mode}
          >
            {mode === "moment" ? copy.labels.previewMoment : copy.labels.previewCycle}
          </button>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-base-300/60 bg-base-100/80 p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-base-content/60">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-base-300/50 bg-base-200/40 p-3">
      <dt className="text-xs uppercase tracking-wide text-base-content/50">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-semibold text-base-content">{value}</dd>
    </div>
  );
}

function MetricGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-3">{children}</dl>;
}

function FormulaList({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <code
          key={line}
          className="block overflow-x-auto rounded-md bg-base-200 px-3 py-2 font-mono text-xs text-base-content/75"
        >
          {line}
        </code>
      ))}
    </div>
  );
}

function VisualFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-base-300/70 bg-base-100/80 p-3">
      <div className="renderer-preview aspect-[16/10] overflow-hidden rounded-lg border border-white/10">
        {children}
      </div>
    </div>
  );
}

function ProjectileDemo({ copy }: { copy: LabCopy }) {
  const [speed, setSpeed] = useState(32);
  const [angle, setAngle] = useState(42);
  const [gravity, setGravity] = useState(9.8);
  const [timePercent, setTimePercent] = useState(58);
  const playback = usePlayback({ value: timePercent, setValue: setTimePercent, min: 0, max: 100, duration: 4.5 });

  const theta = radians(angle);
  const vx = speed * Math.cos(theta);
  const vy0 = speed * Math.sin(theta);
  const flightTime = (2 * vy0) / gravity;
  const range = vx * flightTime;
  const maxHeight = (vy0 * vy0) / (2 * gravity);
  const time = (timePercent / 100) * flightTime;
  const currentX = vx * time;
  const currentY = Math.max(0, vy0 * time - 0.5 * gravity * time * time);
  const currentVy = vy0 - gravity * time;

  const width = 760;
  const height = 420;
  const margin = 58;
  const baseline = height - margin;
  const top = 42;
  const plotWidth = width - margin * 2;
  const plotHeight = baseline - top;
  const maxRangeAtCurrentEnergy = (speed * speed) / gravity;
  const maxHeightAtCurrentEnergy = (speed * speed) / (2 * gravity);
  const unitsPerPixel = Math.max(
    maxRangeAtCurrentEnergy / Math.max(plotWidth, 1),
    maxHeightAtCurrentEnergy / Math.max(plotHeight, 1),
    0.01,
  );
  const scale = 1 / unitsPerPixel;
  const point = (x: number, y: number) => ({
    x: margin + x * scale,
    y: baseline - y * scale,
  });
  const trajectory = Array.from({ length: 74 }, (_, index) => {
    const t = (index / 73) * flightTime;
    const x = vx * t;
    const y = Math.max(0, vy0 * t - 0.5 * gravity * t * t);
    const p = point(x, y);
    return `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(" ");
  const current = point(currentX, currentY);
  const launch = point(0, 0);
  const land = point(range, 0);
  const velocityScale = 2.1;
  const velocityEnd = {
    x: current.x + vx * velocityScale,
    y: current.y - currentVy * velocityScale,
  };

  return (
    <DemoShell copy={copy} active="projectile">
      <VisualFrame>
        <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={copy.demos.projectile.title}>
          <defs>
            <marker id="projectile-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#22d3ee" />
            </marker>
            <linearGradient id="projectile-ground" x1="0" x2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <g stroke="#94a3b8" strokeOpacity="0.22" strokeWidth="1">
            {Array.from({ length: 8 }, (_, index) => (
              <line key={`v-${index}`} x1={margin + index * (plotWidth / 7)} x2={margin + index * (plotWidth / 7)} y1={top} y2={baseline} />
            ))}
            {Array.from({ length: 5 }, (_, index) => (
              <line key={`h-${index}`} x1={margin} x2={width - margin} y1={top + index * (plotHeight / 4)} y2={top + index * (plotHeight / 4)} />
            ))}
          </g>
          <line x1={margin} x2={width - margin} y1={baseline} y2={baseline} stroke="url(#projectile-ground)" strokeWidth="4" strokeLinecap="round" />
          <line x1={margin} x2={margin} y1={top} y2={baseline} stroke="#94a3b8" strokeOpacity="0.5" strokeWidth="2" />
          <path d={trajectory} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <path d={trajectory} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="8 10" strokeLinecap="round" opacity="0.65" />
          <circle cx={launch.x} cy={launch.y} r="8" fill="#22c55e" />
          <circle cx={land.x} cy={land.y} r="8" fill="#f59e0b" />
          <line x1={current.x} y1={current.y} x2={velocityEnd.x} y2={velocityEnd.y} stroke="#22d3ee" strokeWidth="3" markerEnd="url(#projectile-arrow)" />
          <line x1={current.x + 26} y1={current.y - 12} x2={current.x + 26} y2={current.y + 50} stroke="#fb7185" strokeWidth="3" markerEnd="url(#projectile-arrow)" opacity="0.85" />
          <circle cx={current.x} cy={current.y} r="14" fill="#f8fafc" stroke="#38bdf8" strokeWidth="4" />
          <text x={current.x + 36} y={current.y - 18} fill="#e2e8f0" fontSize="13" fontFamily="monospace">
            t={format(time, 2)}s
          </text>
        </svg>
      </VisualFrame>
      <SideStack>
        <Panel title={copy.controls}>
          <div className="space-y-3">
            <PlaybackControls copy={copy} playback={playback} />
            <Slider label={copy.labels.speed} value={speed} min={8} max={55} step={1} unit="m/s" onChange={setSpeed} precision={0} />
            <Slider label={copy.labels.angle} value={angle} min={10} max={80} step={1} unit="deg" onChange={setAngle} precision={0} />
            <Slider label={copy.labels.gravity} value={gravity} min={1.6} max={24} step={0.1} unit="m/s2" onChange={setGravity} />
            <Slider label={copy.labels.time} value={timePercent} min={0} max={100} step={1} unit="%" onChange={setTimePercent} precision={0} />
          </div>
        </Panel>
        <Panel title={copy.readouts}>
          <MetricGrid>
            <Metric label={copy.labels.range} value={`${format(range)} m`} />
            <Metric label={copy.labels.height} value={`${format(maxHeight)} m`} />
            <Metric label={copy.labels.flight} value={`${format(flightTime)} s`} />
            <Metric label={copy.labels.current} value={`${format(currentX)}, ${format(currentY)} m`} />
          </MetricGrid>
        </Panel>
        <Panel title={copy.formulas}>
          <FormulaList lines={["x(t) = v0 cos(theta) t", "y(t) = v0 sin(theta) t - 1/2 g t^2", "R = v0^2 sin(2 theta) / g", "H = (v0 sin(theta))^2 / 2g"]} />
        </Panel>
      </SideStack>
    </DemoShell>
  );
}

function FreeFallDemo({ copy }: { copy: LabCopy }) {
  const [dropHeight, setDropHeight] = useState(80);
  const [initialVelocity, setInitialVelocity] = useState(0);
  const [gravity, setGravity] = useState(9.8);
  const [timePercent, setTimePercent] = useState(45);
  const playback = usePlayback({ value: timePercent, setValue: setTimePercent, min: 0, max: 100, duration: 3.8 });

  const impactTime = (-initialVelocity + Math.sqrt(initialVelocity * initialVelocity + 2 * gravity * dropHeight)) / gravity;
  const time = (timePercent / 100) * impactTime;
  const fallDistance = Math.min(dropHeight, initialVelocity * time + 0.5 * gravity * time * time);
  const currentHeight = Math.max(0, dropHeight - fallDistance);
  const currentSpeed = initialVelocity + gravity * time;

  const width = 760;
  const height = 420;
  const groundY = 346;
  const topY = 60;
  const rulerHeight = groundY - topY;
  const scale = rulerHeight / Math.max(dropHeight, 1);
  const ballY = groundY - currentHeight * scale;
  const startY = groundY - dropHeight * scale;
  const fallPath = Array.from({ length: 70 }, (_, index) => {
    const t = (index / 69) * impactTime;
    const distance = Math.min(dropHeight, initialVelocity * t + 0.5 * gravity * t * t);
    const y = groundY - (dropHeight - distance) * scale;
    const x = 380 + Math.sin(index * 0.16) * 16;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  return (
    <DemoShell copy={copy} active="freefall">
      <VisualFrame>
        <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={copy.demos.freefall.title}>
          <defs>
            <marker id="fall-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#fb7185" />
            </marker>
            <radialGradient id="fall-ball" cx="35%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </radialGradient>
          </defs>
          <g stroke="#94a3b8" strokeOpacity="0.18" strokeWidth="1">
            {Array.from({ length: 6 }, (_, index) => {
              const y = topY + index * (rulerHeight / 5);
              return <line key={index} x1="168" x2="594" y1={y} y2={y} />;
            })}
          </g>
          <line x1="178" x2="178" y1={topY} y2={groundY} stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <line x1="126" x2="634" y1={groundY} y2={groundY} stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
          <path d={fallPath} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
          <line x1="250" x2="590" y1={startY} y2={startY} stroke="#fbbf24" strokeDasharray="7 9" strokeWidth="2" opacity="0.75" />
          <line x1="454" y1={ballY - 18} x2="454" y2={ballY + 58} stroke="#fb7185" strokeWidth="4" markerEnd="url(#fall-arrow)" />
          <circle cx="380" cy={ballY} r="24" fill="url(#fall-ball)" stroke="#e0f2fe" strokeWidth="5" />
          <text x="204" y={startY - 10} fill="#fbbf24" fontSize="13" fontFamily="monospace">
            h0={format(dropHeight, 1)}m
          </text>
          <text x="472" y={ballY - 24} fill="#cbd5e1" fontSize="13" fontFamily="monospace">
            t={format(time, 2)}s
          </text>
        </svg>
      </VisualFrame>
      <SideStack>
        <Panel title={copy.controls}>
          <div className="space-y-3">
            <PlaybackControls copy={copy} playback={playback} />
            <Slider label={copy.labels.dropHeight} value={dropHeight} min={8} max={180} step={1} unit="m" onChange={setDropHeight} precision={0} />
            <Slider label={copy.labels.initialVelocity} value={initialVelocity} min={0} max={30} step={0.5} unit="m/s" onChange={setInitialVelocity} />
            <Slider label={copy.labels.gravity} value={gravity} min={1.6} max={24} step={0.1} unit="m/s2" onChange={setGravity} />
            <Slider label={copy.labels.time} value={timePercent} min={0} max={100} step={1} unit="%" onChange={setTimePercent} precision={0} />
          </div>
        </Panel>
        <Panel title={copy.readouts}>
          <MetricGrid>
            <Metric label={copy.labels.impact} value={`${format(impactTime)} s`} />
            <Metric label={copy.labels.fallDistance} value={`${format(fallDistance)} m`} />
            <Metric label={copy.labels.currentHeight} value={`${format(currentHeight)} m`} />
            <Metric label={copy.labels.currentSpeed} value={`${format(currentSpeed)} m/s`} />
          </MetricGrid>
        </Panel>
        <Panel title={copy.formulas}>
          <FormulaList lines={["d(t) = v0 t + 1/2 g t^2", "h(t) = h0 - d(t)", "v(t) = v0 + gt", "t_impact = (-v0 + sqrt(v0^2 + 2gh0)) / g"]} />
        </Panel>
      </SideStack>
    </DemoShell>
  );
}

function SpringDemo({ copy }: { copy: LabCopy }) {
  const [mass, setMass] = useState(2.5);
  const [stiffness, setStiffness] = useState(36);
  const [amplitude, setAmplitude] = useState(1.25);
  const [time, setTime] = useState(2.4);

  const omega = Math.sqrt(stiffness / mass);
  const period = (2 * Math.PI) / omega;
  const playback = usePlayback({ value: time, setValue: setTime, min: 0, max: period, duration: 4 });
  const position = amplitude * Math.cos(omega * time);
  const velocity = -amplitude * omega * Math.sin(omega * time);
  const springEnergy = 0.5 * stiffness * position * position;
  const kineticEnergy = 0.5 * mass * velocity * velocity;

  const width = 760;
  const height = 420;
  const wallX = 86;
  const baseY = 190;
  const restX = 410;
  const massWidth = 96;
  const positionPx = position * 70;
  const massX = restX + positionPx;
  const springStart = wallX + 22;
  const springEnd = massX - massWidth / 2 - 12;
  const springPath = buildSpringPath(springStart, springEnd, baseY, 13, 18);
  const graphPoints = Array.from({ length: 90 }, (_, index) => {
    const t = (index / 89) * 6;
    const x = amplitude * Math.cos(omega * t);
    const px = 78 + index * 6.5;
    const py = 330 - x * 34;
    return `${px.toFixed(2)},${py.toFixed(2)}`;
  }).join(" ");

  useEffect(() => {
    if (time > period) setTime(period);
  }, [period, time]);

  return (
    <DemoShell copy={copy} active="spring">
      <VisualFrame>
        <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={copy.demos.spring.title}>
          <defs>
            <marker id="spring-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#34d399" />
            </marker>
          </defs>
          <rect x={wallX - 14} y="86" width="16" height="148" rx="4" fill="#64748b" opacity="0.85" />
          <g stroke="#94a3b8" strokeOpacity="0.18" strokeWidth="1">
            {Array.from({ length: 9 }, (_, index) => (
              <line key={index} x1={88 + index * 72} x2={88 + index * 72} y1="276" y2="372" />
            ))}
          </g>
          <line x1="72" x2="688" y1="330" y2="330" stroke="#94a3b8" strokeOpacity="0.45" strokeWidth="2" />
          <polyline points={graphPoints} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <path d={springPath} fill="none" stroke="#34d399" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          <line x1={restX} x2={restX} y1="112" y2="246" stroke="#fbbf24" strokeDasharray="6 8" strokeWidth="2" opacity="0.8" />
          <rect x={massX - massWidth / 2} y="145" width={massWidth} height="90" rx="8" fill="#f8fafc" stroke="#34d399" strokeWidth="5" />
          <text x={massX} y="197" fill="#0f172a" fontSize="18" fontFamily="monospace" fontWeight="700" textAnchor="middle">
            m
          </text>
          <line x1={massX} y1="254" x2={massX + velocity * 16} y2="254" stroke="#34d399" strokeWidth="3" markerEnd="url(#spring-arrow)" />
          <text x="86" y="306" fill="#cbd5e1" fontSize="12" fontFamily="monospace">
            x(t)
          </text>
        </svg>
      </VisualFrame>
      <SideStack>
        <Panel title={copy.controls}>
          <div className="space-y-3">
            <PlaybackControls copy={copy} playback={playback} />
            <Slider label={copy.labels.mass} value={mass} min={0.5} max={8} step={0.1} unit="kg" onChange={setMass} />
            <Slider label={copy.labels.stiffness} value={stiffness} min={8} max={96} step={1} unit="N/m" onChange={setStiffness} precision={0} />
            <Slider label={copy.labels.amplitude} value={amplitude} min={0.2} max={2} step={0.05} unit="m" onChange={setAmplitude} />
            <Slider label={copy.labels.time} value={time} min={0} max={period} step={0.01} unit="s" onChange={setTime} />
          </div>
        </Panel>
        <Panel title={copy.readouts}>
          <MetricGrid>
            <Metric label={copy.labels.period} value={`${format(period)} s`} />
            <Metric label={copy.labels.angularSpeed} value={`${format(omega)} rad/s`} />
            <Metric label={copy.labels.springEnergy} value={`${format(springEnergy)} J`} />
            <Metric label={copy.labels.kineticEnergy} value={`${format(kineticEnergy)} J`} />
          </MetricGrid>
        </Panel>
        <Panel title={copy.formulas}>
          <FormulaList lines={["omega = sqrt(k / m)", "x(t) = A cos(omega t)", "v(t) = -A omega sin(omega t)", "E = 1/2 kx^2 + 1/2 mv^2"]} />
        </Panel>
      </SideStack>
    </DemoShell>
  );
}

function PendulumDemo({ copy }: { copy: LabCopy }) {
  const [length, setLength] = useState(1.7);
  const [gravity, setGravity] = useState(9.8);
  const [initialAngle, setInitialAngle] = useState(24);
  const [time, setTime] = useState(1.1);

  const theta0 = radians(initialAngle);
  const omega = Math.sqrt(gravity / length);
  const theta = theta0 * Math.cos(omega * time);
  const period = 2 * Math.PI * Math.sqrt(length / gravity);
  const playback = usePlayback({ value: time, setValue: setTime, min: 0, max: period, duration: 4 });
  const lengthPx = 88 + length * 72;
  const width = 760;
  const height = 420;
  const pivot = { x: 380, y: 70 };
  const bob = {
    x: pivot.x + Math.sin(theta) * lengthPx,
    y: pivot.y + Math.cos(theta) * lengthPx,
  };
  const leftArc = {
    x: pivot.x - Math.sin(theta0) * lengthPx,
    y: pivot.y + Math.cos(theta0) * lengthPx,
  };
  const rightArc = {
    x: pivot.x + Math.sin(theta0) * lengthPx,
    y: pivot.y + Math.cos(theta0) * lengthPx,
  };
  const arcPath = `M ${leftArc.x.toFixed(2)} ${leftArc.y.toFixed(2)} A ${lengthPx.toFixed(2)} ${lengthPx.toFixed(2)} 0 0 1 ${rightArc.x.toFixed(2)} ${rightArc.y.toFixed(2)}`;

  useEffect(() => {
    if (time > period) setTime(period);
  }, [period, time]);

  return (
    <DemoShell copy={copy} active="pendulum">
      <VisualFrame>
        <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={copy.demos.pendulum.title}>
          <defs>
            <radialGradient id="pendulum-bob" cx="35%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="100%" stopColor="#f97316" />
            </radialGradient>
          </defs>
          <line x1="210" x2="550" y1="70" y2="70" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
          <circle cx={pivot.x} cy={pivot.y} r="10" fill="#e2e8f0" />
          <line x1={pivot.x} y1={pivot.y} x2={pivot.x} y2={pivot.y + lengthPx + 18} stroke="#94a3b8" strokeDasharray="6 8" strokeWidth="2" opacity="0.45" />
          <path d={arcPath} fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
          <line x1={pivot.x} y1={pivot.y} x2={bob.x} y2={bob.y} stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
          <circle cx={bob.x} cy={bob.y} r="34" fill="url(#pendulum-bob)" stroke="#fed7aa" strokeWidth="5" />
          <path d={`M ${pivot.x} ${pivot.y + 52} A 52 52 0 0 ${theta > 0 ? 1 : 0} ${pivot.x + Math.sin(theta) * 52} ${pivot.y + Math.cos(theta) * 52}`} fill="none" stroke="#38bdf8" strokeWidth="3" />
          <text x={pivot.x + 58} y={pivot.y + 62} fill="#cbd5e1" fontSize="13" fontFamily="monospace">
            theta={format((theta * 180) / Math.PI, 1)}deg
          </text>
        </svg>
      </VisualFrame>
      <SideStack>
        <Panel title={copy.controls}>
          <div className="space-y-3">
            <PlaybackControls copy={copy} playback={playback} />
            <Slider label={copy.labels.length} value={length} min={0.4} max={3} step={0.05} unit="m" onChange={setLength} />
            <Slider label={copy.labels.gravity} value={gravity} min={1.6} max={24} step={0.1} unit="m/s2" onChange={setGravity} />
            <Slider label={copy.labels.initialAngle} value={initialAngle} min={4} max={45} step={1} unit="deg" onChange={setInitialAngle} precision={0} />
            <Slider label={copy.labels.time} value={time} min={0} max={period} step={0.01} unit="s" onChange={setTime} />
          </div>
        </Panel>
        <Panel title={copy.readouts}>
          <MetricGrid>
            <Metric label={copy.labels.period} value={`${format(period)} s`} />
            <Metric label={copy.labels.angularSpeed} value={`${format(omega)} rad/s`} />
            <Metric label={copy.labels.angleNow} value={`${format((theta * 180) / Math.PI, 1)} deg`} />
            <Metric label={copy.labels.gravityPull} value={`${format(gravity / length)} 1/s2`} />
          </MetricGrid>
        </Panel>
        <Panel title={copy.formulas}>
          <FormulaList lines={["omega = sqrt(g / L)", "theta(t) = theta0 cos(omega t)", "T = 2 pi sqrt(L / g)", "valid for small angles"]} />
        </Panel>
      </SideStack>
    </DemoShell>
  );
}

function CollisionDemo({ copy }: { copy: LabCopy }) {
  const [mass1, setMass1] = useState(3);
  const [mass2, setMass2] = useState(5);
  const [velocity1, setVelocity1] = useState(5);
  const [velocity2, setVelocity2] = useState(-1.5);
  const [restitution, setRestitution] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const playback = usePlayback({ value: progress, setValue: setProgress, min: 0, max: 100, duration: 3.6 });

  const totalMass = mass1 + mass2;
  const after1 = (mass1 * velocity1 + mass2 * velocity2 - mass2 * restitution * (velocity1 - velocity2)) / totalMass;
  const after2 = (mass1 * velocity1 + mass2 * velocity2 + mass1 * restitution * (velocity1 - velocity2)) / totalMass;
  const momentumBefore = mass1 * velocity1 + mass2 * velocity2;
  const momentumAfter = mass1 * after1 + mass2 * after2;
  const energyBefore = 0.5 * mass1 * velocity1 * velocity1 + 0.5 * mass2 * velocity2 * velocity2;
  const energyAfter = 0.5 * mass1 * after1 * after1 + 0.5 * mass2 * after2 * after2;
  const radius1 = 20 + mass1 * 3.2;
  const radius2 = 20 + mass2 * 3.2;
  const phase = progress / 100;
  const contactX = 380;
  const contactA = contactX - radius1;
  const contactB = contactX + radius2;
  const startA = 160;
  const startB = 600;
  const afterPhase = Math.max(0, (phase - 0.5) / 0.5);
  const beforePhase = Math.min(1, phase / 0.5);
  const bodyAX = phase < 0.5 ? startA + (contactA - startA) * beforePhase : clamp(contactA + after1 * 34 * afterPhase, 80, 680);
  const bodyBX = phase < 0.5 ? startB + (contactB - startB) * beforePhase : clamp(contactB + after2 * 34 * afterPhase, 80, 680);
  const bodyAVelocity = phase < 0.5 ? velocity1 : after1;
  const bodyBVelocity = phase < 0.5 ? velocity2 : after2;

  return (
    <DemoShell copy={copy} active="collision">
      <VisualFrame>
        <svg className="h-full w-full" viewBox="0 0 760 420" role="img" aria-label={copy.demos.collision.title}>
          <defs>
            <marker id="collision-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#60a5fa" />
            </marker>
            <marker id="collision-rose" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#fb7185" />
            </marker>
          </defs>
          <g stroke="#94a3b8" strokeOpacity="0.18" strokeWidth="1">
            {Array.from({ length: 8 }, (_, index) => (
              <line key={index} x1={104 + index * 80} x2={104 + index * 80} y1="132" y2="302" />
            ))}
          </g>
          <line x1="92" x2="668" y1="230" y2="230" stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="2" />
          <line x1={contactX} x2={contactX} y1="112" y2="318" stroke="#fbbf24" strokeDasharray="8 10" strokeWidth="2" opacity="0.75" />
          <text x={contactX + 14} y="128" fill="#fbbf24" fontFamily="monospace" fontSize="13">
            {copy.labels.impact}
          </text>
          <circle cx={startA} cy="230" r={radius1} fill="#60a5fa" opacity="0.16" />
          <circle cx={startB} cy="230" r={radius2} fill="#fb7185" opacity="0.16" />
          <circle cx={contactA} cy="230" r={radius1} fill="none" stroke="#60a5fa" strokeDasharray="6 8" strokeWidth="2" opacity="0.45" />
          <circle cx={contactB} cy="230" r={radius2} fill="none" stroke="#fb7185" strokeDasharray="6 8" strokeWidth="2" opacity="0.45" />
          <CollisionBody cx={bodyAX} cy={230} r={radius1} fill="#60a5fa" label="A" velocity={bodyAVelocity} marker="collision-blue" />
          <CollisionBody cx={bodyBX} cy={230} r={radius2} fill="#fb7185" label="B" velocity={bodyBVelocity} marker="collision-rose" />
          <text x="92" y="82" fill="#cbd5e1" fontFamily="monospace" fontSize="14">
            p={format(progress, 0)}%
          </text>
        </svg>
      </VisualFrame>
      <SideStack>
        <Panel title={copy.controls}>
          <div className="space-y-3">
            <PlaybackControls copy={copy} playback={playback} />
            <Slider label={copy.labels.mass1} value={mass1} min={0.5} max={8} step={0.1} unit="kg" onChange={setMass1} />
            <Slider label={copy.labels.mass2} value={mass2} min={0.5} max={8} step={0.1} unit="kg" onChange={setMass2} />
            <Slider label={copy.labels.velocity1} value={velocity1} min={-8} max={8} step={0.1} unit="m/s" onChange={setVelocity1} />
            <Slider label={copy.labels.velocity2} value={velocity2} min={-8} max={8} step={0.1} unit="m/s" onChange={setVelocity2} />
            <Slider label={copy.labels.restitution} value={restitution} min={0} max={1} step={0.05} onChange={setRestitution} />
            <Slider label={copy.labels.time} value={progress} min={0} max={100} step={1} unit="%" onChange={setProgress} precision={0} />
          </div>
        </Panel>
        <Panel title={copy.readouts}>
          <MetricGrid>
            <Metric label={copy.labels.momentumBefore} value={`${format(momentumBefore)} kg m/s`} />
            <Metric label={copy.labels.momentumAfter} value={`${format(momentumAfter)} kg m/s`} />
            <Metric label={copy.labels.energyBefore} value={`${format(energyBefore)} J`} />
            <Metric label={copy.labels.energyAfter} value={`${format(energyAfter)} J`} />
          </MetricGrid>
        </Panel>
        <Panel title={copy.formulas}>
          <FormulaList lines={["m1u1 + m2u2 = m1v1 + m2v2", "v2 - v1 = e(u1 - u2)", "K = 1/2 mv^2", "e = 1 elastic, e = 0 inelastic"]} />
        </Panel>
      </SideStack>
    </DemoShell>
  );
}

function OrbitDemo({ copy }: { copy: LabCopy }) {
  const [centralMass, setCentralMass] = useState(10);
  const [radius, setRadius] = useState(10);
  const [speedFactor, setSpeedFactor] = useState(1);
  const [phase, setPhase] = useState(18);
  const playback = usePlayback({ value: phase, setValue: setPhase, min: 0, max: 100, duration: 5 });

  const mu = centralMass * 9;
  const circularSpeed = Math.sqrt(mu / radius);
  const orbitalSpeed = circularSpeed * speedFactor;
  const escapeSpeed = Math.SQRT2 * circularSpeed;
  const gravityPull = mu / (radius * radius);
  const period = 2 * Math.PI * Math.sqrt((radius * radius * radius) / mu);
  const orbitStatus = speedFactor < 0.9 ? "slowOrbit" : speedFactor > 1.25 ? "fastOrbit" : "stableOrbit";
  const angle = (phase / 100) * Math.PI * 2;
  const center = { x: 380, y: 210 };
  const orbitRadius = 52 + radius * 9;
  const satellite = {
    x: center.x + Math.cos(angle) * orbitRadius,
    y: center.y + Math.sin(angle) * orbitRadius,
  };
  const tangent = {
    x: satellite.x - Math.sin(angle) * orbitalSpeed * 11,
    y: satellite.y + Math.cos(angle) * orbitalSpeed * 11,
  };
  const pull = {
    x: satellite.x + (center.x - satellite.x) * 0.24,
    y: satellite.y + (center.y - satellite.y) * 0.24,
  };

  return (
    <DemoShell copy={copy} active="orbit">
      <VisualFrame>
        <svg className="h-full w-full" viewBox="0 0 760 420" role="img" aria-label={copy.demos.orbit.title}>
          <defs>
            <marker id="orbit-cyan" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#22d3ee" />
            </marker>
            <marker id="orbit-rose" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#fb7185" />
            </marker>
            <radialGradient id="central-mass" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
          </defs>
          <circle cx={center.x} cy={center.y} r={orbitRadius} fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="8 10" opacity="0.78" />
          <circle cx={center.x} cy={center.y} r={30 + centralMass * 1.3} fill="url(#central-mass)" stroke="#fef3c7" strokeWidth="4" />
          <line x1={satellite.x} y1={satellite.y} x2={tangent.x} y2={tangent.y} stroke="#22d3ee" strokeWidth="4" markerEnd="url(#orbit-cyan)" />
          <line x1={satellite.x} y1={satellite.y} x2={pull.x} y2={pull.y} stroke="#fb7185" strokeWidth="4" markerEnd="url(#orbit-rose)" />
          <circle cx={satellite.x} cy={satellite.y} r="18" fill="#f8fafc" stroke="#38bdf8" strokeWidth="5" />
          <text x={center.x} y={center.y + 5} fill="#78350f" fontSize="15" fontFamily="monospace" fontWeight="700" textAnchor="middle">
            M
          </text>
          <text x="78" y="76" fill="#cbd5e1" fontSize="13" fontFamily="monospace">
            v={format(orbitalSpeed)} / vc={format(circularSpeed)}
          </text>
        </svg>
      </VisualFrame>
      <SideStack>
        <Panel title={copy.controls}>
          <div className="space-y-3">
            <PlaybackControls copy={copy} playback={playback} />
            <Slider label={copy.labels.centralMass} value={centralMass} min={1} max={20} step={0.5} unit="u" onChange={setCentralMass} />
            <Slider label={copy.labels.radius} value={radius} min={4} max={18} step={0.25} unit="u" onChange={setRadius} />
            <Slider label={copy.labels.speedFactor} value={speedFactor} min={0.45} max={1.6} step={0.01} unit="x" onChange={setSpeedFactor} />
            <Slider label={copy.labels.phase} value={phase} min={0} max={100} step={1} unit="%" onChange={setPhase} precision={0} />
          </div>
        </Panel>
        <Panel title={copy.readouts}>
          <MetricGrid>
            <Metric label={copy.labels.circularSpeed} value={`${format(circularSpeed)} u/s`} />
            <Metric label={copy.labels.escapeSpeed} value={`${format(escapeSpeed)} u/s`} />
            <Metric label={copy.labels.period} value={`${format(period)} s`} />
            <Metric label={copy.labels.orbitStatus} value={copy.statuses[orbitStatus]} />
          </MetricGrid>
        </Panel>
        <Panel title={copy.formulas}>
          <FormulaList lines={["F = G M m / r^2", "v_c = sqrt(mu / r)", "v_escape = sqrt(2 mu / r)", "T = 2 pi sqrt(r^3 / mu)"]} />
        </Panel>
      </SideStack>
    </DemoShell>
  );
}

function DemoShell({ copy, active, children }: { copy: LabCopy; active: DemoId; children: ReactNode }) {
  const demo = copy.demos[active];
  const parts = Children.toArray(children);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-primary">{demo.tag}</p>
            <h2 className="mt-1 text-2xl font-bold font-display text-base-content">{demo.title}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-base-content/65">{demo.description}</p>
        </div>
        {parts[0]}
      </div>
      {parts[1]}
    </div>
  );
}

function SideStack({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function CollisionBody({
  cx,
  cy,
  r,
  fill,
  label,
  velocity,
  marker,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  label: string;
  velocity: number;
  marker: string;
}) {
  const arrowScale = 18;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity="0.92" stroke="#f8fafc" strokeOpacity="0.85" strokeWidth="4" />
      <text x={cx} y={cy + 6} fill="#0f172a" fontSize="19" fontFamily="monospace" fontWeight="800" textAnchor="middle">
        {label}
      </text>
      <line x1={cx} y1={cy + r + 18} x2={cx + velocity * arrowScale} y2={cy + r + 18} stroke={fill} strokeWidth="4" markerEnd={`url(#${marker})`} />
      <text x={cx} y={cy - r - 14} fill="#cbd5e1" fontSize="12" fontFamily="monospace" textAnchor="middle">
        {format(velocity)} m/s
      </text>
    </g>
  );
}

function buildSpringPath(startX: number, endX: number, y: number, coils: number, amplitude: number): string {
  const points = [`M ${startX.toFixed(2)} ${y.toFixed(2)}`];
  const segments = coils * 2;
  for (let index = 1; index < segments; index += 1) {
    const x = startX + ((endX - startX) * index) / segments;
    const dy = index % 2 === 0 ? -amplitude : amplitude;
    points.push(`L ${x.toFixed(2)} ${(y + dy).toFixed(2)}`);
  }
  points.push(`L ${endX.toFixed(2)} ${y.toFixed(2)}`);
  return points.join(" ");
}

export function PhysicsLearnLab({ locale = "en" }: PhysicsLearnLabProps) {
  const copy = COPY[locale] ?? COPY.en;
  const [active, setActive] = useState<DemoId>("projectile");

  return (
    <section className="container mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-base-300/70 bg-base-100/80 px-4 py-1.5 text-sm text-base-content/70 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-success" />
            {copy.eyebrow}
          </div>
          <h1 className="text-4xl font-bold font-display text-base-content md:text-5xl">{copy.title}</h1>
          <p className="mt-4 text-lg leading-8 text-base-content/65">{copy.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-base-300/70 bg-base-100/80 p-3 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <h2 className="px-2 pb-3 text-sm font-semibold uppercase tracking-wide text-base-content/55">{copy.chooseDemo}</h2>
          <div className="grid gap-2">
            {DEMO_IDS.map((id, index) => {
              const demo = copy.demos[id];
              const isActive = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActive(id)}
                  className={[
                    "rounded-lg border p-3 text-left transition-colors",
                    isActive
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-base-300/60 bg-base-100/60 text-base-content/75 hover:border-base-300 hover:bg-base-200/70",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  <span className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-base-200 font-mono text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-md bg-base-200 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-base-content/55">
                      {demo.tag}
                    </span>
                  </span>
                  <span className="block text-sm font-semibold">{demo.title}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-75">{demo.description}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="rounded-lg border border-base-300/70 bg-base-100/70 p-4 shadow-sm md:p-6">
          {active === "projectile" && <ProjectileDemo copy={copy} />}
          {active === "freefall" && <FreeFallDemo copy={copy} />}
          {active === "spring" && <SpringDemo copy={copy} />}
          {active === "pendulum" && <PendulumDemo copy={copy} />}
          {active === "collision" && <CollisionDemo copy={copy} />}
          {active === "orbit" && <OrbitDemo copy={copy} />}
        </div>
      </div>
    </section>
  );
}
