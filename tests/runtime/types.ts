export interface ResourceInfo { nodes: number; geometries: number; textures: number; programs: number; }
export interface RuntimeValidation {
  parity(): { updates: number; svg: string; pixel: number[] };
  cycles(count?: number): ResourceInfo;
  skinned(): Promise<{ position: number; resources: ResourceInfo }>;
  benchmark(): Promise<Record<string, { cpuMedianMs: number; frameMedianMs: number }>>;
  resources(): ResourceInfo;
  frames(): number;
  resize(width: number, height: number): void;
  disposeBindings(): void;
  dispose(): ResourceInfo;
}
declare global { interface Window { validation: RuntimeValidation; } }
