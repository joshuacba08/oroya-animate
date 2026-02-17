import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { TEMPLATES, type PlaygroundTemplate } from "./templates";
import {
  Scene,
  Node,
  createBox,
  createSphere,
  createPath2D,
  createText,
  Geometry,
  GeometryPrimitive,
  CSGOperation,
  Material,
  Camera,
  CameraType,
  Light,
  LightType,
  Interactive,
  Animation,
  AnimationMixer,
  ComponentType,
  type AnimationClip,
  type KeyframeTrack,
  type InterpolationMode,
  type Path2DCommand,
} from "@joroya/core";
import { ThreeRenderer } from "@joroya/renderer-three";
import { renderToSVG, SvJs, Gen } from "@joroya/renderer-svg";
import { renderToCanvas, CanvasRenderer } from "@joroya/renderer-canvas2d";
import { loadGLTF } from "@joroya/loader-gltf";

/** All library symbols available inside user code */
const SCOPE = {
  Scene,
  Node,
  createBox,
  createSphere,
  createPath2D,
  createText,
  Geometry,
  GeometryPrimitive,
  CSGOperation,
  Material,
  Camera,
  CameraType,
  Light,
  LightType,
  Interactive,
  Animation,
  AnimationMixer,
  ComponentType,
  ThreeRenderer,
  renderToSVG,
  SvJs,
  Gen,
  renderToCanvas,
  CanvasRenderer,
  loadGLTF,
  Math,
  console,
  Float32Array,
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  document: undefined as unknown,
  window: undefined as unknown,
};

interface LogEntry {
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: number;
}

const LOG_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
  log: { color: "text-base-content/70", icon: "›", bg: "" },
  info: { color: "text-info", icon: "ℹ", bg: "bg-info/5" },
  warn: { color: "text-warning", icon: "⚠", bg: "bg-warning/5" },
  error: { color: "text-error", icon: "✕", bg: "bg-error/5" },
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("es", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const SHORTCUT_LABEL = IS_MAC ? "⌘↵" : "Ctrl+↵";

export function Playground() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATES[0].id);
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [showPanel, setShowPanel] = useState<"preview" | "editor">("editor");
  const [consoleFilter, setConsoleFilter] = useState<LogEntry["type"] | null>(null);
  const [copied, setCopied] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(160);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void)[]>([]);
  const editorRef = useRef<any>(null);
  const autoRunTimerRef = useRef<number>(0);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll console to bottom on new logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((type: LogEntry["type"], ...args: unknown[]) => {
    const message = args
      .map((a) => {
        if (typeof a === "string") return a;
        try {
          return JSON.stringify(a, null, 2);
        } catch {
          return String(a);
        }
      })
      .join(" ");
    setLogs((prev) => [...prev.slice(-200), { type, message, timestamp: Date.now() }]);
  }, []);

  const cleanup = useCallback(() => {
    for (const fn of cleanupRef.current) {
      try {
        fn();
      } catch {
        /* safe */
      }
    }
    cleanupRef.current = [];

    if (containerRef.current) containerRef.current.innerHTML = "";

    if (canvasRef.current && canvasRef.current.parentElement) {
      const parent = canvasRef.current.parentElement;
      const oldCanvas = canvasRef.current;
      const newCanvas = document.createElement("canvas");
      newCanvas.className = oldCanvas.className;
      newCanvas.style.cssText = oldCanvas.style.cssText;
      parent.replaceChild(newCanvas, oldCanvas);
      (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = newCanvas;
    }
  }, []);

  const runCode = useCallback(() => {
    cleanup();
    setLogs([]);
    setIsRunning(true);
    setHasRun(true);

    if (!previewRef.current || !canvasRef.current || !containerRef.current) {
      addLog("error", "Preview container no encontrado");
      setIsRunning(false);
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const rect = previewRef.current.getBoundingClientRect();
    const pad = 16;
    const availW = Math.floor(rect.width) - pad * 2;
    const availH = Math.floor(rect.height) - pad * 2;

    let w = availW;
    let h = availH;

    // Constrain aspect ratio to a balanced viewport (between 4:3 landscape and full width)
    const targetAspect = 4 / 3;
    if (w / h < targetAspect) {
      h = Math.floor(w / targetAspect);
    }

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const onCleanup = (fn: () => void) => {
      cleanupRef.current.push(fn);
    };

    const proxyConsole = {
      log: (...args: unknown[]) => {
        addLog("log", ...args);
        console.log("[Playground]", ...args);
      },
      warn: (...args: unknown[]) => {
        addLog("warn", ...args);
        console.warn("[Playground]", ...args);
      },
      error: (...args: unknown[]) => {
        addLog("error", ...args);
        console.error("[Playground]", ...args);
      },
      info: (...args: unknown[]) => {
        addLog("info", ...args);
        console.info("[Playground]", ...args);
      },
    };

    const scope = { ...SCOPE, canvas, container, onCleanup, console: proxyConsole };
    const scopeKeys = Object.keys(scope);
    const scopeValues = Object.values(scope);

    try {
      const fn = new Function(...scopeKeys, code);
      fn(...scopeValues);
      addLog("info", "✓ Ejecutado correctamente");
    } catch (err: any) {
      addLog("error", err.message || String(err));
    }

    setIsRunning(false);
  }, [code, cleanup, addLog]);

  // Keyboard shortcut: Ctrl/Cmd + Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runCode]);

  const handleTemplateChange = useCallback(
    (templateId: string) => {
      const tmpl = TEMPLATES.find((t) => t.id === templateId);
      if (!tmpl) return;
      cleanup();
      setSelectedTemplate(templateId);
      setCode(tmpl.code);
      setLogs([]);
      setHasRun(false);
    },
    [cleanup],
  );

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
  }, []);

  // Auto-run with debounce
  useEffect(() => {
    if (!autoRun) return;
    if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    autoRunTimerRef.current = window.setTimeout(() => {
      runCode();
    }, 1000);
    return () => {
      if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    };
  }, [code, autoRun, runCode]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Copy code to clipboard
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [code]);

  // Reset to original template code
  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);
  const isModified = code !== (currentTemplate?.code ?? "");

  const resetTemplate = useCallback(() => {
    const tmpl = TEMPLATES.find((t) => t.id === selectedTemplate);
    if (tmpl) {
      cleanup();
      setCode(tmpl.code);
      setLogs([]);
      setHasRun(false);
    }
  }, [selectedTemplate, cleanup]);

  // Filtered logs & counts
  const filteredLogs = useMemo(() => {
    if (!consoleFilter) return logs;
    return logs.filter((l) => l.type === consoleFilter);
  }, [logs, consoleFilter]);

  const logCounts = useMemo(() => {
    const c = { log: 0, info: 0, warn: 0, error: 0 };
    for (const l of logs) c[l.type]++;
    return c;
  }, [logs]);

  // Console vertical resize
  const startConsoleResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = consoleHeight;

      const onMove = (ev: MouseEvent) => {
        setConsoleHeight(Math.max(60, Math.min(500, startH + (startY - ev.clientY))));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [consoleHeight],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-base-100">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-base-300/50 bg-base-200/30 backdrop-blur-sm shrink-0">
        {/* Template selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-base-content/50 uppercase tracking-wider hidden sm:inline">
            Template
          </label>
          <select
            className="select select-sm select-bordered bg-base-100 font-mono text-xs min-w-[180px]"
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.category.toUpperCase()}] {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        {currentTemplate && (
          <span className="text-xs text-base-content/40 hidden md:inline truncate max-w-[300px]">
            {currentTemplate.description}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {/* Reset template button */}
          {isModified && (
            <div className="tooltip tooltip-bottom" data-tip="Restaurar plantilla original">
              <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={resetTemplate}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-base-content/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>
            </div>
          )}

          {/* Copy code button */}
          <div className="tooltip tooltip-bottom" data-tip={copied ? "¡Copiado!" : "Copiar código"}>
            <button className="btn btn-ghost btn-sm btn-square" onClick={copyCode}>
              {copied ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-success"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-base-content/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-base-300/50 mx-0.5 hidden sm:block" />

          {/* Auto-run toggle */}
          <label className="label cursor-pointer gap-1.5 py-0">
            <span className="label-text text-xs text-base-content/50">Auto</span>
            <input
              type="checkbox"
              className="toggle toggle-xs toggle-primary"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
            />
          </label>

          {/* Run button */}
          <div className="tooltip tooltip-bottom" data-tip={SHORTCUT_LABEL}>
            <button
              className="btn btn-primary btn-sm gap-1.5 font-mono"
              onClick={runCode}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Run
            </button>
          </div>

          {/* Mobile panel toggle */}
          <div className="join lg:hidden">
            <button
              className={`join-item btn btn-sm ${showPanel === "editor" ? "btn-active" : ""}`}
              onClick={() => setShowPanel("editor")}
            >
              Code
            </button>
            <button
              className={`join-item btn btn-sm ${showPanel === "preview" ? "btn-active" : ""}`}
              onClick={() => setShowPanel("preview")}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* ── Main area: Editor + Preview ────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Code editor panel */}
        <div
          className={`flex flex-col min-h-0 overflow-hidden border-r border-base-300/50 ${
            showPanel === "editor" ? "flex" : "hidden"
          } lg:flex ${isPreviewFullscreen ? "lg:hidden" : "lg:w-1/2"} w-full`}
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              onChange={(val) => setCode(val ?? "")}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 12 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                bracketPairColorization: { enabled: true },
                renderLineHighlight: "gutter",
              }}
            />
          </div>

          {/* ── Console ──────────────────────────────────────── */}
          <div
            className="border-t border-base-300/50 bg-base-300/20 flex flex-col shrink-0"
            style={{ height: consoleHeight }}
          >
            {/* Drag handle for resizing */}
            <div
              className="h-1.5 cursor-row-resize hover:bg-primary/20 active:bg-primary/30 transition-colors group flex items-center justify-center shrink-0"
              onMouseDown={startConsoleResize}
            >
              <div className="w-8 h-0.5 rounded-full bg-base-content/10 group-hover:bg-primary/40 transition-colors" />
            </div>

            {/* Console header */}
            <div className="flex items-center justify-between px-3 py-1 border-b border-base-300/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-base-content/40 uppercase tracking-wider flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" x2="20" y1="19" y2="19" />
                  </svg>
                  Console
                </span>

                {/* Filter buttons */}
                <div className="flex items-center gap-0.5">
                  <button
                    className={`btn btn-ghost btn-xs px-1.5 h-5 min-h-5 text-[10px] ${!consoleFilter ? "btn-active" : ""}`}
                    onClick={() => setConsoleFilter(null)}
                  >
                    Todo
                    {logs.length > 0 && (
                      <span className="ml-0.5 opacity-50">{logs.length}</span>
                    )}
                  </button>
                  {logCounts.error > 0 && (
                    <button
                      className={`btn btn-ghost btn-xs px-1.5 h-5 min-h-5 text-[10px] text-error ${consoleFilter === "error" ? "btn-active" : ""}`}
                      onClick={() =>
                        setConsoleFilter(consoleFilter === "error" ? null : "error")
                      }
                    >
                      Errores
                      <span className="badge badge-error badge-xs text-[9px] ml-0.5">
                        {logCounts.error}
                      </span>
                    </button>
                  )}
                  {logCounts.warn > 0 && (
                    <button
                      className={`btn btn-ghost btn-xs px-1.5 h-5 min-h-5 text-[10px] text-warning ${consoleFilter === "warn" ? "btn-active" : ""}`}
                      onClick={() =>
                        setConsoleFilter(consoleFilter === "warn" ? null : "warn")
                      }
                    >
                      Warn
                      <span className="badge badge-warning badge-xs text-[9px] ml-0.5">
                        {logCounts.warn}
                      </span>
                    </button>
                  )}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-xs text-base-content/40 hover:text-base-content/70"
                onClick={() => setLogs([])}
              >
                Limpiar
              </button>
            </div>

            {/* Console body */}
            <div className="flex-1 overflow-y-auto px-3 py-1.5 font-mono text-xs">
              {filteredLogs.length === 0 && (
                <span className="text-base-content/20 italic">
                  {logs.length === 0
                    ? "Ejecuta el código para ver la salida..."
                    : "Sin resultados para este filtro"}
                </span>
              )}
              {filteredLogs.map((log, i) => {
                const s = LOG_STYLES[log.type] ?? LOG_STYLES.log;
                return (
                  <div
                    key={i}
                    className={`${s.color} ${s.bg} leading-relaxed py-0.5 px-1.5 -mx-1.5 rounded flex items-start gap-2`}
                  >
                    <span className="select-none shrink-0 w-3 text-center opacity-60">
                      {s.icon}
                    </span>
                    <span className="text-base-content/25 shrink-0 select-none text-[10px] leading-5 tabular-nums">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className="break-all whitespace-pre-wrap">{log.message}</span>
                  </div>
                );
              })}
              <div ref={consoleEndRef} />
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-0.5 border-t border-base-300/20 text-[10px] text-base-content/30 font-mono shrink-0">
              <span>
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
              <span className="hidden sm:inline">
                {SHORTCUT_LABEL} ejecutar
              </span>
            </div>
          </div>
        </div>

        {/* ── Preview panel ──────────────────────────────────── */}
        <div
          ref={previewRef}
          className={`relative bg-base-300/20 min-h-0 overflow-hidden ${
            showPanel === "preview" ? "flex" : "hidden"
          } lg:flex ${isPreviewFullscreen ? "lg:w-full" : "lg:w-1/2"} w-full flex-col`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              style={{ display: "block" }}
            />
          </div>
          <div
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center"
          />

          {/* Preview toolbar (top-right corner) */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            <div
              className="tooltip tooltip-left"
              data-tip={isPreviewFullscreen ? "Salir" : "Pantalla completa"}
            >
              <button
                className="btn btn-ghost btn-xs btn-square bg-base-300/50 backdrop-blur-sm hover:bg-base-300/80 border border-base-content/5"
                onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
              >
                {isPreviewFullscreen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Floating hint when not yet run */}
          {!hasRun && !isRunning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-base-content/5 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-base-content/20 animate-pulse"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-base-content/30 text-sm font-medium">
                  Presiona{" "}
                  <kbd className="kbd kbd-xs">{SHORTCUT_LABEL}</kbd> o{" "}
                  <kbd className="kbd kbd-xs">Run</kbd> para ejecutar
                </p>
                <p className="text-base-content/20 text-xs mt-1">
                  o activa <span className="font-semibold">Auto</span> para
                  ejecución en vivo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
