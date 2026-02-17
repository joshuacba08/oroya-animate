import { useState, useCallback, useMemo } from "react";
import { ExampleCard, getCategoryLabel } from "./ExampleCard";
import { ExampleModal } from "./ExampleModal";
import { EXAMPLES } from "./scenes";
import type { ExampleDef } from "./ExampleCard";

type CategoryFilter = "all" | "3d" | "svg" | "svjs";

const CATEGORIES: { key: CategoryFilter; icon: string }[] = [
  { key: "all", icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "3d", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { key: "svg", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12z" },
  { key: "svjs", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
];

function getCategoryColor(cat: CategoryFilter): string {
  switch (cat) {
    case "3d": return "from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-400";
    case "svg": return "from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-400";
    case "svjs": return "from-violet-500/20 to-violet-600/10 border-violet-500/40 text-violet-400";
    default: return "from-base-content/10 to-base-content/5 border-base-content/20 text-base-content/70";
  }
}

function getCategoryActiveColor(cat: CategoryFilter): string {
  switch (cat) {
    case "3d": return "from-blue-500/40 to-blue-600/25 border-blue-400/60 text-blue-300 shadow-blue-500/20";
    case "svg": return "from-emerald-500/40 to-emerald-600/25 border-emerald-400/60 text-emerald-300 shadow-emerald-500/20";
    case "svjs": return "from-violet-500/40 to-violet-600/25 border-violet-400/60 text-violet-300 shadow-violet-500/20";
    default: return "from-primary/30 to-primary/15 border-primary/50 text-primary-content shadow-primary/20";
  }
}

export function ExamplesGallery() {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [selectedFilteredIdx, setSelectedFilteredIdx] = useState<number | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: EXAMPLES.length };
    for (const ex of EXAMPLES) {
      counts[ex.category] = (counts[ex.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredExamples = useMemo(() => {
    if (filter === "all") return EXAMPLES;
    return EXAMPLES.filter((ex) => ex.category === filter);
  }, [filter]);

  const handleOpen = useCallback((filteredIndex: number) => {
    setSelectedFilteredIdx(filteredIndex);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedFilteredIdx(null);
  }, []);

  const handlePrev = useCallback(() => {
    setSelectedFilteredIdx((prev) =>
      prev !== null && prev > 0 ? prev - 1 : prev
    );
  }, []);

  const handleNext = useCallback(() => {
    setSelectedFilteredIdx((prev) =>
      prev !== null && prev < filteredExamples.length - 1 ? prev + 1 : prev
    );
  }, [filteredExamples.length]);

  const selectedExample: ExampleDef | null =
    selectedFilteredIdx !== null ? filteredExamples[selectedFilteredIdx] : null;

  return (
    <>
      {/* Category filter bar */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {CATEGORIES.map(({ key, icon }) => {
          const isActive = filter === key;
          const count = categoryCounts[key] || 0;
          const label = key === "all" ? "Todos" : getCategoryLabel(key);
          const colorClasses = isActive
            ? getCategoryActiveColor(key)
            : getCategoryColor(key);

          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`
                group relative flex items-center gap-2.5 px-5 py-2.5
                rounded-full border backdrop-blur-sm
                bg-gradient-to-r transition-all duration-300
                ${colorClasses}
                ${isActive
                  ? "shadow-lg scale-[1.02]"
                  : "hover:scale-[1.03] hover:shadow-md opacity-75 hover:opacity-100"
                }
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d={icon} />
              </svg>

              <span className="font-display font-medium text-sm">
                {label}
              </span>

              <span
                className={`
                  inline-flex items-center justify-center
                  min-w-[1.5rem] h-6 px-1.5
                  rounded-full text-xs font-mono font-semibold
                  transition-colors duration-300
                  ${isActive
                    ? "bg-base-content/15 text-current"
                    : "bg-base-content/8 text-current/60"
                  }
                `}
              >
                {count}
              </span>

              {isActive && (
                <span className="absolute inset-0 rounded-full border border-current/10 animate-pulse pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filtered count indicator */}
      {filter !== "all" && (
        <div className="text-center mb-6">
          <span className="text-sm text-base-content/40">
            Mostrando{" "}
            <span className="font-semibold text-base-content/60">
              {filteredExamples.length}
            </span>{" "}
            {filteredExamples.length === 1 ? "ejemplo" : "ejemplos"} en{" "}
            <span className="font-semibold text-base-content/60">
              {getCategoryLabel(filter)}
            </span>
          </span>
        </div>
      )}

      {/* Examples grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredExamples.map((example, i) => (
          <ExampleCard
            key={example.id}
            example={example}
            onClick={() => handleOpen(i)}
          />
        ))}
      </div>

      {/* Modal */}
      {selectedExample && selectedFilteredIdx !== null && (
        <ExampleModal
          example={selectedExample}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedFilteredIdx > 0}
          hasNext={selectedFilteredIdx < filteredExamples.length - 1}
        />
      )}
    </>
  );
}
