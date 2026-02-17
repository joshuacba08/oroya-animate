import { useState, useCallback } from "react";
import { ExampleCard } from "./ExampleCard";
import { ExampleModal } from "./ExampleModal";
import { EXAMPLES } from "./scenes";

export function ExamplesGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleOpen = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null && prev < EXAMPLES.length - 1 ? prev + 1 : prev
    );
  }, []);

  const selectedExample =
    selectedIndex !== null ? EXAMPLES[selectedIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {EXAMPLES.map((example, i) => (
          <ExampleCard
            key={example.id}
            example={example}
            onClick={() => handleOpen(i)}
          />
        ))}
      </div>

      {selectedExample && selectedIndex !== null && (
        <ExampleModal
          example={selectedExample}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < EXAMPLES.length - 1}
        />
      )}
    </>
  );
}
