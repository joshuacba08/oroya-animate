import { ExampleCard } from "./ExampleCard";
import { EXAMPLES } from "./scenes";

export function ExamplesGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {EXAMPLES.map((example) => (
        <ExampleCard key={example.id} example={example} />
      ))}
    </div>
  );
}
